import os
import time
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routers import auth, predictions, analytics, reports, admin

# Automatically create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Titanic Survival Intelligence Suite API",
    description="Enterprise machine learning APIs to predict Titanic survival and query analytics",
    version="1.0.0"
)

# Custom Rate Limiting Middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_limit: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.clients = {}

    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith("/api"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Check and clean sliding window list
        timestamps = self.clients.get(client_ip, [])
        timestamps = [t for t in timestamps if now - t < self.window_seconds]
        
        if len(timestamps) >= self.requests_limit:
            return Response(
                content="Too many requests. Rate limit exceeded.", 
                status_code=429,
                media_type="text/plain"
            )

        timestamps.append(now)
        self.clients[client_ip] = timestamps

        return await call_next(request)

# Custom Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' http://localhost:8000 http://localhost:5173 http://127.0.0.1:8000 http://127.0.0.1:5173;"
        )
        return response

app.add_middleware(RateLimitMiddleware, requests_limit=100, window_seconds=60)
app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS for local development and production
# Allow all origins or specify React port (typically 5173 for Vite)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*" # Dynamic fallback
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(admin.router)

# Mount static files directory for serving plots
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "plots"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.on_event("startup")
def startup_event():
    # Make sure uploads directory exists
    os.makedirs(os.path.join(os.path.dirname(__file__), "uploads"), exist_ok=True)
    
    # Check if models are available, train them if not
    print("Checking model artifacts...")
    try:
        from ml.predictor import predictor
        print("Model verification check passed. System ready.")
    except Exception as e:
        print(f"Error during model verification: {e}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Titanic Survival Intelligence Suite API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
