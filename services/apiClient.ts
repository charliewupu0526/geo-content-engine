/**
 * API Client - Unified interface for backend API calls
 */

// AWS EC2 后端地址 (无超时限制)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://44.220.84.143:8000';

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
  async scrapeUrl(url: string, formats: string[] = ['markdown', 'html']) {
    return this.request('/api/crawler/scrape', {
      method: 'POST',
      body: JSON.stringify({ url, formats }),
    });
  }

  async crawlWebsite(
    url: string,
    maxPages: number = 10,
    includePaths?: string[],
    excludePaths?: string[]
  ) {
    return this.request('/api/crawler/crawl', {
      method: 'POST',
      body: JSON.stringify({
        url,
        max_pages: maxPages,
        include_paths: includePaths,
        exclude_paths: excludePaths,
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
    competitorUrls: string[]
  ) {
    return this.request('/api/intelligence/analyze-competitor', {
      method: 'POST',
      body: JSON.stringify({
        company_profile: companyProfile,
        competitor_urls: competitorUrls,
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

  // ==================== Projects API ====================
  async listProjects() {
    return this.request('/api/projects/');
  }

  async createProject(
    name: string,
    domain: string,
    companyProfile?: Record<string, any>
  ) {
    return this.request('/api/projects/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        domain,
        company_profile: companyProfile,
      }),
    });
  }

  async getProject(projectId: string) {
    return this.request(`/api/projects/${projectId}`);
  }

  async updateProject(projectId: string, data: Record<string, any>) {
    return this.request(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
