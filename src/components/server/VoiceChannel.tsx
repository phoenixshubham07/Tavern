'use client'

import { Volume2, Mic, MicOff, PhoneOff, Video, Monitor } from 'lucide-react'
import { useState } from 'react'

export default function VoiceChannel({ name }: { name: string }) {
  const [isMuted, setIsMuted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="w-24 h-24 rounded-full bg-[#2f3136] flex items-center justify-center">
          <Volume2 size={48} className="text-gray-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">{name}</h2>
          <p className="text-gray-400">No one is currently in this channel.</p>
        </div>
        <button 
          onClick={() => setIsConnected(true)}
          className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-md font-bold transition-colors"
        >
          Join Voice
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Grid of Users */}
      <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
        {/* Self */}
        <div className="aspect-video bg-[#2f3136] rounded-lg flex flex-col items-center justify-center relative group border-2 border-green-500">
          <div className="w-20 h-20 rounded-full bg-accent-blue flex items-center justify-center text-2xl font-bold text-navy-blue mb-4">
            ME
          </div>
          <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-sm font-bold text-white flex items-center gap-2">
            You {isMuted && <MicOff size={14} className="text-red-500" />}
          </div>
        </div>

        {/* Placeholder Peers */}
        {[1, 2].map((i) => (
          <div key={i} className="aspect-video bg-[#2f3136] rounded-lg flex flex-col items-center justify-center relative group">
            <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold text-white mb-4">
              P{i}
            </div>
            <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-sm font-bold text-white">
              Peer {i}
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
               <div className="bg-black/60 p-2 rounded-full cursor-pointer hover:bg-black/80"><Volume2 size={20} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="h-20 bg-[#18191c] flex items-center justify-center gap-4 border-t border-black/20">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-[#2f3136] hover:bg-[#36393f] text-white'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button className="p-4 rounded-full bg-[#2f3136] hover:bg-[#36393f] text-white">
          <Video size={24} />
        </button>
        <button className="p-4 rounded-full bg-[#2f3136] hover:bg-[#36393f] text-white">
          <Monitor size={24} />
        </button>
        <button 
          onClick={() => setIsConnected(false)}
          className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  )
}
