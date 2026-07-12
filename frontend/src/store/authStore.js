import { create } from 'zustand'
import { authApi } from '../services/api'

export const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (userData) => set({ user: userData }),

  init: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      set({ isLoading: false })
      return
    }
    try {
      const { data } = await authApi.getProfile()
      set({ user: data, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ isLoading: false })
    }
  },

  loginWithGoogle: async (code) => {
    try {
      const { data } = await authApi.googleLogin(code) 
      localStorage.setItem('access_token', data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
      set({ user: data.user, isAuthenticated: true })
      return data.user
    } catch (error) {
      console.error("❌ Google Login Failed inside authStore:")
      if (error.response) {
        // The server responded with a status code outside of 2xx
        console.error("Backend Error Response Body:", error.response.data)
        console.error("Backend Error Status:", error.response.status)
      } else {
        console.error("Error setting up request:", error.message)
      }
      // Re-throw so your LoginPage.jsx catch block can still see it if needed
      throw error 
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },

  refreshUser: async () => {
    const { data } = await authApi.getProfile()
    set({ user: data })
  },
}))
