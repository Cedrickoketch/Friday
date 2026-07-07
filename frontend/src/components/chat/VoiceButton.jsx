import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../store/authStore'

const WAKE_WORD = 'hey friday'

export default function VoiceButton({ onTranscript }) {
  const { user } = useAuthStore()
  const [isListening, setIsListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef(null)

  // Voice requires Pro or Premium
  const canUseVoice = user?.tier !== 'free'

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-KE'

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim()
        // Strip wake word if present
        const clean = transcript.toLowerCase().startsWith(WAKE_WORD)
          ? transcript.slice(WAKE_WORD.length).trim()
          : transcript
        onTranscript(clean)
        setIsListening(false)
      }

      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)

      recognitionRef.current = recognition
    }
  }, [onTranscript])

  const toggle = () => {
    if (!canUseVoice || !supported) return
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  if (!supported) return null

  return (
    <button
      onClick={toggle}
      title={!canUseVoice ? 'Voice requires Pro or Premium' : isListening ? 'Stop listening' : 'Start voice input'}
      className={`
        shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200
        ${!canUseVoice
          ? 'opacity-30 cursor-not-allowed bg-gray-800'
          : isListening
            ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse'
            : 'bg-gray-800 hover:bg-gray-700'
        }
      `}
      disabled={!canUseVoice}
    >
      {/* Microphone icon */}
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-1 15.93V21h2v-2.07A8.001 8.001 0 0 0 20 11h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z" />
      </svg>
    </button>
  )
}
