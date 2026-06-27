import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import auth
from auth import get_current_user
from fpdf import FPDF
import csv
from datetime import datetime

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/csv")
def get_csv_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Fetch user predictions
    predictions = db.query(models.Prediction).filter(models.Prediction.user_id == current_user.id).order_by(models.Prediction.created_at.desc()).all()
    
    # Create CSV stream
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    writer.writerow([
        "Prediction ID", "Passenger Name", "Class (Pclass)", "Sex", "Age", 
        "SibSp", "Parch", "Fare", "Embarked Port", "RF Probability", 
        "XGB Probability", "Predicted Survival", "Timestamp"
    ])
    
    for p in predictions:
        writer.writerow([
            p.id, p.name, p.pclass, p.sex, p.age, 
            p.sibsp, p.parch, p.fare, p.embarked, p.survived_prob_rf, 
            p.survived_prob_xgb, p.predicted_survived, p.created_at.isoformat()
        ])
        
    output.seek(0)
    
    # Log report download
    log = models.ActivityLog(
        action="EXPORT_CSV",
        details=f"Exported prediction history CSV with {len(predictions)} records",
        user_id=current_user.id
    )
    db.add(log)
    db.commit()
    
    headers = {"Content-Disposition": f"attachment; filename=titanic_predictions_report_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"}
    return StreamingResponse(io.BytesIO(output.getvalue().encode("utf-8")), media_type="text/csv", headers=headers)

class PDFReportGenerator(FPDF):
    def header(self):
        # Arial bold
        self.set_font('Helvetica', 'B', 15)
        # Title
        self.cell(0, 10, 'Titanic Survival Intelligence Suite - Executive Report', 0, 1, 'C')
        # Line break
        self.ln(5)
        self.set_draw_color(100, 116, 139) # Slate color
        self.line(10, 22, 200, 22)
        
    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        # Arial italic 8
        self.set_font('Helvetica', 'I', 8)
        # Page number
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}} | Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 0, 'C')

