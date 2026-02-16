"""
Publishing Router - API endpoints for publishing content
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from api.services.publishing_service import get_publishing_service
from api.services.supabase_service import get_supabase_service

router = APIRouter()

# Models
class WordPressConfig(BaseModel):
    url: str
    username: str
    app_password: str

class PublishRequest(BaseModel):
    project_id: str
    platform: str # "wordpress", "twitter", "linkedin"
    content_data: Dict[str, Any] # { title, content, image_url }
    config: Optional[WordPressConfig] = None # For WordPress

class PublishResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Endpoints

@router.post("/publish")
async def publish_content(request: PublishRequest):
    """
    Publish content to specified platform
    """
    service = get_publishing_service()
    
    if request.platform == "wordpress":
        if not request.config:
            raise HTTPException(status_code=400, detail="WordPress config required")
            
        result = await service.publish_to_wordpress(
            wp_url=request.config.url,
            username=request.config.username,
            app_password=request.config.app_password,
            title=request.content_data.get("title", ""),
            content=request.content_data.get("content", ""),
            status="draft" # Safety first
        )
        return result
        
    elif request.platform in ["twitter", "linkedin"]:
        result = await service.simulate_social_publish(
            platform=request.platform,
            content=request.content_data.get("content", ""),
            image_url=request.content_data.get("image_url")
        )
        return result
        
    else:
        raise HTTPException(status_code=400, detail=f"Platform {request.platform} not supported")

@router.get("/export/{project_id}")
async def export_project_data(project_id: str, format: str = "json"):
    """
    Export all generated content for a project
    """
    db = get_supabase_service()
    tasks = await db.get_tasks(project_id)
    
    if format == "json":
        return {"project_id": project_id, "tasks": tasks}
    
    # CSV implementation omitted for brevity in MVP
    return {"project_id": project_id, "tasks": tasks}
