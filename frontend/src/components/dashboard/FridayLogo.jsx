import { useChatStore } from '../../store/chatStore'

export default function FridayLogo({ onClick }) {
  const { isOpen } = useChatStore()

  return (
    <button
      onClick={onClick}
      aria-label="Open Friday chat"
      className={`
        relative w-32 h-32 rounded-full
        flex items-center justify-center
        transition-all duration-500 ease-out
        group mt-4
        ${isOpen ? 'scale-110' : 'hover:scale-105'}
      `}
    >
      {/* Outer glow ring */}
      <span
        className={`
          absolute inset-0 rounded-full border-2 border-friday-500/40
          transition-all duration-500
          ${isOpen ? 'scale-125 opacity-0' : 'group-hover:scale-110 group-hover:opacity-60 opacity-30'}
        `}
      />
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-friday-500/10 animate-pulse-slow" />
      {/* Core */}
      <span className="relative z-10 w-24 h-24 rounded-full bg-linear-to-br from-friday-500 to-friday-700 flex items-center justify-center shadow-lg shadow-friday-500/30">
        <img src={logo} alt="Friday Logo" className="w-full h-full object-contain" />
      </span>
    </button>
  )
}
