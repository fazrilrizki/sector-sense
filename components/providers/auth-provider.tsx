'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { isGuestUser } from '@/lib/auth/guest'
import { signOut as serverSignOut } from '@/lib/auth/actions'
import type { AuthState, UserProfile } from '@/lib/auth/types'

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialUser = null,
  initialProfile = null,
}: {
  children: React.ReactNode
  initialUser?: User | null
  initialProfile?: UserProfile | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  const [isLoading, setIsLoading] = useState(!initialUser)
  const [, startTransition] = useTransition()

  const isGuest = isGuestUser(user)
  const isAuthenticated = Boolean(user && !isGuest)

  const fetchProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null)
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (!error && data) {
        setProfile(data)
      }
    } catch {
      setProfile(null)
    }
  }

  const refreshAuth = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)
      await fetchProfile(currentUser)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    // Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      await fetchProfile(currentUser)
      setIsLoading(false)
    })

    // Initial check if not already provided by server
    if (!initialUser) {
      refreshAuth()
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [initialUser])

  const handleSignOut = async () => {
    startTransition(async () => {
      await serverSignOut()
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isGuest,
        isAuthenticated,
        isLoading,
        signOut: handleSignOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
