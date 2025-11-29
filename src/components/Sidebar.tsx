'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, PenTool, Settings, LogOut, ChevronRight, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Sidebar({ user }: { user: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const navItems = [
    { icon: <Home size={20} />, label: 'Dashboard', href: '/' },
    { icon: <PenTool size={20} />, label: 'InkFlow', href: '/inkflow' },
    // { icon: <Settings size={20} />, label: 'Settings', href: '/settings' },
  ]

  return (
    <div 
      className={`fixed left-0 top-0 h-screen bg-black border-r border-white/10 transition-all duration-300 z-50 flex flex-col ${isExpanded ? 'w-64' : 'w-20'}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-center border-b border-white/10">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold text-xl">
          T
        </div>
        {isExpanded && (
          <span className="ml-3 font-bold text-xl tracking-wider animate-in fade-in duration-300">TAVERN</span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-8 flex flex-col gap-2 px-3">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className="flex items-center p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all group"
          >
            <div className="min-w-[24px] flex justify-center">{item.icon}</div>
            {isExpanded && (
              <span className="ml-3 font-medium whitespace-nowrap animate-in fade-in duration-200">{item.label}</span>
            )}
            {!isExpanded && (
              <div className="absolute left-20 bg-white text-black px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {item.label}
              </div>
            )}
          </Link>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all group"
        >
          <div className="min-w-[24px] flex justify-center"><LogOut size={20} /></div>
          {isExpanded && (
            <span className="ml-3 font-medium whitespace-nowrap animate-in fade-in duration-200">Logout</span>
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-4 flex items-center gap-3 px-3 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-navy-blue font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.email}</p>
              <p className="text-[10px] text-gray-500 uppercase">Agent</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
