from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    language: str
    theme: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    language: Optional[str] = None
    theme: Optional[str] = None
    password: Optional[str] = None

# --- Prediction Schemas ---
class PredictionRequest(BaseModel):
    pclass: int = Field(..., ge=1, le=3, description="Passenger Class (1, 2, or 3)")
    sex: str = Field(..., description="Gender ('male' or 'female')")
    age: float = Field(..., ge=0, le=120, description="Age in years")
    sibsp: int = Field(..., ge=0, description="Number of siblings/spouses aboard")
    parch: int = Field(..., ge=0, description="Number of parents/children aboard")
    fare: float = Field(..., ge=0, description="Passenger fare")
    embarked: str = Field(..., description="Port of Embarkation ('C', 'Q', 'S')")
    name: Optional[str] = "Passenger"

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    pclass: int
    name: Optional[str]
    sex: str
    age: float
    sibsp: int
    parch: int
    fare: float
    embarked: str
    survived_prob_rf: float
    survived_prob_xgb: float
    predicted_survived: bool
    explanation: Dict[str, float] # SHAP values
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Analytics & Reporting Schemas ---
class AnalyticsStats(BaseModel):
    total_predictions: int
    survival_rate: float
    accuracy_score: float
    active_users: int

class SurvivalByGroup(BaseModel):
    category: str
    survived: int
    perished: int
    rate: float

class AnalyticsReport(BaseModel):
    kpis: AnalyticsStats
    gender_analysis: List[SurvivalByGroup]
    class_analysis: List[SurvivalByGroup]
    embarked_analysis: List[SurvivalByGroup]
    age_groups: Dict[str, Dict[str, float]]
    correlation: List[Dict[str, Any]]

# --- Admin & Log Schemas ---
class ActivityLogResponse(BaseModel):
    id: int
    action: str
    details: Optional[str]
    timestamp: datetime
    ip_address: Optional[str]
    user_id: Optional[int]
    user_email: Optional[str] = None

    class Config:
        from_attributes = True

class UploadedFileResponse(BaseModel):
    id: int
    filename: str
    status: str
    total_rows: int
    created_at: datetime

    class Config:
        from_attributes = True

class AdminDashboardStats(BaseModel):
    total_users: int
    total_predictions: int
    total_files: int
    predictions_over_time: List[Dict[str, Any]]
    active_logs: List[ActivityLogResponse]
