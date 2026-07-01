# Titanic AutoML & Data Analytics Suite

A premium, portfolio-grade **AutoML and Data Analytics Platform** built entirely in Python. The application functions out-of-the-box as a localized Indian Titanic survival predictor, while offering generic AutoML capabilities that allow users to upload any custom CSV dataset, configure targets and features on-the-fly, train regression/classification models, explain predictions, and plot statistics.

---

## 🚀 Premium Features

### 1. Dynamic CSV Dataset Upload & Parsing
* Drag-and-drop file uploader accepting any custom tabular dataset (CSV format).
* Falls back to a localized Indian Titanic training dataset if no custom file is uploaded.
* Automatically filters out unique identifier columns (e.g. IDs, names, ticket codes, cabin numbers) from predictors.

### 2. Dual-Mode ML Engine (Classification & Regression)
* **Classification Mode**: Automatically active if the target variable contains non-numeric categories (e.g., `Rescued` or `Deceased`) or has 15 or fewer unique values. Trains `RandomForestClassifier` and `GradientBoostingClassifier`. Evaluates models using Accuracy, Precision, Recall, F1, Confusion Matrix, and ROC Curve plots.
* **Regression Mode**: Automatically active if the target variable is continuous (numeric columns with more than 15 unique values like `Age` or `Fare`). Trains `RandomForestRegressor` and `GradientBoostingRegressor`. Evaluates models using R² Score, Mean Absolute Error (MAE), RMSE, and Actual vs. Predicted scatter plot diagnostics.

### 3. Dynamic Predictor Input Builder
* Automatically parses selected features and constructs corresponding Streamlit interactive widgets (sliders for numerical features based on min/max ranges, selectboxes for categorical categories).

### 4. "What-If" Counterfactual Simulator
* Dynamically calculates Pearson correlations and category averages for predictor columns.
* Runs simulation iterations to recommend inputs that optimize the target prediction (e.g., increasing or decreasing features to improve survival probabilities or numeric outputs).

### 5. Local Explainable AI (XAI)
* Visualizes real-time horizontal contribution charts (SHAP approximation) illustrating the impact (positive or negative influence) of configured attributes on the model's final prediction.

### 6. Interactive Exploratory Data Analytics (EDA)
* Sleek dark-themed visualizations matching the dashboard:
  * **Pearson Correlation Heatmap** of numerical and encoded features.
  * **Target Distribution plots** (histograms/KDEs for continuous variables, counts for classification categories).
  * **Interactive Scatter Analytics** with dynamic X/Y axis selectors mapping custom feature clustering.
  * **Searchable Data Grid** to filter and inspect raw rows.

---

## 📂 Project Architecture

```
├── data/                     # Raw/cached training datasets (e.g. titanic.csv)
├── app.py                    # Streamlit AutoML & Analytics Monolith
├── README.md                 # Project Manual
├── .gitignore                # Git blocklist (excludes .db, venv, and env variables)
└── backend/                  # (Legacy Folder - Multi-service files archived)
```

---

## ⚙️ Local Development Setup

### 1. Create a Python Virtual Environment
Ensure Python 3.11+ is installed. Run the following commands in your terminal:
```powershell
# Create venv
python -m venv backend/venv

# Activate venv (PowerShell Windows)
backend/venv/Scripts/Activate.ps1

# Activate venv (Command Prompt Windows)
backend/venv/Scripts/activate.bat

# Activate venv (Linux/macOS)
source backend/venv/bin/activate
```

### 2. Install Dependencies
```powershell
pip install streamlit pandas numpy scikit-learn matplotlib seaborn joblib
```

### 3. Run the Streamlit Application
```powershell
streamlit run app.py
```
The application will launch and open automatically at **[http://localhost:8501](http://localhost:8501)**.
