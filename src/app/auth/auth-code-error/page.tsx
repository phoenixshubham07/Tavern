'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="max-w-md p-8 text-center space-y-6 border border-red-500/30 rounded-xl bg-red-950/10">
      <div className="flex justify-center">
        <AlertTriangle className="text-red-500" size={48} />
      </div>
      <h1 className="text-2xl font-bold text-red-500 tracking-widest uppercase">Authentication Failed</h1>
      <p className="text-gray-400">
        {error || "There was an error signing you in. Please try again."}
      </p>
      <div className="pt-4">
        <Link 
          href="/login"
          className="inline-block px-6 py-3 bg-red-500/20 border border-red-500/50 text-red-400 font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
        >
          Return to Login
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white font-mono">
      <Suspense fallback={<div className="text-white">Loading error details...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  )
}
