"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, Check, Ban, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  obtenerEstructuraAutoevaluacion,
  obtenerSegmentos,
  seleccionarSegmento,
  guardarRespuesta,
  completarAutoevaluacion
} from "@/lib/api/autoevaluacion"
import type { CapituloEstructura, IndicadorEstructura, Segmento } from "@/lib/api/types"
import { Users, Settings } from "lucide-react"

export default function AutoevaluacionPage() {
  const router = useRouter()
  const [assessmentId, setAssessmentId] = useState<string | null>(null)

  // Estado para la estructura de la API
  const [estructura, setEstructura] = useState<CapituloEstructura[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Estado para navegación
  const [currentCapitulo, setCurrentCapitulo] = useState<CapituloEstructura | null>(null)
  const [responses, setResponses] = useState<Record<string, number>>({})
  // const [isSaving, setIsSaving] = useState(false)
  const [canFinalize, setCanFinalize] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  // Estado para segmentos
  // Estado para segmentos - Empezamos seleccionando segmento por defecto
  const [isSelectingSegment, setIsSelectingSegment] = useState(true)
  const [segmentos, setSegmentos] = useState<Segmento[]>([])
  const [selectedSegment, setSelectedSegment] = useState<Segmento | null>(null)
  const [loadingSegmentos, setLoadingSegmentos] = useState(false)

  // Obtener usuario y ID de autoevaluación
  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario')

    if (!usuarioStr) {
      router.push("/login")
      return
    }

    try {
      JSON.parse(usuarioStr) // Validates that the user is logged in

      // Obtener el ID de autoevaluación desde localStorage o URL
      const storedAssessmentId = localStorage.getItem('id_autoevaluacion')
      if (storedAssessmentId) {
        setAssessmentId(storedAssessmentId)
      } else {
        // ID de prueba por ahora - TODO: obtener de flujo real
        setAssessmentId("1")
      }
    } catch (error) {
      console.error('Error al obtener usuario:', error)
      router.push("/login")
    }
  }, [router])

  // Cargar segmentos disponibles al iniciar
  useEffect(() => {
    if (!assessmentId) return

    const cargarSegmentosIniciales = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await obtenerSegmentos(assessmentId)
        setSegmentos(data)
        setIsSelectingSegment(true)
      } catch (error) {
        console.error('Error al cargar segmentos iniciales:', error)
        setLoadError(error instanceof Error ? error.message : 'Error al cargar segmentos')
      } finally {
        setIsLoading(false)
        setLoadingSegmentos(false)
      }
    }

    cargarSegmentosIniciales()
  }, [assessmentId])

  // Verificar si se puede finalizar
  useEffect(() => {
    if (estructura.length === 0) return

    // Contar solo indicadores habilitados
    const totalIndicadoresHabilitados = estructura.reduce(
      (acc, cap) => acc + cap.indicadores.filter(ind => ind.habilitado).length,
      0
    )
    const completedIndicators = Object.keys(responses).length
    setCanFinalize(completedIndicators === totalIndicadoresHabilitados && totalIndicadoresHabilitados > 0)
  }, [responses, estructura])

  // Manejar cambio de respuesta individual
  const handleResponseChange = async (indicador: IndicadorEstructura, newLevel: number, newNivelId: number) => {
    if (!assessmentId || !currentCapitulo) return

    // Optimistic update
    const key = `${currentCapitulo.capitulo.id_capitulo}-${indicador.indicador.id_indicador}`
    setResponses(prev => ({
      ...prev,
      [key]: newLevel
    }))

    try {
      await guardarRespuesta(assessmentId, indicador.indicador.id_indicador, newNivelId)
    } catch (error) {
      console.error('Error al guardar respuesta:', error)
      // Revertir optimistic update si falla (opcional, o mostrar error toast)
    }
  }

  // Navegación de Capítulos
  const cambiarCapitulo = (direction: 'next' | 'prev') => {
    if (!currentCapitulo) return
    const currentIndex = estructura.findIndex(c => c.capitulo.id_capitulo === currentCapitulo.capitulo.id_capitulo)
    if (currentIndex === -1) return

    if (direction === 'next' && currentIndex < estructura.length - 1) {
      setCurrentCapitulo(estructura[currentIndex + 1])
      window.scrollTo(0, 0)
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentCapitulo(estructura[currentIndex - 1])
      window.scrollTo(0, 0)
    }
  }





  const handleFinalizeAssessment = async () => {
    if (!assessmentId) return

    setIsFinalizing(true)

    try {
      await completarAutoevaluacion(assessmentId)
      alert('¡Autoevaluación completada exitosamente!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error al finalizar:', error)
      alert(error instanceof Error ? error.message : 'Error al finalizar la autoevaluación')
    } finally {
      setIsFinalizing(false)
    }
  }

  const handleOpenSegmentSelector = async () => {
    if (!assessmentId) return
    setIsSelectingSegment(true)
    setLoadingSegmentos(true)
    try {
      const data = await obtenerSegmentos(assessmentId)
      setSegmentos(data)
    } catch (error) {
      console.error('Error al cargar segmentos:', error)
      alert('Error al cargar segmentos disponibles')
      setIsSelectingSegment(false)
    } finally {
      setLoadingSegmentos(false)
    }
  }

  const handleSelectSegment = async (segmento: Segmento) => {
    if (!assessmentId) return

    // Si ya tenemos estructura cargada, confirmar cambio. Si no (primera vez), proceder directamente.
    if (estructura.length > 0) {
      if (!confirm(`¿Desea cambiar al segmento "${segmento.nombre}"? Esto recargará la estructura de la evaluación.`)) return
    }

    setIsLoading(true)
    try {
      await seleccionarSegmento(assessmentId, segmento.id_segmento)

      // Actualizar estado del segmento seleccionado
      setSelectedSegment(segmento)

      // Cargar estructura después de seleccionar segmento
      const response = await obtenerEstructuraAutoevaluacion(assessmentId)
      setEstructura(response.capitulos)

      // Inicializar selección
      if (response.capitulos.length > 0) {
        const primerCapitulo = response.capitulos[0]
        setCurrentCapitulo(primerCapitulo)
      }

      setIsSelectingSegment(false)
    } catch (error) {
      console.error('Error al procesar segmento:', error)
      alert(error instanceof Error ? error.message : 'Error al procesar el segmento')
    } finally {
      setIsLoading(false)
    }
  }

  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando estructura de autoevaluación...</p>
        </div>
      </div>
    )
  }

  // Estado de error
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error al cargar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{loadError}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Bypass de chequeo de datos si estamos seleccionando segmento
  if (!isSelectingSegment && !currentCapitulo) {
    return <div className="p-8">No hay datos disponibles</div>
  }

  const isResponseSaved = (capituloId: number, indicadorId: number) => {
    return `${capituloId}-${indicadorId}` in responses
  }



  return (
    <div className="flex h-full">


      {/* Right content area */}
      <div className="flex-1 p-8 space-y-6">
        {/* Progress Dashboard */}
        {!isSelectingSegment && estructura.length > 0 && (
          <div className="bg-zinc-900 text-white p-4 rounded-lg shadow-md flex items-center justify-between gap-6">
            <div className="flex gap-8">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-xs text-zinc-400 uppercase font-semibold">Categoría</div>
                  <div className="font-bold text-lg leading-tight">
                    {selectedSegment?.nombre.split(' ')[0] || "General"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenSegmentSelector}
                  className="text-zinc-400 hover:text-white hover:bg-white/10 h-8 w-8"
                  title="Cambiar Segmento"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              <div className="border-l border-zinc-700 pl-6">
                <div className="text-xs text-zinc-400 uppercase font-semibold">Indicadores a evaluar</div>
                <div className="font-bold text-lg leading-tight">
                  {estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).length, 0)}
                </div>
              </div>

              <div className="border-l border-zinc-700 pl-6">
                <div className="text-xs text-zinc-400 uppercase font-semibold">Puntuación máxima</div>
                <div className="font-bold text-lg leading-tight">
                  {estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).reduce((sum, ind) => {
                    const maxPuntos = Math.max(...ind.niveles_respuesta.map(n => n.puntos))
                    return sum + (isFinite(maxPuntos) ? maxPuntos : 0)
                  }, 0), 0)} puntos
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-xl">
              <div className="text-xs text-zinc-400 mb-2">Progreso general</div>
              <div className="h-2 w-full bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-yellow-400"
                  style={{ width: `${(Object.keys(responses).length / Math.max(1, estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).length, 0))) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-zinc-400 mt-1">
                <span>
                  {Object.keys(responses).length} de {estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).length, 0)} evaluados • {Object.values(responses).reduce((a, b) => a + b, 0)} / {estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).reduce((sum, ind) => {
                    const maxPuntos = Math.max(...ind.niveles_respuesta.map(n => n.puntos))
                    return sum + (isFinite(maxPuntos) ? maxPuntos : 0)
                  }, 0), 0)} puntos
                </span>
                <span>{Math.round((Object.keys(responses).length / Math.max(1, estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).length, 0))) * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Indicadores del Capítulo Actual */}
        {!isSelectingSegment && currentCapitulo && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">{currentCapitulo.capitulo.nombre}</h2>
              {currentCapitulo.capitulo.descripcion && (
                <p className="text-muted-foreground">{currentCapitulo.capitulo.descripcion}</p>
              )}
            </div>

            {currentCapitulo.indicadores.filter(i => i.habilitado).map((indicadorWrapper, index) => {
              const key = `${currentCapitulo.capitulo.id_capitulo}-${indicadorWrapper.indicador.id_indicador}`
              const savedValue = responses[key] // Returns points
              // Find saved nivel ID not directly possible from responses map which stores points only,
              // but we need points for UI selected state. 
              // Wait, handleResponseChange updates points in 'responses'.

              return (
                <Card key={indicadorWrapper.indicador.id_indicador} className="border-l-4 border-l-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-2">
                      <span className="bg-primary/10 text-primary text-sm font-bold px-2 py-1 rounded">
                        {index + 1}
                      </span>
                      {indicadorWrapper.indicador.nombre}
                    </CardTitle>
                    <CardDescription className="text-balance mt-2">
                      {indicadorWrapper.indicador.descripcion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={savedValue?.toString()}
                      onValueChange={(v) => {
                        const nivel = indicadorWrapper.niveles_respuesta.find(n => n.puntos.toString() === v)
                        if (nivel) {
                          handleResponseChange(indicadorWrapper, nivel.puntos, nivel.id_nivel_respuesta)
                        }
                      }}
                      className="space-y-3"
                    >
                      {indicadorWrapper.niveles_respuesta.map((nivel) => (
                        <div
                          key={nivel.id_nivel_respuesta}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${savedValue === nivel.puntos
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-muted/50"
                            }`}
                        >
                          <RadioGroupItem value={nivel.puntos.toString()} id={`ind-${indicadorWrapper.indicador.id_indicador}-lvl-${nivel.id_nivel_respuesta}`} className="mt-1" />
                          <Label htmlFor={`ind-${indicadorWrapper.indicador.id_indicador}-lvl-${nivel.id_nivel_respuesta}`} className="font-normal cursor-pointer w-full">
                            <div className="font-medium text-foreground">{nivel.nombre}</div>
                            {nivel.descripcion && (
                              <div className="text-sm text-muted-foreground mt-1 text-pretty">{nivel.descripcion}</div>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )
            })}

            {/* Navegación entre Capítulos */}
            <div className="flex justify-between items-center pt-8 border-t">
              <Button
                variant="outline"
                onClick={() => cambiarCapitulo('prev')}
                disabled={estructura.findIndex(c => c.capitulo.id_capitulo === currentCapitulo.capitulo.id_capitulo) === 0}
              >
                Anterior Capítulo
              </Button>

              {estructura.findIndex(c => c.capitulo.id_capitulo === currentCapitulo.capitulo.id_capitulo) === estructura.length - 1 ? (
                <Button
                  onClick={handleFinalizeAssessment}
                  disabled={!canFinalize || isFinalizing}
                  className="bg-[#81242d] hover:bg-[#6D1A1A]"
                >
                  {isFinalizing ? "Finalizando..." : "Finalizar Autoevaluación"}
                </Button>
              ) : (
                <Button onClick={() => cambiarCapitulo('next')}>
                  Siguiente Capítulo
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Placeholder para cuando se selecciona segmento y no hay card */}
        {isSelectingSegment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Seleccionar Segmento de Enoturismo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingSegmentos ? (
                <div className="text-center p-8">Cargando segmentos...</div>
              ) : (
                <div className="grid gap-4">
                  <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm mb-4">
                    Seleccione el segmento que mejor describa su bodega según la cantidad de turistas que recibe anualmente.
                  </div>
                  {segmentos.map((seg) => (
                    <Card
                      key={seg?.id_segmento ?? Math.random()}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-primary"
                      onClick={() => handleSelectSegment(seg)}
                    >
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">{seg?.nombre ?? 'Segmento'}</CardTitle>
                        <CardDescription>
                          {seg?.min_turistas != null && seg?.max_turistas != null
                            ? seg.min_turistas === 0 && seg.max_turistas === 999
                              ? "Menos de 1,000 turistas anuales"
                              : `${seg.min_turistas.toLocaleString()} - ${seg.max_turistas.toLocaleString()} turistas anuales`
                            : 'Información no disponible'}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                  {estructura.length > 0 && (
                    <Button variant="outline" onClick={() => setIsSelectingSegment(false)} className="mt-4">
                      Cancelar
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div >
  )
}
