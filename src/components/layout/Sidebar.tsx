'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Globe,
  Megaphone,
  Target,
  FileText,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Hotels', href: '/hotels', icon: Building2 },
]

const dataNavigation = [
  { name: 'Performance', href: '/performance', icon: BarChart3 },
  { name: 'Web Analytics', href: '/analytics', icon: Globe },
  { name: 'Paid Media', href: '/media', icon: Megaphone },
]

const strategyNavigation = [
  { name: 'Strategy', href: '/strategy', icon: Target },
  { name: '5:15 Updates', href: '/updates', icon: FileText },
]

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavLink = ({ item }: { item: { name: string; href: string; icon: React.ElementType } }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-virgin-red text-white'
            : 'text-virgin-gray-700 hover:bg-virgin-gray-100'
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    )
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-virgin-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-virgin-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-virgin-red rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="font-bold text-lg text-virgin-black">Virgin Hotels</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Main */}
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        {/* Data Section */}
        <div className="mt-6">
          <p className="px-3 text-xs font-semibold text-virgin-gray-500 uppercase tracking-wider mb-2">
            Data & Analytics
          </p>
          <div className="space-y-1">
            {dataNavigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>

        {/* Strategy Section */}
        <div className="mt-6">
          <p className="px-3 text-xs font-semibold text-virgin-gray-500 uppercase tracking-wider mb-2">
            Strategy
          </p>
          <div className="space-y-1">
            {strategyNavigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>

        {/* Admin Section */}
        <div className="mt-6">
          <p className="px-3 text-xs font-semibold text-virgin-gray-500 uppercase tracking-wider mb-2">
            Administration
          </p>
          <div className="space-y-1">
            {adminNavigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-virgin-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-virgin-gray-700 hover:bg-virgin-gray-100 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
