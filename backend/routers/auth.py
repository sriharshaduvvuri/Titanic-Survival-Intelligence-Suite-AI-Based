from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])

def log_activity(db: Session, action: str, details: str, user_id: int):
    try:
        log = models.ActivityLog(
            action=action,
            details=details,
            user_id=user_id
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to log activity '{action}' for user {user_id}: {e}")

@router.post("/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection or query failed: {str(e)}"
        )
    
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        hashed_pw = auth.get_password_hash(user_in.password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password hashing failed: {str(e)}"
        )
    
    try:
        existing_users_count = db.query(models.User).count()
        role = "admin" if existing_users_count == 0 else "user"
        
        new_user = models.User(
            email=user_in.email,
            hashed_password=hashed_pw,
            full_name=user_in.full_name,
            role=role
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User creation failed: {str(e)}"
        )
    
    # Log registration
    log_activity(db, "REGISTER", f"User registered with role: {role}", new_user.id)
    
    try:
        access_token = auth.create_access_token(data={"sub": new_user.email})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token generation failed: {str(e)}"
        )
        
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.email == user_in.email).first()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query failed: {str(e)}"
        )
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        pw_verified = auth.verify_password(user_in.password, user.hashed_password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password verification failed: {str(e)}"
        )
        
    if not pw_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log login
    log_activity(db, "LOGIN", "User logged in", user.id)
    
    try:
        access_token = auth.create_access_token(data={"sub": user.email})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token generation failed: {str(e)}"
        )
        
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/profile", response_model=schemas.UserResponse)
def get_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    profile_in: schemas.ProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.language is not None:
        current_user.language = profile_in.language
    if profile_in.theme is not None:
        current_user.theme = profile_in.theme
    if profile_in.password:
        try:
            current_user.hashed_password = auth.get_password_hash(profile_in.password)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Password hashing failed: {str(e)}"
            )
        
    try:
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )
        
    log_activity(db, "UPDATE_PROFILE", "User updated profile options", current_user.id)
    return current_user

@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            log_activity(db, "FORGOT_PASSWORD", "Reset password request submitted", user.id)
    except Exception as e:
        print(f"Error in forgot-password for email {email}: {e}")
        
    # Always return success message for security/obfuscation
    return {"message": "If this email exists in our records, a password reset link has been dispatched."}

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log_activity(db, "TOKEN_REFRESH", "User refreshed JWT access token", current_user.id)
    try:
        access_token = auth.create_access_token(data={"sub": current_user.email})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token generation failed: {str(e)}"
        )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": current_user
    }
