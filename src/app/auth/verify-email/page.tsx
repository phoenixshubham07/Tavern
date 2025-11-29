import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black font-mono text-white flex items-center justify-center">
      <div className="max-w-md w-full p-8 text-center space-y-6 border border-white/10 rounded-xl bg-black shadow-2xl shadow-white/5">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-white/5 border border-white/10">
            <Mail size={48} className="text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tighter uppercase">Check Your Comms</h1>
        
        <p className="text-gray-400 text-sm leading-relaxed">
          We've sent a secure link to your identity address. <br/>
          Access the link to establish your connection to the Tavern.
        </p>

        <div className="pt-6 border-t border-white/10">
          <Link 
            href="/login" 
            className="text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