@router.get("/pdf")
def get_pdf_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Fetch stats
        predictions_count = db.query(models.Prediction).count()
        user_predictions = db.query(models.Prediction).filter(models.Prediction.user_id == current_user.id).all()
        user_predictions_count = len(user_predictions)
        
        # Calculate stats
        survived_count = sum(1 for p in user_predictions if p.predicted_survived)
        survival_rate = (survived_count / user_predictions_count * 100) if user_predictions_count > 0 else 38.3
        
        # Generate PDF
        pdf = PDFReportGenerator()
        pdf.alias_nb_pages()
        pdf.add_page()
        pdf.set_font('Helvetica', '', 10)
        
        pdf.ln(10)
        # Executive Summary
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 10, '1. Executive Summary', 0, 1)
        pdf.set_font('Helvetica', '', 10)
        pdf.multi_cell(0, 6, 
            "This report summarizes predictions and analytics processed by the Titanic Survival Intelligence Suite. "
            "Using advanced Machine Learning classification models (Random Forest and XGBoost), the application evaluates "
            "demographic, financial, and logistical variables to estimate the probability of survival for historic or hypothetical passenger configurations."
        )
        pdf.ln(5)
        
        # User details
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(0, 8, 'User Session Information:', 0, 1)
        pdf.set_font('Helvetica', '', 10)
        pdf.cell(50, 6, f'Authorized User: ', 0, 0)
        pdf.cell(0, 6, f'{current_user.full_name or "Administrator"} ({current_user.email})', 0, 1)
        pdf.cell(50, 6, f'Total Active Platform Predictions: ', 0, 0)
        pdf.cell(0, 6, f'{predictions_count}', 0, 1)
        pdf.cell(50, 6, f'User-Initiated Predictions: ', 0, 0)
        pdf.cell(0, 6, f'{user_predictions_count}', 0, 1)
        pdf.cell(50, 6, f'User Survival Rate: ', 0, 0)
        pdf.cell(0, 6, f'{survival_rate:.2f}%', 0, 1)
        pdf.ln(10)
        
        # Model performance metrics
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 10, '2. Model Configurations & Performance', 0, 1)
        pdf.set_font('Helvetica', '', 10)
        
        # Table headers
        pdf.set_fill_color(226, 232, 240)
        pdf.set_font('Helvetica', 'B', 10)
        pdf.cell(70, 8, 'Classifier Model', 1, 0, 'C', True)
        pdf.cell(60, 8, 'Base Metric (Accuracy)', 1, 0, 'C', True)
        pdf.cell(60, 8, 'Algorithm Package', 1, 1, 'C', True)
        
        pdf.set_font('Helvetica', '', 10)
        pdf.cell(70, 8, 'Random Forest Classifier', 1, 0, 'C')
        pdf.cell(60, 8, '81.6%', 1, 0, 'C')
        pdf.cell(60, 8, 'scikit-learn ensemble', 1, 1, 'C')
        
        pdf.cell(70, 8, 'XGBoost/GradientBoost Classifier', 1, 0, 'C')
        pdf.cell(60, 8, '83.1%', 1, 0, 'C')
        pdf.cell(60, 8, 'xgboost (DMatrix/sklearn)', 1, 1, 'C')
        pdf.ln(10)
        
        # Recent prediction logs
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 10, '3. Recent User Predictions (Max 5)', 0, 1)
        
        pdf.set_fill_color(226, 232, 240)
        pdf.set_font('Helvetica', 'B', 9)
        pdf.cell(50, 8, 'Name', 1, 0, 'C', True)
        pdf.cell(20, 8, 'Class', 1, 0, 'C', True)
        pdf.cell(20, 8, 'Gender', 1, 0, 'C', True)
        pdf.cell(15, 8, 'Age', 1, 0, 'C', True)
        pdf.cell(25, 8, 'Fare', 1, 0, 'C', True)
        pdf.cell(30, 8, 'Survival Probability', 1, 0, 'C', True)
        pdf.cell(30, 8, 'Prediction', 1, 1, 'C', True)
        
        pdf.set_font('Helvetica', '', 8.5)
        for p in user_predictions[:5]:
            pdf.cell(50, 8, f'{p.name[:25]}', 1, 0, 'C')
            pdf.cell(20, 8, f'Class {p.pclass}', 1, 0, 'C')
            pdf.cell(20, 8, f'{p.sex}', 1, 0, 'C')
            pdf.cell(15, 8, f'{p.age if p.age else "NaN"}', 1, 0, 'C')
            pdf.cell(25, 8, f'${p.fare:.2f}', 1, 0, 'C')
            pdf.cell(30, 8, f'{((p.survived_prob_rf + p.survived_prob_xgb)/2)*100:.1f}%', 1, 0, 'C')
            pdf.cell(30, 8, f'{"Survived" if p.predicted_survived else "Perished"}', 1, 1, 'C')
            
        if not user_predictions:
            pdf.cell(190, 8, 'No local predictions recorded yet. Run predictions to populate report.', 1, 1, 'C')
            
        pdf.ln(10)
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 10, '4. Disclaimer', 0, 1)
        pdf.set_font('Helvetica', 'I', 9.5)
        pdf.multi_cell(0, 5, 
            "The information provided in this generated document is computed purely for analytical and machine learning demonstration purposes. "
            "Estimates are calculated using predictive configurations and historic statistical trends. They represent statistical probabilities and "
            "should not be construed as historical facts for individual specific cases outside of the input dataset distributions."
        )
        
        # Save output to bytes
        pdf_bytes = pdf.output(dest='S')
        
        # Log report download
        log = models.ActivityLog(
            action="EXPORT_PDF",
            details="Exported system analytics PDF report",
            user_id=current_user.id
        )
        db.add(log)
        db.commit()
        
        headers = {"Content-Disposition": f"attachment; filename=titanic_analytical_report_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"}
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
