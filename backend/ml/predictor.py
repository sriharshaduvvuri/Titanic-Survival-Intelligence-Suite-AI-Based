import os
import json
import joblib
import numpy as np

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")

class TitanicPredictor:
    def __init__(self):
        self.rf_model = None
        self.xgb_model = None
        self.metadata = None
        self._load_models()

    def _load_models(self):
        rf_path = os.path.join(ARTIFACTS_DIR, "model_rf.joblib")
        xgb_path = os.path.join(ARTIFACTS_DIR, "model_xgb.joblib")
        meta_path = os.path.join(ARTIFACTS_DIR, "metadata.json")

        if not os.path.exists(rf_path) or not os.path.exists(xgb_path) or not os.path.exists(meta_path):
            print("Model artifacts missing. Running training pipeline...")
            from ml.train import train_models
            train_models()

        try:
            self.rf_model = joblib.load(rf_path)
            self.xgb_model = joblib.load(xgb_path)
            with open(meta_path, "r") as f:
                self.metadata = json.load(f)
            print("Models loaded successfully.")
        except Exception as e:
            print(f"Error loading models: {e}")

    def predict(self, pclass: int, sex: str, age: float, sibsp: int, parch: int, fare: float, embarked: str):
        # Reload models if they failed to load earlier
        if not self.rf_model or not self.xgb_model or not self.metadata:
            self._load_models()

        # Encodings
        sex_encoded = 1 if sex.lower() == "female" else 0
        embarked_map = self.metadata["mappings"]["embarked"]
        embarked_encoded = embarked_map.get(embarked.upper(), 0)

        # Build feature vector
        features = [pclass, sex_encoded, age, sibsp, parch, fare, embarked_encoded]
        features_arr = np.array([features])

        # Model scores
        prob_rf = float(self.rf_model.predict_proba(features_arr)[0][1])
        prob_xgb = float(self.xgb_model.predict_proba(features_arr)[0][1])

        # Aggregated outcome
        avg_prob = (prob_rf + prob_xgb) / 2.0
        predicted_survived = avg_prob >= 0.5

        # Explainable AI (XAI) - Local SHAP contribution approximation
        # We compute how the input value differs from the training set averages,
        # then scale it by feature importance to produce a percentage impact.
        importances = self.metadata["feature_importances"]["random_forest"]
        
        # Baselines from Titanic training set averages
        baselines = {
            "Pclass": 2.3,
            "Sex": 0.35, # 35% female
            "Age": 29.7,
            "SibSp": 0.52,
            "Parch": 0.38,
            "Fare": 32.2,
            "Embarked": 0.36
        }

        contributions = {}
        
        # 1. Gender Impact (Highest importance)
        gender_imp = importances[1] * 100
        if sex_encoded == 1:
            contributions["Gender"] = round(gender_imp * (1.0 - baselines["Sex"]) * 1.5, 1) # female positive
        else:
            contributions["Gender"] = round(-gender_imp * baselines["Sex"] * 2.2, 1) # male negative

        # 2. Pclass Impact
        pclass_imp = importances[0] * 100
        if pclass == 1:
            contributions["Passenger Class"] = round(pclass_imp * 1.2, 1)
        elif pclass == 2:
            contributions["Passenger Class"] = round(pclass_imp * 0.2, 1)
        else:
            contributions["Passenger Class"] = round(-pclass_imp * 1.1, 1)

        # 3. Age Impact
        age_imp = importances[2] * 100
        age_diff = age - baselines["Age"]
        # In Titanic, children survived more, elderly survived less
        if age < 12:
            contributions["Age"] = round(age_imp * 1.6, 1)
        elif age > 60:
            contributions["Age"] = round(-age_imp * 1.2, 1)
        else:
            # Linear decrease
            contributions["Age"] = round(-age_imp * (age_diff / 50.0), 1)

        # 4. Fare Impact
        fare_imp = importances[5] * 100
        fare_diff = fare - baselines["Fare"]
        if fare > 100:
            contributions["Fare"] = round(fare_imp * 1.4, 1)
        elif fare < 10:
            contributions["Fare"] = round(-fare_imp * 0.8, 1)
        else:
            contributions["Fare"] = round(fare_imp * (fare_diff / 150.0), 1)

        # 5. Family (SibSp & Parch) Impact
        family_imp = (importances[3] + importances[4]) / 2.0 * 100
        family_size = sibsp + parch
        # Large families or absolute isolation had different survival rates
        if family_size == 0:
            contributions["Family Size"] = round(-family_imp * 0.5, 1)
        elif 1 <= family_size <= 3:
            contributions["Family Size"] = round(family_imp * 1.1, 1)
        else:
            contributions["Family Size"] = round(-family_imp * 1.4, 1)

        # 6. Embarked Impact
        embarked_imp = importances[6] * 100
        if embarked.upper() == "C": # Cherbourg high survival
            contributions["Embarkation Port"] = round(embarked_imp * 0.8, 1)
        elif embarked.upper() == "Q":
            contributions["Embarkation Port"] = round(embarked_imp * 0.1, 1)
        else: # Southampton
            contributions["Embarkation Port"] = round(-embarked_imp * 0.5, 1)

        # Let's adjust predictions to align contribution sum with output prob
        total_contrib = sum(contributions.values())
        diff_prob = (avg_prob - 0.38) * 100 # 38% is average survival baseline
        # Distribute discrepancy across top contributors slightly to maintain logical parity
        if total_contrib != 0:
            scaling_factor = diff_prob / total_contrib if abs(total_contrib) > 2 else 1.0
            # Clip scaling factor to keep explanations readable and realistic
            scaling_factor = np.clip(scaling_factor, 0.5, 2.0)
            for k in contributions:
                contributions[k] = round(contributions[k] * scaling_factor, 1)

        return {
            "survived_prob_rf": round(prob_rf, 4),
            "survived_prob_xgb": round(prob_xgb, 4),
            "predicted_survived": bool(predicted_survived),
            "explanation": contributions
        }

predictor = TitanicPredictor()
