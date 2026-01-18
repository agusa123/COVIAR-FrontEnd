// lib/utils/auth-utils.ts

import { getItem, setItem, removeItem, STORAGE_KEYS } from './storage'
import type { Usuario } from '@/lib/api/types'

/**
 * Utilidades de autenticación
 */

/**
 * Obtiene el usuario actual desde localStorage
 */
export function getCurrentUser(): Usuario | null {
  return getItem<Usuario>(STORAGE_KEYS.USER)
}

/**
 * Guarda el usuario en localStorage
 */
export function setCurrentUser(usuario: Usuario): void {
  setItem(STORAGE_KEYS.USER, usuario)
}

/**
 * Elimina el usuario de localStorage
 */
export function removeCurrentUser(): void {
  removeItem(STORAGE_KEYS.USER)
}

/**
 * Obtiene el token de autenticación
 */
export function getAuthToken(): string | null {
  // Intentar obtener token directo
  const token = getItem<string>(STORAGE_KEYS.TOKEN)
  if (token) return token

  // Alternativa: obtener del objeto usuario
  const usuario = getCurrentUser()
  return usuario && 'token' in usuario ? (usuario as Usuario & { token?: string }).token || null : null
}

/**
 * Guarda el token de autenticación
 */
export function setAuthToken(token: string): void {
  setItem(STORAGE_KEYS.TOKEN, token)
}

/**
 * Elimina el token de autenticación
 */
export function removeAuthToken(): void {
  removeItem(STORAGE_KEYS.TOKEN)
}

/**
 * Verifica si hay un usuario autenticado
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

/**
 * Limpia todos los datos de autenticación
 */
export function clearAuthData(): void {
  removeCurrentUser()
  removeAuthToken()
  removeItem(STORAGE_KEYS.REFRESH_TOKEN)
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(role: string): boolean {
  const usuario = getCurrentUser()
  return usuario?.rol === role
}

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 */
export function hasAnyRole(roles: string[]): boolean {
  const usuario = getCurrentUser()
  return usuario ? roles.includes(usuario.rol) : false
}

/**
 * Verifica si el usuario está activo
 */
export function isUserActive(): boolean {
  const usuario = getCurrentUser()
  return usuario?.activo ?? false
}
