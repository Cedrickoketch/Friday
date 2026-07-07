import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  googleLogin: (credential) => api.post('/auth/google/', { credential }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
}

// ── Assistant ────────────────────────────────────────────────────────────────
export const assistantApi = {
  chat: (message, conversationId) =>
    api.post('/assistant/chat/', { message, conversation_id: conversationId }),
  getConversations: () => api.get('/assistant/conversations/'),
  getConversation: (id) => api.get(`/assistant/conversations/${id}/`),
  deleteConversation: (id) => api.delete(`/assistant/conversations/${id}/`),
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: () => api.get('/tasks/'),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.patch(`/tasks/${id}/`, data),
  toggle: (id) => api.patch(`/tasks/${id}/toggle/`),
  delete: (id) => api.delete(`/tasks/${id}/`),
}

// ── Calendar ─────────────────────────────────────────────────────────────────
export const calendarApi = {
  listEvents: () => api.get('/calendar/events/'),
  createEvent: (data) => api.post('/calendar/events/', data),
  deleteEvent: (id) => api.delete(`/calendar/events/${id}/`),
}

// ── News ──────────────────────────────────────────────────────────────────────
export const newsApi = {
  getHeadlines: (params) => api.get('/news/', { params }),
}

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const subscriptionsApi = {
  createCheckout: (tier) => api.post('/subscriptions/checkout/', { tier }),
  cancelSubscription: () => api.post('/subscriptions/cancel/'),
}

export default api
