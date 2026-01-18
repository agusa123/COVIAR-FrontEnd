// lib/api/types.ts

/**
 * Tipos compartidos para la API
 */

// ============= RESPUESTAS API =============

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  message: string
  details?: unknown
}

// ============= USUARIO =============

export interface Usuario {
  idUsuario: number
  email: string
  nombre: string
  apellido: string
  rol: string
  activo: boolean
  fecha_registro: string
  ultimo_acceso?: string | null
  password_hash?: string // No debería enviarse desde el backend, pero lo incluimos por compatibilidad
}

// ============= AUTENTICACIÓN =============

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  usuario: Usuario
  token?: string // Para cuando la API implemente JWT
}

export interface RegistroRequest {
  email: string
  password: string
  nombre: string
  apellido: string
  rol: string
}

export interface RegistroResponse {
  usuario: Usuario
  token?: string // Para cuando la API implemente JWT
}

// ============= PERFIL =============

export interface ActualizarPerfilRequest {
  nombre?: string
  apellido?: string
  email?: string
}

export interface CambiarPasswordRequest {
  passwordActual: string
  passwordNueva: string
}

// ============= AUTOEVALUACIONES =============

export interface Autoevaluacion {
  id: number
  usuarioId: number
  fecha: string
  completada: boolean
  puntaje?: number
  respuestas: Record<string, unknown>
}

export interface CrearAutoevaluacionRequest {
  respuestas: Record<string, unknown>
}

// ============= CONFIGURACIÓN =============

export interface AppConfig {
  apiUrl: string
  apiTimeout: number
}
