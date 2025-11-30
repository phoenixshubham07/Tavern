'use client'

import { useState } from 'react'
import { findMatch } from '@/app/tavern/duel/actions'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Swords } from 'lucide-react'

export default function Lobby({ onMatchFound }: { onMatchFound: (matchId: string) => void }) {
  const [year, setYear] = useState('Freshman')
  const [stream, setStream] = useState('Computer Science')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const handleFindDuel = async () => {
    setLoading(true)
    setStatus('Searching for opponent...')
    
    try {
      const result = await findMatch(year, stream)
      
      if (result.matchId) {
        // Instant match found!
        onMatchFound(result.matchId)
      } else if (result.queued) {
        // Queued, listen for match
        setStatus('Waiting for opponent...')
        const supabase = createClient()
        
        const channel = supabase
          .channel('duel_queue')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'duel_matches',
              filter: `player1_id=eq.${(await supabase.auth.getUser()).data.user?.id}`,
            },
            (payload) => {
              // I am player 1 (match creator found me)
              onMatchFound(payload.new.id)
              channel.unsubscribe()
            }
          )
          .on(
             'postgres_changes',
             {
               event: 'INSERT',
               schema: 'public',
               table: 'duel_matches',
               filter: `player2_id=eq.${(await supabase.auth.getUser()).data.user?.id}`,
             },
             (payload) => {
               // I am player 2 (I found match) - though findMatch handles this, 
               // this covers edge cases or if logic changes.
               onMatchFound(payload.new.id)
               channel.unsubscribe()
             }
           )
          .subscribe()
      }
    } catch (error) {
      console.error(error)
      setStatus('Error finding match.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center gap-4">
          <Swords size={64} /> DUEL DECKS
        </h1>
        <p className="text-2xl text-gray-400">1v1 AI Flashcard Battles</p>
      </div>

      <div className="bg-[#1a1b1e] p-8 rounded-3xl border border-white/10 w-full max-w-md space-y-6 shadow-2xl">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-400 uppercase">Year</label>
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option>Freshman</option>
            <option>Sophomore</option>
            <option>Junior</option>
            <option>Senior</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-400 uppercase">Stream</label>
          <select 
            value={stream} 
            onChange={(e) => setStream(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option>Computer Science</option>
            <option>Biology</option>
            <option>History</option>
            <option>Physics</option>
          </select>
        </div>

        <button
          onClick={handleFindDuel}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> {status}
            </>
          ) : (
            'FIND DUEL'
          )}
        </button>
      </div>
    </div>
  )
}
