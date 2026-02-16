"""
Crawler Router - API endpoints for web scraping
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
from api.services.firecrawl_service import get_firecrawl_service
from api.services.supabase_service import get_supabase_service

router = APIRouter()

# Request/Response Models
class ScrapeRequest(BaseModel):
    url: str
    formats: List[str] = ["markdown", "html"]
    project_id: Optional[str] = None
    save_to_db: bool = False

class CrawlRequest(BaseModel):
    url: str
    max_pages: int = 10
    include_paths: Optional[List[str]] = None
    exclude_paths: Optional[List[str]] = None
    project_id: Optional[str] = None
    save_to_db: bool = False

class MapRequest(BaseModel):
    url: str

class ExtractRequest(BaseModel):
    url: str
    schema_definition: Dict[str, Any]
    prompt: Optional[str] = None


# Endpoints
@router.post("/scrape")
async def scrape_url(request: ScrapeRequest):
    """
    Scrape a single URL and return content
    
    Use this to:
    - Get content from a company's homepage
    - Extract specific page content for analysis
    """
    service = get_firecrawl_service()
    db = get_supabase_service()

    result = await service.scrape_url(request.url, request.formats)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    # Save single page to KB
    if request.save_to_db and request.project_id:
        data = result.get("data", {})
        page_data = {
            "url": request.url,
            "content": data.get("markdown", "") if isinstance(data, dict) else getattr(data, 'markdown', ''),
            "metadata": data.get("metadata", {}) if isinstance(data, dict) else getattr(data, 'metadata', {})
        }
        await db.save_crawl_result(request.project_id, page_data)
        result["saved_to_kb"] = True

    return result


@router.post("/crawl")
async def crawl_website(request: CrawlRequest):
    """
    Crawl an entire website
    
    Use this to:
    - Analyze a competitor's full site structure
    - Gather all content pages for gap analysis
    """
    service = get_firecrawl_service()
    db = get_supabase_service()
    
    # 1. Execute Crawl
    result = await service.crawl_website(
        request.url,
        request.max_pages,
        request.include_paths,
        request.exclude_paths
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # 2. Save to Knowledge Base (DB) if requested
    if request.save_to_db and request.project_id:
        print(f"saving crawl results for project {request.project_id}")
        data = result.get("data", {})
        # If firecrawl returns a list of pages in 'data'
        pages = []
        if hasattr(data, 'data'):
             pages = data.data
        elif isinstance(data, list):
             pages = data
        
        saved_count = 0
        for page in pages:
            # Normalized page object
            page_data = {
                "url": page.get("metadata", {}).get("sourceURL", request.url),
                "content": page.get("markdown", "") or page.get("content", ""),
                "metadata": page.get("metadata", {})
            }
            await db.save_crawl_result(request.project_id, page_data)
            saved_count += 1
        
        result["saved_to_kb"] = True
        result["saved_count"] = saved_count
        
    return result


@router.post("/map")
async def map_urls(request: MapRequest):
    """
    Get all URLs from a website (sitemap)
    
    Use this to:
    - Discover all pages on a website
    - Plan which pages to analyze
    """
    service = get_firecrawl_service()
    result = await service.map_urls(request.url)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/extract")
async def extract_structured(request: ExtractRequest):
    """
    Extract structured data from a URL using AI
    
    Use this to:
    - Extract company info (name, products, services)
    - Pull competitor pricing/features
    """
    service = get_firecrawl_service()
    result = await service.extract_structured(
        request.url,
        request.schema_definition,
        request.prompt
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result
