'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, User, Circle } from 'lucide-react'
import { getContacts } from '@/app/inkflow/actions'
import { createClient } from '@/utils/supabase/client'

interface Profile {
  id: string
  username: string
  status?: 'online' | 'offline'
}

export default function DMSidebar({ isOpen, onClose, onSelectUser, embedded = false }: { isOpen?: boolean; onClose?: () => void; onSelectUser: (user: Profile) => void; embedded?: boolean }) {
  const [contacts, setContacts] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadContacts() {
      const data = await getContacts()
      setContacts(data || [])
      setLoading(false)
    }
    if (isOpen) {
      loadContacts()
    }
  }, [isOpen])

  // Unread Messages Logic
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const supabase = createClient()
    let channel: any;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('dm_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const senderId = payload.new.sender_id
            setUnreadCounts((prev) => ({
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1,
            }))
            
            // Optional: Play a sound or show a toast here
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // Presence Logic
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('global_presence')

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const onlineIds = new Set<string>()
        
        for (const id in newState) {
          // @ts-ignore
          const userId = newState[id][0]?.user_id
          if (userId) onlineIds.add(userId)
        }
        setOnlineUsers(onlineIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const baseClasses = embedded 
    ? "w-80 h-full bg-gray-900/50 border-r border-white/10 flex flex-col"
    : `absolute top-0 right-0 h-full bg-gray-900 border-l border-white/10 transform transition-transform duration-300 z-50 pt-20 p-6 overflow-y-auto ${isOpen ? 'translate-x-0 w-80' : 'translate-x-full w-0'}`

  return (
    <div className={baseClasses}>
      <div className={`flex justify-between items-center mb-6 ${embedded ? 'p-6 pb-0' : ''}`}>
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <MessageSquare size={20} /> Messages
        </h2>
        {!embedded && onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            &times;
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm p-6">Loading contacts...</div>
      ) : (
        <div className="space-y-2 p-4 overflow-y-auto flex-1">
          {contacts.map((contact) => {
            const isOnline = onlineUsers.has(contact.id)
            return (
              <div 
                key={contact.id} 
                onClick={() => {
                  onSelectUser(contact)
                  setUnreadCounts(prev => ({ ...prev, [contact.id]: 0 }))
                  onClose?.()
                }}
                className="p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-navy-blue font-bold relative">
                  {contact.username[0].toUpperCase()}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></span>
                  )}
                </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-200">{contact.username}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Circle size={8} fill={isOnline ? '#3ba55c' : 'gray'} stroke="none" />
                        {isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    {unreadCounts[contact.id] > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                        {unreadCounts[contact.id]}
                      </div>
                    )}
                  </div>
              </div>
            )
          })}
          {contacts.length === 0 && (
            <p className="text-gray-500 text-sm">No contacts found.</p>
          )}
        </div>
      )}
    </div>
  )
}
