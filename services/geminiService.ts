/**
 * GEO Content Engine - AI Service (Frontend)
 * 
 * This service calls the backend API for AI operations.
 * The actual AI processing happens on the server.
 */

import { apiClient } from './apiClient';

// No mock data - all data comes from real backend APIs
export const MOCK_GAP_REPORT = null; // Deprecated: kept for import compatibility
export const MOCK_KEYWORDS: any[] = []; // Deprecated: kept for import compatibility

/**
 * Analyze a company website using real crawler and AI
 */
export const analyzeCompanyWebsite = async (url: string, companyName?: string) => {
  try {
    const result = await apiClient.analyzeCompany(url, companyName);

    // 如果请求成功且数据中没有业务逻辑错误
    if (result.success && result.data && !(result.data as any).error) {
      return result.data;
    }

    // 返回具体错误信息
    const errorMessage = (result.data as any)?.error || result.error || 'Failed to analyze company';
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
export const scrapeUrl = async (url: string, projectId?: string) => {
  try {
    // Enable saveToDb if projectId is provided
    const saveToDb = !!projectId;
    const result = await apiClient.scrapeUrl(url, ['markdown', 'html'], projectId, saveToDb);
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
 * Generate keywords from company profile (legacy)
 */
export const generateKeywords = async (profile: any) => {
  try {
    const result = await apiClient.generateKeywords(profile);
    if (result.success && result.data && (result.data as any).keywords) {
      return (result.data as any).keywords;
    }
    console.error('Keyword API failed, no fallback data');
    return [];
  } catch (error) {
    console.error('Failed to generate keywords:', error);
    return [];
  }
};

/**
 * Generate enhanced keywords from 3 sources:
 * - Google SERP rankings (real-time via SerpApi)
 * - Competitor gap keywords (market-validated)
 * - AI-generated brand keywords
 */
export const generateKeywordsEnhanced = async (
  niche: string,
  domain: string = '',
  profile: any = {},
  gapReport: any = {},
  competitorUrls: string[] = [],
  projectId?: string
) => {
  try {
    const result = await apiClient.generateKeywordsEnhanced(
      niche, domain, profile, gapReport, competitorUrls, projectId
    );
    if (result.success && result.data) {
      const data = result.data as any;
      return {
        keywords: data.keywords || [],
        sources: data.sources || {},
        count: data.count || 0
      };
    }
    console.error('Enhanced keyword API failed');
    return { keywords: [], sources: {}, count: 0 };
  } catch (error) {
    console.error('Failed to generate enhanced keywords:', error);
    return { keywords: [], sources: {}, count: 0 };
  }
};

/**
 * Generate gap analysis report by comparing with competitors
 */
export const generateGapReport = async (profile: any, competitorUrls: string[], projectId?: string) => {
  try {
    if (!competitorUrls || competitorUrls.length === 0) {
      console.log('No competitor URLs provided');
      return null; // Return null instead of mock
    }

    const result = await apiClient.analyzeCompetitor(profile, competitorUrls, projectId);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to generate gap report');
  } catch (error) {
    console.error('Failed to generate gap report:', error);
    return null; // Return null instead of mock
  }
};


/**
 * Discover competitors using AI
 */
export const discoverCompanyCompetitors = async (niche: string, companyName?: string, domain?: string) => {
  try {
    const result = await apiClient.discoverCompetitors(niche, companyName, domain);
    // API returns {success, competitors: [...]} not {success, data: [...]}
    // Actually apiClient wraps it in data
    if (result.success && (result.data as any)?.competitors) {
      return (result.data as any).competitors;
    }
    throw new Error(result.error || 'Failed to discover competitors');
  } catch (error) {
    console.error('Failed to discover competitors:', error);
    return null;
  }
};

/**
 * Discover hidden competitors using AI
 */
export const discoverHiddenCompetitors = async (companyProfile: any) => {
  try {
    // Ensure profile is an object
    let profileData = companyProfile;
    if (typeof companyProfile === 'string') {
      try {
        profileData = JSON.parse(companyProfile);
      } catch (e) {
        // If string is not JSON, wrap it
        profileData = { description: companyProfile };
      }
    }

    const result = await apiClient.discoverHiddenCompetitors(profileData);

    // API client wrapper returns { success, data }
    if (result.success && result.data && (result.data as any).hidden_competitors) {
      return (result.data as any).hidden_competitors;
    }
    return [];
  } catch (error) {
    console.error('Failed to discover hidden competitors:', error);
    return [];
  }
};

/**
 * Perform Deep Gap Analysis using Knowledge Base
 */
export const performDeepGapAnalysis = async (projectId: string) => {
  try {
    const result = await apiClient.generateDeepGapAnalysis(projectId);
    if (result.success && result.data && (result.data as any).data) {
      return (result.data as any).data;
    }
    throw new Error(result.error || 'Failed to perform deep gap analysis');
  } catch (error) {
    console.error('Failed to perform deep gap analysis:', error);
    return null;
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
          estimatedWords: 150
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
 * Generate viral titles using AI (Phase 5)
 */
export const generateViralTitles = async (topic: string, niche: string, profile: any, useTrends: boolean = true) => {
  try {
    const result = await apiClient.generateTitles(topic, niche, profile, useTrends);
    if (result.success && result.data && (result.data as any).titles) {
      return (result.data as any).titles;
    }
    return [];
  } catch (error) {
    console.error("Failed to generate titles:", error);
    return [];
  }
};

/**
 * Generate content for a task using backend AI
 */
export const generateContentByBranch = async (task: any, profile: any) => {
  const isArticle = task.branch === 'Article';
  const contentType = isArticle ? 'Article' : 'Social';

  try {
    // Call the backend content generation API
    const result = await apiClient.generateContent(
      task.title,
      contentType,
      task.keyword,
      profile
    );

    if (result.success && result.data && (result.data as any).content) {
      return (result.data as any).content;
    }

    // If API fails, return error message (no hardcoded fallback)
    console.error('Content generation API failed:', result.error);
    return isArticle
      ? `# ${task.title}\n\n内容生成失败: ${result.error || '请重试'}`
      : `${task.title}\n\n⚠️ 内容生成失败\n\n#GEO`;
  } catch (error) {
    return isArticle
      ? `# ${task.title}\n\n内容生成失败: ${error instanceof Error ? error.message : '网络错误'}`
      : `${task.title}\n\n⚠️ 内容生成失败\n\n#GEO`;
  }
};

/**
 * Regenerate content based on feedback
 */
export const regenerateContent = async (originalContent: string, feedback: string, contentType: string = 'Article') => {
  try {
    const result = await apiClient.regenerateContent(originalContent, feedback, contentType);
    if (result.success && result.data && (result.data as any).content) {
      return (result.data as any).content;
    }
    return originalContent; // Fallback
  } catch (error) {
    console.error('Failed to regenerate content:', error);
    return originalContent;
  }
};


/**
 * Generate Batch Content (Phase 4)
 */
export const generateBatchContent = async (projectId: string, tasks: any[]) => {
  try {
    const result = await apiClient.generateBatchContent(projectId, tasks, true);
    if (result.success && result.data && (result.data as any).results) {
      return (result.data as any).results;
    }
    throw new Error(result.error || 'Failed to generate batch content');
  } catch (error) {
    console.error('Failed to generate batch content:', error);
    return null;
  }
};

/**
 * Publish content to platform
 */
export const publishContent = async (projectId: string, platform: string, contentData: any, config?: any) => {
  try {
    const result = await apiClient.publishContent(projectId, platform, contentData, config);
    if (result.success) {
      return result.data || { success: true };
    }
    throw new Error(result.error || 'Failed to publish content');
  } catch (error) {
    console.error('Failed to publish content:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
