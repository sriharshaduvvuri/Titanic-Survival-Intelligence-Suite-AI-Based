import os
import urllib.request
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Attempt to import xgboost, fallback if not available
try:
    from xgboost import XGBClassifier
    XGB_AVAILABLE = True
except ImportError:
    from sklearn.ensemble import GradientBoostingClassifier
    XGB_AVAILABLE = False

DATA_URL = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")

def ensure_directories():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(ARTIFACTS_DIR), "data"), exist_ok=True)

def download_dataset():
    data_path = os.path.join(os.path.dirname(ARTIFACTS_DIR), "data", "titanic.csv")
    if not os.path.exists(data_path):
        print(f"Downloading Titanic dataset from {DATA_URL}...")
        try:
            urllib.request.urlretrieve(DATA_URL, data_path)
            print("Download successful.")
        except Exception as e:
            print(f"Error downloading dataset: {e}. Generating realistic synthetic Titanic data instead.")
            generate_synthetic_data(data_path)
    return data_path

def generate_synthetic_data(path):
    # Fallback synthetic generator if network is offline
    np.random.seed(42)
    n_samples = 891
    pclasses = np.random.choice([1, 2, 3], size=n_samples, p=[0.24, 0.21, 0.55])
    sexes = np.random.choice(["male", "female"], size=n_samples, p=[0.65, 0.35])
    ages = np.random.normal(loc=29.7, scale=14.5, size=n_samples)
    ages = np.clip(ages, 0.42, 80.0)
    # Give children and older ages some NaNs
    nan_mask = np.random.choice([True, False], size=n_samples, p=[0.2, 0.8])
    ages[nan_mask] = np.nan
    
    sibsp = np.random.choice([0, 1, 2, 3, 4, 5, 8], size=n_samples, p=[0.68, 0.23, 0.03, 0.02, 0.02, 0.01, 0.01])
    parch = np.random.choice([0, 1, 2, 3, 4, 5, 6], size=n_samples, p=[0.76, 0.13, 0.09, 0.01, 0.005, 0.003, 0.002])
    
    fares = np.zeros(n_samples)
    fares[pclasses == 1] = np.random.exponential(scale=84, size=sum(pclasses == 1)) + 15
    fares[pclasses == 2] = np.random.exponential(scale=20, size=sum(pclasses == 2)) + 10
    fares[pclasses == 3] = np.random.exponential(scale=13, size=sum(pclasses == 3)) + 4
    
    embarked = np.random.choice(["S", "C", "Q"], size=n_samples, p=[0.72, 0.19, 0.09])
    
    # Simple probability model for survival to make the synthetic dataset realistic
    # female, class 1/2, young, and high fare have higher survival rates
    prob = 0.15
    prob += (sexes == "female") * 0.45
    prob += (pclasses == 1) * 0.25
    prob += (pclasses == 2) * 0.10
    prob += (np.nan_to_num(ages, nan=30) < 12) * 0.20
    prob += (fares > 50) * 0.10
    prob = np.clip(prob, 0.05, 0.95)
    
    survived = np.random.binomial(n=1, p=prob)
    
    df = pd.DataFrame({
        "PassengerId": range(1, n_samples + 1),
        "Survived": survived,
        "Pclass": pclasses,
        "Name": [f"Passenger, Mock {i}" for i in range(1, n_samples + 1)],
        "Sex": sexes,
        "Age": ages,
        "SibSp": sibsp,
        "Parch": parch,
        "Ticket": [f"TKT{i}" for i in range(1, n_samples + 1)],
        "Fare": fares,
        "Cabin": [None] * n_samples,
        "Embarked": embarked
    })
    df.to_csv(path, index=False)
    print(f"Generated synthetic data at {path}")

def train_models():
    ensure_directories()
    data_path = download_dataset()
    
    df = pd.read_csv(data_path)
    
    # Preprocessing
    # Impute missing values and save thresholds
    age_median = float(df["Age"].median())
    fare_median = float(df["Fare"].median())
    embarked_mode = str(df["Embarked"].mode()[0])
    
    df["Age"] = df["Age"].fillna(age_median)
    df["Fare"] = df["Fare"].fillna(fare_median)
    df["Embarked"] = df["Embarked"].fillna(embarked_mode)
    
    # Mapping categorical values
    sex_map = {"male": 0, "female": 1}
    embarked_map = {"S": 0, "C": 1, "Q": 2}
    
    df["Sex_encoded"] = df["Sex"].map(sex_map).fillna(0).astype(int)
    df["Embarked_encoded"] = df["Embarked"].map(embarked_map).fillna(0).astype(int)
    
    features = ["Pclass", "Sex_encoded", "Age", "SibSp", "Parch", "Fare", "Embarked_encoded"]
    X = df[features]
    y = df["Survived"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=7, random_state=42)
    rf.fit(X_train, y_train)
    rf_score = rf.score(X_test, y_test)
    
    # Train XGBoost or Gradient Boosting
    if XGB_AVAILABLE:
        print("Training XGBoost Classifier...")
        xgb = XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
        xgb.fit(X_train, y_train)
        xgb_score = xgb.score(X_test, y_test)
        joblib.dump(xgb, os.path.join(ARTIFACTS_DIR, "model_xgb.joblib"))
    else:
        print("XGBoost not available. Training Scikit-Learn Gradient Boosting fallback...")
        xgb = GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
        xgb.fit(X_train, y_train)
        xgb_score = xgb.score(X_test, y_test)
        joblib.dump(xgb, os.path.join(ARTIFACTS_DIR, "model_xgb.joblib"))
        
    joblib.dump(rf, os.path.join(ARTIFACTS_DIR, "model_rf.joblib"))
    
    # Save training metadata
    meta = {
        "imputation": {
            "age_median": age_median,
            "fare_median": fare_median,
            "embarked_mode": embarked_mode
        },
        "mappings": {
            "sex": sex_map,
            "embarked": embarked_map
        },
        "metrics": {
            "random_forest_accuracy": float(rf_score),
            "xgboost_accuracy": float(xgb_score),
            "overall_accuracy": float(max(rf_score, xgb_score))
        },
        "features": features,
        "feature_importances": {
            "random_forest": [float(x) for x in rf.feature_importances_],
            "xgboost": [float(x) for x in xgb.feature_importances_]
        }
    }
    
    with open(os.path.join(ARTIFACTS_DIR, "metadata.json"), "w") as f:
        json.dump(meta, f, indent=4)
        
    print("Models trained and metadata saved successfully!")
    print(f"RF Accuracy: {rf_score:.4f} | XGB/GB Accuracy: {xgb_score:.4f}")

if __name__ == "__main__":
    train_models()
