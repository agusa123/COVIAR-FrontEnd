"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { ResultadoCapitulo } from "@/lib/api/types"

interface ChapterBarChartProps {
    data: ResultadoCapitulo[]
    className?: string
}

export function ChapterBarChart({ data, className }: ChapterBarChartProps) {
    // Transformar datos para el gráfico
    // Usamos letras A, B, C... para el eje X para mantenerlo limpio
    const chartData = data.map((capitulo, index) => ({
        ...capitulo,
        letter: String.fromCharCode(65 + index), // A, B, C...
        fill: '#880D1E' // Color institucional
    }))

    return (
        <div className={`w-full ${className}`}>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="letter"
                            tick={{ fontSize: 14, fontWeight: 'bold', fill: '#374151' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload
                                    return (
                                        <div className="bg-background border border-border rounded-lg shadow-xl p-3 max-w-[250px] z-50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700">
                                                    {data.letter}
                                                </div>
                                                <p className="font-semibold text-sm leading-tight text-foreground">
                                                    {data.nombre}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground">Porcentaje:</span>
                                                    <span className="font-bold text-[#880D1E]">{data.porcentaje}%</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground">Puntaje:</span>
                                                    <span>{data.puntaje_obtenido} / {data.puntaje_maximo}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground">Indicadores:</span>
                                                    <span>{data.indicadores_completados} / {data.indicadores_total}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar
                            dataKey="porcentaje"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={60}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Referencias / Leyenda al pie */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                {chartData.map((item) => (
                    <div key={item.id_capitulo} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700 shrink-0 mt-0.5">
                            {item.letter}
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 text-xs leading-snug">
                            {item.nombre}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
