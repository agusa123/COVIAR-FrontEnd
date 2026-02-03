"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ChevronDown,
    ChevronUp,
    TrendingUp,
    FileSpreadsheet,
    FileText,
    Calendar,
    Target,
    BarChart3,
    CheckCircle2,
    Gauge
} from "lucide-react"
import type { AutoevaluacionHistorial, ResultadoDetallado } from "@/lib/api/types"
import { determineSustainabilityLevel } from "@/lib/utils/scoring"
import { ChapterDetails } from "./chapter-details"
import {
    exportResultadoDetalladoToCSV,
    exportResultadoDetalladoToPDF
} from "@/lib/utils/export-utils"

interface EvaluationCardProps {
    evaluacion: AutoevaluacionHistorial
    resultado: ResultadoDetallado | null
    index: number
    total: number
    isLoading: boolean
    onLoadDetails: (id: number) => void
}

export function EvaluationCard({
    evaluacion,
    resultado,
    index,
    total,
    isLoading,
    onLoadDetails
}: EvaluationCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const isRecent = index === 0
    const evaluacionNumero = total - index
    const nivel = evaluacion.porcentaje !== null
        ? determineSustainabilityLevel(evaluacion.porcentaje)
        : null

    const handleToggleExpand = () => {
        if (!isExpanded && !resultado) {
            onLoadDetails(evaluacion.id_autoevaluacion)
        }
        setIsExpanded(!isExpanded)
    }

    const handleExportCSV = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (resultado) {
            exportResultadoDetalladoToCSV(resultado, `evaluacion_${evaluacion.id_autoevaluacion}`)
        }
    }

    const handleExportPDF = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (resultado) {
            exportResultadoDetalladoToPDF(resultado, 'Bodega', `evaluacion_${evaluacion.id_autoevaluacion}`)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Calcular indicadores respondidos basado en capítulos
    const indicadoresRespondidos = resultado?.capitulos.reduce(
        (acc, cap) => acc + cap.indicadores_completados, 0
    ) ?? null
    const indicadoresTotal = resultado?.capitulos.reduce(
        (acc, cap) => acc + cap.indicadores_total, 0
    ) ?? null

    return (
        <Card className="border-border/50 hover:border-border transition-colors">
            <CardContent className="p-6">
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                            Evaluación #{evaluacionNumero}
                        </h3>
                        {isRecent && (
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-xs">
                                Más reciente
                            </Badge>
                        )}
                    </div>
                    {nivel && (
                        <Badge
                            className="font-medium"
                            style={{
                                backgroundColor: `${nivel.color}15`,
                                color: nivel.color,
                                borderColor: `${nivel.color}30`
                            }}
                        >
                            {nivel.nombre}
                        </Badge>
                    )}
                </div>

                {/* Fecha */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Calendar className="h-4 w-4" />
                    {formatDate(evaluacion.fecha_inicio)}
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* Puntaje Total */}
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Target className="h-4 w-4" />
                            Puntaje Total
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {evaluacion.puntaje_final ?? '-'}
                            <span className="text-base font-normal text-muted-foreground">
                                {' '}/ {evaluacion.puntaje_maximo ?? '?'}
                            </span>
                        </div>
                    </div>

                    {/* Porcentaje Completado */}
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <BarChart3 className="h-4 w-4" />
                            Porcentaje Completado
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-2xl font-bold"
                                style={{ color: nivel?.color }}
                            >
                                {evaluacion.porcentaje ?? '-'}%
                            </span>
                            {evaluacion.porcentaje !== null && evaluacion.porcentaje >= 50 && (
                                <TrendingUp className="h-5 w-5 text-green-500" />
                            )}
                        </div>
                    </div>

                    {/* Indicadores Respondidos */}
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Indicadores Respondidos
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {indicadoresRespondidos ?? evaluacion.puntaje_final !== null ? '✓' : '-'}
                            {indicadoresTotal && (
                                <span className="text-base font-normal text-muted-foreground">
                                    {' '}/ {indicadoresTotal}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleExpand}
                        className="gap-2"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="h-4 w-4" />
                                Ocultar detalles
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4" />
                                Ver detalles por capítulo
                            </>
                        )}
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCSV}
                            disabled={!resultado}
                            className="gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPDF}
                            disabled={!resultado}
                            className="gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            PDF
                        </Button>
                    </div>
                </div>

                {/* Detalles expandidos */}
                {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className="ml-3 text-muted-foreground">Cargando detalles...</span>
                            </div>
                        ) : resultado?.capitulos ? (
                            <ChapterDetails capitulos={resultado.capitulos} />
                        ) : (
                            <p className="text-center text-muted-foreground py-4">
                                No hay datos detallados disponibles
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
