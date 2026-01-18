// lib/api/users.ts

import { api } from './client'
import type {
  Usuario,
  ActualizarPerfilRequest,
  CambiarPasswordRequest,
} from './types'

/**
 * Servicio de gestión de usuarios y perfiles
 */

/**
 * Obtiene el perfil del usuario actual
 */
export async function obtenerPerfil(): Promise<Usuario> {
  return api.get<Usuario>('/api/usuarios/perfil', { requiresAuth: true })
}

/**
 * Obtiene un usuario por su ID
 */
export async function obtenerUsuario(id: number): Promise<Usuario> {
  return api.get<Usuario>(`/api/usuarios/${id}`, { requiresAuth: true })
}

/**
 * Actualiza el perfil del usuario actual
 */
export async function actualizarPerfil(data: ActualizarPerfilRequest): Promise<Usuario> {
  const usuario = await api.put<Usuario>('/api/usuarios/perfil', data, {
    requiresAuth: true,
  })

  // Actualizar usuario en localStorage
  localStorage.setItem('usuario', JSON.stringify(usuario))

  return usuario
}

/**
 * Cambia la contraseña del usuario actual
 */
export async function cambiarPassword(data: CambiarPasswordRequest): Promise<void> {
  await api.post('/api/usuarios/cambiar-password', data, {
    requiresAuth: true,
  })
}

/**
 * Elimina la cuenta del usuario actual
 */
export async function eliminarCuenta(): Promise<void> {
  await api.delete('/api/usuarios/perfil', { requiresAuth: true })

  // Limpiar datos de localStorage
  localStorage.removeItem('usuario')
  localStorage.removeItem('token')
}

/**
 * Lista todos los usuarios (solo para administradores)
 */
export async function listarUsuarios(): Promise<Usuario[]> {
  return api.get<Usuario[]>('/api/usuarios', { requiresAuth: true })
}

/**
 * Actualiza el estado activo de un usuario (solo para administradores)
 */
export async function actualizarEstadoUsuario(
  id: number,
  activo: boolean
): Promise<Usuario> {
  return api.patch<Usuario>(
    `/api/usuarios/${id}/estado`,
    { activo },
    { requiresAuth: true }
  )
}
