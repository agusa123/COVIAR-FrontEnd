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
 * Niveles de sostenibilidad basados en porcentaje
 */
export const NIVELES_SOSTENIBILIDAD = [
    { min: 0, max: 25, nombre: 'Inicial', color: '#ef4444', descripcion: 'Recién comenzando el camino de sostenibilidad' },
    { min: 25, max: 50, nombre: 'En Desarrollo', color: '#f97316', descripcion: 'Avanzando con oportunidades de mejora' },
    { min: 50, max: 75, nombre: 'Consolidado', color: '#eab308', descripcion: 'Prácticas sostenibles establecidas' },
    { min: 75, max: 90, nombre: 'Avanzado', color: '#22c55e', descripcion: 'Alto nivel de sostenibilidad' },
    { min: 90, max: 100, nombre: 'Ejemplar', color: '#10b981', descripcion: 'Referente en sostenibilidad enoturística' },
]

export interface NivelSostenibilidad {
    nombre: string
    color: string
    descripcion?: string
}

export type SegmentoTipo =
    | 'micro_bodega'
    | 'pequena_bodega'
    | 'mediana_bodega'
    | 'bodega'
    | 'gran_bodega'

export const RANGOS_POR_SEGMENTO: Record<SegmentoTipo, {
    minimo: { min: number; max: number }
    medio: { min: number; max: number }
    alto: { min: number; max: number }
}> = {
    micro_bodega: {
        minimo: { min: 17, max: 38 },
        medio: { min: 39, max: 45 },
        alto: { min: 46, max: 51 }
    },
    pequena_bodega: {
        minimo: { min: 23, max: 51 },
        medio: { min: 52, max: 61 },
        alto: { min: 62, max: 69 }
    },
    mediana_bodega: {
        minimo: { min: 32, max: 71 },
        medio: { min: 72, max: 85 },
        alto: { min: 86, max: 96 }
    },
    bodega: {
        minimo: { min: 42, max: 93 },
        medio: { min: 94, max: 112 },
        alto: { min: 113, max: 126 }
    },
    gran_bodega: {
        minimo: { min: 42, max: 93 },
        medio: { min: 94, max: 112 },
        alto: { min: 113, max: 126 }
    }
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
 * Determina el nivel de sostenibilidad basado en el porcentaje
 */
export function determineSustainabilityLevel(porcentaje: number): typeof NIVELES_SOSTENIBILIDAD[0] {
    for (const nivel of NIVELES_SOSTENIBILIDAD) {
        if (porcentaje >= nivel.min && porcentaje < nivel.max) {
            return nivel
        }
    }
    // Si es 100%, retornar el último nivel
    return NIVELES_SOSTENIBILIDAD[NIVELES_SOSTENIBILIDAD.length - 1]
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

/**
 * Normaliza el nombre del segmento a la clave usada en RANGOS_POR_SEGMENTO
 */
export function getSegmentKeyFromName(segmentName: string | undefined): SegmentoTipo | 'micro_bodega' {
    if (!segmentName) return 'micro_bodega'

    const lowerName = segmentName.toLowerCase()

    if (lowerName.includes('micro') || lowerName.includes('artesanal')) return 'micro_bodega'
    if (lowerName.includes('pequeña') || lowerName.includes('pequena')) return 'pequena_bodega'
    if (lowerName.includes('mediana')) return 'mediana_bodega'
    if (lowerName.includes('gran')) return 'gran_bodega'
    // 'Bodega Turística' es la opción por defecto si contiene 'bodega' pero ninguna de las anteriores
    if (lowerName.includes('bodega')) return 'bodega'

    return 'micro_bodega' // Fallback
}

/**
 * Determina el nivel de sostenibilidad basado en el puntaje Y el segmento
 * Utiliza los rangos definidos en la tabla de referencia
 */
export function determineLevelByScoreAndSegment(score: number, segmentName: string | undefined): NivelSostenibilidad {
    const segmentKey = getSegmentKeyFromName(segmentName)
    const rangos = RANGOS_POR_SEGMENTO[segmentKey]

    if (score >= rangos.alto.min) {
        return {
            nombre: 'Nivel Alto de Sostenibilidad',
            color: '#15803D', // green-700
            descripcion: 'Cumple con los estándares más exigentes de sostenibilidad.'
        }
    }

    if (score >= rangos.medio.min) {
        return {
            nombre: 'Nivel Medio de Sostenibilidad',
            color: '#22C55E', // green-500
            descripcion: 'Buen desempeño con oportunidades de mejora para alcanzar la excelencia.'
        }
    }

    // Por defecto o si es menor al mínimo (aunque técnicamente el rango empieza en X)
    // Si es menor al mínimo del rango "minimo", igual lo consideramos nivel mínimo o "insuficiente"?
    // Basado en la tabla, el nivel mínimo va de X a Y. Asumimos que todo lo debajo de Y (hasta 0) cae en esta categoría o inferior.
    // Para simplificar y seguir la UI requerida (solo 3 niveles), usaremos Nivel Mínimo.
    return {
        nombre: 'Nivel Mínimo de Sostenibilidad',
        color: '#EAB308', // yellow-500
        descripcion: 'Cumple con los requisitos básicos, se recomienda implementar mejoras.'
    }
}
