'use client'

import { usePathname } from 'next/navigation'

export default function ClientLayout({ children, user }: { children: React.ReactNode, user: any }) {
  const pathname = usePathname()
  
  // Only add padding if user is logged in
  const paddingClass = user ? 'pl-24' : ''

  return (
    <main className={`min-h-screen pt-24 ${paddingClass} transition-all duration-300`}>
      {children}
    </main>
  )
}
