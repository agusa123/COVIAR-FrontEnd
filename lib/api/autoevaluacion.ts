// lib/api/autoevaluacion.ts

import type { EstructuraAutoevaluacionResponse, Segmento, AutoevaluacionCreada, RespuestaIndicador } from './types'

/**
 * Servicios de API para autoevaluaciones
 * Usa el proxy de Next.js para evitar problemas de CORS
 */

/**
 * Helper para obtener headers con autenticación
 */
function getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return headers
}

/**
 * Crea una nueva autoevaluación para una bodega
 * @param idBodega - ID de la bodega
 */
export async function crearAutoevaluacion(idBodega: number): Promise<AutoevaluacionCreada> {
    const response = await fetch('/api/autoevaluaciones', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ id_bodega: idBodega }),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`)
    }

    return data as AutoevaluacionCreada
}

/**
 * Obtiene la estructura de la autoevaluación (capítulos, indicadores, niveles)
 * Usa el proxy: /api/autoevaluaciones/{id}/estructura -> backend
 * @param idAutoevaluacion - ID de la autoevaluación
 */
export async function obtenerEstructuraAutoevaluacion(
    idAutoevaluacion: string | number
): Promise<EstructuraAutoevaluacionResponse> {
    const response = await fetch(`/api/autoevaluaciones/${idAutoevaluacion}/estructura`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`)
    }

    return data as EstructuraAutoevaluacionResponse
}

/**
 * Obtiene los segmentos disponibles para una autoevaluación
 * @param idAutoevaluacion - ID de la autoevaluación
 */
export async function obtenerSegmentos(
    idAutoevaluacion: string | number
): Promise<Segmento[]> {
    const response = await fetch(`/api/autoevaluaciones/${idAutoevaluacion}/segmentos`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`)
    }

    return data as Segmento[]
}

/**
 * Selecciona un segmento para una autoevaluación
 * @param idAutoevaluacion - ID de la autoevaluación
 * @param idSegmento - ID del segmento seleccionado
 */
export async function seleccionarSegmento(
    idAutoevaluacion: string | number,
    idSegmento: number
): Promise<void> {
    const response = await fetch(`/api/autoevaluaciones/${idAutoevaluacion}/segmento`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ id_segmento: idSegmento }),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`)
    }
}

/**
 * Guarda las respuestas de la autoevaluación
 * @param idAutoevaluacion - ID de la autoevaluación
 * @param respuestas - Array de respuestas con id_indicador e id_nivel_respuesta
 */
export async function guardarRespuestas(
    idAutoevaluacion: string | number,
    respuestas: RespuestaIndicador[]
): Promise<void> {
    const response = await fetch(`/api/autoevaluaciones/${idAutoevaluacion}/respuestas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ respuestas }),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`)
    }
}

/**
 * Guarda una sola respuesta de la autoevaluación
 * @param idAutoevaluacion - ID de la autoevaluación
 * @param idIndicador - ID del indicador
 * @param idNivelRespuesta - ID del nivel de respuesta seleccionado
 */
export async function guardarRespuesta(
    idAutoevaluacion: string | number,
    idIndicador: number,
    idNivelRespuesta: number
): Promise<void> {
    const response = await fetch(`/api/autoevaluaciones/${idAutoevaluacion}/respuestas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
            id_indicador: idIndicador,
            id_nivel_respuesta: idNivelRespuesta
        }),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`)
    }
}

/**
 * Valida y finaliza la autoevaluación
 * @param idAutoevaluacion - ID de la autoevaluación
 */
export async function completarAutoevaluacion(
    idAutoevaluacion: string | number
): Promise<void> {
    const response = await fetch(`/api/autoevaluaciones/${idAutoevaluacion}/completar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`)
    }
}

