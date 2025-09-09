const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://serena-workspace-production.up.railway.app/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Project endpoints
  async getProjects() {
    return this.request('/projects');
  }

  async createProject(projectData) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getProject(projectId) {
    return this.request(`/projects/${projectId}`);
  }

  async updateProject(projectId, projectData) {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(projectId) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async addCollaborator(projectId, collaboratorData) {
    return this.request(`/projects/${projectId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify(collaboratorData),
    });
  }

  async removeCollaborator(projectId, userId) {
    return this.request(`/projects/${projectId}/collaborators/${userId}`, {
      method: 'DELETE',
    });
  }

  // Page endpoints
  async createPage(pageData) {
    return this.request('/pages', {
      method: 'POST',
      body: JSON.stringify(pageData),
    });
  }

  async getPage(pageId) {
    return this.request(`/pages/${pageId}`);
  }

  async updatePageContent(pageId, content, changeDescription) {
    return this.request(`/pages/${pageId}/content`, {
      method: 'PUT',
      body: JSON.stringify({ content, changeDescription }),
    });
  }

  async updatePageTitle(pageId, title, changeDescription) {
    return this.request(`/pages/${pageId}/title`, {
      method: 'PUT',
      body: JSON.stringify({ title, changeDescription }),
    });
  }

  async deletePage(pageId) {
    return this.request(`/pages/${pageId}`, {
      method: 'DELETE',
    });
  }

  async getPageVersions(pageId) {
    return this.request(`/pages/${pageId}/versions`);
  }

  async restorePageVersion(pageId, versionId) {
    return this.request(`/pages/${pageId}/restore`, {
      method: 'POST',
      body: JSON.stringify({ versionId }),
    });
  }

  async createPageLink(pageId, linkData) {
    return this.request(`/pages/${pageId}/links`, {
      method: 'POST',
      body: JSON.stringify(linkData),
    });
  }
}

export default new ApiService();
