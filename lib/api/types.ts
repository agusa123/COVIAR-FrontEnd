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

// Estructura para el registro de bodega según API /api/v1/registro
export interface RegistroBodega {
  razon_social: string
  nombre_fantasia: string
  cuit: string
  inv_bod?: string
  inv_vin?: string
  calle: string
  numeracion?: string
  id_localidad: number
  telefono: string
  email_institucional: string
}

export interface RegistroCuenta {
  email_login: string
  password: string
}

export interface RegistroResponsable {
  nombre: string
  apellido: string
  cargo: string
  dni?: string
}

export interface RegistroRequest {
  bodega: RegistroBodega
  cuenta: RegistroCuenta
  responsable: RegistroResponsable
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
