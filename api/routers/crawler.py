"""
Crawler Router - API endpoints for web scraping
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
from api.services.firecrawl_service import get_firecrawl_service

router = APIRouter()

# Request/Response Models
class ScrapeRequest(BaseModel):
    url: str
    formats: List[str] = ["markdown", "html"]

class CrawlRequest(BaseModel):
    url: str
    max_pages: int = 10
    include_paths: Optional[List[str]] = None
    exclude_paths: Optional[List[str]] = None

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
    result = await service.scrape_url(request.url, request.formats)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
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
    result = await service.crawl_website(
        request.url,
        request.max_pages,
        request.include_paths,
        request.exclude_paths
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
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
