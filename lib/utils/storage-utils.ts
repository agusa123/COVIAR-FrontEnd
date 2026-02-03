import type { ResultadoDetallado } from "@/lib/api/types"

const STORAGE_KEY = 'historial_local'

/**
 * Guarda un nuevo resultado de autoevaluación en el historial local.
 * Agrega el nuevo resultado al inicio del array.
 */
export function saveResultToLocalHistory(result: ResultadoDetallado): void {
    try {
        const currentHistoryStr = localStorage.getItem(STORAGE_KEY)
        let history: ResultadoDetallado[] = []

        if (currentHistoryStr) {
            try {
                history = JSON.parse(currentHistoryStr)
            } catch (e) {
                console.error("Error parsing local history:", e)
                history = []
            }
        }

        // Agregar al inicio (más reciente primero)
        // Verificar si ya existe (por ID) para evitar duplicados si se recarga
        const existsIndex = history.findIndex(h => h.autoevaluacion.id_autoevaluacion === result.autoevaluacion.id_autoevaluacion)

        if (existsIndex >= 0) {
            // Actualizar existente
            history[existsIndex] = result
        } else {
            // Agregar nuevo
            history.unshift(result)
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
        console.error("Error saving to local history:", error)
    }
}

/**
 * Obtiene el último resultado de autoevaluación almacenado localmente.
 * Retorna null si no hay datos.
 */
export function getLatestResultFromLocal(): ResultadoDetallado | null {
    try {
        const historyStr = localStorage.getItem(STORAGE_KEY)
        if (!historyStr) return null

        const history: ResultadoDetallado[] = JSON.parse(historyStr)
        if (!Array.isArray(history) || history.length === 0) return null

        // Asumimos que está ordenado por fecha descendente (como lo guardamos)
        // Pero por seguridad, ordenamos por fecha
        return history.sort((a, b) =>
            new Date(b.autoevaluacion.fecha_inicio).getTime() - new Date(a.autoevaluacion.fecha_inicio).getTime()
        )[0]
    } catch (error) {
        console.error("Error retrieving latest result from local:", error)
        return null
    }
}

/**
 * Obtiene todo el historial almacenado localmente.
 */
export function getLocalHistory(): ResultadoDetallado[] {
    try {
        const historyStr = localStorage.getItem(STORAGE_KEY)
        if (!historyStr) return []

        const history: ResultadoDetallado[] = JSON.parse(historyStr)
        if (!Array.isArray(history)) return []

        return history.sort((a, b) =>
            new Date(b.autoevaluacion.fecha_inicio).getTime() - new Date(a.autoevaluacion.fecha_inicio).getTime()
        )
    } catch (error) {
        console.error("Error retrieving local history:", error)
        return []
    }
}
