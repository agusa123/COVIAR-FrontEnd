// lib/utils/scoring.ts

import type { CapituloEstructura, ResultadoCapitulo } from '@/lib/api/types'

/**
 * Interfaz para respuestas del usuario
 * Mapea id_indicador -> puntos obtenidos
 */
export interface RespuestasMap {
    [idIndicador: number]: number
}

/**
 * Tipos de segmentos disponibles
 */
export type SegmentoTipo =
    | 'micro_bodega'      // Micro Bodega Turística/Artesanal
    | 'pequena_bodega'    // Pequeña Bodega Turística
    | 'mediana_bodega'    // Mediana Bodega Turística
    | 'bodega'            // Bodega Turística
    | 'gran_bodega'       // Gran Bodega Turística

/**
 * Niveles de sostenibilidad genéricos (sin segmento específico)
 * Usa colores: Amarillo = Mínimo, Verde claro = Medio, Verde oscuro = Alto
 */
export const NIVELES_SOSTENIBILIDAD = [
    {
        id: 'minimo',
        nombre: 'Nivel mínimo de sostenibilidad',
        color: '#EAB308', // Amarillo
        descripcion: 'Cumple con los requisitos mínimos de sostenibilidad enoturística'
    },
    {
        id: 'medio',
        nombre: 'Nivel medio de sostenibilidad',
        color: '#22C55E', // Verde claro
        descripcion: 'Demuestra un compromiso sólido con la sostenibilidad'
    },
    {
        id: 'alto',
        nombre: 'Nivel alto de sostenibilidad',
        color: '#15803D', // Verde oscuro
        descripcion: 'Referente en prácticas de sostenibilidad enoturística'
    },
]

/**
 * Tabla de rangos de puntaje por segmento
 * Basado en la guía oficial de niveles de sostenibilidad
 */
export const RANGOS_POR_SEGMENTO: Record<SegmentoTipo, {
    nombre: string
    minimo: { min: number; max: number }
    medio: { min: number; max: number }
    alto: { min: number; max: number }
}> = {
    micro_bodega: {
        nombre: 'Micro Bodega Turística/Artesanal',
        minimo: { min: 17, max: 38 },
        medio: { min: 39, max: 45 },
        alto: { min: 46, max: 51 }
    },
    pequena_bodega: {
        nombre: 'Pequeña Bodega Turística',
        minimo: { min: 23, max: 51 },
        medio: { min: 52, max: 61 },
        alto: { min: 62, max: 69 }
    },
    mediana_bodega: {
        nombre: 'Mediana Bodega Turística',
        minimo: { min: 32, max: 71 },
        medio: { min: 72, max: 85 },
        alto: { min: 86, max: 96 }
    },
    bodega: {
        nombre: 'Bodega Turística',
        minimo: { min: 42, max: 93 },
        medio: { min: 94, max: 112 },
        alto: { min: 113, max: 126 }
    },
    gran_bodega: {
        nombre: 'Gran Bodega Turística',
        minimo: { min: 42, max: 93 },
        medio: { min: 94, max: 112 },
        alto: { min: 113, max: 126 }
    }
}

/**
 * Obtiene el tipo de segmento basado en el nombre o ID
 */
export function getSegmentoTipo(segmentoNombre: string): SegmentoTipo {
    const nombre = segmentoNombre.toLowerCase()

    if (nombre.includes('micro') || nombre.includes('artesanal')) {
        return 'micro_bodega'
    }
    if (nombre.includes('pequeña') || nombre.includes('pequena')) {
        return 'pequena_bodega'
    }
    if (nombre.includes('mediana')) {
        return 'mediana_bodega'
    }
    if (nombre.includes('gran')) {
        return 'gran_bodega'
    }
    // Default: Bodega Turística
    return 'bodega'
}

/**
 * Determina el nivel de sostenibilidad basado en el puntaje y el segmento
 */
export function determineSustainabilityLevelBySegment(
    puntaje: number,
    segmentoNombre: string
): typeof NIVELES_SOSTENIBILIDAD[0] {
    const segmentoTipo = getSegmentoTipo(segmentoNombre)
    const rangos = RANGOS_POR_SEGMENTO[segmentoTipo]

    if (puntaje >= rangos.alto.min) {
        return NIVELES_SOSTENIBILIDAD[2] // Alto
    }
    if (puntaje >= rangos.medio.min) {
        return NIVELES_SOSTENIBILIDAD[1] // Medio
    }
    if (puntaje >= rangos.minimo.min) {
        return NIVELES_SOSTENIBILIDAD[0] // Mínimo
    }

    // Por debajo del mínimo - retorna mínimo pero puede indicarse como "sin nivel"
    return NIVELES_SOSTENIBILIDAD[0]
}

/**
 * Determina el nivel de sostenibilidad basado en porcentaje (fallback genérico)
 * Usado cuando no se tiene información del segmento
 */
export function determineSustainabilityLevel(porcentaje: number): typeof NIVELES_SOSTENIBILIDAD[0] {
    // Rangos por porcentaje: 0-40% = mínimo, 40-70% = medio, 70%+ = alto
    if (porcentaje >= 70) {
        return NIVELES_SOSTENIBILIDAD[2] // Alto
    }
    if (porcentaje >= 40) {
        return NIVELES_SOSTENIBILIDAD[1] // Medio
    }
    return NIVELES_SOSTENIBILIDAD[0] // Mínimo
}

