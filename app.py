import streamlit as st
import pandas as pd
import numpy as np
import os
import urllib.request
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_curve, auc
import joblib

# Set Page Config for premium layout
st.set_page_config(
    page_title="Titanic AutoML & Data Analytics Suite",
    page_icon="🚢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for modern look
st.markdown("""
<style>
    .reportview-container {
        background: #0f172a;
    }
    .main-header {
        font-size: 2.8rem;
        font-weight: 900;
        background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.1rem;
        color: #94a3b8;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: rgba(30, 41, 59, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 1.5rem;
        border-radius: 1rem;
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)

# Globally configure Matplotlib dark-mode theme to integrate seamlessly with dark dashboard style
plt.style.use("dark_background")
matplotlib_params = {
    'figure.facecolor': '#0f172a',  # Matches Streamlit dark background
    'axes.facecolor': '#1e293b',    # Matches cards/canvas backgrounds
    'text.color': '#f8fafc',        # Slate 50 text
    'axes.labelcolor': '#94a3b8',   # Slate 400 label text
    'xtick.color': '#94a3b8',
    'ytick.color': '#94a3b8',
    'grid.color': '#334155',        # Slate 700 grid lines
    'legend.facecolor': '#1e293b',
    'legend.edgecolor': 'none'
}
for k, v in matplotlib_params.items():
    plt.rcParams[k] = v

# --- DATA GENERATOR & DOWNLOADER ---
DATA_URL = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
DATA_PATH = os.path.join(DATA_DIR, "titanic.csv")

def generate_synthetic_data(path):
    np.random.seed(42)
    n_samples = 891
    pclasses = np.random.choice([1, 2, 3], size=n_samples, p=[0.24, 0.21, 0.55])
    sexes = np.random.choice(["male", "female"], size=n_samples, p=[0.65, 0.35])
    ages = np.random.normal(loc=29.7, scale=14.5, size=n_samples)
    ages = np.clip(ages, 0.42, 80.0)
    nan_mask = np.random.choice([True, False], size=n_samples, p=[0.17, 0.83])
    ages[nan_mask] = np.nan
    
    sibsp = np.random.choice([0, 1, 2, 3, 4, 5, 8], size=n_samples, p=[0.68, 0.23, 0.03, 0.02, 0.02, 0.01, 0.01])
    parch = np.random.choice([0, 1, 2, 3, 4, 5, 6], size=n_samples, p=[0.76, 0.13, 0.09, 0.01, 0.005, 0.003, 0.002])
    
    fares = np.zeros(n_samples)
    fares[pclasses == 1] = np.random.exponential(scale=84, size=sum(pclasses == 1)) + 15
    fares[pclasses == 2] = np.random.exponential(scale=20, size=sum(pclasses == 2)) + 10
    fares[pclasses == 3] = np.random.exponential(scale=13, size=sum(pclasses == 3)) + 4
    
    embarked = np.random.choice(["S", "C", "Q"], size=n_samples, p=[0.72, 0.19, 0.09])
    
    # Probability baseline
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

@st.cache_data
def load_default_data():
    if not os.path.exists(DATA_PATH):
        try:
            urllib.request.urlretrieve(DATA_URL, DATA_PATH)
        except Exception:
            generate_synthetic_data(DATA_PATH)
    return pd.read_csv(DATA_PATH)

# --- SIDEBAR INTERFACE ---
st.sidebar.subheader("📂 Dataset Upload Lab")
uploaded_file = st.sidebar.file_uploader("Upload custom CSV dataset", type=["csv"], help="Upload any CSV file. The AI will dynamically configure features, target variables, and run training.")

# Load active dataset
if uploaded_file is not None:
    df_raw = pd.read_csv(uploaded_file)
    is_custom_dataset = True
    st.sidebar.success("✔️ Custom CSV Uploaded!")
else:
    df_raw = load_default_data()
    is_custom_dataset = False
    st.sidebar.info("ℹ️ Using default Indian Localized Titanic dataset")

# Target & Feature selectors
columns_list = list(df_raw.columns)
st.sidebar.subheader("🎯 AutoML Configuration")

default_target = "Survived" if "Survived" in columns_list else columns_list[0]
target_var = st.sidebar.selectbox("Select Target Column (to predict)", columns_list, index=columns_list.index(default_target))

potential_features = [c for c in columns_list if c != target_var]
if not is_custom_dataset:
    default_features = [c for c in ["Pclass", "Sex", "Age", "SibSp", "Parch", "Fare", "Embarked"] if c in potential_features]
else:
    # Exclude columns that are unique identifiers (like IDs, Names, Tickets)
    default_features = [c for c in potential_features if not c.lower().endswith("id") and not c.lower() in ["name", "ticket", "cabin"]]

features_selected = st.sidebar.multiselect("Select Predictor Features", potential_features, default=default_features)

if not features_selected:
    st.error("Please select at least one predictor feature in the sidebar!")
    st.stop()

# AI Hyperparameters
st.sidebar.subheader("⚙️ AI Model Parameters")
st.sidebar.caption("Fine-tune model parameters and re-train models instantly.")

with st.sidebar.expander("Random Forest Settings"):
    rf_estimators = st.slider("RF Trees Count", 10, 300, 100, step=10)
    rf_depth = st.slider("RF Max Depth", 2, 15, 7)

with st.sidebar.expander("Gradient Boosting Settings"):
    gb_estimators = st.slider("GB Estimators", 10, 300, 100, step=10)
    gb_depth = st.slider("GB Max Depth", 1, 10, 4)
    gb_lr = st.slider("GB Learning Rate", 0.01, 0.5, 0.1, step=0.01)

# --- DYNAMIC PREPROCESSING ENGINE ---
def preprocess_general(df, target_var, features_selected):
    df_clean = df.copy()
    keep_cols = features_selected + [target_var]
    df_clean = df_clean[keep_cols]
    
    imputers = {}
    for col in keep_cols:
        if col == target_var:
            df_clean = df_clean.dropna(subset=[target_var])
            continue
            
        if pd.api.types.is_numeric_dtype(df_clean[col]):
            median_val = df_clean[col].median()
            if pd.isna(median_val):
                median_val = 0.0
            df_clean[col] = df_clean[col].fillna(median_val)
            imputers[col] = ("median", float(median_val))
        else:
            mode_series = df_clean[col].mode()
            mode_val = str(mode_series[0]) if len(mode_series) > 0 else "Unknown"
            df_clean[col] = df_clean[col].fillna(mode_val)
            imputers[col] = ("mode", mode_val)
            
    # Encodings
    label_encoders = {}
    encoded_features = []
    for col in features_selected:
        if not pd.api.types.is_numeric_dtype(df_clean[col]):
            df_clean[col] = df_clean[col].astype(str)
            unique_vals = sorted(list(df_clean[col].unique()))
            mapping = {val: idx for idx, val in enumerate(unique_vals)}
            df_clean[col + "_encoded"] = df_clean[col].map(mapping)
            label_encoders[col] = mapping
            encoded_features.append(col + "_encoded")
        else:
            encoded_features.append(col)
            
    X = df_clean[encoded_features]
    y = df_clean[target_var]
    
    target_mapping = None
    if y.dtype == object or y.dtype.name == "category":
        y = y.astype(str)
        unique_targets = sorted(list(y.unique()))
        target_mapping = {val: idx for idx, val in enumerate(unique_targets)}
        y = y.map(target_mapping)
        
    return X, y, imputers, label_encoders, target_mapping, encoded_features, df_clean

# --- AutoML TRAINING & CACHING ---
@st.cache_resource
def train_general_models(df, target_var, features_selected_tuple, rf_estimators, rf_depth, gb_estimators, gb_depth, gb_lr):
    features_selected = list(features_selected_tuple)
    X, y, imputers, label_encoders, target_mapping, X_cols, df_clean = preprocess_general(df, target_var, features_selected)
    
    # If target has too few classes (regression or single class)
    unique_classes = len(np.unique(y))
    if unique_classes < 2:
        return None, None, None, None, None, None, imputers, label_encoders, target_mapping, X_cols, df_clean
        
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    rf = RandomForestClassifier(n_estimators=rf_estimators, max_depth=rf_depth, random_state=42)
    rf.fit(X_train, y_train)
    
    gb = GradientBoostingClassifier(n_estimators=gb_estimators, max_depth=gb_depth, learning_rate=gb_lr, random_state=42)
    gb.fit(X_train, y_train)
    
    return rf, gb, X_train, X_test, y_train, y_test, imputers, label_encoders, target_mapping, X_cols, df_clean

# Load and train dynamically
features_tuple = tuple(features_selected)
rf, gb, X_train, X_test, y_train, y_test, imputers, label_encoders, target_mapping, X_cols, df_clean = train_general_models(
    df_raw, target_var, features_tuple, rf_estimators, rf_depth, gb_estimators, gb_depth, gb_lr
)

# --- RUN VERIFICATIONS ---
if rf is None:
    st.error(f"Cannot run classification AI. The selected target column `{target_var}` must contain at least 2 distinct classes. Please choose a different target column in the sidebar.")
    st.stop()

# --- SIDEBAR INTERFACE CONTROLS GENERATION ---
st.sidebar.markdown("---")
st.sidebar.subheader("🔧 Active AI Settings")
selected_model_name = st.sidebar.selectbox("Active AI Model", ["Ensemble Model", "Gradient Boosting Classifier", "Random Forest Classifier"])

# If Titanic, show custom presets
if not is_custom_dataset:
    st.sidebar.subheader("Indian Passenger Presets")
    preset = st.sidebar.selectbox("Load Profile Presets", [
        "None - Manual Tuning",
        "Priya Sharma (1st Class AC - Female)",
        "Rahul Malhotra (3rd Class General - Male)",
        "Aditya Birla (Wealthy Elite - 1st Class AC)",
        "Aarav Patel (3rd Class General - Child)"
    ])

    if preset == "Priya Sharma (1st Class AC - Female)":
        presets_dict = {"Pclass": 1, "Sex": "female", "Age": 17.0, "SibSp": 0, "Parch": 1, "Fare": 150.0, "Embarked": "C"}
    elif preset == "Rahul Malhotra (3rd Class General - Male)":
        presets_dict = {"Pclass": 3, "Sex": "male", "Age": 20.0, "SibSp": 0, "Parch": 0, "Fare": 7.25, "Embarked": "S"}
    elif preset == "Aditya Birla (Wealthy Elite - 1st Class AC)":
        presets_dict = {"Pclass": 1, "Sex": "male", "Age": 47.0, "SibSp": 1, "Parch": 0, "Fare": 263.0, "Embarked": "C"}
    elif preset == "Aarav Patel (3rd Class General - Child)":
        presets_dict = {"Pclass": 3, "Sex": "female", "Age": 4.0, "SibSp": 2, "Parch": 1, "Fare": 15.24, "Embarked": "S"}
    else:
        presets_dict = {}
else:
    preset = "None"
    presets_dict = {}

# Build Dynamic UI forms for inputting prediction vectors
st.sidebar.subheader("Input Prediction Values")
user_inputs = {}

for col in features_selected:
    col_type = df_raw[col].dtype
    preset_val = presets_dict.get(col, None)
    
    if pd.api.types.is_numeric_dtype(df_raw[col]):
        min_val = float(df_raw[col].min())
        max_val = float(df_raw[col].max())
        mean_val = float(df_raw[col].mean())
        
        # If preset exists, override default mean value
        val_default = float(preset_val) if preset_val is not None else mean_val
        val_default = np.clip(val_default, min_val, max_val)
        
        label_with_currency = f"{col} (₹)" if col == "Fare" else col
        
        if (df_raw[col] % 1 == 0).all():
            val = st.sidebar.slider(f"{label_with_currency} (Numerical)", int(min_val), int(max_val), int(val_default))
        else:
            val = st.sidebar.slider(f"{label_with_currency} (Numerical)", min_val, max_val, val_default)
        user_inputs[col] = val
    else:
        unique_vals = sorted(list(df_raw[col].dropna().astype(str).unique()))
        
        # Special localization mapping for Embarked port in default Titanic uploader
        default_index = 0
        if not is_custom_dataset and col == "Embarked" and preset_val is not None:
            default_index = unique_vals.index(preset_val) if preset_val in unique_vals else 0
        elif preset_val is not None:
            preset_str = str(preset_val)
            default_index = unique_vals.index(preset_str) if preset_str in unique_vals else 0
            
        val = st.sidebar.selectbox(f"{col} (Categorical)", unique_vals, index=default_index)
        user_inputs[col] = val

# --- HEADER SECTION ---
st.markdown("<div class='main-header'>🚢 Titanic Survival Intelligence Suite</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-header'>Enterprise AutoML Dashboard & Explainable AI Prediction Engine</div>", unsafe_allow_html=True)

# --- MAIN TABS ---
tab_predict, tab_eda, tab_metrics = st.tabs(["🔮 Predictive AI Diagnostics", "📊 Exploratory Data Analytics", "📈 Model Performance Metrics"])

# ================= TAB: PREDICTIVE AI =================
with tab_predict:
    st.header("🔮 AI Classification Diagnostic")
    
    col1, col2 = st.columns([1, 1.2])
    
    with col1:
        st.subheader("Interactive Feature Vector")
        # Visual Summary of details
        for col in features_selected:
            st.write(f"**{col}:** `{user_inputs[col]}`")
            
        # Build encoded input vector
        encoded_input_list = []
        for col in features_selected:
            val = user_inputs[col]
            if col in label_encoders:
                encoded_input_list.append(label_encoders[col][val])
            else:
                encoded_input_list.append(val)
                
        input_vector = np.array([encoded_input_list])
        
        # Models predict prob
        prob_rf = rf.predict_proba(input_vector)[0][1]
        prob_gb = gb.predict_proba(input_vector)[0][1]
        
        # Select active model probability
        if selected_model_name == "Gradient Boosting Classifier":
            survival_prob = prob_gb
        elif selected_model_name == "Random Forest Classifier":
            survival_prob = prob_rf
        else: # Ensemble
            survival_prob = (prob_rf + prob_gb) / 2.0
            
        st.markdown("---")
        
        # Display Result Gauge
        st.subheader("Prediction Gauge")
        
        # Resolve target category labels
        target_zero_label = "Class 0"
        target_one_label = "Class 1"
        if target_mapping is not None:
            inverted_mapping = {v: k for k, v in target_mapping.items()}
            target_zero_label = inverted_mapping.get(0, "Class 0")
            target_one_label = inverted_mapping.get(1, "Class 1")
        elif not is_custom_dataset:
            target_zero_label = "DECEASED / LOST"
            target_one_label = "RESCUED / SAFE"
            
        label = target_one_label if survival_prob >= 0.50 else target_zero_label
        
        # Display large text metrics
        st.metric(
            label=f"Predicted Outcome ({label})", 
            value=f"{survival_prob:.1%}", 
            delta="High Probability" if survival_prob >= 0.50 else "Low Probability",
            delta_color="normal" if survival_prob >= 0.50 else "inverse"
        )
        
        # Visual indicator
        st.progress(survival_prob)
        if survival_prob >= 0.50:
            st.success(f"✔️ The AI predicts a **{label}** classification outcome (Confidence: {survival_prob:.1%}).")
        else:
            st.error(f"❌ The AI predicts a **{label}** classification outcome (Confidence: {1.0 - survival_prob:.1%}).")

        st.markdown("---")
        
        # What-If Counterfactual Simulator
        st.subheader("💡 What-If Survival Path Simulator")
        st.caption("Suggested feature adjustments to optimize the prediction outcome:")
        
        simulations = []
        
        # Loop through numeric features to simulate changes
        for col in features_selected:
            if df_raw[col].dtype in [np.float64, np.int64]:
                val = user_inputs[col]
                mean_val = df_raw[col].mean()
                
                # Check correlation
                corr = df_clean[col].corr(df_clean[target_var])
                if pd.isna(corr):
                    corr = 0
                    
                if corr > 0.1 and val < mean_val:
                    # Simulate setting it to 1.5 standard deviations above mean
                    std_val = df_raw[col].std() if df_raw[col].std() != 0 else 1
                    test_val = mean_val + 1.2 * std_val
                    
                    test_vector = input_vector.copy()
                    col_idx = X_cols.index(col)
                    test_vector[0][col_idx] = test_val
                    
                    p_rf = rf.predict_proba(test_vector)[0][1]
                    p_gb = gb.predict_proba(test_vector)[0][1]
                    p_test = (p_rf + p_gb) / 2.0 if selected_model_name == "Ensemble Model" else p_gb if selected_model_name == "Gradient Boosting Classifier" else p_rf
                    
                    diff = p_test - survival_prob
                    if diff > 0.03:
                        st.markdown(f"- **Increase `{col}`**: Increasing this value to `{test_val:.2f}` improves output probability by **+{diff:.1%}** (New chance: **{p_test:.1%}**)")
                elif corr < -0.1 and val > mean_val:
                    # Simulate setting it to standard deviation below mean
                    std_val = df_raw[col].std() if df_raw[col].std() != 0 else 1
                    test_val = max(float(df_raw[col].min()), mean_val - 1.2 * std_val)
                    
                    test_vector = input_vector.copy()
                    col_idx = X_cols.index(col)
                    test_vector[0][col_idx] = test_val
                    
                    p_rf = rf.predict_proba(test_vector)[0][1]
                    p_gb = gb.predict_proba(test_vector)[0][1]
                    p_test = (p_rf + p_gb) / 2.0 if selected_model_name == "Ensemble Model" else p_gb if selected_model_name == "Gradient Boosting Classifier" else p_rf
                    
                    diff = p_test - survival_prob
                    if diff > 0.03:
                        st.markdown(f"- **Decrease `{col}`**: Decreasing this value to `{test_val:.2f}` improves output probability by **+{diff:.1%}** (New chance: **{p_test:.1%}**)")

        # Custom localized gender baseline simulation for Titanic
        if not is_custom_dataset and "Sex" in features_selected and user_inputs.get("Sex") == "male":
            test_vector = input_vector.copy()
            col_idx = X_cols.index("Sex_encoded")
            test_vector[0][col_idx] = 1 # female
            p_rf = rf.predict_proba(test_vector)[0][1]
            p_gb = gb.predict_proba(test_vector)[0][1]
            p_test = (p_rf + p_gb) / 2.0 if selected_model_name == "Ensemble Model" else p_gb if selected_model_name == "Gradient Boosting Classifier" else p_rf
            diff = p_test - survival_prob
            st.markdown(f"- **Demographics**: Under historical maritime guidelines, a female passenger with identical details had a **+{diff:.1%}** higher survival rate (**{p_test:.1%}** total chance).")

    with col2:
        st.subheader("Explainable AI (XAI) - Local Feature Contribution")
        st.caption("This analysis explains why the AI made this prediction. Positive values (green) increase predicted outcome probability, negative values (red) decrease it.")
        
        # Calculate local contributions dynamically
        contributions = {}
        for idx, col in enumerate(features_selected):
            importance = rf.feature_importances_[idx] * 100
            val = user_inputs[col]
            
            if col in label_encoders:
                val_enc = label_encoders[col][val]
                # Calculate class groups means
                group_means = df_clean.groupby(col + "_encoded")[target_var].mean()
                overall_mean = df_clean[target_var].mean()
                prob_diff = group_means.get(val_enc, overall_mean) - overall_mean
                contributions[col] = prob_diff * importance * 1.5
            else:
                mean_val = df_raw[col].mean()
                std_val = df_raw[col].std() if df_raw[col].std() != 0 else 1.0
                diff_std = (val - mean_val) / std_val
                corr = df_clean[col].corr(df_clean[target_var])
                if pd.isna(corr):
                    corr = 0
                contributions[col] = diff_std * corr * importance * 1.5
                
        # Plot SHAP contribution bar chart
        fig, ax = plt.subplots(figsize=(8, 6.2))
        contrib_sorted = sorted(contributions.items(), key=lambda x: x[1])
        features_plot = [x[0] for x in contrib_sorted]
        values_plot = [x[1] for x in contrib_sorted]
        colors_plot = ['#f43f5e' if v < 0 else '#10b981' for v in values_plot]
        
        bars = ax.barh(features_plot, values_plot, color=colors_plot, height=0.6)
        ax.axvline(0, color='#475569', linestyle='--', linewidth=1.5)
        ax.set_xlabel("Survival Impact Score", fontsize=11)
        ax.set_title("Local AI Explanation (Random Forest Estimator)", fontsize=13, fontweight='bold', pad=15)
        
        for bar in bars:
            width = bar.get_width()
            label_x_pos = width + 0.5 if width >= 0 else width - 3.5
            ax.text(label_x_pos, bar.get_y() + bar.get_height()/2, f'{width:+.1f}', 
                    va='center', ha='left' if width >= 0 else 'right', fontsize=9, fontweight='bold')
                    
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()

# ================= TAB: EXPLORATORY DATA ANALYTICS =================
with tab_eda:
    st.header("📊 Interactive Exploratory Analytics")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Feature Correlation Matrix")
        st.write("Calculates linear correlation between numerical/encoded variables. Positive correlation (red) points to high survival, negative (blue) to perishing.")
        
        fig, ax = plt.subplots(figsize=(8, 6.5))
        # Keep numeric cols + target
        corr_cols = [c for c in df_clean.columns if df_clean[c].dtype in [np.float64, np.int64]]
        sns.heatmap(df_clean[corr_cols].corr(), annot=True, cmap="coolwarm", fmt=".2f", linewidths=0.5, cbar_kws={'shrink': 0.8}, ax=ax)
        plt.title("Pearson Correlation Heatmap", fontsize=13, fontweight="bold", pad=15)
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
        
    with col2:
        st.subheader("Target Variable Classification Distribution")
        st.write(f"Distribution of target classes in the loaded dataset for `{target_var}`.")
        
        fig, ax = plt.subplots(figsize=(8, 6.5))
        # Map values back to labels
        y_val_plot = df_clean[target_var].copy()
        if target_mapping is not None:
            inverted_mapping = {v: k for k, v in target_mapping.items()}
            y_val_plot = y_val_plot.map(inverted_mapping)
        elif not is_custom_dataset:
            y_val_plot = y_val_plot.map({0: "Deceased / Lost", 1: "Rescued / Safe"})
            
        sns.countplot(x=y_val_plot, palette="crest", hue=y_val_plot, legend=False, ax=ax)
        plt.title("Target Counts Distribution", fontsize=13, fontweight="bold", pad=15)
        plt.ylabel("Number of Records")
        plt.xlabel(f"{target_var} Classes")
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
        
    st.markdown("---")
    
    # Custom Demographics scatter plot
    st.subheader("Interactive Numerical Features Scatter Analysis")
    st.write("Plot any two numerical columns from your uploaded dataset. Color codes whether the passenger was rescued/survived.")
    
    numeric_cols = [c for c in features_selected if df_raw[c].dtype in [np.float64, np.int64]]
    if len(numeric_cols) >= 2:
        col_x = st.selectbox("Select Scatter X-Axis", numeric_cols, index=0)
        col_y = st.selectbox("Select Scatter Y-Axis", numeric_cols, index=min(1, len(numeric_cols)-1))
        
        fig, ax = plt.subplots(figsize=(10, 5.5))
        scatter_df = df_clean.copy()
        scatter_df["Survival Outcome"] = scatter_df[target_var].map({0: "Deceased / Lost", 1: "Rescued / Safe"}) if not is_custom_dataset else scatter_df[target_var]
        
        sns.scatterplot(
            data=scatter_df, 
            x=col_x, 
            y=col_y, 
            hue="Survival Outcome", 
            palette="viridis",
            alpha=0.7, 
            s=85, 
            ax=ax
        )
        
        plt.title(f"Demographic Scatter: {col_x} vs. {col_y}", fontsize=13, fontweight="bold", pad=15)
        plt.xlabel(col_x, fontsize=11)
        plt.ylabel(col_y, fontsize=11)
        plt.grid(True, linestyle=":", alpha=0.3)
        plt.legend(frameon=True)
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
    else:
        st.info("Scatter analysis requires at least 2 numerical features to be selected.")

    st.markdown("---")
    st.subheader("Interactive Passenger Database Explorer")
    st.dataframe(df_raw, use_container_width=True)

# ================= TAB: PERFORMANCE METRICS =================
with tab_metrics:
    st.header("📈 Model Evaluation & Diagnostics")
    
    # Calculate Test Set predictions for evaluation
    y_pred_rf = rf.predict(X_test)
    rf_acc = accuracy_score(y_test, y_pred_rf)
    rf_prec = precision_score(y_test, y_pred_rf, zero_division=0)
    rf_rec = recall_score(y_test, y_pred_rf, zero_division=0)
    rf_f1 = f1_score(y_test, y_pred_rf, zero_division=0)
    rf_cm = confusion_matrix(y_test, y_pred_rf)
    
    y_pred_gb = gb.predict(X_test)
    gb_acc = accuracy_score(y_test, y_pred_gb)
    gb_prec = precision_score(y_test, y_pred_gb, zero_division=0)
    gb_rec = recall_score(y_test, y_pred_gb, zero_division=0)
    gb_f1 = f1_score(y_test, y_pred_gb, zero_division=0)
    gb_cm = confusion_matrix(y_test, y_pred_gb)
    
    # Display comparison metrics in table
    metrics_summary = pd.DataFrame({
        "Performance Indicator": ["Accuracy Score", "Precision Score", "Recall Score", "F1 Score"],
        "Random Forest Classifier": [f"{rf_acc:.2%}", f"{rf_prec:.2%}", f"{rf_rec:.2%}", f"{rf_f1:.2%}"],
        "Gradient Boosting Classifier": [f"{gb_acc:.2%}", f"{gb_prec:.2%}", f"{gb_rec:.2%}", f"{gb_f1:.2%}"]
    })
    
    st.subheader("Performance Indicators Comparison Table")
    st.table(metrics_summary)
    
    col1, col2 = st.columns([1.2, 1])
    
    with col1:
        st.subheader("Receiver Operating Characteristic (ROC) curves")
        st.write("Charts model True Positive vs False Positive thresholds. High Area Under Curve (AUC) denotes superior models.")
        
        fig, ax = plt.subplots(figsize=(8, 6.5))
        # RF ROC
        rf_probs = rf.predict_proba(X_test)[:, 1]
        fpr_rf, tpr_rf, _ = roc_curve(y_test, rf_probs)
        roc_auc_rf = auc(fpr_rf, tpr_rf)
        plt.plot(fpr_rf, tpr_rf, color="#6366f1", lw=2.5, label=f"Random Forest (AUC = {roc_auc_rf:.3f})")
        
        # GB ROC
        gb_probs = gb.predict_proba(X_test)[:, 1]
        fpr_gb, tpr_gb, _ = roc_curve(y_test, gb_probs)
        roc_auc_gb = auc(fpr_gb, tpr_gb)
        plt.plot(fpr_gb, tpr_gb, color="#06b6d4", lw=2.5, label=f"Gradient Boosting (AUC = {roc_auc_gb:.3f})")
        
        plt.plot([0, 1], [0, 1], color="grey", lw=1.5, linestyle="--")
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.title("Model ROC Curve Comparison", fontsize=13, fontweight="bold", pad=15)
        plt.legend(loc="lower right", frameon=True)
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
        
    with col2:
        st.subheader("Evaluation Confusion Matrix")
        st.write(f"Distributes model classification errors across testing set partition ({len(y_test)} passenger records).")
        
        # Select confusion matrix of the best performing model
        best_cm = gb_cm if gb_acc > rf_acc else rf_cm
        best_model = "Gradient Boosting" if gb_acc > rf_acc else "Random Forest"
        
        fig, ax = plt.subplots(figsize=(7, 6.5))
        tn, fp, fn, tp = best_cm.ravel()
        labels = np.array([
            [f"True Negative (TN)\nDeceased Correctly\n\nCount: {tn}\nRatio: {tn/len(y_test):.1%}",
             f"False Positive (FP)\nType I Error\n\nCount: {fp}\nRatio: {fp/len(y_test):.1%}"],
            [f"False Negative (FN)\nType II Error\n\nCount: {fn}\nRatio: {fn/len(y_test):.1%}",
             f"True Positive (TP)\nRescued / Safe\n\nCount: {tp}\nRatio: {tp/len(y_test):.1%}"]
        ])
        
        sns.heatmap(best_cm, annot=labels, fmt="", cmap="Blues", cbar=False,
                    xticklabels=["Predicted Perished", "Predicted Survived"],
                    yticklabels=["Actual Perished", "Actual Survived"],
                    annot_kws={"size": 10}, ax=ax)
        plt.title(f"Confusion Matrix ({best_model})", fontsize=13, fontweight="bold", pad=15)
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
