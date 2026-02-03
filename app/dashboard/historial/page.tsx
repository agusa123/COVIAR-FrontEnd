"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileSpreadsheet, FileText, Plus, ClipboardList } from "lucide-react"
import { obtenerHistorialAutoevaluaciones, obtenerResultadosAutoevaluacion } from "@/lib/api/autoevaluacion"
import type { AutoevaluacionHistorial, ResultadoDetallado } from "@/lib/api/types"
import { EvaluationCard } from "@/components/historial/evaluation-card"
import { exportHistorialToCSV, exportHistorialToPDF } from "@/lib/utils/export-utils"
import { NivelesSostenibilidadTable } from "@/components/results/niveles-sostenibilidad-table"

export default function HistorialPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AutoevaluacionHistorial[]>([])
  const [resultadosCache, setResultadosCache] = useState<Record<number, ResultadoDetallado>>({})
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarHistorial() {
      try {
        // ==========================================
        // 1. INTENTAR CARGAR DE LOCALSTORAGE (PRIORIDAD)
        // ==========================================
        const historialLocalStr = localStorage.getItem('historial_local')
        if (historialLocalStr) {
          try {
            const historialLocal: ResultadoDetallado[] = JSON.parse(historialLocalStr)
            if (historialLocal.length > 0) {
              const assessmentsList = historialLocal.map(h => h.autoevaluacion)
              setAssessments(assessmentsList)

              // Pre-cargar cache con los resultados completos locales
              const newCache: Record<number, ResultadoDetallado> = {}
              historialLocal.forEach(h => {
                newCache[h.autoevaluacion.id_autoevaluacion] = h
              })
              setResultadosCache(newCache)

              setIsLoading(false)
              return
            }
          } catch (e) {
            console.error('Error al parsear historial local:', e)
          }
        }

        // ==========================================
        // 2. INTENTAR CARGAR DE API (FALLBACK)
        // ==========================================
        const usuarioStr = localStorage.getItem('usuario')

        if (!usuarioStr) {
          setError('No hay usuario autenticado')
          setIsLoading(false)
          return
        }

        const usuario = JSON.parse(usuarioStr)
        const idBodega = usuario.bodega?.id

        if (!idBodega) {
          // Si no hay idBodega, no cargamos nada más
          setIsLoading(false)
          return
        }

        // Cargar datos reales del backend
        const data = await obtenerHistorialAutoevaluaciones(idBodega)

        // Filtrar solo evaluaciones completadas y ordenar por fecha
        const completadas = data
          .filter(a => a.estado === 'completada')
          .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())

        setAssessments(completadas)

        // Pre-cargar resultados de la evaluación más reciente si hay API data
        if (completadas.length > 0) {
          const primera = completadas[0]
          try {
            const resultado = await obtenerResultadosAutoevaluacion(primera.id_autoevaluacion)
            setResultadosCache(prev => ({ ...prev, [primera.id_autoevaluacion]: resultado }))
          } catch (err) {
            console.warn('No se pudo pre-cargar resultados API:', err)
          }
        }
      } catch (err) {
        console.error('Error al cargar historial:', err)
        // No mostramos error bloqueante si falla la API, solo en consola
      } finally {
        setIsLoading(false)
      }
    }

    cargarHistorial()
  }, [])

  const handleLoadDetails = useCallback(async (idAutoevaluacion: number) => {
    // Si ya está en cache, no recargar
    if (resultadosCache[idAutoevaluacion]) return

    setLoadingDetails(idAutoevaluacion)
    try {
      const resultado = await obtenerResultadosAutoevaluacion(idAutoevaluacion)
      setResultadosCache(prev => ({ ...prev, [idAutoevaluacion]: resultado }))
    } catch (err) {
      console.error('Error al cargar detalles:', err)
    } finally {
      setLoadingDetails(null)
    }
  }, [resultadosCache])

  const handleExportAllCSV = () => {
    exportHistorialToCSV(assessments, 'historial_autoevaluaciones')
  }

  const handleExportAllPDF = () => {
    exportHistorialToPDF(assessments, 'Bodega', 'historial_autoevaluaciones')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando historial...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-destructive bg-destructive/10 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  // Estado vacío - sin evaluaciones completadas
  if (assessments.length === 0) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Historial de Autoevaluaciones</h1>
          <p className="text-muted-foreground mt-1">
            Registro de todas tus evaluaciones de sostenibilidad enoturística
          </p>
        </div>

        <Card className="text-center py-16">
          <CardContent>
            <ClipboardList className="h-20 w-20 text-[#880D1E]/30 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">¡Bienvenido/a!</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Realiza tu primera autoevaluación para comenzar a ver tu historial de sostenibilidad aquí.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-[#880D1E] hover:bg-[#6a0a17] gap-2"
            >
              <Link href="/dashboard/autoevaluacion">
                <Plus className="h-5 w-5" />
                Realizar Primera Autoevaluación
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Tabla de Niveles de Sostenibilidad - como referencia */}
        <NivelesSostenibilidadTable />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historial de Autoevaluaciones</h1>
          <p className="text-muted-foreground mt-1">
            Registro de todas tus evaluaciones de sostenibilidad enoturística
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportAllCSV}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Descargar Todo CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportAllPDF}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Descargar Todo PDF
          </Button>
        </div>
      </div>

      {/* Lista de evaluaciones */}
      <div className="space-y-6">
        {assessments.map((assessment, index) => (
          <EvaluationCard
            key={assessment.id_autoevaluacion}
            evaluacion={assessment}
            resultado={resultadosCache[assessment.id_autoevaluacion] || null}
            index={index}
            total={assessments.length}
            isLoading={loadingDetails === assessment.id_autoevaluacion}
            onLoadDetails={handleLoadDetails}
          />
        ))}
      </div>

      {/* Tabla de Niveles de Sostenibilidad */}
      <NivelesSostenibilidadTable
        puntajeActual={assessments[0]?.puntaje_final ?? undefined}
      />

      {/* Botón para nueva evaluación */}
      <div className="flex justify-center pt-4">
        <Button
          asChild
          size="lg"
          className="bg-[#880D1E] hover:bg-[#6a0a17] gap-2"
        >
          <Link href="/dashboard/autoevaluacion">
            <Plus className="h-5 w-5" />
            Nueva Autoevaluación
          </Link>
        </Button>
      </div>
    </div>
  )
}
