"""
Production Router - API endpoints for content generation (Matrix)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from api.services.gemini_service import get_gemini_service
from api.services.image_service import get_image_service
from api.services.supabase_service import get_supabase_service
from api.services.perplexity_service import get_perplexity_service
import asyncio

from api.services.supabase_service import get_supabase_service
router = APIRouter()

# Models
class ContentTask(BaseModel):
    title: str
    content_type: str = "Article" # Article or Social
    keyword: str
    target_intent: str = "Informational"

class BatchGenerateRequest(BaseModel):
    project_id: str
    tasks: List[ContentTask]
    generate_images: bool = True

class GenerateResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]]

# Endpoints

@router.post("/generate-batch")
async def generate_batch_content(request: BatchGenerateRequest):
    """
    Generate a batch of content (Text + Image) for the Matrix
    """
    gemini = get_gemini_service()
    image_service = get_image_service()
    perplexity = get_perplexity_service()
    supabase = get_supabase_service()
    
    # Get Project Profile (for context)
    project = await supabase.get_project(request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    company_profile = project.get("company_profile", {})
    niche = company_profile.get("industry", "Technology")
    
    # Pre-fetch Social Trends if any social task exists
    social_trends = None
    has_social_tasks = any(t.content_type == "Social" for t in request.tasks)
    
    if has_social_tasks:
        print(f"[Production] Batch has social tasks, fetching trends for {niche}...")
        try:
            trends_result = await perplexity.search_social_trends(niche)
            if trends_result.get("success"):
                social_trends = trends_result
                print("[Production] Social trends fetched successfully")
        except Exception as e:
            print(f"[Production] Failed to fetch social trends: {e}")
    
    results = []
    
    # Process tasks concurrently? 
    # For MVP, we'll do them sequentially or semi-parallel to avoid rate limits
    # But let's try asyncio.gather for Text + Image per task
    
    for task in request.tasks:
        print(f"Processing task: {task.title}")
        
        # Prepare context data
        context_data = None
        if task.content_type == "Social":
            context_data = social_trends
        
        # 1. Generate Text (AI)
        text_future = gemini.generate_content(
            task.title, 
            task.content_type, 
            company_profile,
            context_data=context_data
        )
        
        # 2. Generate Image (DALL-E) - Optional
        image_future = None
        if request.generate_images and task.content_type == "Article":
            image_future = image_service.generate_image(task.title, style="tech")
        elif request.generate_images and task.content_type == "Social":
            image_future = image_service.generate_image(task.title, style="infographic")
            
        # Await both
        if image_future:
             content_text, image_url = await asyncio.gather(text_future, image_future)
        else:
             content_text = await text_future
             image_url = None
             
        # 3. Save to DB (as Content Post)
        post_data = {
            "title": task.title,
            "type": task.content_type,
            "status": "DRAFT",
            "full_content": content_text,
            "image_url": image_url,
            "meta_data": {
                "keyword": task.keyword,
                "target_intent": task.target_intent,
                "used_trends": bool(context_data)
            }
        }
        
        saved_post = await supabase.save_content_post(request.project_id, post_data)
        
        results.append({
            "task_id": saved_post.get("id"),
            "title": task.title,
            "status": "SUCCESS",
            "image_url": image_url
        })
        
    return {
        "success": True,
        "results": results
    }


class SingleContentRequest(BaseModel):
    title: str
    content_type: str = "Article"
    keyword: str
    profile: Optional[Dict[str, Any]] = None


    keyword: str
    profile: Optional[Dict[str, Any]] = None


class TitleGenerationRequest(BaseModel):
    topic: str
    niche: str = "Technology"
    profile: Dict[str, Any] = {}
    use_trends: bool = True

@router.post("/generate-titles")
async def generate_titles(request: TitleGenerationRequest):
    """
    Generate viral titles based on topic and trends
    """
    gemini = get_gemini_service()
    perplexity = get_perplexity_service()
    
    trends_context = ""
    if request.use_trends:
        print(f"[Production] Fetching trends for title generation: {request.niche}")
        try:
            # Use niche + topic for better trend relevance
            query = f"{request.niche} {request.topic} trends"
            trends = await perplexity.search_social_trends(query)
            if trends.get("success"):
                trends_context = trends.get("content", "")
        except Exception as e:
            print(f"Error fetching trends: {e}")
            
    titles = await gemini.generate_titles(
        request.topic,
        request.niche,
        request.profile,
        trends_context
    )
    
    return {
        "success": True,
        "titles": titles,
        "trends_used": bool(trends_context)
    }


@router.post("/generate-single")
async def generate_single_content(request: SingleContentRequest):
    """
    Generate a single piece of content using AI with Deep Research / Social Trends
    """
    gemini = get_gemini_service()
    perplexity = get_perplexity_service()
    
    profile = request.profile or {}
    context_data = None
    
    try:
        # 1. Conduct Research based on content type
        if request.content_type == "Article":
            print(f"[Production] Conducting deep research for: {request.keyword}")
            research = await perplexity.deep_research(request.keyword)
            if research.get("success"):
                context_data = research
        else: # Social
            niche = profile.get("industry", "Technology")
            print(f"[Production] Searching social trends for: {niche}")
            trends = await perplexity.search_social_trends(niche)
            if trends.get("success"):
                context_data = trends
        
        # 2. Generate Content with Context
        content_text = await gemini.generate_content(
            request.title, 
            request.content_type, 
            profile,
            context_data
        )
        
        return {
            "success": True,
            "content": content_text,
            "title": request.title,
            "content_type": request.content_type,
            "research_used": bool(context_data),
            "citations": context_data.get("citations", []) if context_data else []
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

class RegenerateRequest(BaseModel):
    original_content: str
    feedback: str
    content_type: str = "Article"

@router.post("/regenerate")
async def regenerate_content(request: RegenerateRequest):
    """
    Regenerate/Refine content based on user feedback
    """
    gemini = get_gemini_service()
    
    try:
        print(f"[Production] Regenerating content with feedback: {request.feedback[:50]}...")
        new_content = await gemini.regenerate_content(
            request.original_content,
            request.feedback,
            request.content_type
        )
        
        return {
            "success": True,
            "content": new_content
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
