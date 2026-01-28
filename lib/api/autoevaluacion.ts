// lib/api/autoevaluacion.ts

import type { EstructuraAutoevaluacionResponse } from './types'

/**
 * Servicios de API para autoevaluaciones
 * Usa el proxy de Next.js para evitar problemas de CORS
 */

/**
 * Obtiene la estructura de la autoevaluación (capítulos, indicadores, niveles)
 * Usa el proxy: /api/autoevaluaciones/{id}/estructura -> backend
 * @param idAutoevaluacion - ID de la autoevaluación
 */
export async function obtenerEstructuraAutoevaluacion(
    idAutoevaluacion: string | number
): Promise<EstructuraAutoevaluacionResponse> {
    // Obtener token de localStorage si existe
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // Usar el proxy de Next.js para evitar CORS
    // credentials: 'include' para enviar cookies de sesión
    const response = await fetch(`/api/autoevaluaciones/${idAutoevaluacion}/estructura`, {
        method: 'GET',
        headers,
        credentials: 'include', // Importante: enviar cookies para autenticación de sesión
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`)
    }

    return data as EstructuraAutoevaluacionResponse
}