/**
 * Obtiene información completa del nivel incluyendo rangos del segmento
 */
export function getNivelConRangos(
    puntaje: number,
    segmentoNombre: string
): {
    nivel: typeof NIVELES_SOSTENIBILIDAD[0]
    rangos: typeof RANGOS_POR_SEGMENTO[SegmentoTipo]
    segmentoTipo: SegmentoTipo
    cumpleMinimo: boolean
} {
    const segmentoTipo = getSegmentoTipo(segmentoNombre)
    const rangos = RANGOS_POR_SEGMENTO[segmentoTipo]
    const nivel = determineSustainabilityLevelBySegment(puntaje, segmentoNombre)
    const cumpleMinimo = puntaje >= rangos.minimo.min

    return { nivel, rangos, segmentoTipo, cumpleMinimo }
}

/**
 * Calcula el puntaje máximo posible de toda la estructura
 */
export function calculateMaxScore(estructura: CapituloEstructura[]): number {
    return estructura.reduce((total, capitulo) => {
        const capituloMax = capitulo.indicadores
            .filter(ind => ind.habilitado !== false)
            .reduce((sum, indicador) => {
                const maxPuntos = Math.max(...indicador.niveles_respuesta.map(n => n.puntos), 0)
                return sum + (isFinite(maxPuntos) ? maxPuntos : 0)
            }, 0)
        return total + capituloMax
    }, 0)
}

/**
 * Calcula el puntaje total obtenido basado en las respuestas
 */
export function calculateTotalScore(
    responses: RespuestasMap,
    estructura: CapituloEstructura[]
): number {
    let total = 0

    estructura.forEach(capitulo => {
        capitulo.indicadores
            .filter(ind => ind.habilitado !== false)
            .forEach(indicador => {
                const puntos = responses[indicador.indicador.id_indicador]
                if (puntos !== undefined) {
                    total += puntos
                }
            })
    })

    return total
}

/**
 * Calcula el porcentaje de avance (puntaje / máximo * 100)
 */
export function calculatePercentage(
    responses: RespuestasMap,
    estructura: CapituloEstructura[]
): number {
    const maxScore = calculateMaxScore(estructura)
    if (maxScore === 0) return 0

    const currentScore = calculateTotalScore(responses, estructura)
    return Math.round((currentScore / maxScore) * 100)
}

/**
 * Calcula puntajes por capítulo
 */
export function calculateChapterScores(
    responses: RespuestasMap,
    estructura: CapituloEstructura[]
): ResultadoCapitulo[] {
    return estructura.map(capitulo => {
        const indicadoresHabilitados = capitulo.indicadores.filter(ind => ind.habilitado !== false)

        let puntajeObtenido = 0
        let indicadoresCompletados = 0

        const puntajeMaximo = indicadoresHabilitados.reduce((sum, indicador) => {
            const maxPuntos = Math.max(...indicador.niveles_respuesta.map(n => n.puntos), 0)

            const puntos = responses[indicador.indicador.id_indicador]
            if (puntos !== undefined) {
                puntajeObtenido += puntos
                indicadoresCompletados++
            }

            return sum + (isFinite(maxPuntos) ? maxPuntos : 0)
        }, 0)

        return {
            id_capitulo: capitulo.capitulo.id_capitulo,
            nombre: capitulo.capitulo.nombre,
            puntaje_obtenido: puntajeObtenido,
            puntaje_maximo: puntajeMaximo,
            porcentaje: puntajeMaximo > 0 ? Math.round((puntajeObtenido / puntajeMaximo) * 100) : 0,
            indicadores_completados: indicadoresCompletados,
            indicadores_total: indicadoresHabilitados.length,
        }
    })
}

/**
 * Calcula el porcentaje de capítulos completados (todos los indicadores respondidos)
 */
export function calculateChaptersProgress(
    responses: RespuestasMap,
    estructura: CapituloEstructura[]
): { completados: number; total: number; porcentaje: number } {
    let capitulosCompletados = 0

    estructura.forEach(capitulo => {
        const indicadoresHabilitados = capitulo.indicadores.filter(ind => ind.habilitado !== false)
        const todosRespondidos = indicadoresHabilitados.every(
            ind => responses[ind.indicador.id_indicador] !== undefined
        )

        if (todosRespondidos && indicadoresHabilitados.length > 0) {
            capitulosCompletados++
        }
    })

    return {
        completados: capitulosCompletados,
        total: estructura.length,
        porcentaje: estructura.length > 0
            ? Math.round((capitulosCompletados / estructura.length) * 100)
            : 0,
    }
}

/**
 * Calcula la diferencia entre dos evaluaciones
 */
export function calculateComparison(
    currentScore: number,
    previousScore: number,
    currentMax: number,
    previousMax: number
): { diferenciaPuntos: number; diferenciaPorcentaje: number; mejora: boolean } {
    const currentPercentage = currentMax > 0 ? (currentScore / currentMax) * 100 : 0
    const previousPercentage = previousMax > 0 ? (previousScore / previousMax) * 100 : 0

    return {
        diferenciaPuntos: currentScore - previousScore,
        diferenciaPorcentaje: Math.round(currentPercentage - previousPercentage),
        mejora: currentPercentage > previousPercentage,
    }
}
