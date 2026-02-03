"use client"

import { ResponsiveContainer } from "recharts"
import type { ResultadoCapitulo } from "@/lib/api/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DotPlotChartProps {
    data: ResultadoCapitulo[]
    className?: string
}

export function DotPlotChart({ data, className }: DotPlotChartProps) {
    if (!data || data.length === 0) return null

    // Determine standard max scale (usually 100%)
    const maxScore = 100
    // Each dot represents 10%
    const dotValue = 10
    const maxDots = maxScore / dotValue

    return (
        <div className={`w-full overflow-x-auto ${className}`}>
            <div className="min-w-[500px] p-4">
                <div className="flex justify-between items-end h-[300px] border-b border-gray-200 pb-2 relative">

                    {/* Y-axis labels */}
                    {/* <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400">
                        <span>100%</span>
                        <span>50%</span>
                        <span>0%</span>
                    </div> */}

                    {data.map((capitulo, index) => {
                        const score = capitulo.porcentaje || 0
                        // Calculate dots: full dots for each 10%, maybe half dot?
                        // For simplicity and matching the "discrete" look of dot plots, we'll round to nearest dot
                        const dotsCount = Math.round(score / dotValue)

                        // Generate array of dots
                        const dots = Array.from({ length: dotsCount }).map((_, i) => i)

                        return (
                            <div key={capitulo.id_capitulo} className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="relative flex flex-col-reverse gap-1.5 h-full justify-end pb-2 w-full items-center">
                                    {/* Empty slots placeholders if needed to fix height -> Not strictly needed if using flex-col-reverse */}
                                    {/* Actually, user wants stacked dots at the bottom or top? Usually bottom up. */}

                                    {dots.map((dotIndex) => (
                                        <TooltipProvider key={dotIndex}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className="w-4 h-4 rounded-full bg-[#880D1E] hover:bg-[#a01224] transition-colors cursor-pointer"
                                                        style={{
                                                            boxShadow: '0 2px 4px rgba(136, 13, 30, 0.2)'
                                                        }}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{capitulo.nombre}: approx. {(dotIndex + 1) * dotValue}%</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}

                                    {/* If 0 score, maybe show a small dot or nothing? */}
                                    {score === 0 && (
                                        <div className="w-4 h-1 rounded-full bg-gray-200" />
                                    )}
                                </div>

                                {/* Labels */}
                                <div className="text-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 mx-auto mb-1 group-hover:bg-[#880D1E]/10 group-hover:text-[#880D1E] transition-colors">
                                        {String.fromCharCode(65 + index)} {/* A, B, C... */}
                                    </div>
                                    <span className="text-[10px] text-gray-500 line-clamp-2 max-w-[80px] leading-tight hidden sm:block">
                                        {capitulo.nombre}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Legend/Axis Description if needed */}
                <div className="flex justify-center gap-6 mt-6 flex-wrap">
                    {data.map((cap, i) => (
                        <div key={cap.id_capitulo} className="flex items-center gap-1.5 min-w-[120px]">
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700 shrink-0">
                                {String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-xs text-gray-600 truncate max-w-[150px]" title={cap.nombre}>
                                {cap.nombre}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
