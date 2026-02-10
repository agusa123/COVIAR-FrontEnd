// lib/utils/scoring.ts

import type { CapituloEstructura, ResultadoCapitulo, ResultadoCapituloConIndicadores, IndicadorConRespuesta } from '@/lib/api/types'

/**
 * Interfaz para respuestas del usuario
 * Mapea id_indicador -> puntos obtenidos
 */
export interface RespuestasMap {
    [idIndicador: number]: number
}

/**
 * Niveles de sostenibilidad oficiales COVIAR
 * Colores basados en la guía institucional
 */
export const NIVELES_SOSTENIBILIDAD = [
    { key: 'minimo', nombre: 'Nivel Mínimo de Sostenibilidad', color: '#84CC16', descripcion: 'Cumple con los requisitos mínimos de sostenibilidad' },
    { key: 'medio', nombre: 'Nivel Medio de Sostenibilidad', color: '#22C55E', descripcion: 'Buenas prácticas de sostenibilidad implementadas' },
    { key: 'alto', nombre: 'Nivel Alto de Sostenibilidad', color: '#15803D', descripcion: 'Excelencia en sostenibilidad enoturística' },
]

/**
 * Mapea el nombre del nivel del backend al nivel oficial con su color
 */
export function getNivelSostenibilidadInfo(nombreBackend: string): { nombre: string; color: string; key: string } {
    const nombreLower = nombreBackend.toLowerCase()
    
    // Mapear variantes del backend a los niveles oficiales
    if (nombreLower.includes('alto') || nombreLower.includes('avanzado') || nombreLower.includes('ejemplar')) {
        return { ...NIVELES_SOSTENIBILIDAD[2], key: 'alto' }
    }
    if (nombreLower.includes('medio') || nombreLower.includes('intermedio') || nombreLower.includes('consolidado')) {
        return { ...NIVELES_SOSTENIBILIDAD[1], key: 'medio' }
    }
    // Por defecto: nivel mínimo (incluye 'mínimo', 'inicial', 'en desarrollo', etc.)
    return { ...NIVELES_SOSTENIBILIDAD[0], key: 'minimo' }
}

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
 * Calcula puntajes por capítulo INCLUYENDO indicadores con sus respuestas
 * Esta versión extendida incluye el detalle de cada indicador y la respuesta seleccionada
 */
export function calculateChapterScoresWithResponses(
    responses: RespuestasMap,
    estructura: CapituloEstructura[]
): ResultadoCapituloConIndicadores[] {
    return estructura.map(capitulo => {
        const indicadoresHabilitados = capitulo.indicadores.filter(ind => ind.habilitado !== false)

        let puntajeObtenido = 0
        let indicadoresCompletados = 0

        const indicadoresConRespuesta: IndicadorConRespuesta[] = indicadoresHabilitados.map(indicador => {
            const maxPuntos = Math.max(...indicador.niveles_respuesta.map(n => n.puntos), 0)
            const puntosSeleccionados = responses[indicador.indicador.id_indicador]
            
            // Buscar el nivel de respuesta seleccionado
            let respuestaSeleccionada = null
            if (puntosSeleccionados !== undefined) {
                const nivelSeleccionado = indicador.niveles_respuesta.find(n => n.puntos === puntosSeleccionados)
                if (nivelSeleccionado) {
                    respuestaSeleccionada = {
                        id_nivel_respuesta: nivelSeleccionado.id_nivel_respuesta,
                        nombre: nivelSeleccionado.nombre,
                        descripcion: nivelSeleccionado.descripcion || '',
                        puntos: nivelSeleccionado.puntos
                    }
                }
                puntajeObtenido += puntosSeleccionados
                indicadoresCompletados++
            }

            return {
                id_indicador: indicador.indicador.id_indicador,
                nombre: indicador.indicador.nombre,
                descripcion: indicador.indicador.descripcion || '',
                orden: indicador.indicador.orden,
                respuesta: respuestaSeleccionada,
                puntaje_maximo: isFinite(maxPuntos) ? maxPuntos : 0
            }
        })

        const puntajeMaximo = indicadoresConRespuesta.reduce((sum, ind) => sum + ind.puntaje_maximo, 0)

        return {
            id_capitulo: capitulo.capitulo.id_capitulo,
            nombre: capitulo.capitulo.nombre,
            puntaje_obtenido: puntajeObtenido,
            puntaje_maximo: puntajeMaximo,
            porcentaje: puntajeMaximo > 0 ? Math.round((puntajeObtenido / puntajeMaximo) * 100) : 0,
            indicadores_completados: indicadoresCompletados,
            indicadores_total: indicadoresHabilitados.length,
            indicadores: indicadoresConRespuesta
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
 * Mapea a los 3 niveles oficiales COVIAR
 */
export function determineSustainabilityLevel(porcentaje: number): typeof NIVELES_SOSTENIBILIDAD[0] {
    if (porcentaje >= 75) {
        return NIVELES_SOSTENIBILIDAD[2] // Alto
    }
    if (porcentaje >= 50) {
        return NIVELES_SOSTENIBILIDAD[1] // Medio
    }
    return NIVELES_SOSTENIBILIDAD[0] // Mínimo
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
        return NIVELES_SOSTENIBILIDAD[2] // Nivel Alto
    }

    if (score >= rangos.medio.min) {
        return NIVELES_SOSTENIBILIDAD[1] // Nivel Medio
    }

    // Nivel Mínimo (incluye puntajes por debajo del rango mínimo)
    return NIVELES_SOSTENIBILIDAD[0]
}
