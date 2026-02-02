"""
GEO Content Engine - FastAPI Backend
Main entry point for Vercel deployment
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

# Import routers
from api.routers import crawler, intelligence, projects

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
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "https://*.vercel.app",   # Vercel deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(crawler.router, prefix="/api/crawler", tags=["Crawler"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Intelligence"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])

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
    return {
        "error": True,
        "status_code": exc.status_code,
        "message": exc.detail
    }
