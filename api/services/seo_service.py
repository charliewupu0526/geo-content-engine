"""
SEO Service - Third-party SEO Tool Integration

Integrates with:
1. SerpApi - Google SERP rankings (100 free queries/month)
2. Google PageSpeed API - Core Web Vitals (free)
"""

import httpx
from typing import Dict, Any, Optional
from api.config import get_settings


class SEOService:
    """Service for third-party SEO data"""
    
    def __init__(self):
        settings = get_settings()
        self.serpapi_key = settings.serpapi_key
        
        if self.serpapi_key:
            print(f"SEO Service initialized with SerpApi Key: {self.serpapi_key[:8]}...")
        else:
            print("SEO Service initialized WITHOUT SerpApi Key")
    
    async def get_serp_rankings(
        self, 
        keyword: str, 
        domain: str,
        location: str = "United States"
    ) -> Dict[str, Any]:
        """
        Get SERP rankings for a keyword using SerpApi
        
        Returns position and ranking data for the specified domain
        """
        if not self.serpapi_key:
            return {
                "error": "SerpApi key not configured",
                "keyword": keyword,
                "domain": domain
            }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    "https://serpapi.com/search",
                    params={
                        "api_key": self.serpapi_key,
                        "engine": "google",
                        "q": keyword,
                        "location": location,
                        "num": 20  # Top 20 results
                    }
                )
                
                if response.status_code != 200:
                    return {
                        "error": f"SerpApi error: {response.status_code}",
                        "keyword": keyword
                    }
                
                data = response.json()
                organic_results = data.get("organic_results", [])
                
                # Find domain ranking
                domain_position = None
                domain_result = None
                
                for idx, result in enumerate(organic_results):
                    result_url = result.get("link", "")
                    if domain.lower() in result_url.lower():
                        domain_position = idx + 1
                        domain_result = result
                        break
                
                return {
                    "keyword": keyword,
                    "domain": domain,
                    "position": domain_position,
                    "domain_result": domain_result,
                    "top_results": organic_results[:5],
                    "total_results": len(organic_results)
                }
                
        except Exception as e:
            return {
                "error": str(e),
                "keyword": keyword,
                "domain": domain
            }
    
    async def get_pagespeed_score(self, url: str) -> Dict[str, Any]:
        """
        Get Google PageSpeed Insights score (FREE API)
        
        Returns Core Web Vitals and performance metrics
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(
                    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
                    params={
                        "url": url,
                        "category": ["performance", "seo"],
                        "strategy": "mobile"
                    }
                )
                
                if response.status_code != 200:
                    return {
                        "error": f"PageSpeed API error: {response.status_code}",
                        "url": url
                    }
                
                data = response.json()
                
                # Extract key metrics
                lighthouse = data.get("lighthouseResult", {})
                categories = lighthouse.get("categories", {})
                
                performance_score = categories.get("performance", {}).get("score", 0) * 100
                seo_score = categories.get("seo", {}).get("score", 0) * 100
                
                # Core Web Vitals
                audits = lighthouse.get("audits", {})
                
                lcp = audits.get("largest-contentful-paint", {}).get("displayValue", "N/A")
                fid = audits.get("max-potential-fid", {}).get("displayValue", "N/A")
                cls = audits.get("cumulative-layout-shift", {}).get("displayValue", "N/A")
                
                return {
                    "url": url,
                    "performance_score": round(performance_score),
                    "seo_score": round(seo_score),
                    "core_web_vitals": {
                        "lcp": lcp,
                        "fid": fid,
                        "cls": cls
                    },
                    "strategy": "mobile"
                }
                
        except Exception as e:
            return {
                "error": str(e),
                "url": url
            }
    
    async def discover_trending_keywords(
        self,
        niche: str,
        domain: str = "",
        location: str = "United States",
        custom_queries: Optional[list] = None
    ) -> list:
        """
        Discover real trending keywords from Google SERP.
        
        Args:
            niche: Broad topic if custom_queries not provided
            domain: Domain to check rankings for
            custom_queries: List of specific queries to run (High Priority)
        """
        if not self.serpapi_key:
            print("[SEO] No SerpApi key, cannot discover SERP keywords")
            return []
        
        # Use custom queries if provided (User Simulation Strategy)
        if custom_queries and len(custom_queries) > 0:
            queries = custom_queries
            print(f"[SEO] Using {len(queries)} custom simulation queries")
        else:
            # Fallback to template queries
            queries = [
                f"best {niche} to buy",
                f"{niche} buying guide",
                f"top rated {niche} reviews",
                f"cheap {niche} deals",
                f"{niche} vs", 
            ]
        
        keywords = []
        seen_keywords = set()
        
        for query in queries:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(
                        "https://serpapi.com/search",
                        params={
                            "api_key": self.serpapi_key,
                            "engine": "google",
                            "q": query,
                            "location": location,
                            "num": 15
                        }
                    )
                    
                    if response.status_code != 200:
                        print(f"[SEO] SerpApi error for '{query}': {response.status_code}")
                        continue
                    
                    data = response.json()
                    
                    # 1. Check rankings (but DO NOT use titles as keywords)
                    for idx, result in enumerate(data.get("organic_results", [])[:15]):
                        link = result.get("link", "")
                        if domain and domain.lower() in link.lower():
                            # We found our domain!
                            pass 

                    # Define negative terms for strict filtering
                    negative_terms = [
                        "what is", "define", "meaning", "definition", "benefit", 
                        "statistics", "report", "size", "trends", "job", "salary", 
                        "hiring", "wiki", "history of", "examples"
                    ]
                    
                    def is_valid_keyword(text):
                        text = text.lower().strip()
                        if len(text) < 3: return False
                        if any(term in text for term in negative_terms): return False
                        return True

                    # 2. Extract from related searches (The GOLD mine for user intent)
                    for related in data.get("related_searches", []):
                        q = related.get("query", "")
                        if is_valid_keyword(q) and q.lower() not in seen_keywords:
                            seen_keywords.add(q.lower())
                            keywords.append({
                                "keyword": q,
                                "source": "google_serp",
                                "serp_position": None,
                                "our_ranking": None,
                                "query": query,
                                "snippet": "Related Search",
                                "is_long_tail": True,
                                "intent": "Commercial" # Likely more specific
                            })
                    
                    # 3. Extract from People Also Ask (Questions users actually have)
                    for paa in data.get("related_questions", []):
                        q = paa.get("question", "")
                        if is_valid_keyword(q) and q.lower() not in seen_keywords:
                            seen_keywords.add(q.lower())
                            keywords.append({
                                "keyword": q,
                                "source": "google_serp",
                                "serp_position": None,
                                "our_ranking": None,
                                "query": query,
                                "snippet": paa.get("snippet", ""),
                                "is_question": True,
                                "intent": "Informational/Commercial"
                            })

            except Exception as e:
                print(f"[SEO] SERP query '{query}' failed: {e}")
                continue
        
        print(f"[SEO] Discovered {len(keywords)} keywords from {len(queries)} SERP queries")
        return keywords[:50]  # Cap at 50

    async def analyze_domain_seo(
        self, 
        domain: str, 
        keywords: list
    ) -> Dict[str, Any]:
        """
        Comprehensive SEO analysis for a domain
        """
        results = {
            "domain": domain,
            "pagespeed": None,
            "keyword_rankings": []
        }
        
        # Get PageSpeed score
        url = f"https://{domain}" if not domain.startswith("http") else domain
        results["pagespeed"] = await self.get_pagespeed_score(url)
        
        # Get rankings for each keyword (if SerpApi key is configured)
        if self.serpapi_key and keywords:
            for keyword in keywords[:5]:  # Limit to save API quota
                ranking = await self.get_serp_rankings(keyword, domain)
                results["keyword_rankings"].append(ranking)
        
        return results


# Singleton instance
_seo_service: Optional[SEOService] = None

def get_seo_service() -> SEOService:
    """Get or create SEO service instance"""
    global _seo_service
    if _seo_service is None:
        _seo_service = SEOService()
    return _seo_service
