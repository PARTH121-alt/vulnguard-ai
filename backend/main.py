from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.database import init_db
from backend.routes.auth import router as auth_router
from backend.routes.analysis import router as analysis_router

app = FastAPI(
    title="VulnGuard AI",
    description="AI-Based Source Code Vulnerability Detection and Classification",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(analysis_router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def root():
    return {
        "name": "VulnGuard AI",
        "version": "1.0.0",
        "description": "AI-Based Source Code Vulnerability Detection and Classification",
        "status": "running",
        "docs": "/docs",
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
