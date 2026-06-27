# Titanic Survival Intelligence Suite

An enterprise-grade full-stack machine learning web application that predicts Titanic passenger survival using historical demographics and displays interactive analytics, Explainable AI (XAI) SHAP values, batch CSV analysis, and analytical reports.

## Platform Features

1. **Dashboard Analytics**: Real-time widgets displaying system usage, active sessions, and classification metrics alongside Recharts graphs (gender, age groups, class volumes).
2. **Inference Center**: Single passenger survival evaluator with probability speedometer rings, RF vs XGB comparison, and quick-insights SHAP values.
3. **Explainable AI (XAI)**: Global model feature importances and passenger-specific horizontal SHAP force charts detailing positive vs negative drivers.
4. **Batch CSV Predictor**: Drag-and-drop CSV parser with validation bars, results tables, local sample templates downloads, and results downloads.
5. **Reports Center**: Streamed CSV prediction logs and Helvetica-styled executive analytical PDFs generated on-the-fly.
6. **Admin Panel**: Audit logs tracking auth and file actions, user role toggling, and complete system JSON database backups.
7. **Security & Session Refresher**: In-memory rate limiting, secure HTTP response headers (CSP, X-Frame-Options), 5MB file upload blocks, and 5-minute session expiration alerts.

## Project Structure

```
├── backend/
│   ├── data/                 # Cached/synthetic Titanic CSV data
│   ├── ml/
│   │   ├── artifacts/        # Serialized RF & XGB models and metrics
│   │   ├── train.py          # Preprocessor and classifiers trainer
│   │   └── predictor.py      # Classifier wrappers and SHAP builders
│   ├── routers/              # Auth, Predictions, Analytics, Admin, Reports endpoints
│   ├── main.py               # FastAPI entrypoint and middlewares
│   ├── database.py           # SQLAlchemy SQLite/PostgreSQL connectors
│   ├── models.py             # ORM entity declarations
│   ├── schemas.py            # Pydantic serialization definitions
│   └── requirements.txt      # Python dependencies manifest
│
├── frontend/
│   ├── src/
│   │   ├── components/       # GlassCard, Sidebar, StatsWidget, NotificationToast
│   │   ├── pages/            # LandingPage, Login, Dashboard, prediction centers...
│   │   ├── utils/            # Axios integrations with JWT refresh handlers
│   │   ├── App.tsx           # React routers and session timers
│   │   └── main.tsx          # Application mount entrypoint
│   ├── tailwind.config.js    # Glassmorphism theme configurations
│   ├── vite.config.ts        # Chunks code-splitting rollup options
│   ├── vercel.json           # Vercel SPA routing redirects
│   └── package.json          # Node dependencies manifest
│
└── render.yaml               # Render full-stack deploy blueprint
```

---

## Local Development Setup

### 1. Backend Server Setup
Ensure Python 3.11+ is installed.
```powershell
cd backend
python -m venv venv
# On Windows PowerShell:
venv\Scripts\pip install -r requirements.txt
# On Linux/macOS:
source venv/bin/activate && pip install -r requirements.txt

# Run server
venv\Scripts\python main.py
```
*Note: On startup, the server automatically downloads training data, fits the models, and writes artifacts to disk.*

### 2. Frontend React Setup
Ensure Node.js is installed.
```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Production Deployments

Refer to the [deployment.md](file:///C:/Users/SRI%20HARSHA/.gemini/antigravity-ide/brain/369dee50-83e9-4593-9633-58e0b3cf87d9/deployment.md) guide for deploying the backend on **Render** and the frontend on **Vercel**.
