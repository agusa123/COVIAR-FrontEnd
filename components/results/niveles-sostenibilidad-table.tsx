"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RANGOS_POR_SEGMENTO, type SegmentoTipo } from "@/lib/utils/scoring"

interface NivelesSostenibilidadTableProps {
    segmentoActual?: SegmentoTipo
    puntajeActual?: number
}

export function NivelesSostenibilidadTable({
    segmentoActual,
    puntajeActual
}: NivelesSostenibilidadTableProps) {
    const segmentos: { key: SegmentoTipo; nombre: string }[] = [
        { key: 'micro_bodega', nombre: 'Micro Bodega Turística/ Artesanal' },
        { key: 'pequena_bodega', nombre: 'Pequeña Bodega Turística' },
        { key: 'mediana_bodega', nombre: 'Mediana Bodega Turística' },
        { key: 'bodega', nombre: 'Bodega Turística' },
        { key: 'gran_bodega', nombre: 'Gran Bodega Turística' }
    ]

    // Determinar el nivel actual del puntaje para el segmento
    const getNivelActual = (segmento: SegmentoTipo): 'minimo' | 'medio' | 'alto' | null => {
        if (segmento !== segmentoActual || puntajeActual === undefined) return null
        const rangos = RANGOS_POR_SEGMENTO[segmento]
        if (puntajeActual >= rangos.alto.min) return 'alto'
        if (puntajeActual >= rangos.medio.min) return 'medio'
        if (puntajeActual >= rangos.minimo.min) return 'minimo'
        return null
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#880D1E] to-[#6a0a17] text-white">
                <CardTitle className="text-center text-xl">
                    Niveles de Sostenibilidad
                </CardTitle>
                <p className="text-center text-white/80 text-sm">
                    Guía de referencia de puntuación según segmento
                </p>
            </CardHeader>
            <CardContent className="p-0">
                {/* Badges de niveles */}
                <div className="flex justify-center gap-4 py-4 bg-muted/30 border-b">
                    <Badge
                        className="px-4 py-2 text-sm font-medium text-black"
                        style={{ backgroundColor: '#EAB308' }}
                    >
                        NIVEL MÍNIMO DE SOSTENIBILIDAD
                    </Badge>
                    <Badge
                        className="px-4 py-2 text-sm font-medium text-white"
                        style={{ backgroundColor: '#22C55E' }}
                    >
                        NIVEL MEDIO DE SOSTENIBILIDAD
                    </Badge>
                    <Badge
                        className="px-4 py-2 text-sm font-medium text-white"
                        style={{ backgroundColor: '#15803D' }}
                    >
                        NIVEL ALTO DE SOSTENIBILIDAD
                    </Badge>
                </div>

                {/* Tabla de rangos con Mínimo/Máximo */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            {/* Primera fila: headers de nivel */}
                            <tr className="border-b">
                                <th className="px-4 py-3 text-left font-semibold bg-muted/30" rowSpan={2}>
                                    SEGMENTO
                                </th>
                                <th
                                    className="px-4 py-2 text-center font-semibold border-l"
                                    colSpan={2}
                                    style={{ backgroundColor: '#EAB30820' }}
                                >
                                    Nivel mínimo de Sostenibilidad
                                </th>
                                <th
                                    className="px-4 py-2 text-center font-semibold border-l"
                                    colSpan={2}
                                    style={{ backgroundColor: '#22C55E20' }}
                                >
                                    Nivel medio de sostenibilidad
                                </th>
                                <th
                                    className="px-4 py-2 text-center font-semibold border-l"
                                    colSpan={2}
                                    style={{ backgroundColor: '#15803D20' }}
                                >
                                    Nivel alto de sostenibilidad
                                </th>
                            </tr>
                            {/* Segunda fila: Mínimo/Máximo */}
                            <tr className="border-b text-xs">
                                <th className="px-3 py-2 text-center border-l" style={{ backgroundColor: '#EAB30810' }}>Mínimo</th>
                                <th className="px-3 py-2 text-center" style={{ backgroundColor: '#EAB30810' }}>Máximo</th>
                                <th className="px-3 py-2 text-center border-l" style={{ backgroundColor: '#22C55E10' }}>Mínimo</th>
                                <th className="px-3 py-2 text-center" style={{ backgroundColor: '#22C55E10' }}>Máximo</th>
                                <th className="px-3 py-2 text-center border-l" style={{ backgroundColor: '#15803D10' }}>Mínimo</th>
                                <th className="px-3 py-2 text-center" style={{ backgroundColor: '#15803D10' }}>Máximo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {segmentos.map(({ key, nombre }) => {
                                const rangos = RANGOS_POR_SEGMENTO[key]
                                const isCurrentSegment = key === segmentoActual
                                const nivelActual = getNivelActual(key)

                                return (
                                    <tr
                                        key={key}
                                        className={`border-b hover:bg-muted/30 transition-colors ${isCurrentSegment ? 'bg-[#880D1E]/5' : ''
                                            }`}
                                    >
                                        <td className="px-4 py-3 font-medium italic text-blue-700">
                                            {nombre}
                                            {isCurrentSegment && (
                                                <Badge variant="outline" className="ml-2 text-xs">
                                                    Tu segmento
                                                </Badge>
                                            )}
                                        </td>
                                        {/* Nivel Mínimo */}
                                        <td
                                            className={`px-3 py-3 text-center border-l ${nivelActual === 'minimo' ? 'bg-yellow-200 font-bold' : ''
                                                }`}
                                        >
                                            {rangos.minimo.min}
                                        </td>
                                        <td
                                            className={`px-3 py-3 text-center ${nivelActual === 'minimo' ? 'bg-yellow-200 font-bold' : ''
                                                }`}
                                        >
                                            {rangos.minimo.max}
                                        </td>
                                        {/* Nivel Medio */}
                                        <td
                                            className={`px-3 py-3 text-center border-l ${nivelActual === 'medio' ? 'bg-green-200 font-bold' : ''
                                                }`}
                                        >
                                            {rangos.medio.min}
                                        </td>
                                        <td
                                            className={`px-3 py-3 text-center ${nivelActual === 'medio' ? 'bg-green-200 font-bold' : ''
                                                }`}
                                        >
                                            {rangos.medio.max}
                                        </td>
                                        {/* Nivel Alto */}
                                        <td
                                            className={`px-3 py-3 text-center border-l ${nivelActual === 'alto' ? 'bg-emerald-200 font-bold' : ''
                                                }`}
                                        >
                                            {rangos.alto.min}
                                        </td>
                                        <td
                                            className={`px-3 py-3 text-center ${nivelActual === 'alto' ? 'bg-emerald-200 font-bold' : ''
                                                }`}
                                        >
                                            {rangos.alto.max}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
