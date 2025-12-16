'use client'

import { Bell, Search, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  return (
    <header className="h-16 bg-white border-b border-virgin-gray-200 px-6 flex items-center justify-between">
      <div>
        {title && (
          <h1 className="text-xl font-bold text-virgin-black">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-virgin-gray-600">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-virgin-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-64 border border-virgin-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-virgin-red focus:border-transparent"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-virgin-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-virgin-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-virgin-red rounded-full"></span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-virgin-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-virgin-black">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-virgin-gray-500">Administrator</p>
          </div>
          <div className="w-10 h-10 bg-virgin-gray-200 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-virgin-gray-600" />
          </div>
        </div>
      </div>
    </header>
  )
}
