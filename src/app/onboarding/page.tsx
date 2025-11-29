'use client'

import { useState } from 'react'
import { updateUsername } from './actions'
import { ArrowRight, User } from 'lucide-react'

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    const result = await updateUsername(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white font-mono">
      <div className="w-full max-w-md p-8 space-y-8 border border-white/10 rounded-xl bg-black shadow-2xl shadow-white/5">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter">CLAIM YOUR IDENTITY</h1>
          <p className="text-gray-400 text-sm">Choose a unique handle for the Tavern.</p>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <div className="group relative">
            <div className="relative flex items-center border border-white/10 p-4 transition-colors hover:border-white/50">
              <User className="text-gray-400 mr-4" size={20} />
              <div className="flex-1">
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  className="w-full bg-transparent text-white outline-none font-bold tracking-wide placeholder-gray-600"
                  placeholder="ENTER_USERNAME"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs font-bold text-center uppercase tracking-widest">
              {error}
            </div>
          )}

          <button type="submit" className="group relative w-full h-14 bg-white text-black font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-all duration-300 overflow-hidden">
            <span className="relative flex items-center justify-center gap-3">
              Enter Tavern <ArrowRight size={18} />
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}
