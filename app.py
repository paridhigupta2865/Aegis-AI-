from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load model artifacts once at startup
model        = joblib.load("model/churn_model.pkl")
scaler       = joblib.load("model/scaler.pkl")
feature_names = joblib.load("model/feature_names.pkl")

# Maps for encoding categorical inputs the same way LabelEncoder did
GENDER_MAP       = {"Male": 1, "Female": 0}
YES_NO_MAP       = {"Yes": 1, "No": 0}
INTERNET_MAP     = {"DSL": 0, "Fiber optic": 1, "No": 2}
CONTRACT_MAP     = {"Month-to-month": 0, "One year": 1, "Two year": 2}
PAYMENT_MAP      = {
    "Bank transfer (automatic)": 0,
    "Credit card (automatic)":   1,
    "Electronic check":          2,
    "Mailed check":              3
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # Build feature vector in same order as training
        features = {
            "gender":            GENDER_MAP[data["gender"]],
            "SeniorCitizen":     int(data["SeniorCitizen"]),
            "Partner":           YES_NO_MAP[data["Partner"]],
            "Dependents":        YES_NO_MAP[data["Dependents"]],
            "tenure":            float(data["tenure"]),
            "PhoneService":      YES_NO_MAP[data["PhoneService"]],
            "MultipleLines":     YES_NO_MAP.get(data["MultipleLines"], 2),
            "InternetService":   INTERNET_MAP[data["InternetService"]],
            "OnlineSecurity":    YES_NO_MAP.get(data["OnlineSecurity"], 2),
            "OnlineBackup":      YES_NO_MAP.get(data["OnlineBackup"], 2),
            "DeviceProtection":  YES_NO_MAP.get(data["DeviceProtection"], 2),
            "TechSupport":       YES_NO_MAP.get(data["TechSupport"], 2),
            "StreamingTV":       YES_NO_MAP.get(data["StreamingTV"], 2),
            "StreamingMovies":   YES_NO_MAP.get(data["StreamingMovies"], 2),
            "Contract":          CONTRACT_MAP[data["Contract"]],
            "PaperlessBilling":  YES_NO_MAP[data["PaperlessBilling"]],
            "PaymentMethod":     PAYMENT_MAP[data["PaymentMethod"]],
            "MonthlyCharges":    float(data["MonthlyCharges"]),
            "TotalCharges":      float(data["TotalCharges"]),
        }

        # Arrange in correct feature order
        row = np.array([[features[f] for f in feature_names]])

        # Scale (same scaler used in training)
        row_scaled = scaler.transform(row)

        # Predict
        prediction = int(model.predict(row_scaled)[0])
        probability = float(model.predict_proba(row_scaled)[0][1])

        return jsonify({
            "churn": prediction,
            "probability": round(probability * 100, 2),
            "status": "Likely to Churn" if prediction == 1 else "Likely to Stay"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)
