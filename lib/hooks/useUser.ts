// lib/hooks/useUser.ts

'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/utils/auth-utils'
import { obtenerPerfil } from '@/lib/api/users'
import type { Usuario } from '@/lib/api/types'

/**
 * Hook para obtener el usuario actual
 */
export function useUser() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Cargar usuario desde localStorage
    const user = getCurrentUser()
    setUsuario(user)
    setIsLoading(false)
  }, [])

  return {
    usuario,
    isLoading,
    error,
  }
}

/**
 * Hook para obtener el perfil del usuario desde la API
 * Útil cuando necesitas datos actualizados del servidor
 */
export function useUserProfile() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        // Primero cargar desde localStorage
        const cachedUser = getCurrentUser()
        if (cachedUser) {
          setUsuario(cachedUser)
        }

        // TODO: Cuando la API esté lista, descomentar esto:
        // const profile = await obtenerPerfil()
        // setUsuario(profile)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar el perfil'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return {
    usuario,
    isLoading,
    error,
    refetch: async () => {
      setIsLoading(true)
      setError(null)
      try {
        // TODO: Cuando la API esté lista, descomentar esto:
        // const profile = await obtenerPerfil()
        // setUsuario(profile)
        const cachedUser = getCurrentUser()
        setUsuario(cachedUser)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar el perfil'))
      } finally {
        setIsLoading(false)
      }
    },
  }
}
