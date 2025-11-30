'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useStudyRoom, PeerState } from '@/hooks/useStudyRoom'
import Timer from '@/components/Timer'
import { User, Clock, Zap, Coffee } from 'lucide-react'

export default function StudyRoomPage() {
  const params = useParams()
  const roomId = params.id as string
  
  const [user, setUser] = useState<any>(null)
  const [guestName, setGuestName] = useState('')
  const [subject, setSubject] = useState('')
  const [isSetup, setIsSetup] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        // If logged in, we can skip setup if we want, but let's ask for subject
      }
    })
  }, [])

  const { peers, isStudying, joinRoom, toggleStudy, joined } = useStudyRoom(roomId, user)

  const handleJoin = () => {
    if ((!user && !guestName) || !subject) return
    joinRoom(guestName, subject)
    setIsSetup(true)
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-[#202225] flex items-center justify-center p-4">
        <div className="bg-[#36393f] p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-6 border border-white/10">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Study Hall {roomId}</h1>
            <p className="text-gray-400">Join a focus session with peers.</p>
          </div>

          <div className="space-y-4">
            {!user && (
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">YOUR NAME</label>
                <input 
                  type="text" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-accent-blue"
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">SUBJECT</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-accent-blue"
                placeholder="What are you studying?"
              />
            </div>

            <button 
              onClick={handleJoin}
              disabled={(!user && !guestName) || !subject}
              className="w-full py-3 bg-accent-blue text-navy-blue font-bold rounded-lg hover:bg-white transition-colors disabled:opacity-50"
            >
              ENTER ROOM
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#202225] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Top: Timer & Controls */}
        <div className="w-full bg-[#2f3136] rounded-3xl p-8 flex flex-col items-center justify-center border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-3xl font-bold text-gray-200">{subject}</h2>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isStudying ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {isStudying ? <><Zap size={12} /> FOCUSING</> : <><Coffee size={12} /> PAUSED</>}
            </div>
          </div>

          <Timer 
            onStart={() => toggleStudy(true)} 
            onPause={() => toggleStudy(false)} 
          />
        </div>

        {/* Bottom: Peers Grid */}
        <div className="w-full bg-[#2f3136] rounded-3xl p-8 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <User className="text-gray-400" /> 
              Classmates <span className="text-gray-500 text-sm">({Object.keys(peers).length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(peers).map(([key, peer]) => (
              <PeerCard key={key} peer={peer} />
            ))}
            {Object.keys(peers).length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-500">
                <p>It's quiet in here...</p>
                <p className="text-sm">Invite friends to join room: <span className="font-mono text-accent-blue">{roomId}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PeerCard({ peer }: { peer: PeerState }) {
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      peer.isStudying 
        ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]' 
        : 'border-gray-700 bg-black/20 opacity-70'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            peer.isStudying ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'
          }`}>
            {peer.username[0].toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-sm truncate max-w-[120px]">{peer.username}</h4>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">{peer.subject}</p>
          </div>
        </div>
        {peer.isStudying && (
          <div className="animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs font-mono">
        <span className={peer.isStudying ? 'text-green-400' : 'text-gray-500'}>
          {peer.isStudying ? 'FOCUSING' : 'SLACKING'}
        </span>
        <span className="text-gray-600">
           {new Date(peer.onlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
