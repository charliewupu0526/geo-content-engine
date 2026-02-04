"""
Centralized AI Prompts Management
This file allows for easy modification and versioning of AI prompts.
"""

from typing import Optional, Dict, Any, List
import json

# ==========================================
# 1. Company Analysis Prompts
# ==========================================

SYSTEM_COMPANY_ANALYSIS = "你是一位专业的企业分析师，擅长从网站内容中提取结构化信息。"

def get_company_analysis_prompt(content: str) -> str:
    return f"""
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

# ==========================================
# 2. Company Profile Prompts (Target for Optimization)
# ==========================================

SYSTEM_COMPANY_PROFILE = "你是一位世界级的品牌战略专家，擅长为企业制定 GEO (Generative Engine Optimization) 优化战略。你的分析应该深刻、具体，并能指导后续的内容策略。"

def get_company_profile_prompt(company_name: str, domain: str, content_context: str) -> str:
    return f"""
    为以下企业生成一份深度 GEO 优化战略画像。
    
    你的目标是：深入理解品牌核心，挖掘其在 AI 搜索引擎（如 Perplexity, ChatGPT, Gemini）中的潜在知识图谱位置。
    
    企业名称：{company_name}
    域名：{domain}
    {content_context}
    
    请生成一份详细的战略画像，必须包含以下 5 个核心模块，并用结构化的中文返回：

    #### 1. 品牌核心定位与声音 (Brand Core & Voice)
    - **一句话定位**：用简练的语言定义品牌在市场中的位置。
    - **品牌原型**：(例如：创新者、护博者、智者等)
    - **品牌语调**：(例如：专业、亲切、权威、幽默等)
    - **核心价值观**：品牌传达的深层理念。

    #### 2. 产品/服务矩阵与关键词簇 (Product Matrix & Keywords)
    - **核心产品**：列出主打产品。
    - **主要功能**：列出解决了什么问题。
    - **GEO 关键词簇**：列出用户可能搜索的 5-10 个高价值关键词（包括长尾词）。

    #### 3. 用户画像与痛点分析 (Audience & Pain Points)
    - **理想客户画像 (ICP)**：具体到职位、行业、规模。
    - **核心痛点**：客户在寻找该产品前遇到的具体困难。
    - **决策驱动力**：客户购买的主要理由（价格、效率、信任等）。

    #### 4. 行业实体图谱位置 (Entity Graph Positioning)
    - **关联实体**：品牌应该与哪些大概念（如“数字化转型”、“AI 营销”）强关联？
    - **竞品/对标**：在知识图谱中，品牌通常与谁同时出现？
    - **权威认证**：行业内受信任的奖项、证书或合作伙伴。

    #### 5. GEO 搜索意图映射 (Search Intent Mapping)
    - **信息类意图 (Informational)**：用户会问什么问题？(例如："什么是最佳 CRM？")
    - **商业类意图 (Commercial)**：用户在比较时会搜什么？(例如："ZCD vs Salesforce")
    - **导航类意图 (Navigational)**：用户如何找到官网？

    请确保输出内容专业、深刻，不仅是信息的罗列，更是战略的洞察。
    """

# ==========================================
# 3. Gap Analysis Prompts
# ==========================================

SYSTEM_GAP_ANALYSIS = "你是一位 GEO 优化专家，专注于帮助企业在 AI 搜索引擎中获得更好的引用和排名。"

def get_gap_analysis_prompt(company_profile: Dict[str, Any], competitor_summary: str) -> str:
    profile_json = json.dumps(company_profile, ensure_ascii=False)
    return f"""
    基于以下信息进行差距分析：
    
    ## 我方企业画像：
    {profile_json}
    
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

# ==========================================
# 4. Content Generation Prompts
# ==========================================

SYSTEM_CONTENT_ARTICLE = "你是一位专业的 SEO/GEO 内容作家，擅长撰写结构化的深度技术文章。"
SYSTEM_CONTENT_SOCIAL = "你是一位社交媒体营销专家，擅长撰写引人注目的短文案。"

def get_content_generation_prompt(title: str, content_type: str, profile: Dict[str, Any]) -> str:
    profile_json = json.dumps(profile, ensure_ascii=False)
    
    if content_type == "Article":
        return f"""
        撰写一篇深度 GEO 优化文章，标题："{title}"
        
        企业背景：{profile_json}
        
        要求：
        - 包含 Markdown 格式的表格对比
        - 包含 FAQ 模块（至少 3 个问答）
        - 引用行业权威数据
        - 使用 E-E-A-T 框架确保内容权威性
        - 2000-2500 字
        """
    else:  # Social
        return f"""
        撰写一条社交媒体爆款短文，话题："{title}"
        
        企业背景：{profile_json}
        
        要求：
        - 使用 Emoji 增强可读性
        - 包含热门标签 (hashtags)
        - 适合 Instagram/Twitter
        - 200-300 字
        - 有明确的 CTA（行动号召）
        """
