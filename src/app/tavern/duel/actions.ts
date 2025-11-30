'use server'

import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { redirect } from 'next/navigation'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

// --- Types ---
type Duelmatch = {
  id: string
  player1_id: string
  player2_id: string
  status: 'loading' | 'active' | 'finished' | 'error'
  current_round: number
  scores: { p1: number; p2: number }
  deck: Flashcard[] | null
}

type Flashcard = {
  concept: string
  question: string
  options: string[]
  answer: string
  svg: string
}

// --- Matchmaking ---

export async function findMatch(year: string, stream: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 1. Check Queue for opponent
  const { data: opponents } = await supabase
    .from('duel_queue')
    .select('*')
    .eq('year', year)
    .eq('stream', stream)
    .neq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  if (opponents && opponents.length > 0) {
    const opponent = opponents[0]

    // 2. Create Match
    const { data: match, error } = await supabase
      .from('duel_matches')
      .insert({
        player1_id: opponent.user_id,
        player2_id: user.id,
        status: 'loading',
        current_round: 1,
        scores: { p1: 0, p2: 0 },
        deck: []
      })
      .select()
      .single()

    if (error) throw error

    // 3. Remove opponent from queue
    await supabase.from('duel_queue').delete().eq('id', opponent.id)

    // 4. Trigger Deck Generation (Async - don't await)
    generateDeck(match.id, year, stream)

    return { matchId: match.id }
  } else {
    // 5. Add self to queue
    // First, remove any existing queue entries for this user to avoid duplicates
    await supabase.from('duel_queue').delete().eq('user_id', user.id)
    
    await supabase.from('duel_queue').insert({
      user_id: user.id,
      year,
      stream
    })

    return { queued: true }
  }
}

// --- AI Deck Generation ---

export async function generateDeck(matchId: string, year: string, stream: string) {
  const supabase = await createClient()
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const prompt = `
    Generate 3 DIFFICULT flashcards for a ${year} ${stream} student.
    
    For each flashcard, generate:
    1. A Concept (e.g., "Mitochondria")
    2. A Trick Question (e.g., "Powerhouse of the cell?")
    3. 4 Options (1 correct, 3 distractors)
    4. The Correct Answer (must match one of the options exactly)
    5. An Educational SVG Diagram (800x600) that visually explains the concept.
       - Dark background (#1a1b1e).
       - White lines, clear labels, diagrammatic style.
       - NO ANSWER TEXT in the image.
    
    Output ONLY JSON:
    [
      {
        "concept": "...",
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "answer": "A",
        "svg": "<svg>...</svg>"
      },
      ...
    ]
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()
    
    // Robust JSON extraction
    const jsonStart = text.indexOf('[')
    const jsonEnd = text.lastIndexOf(']')
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1)
    }

    const deck: Flashcard[] = JSON.parse(text)

    // Update Match
    await supabase
      .from('duel_matches')
      .update({ 
        deck: deck,
        status: 'active'
      })
      .eq('id', matchId)

  } catch (error) {
    console.error('Deck Generation Error:', error)
    // Set status to error so client knows to stop loading
    await supabase
      .from('duel_matches')
      .update({ status: 'error' }) 
      .eq('id', matchId)
  }
}

// --- Game Logic ---

export async function submitMove(matchId: string, round: number, answer: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  // 1. Record Move
  await supabase.from('duel_moves').insert({
    match_id: matchId,
    round,
    player_id: user.id,
    answer
  })

  // 2. Check if both players moved
  const { data: moves } = await supabase
    .from('duel_moves')
    .select('*')
    .eq('match_id', matchId)
    .eq('round', round)

  if (moves && moves.length === 2) {
    // Both players moved! Calculate scores and advance round.
    
    // Fetch match to get deck
    const { data: match } = await supabase
      .from('duel_matches')
      .select('*')
      .eq('id', matchId)
      .single()
      
    if (!match || !match.deck) return

    const currentCard = match.deck[round - 1]
    const p1Move = moves.find(m => m.player_id === match.player1_id)
    const p2Move = moves.find(m => m.player_id === match.player2_id)

    let p1Score = match.scores.p1
    let p2Score = match.scores.p2

    if (p1Move?.answer === currentCard.answer) p1Score += 10
    if (p2Move?.answer === currentCard.answer) p2Score += 10

    const nextRound = round + 1
    const newStatus = nextRound > 3 ? 'finished' : 'active' // Updated to 3 rounds

    await supabase
      .from('duel_matches')
      .update({
        scores: { p1: p1Score, p2: p2Score },
        current_round: nextRound,
        status: newStatus
      })
      .eq('id', matchId)
  }
}
