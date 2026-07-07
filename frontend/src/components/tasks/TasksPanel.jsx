import { useEffect, useState } from 'react'
import { tasksApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const PRIORITY_COLORS = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-green-400',
}

export default function TasksPanel() {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchTasks = async () => {
    try {
      const { data } = await tasksApi.list()
      setTasks(data.results || data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const addTask = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const { data } = await tasksApi.create({ title: newTitle.trim() })
      setTasks((prev) => [data, ...prev])
      setNewTitle('')
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not create task.')
    } finally {
      setAdding(false)
    }
  }

  const toggleTask = async (id) => {
    const { data } = await tasksApi.toggle(id)
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
  }

  const deleteTask = async (id) => {
    await tasksApi.delete(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const pending = tasks.filter((t) => !t.completed)
  const done = tasks.filter((t) => t.completed)

  return (
    <div className="card flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Tasks</h2>
        <span className="text-xs text-gray-500">
          {pending.length} pending
          {user?.tier === 'free' && ` · ${tasks.length}/10`}
        </span>
      </div>

      {/* Add task */}
      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a task…"
          className="input text-sm"
        />
        <button
          onClick={addTask}
          disabled={adding || !newTitle.trim()}
          className="btn-primary text-sm px-3 disabled:opacity-40"
        >
          +
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 -mx-1 px-1">
          {pending.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
          ))}
          {done.length > 0 && (
            <>
              <p className="text-xs text-gray-600 mt-3 mb-1">Completed</p>
              {done.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              ))}
            </>
          )}
          {tasks.length === 0 && (
            <p className="text-center text-gray-600 text-sm mt-8">
              No tasks yet. Add one above or ask Friday.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-3 group p-2 rounded-xl hover:bg-gray-800 transition-colors">
      <button
        onClick={() => onToggle(task.id)}
        className={`h-6 flex items-center content-center aspect-square p-1 rounded-full border text-black shrink-0 transition-colors ${
          task.completed ? 'bg-primary-500 border-primary-500' : 'border-gray-600 hover:border-primary-400'
        }`}
      >{task.completed ? "✓" : ""}</button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${task.completed ? 'line-through text-gray-600' : 'text-gray-200'}`}>
          {task.title}
        </p>
        {task.due_date && (
          <p className="text-xs text-gray-600">{task.due_date}</p>
        )}
      </div>
      <span className={`text-xs ${PRIORITY_COLORS[task.priority]} opacity-0 group-hover:opacity-100 transition-opacity`}>
        {task.priority}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 text-sm"
      >
        ✕
      </button>
    </div>
  )
}
