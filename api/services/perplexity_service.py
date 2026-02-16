"""
Perplexity AI Service - Real AI Citation Testing

This service uses Perplexity's Sonar API to:
1. Test which sources are actually cited by AI
2. Extract citation URLs for learning targets
3. Analyze competitor content quality
"""

import httpx
from typing import Dict, Any, List, Optional
import json
from api.config import get_settings


class PerplexityService:
    """Service for Perplexity AI citation testing"""
    
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.perplexity_api_key
        self.base_url = "https://api.perplexity.ai"
        self.model = "sonar"  # Sonar model returns citations
        
        if self.api_key:
            print(f"Perplexity Service initialized with Key: {self.api_key[:8]}...")
        else:
            print("Perplexity Service initialized WITHOUT API Key")
    
    async def search_brand_info(self, brand_name: str, domain: str = "") -> Dict[str, Any]:
        """
        Search for brand information using Perplexity as a fallback
        when web scraping fails.
        
        Returns:
            {
                "success": True/False,
                "content": "Perplexity search result text about the brand",
                "citations": [...],
                "query": "original search query"
            }
        """
        if not self.api_key:
            return {
                "success": False,
                "error": "Perplexity API key not configured",
                "content": "",
                "citations": []
            }
        
        # Build a comprehensive search query for the brand
        domain_hint = f" (官网: {domain})" if domain else ""
        query = f"{brand_name}{domain_hint} 品牌介绍 产品 服务 核心优势 目标客户"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "你是一位专业的品牌研究分析师。请尽可能全面地介绍该品牌，"
                        "包括：品牌定位、核心产品/服务、目标客户群、行业地位、"
                        "竞争优势、品牌历史等。请用中文回答，并引用可靠来源。"
                    )
                },
                {
                    "role": "user",
                    "content": query
                }
            ],
            "return_citations": True
        }
        
        try:
            print(f"[Perplexity Fallback] Searching brand info: {brand_name}")
            async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    print(f"[Perplexity Fallback] API error: {response.status_code}")
                    return {
                        "success": False,
                        "error": f"Perplexity API error: {response.status_code} - {response.text}",
                        "content": "",
                        "citations": []
                    }
                
                data = response.json()
                
                # Extract the answer
                answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                # Extract citations
                citations = data.get("citations", [])
                if citations and isinstance(citations[0], str):
                    citations = [{"url": url, "title": ""} for url in citations]
                
                print(f"[Perplexity Fallback] Got {len(answer)} chars, {len(citations)} citations")
                
                return {
                    "success": True,
                    "content": answer,
                    "citations": citations,
                    "query": query,
                    "model": self.model
                }
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            error_msg = str(e) or f"{type(e).__name__}: {repr(e)}"
            print(f"[Perplexity Fallback] Error: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "content": "",
                "citations": []
            }
    
    async def search_social_trends(self, niche: str) -> Dict[str, Any]:
        """
        Search for real-time social media trends and viral hooks in a niche.
        Targeting platforms: Instagram, TikTok, LinkedIn, Twitter (X).
        """
        query = f"What are the trending topics, viral hooks, and hot discussions in the {niche} niche on social media (Instagram, TikTok, LinkedIn) this week? Give examples of viral post structures."
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "sonar-pro", 
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a Viral Content Analyst. Identify current social media trends."
                            },
                            {"role": "user", "content": query}
                        ]
                    }
                )
                
                if response.status_code != 200:
                    return {"success": False, "error": f"API Error: {response.status_code}"}
                    
                data = response.json()
                return {
                    "success": True,
                    "content": data["choices"][0]["message"]["content"],
                    "citations": data.get("citations", []),
                    "source": "perplexity_social"
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def calculate_brand_citation_score(self, brand_name: str, niche: str) -> Dict[str, Any]:
        """
        Calculate AI Citation Score and Citation Rate for a brand in a niche.
        
        Real-time check via Perplexity:
        1. Ask for top recommendations in the niche.
        2. Check if brand is mentioned.
        3. Analyze sentiment to determine score.
        """
        if not self.api_key:
             return {
                "score": 0,
                "citation_rate": "0%",
                "status": "No API Key",
                "sources": []
            }
            
        print(f"[Perplexity] Calculating citation score for {brand_name} in {niche}...")
        
        # Query 1: Market Presence (Share of Voice)
        presence_query = f"Who are the top 10 most recommended {niche} brands/tools in 2025? List them."
        
        score = 0
        citation_rate = 0
        status = "Not Found"
        sources = []
        
        try:
            # We use a shorter timeout for this check
            async with httpx.AsyncClient(timeout=45.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                # 1. Check Presence
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json={
                        "model": "sonar", 
                        "messages": [{"role": "user", "content": presence_query}]
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    sources = data.get("citations", [])
                    
                    # Normalize for search
                    content_lower = content.lower()
                    brand_lower = brand_name.lower()
                    
                    if brand_lower in content_lower:
                        citation_rate = 15  # Base rate if mentioned in top list
                        status = "Listed in Top Recommendations"
                        score = 50 # Baseline score for being present
                        
                        # Boost if it appears early (rough heuristic)
                        first_index = content_lower.find(brand_lower)
                        if first_index < 200:
                            score += 20
                            citation_rate += 10
                            
                        # 2. Check Sentiment / Specific Reputation if found
                        reputation_query = f"What is the consensus reviews and reputation of {brand_name} in the {niche} market? Highlight pros and cons."
                        rep_response = await client.post(
                            f"{self.base_url}/chat/completions",
                            headers=headers,
                            json={
                                "model": "sonar", 
                                "messages": [{"role": "user", "content": reputation_query}]
                            }
                        )
                        
                        if rep_response.status_code == 200:
                            rep_data = rep_response.json()
                            rep_content = rep_data["choices"][0]["message"]["content"].lower()
                            
                            # Simple keyword sentiment analysis
                            positive_terms = ["excellent", "leading", "top-tier", "highly recommended", "best", "standard", "innovation", "strong", "market leader"]
                            negative_terms = ["outdated", "expensive", "poor", "lagging", "complaints", "avoid", "issues", "buggy"]
                            
                            pos_count = sum(1 for term in positive_terms if term in rep_content)
                            neg_count = sum(1 for term in negative_terms if term in rep_content)
                            
                            score += (pos_count * 5)
                            score -= (neg_count * 5)
                            
                            # Cap score
                            score = max(min(score, 98), 10)
                            
                            # Adjust citation rate based on "buzz"
                            citation_rate += (pos_count * 2)
                            
                    else:
                        status = "Not mentioned in Top AI Recommendations"
                        score = 5 # Low score, but not zero explicitly
                        citation_rate = 0
                
                return {
                    "score": round(score),
                    "citation_rate": f"{min(citation_rate, 100)}%",
                    "status": status,
                    "sources": sources[:3] # Return top 3 sources
                }
                
        except Exception as e:
            print(f"[Perplexity] Citation check failed: {e}")
            return {
                "score": 0,
                "citation_rate": "Error",
                "status": "Check Failed",
                "sources": []
            }

    async def deep_research(self, topic: str) -> Dict[str, Any]:
        """
        Conduct deep research on a topic to find authoritative data, 
        statistics, and expert quotes for high-quality articles.
        """
        query = f"Research detailed statistics, case studies, academic perspectives, and authority expert quotes regarding: '{topic}'. Focus on recent data (2024-2025)."
        
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "sonar-pro", 
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a Research Assistant for a white paper. Provide dense, factual, cited information."
                            },
                            {"role": "user", "content": query}
                        ]
                    }
                )
                
                if response.status_code != 200:
                    return {"success": False, "error": f"API Error: {response.status_code}"}
                    
                data = response.json()
                return {
                    "success": True,
                    "content": data["choices"][0]["message"]["content"],
                    "citations": data.get("citations", []),
                    "source": "perplexity_deep_research"
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def test_citation(self, query: str) -> Dict[str, Any]:
        """
        Send a query to Perplexity and extract citations
        
        Returns:
            {
                "answer": "AI generated response",
                "citations": [
                    {"url": "...", "title": "..."}
                ],
                "query": "original query"
            }
        """
        if not self.api_key:
            return {
                "error": "Perplexity API key not configured",
                "query": query,
                "citations": []
            }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Provide accurate, well-sourced information."
                },
                {
                    "role": "user", 
                    "content": query
                }
            ],
            "return_citations": True
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    return {
                        "error": f"API error: {response.status_code} - {response.text}",
                        "query": query,
                        "citations": []
                    }
                
                data = response.json()
                
                # Extract the answer
                answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                # Extract citations (Perplexity returns them in the response)
                citations = data.get("citations", [])
                
                # If citations is a list of URLs, convert to structured format
                if citations and isinstance(citations[0], str):
                    citations = [{"url": url, "title": ""} for url in citations]
                
                return {
                    "answer": answer,
                    "citations": citations,
                    "query": query,
                    "model": self.model
                }
                
        except Exception as e:
            return {
                "error": str(e),
                "query": query,
                "citations": []
            }
    
    async def analyze_competitors_citations(
        self, 
        niche: str, 
        num_queries: int = 5
    ) -> Dict[str, Any]:
        """
        Run multiple queries for a niche and aggregate citation data
        """
        # Generate test queries for the niche
        test_queries = [
            f"What are the best {niche} tools in 2025?",
            f"How to choose a {niche} for enterprise?",
            f"{niche} comparison: which is the market leader?",
            f"Expert recommendations for {niche}",
            f"Latest trends in {niche} industry"
        ][:num_queries]
        
        all_citations = []
        results = []
        
        for query in test_queries:
            result = await self.test_citation(query)
            results.append(result)
            
            # Collect all citations
            for citation in result.get("citations", []):
                all_citations.append(citation)
        
        # Count citation frequency
        citation_counts = {}
        for c in all_citations:
            url = c.get("url", "")
            if url:
                domain = self._extract_domain(url)
                citation_counts[domain] = citation_counts.get(domain, 0) + 1
        
        # Sort by frequency
        top_sources = sorted(
            citation_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:10]
        
        return {
            "niche": niche,
            "queries_tested": len(test_queries),
            "total_citations": len(all_citations),
            "top_cited_sources": [
                {"domain": domain, "citation_count": count}
                for domain, count in top_sources
            ],
            "all_citations": all_citations,
            "query_results": results
        }
    
    async def identify_learning_targets(
        self, 
        citations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Analyze cited sources to identify learning targets
        """
        # Group by domain
        domain_data = {}
        for c in citations:
            url = c.get("url", "")
            domain = self._extract_domain(url)
            if domain:
                if domain not in domain_data:
                    domain_data[domain] = {
                        "domain": domain,
                        "urls": [],
                        "citation_count": 0
                    }
                domain_data[domain]["urls"].append(url)
                domain_data[domain]["citation_count"] += 1
        
        # Convert to sorted list
        learning_targets = sorted(
            domain_data.values(),
            key=lambda x: x["citation_count"],
            reverse=True
        )
        
        return learning_targets
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc.replace("www.", "")
        except:
            return ""


# Singleton instance
_perplexity_service: Optional[PerplexityService] = None

def get_perplexity_service() -> PerplexityService:
    """Get or create Perplexity service instance"""
    global _perplexity_service
    if _perplexity_service is None:
        _perplexity_service = PerplexityService()
    return _perplexity_service
