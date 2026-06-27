from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user") # "admin" or "user"
    language = Column(String, default="en") # "en", "es", "fr"
    theme = Column(String, default="dark") # "dark" or "light"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    uploaded_files = relationship("UploadedFile", back_populates="user", cascade="all, delete-orphan")
    logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    pclass = Column(Integer, nullable=False)
    name = Column(String, nullable=True)
    sex = Column(String, nullable=False)
    age = Column(Float, nullable=True)
    sibsp = Column(Integer, nullable=False)
    parch = Column(Integer, nullable=False)
    fare = Column(Float, nullable=False)
    embarked = Column(String, nullable=False)
    
    survived_prob_rf = Column(Float, nullable=False)
    survived_prob_xgb = Column(Float, nullable=False)
    predicted_survived = Column(Boolean, nullable=False)
    explanation = Column(Text, nullable=True) # JSON stored as string for SHAP values
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="predictions")

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(String, default="processing") # "processing", "completed", "failed"
    total_rows = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="uploaded_files")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False) # e.g. "LOGIN", "PREDICTION", "UPLOAD", "EXPORT"
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    ip_address = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="logs")
