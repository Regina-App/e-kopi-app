'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { EmployeeProfile } from '@/lib/services/employee.service'

export interface AuthState {
  employee: EmployeeProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

async function fetchSession(): Promise<EmployeeProfile | null> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 401) {
        return null
      }
      return null
    }

    const data = await res.json()
    if (data.success && data.employee) {
      return data.employee as EmployeeProfile
    }

    return null
  } catch (error) {
    console.error('[useAuth] Error fetching session:', error)
    return null
  }
}

export function useAuth(): AuthState {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    data: employee = null,
    isLoading,
    refetch,
  } = useQuery<EmployeeProfile | null>({
    queryKey: ['auth', 'session'],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (err) {
        console.error('[useAuth] Error calling logout api:', err)
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'session'], null)
      router.push('/login')
    },
  })

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  const refreshSession = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    employee,
    isLoading,
    isAuthenticated: Boolean(employee),
    logout,
    refreshSession,
  }
}
