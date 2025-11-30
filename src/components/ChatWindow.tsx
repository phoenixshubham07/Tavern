'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { sendDirectMessage, getDirectMessages } from '@/app/inkflow/actions'

interface Message {
  id: number
  content: string
  sender_id: string
  created_at: string
}

interface ChatWindowProps {
  recipientId: string
  recipientName: string
  onClose: () => void
}

export default function ChatWindow({ recipientId, recipientName, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        
        // Fetch initial messages
        const initialMessages = await getDirectMessages(recipientId)
        setMessages(initialMessages)
        scrollToBottom()

        // Realtime Subscription (Only subscribe after we have user ID)
        const channel = supabase
          .channel(`chat:${recipientId}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages',
            filter: `recipient_id=eq.${user.id}` // Listen for incoming messages
          }, (payload) => {
            const newMsg = payload.new as Message
            // Only add if it's from the person we are chatting with
            if (newMsg.sender_id === recipientId) {
                 setMessages(prev => [...prev, newMsg])
                 scrollToBottom()
            }
          })
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }
    
    const cleanupPromise = init()
    
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup())
    }
  }, [recipientId])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId) return

    const tempId = Date.now()
    const optimisticMsg: Message = {
      id: tempId,
      content: newMessage,
      sender_id: currentUserId,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticMsg])
    setNewMessage('')
    scrollToBottom()

    const result = await sendDirectMessage(optimisticMsg.content, recipientId)
    if (result.error) {
      alert('Failed to send message')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-gray-900 border border-white/10 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-gray-800 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="font-bold text-white">{recipientName}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/50">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-2 rounded-lg text-sm ${isMe ? 'bg-accent-blue text-navy-blue' : 'bg-gray-800 text-gray-200'}`}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-gray-800 border-t border-white/10 flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-gray-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-blue"
        />
        <button 
          onClick={handleSend}
          className="p-2 bg-accent-blue text-navy-blue rounded-lg hover:bg-white transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
