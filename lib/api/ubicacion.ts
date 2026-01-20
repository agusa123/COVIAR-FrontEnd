// lib/api/ubicacion.ts

/**
 * Tipos para ubicación
 */
export interface Provincia {
    id_provincia: number
    nombre: string
}

export interface Departamento {
    id_departamento: number
    nombre: string
    id_provincia: number
    nombre_provincia?: string
}

export interface Localidad {
    id_localidad: number
    nombre: string
    id_departamento?: number
}

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/**
 * Servicios de ubicación - Conectan con la API de ubicaciones
 */

/**
 * Obtiene todas las provincias de Argentina
 */
export async function getProvincias(): Promise<Provincia[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/provincias`)
    if (!response.ok) {
        throw new Error('Error al obtener provincias')
    }
    const data = await response.json()
    // Ordenar alfabéticamente
    return data.sort((a: Provincia, b: Provincia) => a.nombre.localeCompare(b.nombre))
}

/**
 * Obtiene los departamentos de una provincia específica
 * @param idProvincia - ID de la provincia
 */
export async function getDepartamentosPorProvincia(idProvincia: number): Promise<Departamento[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/departamentos?provincia=${idProvincia}`)
    if (!response.ok) {
        throw new Error('Error al obtener departamentos')
    }
    const data = await response.json()
    // Ordenar alfabéticamente
    return data.sort((a: Departamento, b: Departamento) => a.nombre.localeCompare(b.nombre))
}

/**
 * Obtiene las localidades de un departamento específico
 * @param idDepartamento - ID del departamento
 */
export async function getLocalidadesPorDepartamento(idDepartamento: number): Promise<Localidad[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/localidades?departamento=${idDepartamento}`)
    if (!response.ok) {
        throw new Error('Error al obtener localidades')
    }
    const data = await response.json()
    // Ordenar alfabéticamente
    return data.sort((a: Localidad, b: Localidad) => a.nombre.localeCompare(b.nombre))
}
