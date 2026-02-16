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
    user_id: Optional[str] = None

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    status: Optional[str] = None
    company_profile: Optional[Dict[str, Any]] = None
    wp_connection: Optional[Dict[str, Any]] = None


# Endpoints
@router.get("/")
async def list_projects(user_id: Optional[str] = None):
    """List all projects, optionally filtered by user"""
    supabase = get_supabase_service()
    projects = await supabase.get_projects(user_id=user_id)
    print(f"DEBUG: list_projects fetched {len(projects)} projects for user {user_id}")
    return {"success": True, "data": projects}


@router.post("/")
async def create_project(request: CreateProjectRequest):
    """Create a new project"""
    supabase = get_supabase_service()
    
    project = await supabase.create_project(
        name=request.name,
        domain=request.domain,
        company_profile=request.company_profile,
        user_id=request.user_id
    )
    
    return {"success": True, "data": project}


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get a specific project by ID"""
    supabase = get_supabase_service()
    project = await supabase.get_project(project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"success": True, "data": project}


@router.put("/{project_id}")
async def update_project(project_id: str, request: UpdateProjectRequest):
    """Update a project"""
    supabase = get_supabase_service()
    
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    
    project = await supabase.update_project(project_id, update_data)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"success": True, "data": project}


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
    return {"success": True, "data": results}


@router.post("/{project_id}/crawl-results")
async def save_crawl_result(project_id: str, data: Dict[str, Any]):
    """Save a crawl result to the project"""
    supabase = get_supabase_service()
    result = await supabase.save_crawl_result(project_id, data)
    return {"success": True, "data": result}


# ==================== History / Persistence Endpoints ====================

@router.get("/{project_id}/reports")
async def get_project_reports(project_id: str):
    """Get saved analysis reports"""
    supabase = get_supabase_service()
    reports = await supabase.get_analysis_reports(project_id)
    return {"success": True, "data": reports}

@router.get("/{project_id}/keywords")
async def get_project_keywords(project_id: str):
    """Get saved keywords"""
    supabase = get_supabase_service()
    keywords = await supabase.get_keywords(project_id)
    return {"success": True, "data": keywords}

@router.get("/{project_id}/posts")
async def get_project_posts(project_id: str):
    """Get generated content posts"""
    supabase = get_supabase_service()
    posts = await supabase.get_content_posts(project_id)
    return {"success": True, "data": posts}


# ==================== Task Management ====================

@router.get("/{project_id}/tasks")
async def get_project_tasks(project_id: str):
    """Get all tasks for a project"""
    supabase = get_supabase_service()
    tasks = await supabase.get_tasks(project_id)
    return {"success": True, "data": tasks}

@router.post("/{project_id}/tasks/batch")
async def create_task_batch(project_id: str, tasks: List[Dict[str, Any]]):
    """Create a batch of tasks"""
    supabase = get_supabase_service()
    created_tasks = []
    
    for task in tasks:
        # Ensure task has necessary fields
        task_data = {
            "id": task.get("id"),
            "batch_id": task.get("batchId"),
            "title": task.get("title"),
            "branch": task.get("branch"), # Article/Social
            "status": "Pending", # Initial status
            "created_at": datetime.utcnow().isoformat(),
            "meta_data": {
                "type": task.get("type"),
                "profile": task.get("profile")
            }
        }
        res = await supabase.create_task(project_id, task_data)
        if "error" not in res:
            created_tasks.append(res)
            
    return {"success": True, "data": created_tasks}

@router.patch("/tasks/{task_id}")
async def update_task_status(task_id: str, update_data: Dict[str, Any]):
    """Update a task's status and content"""
    supabase = get_supabase_service()
    
    # field mapping: frontend -> db
    db_update = {}
    if "genStatus" in update_data:
        db_update["status"] = update_data["genStatus"]
    if "pubStatus" in update_data:
        db_update["publish_status"] = update_data["pubStatus"]
    if "content" in update_data:
        db_update["content"] = update_data["content"]
        
    result = await supabase.update_task(task_id, db_update)
    
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return {"success": True, "data": result}
