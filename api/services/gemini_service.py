"""
OpenAI GPT-5 Service - Content generation and analysis
"""

from openai import AsyncOpenAI
from typing import Optional, Dict, Any, List
import json
from api.config import get_settings

class OpenAIService:
    """Service wrapper for OpenAI API (Async)"""
    
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.openai_api_key
        # Use AsyncOpenAI for non-blocking calls
        self.client = AsyncOpenAI(api_key=self.api_key)
        # 使用 gpt-4o-mini 因为它更快、更便宜且不仅限于 Tier 1+ 用户
        self.model = "gpt-4o-mini"  
        self.fast_model = "gpt-4o-mini"
        
        # Debug: 打印 Key 信息到日志 (仅前几位)
        if self.api_key:
            mask_key = f"{self.api_key[:8]}...{self.api_key[-4:]}"
            print(f"OpenAI Service initialized with Key: {mask_key}")
        else:
            print("OpenAI Service initialized WITHOUT API Key")
    
    async def analyze_company_content(
        self, 
        content: str, 
        company_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze scraped content to extract company information
        """
        from api.prompts import get_company_analysis_prompt, SYSTEM_COMPANY_ANALYSIS
        
        prompt = get_company_analysis_prompt(content)
        
        try:
            response = await self.client.chat.completions.create(
                model=self.fast_model,
                messages=[
                    {"role": "system", "content": SYSTEM_COMPANY_ANALYSIS},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in analyze_company_content: {e}")
            return {
                "company_name": company_name or "Unknown",
                "industry": "Technology",
                "products_services": [],
                "target_audience": "Businesses",
                "unique_selling_points": [],
                "key_features": [],
                "error": str(e)
            }

    async def generate_search_simulation(
        self,
        profile: Dict[str, Any],
        n: int = 5
    ) -> List[str]:
        """
        Simulate real user search queries based on company profile
        """
        from api.prompts import get_search_simulation_prompt, SYSTEM_SEARCH_SIMULATION
        
        prompt = get_search_simulation_prompt(profile, n)
        
        try:
            response = await self.client.chat.completions.create(
                model=self.fast_model,
                messages=[
                    {"role": "system", "content": SYSTEM_SEARCH_SIMULATION},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            result = json.loads(response.choices[0].message.content)
            return result.get("queries", [])
        except Exception as e:
            print(f"[Gemini] Search simulation failed: {e}")
            return []
    
    async def generate_gap_analysis(
        self, 
        company_profile: Dict[str, Any],
        competitor_data: List[Dict[str, Any]],
        our_site_content: str = ""
    ) -> Dict[str, Any]:
        """
        Generate GEO gap analysis comparing company to competitors
        Uses real website content for side-by-side comparisons
        """
        from api.prompts import get_gap_analysis_prompt, SYSTEM_GAP_ANALYSIS
        
        competitor_summary = "\n\n".join([
            f"### 竞品 {i+1}: {c['url']}\n{c.get('content', 'N/A')[:5000]}"
            for i, c in enumerate(competitor_data) if c.get("success")
        ])
        
        prompt = get_gap_analysis_prompt(company_profile, competitor_summary, our_site_content)
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_GAP_ANALYSIS},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            # Return error instead of mock data
            print(f"[GapAnalysis] AI analysis failed: {e}")
            return {
                "summary": f"差距分析失败: {str(e)}",
                "contentComparisons": [],
                "competitorGaps": [],
                "missingKeywords": [],
                "structuralGaps": [],
                "suggestions": [],
                "error": str(e)
            }
    
    async def generate_company_profile(
        self,
        company_name: str,
        domain: str,
        scraped_content: Optional[Dict[str, Any]] = None,
        latest_news: str = ""
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive company profile for GEO optimization
        Enriched with latest news from Perplexity when available
        """
        from api.prompts import get_company_profile_prompt, SYSTEM_COMPANY_PROFILE
        
        content_context = ""
        if scraped_content:
            content_context = f"基于爬取的内容：{str(scraped_content)[:5000]}"
        
        prompt = get_company_profile_prompt(company_name, domain, content_context, latest_news)
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_COMPANY_PROFILE},
                    {"role": "user", "content": prompt}
                ]
            )
            return {
                "company_name": company_name,
                "domain": domain,
                "profile_text": response.choices[0].message.content,
                "has_latest_news": bool(latest_news),
                "generated_at": str(__import__('datetime').datetime.now())
            }
        except Exception as e:
            return {
                "company_name": company_name,
                "domain": domain,
                "profile_text": f"[深度企业画像与 GEO 战略对齐报告]\n\n品牌名称：{company_name}\n官方域名：{domain}\n\n(自动生成失败，请手动填写)",
                "error": str(e)
            }
    
    async def generate_content(
        self,
        title: str,
        content_type: str,
        profile: Dict[str, Any],
        context_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate content based on title and type (Article or Social).
        Supports context injection (Deep Research / Social Trends).
        """
        from api.prompts import get_content_generation_prompt, SYSTEM_CONTENT_ARTICLE, SYSTEM_CONTENT_SOCIAL
        
        prompt = get_content_generation_prompt(title, content_type, profile, context_data)
        
        if content_type == "Article":
            system_prompt = SYSTEM_CONTENT_ARTICLE
            model = self.model
        else:  # Social
            system_prompt = SYSTEM_CONTENT_SOCIAL
            model = self.fast_model
        
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            if content_type == "Article":
                return f"# {title}\n\n## 核心见解\n\n内容生成失败: {str(e)}"
            else:
                return f"{title}\n\n🚀 内容生成失败: {str(e)}\n\n#GEO #AI #Marketing"

    async def regenerate_content(
        self,
        original_content: str,
        feedback: str,
        content_type: str = "Article"
    ) -> str:
        """
        Regenerate/Refine content based on user feedback.
        """
        from api.prompts import get_regenerate_content_prompt, SYSTEM_CONTENT_ARTICLE, SYSTEM_CONTENT_SOCIAL
        
        prompt = get_regenerate_content_prompt(original_content, feedback, content_type)
        
        system_prompt = SYSTEM_CONTENT_ARTICLE if content_type == "Article" else SYSTEM_CONTENT_SOCIAL
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model, # Use smart model for refinement
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"优化失败: {str(e)}\n\n{original_content}"

    async def generate_keywords(
        self,
        profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate GEO-optimized keywords from company profile
        """
        from api.prompts import get_keyword_generation_prompt, SYSTEM_KEYWORD_GENERATION
        
        prompt = get_keyword_generation_prompt(profile)
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_KEYWORD_GENERATION},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            result = json.loads(response.choices[0].message.content)
            return result.get("keywords", [])
        except Exception as e:
            print(f"Error in generate_keywords: {e}")
            return []
            return []

    async def generate_titles(
        self,
        topic: str,
        niche: str,
        profile: Dict[str, Any],
        trends_context: str = "",
        n: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Generate viral titles based on topic, profile, and trends
        """
        from api.prompts import get_title_generation_prompt, SYSTEM_TITLE_GENERATION
        
        prompt = get_title_generation_prompt(topic, niche, profile, trends_context, n)
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_TITLE_GENERATION},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            result = json.loads(response.choices[0].message.content)
            return result.get("titles", [])
        except Exception as e:
            print(f"Error in generate_titles: {e}")
            return []


# Singleton instance
_openai_service: Optional[OpenAIService] = None

def get_openai_service() -> OpenAIService:
    """Get or create OpenAI service instance"""
    global _openai_service
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service

# 保持向后兼容
def get_gemini_service() -> OpenAIService:
    """Alias for backward compatibility"""
    return get_openai_service()
