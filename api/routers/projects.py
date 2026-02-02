"""
Projects Router - API endpoints for project management
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from api.services.supabase_service import get_supabase_service

router = APIRouter()

# Request Models
class CreateProjectRequest(BaseModel):
    name: str
    domain: str
    company_profile: Optional[Dict[str, Any]] = None

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    status: Optional[str] = None
    company_profile: Optional[Dict[str, Any]] = None
    wp_connection: Optional[Dict[str, Any]] = None


# Endpoints
@router.get("/")
async def list_projects():
    """List all projects"""
    supabase = get_supabase_service()
    projects = await supabase.get_projects()
    return {"success": True, "projects": projects}


@router.post("/")
async def create_project(request: CreateProjectRequest):
    """Create a new project"""
    supabase = get_supabase_service()
    
    project = await supabase.create_project(
        name=request.name,
        domain=request.domain,
        company_profile=request.company_profile
    )
    
    return {"success": True, "project": project}


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get a specific project by ID"""
    supabase = get_supabase_service()
    project = await supabase.get_project(project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"success": True, "project": project}


@router.put("/{project_id}")
async def update_project(project_id: str, request: UpdateProjectRequest):
    """Update a project"""
    supabase = get_supabase_service()
    
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    
    project = await supabase.update_project(project_id, update_data)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"success": True, "project": project}


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    supabase = get_supabase_service()
    
    success = await supabase.delete_project(project_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"success": True, "message": "Project deleted"}


# Crawl Results (cached crawl data for a project)
@router.get("/{project_id}/crawl-results")
async def get_crawl_results(project_id: str):
    """Get cached crawl results for a project"""
    supabase = get_supabase_service()
    results = await supabase.get_crawl_results(project_id)
    return {"success": True, "crawl_results": results}


@router.post("/{project_id}/crawl-results")
async def save_crawl_result(project_id: str, data: Dict[str, Any]):
    """Save a crawl result to the project"""
    supabase = get_supabase_service()
    result = await supabase.save_crawl_result(project_id, data)
    return {"success": True, "crawl_result": result}
