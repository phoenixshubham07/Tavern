import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export type PeerState = {
  username: string
  isStudying: boolean
  subject: string
  avatarUrl?: string
  onlineAt: string
  presence_ref?: string
}

export function useStudyRoom(roomId: string, user: any) {
  const [peers, setPeers] = useState<Record<string, PeerState>>({})
  const [isStudying, setIsStudying] = useState(false)
  const [subject, setSubject] = useState('')
  const [joined, setJoined] = useState(false)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  // 1. Handle Visibility (Slacking Detector)
  useEffect(() => {
    if (!joined || !channelRef.current) return

    const handleVisibilityChange = async () => {
      const isVisible = document.visibilityState === 'visible'
      
      // If hidden, immediately mark as slacking (not studying)
      // If visible, restore previous state (or keep as is? Let's assume they resume studying)
      // Actually, let's just track "isStudying" as "studying AND visible"
      
      if (!isVisible && isStudying) {
        // User tabbed away -> Slacking
        await channelRef.current?.track({
          username: user?.user_metadata?.full_name || user?.email || 'Anonymous',
          isStudying: false, // Slacking!
          subject,
          onlineAt: new Date().toISOString()
        })
      } else if (isVisible && isStudying) {
        // User came back -> Studying
        await channelRef.current?.track({
          username: user?.user_metadata?.full_name || user?.email || 'Anonymous',
          isStudying: true,
          subject,
          onlineAt: new Date().toISOString()
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [joined, isStudying, subject, user])

  // 2. Join Room & Subscribe to Presence
  const joinRoom = async (userNameInput: string, subjectInput: string) => {
    if (channelRef.current) return

    const username = user?.user_metadata?.full_name || user?.email || userNameInput
    setSubject(subjectInput)

    const channel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: {
          key: user?.id || `guest_${Math.random().toString(36).slice(2)}`,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState<PeerState>()
        const peersMap: Record<string, PeerState> = {}
        
        Object.entries(newState).forEach(([key, values]) => {
          // Supabase returns an array of states for each key (in case of multiple tabs)
          // We take the latest one
          if (values && values.length > 0) {
            peersMap[key] = values[0]
          }
        })
        
        setPeers(peersMap)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('join', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('leave', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            username,
            isStudying: false, // Start as not studying
            subject: subjectInput,
            onlineAt: new Date().toISOString()
          })
          setJoined(true)
        }
      })

    channelRef.current = channel
  }

  // 3. Toggle Study Status
  const toggleStudy = async (studying: boolean) => {
    setIsStudying(studying)
    if (channelRef.current) {
      const username = user?.user_metadata?.full_name || user?.email || 'Anonymous'
      await channelRef.current.track({
        username,
        isStudying: studying,
        subject,
        onlineAt: new Date().toISOString()
      })
    }
  }

  const leaveRoom = async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe()
      channelRef.current = null
      setJoined(false)
      setPeers({})
    }
  }

  return {
    peers,
    isStudying,
    joinRoom,
    leaveRoom,
    toggleStudy,
    joined
  }
}
