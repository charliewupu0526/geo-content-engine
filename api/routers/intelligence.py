"""
Intelligence Router - API endpoints for AI-powered analysis
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from api.services.firecrawl_service import get_firecrawl_service
from api.services.gemini_service import get_gemini_service

router = APIRouter()

# Request Models
class AnalyzeCompanyRequest(BaseModel):
    url: str
    company_name: Optional[str] = None

class AnalyzeCompetitorRequest(BaseModel):
    company_profile: Dict[str, Any]
    competitor_urls: List[str]

class GenerateProfileRequest(BaseModel):
    company_name: str
    domain: str
    scraped_content: Optional[Dict[str, Any]] = None


# Endpoints
@router.post("/analyze-company")
async def analyze_company(request: AnalyzeCompanyRequest):
    """
    Analyze a company website to extract key information
    
    This endpoint:
    1. Scrapes the company website
    2. Extracts structured company profile using AI
    3. Returns a comprehensive company analysis
    """
    firecrawl = get_firecrawl_service()
    gemini = get_gemini_service()
    
    # Step 1: Scrape the website
    scrape_result = await firecrawl.scrape_url(request.url, ["markdown"])
    if not scrape_result["success"]:
        raise HTTPException(status_code=400, detail=f"Failed to scrape URL: {scrape_result['error']}")
    
    # Step 2: Get markdown content
    data = scrape_result.get("data", {})
    if isinstance(data, dict):
        content = data.get("markdown", "")
    else:
        content = getattr(data, 'markdown', '') if data else ""
    
    if not content:
        raise HTTPException(status_code=400, detail="No content extracted from URL")
    
    # Step 3: Use OpenAI to analyze the scraped content
    company_data = await gemini.analyze_company_content(content, request.company_name)
    
    return {
        "success": True,
        "url": request.url,
        "company_profile": company_data,
        "scraped_content_preview": content[:1000] if content else None
    }


@router.post("/analyze-competitor")
async def analyze_competitor(request: AnalyzeCompetitorRequest):
    """
    Analyze competitors and compare with company profile
    
    This endpoint:
    1. Crawls competitor websites
    2. Extracts their content strategies
    3. Generates gap analysis comparing to your company
    """
    firecrawl = get_firecrawl_service()
    gemini = get_gemini_service()
    
    competitor_data = []
    
    for url in request.competitor_urls[:3]:  # Limit to 3 competitors
        # Scrape competitor
        scrape_result = await firecrawl.scrape_url(url, ["markdown"])
        if scrape_result["success"]:
            content = scrape_result["data"].get("markdown", "")
            competitor_data.append({
                "url": url,
                "content": content[:5000],  # Limit content size
                "success": True
            })
        else:
            competitor_data.append({
                "url": url,
                "error": scrape_result.get("error"),
                "success": False
            })
    
    # Generate gap analysis using Gemini
    gap_analysis = await gemini.generate_gap_analysis(
        request.company_profile,
        competitor_data
    )
    
    return {
        "success": True,
        "competitors_analyzed": len([c for c in competitor_data if c["success"]]),
        "competitor_data": competitor_data,
        "gap_analysis": gap_analysis
    }


@router.post("/generate-profile")
async def generate_profile(request: GenerateProfileRequest):
    """
    Generate a comprehensive company profile for GEO optimization
    
    This endpoint creates the structured profile needed for
    AI search engine optimization.
    """
    gemini = get_gemini_service()
    
    profile = await gemini.generate_company_profile(
        company_name=request.company_name,
        domain=request.domain,
        scraped_content=request.scraped_content
    )
    
    return {
        "success": True,
        "profile": profile
    }
