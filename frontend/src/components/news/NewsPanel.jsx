import { useEffect, useState } from 'react'
import { newsApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const CATEGORIES = ['general', 'technology', 'business', 'health', 'sports', 'entertainment']

export default function NewsPanel() {
  const { user } = useAuthStore()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('general')
  const [country, setCountry] = useState('ke')

  const fetchNews = async () => {
    setLoading(true)
    try {
      const { data } = await newsApi.getHeadlines({ category, country })
      setArticles(data.articles)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNews() }, [category, country])

  return (
    <div className="card flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-white">News</h2>
        <div className="flex gap-2">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1 outline-hidden"
          >
            <option value="ke">🇰🇪 Kenya</option>
            <option value="us">🇺🇸 US</option>
            <option value="gb">🇬🇧 UK</option>
            <option value="za">🇿🇦 South Africa</option>
          </select>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto -mx-1 px-1 py-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
              category === cat
                ? 'bg-friday-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="h-[65vh] overflow-y-auto space-y-3 py-10">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-16 h-14 bg-gray-800 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-800 rounded-sm w-3/4" />
                <div className="h-3 bg-gray-800 rounded-sm w-1/2" />
              </div>
            </div>
          ))
        ) : articles.length === 0 ? (
          <p className="text-center text-gray-600 text-sm mt-8">No articles found.</p>
        ) : (
          articles.map((article, i) => (
            <NewsCard key={i} article={article} isPro={user?.tier !== 'free'} />
          ))
        )}
      </div>
    </div>
  )
}

function NewsCard({ article, isPro }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 group hover:bg-gray-800 rounded-xl p-2 -mx-2 transition-colors"
    >
      {article.urlToImage && (
        <img
          src={article.urlToImage}
          alt=""
          className="w-16 h-14 object-cover rounded-xl shrink-0 bg-gray-800"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {article.title}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {article.source?.name} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''}
        </p>
        {!isPro && article.content === null && (
          <span className="text-xs text-friday-500 mt-0.5 block">Upgrade for full article</span>
        )}
      </div>
    </a>
  )
}
