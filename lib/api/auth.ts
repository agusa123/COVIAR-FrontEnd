// lib/api/auth.ts

import { api } from './client'
import type {
  LoginRequest,
  LoginResponse,
  RegistroRequest,
  RegistroResponse,
  Usuario,
} from './types'

/**
 * Servicio de autenticación
 */

/**
 * Registra una nueva bodega en el sistema
 * Usa el proxy de Next.js para evitar problemas de CORS
 * POST /api/registro -> proxy -> http://localhost:8080/api/v1/registro
 */
export async function registrarBodega(data: RegistroRequest): Promise<RegistroResponse> {
  try {
    // Usar el proxy de Next.js para evitar CORS
    const response = await fetch('/api/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || `Error ${response.status}: ${response.statusText}`)
    }

    console.log('Bodega registrada:', result)
    return result
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar con el servidor')
    }
    throw error
  }
}

/**
 * Inicia sesión con email y contraseña
 */
export async function loginUsuario(data: LoginRequest): Promise<Usuario> {
  const response = await api.post<Usuario | LoginResponse>('/api/usuarios/verificar', data)

  let usuario: Usuario

  // Verificar si la respuesta tiene el formato { usuario, token } o es directamente el Usuario
  if ('usuario' in response) {
    // Formato: { usuario: Usuario, token?: string }
    usuario = response.usuario
    if (response.token) {
      localStorage.setItem('token', response.token)
    }
  } else {
    // Formato directo: Usuario
    usuario = response as Usuario
  }

  console.log('Usuario logueado:', usuario)

  // Guardar usuario en localStorage
  localStorage.setItem('usuario', JSON.stringify(usuario))

  return usuario
}

/**
 * Cierra la sesión del usuario actual
 */
export async function logoutUsuario(): Promise<void> {
  // Limpiar datos de localStorage
  localStorage.removeItem('usuario')
  localStorage.removeItem('token')

  // TODO: Cuando la API tenga endpoint de logout, llamarlo aquí
  // try {
  //   await api.post('/api/usuarios/logout', {}, { requiresAuth: true })
  // } catch (error) {
  //   console.error('Error al hacer logout en el servidor:', error)
  // }
}

/**
 * Obtiene el usuario actual desde localStorage
 */
export function getUsuarioActual(): Usuario | null {
  if (typeof window === 'undefined') return null

  const usuarioStr = localStorage.getItem('usuario')
  if (!usuarioStr) return null

  try {
    return JSON.parse(usuarioStr) as Usuario
  } catch {
    return null
  }
}

/**
 * Verifica si hay un usuario autenticado
 */
export function isAuthenticated(): boolean {
  return getUsuarioActual() !== null
}

/**
 * Solicita restablecimiento de contraseña
 */
export async function solicitarRestablecimientoPassword(email: string): Promise<void> {
  await api.post('/api/usuarios/recuperar-password', { email })
}

/**
 * Restablece la contraseña con un token
 */
export async function restablecerPassword(token: string, nuevaPassword: string): Promise<void> {
  await api.post('/api/usuarios/restablecer-password', {
    token,
    nuevaPassword,
  })
}

/**
 * Verifica si el token de autenticación es válido
 * (Para cuando la API implemente validación de tokens)
 */
export async function verificarToken(): Promise<boolean> {
  try {
    // TODO: Implementar cuando la API tenga endpoint de verificación
    // await api.get('/api/usuarios/verificar-token', { requiresAuth: true })
    return true
  } catch {
    return false
  }
}
