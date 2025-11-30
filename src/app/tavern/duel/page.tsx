'use client'

import { useState } from 'react'
import Lobby from '@/components/duel/Lobby'
import Arena from '@/components/duel/Arena'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DuelPage() {
  const [matchId, setMatchId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
        {matchId ? (
          <Arena matchId={matchId} />
        ) : (
          <Lobby onMatchFound={setMatchId} />
        )}
      </main>
    </div>
  )
}
