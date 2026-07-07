import { useNavigate } from 'react-router-dom'
import { subscriptionsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '20 AI messages per day',
      'Up to 10 tasks',
      'News headlines',
      'Calendar view',
    ],
    locked: ['Voice / wake-word', 'Unlimited tasks', 'Full articles'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$5',
    period: '/month',
    features: [
      'Unlimited AI messages',
      'Unlimited tasks',
      'Full news articles',
      'Calendar creation & editing',
      'Voice with wake-word',
    ],
    locked: ['Priority support'],
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$12',
    period: '/month',
    features: [
      'Everything in Pro',
      'Personalised news feed',
      'Priority support',
      'Early access to new features',
    ],
    locked: [],
  },
]

export default function PricingPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const handleUpgrade = async (tier) => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const { data } = await subscriptionsApi.createCheckout(tier)
      window.location.href = data.checkout_url
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-16 px-4">
      <button onClick={() => navigate(-1)} className="self-start mb-8 text-gray-500 hover:text-white text-sm transition-colors">
        ← Back
      </button>
      <h1 className="font-display text-4xl font-bold text-white mb-2">Simple pricing</h1>
      <p className="text-gray-400 mb-12">Start free. Upgrade when Friday becomes indispensable.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`card flex flex-col gap-5 relative ${
              plan.highlight ? 'border-friday-500 ring-1 ring-friday-500/30' : ''
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-friday-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most popular
              </span>
            )}
            <div>
              <h2 className="font-semibold text-white text-lg">{plan.name}</h2>
              <p className="mt-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </p>
            </div>

            <ul className="space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-green-400 shrink-0">✓</span> {f}
                </li>
              ))}
              {plan.locked.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-gray-600 line-through">
                  <span className="shrink-0">✕</span> {f}
                </li>
              ))}
            </ul>

            {plan.id === 'free' ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-ghost w-full text-center"
              >
                {user ? 'Go to dashboard' : 'Get started free'}
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade(plan.id)}
                className={`w-full text-center py-2.5 rounded-xl font-medium transition-colors ${
                  plan.highlight
                    ? 'btn-primary'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                {user?.tier === plan.id ? 'Current plan' : `Upgrade to ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-gray-600 text-xs mt-10">
        Payments processed by Paystack · Cancel anytime · M-Pesa support coming soon
      </p>
    </div>
  )
}
