// lib/utils/index.ts

/**
 * Exporta todas las utilidades
 */

// Utilidades de almacenamiento
export {
  setItem,
  getItem,
  removeItem,
  clear,
  hasItem,
  STORAGE_KEYS,
} from './storage'

// Utilidades de autenticación
export {
  getCurrentUser,
  setCurrentUser,
  removeCurrentUser,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  clearAuthData,
  hasRole,
  hasAnyRole,
  isUserActive,
} from './auth-utils'
