import { create } from 'zustand'
import { assistantApi } from '../services/api'

export const useChatStore = create((set, get) => ({
  isOpen: false,
  messages: [],
  conversationId: null,
  isLoading: false,
  error: null,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  sendMessage: async (text) => {
    const { conversationId } = get()
    set((s) => ({
      isLoading: true,
      error: null,
      messages: [...s.messages, { role: 'user', content: text }],
    }))

    try {
      const { data } = await assistantApi.chat(text, conversationId)
      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: data.reply }],
        conversationId: data.conversation_id,
        isLoading: false,
      }))
      return data
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong.'
      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: msg, isError: true }],
        isLoading: false,
        error: msg,
      }))
    }
  },

  clearMessages: () => set({ messages: [], conversationId: null }),
}))
