'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { submitMove } from '@/app/tavern/duel/actions'
import { Loader2, Trophy } from 'lucide-react'

type Flashcard = {
  concept: string
  question: string
  options: string[]
  answer: string
  image_url: string
}

type MatchState = {
  status: 'loading' | 'active' | 'finished' | 'error'
  current_round: number
  scores: { p1: number; p2: number }
  deck: Flashcard[]
}

export default function Arena({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<MatchState | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [waitingForNextRound, setWaitingForNextRound] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))

    // Initial Fetch
    const fetchMatch = async () => {
      const { data } = await supabase
        .from('duel_matches')
        .select('*')
        .eq('id', matchId)
        .single()
      
      if (data) setMatch(data)
    }

    fetchMatch()

    // Realtime Subscription
    const channel = supabase
      .channel(`match_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'duel_matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          setMatch(payload.new as MatchState)
          // Reset round state if round changed
          if (payload.new.current_round !== match?.current_round) {
            setSelectedOption(null)
            setWaitingForNextRound(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, match?.current_round])

  const handleOptionClick = async (option: string) => {
    if (selectedOption || waitingForNextRound) return
    
    setSelectedOption(option)
    setWaitingForNextRound(true)

    if (match) {
      await submitMove(matchId, match.current_round, option)
    }
  }

  if (match && match.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-red-500 font-bold text-2xl">Connection Failed</div>
        <p className="text-gray-400">The AI Wizard is taking a nap. Please try again.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!match || match.status === 'loading' || !match.deck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-16 h-16 animate-spin text-purple-500" />
        <h2 className="text-2xl font-bold animate-pulse">Summoning Battle Deck...</h2>
        <p className="text-gray-400">AI is crafting trick questions and fetching artifacts.</p>
      </div>
    )
  }

  if (match.status === 'finished') {
    const p1Win = match.scores.p1 > match.scores.p2
    const tie = match.scores.p1 === match.scores.p2
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in zoom-in">
        <Trophy size={128} className="text-yellow-400" />
        <h1 className="text-6xl font-black text-white">GAME OVER</h1>
        <div className="text-4xl font-bold space-y-2 text-center">
          <p className="text-purple-400">Player 1: {match.scores.p1}</p>
          <p className="text-pink-400">Player 2: {match.scores.p2}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-white text-black rounded-full font-bold text-xl hover:scale-105 transition-transform"
        >
          Play Again
        </button>
      </div>
    )
  }

  const currentCard = match.deck[match.current_round - 1]

  return (
    <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">
      {/* Left: Game Info */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-[#1a1b1e] p-6 rounded-2xl border border-white/10">
          <h3 className="text-gray-400 uppercase font-bold text-sm">Round</h3>
          <p className="text-4xl font-black">{match.current_round} / 3</p>
        </div>
        
        <div className="bg-[#1a1b1e] p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-gray-400 uppercase font-bold text-sm">Scores</h3>
          <div className="flex justify-between items-center">
            <span className="text-purple-400 font-bold">Player 1</span>
            <span className="text-2xl font-black">{match.scores.p1}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-pink-400 font-bold">Player 2</span>
            <span className="text-2xl font-black">{match.scores.p2}</span>
          </div>
        </div>
      </div>

      {/* Center: The Arena */}
      <div className="lg:col-span-2 space-y-6">
        {/* Flashcard Image */}
        <div 
          className="aspect-video bg-black rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl relative group"
        >
           <img 
             src={currentCard.image_url} 
             alt={currentCard.concept}
             className="w-full h-full object-cover"
           />
           <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10">
             <span className="font-mono text-xs text-gray-300">WEB IMAGE</span>
           </div>
        </div>

        {/* Question */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{currentCard.question}</h2>
          <p className="text-gray-400 italic">Concept: {currentCard.concept}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentCard.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(option)}
              disabled={!!selectedOption}
              className={`p-6 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] border-2 
                ${selectedOption === option 
                  ? 'bg-purple-600 border-purple-400 text-white' 
                  : 'bg-[#2b2d31] border-transparent hover:bg-[#3f4148] text-gray-200'
                }
                ${waitingForNextRound && selectedOption !== option ? 'opacity-50' : ''}
              `}
            >
              {option}
            </button>
          ))}
        </div>

        {waitingForNextRound && (
          <div className="text-center animate-pulse text-yellow-400 font-bold">
            Waiting for opponent...
          </div>
        )}
      </div>
    </div>
  )
}
