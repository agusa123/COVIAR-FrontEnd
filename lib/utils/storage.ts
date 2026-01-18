// lib/utils/storage.ts

/**
 * Utilidades para gestión de almacenamiento local
 */

export const STORAGE_KEYS = {
  USER: 'usuario',
  TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
} as const

/**
 * Guarda un valor en localStorage
 */
export function setItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    localStorage.setItem(key, serialized)
  } catch (error) {
    console.error(`Error al guardar en localStorage (${key}):`, error)
  }
}

/**
 * Obtiene un valor de localStorage
 */
export function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    // Intentar parsear como JSON, si falla retornar como string
    try {
      return JSON.parse(item) as T
    } catch {
      return item as T
    }
  } catch (error) {
    console.error(`Error al leer de localStorage (${key}):`, error)
    return null
  }
}

/**
 * Elimina un valor de localStorage
 */
export function removeItem(key: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error al eliminar de localStorage (${key}):`, error)
  }
}

/**
 * Limpia completamente el localStorage
 */
export function clear(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.clear()
  } catch (error) {
    console.error('Error al limpiar localStorage:', error)
  }
}

/**
 * Verifica si una clave existe en localStorage
 */
export function hasItem(key: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}
