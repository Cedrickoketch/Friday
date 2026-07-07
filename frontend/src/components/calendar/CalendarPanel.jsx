import { useEffect, useState } from 'react'
import { calendarApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { format, parseISO } from 'date-fns'

export default function CalendarPanel() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [readonly, setReadonly] = useState(false)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', start: '', end: '', description: '' })

  useEffect(() => {
    calendarApi.listEvents()
      .then(({ data }) => {
        setEvents(data.events)
        setReadonly(data.readonly)
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Could not load calendar.')
      })
      .finally(() => setLoading(false))
  }, [])

  const createEvent = async () => {
    try {
      const { data } = await calendarApi.createEvent(form)
      setEvents((prev) => [...prev, data.event])
      setShowAdd(false)
      setForm({ title: '', start: '', end: '', description: '' })
    } catch (err) {
      alert(err.response?.data?.error || 'Could not create event.')
    }
  }

  const formatEventTime = (event) => {
    const dt = event.start?.dateTime || event.start?.date
    if (!dt) return ''
    try {
      return format(parseISO(dt), event.start?.dateTime ? 'MMM d, h:mm a' : 'MMM d')
    } catch { return dt }
  }

  return (
    <div className="card flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Calendar</h2>
        {!readonly && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-ghost text-sm py-1 px-2"
          >
            {showAdd ? 'Cancel' : '+ Add event'}
          </button>
        )}
      </div>

      {showAdd && !readonly && (
        <div className="space-y-2 animate-slide-up border border-gray-800 rounded-xl p-3">
          <input
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start</label>
              <input
                type="datetime-local"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End</label>
              <input
                type="datetime-local"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
                className="input text-sm"
              />
            </div>
          </div>
          <button onClick={createEvent} className="btn-primary text-sm w-full">
            Create Event
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-gray-600 text-sm">
          <p>{error}</p>
          <p className="text-xs mt-1">Re-authenticate with Google to grant Calendar access.</p>
        </div>
      ) : events.length === 0 ? (
        <p className="text-center text-gray-600 text-sm">No upcoming events.</p>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-64">
          {events.map((event) => (
            <div key={event.id} className="flex gap-3 items-start p-2 rounded-xl hover:bg-gray-800 transition-colors">
              <div className="w-1.5 rounded-full bg-friday-500 self-stretch shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 font-medium truncate">{event.summary}</p>
                <p className="text-xs text-gray-500">{formatEventTime(event)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {readonly && user?.tier === 'free' && (
        <p className="text-xs text-gray-600 text-center">
          Calendar creation requires Pro or Premium.
        </p>
      )}
    </div>
  )
}
