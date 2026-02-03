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
  email_login: string
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

export interface AutoevaluacionPendiente {
  id_autoevaluacion: number
  fecha_inicio: string
  estado: string
  id_bodega: number
  id_segmento: number | null
  puntaje_final: number | null
  id_nivel_sostenibilidad: number | null
}

export interface RespuestaGuardada {
  id_indicador: number
  id_nivel_respuesta: number
}

export interface CrearAutoevaluacionResponse {
  autoevaluacion_pendiente: AutoevaluacionPendiente
  respuestas: RespuestaGuardada[]
  mensaje: string
}

// Legacy type for backwards compatibility
export interface AutoevaluacionCreada {
  id_autoevaluacion: number
  fecha_inicio: string
  estado: string
  id_bodega: number
  id_version: number
}

// ============= HISTORIAL Y RESULTADOS =============

export interface AutoevaluacionHistorial {
  id_autoevaluacion: number
  fecha_inicio: string
  fecha_finalizacion?: string
  estado: 'pendiente' | 'completada' | 'cancelada'
  id_bodega: number
  id_segmento: number | null
  nombre_segmento?: string // Agregado para persistencia local del nombre
  puntaje_final: number | null
  puntaje_maximo: number | null
  porcentaje: number | null
  id_nivel_sostenibilidad: number | null
  nivel_sostenibilidad?: {
    id: number
    nombre: string
    descripcion?: string
  }
}

export interface ResultadoCapitulo {
  id_capitulo: number
  nombre: string
  puntaje_obtenido: number
  puntaje_maximo: number
  porcentaje: number
  indicadores_completados: number
  indicadores_total: number
}

export interface ResultadoDetallado {
  autoevaluacion: AutoevaluacionHistorial
  capitulos: ResultadoCapitulo[]
  comparativa?: {
    evaluacion_anterior?: AutoevaluacionHistorial
    diferencia_puntaje: number
    diferencia_porcentaje: number
  }
}

export interface RespuestaIndicador {
  id_indicador: number
  id_nivel_respuesta: number
}

export interface CrearAutoevaluacionRequest {
  respuestas: Record<string, unknown>
}

// ============= ESTRUCTURA AUTOEVALUACIÓN =============

export interface Capitulo {
  id_capitulo: number
  id_version: number
  nombre: string
  descripcion?: string
  orden: number
}

export interface Indicador {
  id_indicador: number
  id_capitulo: number
  nombre: string
  descripcion: string
  orden: number
}

export interface NivelRespuesta {
  id_nivel_respuesta: number
  id_indicador: number
  nombre: string
  puntos: number
  descripcion?: string
}

export interface IndicadorEstructura {
  indicador: Indicador
  niveles_respuesta: NivelRespuesta[]
  habilitado?: boolean
}

export interface CapituloEstructura {
  capitulo: Capitulo
  indicadores: IndicadorEstructura[]
}

export interface Segmento {
  id_segmento: number
  nombre: string
  min_turistas: number
  max_turistas: number
  id_version: number
}

export interface EstructuraAutoevaluacionResponse {
  capitulos: CapituloEstructura[]
}

// ============= CONFIGURACIÓN =============

export interface AppConfig {
  apiUrl: string
  apiTimeout: number
}
