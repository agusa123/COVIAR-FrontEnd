"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle } from "lucide-react"
import type { ResultadoCapitulo } from "@/lib/api/types"

interface ChapterDetailsProps {
    capitulos: ResultadoCapitulo[]
}

export function ChapterDetails({ capitulos }: ChapterDetailsProps) {
    const getProgressColor = (porcentaje: number): string => {
        if (porcentaje >= 90) return 'bg-emerald-500'
        if (porcentaje >= 75) return 'bg-green-500'
        if (porcentaje >= 50) return 'bg-yellow-500'
        if (porcentaje >= 25) return 'bg-orange-500'
        return 'bg-red-500'
    }

    const getStatusBadge = (porcentaje: number) => {
        if (porcentaje >= 90) {
            return (
                <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">
                    Excelente
                </Badge>
            )
        }
        if (porcentaje >= 75) {
            return (
                <Badge className="bg-green-500/10 text-green-600 text-xs">
                    Muy Bueno
                </Badge>
            )
        }
        if (porcentaje >= 50) {
            return (
                <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">
                    En Progreso
                </Badge>
            )
        }
        return (
            <Badge className="bg-red-500/10 text-red-600 text-xs">
                Por Mejorar
            </Badge>
        )
    }

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Resultados por Capítulo
            </h4>

            <div className="grid gap-4">
                {capitulos.map((capitulo) => {
                    const isComplete = capitulo.indicadores_completados === capitulo.indicadores_total

                    return (
                        <div
                            key={capitulo.id_capitulo}
                            className="p-4 rounded-lg bg-muted/30 border border-border/50"
                        >
                            {/* Header del capítulo */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {isComplete ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className="font-medium">{capitulo.nombre}</span>
                                </div>
                                {getStatusBadge(capitulo.porcentaje)}
                            </div>

                            {/* Barra de progreso */}
                            <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Progreso</span>
                                    <span className="font-medium">{capitulo.porcentaje}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${getProgressColor(capitulo.porcentaje)}`}
                                        style={{ width: `${capitulo.porcentaje}%` }}
                                    />
                                </div>
                            </div>

                            {/* Métricas */}
                            <div className="flex gap-6 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Puntaje: </span>
                                    <span className="font-medium">
                                        {capitulo.puntaje_obtenido} / {capitulo.puntaje_maximo}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Indicadores: </span>
                                    <span className="font-medium">
                                        {capitulo.indicadores_completados} / {capitulo.indicadores_total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Resumen */}
            <div className="pt-4 border-t border-border/50">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Capítulos</span>
                    <span className="font-medium">{capitulos.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Capítulos Completados</span>
                    <span className="font-medium">
                        {capitulos.filter(c => c.indicadores_completados === c.indicadores_total).length} / {capitulos.length}
                    </span>
                </div>
            </div>
        </div>
    )
}
