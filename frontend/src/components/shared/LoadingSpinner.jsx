export default function LoadingSpinner({ fullScreen = false }) {
  const inner = (
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-gray-700 border-t-friday-500 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Loading Friday…</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        {inner}
      </div>
    )
  }
  return inner
}
