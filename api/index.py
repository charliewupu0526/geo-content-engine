"""
GEO Content Engine - FastAPI Backend
Main entry point for Vercel deployment
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

# Import routers
from api.routers import crawler, intelligence, projects, production, publishing, auth

# Lifespan for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 GEO Content Engine API starting...")
    yield
    # Shutdown
    print("👋 GEO Content Engine API shutting down...")

# Create FastAPI app
app = FastAPI(
    title="GEO Content Engine API",
    description="Backend API for GEO Content Engine - AI-powered content optimization",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    import json
    
    # Clone the request body because it can be read only once
    body_bytes = await request.body()
    
    # Re-package the body for the actual request handler
    async def receive():
        return {"type": "http.request", "body": body_bytes}
    request._receive = receive
    
    try:
        if request.method == "POST":
            body_str = body_bytes.decode("utf-8")
            print(f"[{request.method}] {request.url.path} - Body: {body_str[:500]}...", flush=True)
    except Exception as e:
        print(f"Error logging request: {e}", flush=True)
        
    response = await call_next(request)
    return response

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(crawler.router, prefix="/api/crawler", tags=["Crawler"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Intelligence"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(production.router, prefix="/api/production", tags=["Production"])
app.include_router(publishing.router, prefix="/api/publishing", tags=["Publishing"])

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "GEO Content Engine API",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/api")
async def root():
    return {
        "message": "Welcome to GEO Content Engine API",
        "docs": "/api/docs",
        "health": "/api/health"
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail
        }
    )
