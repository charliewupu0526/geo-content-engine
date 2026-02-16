"""
Intelligence Router - API endpoints for AI-powered analysis
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from urllib.parse import urlparse

from api.services.firecrawl_service import get_firecrawl_service
from api.services.gemini_service import get_gemini_service
from api.services.search_service import get_search_service
from api.services.analysis_service import get_analysis_service
from api.services.perplexity_service import get_perplexity_service
from api.services.seo_service import get_seo_service
from api.services.supabase_service import get_supabase_service

router = APIRouter()

# Request Models
class AnalyzeCompanyRequest(BaseModel):
    url: str
    company_name: Optional[str] = None

class AnalyzeCompetitorRequest(BaseModel):
    company_profile: Dict[str, Any]
    competitor_urls: List[str]
    project_id: Optional[str] = None  # Added for persistence

class GenerateProfileRequest(BaseModel):
    company_name: str
    domain: str
    scraped_content: Optional[Dict[str, Any]] = None
    niche: Optional[str] = None
    region: Optional[str] = "Global"

class DeepGapAnalysisRequest(BaseModel):
    project_id: str

class DiscoverCompetitorsRequest(BaseModel):
    niche: str
    company_name: Optional[str] = None
    domain: Optional[str] = None

class GenerateKeywordsRequest(BaseModel):
    profile: Dict[str, Any]
    project_id: Optional[str] = None  # Added for persistence

class CitationTestRequest(BaseModel):
    query: str

class CompetitorCitationRequest(BaseModel):
    niche: str
    num_queries: int = 5

class SEORankingRequest(BaseModel):
    domain: str
    keyword: str

class EnhancedKeywordsRequest(BaseModel):
    niche: str
    domain: str = ""
    profile: Dict[str, Any] = {}
    gap_report: Dict[str, Any] = {}
    competitor_urls: List[str] = []
    project_id: Optional[str] = None  # Added for persistence


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
    perplexity = get_perplexity_service()
    
    try:
        # Step 1: Scrape the website
        # Validate and clean URL
        if not request.url:
            raise HTTPException(status_code=400, detail="URL is required")
            
        cleaned_url = request.url.strip()
        if not cleaned_url.startswith(('http://', 'https://')):
            cleaned_url = 'https://' + cleaned_url
            
        # Basic validation
        try:
            parsed = urlparse(cleaned_url)
            if not parsed.netloc or '.' not in parsed.netloc:
                 raise ValueError("Invalid domain")
        except Exception:
             return {
                "success": False,
                "error": f"Invalid URL format: {cleaned_url}. Please enter a valid website URL (e.g., example.com)."
            }

        print(f"Scraping Normalized URL: '{cleaned_url}'")
        scrape_result = await firecrawl.scrape_url(cleaned_url, ["markdown"])
        
        # Extract content from scrape result
        content = ""
        if scrape_result["success"]:
            data = scrape_result.get("data", {})
            if isinstance(data, dict):
                content = data.get("markdown", "")
            else:
                content = getattr(data, 'markdown', '') if data else ""
        
        # If scrape failed or no content extracted, use Perplexity fallback
        if not content:
            scrape_error = scrape_result.get("error", "No content extracted")
            print(f"Scrape failed or empty: {scrape_error}")
            
            if request.company_name:
                # === Perplexity Fallback ===
                print("Falling back to Perplexity search for brand info...")
                perplexity_result = await perplexity.search_brand_info(
                    request.company_name, 
                    request.url
                )
                
                if perplexity_result.get("success") and perplexity_result.get("content"):
                    # Use Perplexity search results as context for AI analysis
                    print(f"Perplexity search successful, analyzing {len(perplexity_result['content'])} chars")
                    
                    # Wrap Perplexity content with source attribution
                    perplexity_content = (
                        f"以下是通过 Perplexity AI 搜索引擎获取的关于「{request.company_name}」的品牌信息：\n\n"
                        f"{perplexity_result['content']}"
                    )
                    
                    company_data = await gemini.analyze_company_content(
                        perplexity_content, 
                        request.company_name
                    )
                    
                    if "error" in company_data:
                        return {
                            "success": False,
                            "error": f"Scrape failed and AI analysis of Perplexity data failed: {company_data['error']}"
                        }
                    
                    return {
                        "success": True,
                        "url": request.url,
                        "company_profile": company_data,
                        "data_source": "perplexity_search",
                        "perplexity_citations": perplexity_result.get("citations", []),
                        "note": f"网站爬取失败({scrape_error})，已通过 Perplexity 搜索获取品牌信息进行分析。"
                    }
                else:
                    # Perplexity also failed, fall back to AI generation from name only
                    perplexity_error = perplexity_result.get("error", "Unknown")
                    print(f"Perplexity fallback also failed: {perplexity_error}")
                    print("Final fallback: AI generation from company name only")
                    
                    company_data = await gemini.generate_company_profile(
                        request.company_name, 
                        request.url
                    )
                    
                    if "error" in company_data:
                        return {
                            "success": False,
                            "error": f"All data sources failed - Scrape: {scrape_error}, Perplexity: {perplexity_error}, AI: {company_data['error']}"
                        }
                    
                    return {
                        "success": True,
                        "url": request.url,
                        "company_profile": company_data.get("profile_text", ""),
                        "data_source": "ai_generated",
                        "note": f"网站爬取和 Perplexity 搜索均失败，仅基于品牌名称生成（准确性较低）。"
                    }
            else:
                return {
                    "success": False,
                    "error": f"Scrape failed: {scrape_result.get('error')}"
                }
        
        # Step 2: Use OpenAI to analyze the scraped content
        print(f"Analyzing scraped content length: {len(content)}")
        company_data = await gemini.analyze_company_content(content, request.company_name)
        
        # 检查是否返回了错误
        if "error" in company_data:
            return {
                "success": False, 
                "error": f"OpenAI Error: {company_data['error']}",
                "raw_error": str(company_data)
            }
        
        return {
            "success": True,
            "url": request.url,
            "company_profile": company_data,
            "data_source": "website_scrape",
            "scraped_content_preview": content[:1000] if content else None
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": f"Server Exception: {str(e)}"
        }


@router.post("/analyze-competitor")
async def analyze_competitor(request: AnalyzeCompetitorRequest):
    """
    Analyze competitors and compare with company profile
    
    This endpoint:
    1. Crawls our own website for real content
    2. Crawls competitor websites
    3. Generates side-by-side gap analysis with real content quotes
    4. Saves the result to database (if project_id provided)
    """
    firecrawl = get_firecrawl_service()
    gemini = get_gemini_service()
    supabase = get_supabase_service()
    
    # Step 1: Scrape our own site for comparison material
    our_site_content = ""
    our_domain = request.company_profile.get("domain", "") or request.company_profile.get("website", "")
    perplexity = get_perplexity_service() # Get service instance

    if our_domain:
        try:
            our_url = our_domain if our_domain.startswith('http') else f'https://{our_domain}'
            print(f"[GapAnalysis] Scraping our site: {our_url}")
            our_scrape = await firecrawl.scrape_url(our_url, ["markdown"])
            if our_scrape.get("success"):
                data = our_scrape.get("data", {})
                our_site_content = data.get("markdown", "") if isinstance(data, dict) else getattr(data, 'markdown', '')
                print(f"[GapAnalysis] Got {len(our_site_content)} chars from our site")
        except Exception as e:
            print(f"[GapAnalysis] Our site scrape failed: {e}")
            
    # Fallback: If scrape failed or empty, use Perplexity to get "My Brand" info
    if not our_site_content and (request.company_profile.get("company_name") or our_domain):
        brand = request.company_profile.get("company_name", "My Brand")
        print(f"[GapAnalysis] Scraping failed, falling back to Perplexity for {brand}")
        bp = await perplexity.search_brand_info(brand, our_domain)
        if bp.get("success"):
            our_site_content = f"Perplexity Brand Research for {brand}:\n{bp.get('content', '')}"
            print(f"[GapAnalysis] Got {len(our_site_content)} chars from Perplexity fallback")
    
    # Step 2: Scrape competitor websites
    competitor_data = []
    
    for url in request.competitor_urls[:3]:  # Limit to 3 competitors
        try:
            print(f"[GapAnalysis] Scraping competitor: {url}")
            scrape_result = await firecrawl.scrape_url(url, ["markdown"])
            if scrape_result.get("success"):
                data = scrape_result.get("data", {})
                content = data.get("markdown", "") if isinstance(data, dict) else getattr(data, 'markdown', '')
                competitor_data.append({
                    "url": url,
                    "content": content[:6000],  # Increased for richer comparison
                    "success": True
                })
                print(f"[GapAnalysis] Got {len(content)} chars from {url}")
            else:
                competitor_data.append({
                    "url": url,
                    "error": scrape_result.get("error"),
                    "success": False
                })
        except Exception as e:
            competitor_data.append({
                "url": url,
                "error": str(e),
                "success": False
            })
    
    # Step 3: Generate gap analysis with real content from BOTH sides
    gap_analysis = await gemini.generate_gap_analysis(
        request.company_profile,
        competitor_data,
        our_site_content=our_site_content[:5000]
    )

    result = {
        "success": True,
        "competitors_analyzed": len([c for c in competitor_data if c["success"]]),
        "our_site_scraped": bool(our_site_content),
        "competitor_data": competitor_data,
        "gap_analysis": gap_analysis
    }
    
    # Step 4: Save to Database
    if request.project_id:
        print(f"[GapAnalysis] Saving report to project {request.project_id}")
        try:
            await supabase.save_analysis_report(
                project_id=request.project_id,
                report_type="gap_analysis",
                data=gap_analysis
            )
            print("[GapAnalysis] Report saved successfully")
        except Exception as e:
            print(f"[GapAnalysis] Failed to save report: {e}")

    return result


@router.post("/generate-profile")
async def generate_profile(request: GenerateProfileRequest):
    """
    Generate a comprehensive company profile for GEO optimization
    
    This endpoint:
    1. Scrapes the company website (if not already done)
    2. Queries Perplexity for latest brand news & strategy
    3. Synthesizes a deep, professional brand profile
    """
    gemini = get_gemini_service()
    perplexity = get_perplexity_service()
    firecrawl = get_firecrawl_service()
    
    # Step 1: Get website content if not already provided
    scraped_content = request.scraped_content
    if not scraped_content and request.domain:
        try:
            domain = request.domain.strip()
            url = domain if domain.startswith('http') else f'https://{domain}'
            print(f"[Profile] Scraping website: {url}")
            scrape_result = await firecrawl.scrape_url(url, ["markdown"])
            if scrape_result.get("success"):
                data = scrape_result.get("data", {})
                content = data.get("markdown", "") if isinstance(data, dict) else getattr(data, 'markdown', '')
                if content:
                    scraped_content = {"markdown": content[:8000]}
                    print(f"[Profile] Scraped {len(content)} chars from website")
        except Exception as e:
            print(f"[Profile] Website scrape failed (non-critical): {e}")
    
    # Step 2: Query Perplexity for latest brand news/strategy
    latest_news = ""
    try:
        news_query = (
            f"请提供关于 {request.company_name} 的最新动态和市场策略分析。"
            f"包括：近期重大产品发布、合作伙伴关系、融资/收购、市场扩张、"
            f"最新的公司战略方向、行业趋势回应等。"
            f"请用中文回答，提供具体的时间点和事实。"
        )
        print(f"[Profile] Querying Perplexity for latest news about {request.company_name}")
        news_result = await perplexity.test_citation(news_query)
        if news_result.get("answer"):
            latest_news = news_result["answer"]
            print(f"[Profile] Got {len(latest_news)} chars from lastest news")
    except Exception as e:
        print(f"[Profile] Perplexity news query failed (non-critical): {e}")
    
    # Step 3: Generate enhanced profile
    profile = await gemini.generate_company_profile(
        company_name=request.company_name,
        domain=request.domain,
        scraped_content=scraped_content,
        latest_news=latest_news
    )
    
    return {
        "success": True,
        "profile": profile,
        "enrichment": {
            "has_website_data": bool(scraped_content),
            "has_latest_news": bool(latest_news),
            "news_length": len(latest_news)
        }
    }


@router.post("/discover-competitors")
async def discover_competitors(request: DiscoverCompetitorsRequest):
    """
    Discover top competitors in a specific niche
    
    This endpoint:
    1. Uses AI to simulate "Search Agent" behavior
    2. Identifies top products/companies in the field
    3. Returns structured market intelligence
    """
    search_service = get_search_service()
    
    user_brand_info = None
    if request.company_name or request.domain:
        user_brand_info = {
            "name": request.company_name,
            "domain": request.domain
        }
    
    competitors = await search_service.discover_competitors(request.niche, user_brand_info)
    
    return {
        "success": True,
        "niche": request.niche,
        "competitors": competitors,
        "count": len(competitors)
    }


class DiscoverHiddenCompetitorsRequest(BaseModel):
    company_profile: Dict[str, Any]

@router.post("/discover-hidden-competitors")
async def discover_hidden_competitors(request: DiscoverHiddenCompetitorsRequest):
    """
    Discover hidden/indirect competitors based on company profile
    """
    search_service = get_search_service()
    
    hidden_competitors = await search_service.find_hidden_competitors(request.company_profile)
    
    return {
        "success": True,
        "hidden_competitors": hidden_competitors,
        "count": len(hidden_competitors)
    }


@router.post("/analyze/gap-deep")
async def analyze_gap_deep(request: DeepGapAnalysisRequest):
    """
    Perform deep gap analysis using the Knowledge Base
    
    This endpoint:
    1. Aggregates all crawled competitor data
    2. Performs deep comparison against user profile
    3. Returns actionable strategic advice
    4. Saves report to database
    """
    analysis_service = get_analysis_service()
    supabase = get_supabase_service()
    
    result = await analysis_service.perform_deep_gap_analysis(request.project_id)
    
    if "error" in result:
        return {
            "success": False,
            "error": result["error"]
        }
    
    # Save report to Supabase
    await supabase.save_analysis_report(
        project_id=request.project_id,
        report_type="deep_gap_analysis",
        data=result
    )
    
    return {
        "success": True,
        "data": result
    }


@router.post("/generate-keywords")
async def generate_keywords(request: GenerateKeywordsRequest):
    """
    Generate GEO-optimized keywords from company profile (legacy)
    """
    gemini = get_gemini_service()
    supabase = get_supabase_service()
    
    keywords = await gemini.generate_keywords(request.profile)
    
    # Save to DB if project_id is provided
    if request.project_id and keywords:
        print(f"[Keywords] Saving {len(keywords)} legacy keywords to Supabase")
        # Format for saving
        formatted_keywords = []
        for kw in keywords:
            formatted_keywords.append({
                "keyword": kw.get("keyword", kw.get("title", "")),
                "data": kw,
                "source": "ai_generated_legacy"
            })
        await supabase.save_keywords(request.project_id, formatted_keywords)
        
    return {
        "success": True,
        "keywords": keywords,
        "count": len(keywords)
    }


def extract_brand_name(url: str) -> str:
    """Extract brand name from URL (e.g., https://www.shopify.com -> shopify)"""
    try:
        if not url.strip():
            return ""
        if not url.startswith('http'):
            url = 'http://' + url
        domain = urlparse(url).netloc
        # remove www.
        domain = domain.replace('www.', '')
        # get first part
        brand = domain.split('.')[0].lower()
        return brand
    except:
        return ""

@router.post("/generate-keywords-enhanced")
async def generate_keywords_enhanced(request: EnhancedKeywordsRequest):
    """
    Enhanced keyword generation from 3 real data sources:
    
    1. Google SERP Rankings — real trending keywords via SerpApi
    2. Competitor Gap Keywords — market-validated gaps from gap report
    3. AI Brand Keywords — profile-based AI recommendations
    
    Returns merged, deduplicated, and scored keyword list.
    """
    seo = get_seo_service()
    gemini = get_gemini_service()
    supabase = get_supabase_service()
    
    all_keywords = []
    sources_status = {
        "google_serp": {"count": 0, "status": "pending"},
        "competitor_gap": {"count": 0, "status": "pending"},
        "ai_generated": {"count": 0, "status": "pending"}
    }
    
    # ── Source 1: Google SERP Keywords ──
    try:
        # Strategy: User Search Simulation (AI-First)
        simulation_queries = []
        if request.profile:
            print(f"[Keywords] Generating User Search Simulation queries...")
            simulation_queries = await gemini.generate_search_simulation(request.profile, n=5)
            print(f"[Keywords] Simulated queries: {simulation_queries}")
        
        # Fallback if AI fails: use Product Name or Niche
        search_term = request.niche
        if not simulation_queries and request.profile:
             # Try to find a more specific product name
            candidates = [
                request.profile.get("product_name"),
                request.profile.get("core_product"),
                request.profile.get("service_name"),
            ]
            for c in candidates:
                if c and isinstance(c, str) and len(c) > 2:
                    search_term = c
                    break
        
        print(f"[Keywords] Discovering SERP keywords for: {search_term} (Custom Queries: {len(simulation_queries)})")
        
        serp_keywords = await seo.discover_trending_keywords(
            niche=search_term,
            domain=request.domain,
            custom_queries=simulation_queries
        )
        
        for kw in serp_keywords:
            all_keywords.append({
                "keyword": kw["keyword"],
                "source": "google_serp",
                "serp_position": kw.get("serp_position"),
                "our_ranking": kw.get("our_ranking"),
                "snippet": kw.get("snippet", ""),
                "is_long_tail": kw.get("is_long_tail", False),
                "is_question": kw.get("is_question", False),
                "intent": "Commercial" if kw.get("is_long_tail") else "Informational"
            })
        sources_status["google_serp"] = {"count": len(serp_keywords), "status": "ok"}
        print(f"[Keywords] Got {len(serp_keywords)} SERP keywords")
    except Exception as e:
        print(f"[Keywords] SERP keyword discovery failed: {e}")
        sources_status["google_serp"]["status"] = f"error: {str(e)[:100]}"
    
    # ── Source 2: Competitor Gap Keywords ──
    try:
        gap = request.gap_report
        missing_kw_clusters = gap.get("missingKeywords", gap.get("gap_analysis", {}).get("missingKeywords", []))
        
        for cluster in missing_kw_clusters:
            cluster_name = cluster.get("cluster", "")
            priority = cluster.get("priority", "Medium")
            for kw in cluster.get("keywords", []):
                all_keywords.append({
                    "keyword": kw,
                    "source": "competitor_gap",
                    "cluster": cluster_name,
                    "priority": priority,
                    "intent": "Commercial" if priority in ["High", "极高", "高"] else "Informational"
                })
        
        gap_count = sum(len(c.get("keywords", [])) for c in missing_kw_clusters)
        sources_status["competitor_gap"] = {"count": gap_count, "status": "ok"}
        print(f"[Keywords] Extracted {gap_count} competitor gap keywords")
    except Exception as e:
        print(f"[Keywords] Competitor gap extraction failed: {e}")
        sources_status["competitor_gap"]["status"] = f"error: {str(e)[:100]}"
    
    # ── Source 3: AI-Generated Brand Keywords ──
    try:
        if request.profile:
            print(f"[Keywords] Generating AI brand keywords...")
            ai_keywords = await gemini.generate_keywords(request.profile)
            for kw in (ai_keywords if isinstance(ai_keywords, list) else []):
                all_keywords.append({
                    "keyword": kw.get("keyword", kw.get("title", "")),
                    "title": kw.get("title", ""),
                    "source": "ai_generated",
                    "intent": kw.get("intent", "Informational"),
                    "template": kw.get("template", ""),
                    "estimatedWords": kw.get("estimatedWords", 1500)
                })
            sources_status["ai_generated"] = {"count": len(ai_keywords) if isinstance(ai_keywords, list) else 0, "status": "ok"}
            print(f"[Keywords] Generated {len(ai_keywords) if isinstance(ai_keywords, list) else 0} AI keywords")
    except Exception as e:
        print(f"[Keywords] AI keyword generation failed: {e}")
        sources_status["ai_generated"]["status"] = f"error: {str(e)[:100]}"
    
    # ── Deduplicate & Filter by Competitor Brand ──
    
    # 1. Extract competitor brands from URLs and Gap Report
    competitor_brands = set()
    
    # From explicit URLs
    if request.competitor_urls:
        for url in request.competitor_urls:
            brand = extract_brand_name(url)
            if brand and len(brand) > 2: 
                competitor_brands.add(brand)
                
    # From Gap Report (if available)
    if request.gap_report:
        # Check 'competitors' list in gap report
        gap_competitors = request.gap_report.get("competitors", [])
        if isinstance(gap_competitors, list):
            for comp in gap_competitors:
                # Try to get name
                if isinstance(comp, dict):
                    name = comp.get("name", "").lower().strip()
                    if name and len(name) > 2:
                        competitor_brands.add(name)
                    
                    # Try to get URL
                    url = comp.get("url", comp.get("website", ""))
                    if url:
                        brand = extract_brand_name(url)
                        if brand and len(brand) > 2:
                            competitor_brands.add(brand)

    print(f"[Keywords] Filtering out competitor brands: {competitor_brands}")

    seen = set()
    unique_keywords = []
    
    for kw in all_keywords:
        key = kw["keyword"].lower().strip()
        
        # 2. Check if keyword contains competitor brand
        is_competitor = False
        for brand in competitor_brands:
            # Simple check: if brand is a distinct word in the keyword
            # e.g. "shopify" in "shopify pricing" -> True
            # e.g. "shop" in "shopify" -> True (Problematic?)
            # Let's use simple containment for now as brands are usually distinct
            if brand in key:
                is_competitor = True
                break
        
        if is_competitor:
            continue

        if key and key not in seen:
            seen.add(key)
            unique_keywords.append(kw)
    
    print(f"[Keywords] Total: {len(all_keywords)} → Unique: {len(unique_keywords)}")
    
    # Save keywords if project_id is provided
    if request.project_id:
        print(f"[Keywords] Saving {len(unique_keywords)} keywords to Supabase for project {request.project_id}")
        await supabase.save_keywords(request.project_id, unique_keywords)

    return {
        "success": True,
        "keywords": unique_keywords,
        "count": len(unique_keywords),
        "sources": sources_status
    }


# ==================== Citation Testing API ====================

@router.post("/test-citation")
async def test_citation(request: CitationTestRequest):
    """
    Test AI citation by querying Perplexity and extracting cited sources
    
    Returns the AI response along with all cited URLs
    """
    perplexity = get_perplexity_service()
    
    result = await perplexity.test_citation(request.query)
    
    if "error" in result and result.get("citations", []) == []:
        return {
            "success": False,
            "error": result["error"],
            "query": request.query
        }
    
    return {
        "success": True,
        "query": request.query,
        "answer": result.get("answer", ""),
        "citations": result.get("citations", []),
        "citation_count": len(result.get("citations", []))
    }


@router.post("/analyze-competitor-citations")
async def analyze_competitor_citations(request: CompetitorCitationRequest):
    """
    Analyze which sources are cited for a specific niche
    
    Runs multiple queries and aggregates citation data to identify
    learning targets (most-cited sources)
    """
    perplexity = get_perplexity_service()
    
    result = await perplexity.analyze_competitors_citations(
        request.niche, 
        request.num_queries
    )
    
    return {
        "success": True,
        "data": result
    }


@router.post("/identify-learning-targets")
async def identify_learning_targets(citations: List[Dict[str, Any]]):
    """
    Analyze a list of citations to identify learning targets
    """
    perplexity = get_perplexity_service()
    
    targets = await perplexity.identify_learning_targets(citations)
    
    return {
        "success": True,
        "learning_targets": targets,
        "count": len(targets)
    }


# ==================== SEO Analysis API ====================

@router.post("/seo-ranking")
async def get_seo_ranking(request: SEORankingRequest):
    """
    Get SERP ranking for a domain on a specific keyword
    
    Uses SerpApi to check Google rankings
    """
    seo = get_seo_service()
    
    result = await seo.get_serp_rankings(request.keyword, request.domain)
    
    if "error" in result:
        return {
            "success": False,
            "error": result["error"]
        }
    
    return {
        "success": True,
        "data": result
    }


@router.get("/pagespeed/{encoded_url:path}")
async def get_pagespeed(encoded_url: str):
    """
    Get Google PageSpeed Insights for a URL (FREE API)
    
    Returns performance score and Core Web Vitals
    """
    seo = get_seo_service()
    
    # Decode URL if needed
    url = encoded_url if encoded_url.startswith("http") else f"https://{encoded_url}"
    
    result = await seo.get_pagespeed_score(url)
    
    if "error" in result:
        return {
            "success": False,
            "error": result["error"]
        }
    
    return {
        "success": True,
        "data": result
    }
