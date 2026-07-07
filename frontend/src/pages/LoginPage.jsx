import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const { loginWithGoogle, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const handleCredentialResponse = useCallback(
    async (response) => {
      try {
        await loginWithGoogle(response.credential)
        navigate('/dashboard', { replace: true })
      } catch (err) {
        console.error('Login failed', err)
      }
    },
    [loginWithGoogle, navigate]
  )

  useEffect(() => {
    if (!window.google) return
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    })
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 280,
      }
    )
  }, [handleCredentialResponse])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gray-950 px-4">
      {/* Logo / wordmark — style this however you like */}
      <div className="text-center">
        <h1 className="font-display text-6xl text-white tracking-tight">Friday</h1>
        <p className="mt-2 text-gray-400 text-lg">Your AI second brain</p>
      </div>

      {/* Feature bullets */}
      <ul className="text-gray-500 text-sm space-y-1 text-center">
        <li>✦ Chat with AI · manage tasks · check your calendar</li>
        <li>✦ Stay updated with Kenyan and international news</li>
        <li>✦ Voice control with wake-word support</li>
      </ul>

      {/* Google Sign-In button — rendered by the Google script */}
      <div id="google-signin-btn" />

      <p className="text-gray-600 text-xs">
        By signing in you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}
