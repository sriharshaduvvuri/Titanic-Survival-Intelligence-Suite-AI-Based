import os
import urllib.request
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Plotting and metrics imports
import matplotlib
matplotlib.use('Agg') # Set non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix, roc_curve, auc

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
    
    # Calculate classification metrics
    y_pred_rf = rf.predict(X_test)
    rf_precision = float(precision_score(y_test, y_pred_rf))
    rf_recall = float(recall_score(y_test, y_pred_rf))
    rf_f1 = float(f1_score(y_test, y_pred_rf))
    rf_cm = confusion_matrix(y_test, y_pred_rf)
    
    y_pred_xgb = xgb.predict(X_test)
    xgb_precision = float(precision_score(y_test, y_pred_xgb))
    xgb_recall = float(recall_score(y_test, y_pred_xgb))
    xgb_f1 = float(f1_score(y_test, y_pred_xgb))
    xgb_cm = confusion_matrix(y_test, y_pred_xgb)
    
    # Define plots directory
    PLOTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static", "plots"))
    os.makedirs(PLOTS_DIR, exist_ok=True)
    
    # Use seaborn styling
    sns.set_theme(style="whitegrid", palette="muted")
    
    # 1. Feature Correlation Heatmap
    plt.figure(figsize=(9, 7))
    correlation_df = df[["Survived", "Pclass", "Sex_encoded", "Age", "SibSp", "Parch", "Fare", "Embarked_encoded"]].copy()
    correlation_df.columns = ["Survived", "Class", "Gender (F=1)", "Age", "Siblings/Spouses", "Parents/Children", "Fare", "Embarked Port"]
    sns.heatmap(correlation_df.corr(), annot=True, cmap="coolwarm", fmt=".2f", linewidths=0.5, cbar_kws={'shrink': 0.8})
    plt.title("Titanic Feature Correlation Heatmap", fontsize=14, fontweight="bold", pad=15)
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, "correlation_matrix.png"), dpi=150)
    plt.close()
    
    # 2. Feature Importances Barplot
    plt.figure(figsize=(9, 5.5))
    importances = rf.feature_importances_
    indices = np.argsort(importances)[::-1]
    feature_labels = {
        "Pclass": "Passenger Class",
        "Sex_encoded": "Gender (Female/Male)",
        "Age": "Passenger Age",
        "SibSp": "Siblings / Spouses",
        "Parch": "Parents / Children",
        "Fare": "Ticket Fare",
        "Embarked_encoded": "Embarkation Port"
    }
    features_sorted = [feature_labels.get(features[i], features[i]) for i in indices]
    importances_sorted = importances[indices]
    sns.barplot(x=importances_sorted, y=features_sorted, palette="crest_r")
    plt.title("Random Forest Classifier - Feature Importances", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Relative Importance Score", fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, "feature_importances.png"), dpi=150)
    plt.close()
    
    # 3. Annotated Confusion Matrix Heatmap (for best model)
    plt.figure(figsize=(7, 6))
    best_model_name = "XGBoost/Gradient Boosting" if xgb_score > rf_score else "Random Forest"
    best_cm = xgb_cm if xgb_score > rf_score else rf_cm
    tn, fp, fn, tp = best_cm.ravel()
    labels = np.array([
        [f"True Negative (TN)\nDeceased correctly identified\n\nCount: {tn}\nPercentage: {tn/len(y_test):.1%}",
         f"False Positive (FP)\nPredicted Survived, actually Perished\n\nCount: {fp}\nPercentage: {fp/len(y_test):.1%}"],
        [f"False Negative (FN)\nPredicted Perished, actually Survived\n\nCount: {fn}\nPercentage: {fn/len(y_test):.1%}",
         f"True Positive (TP)\nSurvivors correctly flagged\n\nCount: {tp}\nPercentage: {tp/len(y_test):.1%}"]
    ])
    sns.heatmap(best_cm, annot=labels, fmt="", cmap="Blues", cbar=False,
                xticklabels=["Predicted Perished", "Predicted Survived"],
                yticklabels=["Actual Perished", "Actual Survived"],
                annot_kws={"size": 10})
    plt.title(f"Evaluation Confusion Matrix ({best_model_name})", fontsize=13, fontweight="bold", pad=15)
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, "confusion_matrix.png"), dpi=150)
    plt.close()
    
    # 4. ROC Curve Comparison
    plt.figure(figsize=(8, 7))
    rf_probs = rf.predict_proba(X_test)[:, 1]
    fpr_rf, tpr_rf, _ = roc_curve(y_test, rf_probs)
    roc_auc_rf = auc(fpr_rf, tpr_rf)
    plt.plot(fpr_rf, tpr_rf, color="#6366f1", lw=2.5, label=f"Random Forest (AUC = {roc_auc_rf:.3f})")
    
    xgb_probs = xgb.predict_proba(X_test)[:, 1]
    fpr_xgb, tpr_xgb, _ = roc_curve(y_test, xgb_probs)
    roc_auc_xgb = auc(fpr_xgb, tpr_xgb)
    plt.plot(fpr_xgb, tpr_xgb, color="#06b6d4", lw=2.5, label=f"Gradient Boosting/XGB (AUC = {roc_auc_xgb:.3f})")
    
    plt.plot([0, 1], [0, 1], color="grey", lw=1.5, linestyle="--")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate", fontsize=11)
    plt.ylabel("True Positive Rate", fontsize=11)
    plt.title("Model ROC Curve Comparison", fontsize=14, fontweight="bold", pad=15)
    plt.legend(loc="lower right", frameon=True, facecolor="white", edgecolor="none")
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, "roc_curve.png"), dpi=150)
    plt.close()
    
    # 5. Age Distribution KDE plot
    plt.figure(figsize=(8.5, 5.5))
    sns.kdeplot(data=df[df["Survived"] == 1], x="Age", fill=True, color="#10b981", label="Survived", alpha=0.4, linewidth=2)
    sns.kdeplot(data=df[df["Survived"] == 0], x="Age", fill=True, color="#f43f5e", label="Perished", alpha=0.4, linewidth=2)
    plt.title("Age Density Distribution by Survival Outcome", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Age (Years)", fontsize=11)
    plt.ylabel("Density", fontsize=11)
    plt.legend(frameon=True, facecolor="white")
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, "age_survival_density.png"), dpi=150)
    plt.close()
    
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
            "random_forest_precision": float(rf_precision),
            "random_forest_recall": float(rf_recall),
            "random_forest_f1": float(rf_f1),
            "random_forest_cm": [int(x) for x in rf_cm.ravel()], # [tn, fp, fn, tp]
            
            "xgboost_accuracy": float(xgb_score),
            "xgboost_precision": float(xgb_precision),
            "xgboost_recall": float(xgb_recall),
            "xgboost_f1": float(xgb_f1),
            "xgboost_cm": [int(x) for x in xgb_cm.ravel()], # [tn, fp, fn, tp]
            
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
        
    print("Models trained, visual plots generated, and metadata saved successfully!")
    print(f"RF Accuracy: {rf_score:.4f} | XGB/GB Accuracy: {xgb_score:.4f}")

if __name__ == "__main__":
    train_models()
