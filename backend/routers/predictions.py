import os
import csv
import io
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from ml.predictor import predictor

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

# Helper to try to get current user but return None if not authenticated
def get_optional_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[models.User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email:
            return db.query(models.User).filter(models.User.email == email).first()
    except Exception:
        pass
    return None

@router.post("/single", response_model=schemas.PredictionResponse)
def predict_single(
    payload: schemas.PredictionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    try:
        # Run prediction
        res = predictor.predict(
            pclass=payload.pclass,
            sex=payload.sex,
            age=payload.age,
            sibsp=payload.sibsp,
            parch=payload.parch,
            fare=payload.fare,
            embarked=payload.embarked
        )
        
        # Save to database
        db_prediction = models.Prediction(
            pclass=payload.pclass,
            name=payload.name or "Passenger",
            sex=payload.sex,
            age=payload.age,
            sibsp=payload.sibsp,
            parch=payload.parch,
            fare=payload.fare,
            embarked=payload.embarked,
            survived_prob_rf=res["survived_prob_rf"],
            survived_prob_xgb=res["survived_prob_xgb"],
            predicted_survived=res["predicted_survived"],
            explanation=json_dumps(res["explanation"]),
            user_id=current_user.id if current_user else None
        )
        db.add(db_prediction)
        
        # Log activity
        if current_user:
            log = models.ActivityLog(
                action="PREDICTION_SINGLE",
                details=f"Predicted survival: {res['predicted_survived']} (RF: {res['survived_prob_rf']}, XGB: {res['survived_prob_xgb']})",
                user_id=current_user.id
            )
            db.add(log)
            
        db.commit()
        db.refresh(db_prediction)
        
        # Format response
        import json
        explanation_dict = json.loads(db_prediction.explanation)
        
        return schemas.PredictionResponse(
            id=db_prediction.id,
            pclass=db_prediction.pclass,
            name=db_prediction.name,
            sex=db_prediction.sex,
            age=db_prediction.age,
            sibsp=db_prediction.sibsp,
            parch=db_prediction.parch,
            fare=db_prediction.fare,
            embarked=db_prediction.embarked,
            survived_prob_rf=db_prediction.survived_prob_rf,
            survived_prob_xgb=db_prediction.survived_prob_xgb,
            predicted_survived=db_prediction.predicted_survived,
            explanation=explanation_dict,
            created_at=db_prediction.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/batch")
async def predict_batch(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    # Enforce 5MB limit
    MAX_FILE_SIZE = 5 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")

    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_path = os.path.join(uploads_dir, file.filename)
    
    # Save file locally
    with open(file_path, "wb") as buffer:
        buffer.write(contents)
        
    db_file = models.UploadedFile(
        filename=file.filename,
        file_path=file_path,
        status="processing",
        user_id=current_user.id if current_user else None
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    try:
        # Read and validate CSV
        predictions_output = []
        with open(file_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            headers = [h.strip().lower() for h in reader.fieldnames] if reader.fieldnames else []
            
            # Match required fields case-insensitively
            req_fields = ["pclass", "sex", "age", "sibsp", "parch", "fare", "embarked"]
            missing_fields = [f for f in req_fields if f not in headers]
            if missing_fields:
                db_file.status = "failed"
                db.commit()
                raise HTTPException(
                    status_code=400, 
                    detail=f"CSV is missing required headers: {', '.join(missing_fields)}"
                )

            # Map the actual column headers to case-insensitive ones
            header_map = {h.strip().lower(): h.strip() for h in reader.fieldnames}
            
            total_rows = 0
            for row in reader:
                total_rows += 1
                try:
                    # Get values using mapped headers
                    name = row.get(header_map.get("name", "Name"), f"Passenger {total_rows}")
                    pclass = int(row.get(header_map["pclass"]))
                    sex = str(row.get(header_map["sex"])).strip().lower()
                    
                    # Fill missing/invalid numeric fields using predictor defaults or fallback values
                    raw_age = row.get(header_map["age"])
                    age = float(raw_age) if raw_age else 29.7
                    
                    raw_sibsp = row.get(header_map["sibsp"])
                    sibsp = int(raw_sibsp) if raw_sibsp else 0
                    
                    raw_parch = row.get(header_map["parch"])
                    parch = int(raw_parch) if raw_parch else 0
                    
                    raw_fare = row.get(header_map["fare"])
                    fare = float(raw_fare) if raw_fare else 32.2
                    
                    embarked = str(row.get(header_map["embarked"])).strip().upper()
                    if not embarked:
                        embarked = "S"

                    # Run prediction
                    res = predictor.predict(pclass, sex, age, sibsp, parch, fare, embarked)
                    
                    # Save each prediction record
                    pred = models.Prediction(
                        pclass=pclass,
                        name=name,
                        sex=sex,
                        age=age,
                        sibsp=sibsp,
                        parch=parch,
                        fare=fare,
                        embarked=embarked,
                        survived_prob_rf=res["survived_prob_rf"],
                        survived_prob_xgb=res["survived_prob_xgb"],
                        predicted_survived=res["predicted_survived"],
                        explanation=json_dumps(res["explanation"]),
                        user_id=current_user.id if current_user else None
                    )
                    db.add(pred)
                    
                    predictions_output.append({
                        "name": name,
                        "pclass": pclass,
                        "sex": sex,
                        "age": age,
                        "fare": fare,
                        "probability": round((res["survived_prob_rf"] + res["survived_prob_xgb"]) / 2, 4),
                        "survived": res["predicted_survived"]
                    })
                except Exception as row_error:
                    # Log row error but continue batch
                    print(f"Error parsing row {total_rows}: {row_error}")
                    continue
            
            db_file.status = "completed"
            db_file.total_rows = total_rows
            
            if current_user:
                log = models.ActivityLog(
                    action="PREDICTION_BATCH",
                    details=f"Processed batch prediction file '{file.filename}' with {total_rows} rows",
                    user_id=current_user.id
                )
                db.add(log)
                
            db.commit()
            
            return {
                "file_id": db_file.id,
                "status": "completed",
                "total_rows": total_rows,
                "predictions": predictions_output
            }
            
    except HTTPException:
        raise
    except Exception as e:
        db_file.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Batch processing error: {str(e)}")

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    preds = db.query(models.Prediction).filter(models.Prediction.user_id == current_user.id).order_by(models.Prediction.created_at.desc()).limit(100).all()
    
    import json
    output = []
    for p in preds:
        explanation_dict = json.loads(p.explanation) if p.explanation else {}
        output.append(
            schemas.PredictionResponse(
                id=p.id,
                pclass=p.pclass,
                name=p.name,
                sex=p.sex,
                age=p.age,
                sibsp=p.sibsp,
                parch=p.parch,
                fare=p.fare,
                embarked=p.embarked,
                survived_prob_rf=p.survived_prob_rf,
                survived_prob_xgb=p.survived_prob_xgb,
                predicted_survived=p.predicted_survived,
                explanation=explanation_dict,
                created_at=p.created_at
            )
        )
    return output

def json_dumps(data) -> str:
    import json
    return json.dumps(data)
