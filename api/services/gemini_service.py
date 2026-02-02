"""
OpenAI GPT-5 Service - Content generation and analysis
"""

from openai import OpenAI
from typing import Optional, Dict, Any, List
import json
from api.config import get_settings

class OpenAIService:
    """Service wrapper for OpenAI GPT-5 API"""
    
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-5"  # GPT-5 模型
        self.fast_model = "gpt-5-turbo"  # 快速版本用于简单任务
    
    async def analyze_company_content(
        self, 
        content: str, 
        company_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze scraped content to extract company information
        """
        prompt = f"""
        分析以下网站内容，提取公司信息。请用 JSON 格式返回：

        {content[:8000]}

        请提取：
        1. company_name: 公司名称
        2. industry: 所属行业
        3. products_services: 产品或服务列表
        4. target_audience: 目标受众
        5. unique_selling_points: 独特卖点
        6. key_features: 核心功能/特点

        请直接返回 JSON，不要包含 markdown 代码块。
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.fast_model,
                messages=[
                    {"role": "system", "content": "你是一位专业的企业分析师，擅长从网站内容中提取结构化信息。"},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {
                "company_name": company_name or "Unknown",
                "industry": "Technology",
                "products_services": [],
                "target_audience": "Businesses",
                "unique_selling_points": [],
                "key_features": [],
                "error": str(e)
            }
    
    async def generate_gap_analysis(
        self, 
        company_profile: Dict[str, Any],
        competitor_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate GEO gap analysis comparing company to competitors
        """
        competitor_summary = "\n".join([
            f"竞品 {i+1} ({c['url']}): {c.get('content', 'N/A')[:2000]}"
            for i, c in enumerate(competitor_data) if c.get("success")
        ])
        
        prompt = f"""
        你是一位专业的 GEO (Generative Engine Optimization) 分析师。
        
        基于以下信息进行差距分析：
        
        ## 我方企业画像：
        {json.dumps(company_profile, ensure_ascii=False)}
        
        ## 竞品内容分析：
        {competitor_summary}
        
        请生成详细的差距分析报告，返回 JSON 格式，包含以下结构：
        
        {{
            "summary": "核心诊断结论",
            "competitorGaps": [
                {{"dimension": "维度名", "description": "差距描述", "impact": "影响程度"}}
            ],
            "missingKeywords": [
                {{"cluster": "关键词簇", "keywords": ["关键词1", "关键词2"], "priority": "优先级"}}
            ],
            "structuralGaps": [
                {{"component": "组件类型", "whyNeeded": "为何需要"}}
            ],
            "suggestions": [
                {{"action": "建议行动", "timeframe": "时间框架", "expectedOutcome": "预期效果"}}
            ]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一位 GEO 优化专家，专注于帮助企业在 AI 搜索引擎中获得更好的引用和排名。"},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            # Return mock data on failure
            return {
                "summary": "诊断结论：当前站点在生成式引擎中的'实体权威度'不足",
                "competitorGaps": [
                    {"dimension": "实体权重", "description": "竞品引用 2024 标准，我方缺乏规范引用。", "impact": "极高"}
                ],
                "missingKeywords": [
                    {"cluster": "技术底层", "keywords": ["RAG 对齐", "Schema FAQ", "内容幻觉抑制"], "priority": "高"}
                ],
                "structuralGaps": [
                    {"component": "Markdown 表格", "whyNeeded": "Perplexity 优先抓取表格键值对。"}
                ],
                "suggestions": [
                    {"action": "重构核心博客为数据矩阵", "timeframe": "3天", "expectedOutcome": "提升覆盖率"}
                ],
                "error": str(e)
            }
    
    async def generate_company_profile(
        self,
        company_name: str,
        domain: str,
        scraped_content: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive company profile for GEO optimization
        """
        content_context = ""
        if scraped_content:
            content_context = f"基于爬取的内容：{str(scraped_content)[:3000]}"
        
        prompt = f"""
        为以下企业生成一份 GEO 优化战略画像：
        
        企业名称：{company_name}
        域名：{domain}
        {content_context}
        
        请生成深度企业画像，包含：
        
        1. 品牌核心定位 (Brand Positioning)
        2. 核心产品/服务矩阵 (Product Matrix)
        3. 受众群体与搜索场景 (Audience & Scenarios)
        4. 行业实体关联 (Entity Graph)
        5. GEO 策略偏好 (Strategy Markers)
        
        请用结构化的中文文本返回，以便在 AI 搜索引擎中建立实体权威。
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一位品牌战略专家，擅长为企业制定 GEO 优化战略。"},
                    {"role": "user", "content": prompt}
                ]
            )
            return {
                "company_name": company_name,
                "domain": domain,
                "profile_text": response.choices[0].message.content,
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
        profile: Dict[str, Any]
    ) -> str:
        """
        Generate content based on title and type (Article or Social)
        """
        if content_type == "Article":
            system_prompt = "你是一位专业的 SEO/GEO 内容作家，擅长撰写结构化的深度技术文章。"
            prompt = f"""
            撰写一篇深度 GEO 优化文章，标题："{title}"
            
            企业背景：{json.dumps(profile, ensure_ascii=False)}
            
            要求：
            - 包含 Markdown 格式的表格对比
            - 包含 FAQ 模块（至少 3 个问答）
            - 引用行业权威数据
            - 使用 E-E-A-T 框架确保内容权威性
            - 2000-2500 字
            """
            model = self.model
        else:  # Social
            system_prompt = "你是一位社交媒体营销专家，擅长撰写引人注目的短文案。"
            prompt = f"""
            撰写一条社交媒体爆款短文，话题："{title}"
            
            企业背景：{json.dumps(profile, ensure_ascii=False)}
            
            要求：
            - 使用 Emoji 增强可读性
            - 包含热门标签 (hashtags)
            - 适合 Instagram/Twitter
            - 200-300 字
            - 有明确的 CTA（行动号召）
            """
            model = self.fast_model
        
        try:
            response = self.client.chat.completions.create(
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
