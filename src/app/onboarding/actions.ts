'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function updateUsername(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const username = formData.get('username') as string

  // Check if username is taken
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()

  if (existingUser) {
    return { error: 'Username already taken' }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      username: username,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    return { error: 'Error updating profile' }
  }

  redirect('/')
}
