'use server'

import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function transcribeImage(formData: FormData) {
  const file = formData.get('image') as File
  
  if (!file) {
    return { error: 'No image provided' }
  }

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    
    const prompt = "You are an expert transcriber. Convert this image into clean, formatted Markdown. Fix spelling errors caused by handwriting. Do not add conversational filler. Just return the markdown."
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      }
    ])

    const response = await result.response
    const text = response.text()
    
    return { text }
  } catch (error: any) {
    console.error('Gemini Error:', error)
    return { error: error.message || 'Failed to transcribe image' }
  }
}

export async function saveVersion(content: string, originalImageBase64: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // 1. Get the latest version number for this user (simple project management for now)
  // For MVP, we treat everything as one "Default Project"
  const { data: latestVersion } = await supabase
    .from('versions')
    .select('version_number')
    .eq('user_id', user.id)
    .eq('project_name', 'Default Project')
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const nextVersionNumber = (latestVersion?.version_number || 0) + 1

  // 2. Insert new version
  const { data, error } = await supabase
    .from('versions')
    .insert({
      user_id: user.id,
      project_name: 'Default Project',
      content_text: content,
      version_number: nextVersionNumber,
      // In a real app, we'd upload the image to storage and save the path.
      // For MVP, we might skip saving the image to DB to avoid base64 bloat, 
      // or just save it if it's small. Let's just save the text for now.
      original_image_path: 'uploaded-via-inkflow', 
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Save Error:', error)
    return { error: 'Failed to save version' }
  }

  revalidatePath('/inkflow')
  return { success: true, version: nextVersionNumber, id: data.id }
}

export async function getHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from('versions')
    .select('*')
    .eq('user_id', user.id)
    .eq('project_name', 'Default Project')
    .order('created_at', { ascending: false })

  return data || []
}

export async function shareNote(versionId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Check if already shared
  const { data: existing } = await supabase
    .from('versions')
    .select('share_token, is_public')
    .eq('id', versionId)
    .single()

  if (existing?.is_public && existing?.share_token) {
    return { success: true, token: existing.share_token }
  }

  // Generate token and publish
  const { data, error } = await supabase
    .from('versions')
    .update({ 
      is_public: true,
      // If token exists, keep it, else generate new one. 
      // Since we can't easily generate UUID in JS and pass to SQL without a library sometimes, 
      // we rely on the default value in DB or generate here. 
      // Let's generate here to be safe and return it immediately.
      share_token: existing?.share_token || crypto.randomUUID()
    })
    .eq('id', versionId)
    .eq('user_id', user.id) // Security check
    .select('share_token')
    .single()

  if (error || !data) {
    console.error('Share Error:', error)
    return { error: 'Failed to share note' }
  }

  return { success: true, token: data.share_token }
}

export async function getSharedNote(token: string) {
  const supabase = await createClient()
  
  // 1. Get the note version
  const { data: note, error } = await supabase
    .from('versions')
    .select('*')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (error || !note) {
    return { error: 'Note not found or private' }
  }

  // 2. Get the owner's username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', note.user_id)
    .single()

  return { 
    note, 
    ownerUsername: profile?.username || 'Unknown User' 
  }
}

export async function remixNote(originalVersionId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // 1. Fetch original note to copy content
  const { data: original } = await supabase
    .from('versions')
    .select('content_text, project_name')
    .eq('id', originalVersionId)
    .single()

  if (!original) return { error: 'Original note not found' }

  // 2. Get latest version number for current user
  const { data: latestVersion } = await supabase
    .from('versions')
    .select('version_number')
    .eq('user_id', user.id)
    .eq('project_name', original.project_name)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const nextVersionNumber = (latestVersion?.version_number || 0) + 1

  // 3. Insert new version (Remix)
  const { data: newNote, error } = await supabase
    .from('versions')
    .insert({
      user_id: user.id,
      project_name: original.project_name, // Keep same project name or append "Remix"
      content_text: original.content_text,
      version_number: nextVersionNumber,
      parent_id: originalVersionId, // Attribution!
      original_image_path: null, // No image for text remix
    })
    .select('id')
    .single()

  if (error) {
    console.error('Remix Error:', error)
    return { error: 'Failed to remix note' }
  }

  revalidatePath('/inkflow')
  return { success: true, newNoteId: newNote.id }
}

export async function getLatestVersionMetadata() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get latest version
  const { data: latestVersion } = await supabase
    .from('versions')
    .select('content_text, parent_id')
    .eq('user_id', user.id)
    .eq('project_name', 'Default Project')
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (!latestVersion) return null

  let parentOwner = null
  if (latestVersion.parent_id) {
    const { data: parentVersion } = await supabase
      .from('versions')
      .select('user_id')
      .eq('id', latestVersion.parent_id)
      .single()

    if (parentVersion) {
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', parentVersion.user_id)
        .single()
      parentOwner = parentProfile?.username
    }
  }

  return { 
    content_text: latestVersion.content_text,
    parentOwner
  }
}
