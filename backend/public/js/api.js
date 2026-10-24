/**
 * API Client Utility
 * Wraps Fetch API, manages JWT token, and handles standard API responses.
 */

const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('chat_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('chat_token', token);
    } else {
      localStorage.removeItem('chat_token');
    }
  },

  getUser() {
    const userStr = localStorage.getItem('chat_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('chat_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('chat_user');
    }
  },

  clearAuth() {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        this.clearAuth();
        if (!window.location.pathname.includes('login.html')) {
          window.location.href = '/login.html';
        }
        throw new Error(data.error || 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
      }

      if (!response.ok) {
        throw new Error(data.error || `Yêu cầu thất bại (${response.status})`);
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  // Auth endpoints
  auth: {
    register: (payload) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    logout: () => api.request('/auth/logout', { method: 'POST' }),
    me: () => api.request('/auth/me'),
  },

  // Users endpoints
  users: {
    list: () => api.request('/users'),
    get: (id) => api.request(`/users/${id}`),
    search: (q) => api.request(`/users/search?q=${encodeURIComponent(q || '')}`),
    updateProfile: (payload) => api.request('/users/profile', { method: 'PUT', body: JSON.stringify(payload) }),
    changePassword: (payload) => api.request('/users/change-password', { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => api.request(`/users/${id}`, { method: 'DELETE' }),
  },

  // Rooms endpoints
  rooms: {
    list: () => api.request('/rooms'),
    create: (payload) => api.request('/rooms', { method: 'POST', body: JSON.stringify(payload) }),
    get: (id) => api.request(`/rooms/${id}`),
    join: (id, payload = {}) => api.request(`/rooms/${id}/join`, { method: 'POST', body: JSON.stringify(payload) }),
    leave: (id, payload = {}) => api.request(`/rooms/${id}/leave`, { method: 'POST', body: JSON.stringify(payload) }),
    members: (id) => api.request(`/rooms/${id}/members`),
    delete: (id) => api.request(`/rooms/${id}`, { method: 'DELETE' }),
  },

  // Messages endpoints
  messages: {
    list: (roomId, limit = 50) => api.request(`/rooms/${roomId}/messages?limit=${limit}`),
    send: (roomId, content) => api.request(`/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  },
};

window.api = api;
