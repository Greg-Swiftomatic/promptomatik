// API service layer for handling all backend communications
// Uses localStorage for JWT token management

class ApiService {
  constructor() {
    this.baseURL = import.meta.env?.VITE_API_BASE ?? '';
  }

  // Get token from localStorage
  getToken() {
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed.token || null;
    } catch {
      return null;
    }
  }

  // Get default headers with authentication
  getHeaders(additionalHeaders = {}) {
    const baseHeaders = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    const token = this.getToken();
    if (token) {
      baseHeaders['Authorization'] = `Bearer ${token}`;
    }

    return baseHeaders;
  }

  // Generic API request method with error handling and token refresh
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const requestOptions = {
      method: options.method || 'GET',
      headers: this.getHeaders(options.headers),
      ...(options.body ? { body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body) } : {})
    };

    try {
      let response = await fetch(url, requestOptions);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(JSON.stringify({ status: response.status, body: text }));
      }

      return response.json().catch(() => ({}));
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(email, password) {
    return this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(firstName, email, password) {
    return this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: { firstName, email, password },
    });
  }

  async logout() {
    return this.makeRequest('/api/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken() {
    return this.makeRequest('/api/auth/refresh', {
      method: 'POST',
    });
  }

  async forgotPassword(email, language = 'fr') {
    return this.makeRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, language }),
    });
  }

  async resetPassword(token, password) {
    return this.makeRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Prompts endpoints
  async getPrompts(page = 1, limit = 20, filters = {}) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.makeRequest(`/api/prompts?${queryParams}`);
  }

  async createPrompt(promptData) {
    return this.makeRequest('/api/prompts', {
      method: 'POST',
      body: JSON.stringify(promptData),
    });
  }

  async updatePrompt(id, promptData) {
    return this.makeRequest(`/api/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(promptData),
    });
  }

  async deletePrompt(id) {
    return this.makeRequest(`/api/prompts/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleFavorite(id) {
    return this.makeRequest(`/api/prompts/${id}/favorite`, {
      method: 'POST',
    });
  }

  async getPromptStats() {
    return this.makeRequest('/api/prompts/stats');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;