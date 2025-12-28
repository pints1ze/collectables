'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/collections', label: 'Collections' },
  ]
  
  return (
    <nav className="bg-background border-t border-border fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 text-center py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? 'text-primary border-t-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}


