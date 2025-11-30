'use client'

import { useState } from 'react'
import { Hash, Volume2, Mic, Headphones, Settings } from 'lucide-react'
import WorldChat from '@/components/server/WorldChat'
import VoiceChannel from '@/components/server/VoiceChannel'

export default function ServerPage() {
  const [activeChannel, setActiveChannel] = useState<'world-chat' | 'voice-general' | 'voice-music'>('world-chat')

  return (
    <div className="flex h-screen bg-black text-white font-mono">
      {/* Channels Sidebar */}
      <div className="w-64 bg-[#2f3136] flex flex-col">
        {/* Server Header */}
        <div className="h-12 px-4 flex items-center shadow-sm font-bold border-b border-black/20 hover:bg-[#34373c] transition-colors cursor-pointer">
          Tavern Global
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          
          {/* Text Channels */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1 text-xs font-bold text-gray-400 uppercase hover:text-gray-300 cursor-pointer">
              <span>Text Channels</span>
            </div>
            <div className="space-y-0.5">
              <ChannelItem 
                name="world-chat" 
                type="text" 
                active={activeChannel === 'world-chat'} 
                onClick={() => setActiveChannel('world-chat')} 
              />
            </div>
          </div>

          {/* Voice Channels */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1 text-xs font-bold text-gray-400 uppercase hover:text-gray-300 cursor-pointer">
              <span>Voice Channels</span>
            </div>
            <div className="space-y-0.5">
              <ChannelItem 
                name="General" 
                type="voice" 
                active={activeChannel === 'voice-general'} 
                onClick={() => setActiveChannel('voice-general')} 
              />
              <ChannelItem 
                name="Music" 
                type="voice" 
                active={activeChannel === 'voice-music'} 
                onClick={() => setActiveChannel('voice-music')} 
              />
            </div>
          </div>

        </div>

        {/* User Controls (Bottom) */}
        <div className="bg-[#292b2f] p-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-blue"></div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-bold truncate">User</div>
            <div className="text-xs text-gray-400">#1234</div>
          </div>
          <div className="flex items-center">
            <button className="p-1.5 hover:bg-gray-700 rounded"><Mic size={16} /></button>
            <button className="p-1.5 hover:bg-gray-700 rounded"><Headphones size={16} /></button>
            <button className="p-1.5 hover:bg-gray-700 rounded"><Settings size={16} /></button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#36393f] flex flex-col min-w-0">
        {activeChannel === 'world-chat' && <WorldChat />}
        {activeChannel === 'voice-general' && <VoiceChannel name="General" />}
        {activeChannel === 'voice-music' && <VoiceChannel name="Music" />}
      </div>
    </div>
  )
}

function ChannelItem({ name, type, active, onClick }: { name: string, type: 'text' | 'voice', active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`group flex items-center px-2 py-1 rounded cursor-pointer transition-colors ${active ? 'bg-[#393c43] text-white' : 'text-gray-400 hover:bg-[#34373c] hover:text-gray-200'}`}
    >
      <div className="mr-1.5 text-gray-400">
        {type === 'text' ? <Hash size={20} /> : <Volume2 size={20} />}
      </div>
      <div className={`font-medium ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
        {name}
      </div>
    </div>
  )
}
