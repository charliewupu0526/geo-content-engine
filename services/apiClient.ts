/**
 * API Client - Unified interface for backend API calls
 */

// 前后端同服务器部署时使用空字符串 (same-origin)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.detail || 'Request failed',
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ==================== Health Check ====================
  async healthCheck() {
    return this.request('/api/health');
  }

  // ==================== Crawler API ====================
  async scrapeUrl(url: string, formats: string[] = ['markdown', 'html'], projectId?: string, saveToDb: boolean = false) {
    return this.request('/api/crawler/scrape', {
      method: 'POST',
      body: JSON.stringify({ url, formats, project_id: projectId, save_to_db: saveToDb }),
    });
  }

  async crawlWebsite(
    url: string,
    maxPages: number = 10,
    includePaths?: string[],
    excludePaths?: string[],
    projectId?: string,
    saveToDb: boolean = false
  ) {
    return this.request('/api/crawler/crawl', {
      method: 'POST',
      body: JSON.stringify({
        url,
        max_pages: maxPages,
        include_paths: includePaths,
        exclude_paths: excludePaths,
        project_id: projectId,
        save_to_db: saveToDb
      }),
    });
  }

  async mapUrls(url: string) {
    return this.request('/api/crawler/map', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async extractStructured(
    url: string,
    schema: Record<string, any>,
    prompt?: string
  ) {
    return this.request('/api/crawler/extract', {
      method: 'POST',
      body: JSON.stringify({
        url,
        schema_definition: schema,
        prompt,
      }),
    });
  }

  // ==================== Intelligence API ====================
  async analyzeCompany(url: string, companyName?: string) {
    return this.request('/api/intelligence/analyze-company', {
      method: 'POST',
      body: JSON.stringify({ url, company_name: companyName }),
    });
  }

  async analyzeCompetitor(
    companyProfile: Record<string, any>,
    competitorUrls: string[],
    projectId?: string
  ) {
    return this.request('/api/intelligence/analyze-competitor', {
      method: 'POST',
      body: JSON.stringify({
        company_profile: companyProfile,
        competitor_urls: competitorUrls,
        project_id: projectId
      }),
    });
  }

  async generateProfile(
    companyName: string,
    domain: string,
    scrapedContent?: Record<string, any>
  ) {
    return this.request('/api/intelligence/generate-profile', {
      method: 'POST',
      body: JSON.stringify({
        company_name: companyName,
        domain,
        scraped_content: scrapedContent,
      }),
    });
  }

  async discoverCompetitors(niche: string, companyName?: string, domain?: string) {
    return this.request('/api/intelligence/discover-competitors', {
      method: 'POST',
      body: JSON.stringify({ niche, company_name: companyName, domain }),
    });
  }

  async discoverHiddenCompetitors(companyProfile: Record<string, any>) {
    return this.request('/api/intelligence/discover-hidden-competitors', {
      method: 'POST',
      body: JSON.stringify({ company_profile: companyProfile }),
    });
  }

  async generateKeywords(profile: Record<string, any>) {
    return this.request('/api/intelligence/generate-keywords', {
      method: 'POST',
      body: JSON.stringify({ profile }),
    });
  }

  async generateKeywordsEnhanced(
    niche: string,
    domain: string = '',
    profile: Record<string, any> = {},
    gapReport: Record<string, any> = {},
    competitorUrls: string[] = [],
    projectId?: string
  ) {
    return this.request('/api/intelligence/generate-keywords-enhanced', {
      method: 'POST',
      body: JSON.stringify({
        niche,
        domain,
        profile,
        gap_report: gapReport,
        competitor_urls: competitorUrls,
        project_id: projectId
      }),
    });
  }

  async generateContent(title: string, contentType: string, keyword: string, profile?: Record<string, any>, signal?: AbortSignal) {
    return this.request('/api/production/generate-single', {
      method: 'POST',
      body: JSON.stringify({
        title,
        content_type: contentType,
        keyword,
        profile
      }),
      signal
    });
  }

  async regenerateContent(originalContent: string, feedback: string, contentType: string = 'Article') {
    return this.request('/api/production/regenerate', {
      method: 'POST',
      body: JSON.stringify({
        original_content: originalContent,
        feedback,
        content_type: contentType
      }),
    });
  }

  // ==================== Projects API ====================
  private transformProject(p: any): any {
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      domain: p.domain,
      status: p.status,
      companyProfile: p.company_profile || p.companyProfile,
      wpConnection: p.wp_connection,
      socialConnections: p.social_connections,
      createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
    };
  }

  private transformTask(t: any): any {
    if (!t) return null;
    return {
      id: t.id,
      batchId: t.batch_id || t.batchId,
      branch: t.branch,
      type: t.meta_data?.type || 'Article',
      title: t.title,
      genStatus: t.status || 'Pending',
      pubStatus: t.publish_status || 'Pending',
      content: t.content,
      timestamp: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
      profile: t.meta_data?.profile,
    };
  }

  async listProjects(userId?: string) {
    const endpoint = userId ? `/api/projects/?user_id=${userId}` : '/api/projects/';
    const res = await this.request<any[]>(endpoint);
    if (res.success && res.data) {
      return { ...res, data: res.data.map(this.transformProject) };
    }
    return res;
  }

  async createProject(
    name: string,
    domain: string,
    companyProfile?: Record<string, any>,
    userId?: string
  ) {
    const res = await this.request<any>('/api/projects/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        domain,
        company_profile: companyProfile,
        user_id: userId
      }),
    });
    if (res.success && res.data) {
      return { ...res, data: this.transformProject(res.data) };
    }
    return res;
  }

  async getProject(projectId: string) {
    const res = await this.request<any>(`/api/projects/${projectId}`);
    if (res.success && res.data) {
      return { ...res, data: this.transformProject(res.data) };
    }
    return res;
  }

  async updateProject(projectId: string, data: Record<string, any>) {
    const res = await this.request<any>(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return { ...res, data: this.transformProject(res.data) };
    }
    return res;
  }

  async deleteProject(projectId: string) {
    return this.request(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async getCrawlResults(projectId: string) {
    return this.request(`/api/projects/${projectId}/crawl-results`);
  }

  async saveCrawlResult(projectId: string, data: Record<string, any>) {
    return this.request(`/api/projects/${projectId}/crawl-results`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateDeepGapAnalysis(projectId: string) {
    return this.request('/api/intelligence/analyze/gap-deep', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    });
  }

  async generateBatchContent(projectId: string, tasks: any[], generateImages: boolean = true) {
    return this.request('/api/production/generate-batch', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        tasks,
        generate_images: generateImages
      }),
    });
  }
  async publishContent(projectId: string, platform: string, contentData: any, config?: any) {
    return this.request('/api/publishing/publish', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        platform,
        content_data: contentData,
        config
      }),
    });
  }

  // ==================== Persistence / History API ====================
  async getProjectReports(projectId: string) {
    return this.request(`/api/projects/${projectId}/reports`);
  }

  async getProjectKeywords(projectId: string) {
    return this.request(`/api/projects/${projectId}/keywords`);
  }

  async getProjectPosts(projectId: string) {
    return this.request(`/api/projects/${projectId}/posts`);
  }

  async getProjectTasks(projectId: string) {
    const res = await this.request<any[]>(`/api/projects/${projectId}/tasks`);
    if (res.success && res.data) {
      return { ...res, data: res.data.map(this.transformTask) };
    }
    return res;
  }

  async createTaskBatch(projectId: string, tasks: any[]) {
    return this.request(`/api/projects/${projectId}/tasks/batch`, {
      method: 'POST',
      body: JSON.stringify(tasks),
    });
  }

  async updateTaskStatus(taskId: string, updates: any) {
    return this.request(`/api/projects/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ==================== AI Tools API ====================
  async generateTitles(topic: string, niche: string, profile: Record<string, any>, useTrends: boolean = true) {
    return this.request('/api/production/generate-titles', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        niche,
        profile,
        use_trends: useTrends
      }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
