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

      // Store user ID for realtime filtering
      const currentUserId = user?.id

      // Realtime Subscription
      const channel = supabase
        .channel('world-chat')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'world_chat' 
        }, (payload) => {
          // Fix duplication: Ignore our own messages (already added optimistically)
          if (payload.new.sender_id === currentUserId) return

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
    const tempId = Date.now()
    setMessages(prev => [...prev, { ...msg, id: tempId, created_at: new Date().toISOString() }])
    setNewMessage('')
    scrollToBottom()

    const { error } = await supabase.from('world_chat').insert(msg)
    
    if (error) {
      console.error('Error sending message:', error)
      // Rollback optimistic update if failed
      setMessages(prev => prev.filter(m => m.id !== tempId))
      alert('Failed to send message. Please try again.')
    }
  }

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
  }, [])

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
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          // User requested: Me = Left, Others = Right
          // Standard is usually Me = Right, but we follow instructions.
          
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-start' : 'justify-end'}`}>
              <div className={`flex max-w-[80%] ${isMe ? 'flex-row' : 'flex-row-reverse'} gap-2`}>
                
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-accent-blue flex-shrink-0 flex items-center justify-center font-bold text-navy-blue text-xs">
                  {msg.username[0].toUpperCase()}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-bold">{msg.username}</span>
                    <span className="text-[10px] text-gray-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-[#5865f2] text-white rounded-tl-none' 
                      : 'bg-[#40444b] text-gray-100 rounded-tr-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>

              </div>
            </div>
          )
        })}
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
