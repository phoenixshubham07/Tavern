'use client'

import { usePathname } from 'next/navigation'

export default function ClientLayout({ children, user }: { children: React.ReactNode, user: any }) {
  const pathname = usePathname()
  
  // Routes where we want a clean, full-screen experience (no padding)
  const hiddenRoutes = ['/roaster', '/tavern/duel', '/tavern/room', '/server']
  const shouldHideSidebar = hiddenRoutes.some(route => pathname?.startsWith(route))

  // Only add padding if user is logged in AND sidebar is visible
  const paddingClass = (user && !shouldHideSidebar) ? 'pl-24' : ''

  return (
    <main className={`min-h-screen pt-24 ${paddingClass} transition-all duration-300`}>
      {children}
    </main>
  )
}
