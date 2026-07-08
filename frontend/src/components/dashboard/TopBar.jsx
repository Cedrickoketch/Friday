import { useAuthStore } from '../../store/authStore'
import { subscriptionsApi } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const TIER_BADGE = {
  free: 'badge-free',
  pro: 'badge-pro',
  premium: 'badge-premium',
}

export default function TopBar() {
  const { user, logout } = useAuthStore()

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
        <span className="font-display text-xl text-white">Friday</span>

        <div className="flex items-center gap-3">
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

          <div className="flex items-center gap-2 group relative cursor-pointer">
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

            {/* Dropdown */}
            <div className="absolute right-0 top-10 hidden group-hover:flex flex-col bg-gray-900 border border-gray-800 rounded-xl shadow-xl min-w-[160px] py-1 z-50">
              <button
                onClick={logout}
                className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
