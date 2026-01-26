// API Client for Knowledge Management System
// Centralized client for all API calls

const API_BASE = "/api";

export const api = {
  // Documents
  documents: {
    list: async (params: Record<string, string> = {}) => {
      const url = new URLSearchParams(params);
      const response = await fetch(`${API_BASE}/documents?${url}`);
      return response.json();
    },
    get: async (id: string) => {
      const response = await fetch(`${API_BASE}/documents/${id}`);
      return response.json();
    },
    upload: async (formData: FormData) => {
      const response = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        body: formData,
      });
      return response.json();
    },
    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/documents/${id}`, {
        method: "DELETE",
      });
      return response.json();
    },
    upvote: async (id: string) => {
      const response = await fetch(`${API_BASE}/documents/${id}/upvote`, {
        method: "POST",
      });
      return response.json();
    },
    downvote: async (id: string) => {
      const response = await fetch(`${API_BASE}/documents/${id}/downvote`, {
        method: "POST",
      });
      return response.json();
    },
    download: async (id: string) => {
      const response = await fetch(`${API_BASE}/documents/${id}/download`, {
        method: "POST",
      });
      return response.json();
    },
    counts: async (params: Record<string, string> = {}) => {
      const url = new URLSearchParams(params);
      const response = await fetch(`${API_BASE}/documents/counts?${url}`);
      return response.json();
    },
    view: async (id: string) => {
      const response = await fetch(`${API_BASE}/documents/${id}/view`, {
        method: "POST",
      });
      return response.json();
    },
  },

  // Search
  search: async (params: Record<string, string> = {}) => {
    const url = new URLSearchParams(params);
    const response = await fetch(`${API_BASE}/search?${url}`);
    return response.json();
  },

  // Comments
  comments: {
    create: async (data: any) => {
      const response = await fetch(`${API_BASE}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  },

  // Notifications
  notifications: {
    list: async () => {
      const response = await fetch(`${API_BASE}/notifications`);
      return response.json();
    },
    markRead: async (id: string) => {
      const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "POST",
      });
      return response.json();
    },
  },

  // User
  user: {
    current: async () => {
      const response = await fetch(`${API_BASE}/users`);
      return response.json();
    },
    get: async (id: string) => {
      const response = await fetch(`${API_BASE}/users/${id}`);
      return response.json();
    },
    sync: async () => {
      const response = await fetch(`${API_BASE}/users/sync`, {
        method: "POST",
      });
      return response.json();
    },
    uploads: async () => {
      const response = await fetch(`${API_BASE}/users/uploads`);
      return response.json();
    },
    downloads: async () => {
      const response = await fetch(`${API_BASE}/users/downloads`);
      return response.json();
    },
    saved: async () => {
      const response = await fetch(`${API_BASE}/users/saved`);
      return response.json();
    },
    liked: async () => {
      const response = await fetch(`${API_BASE}/users/liked`);
      return response.json();
    },
  },

  // Documents - save/unsave
  saved: {
    toggle: async (documentId: string) => {
      const response = await fetch(`${API_BASE}/documents/${documentId}/save`, {
        method: "POST",
      });
      return response.json();
    },
  },

  // Failed searches
  failedSearch: {
    log: async (data: any) => {
      const response = await fetch(`${API_BASE}/search/failed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  },

  // Admin
  admin: {
    stats: async () => {
      const response = await fetch(`${API_BASE}/admin/stats`);
      return response.json();
    },
    pending: async () => {
      const response = await fetch(`${API_BASE}/admin/pending`);
      return response.json();
    },
    downvoted: async () => {
      const response = await fetch(`${API_BASE}/admin/downvoted`);
      return response.json();
    },
    users: async (params: Record<string, string> = {}) => {
      const url = new URLSearchParams(params);
      const response = await fetch(`${API_BASE}/admin/users?${url}`);
      return response.json();
    },
    userDetails: async (id: string) => {
      const response = await fetch(`${API_BASE}/admin/users/${id}`);
      return response.json();
    },
    approve: async (id: string) => {
      const response = await fetch(
        `${API_BASE}/admin/documents/${id}/approve`,
        {
          method: "POST",
        },
      );
      return response.json();
    },
    reject: async (id: string, reason: string) => {
      const response = await fetch(`${API_BASE}/admin/documents/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      return response.json();
    },
    categorize: async (id: string, data: any) => {
      const response = await fetch(
        `${API_BASE}/admin/documents/${id}/categorize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      return response.json();
    },
    complement: async (data: any) => {
      const response = await fetch(`${API_BASE}/admin/complement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  },
};
