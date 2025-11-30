'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface TimerProps {
  onStart: () => void
  onPause: () => void
}

export default function Timer({ onStart, onPause }: TimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive])

  const toggle = () => {
    if (!isActive) {
      onStart()
    } else {
      onPause()
    }
    setIsActive(!isActive)
  }

  const reset = () => {
    setSeconds(0)
    setIsActive(false)
    onPause()
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-8xl md:text-9xl font-black font-mono tracking-wider tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-2xl">
        {formatTime(seconds)}
      </div>

      <div className="flex gap-6">
        <button
          onClick={toggle}
          className={`p-6 rounded-full transition-all transform hover:scale-110 ${
            isActive 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' 
              : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
          }`}
        >
          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
        </button>

        <button
          onClick={reset}
          className="p-6 rounded-full bg-white/5 text-gray-400 hover:bg-white/20 hover:text-white transition-all transform hover:scale-110"
        >
          <RotateCcw size={32} />
        </button>
      </div>
    </div>
  )
}
