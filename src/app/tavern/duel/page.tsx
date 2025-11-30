'use client'

import { useState } from 'react'
import Lobby from '@/components/duel/Lobby'
import Arena from '@/components/duel/Arena'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DuelPage() {
  const [matchId, setMatchId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[#202225] text-white font-sans flex">
      {/* Sidebar (Simplified) */}
      <nav className="w-[72px] bg-[#202225] flex flex-col items-center py-4 gap-4 border-r border-black/20">
        <Link href="/" className="w-12 h-12 bg-[#36393f] rounded-full flex items-center justify-center hover:bg-accent-blue hover:text-white transition-all group" title="Dashboard">
            <ArrowLeft size={24} />
        </Link>
        <div className="w-8 h-[2px] bg-white/10 rounded-full my-2"></div>
        <Link href="/inkflow" className="w-12 h-12 bg-[#36393f] rounded-[24px] hover:rounded-[16px] flex items-center justify-center hover:bg-accent-blue transition-all group" title="InkFlow Editor">
          <span className="text-2xl">✒️</span>
        </Link>
        <Link href="/roaster" className="w-12 h-12 bg-[#36393f] rounded-[24px] hover:rounded-[16px] flex items-center justify-center hover:bg-accent-blue transition-all group" title="CV Roaster">
          <span className="text-2xl">🔥</span>
        </Link>
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-[16px] flex items-center justify-center transition-all shadow-lg" title="Duel Decks">
          <span className="text-2xl">⚔️</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-[#36393f] flex flex-col items-center justify-center p-8 relative overflow-y-auto">
        {matchId ? (
          <Arena matchId={matchId} />
        ) : (
          <Lobby onMatchFound={setMatchId} />
        )}
      </main>
    </div>
  )
}
