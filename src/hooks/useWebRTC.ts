import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

interface Peer {
  userId: string
  stream?: MediaStream
  connection: RTCPeerConnection
}

export function useWebRTC(roomId: string, user: any) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<Record<string, Peer>>({})
  const peersRef = useRef<Record<string, Peer>>({})
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  // Initialize Local Stream
  useEffect(() => {
    async function initStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
      } catch (err) {
        console.error('Error accessing media devices:', err)
      }
    }
    if (user) initStream()

    return () => {
      localStream?.getTracks().forEach(track => track.stop())
    }
  }, [user])

  // Handle Signaling
  useEffect(() => {
    if (!user || !localStream) return

    const channel = supabase.channel(`room:${roomId}`)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'signal' }, async ({ payload }) => {
        const { type, sdp, candidate, userId: senderId } = payload
        if (senderId === user.id) return // Ignore self

        if (type === 'join') {
          // New user joined, initiate connection
          createPeerConnection(senderId, true)
        } else if (type === 'offer') {
          // Received offer, answer it
          const pc = createPeerConnection(senderId, false)
          await pc.setRemoteDescription(new RTCSessionDescription(sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'answer', sdp: answer, userId: user.id, targetId: senderId }
          })
        } else if (type === 'answer') {
          // Received answer
          const peer = peersRef.current[senderId]
          if (peer) {
            await peer.connection.setRemoteDescription(new RTCSessionDescription(sdp))
          }
        } else if (type === 'candidate') {
          // Received ICE candidate
          const peer = peersRef.current[senderId]
          if (peer) {
            await peer.connection.addIceCandidate(new RTCIceCandidate(candidate))
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Announce presence
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'join', userId: user.id }
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
      Object.values(peersRef.current).forEach(p => p.connection.close())
    }
  }, [user, localStream, roomId])

  const createPeerConnection = (peerId: string, isInitiator: boolean) => {
    if (peersRef.current[peerId]) return peersRef.current[peerId].connection

    const pc = new RTCPeerConnection(ICE_SERVERS)
    
    // Add local tracks
    localStream?.getTracks().forEach(track => pc.addTrack(track, localStream))

    // Handle remote tracks
    pc.ontrack = (event) => {
      setPeers(prev => ({
        ...prev,
        [peerId]: { ...prev[peerId], stream: event.streams[0] }
      }))
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'candidate', candidate: event.candidate, userId: user.id, targetId: peerId }
        })
      }
    }

    // Store peer
    const peerObj = { userId: peerId, connection: pc }
    peersRef.current[peerId] = peerObj
    setPeers(prev => ({ ...prev, [peerId]: peerObj }))

    // If initiator, create offer
    if (isInitiator) {
      pc.createOffer().then(async (offer) => {
        await pc.setLocalDescription(offer)
        channelRef.current?.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'offer', sdp: offer, userId: user.id, targetId: peerId }
        })
      })
    }

    return pc
  }

  const toggleAudio = (enabled: boolean) => {
    localStream?.getAudioTracks().forEach(track => track.enabled = enabled)
  }

  const toggleVideo = (enabled: boolean) => {
    localStream?.getVideoTracks().forEach(track => track.enabled = enabled)
  }

  return { localStream, peers, toggleAudio, toggleVideo }
}
