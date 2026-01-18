// lib/hooks/useAuth.ts

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  isAuthenticated as checkAuth,
  clearAuthData,
} from '@/lib/utils/auth-utils'
import { logoutUsuario } from '@/lib/api/auth'
import type { Usuario } from '@/lib/api/types'

/**
 * Hook de autenticación
 * Gestiona el estado del usuario y proporciona métodos de autenticación
 */
export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Cargar usuario al montar el componente
  useEffect(() => {
    const user = getCurrentUser()
    setUsuario(user)
    setIsAuthenticated(checkAuth())
    setIsLoading(false)
  }, [])

  // Método para refrescar el usuario desde localStorage
  const refresh = useCallback(() => {
    const user = getCurrentUser()
    setUsuario(user)
    setIsAuthenticated(checkAuth())
  }, [])

  // Método para cerrar sesión
  const logout = useCallback(async () => {
    try {
      await logoutUsuario()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      clearAuthData()
      setUsuario(null)
      setIsAuthenticated(false)
      router.push('/login')
    }
  }, [router])

  // Método para verificar si el usuario tiene un rol específico
  const hasRole = useCallback(
    (role: string) => {
      return usuario?.rol === role
    },
    [usuario]
  )

  // Método para verificar si el usuario tiene alguno de los roles especificados
  const hasAnyRole = useCallback(
    (roles: string[]) => {
      return usuario ? roles.includes(usuario.rol) : false
    },
    [usuario]
  )

  return {
    usuario,
    isAuthenticated,
    isLoading,
    refresh,
    logout,
    hasRole,
    hasAnyRole,
  }
}

/**
 * Hook para proteger rutas que requieren autenticación
 * Redirige al login si el usuario no está autenticado
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading }
}

/**
 * Hook para redirigir usuarios autenticados
 * Útil para páginas de login/registro
 */
export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectTo, router])

  return { isAuthenticated, isLoading }
}
