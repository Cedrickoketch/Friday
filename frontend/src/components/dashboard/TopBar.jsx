import { useAuthStore } from '../../store/authStore'
import { subscriptionsApi } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const TIER_BADGE = {
  free: 'badge-free',
  pro: 'badge-pro',
  premium: 'badge-premium',
}

export default function TopBar() {
  const { user, logout } = useAuthStore()
  const [ isActive, setIsActive ] = useState(false)

  const handleUpgrade = async (tier) => {
    try {
      const { data } = await subscriptionsApi.createCheckout(tier)
      window.location.href = data.checkout_url
    } catch (err) {
      console.error(err)
    }
  }

  const userTier = user?.tier ? String(user.tier).toLowerCase() : 'free'
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xs sticky top-0 z-30">
      <div className="max-w-(--breakpoint-2xl) mx-auto px-4 h-14 flex items-center justify-between">
        {/* Friday Wordmark */}
        <span className="font-display text-xl text-white">Friday</span>

        <div className="flex items-center gap-3">
          {/* Upgrade and pricing section */}
          <a className='btn-primary text-sm' href='/pricing'>Pricing</a>

          {user?.tier === 'free' && (
            <button
              onClick={() => handleUpgrade('pro')}
              className="btn-primary text-sm py-1.5 cursor-pointer"
            >
              Upgrade to Pro
            </button>
          )}

          <span className={TIER_BADGE[user?.tier || 'free']}>
            {user?.tier?.toUpperCase()}
          </span>

          {/* User authentication section */}
          <button
          className="flex items-center gap-2 group relative cursor-pointer"
          onClick={() => setIsActive(!isActive)}>
            {/* User image */}
            <div className='flex justify-center items-center hover:bg-gray-800 hover:font-bold hover:text-white p-1 rounded-2xl transition-all duration-150 ease-out font-semibold'>
              {user?.avatar ? (
              <img referrerPolicy="no-referrer" src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
              ) : (
              <div className="w-8 h-8 rounded-full bg-friday-500 flex items-center justify-center text-sm font-semibold">
                {user?.first_name?.[0] || user?.email?.[0]}
              </div>
              )}
              <span className="text-sm text-gray-300 hidden md:block">
                {user?.first_name || user?.email}
              </span>
            </div>

            {/* Dropdown */}

            <div 
              className={`absolute right-0 top-12 flex-col bg-gray-900 border border-gray-800 rounded-xl shadow-xl min-w-40 py-1 z-50 ${isActive ? 'opacity-full': 'opacity-0'} transition-all duration-150 ease-in`}>
              <div
                onClick={logout}
                className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                Sign out
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
