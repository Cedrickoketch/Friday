import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const { loginWithGoogle, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  // Handles the Authorization Code response from Google
  const handleAuthorizationResponse = useCallback(
    async (response) => {
      // response.code contains the raw auth code your Django backend needs
      if (response.code) {
        try {
          await loginWithGoogle(response.code) // 👈 Sends code instead of credential string
          navigate('/dashboard', { replace: true })
        } catch (err) {
          console.error('Login failed', err)
        }
      }
    },
    [loginWithGoogle, navigate]
  )

  // Triggers the standard Google OAuth 2.0 Code flow popup
  const handleGoogleSignInClick = useCallback(() => {
    if (!window.google) return

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      // Request profile, email, and full Calendar access
      scope: 'openid profile email https://www.googleapis.com/auth/calendar',
      ux_mode: 'popup',
      select_account: true,
      prompt: 'consent',       // 👈 Forces the checkboxes to show up
      access_type: 'offline',   // 👈 Tells Google to grant a refresh_token for your backend
      callback: handleAuthorizationResponse,
    })

    client.requestCode()
  }, [handleAuthorizationResponse])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gray-950 px-4">
      {/* Logo / wordmark */}
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

      {/* Custom styled Google Button to trigger the code client */}
      <button
        onClick={handleGoogleSignInClick}
        className="w-[280px] h-[44px] flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-full px-4 shadow transition duration-200 text-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      <p className="text-gray-600 text-xs">
        By signing in you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}