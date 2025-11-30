'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Hash } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface Message {
  id: number
  content: string
  sender_id: string
  username: string
  created_at: string
}

export default function WorldChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [username, setUsername] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
        setUsername(profile?.username || 'Anon')
      }

      // Fetch initial messages (Limit 50)
      const { data } = await supabase
        .from('world_chat')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50)
      
      if (data) setMessages(data)
      scrollToBottom()

      // Realtime Subscription
      const channel = supabase
        .channel('world-chat')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'world_chat' 
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          scrollToBottom()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
    
    init()
  }, [])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !username) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const msg = {
      content: newMessage,
      sender_id: user.id,
      username: username
    }

    // Optimistic UI
    // setMessages(prev => [...prev, { ...msg, id: Date.now(), created_at: new Date().toISOString() }])
    setNewMessage('')
    scrollToBottom()

    await supabase.from('world_chat').insert(msg)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-4 flex items-center shadow-sm border-b border-black/20 bg-[#36393f]">
        <Hash className="text-gray-400 mr-2" size={24} />
        <span className="font-bold text-white">world-chat</span>
        <span className="ml-4 text-xs text-gray-400 border-l border-gray-600 pl-4">The global tavern chat. Be nice.</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="group flex hover:bg-[#32353b] -mx-4 px-4 py-1">
            <div className="w-10 h-10 rounded-full bg-accent-blue flex-shrink-0 mr-4 mt-1 flex items-center justify-center font-bold text-navy-blue">
              {msg.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white hover:underline cursor-pointer">{msg.username}</span>
                <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#36393f]">
        <div className="bg-[#40444b] rounded-lg px-4 py-2.5 flex items-center">
          <button className="text-gray-400 hover:text-gray-200 mr-4">
            <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-[10px] text-[#40444b] font-bold">+</div>
          </button>
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Message #world-chat"
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
          />
          <div className="flex items-center gap-3 ml-2">
             {/* Icons for GIF, Sticker, Emoji could go here */}
             <button onClick={handleSend} className="text-gray-400 hover:text-white">
               <Send size={20} />
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
