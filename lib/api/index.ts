// lib/api/index.ts

/**
 * Punto de entrada principal para la API
 * Exporta todos los servicios, tipos y utilidades
 */

// Cliente HTTP
export { api, apiRequest, config, ApiClientError } from './client'
export type { RequestOptions } from './client'

// Servicios de autenticación
export {
  registrarUsuario,
  loginUsuario,
  logoutUsuario,
  getUsuarioActual,
  isAuthenticated,
  solicitarRestablecimientoPassword,
  restablecerPassword,
  verificarToken,
} from './auth'

// Servicios de usuarios
export {
  obtenerPerfil,
  obtenerUsuario,
  actualizarPerfil,
  cambiarPassword,
  eliminarCuenta,
  listarUsuarios,
  actualizarEstadoUsuario,
} from './users'

// Tipos
export type {
  ApiResponse,
  ApiError,
  Usuario,
  LoginRequest,
  LoginResponse,
  RegistroRequest,
  RegistroResponse,
  ActualizarPerfilRequest,
  CambiarPasswordRequest,
  Autoevaluacion,
  CrearAutoevaluacionRequest,
  AppConfig,
} from './types'
