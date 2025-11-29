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
  const { error } = await supabase
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

  if (error) {
    console.error('Save Error:', error)
    return { error: 'Failed to save version' }
  }

  revalidatePath('/inkflow')
  return { success: true, version: nextVersionNumber }
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
