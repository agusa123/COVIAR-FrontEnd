// lib/api/client.ts

import type { ApiResponse, ApiError } from './types'

/**
 * Cliente HTTP base para todas las peticiones a la API
 */

// Configuración
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const API_TIMEOUT = 30000 // 30 segundos

/**
 * Clase de error personalizada para errores de API
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

/**
 * Opciones para las peticiones HTTP
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  timeout?: number
  requiresAuth?: boolean
}

/**
 * Obtiene el token de autenticación almacenado
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null

  // Buscar token en localStorage
  const token = localStorage.getItem('token')
  if (token) return token

  // Alternativa: obtener token del usuario almacenado
  const usuarioStr = localStorage.getItem('usuario')
  if (usuarioStr) {
    try {
      const usuario = JSON.parse(usuarioStr)
      return usuario.token || null
    } catch {
      return null
    }
  }

  return null
}

/**
 * Realiza una petición HTTP a la API
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    body,
    timeout = API_TIMEOUT,
    requiresAuth = false,
    headers = {},
    ...fetchOptions
  } = options

  // Construir URL completa
  const url = `${API_BASE_URL}${endpoint}`

  // Construir headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Agregar token de autenticación si es requerido
  if (requiresAuth) {
    const token = getAuthToken()
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  // Crear controller para timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    // Realizar petición
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Parsear respuesta
    const data = await response.json()

    // Manejar errores HTTP
    if (!response.ok) {
      const error = data as ApiError
      throw new ApiClientError(
        error.message || 'Error en la petición',
        response.status,
        error.error,
        error.details
      )
    }

    // Retornar datos
    const apiResponse = data as ApiResponse<T>
    return apiResponse.data
  } catch (error) {
    clearTimeout(timeoutId)

    // Manejar timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError('La petición tardó demasiado tiempo', 408)
    }

    // Manejar errores de red
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiClientError(
        'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        0
      )
    }

    // Re-lanzar errores de API
    if (error instanceof ApiClientError) {
      throw error
    }

    // Error desconocido
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Error desconocido',
      500
    )
  }
}

/**
 * Métodos de conveniencia para peticiones HTTP
 */
export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}

/**
 * Exportar configuración
 */
export const config = {
  apiUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
}
