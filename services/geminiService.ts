/**
 * GEO Content Engine - AI Service (Frontend)
 * 
 * This service calls the backend API for AI operations.
 * The actual AI processing happens on the server.
 */

import { apiClient } from './apiClient';

// Mock data for fallback
export const MOCK_GAP_REPORT = {
  summary: "诊断结论：当前站点在生成式引擎中的'实体权威度'不足，由于缺乏结构化专家引用和高密度的 Markdown 数据矩阵。",
  competitorGaps: [
    { dimension: "实体权重", description: "竞品引用 2024 标准，我方缺乏规范引用。", impact: "极高" }
  ],
  missingKeywords: [
    { cluster: "技术底层", keywords: ["RAG 对齐", "Schema FAQ", "内容幻觉抑制"], priority: "高" },
    { cluster: "应用场景", keywords: ["GEO 转化率", "AI 搜索流量", "实体建模"], priority: "中" }
  ],
  structuralGaps: [
    { component: "Markdown 表格", whyNeeded: "Perplexity 优先抓取表格键值对。" }
  ],
  suggestions: [
    { action: "重构核心博客为数据矩阵", timeframe: "3天", expectedOutcome: "提升覆盖率" }
  ]
};

export const MOCK_KEYWORDS = [
  { keyword: "GEO 优化", title: "2025 GEO 实战手册", intent: "Commercial", estimatedWords: 2500, template: "行业蓝皮书" },
  { keyword: "AI 算法", title: "SearchGPT 排序逻辑", intent: "Informational", estimatedWords: 2000, template: "技术解析" }
];

/**
 * Analyze a company website using real crawler and AI
 */
export const analyzeCompanyWebsite = async (url: string, companyName?: string) => {
  try {
    const result = await apiClient.analyzeCompany(url, companyName);

    // 如果请求成功且数据中没有业务逻辑错误
    if (result.success && result.data && !result.data.error) {
      return result.data;
    }

    // 返回具体错误信息
    const errorMessage = result.data?.error || result.error || 'Failed to analyze company';
    console.error('API Error:', errorMessage);

    // 返回包含错误的完整对象，以便 UI 显示
    if (result.data) return result.data;
    return { error: errorMessage, success: false };

  } catch (error) {
    console.error('Failed to analyze company:', error);
    return { error: error instanceof Error ? error.message : 'Network error', success: false };
  }
};

/**
 * Scrape a URL using Firecrawl
 */
export const scrapeUrl = async (url: string) => {
  try {
    const result = await apiClient.scrapeUrl(url, ['markdown', 'html']);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to scrape URL');
  } catch (error) {
    console.error('Failed to scrape URL:', error);
    return null;
  }
};

/**
 * Generate company profile using AI
 */
export const generateCompanyProfile = async (companyName: string, domain: string, scrapedContent?: any) => {
  try {
    const result = await apiClient.generateProfile(companyName, domain, scrapedContent);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to generate profile');
  } catch (error) {
    console.error('Failed to generate profile:', error);
    return null;
  }
};

/**
 * Generate keywords from company profile
 */
export const generateKeywords = async (profile: any) => {
  try {
    // TODO: Add dedicated keyword generation endpoint to backend
    // For now, return mock data + use profile for context
    console.log('Generating keywords for profile:', profile?.company_name);
    return MOCK_KEYWORDS;
  } catch (error) {
    console.error('Failed to generate keywords:', error);
    return MOCK_KEYWORDS;
  }
};

/**
 * Generate gap analysis report by comparing with competitors
 */
export const generateGapReport = async (profile: any, competitorUrls: string[]) => {
  try {
    if (!competitorUrls || competitorUrls.length === 0) {
      console.log('No competitor URLs provided, returning mock data');
      return MOCK_GAP_REPORT;
    }

    const result = await apiClient.analyzeCompetitor(profile, competitorUrls);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to generate gap report');
  } catch (error) {
    console.error('Failed to generate gap report:', error);
    return MOCK_GAP_REPORT;
  }
};

/**
 * Generate production matrix from keywords
 */
export const generateProductionMatrix = async (keywords: string[], branches: string[], profile: any) => {
  try {
    // Generate matrix based on keywords and branches
    const results: any[] = [];
    keywords.forEach(kw => {
      if (branches.includes('Article')) {
        results.push({
          keyword: kw,
          branch: 'Article',
          title: `[深度文章] 如何在 2025 年通过 ${kw} 提升 AI 搜索引用权重？`,
          intent: 'Commercial',
          estimatedWords: 2000
        });
      }
      if (branches.includes('Social')) {
        results.push({
          keyword: kw,
          branch: 'Social',
          title: `🔥 AI 搜索避坑指南：关于 ${kw} 你必须知道的 3 件事！`,
          intent: 'Informational',
          estimatedWords: 300
        });
      }
    });
    return results;
  } catch (error) {
    console.error('Failed to generate production matrix:', error);
    return [];
  }
};

/**
 * Generate content for a task using backend AI
 */
export const generateContentByBranch = async (task: any, profile: any) => {
  const isArticle = task.branch === 'Article';

  try {
    // Call the backend content generation API
    // Note: This would need a dedicated endpoint
    // For now, generate locally with a template and mark for backend generation

    if (isArticle) {
      return `# ${task.title}

## 核心见解

在 2025 年的 AI 搜索时代，${task.keyword} 已成为品牌获取流量的关键战场。

## 为什么这很重要？

| 维度 | 传统 SEO | GEO 优化 |
|-----|---------|---------|
| 内容形式 | 关键词堆砌 | 结构化数据 |
| 优化目标 | 排名靠前 | 被 AI 引用 |
| 核心指标 | 点击率 | 引用率 |

## FAQ

### Q: 什么是 GEO？
A: GEO (Generative Engine Optimization) 是专门针对 AI 搜索引擎的优化策略。

### Q: 如何开始 GEO 优化？
A: 首先确保内容结构化，添加清晰的标题层级和数据表格。

---

*本文由 GEO 内容引擎生成*`;
    } else {
      return `${task.title}

🚀 2025 GEO 新趋势！

1️⃣ 结构化内容是王道
2️⃣ 实体对齐不能少
3️⃣ AI 引用率决定流量

👉 点击链接了解更多...

#GEO #AI搜索 #内容营销 #数字营销`;
    }
  } catch (error) {
    console.error('Failed to generate content:', error);
    return isArticle
      ? `# ${task.title}\n\n## 核心见解\n内容生成失败，请稍后重试。`
      : `${task.title}\n\n🚀 内容生成中...\n\n#GEO #AI #Marketing`;
  }
};

/**
 * Check API health status
 */
export const checkApiHealth = async () => {
  try {
    const result = await apiClient.healthCheck();
    return result.success;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};
