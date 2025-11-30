'use client'

import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { usePathname } from 'next/navigation'

export default function Navigation({ user }: { user: any }) {
  const pathname = usePathname()
  
  // Don't show any nav on auth pages or onboarding if we want a clean slate, 
  // but for now let's just stick to the main logic.
  // Actually, if we are on login page, we might want just Navbar or nothing.
  // Let's keep it simple: User ? Sidebar : Navbar
  
  if (user) {
    return <Sidebar user={user} />
  }

  return <Navbar />
}
