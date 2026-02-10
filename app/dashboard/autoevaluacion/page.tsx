"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, Check, Ban, AlertCircle, Users, Settings, CheckCircle2, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  crearAutoevaluacion,
  obtenerEstructuraAutoevaluacion,
  obtenerSegmentos,
  seleccionarSegmento,
  guardarRespuestas,
  completarAutoevaluacion,
  cancelarAutoevaluacion
} from "@/lib/api/autoevaluacion"
import type { CapituloEstructura, IndicadorEstructura, Segmento, ResultadoDetallado } from "@/lib/api/types"
import { calculateChapterScores, calculateChapterScoresWithResponses, determineLevelByScoreAndSegment } from "@/lib/utils/scoring"
import { saveResultToLocalHistory } from "@/lib/utils/storage-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SegmentConfirmationModal } from "@/components/autoevaluacion/segment-confirmation-modal"

export default function AutoevaluacionPage() {
  const router = useRouter()
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [idBodega, setIdBodega] = useState<number | null>(null)

  // Estado para la estructura de la API
  const [estructura, setEstructura] = useState<CapituloEstructura[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Estado para navegación
  const [currentCapitulo, setCurrentCapitulo] = useState<CapituloEstructura | null>(null)
  const [responses, setResponses] = useState<Record<string, number>>({}) // key: capId-indId, value: puntos (para UI)
  const [responsesForApi, setResponsesForApi] = useState<Record<number, number>>({}) // key: id_indicador, value: id_nivel_respuesta (para API)
  const [canFinalize, setCanFinalize] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [isSaving, setIsSaving] = useState(false) // Para rastrear si hay guardados pendientes
  const savingCount = useRef(0) // Contador de guardados en curso
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showPendingDialog, setShowPendingDialog] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  // Estado para segmentos
  const [isSelectingSegment, setIsSelectingSegment] = useState(true)
  const [segmentos, setSegmentos] = useState<Segmento[]>([])
  const [selectedSegment, setSelectedSegment] = useState<Segmento | null>(null)
  const [loadingSegmentos, setLoadingSegmentos] = useState(false)

  // Estado para el diálogo pendiente
  const [pendingInfo, setPendingInfo] = useState<{
    id: number
    fechaInicio: string
    tieneSegmento: boolean
    cantidadRespuestas: number
  } | null>(null)
  const [savedResponses, setSavedResponses] = useState<Array<{ id_indicador: number, id_nivel_respuesta: number }>>([])


  // Obtener usuario e id_bodega
  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario')

    if (!usuarioStr) {
      router.push("/login")
      return
    }

    try {
      const usuario = JSON.parse(usuarioStr)
      const bodegaId = usuario.bodega?.id_bodega || usuario.id_bodega

      if (!bodegaId) {
        setLoadError("No se encontró información de la bodega. Por favor, inicie sesión nuevamente.")
        setIsLoading(false)
        return
      }

      setIdBodega(bodegaId)
    } catch (error) {
      console.error('Error al obtener usuario:', error)
      router.push("/login")
    }
  }, [router])

  // Iniciar autoevaluación - usa la respuesta de la API para determinar qué hacer
  useEffect(() => {
    if (!idBodega) return

    const iniciarAutoevaluacion = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await crearAutoevaluacion(idBodega)
        const { httpStatus, data } = result
        const auto = data.autoevaluacion_pendiente
        const respuestasGuardadas = data.respuestas || []

        console.log('Respuesta crearAutoevaluacion:', { httpStatus, auto, respuestasGuardadas })

        const autoId = String(auto.id_autoevaluacion)
        setAssessmentId(autoId)

        // CASO 1: Nueva autoevaluación creada (201)
        if (httpStatus === 201) {
          console.log('CASO 1: Nueva autoevaluación creada')
          // Ir directo a selección de segmentos
          const segmentosData = await obtenerSegmentos(autoId)
          setSegmentos(segmentosData)
          setIsSelectingSegment(true)
          setIsLoading(false)
          return
        }

        // CASOS 2, 3, 4: Hay autoevaluación pendiente (200)
        if (httpStatus === 200) {
          // Guardar info para el diálogo
          setPendingInfo({
            id: auto.id_autoevaluacion,
            fechaInicio: auto.fecha_inicio,
            tieneSegmento: auto.id_segmento !== null,
            cantidadRespuestas: respuestasGuardadas.length
          })
          setSavedResponses(respuestasGuardadas)
          setShowPendingDialog(true)
          setIsLoading(false)
          return
        }

      } catch (error) {
        console.error('Error al iniciar autoevaluación:', error)
        setLoadError(error instanceof Error ? error.message : 'Error al crear la autoevaluación')
      } finally {
        setIsLoading(false)
      }
    }

    iniciarAutoevaluacion()
  }, [idBodega])

  // Manejar continuar con autoevaluación pendiente
  const handleContinuePending = async () => {
    if (!pendingInfo) return

    const autoId = String(pendingInfo.id)
    console.log('Continuando con autoevaluación pendiente:', autoId)

    setShowPendingDialog(false)
    setIsLoading(true)
    setAssessmentId(autoId)

    try {
      // CASO 2: Pendiente SIN segmento - ir a selección de segmentos
      if (!pendingInfo.tieneSegmento) {
        console.log('CASO 2: Pendiente sin segmento - mostrando selector')
        const segmentosData = await obtenerSegmentos(autoId)
        setSegmentos(segmentosData)
        setIsSelectingSegment(true)
        setIsLoading(false)
        return
      }

      // CASOS 3 y 4: Pendiente CON segmento - cargar estructura
      console.log('CASO 3/4: Pendiente con segmento - cargando estructura')
      const estructuraResponse = await obtenerEstructuraAutoevaluacion(autoId)

      if (estructuraResponse.capitulos && estructuraResponse.capitulos.length > 0) {
        // Filtrar capítulos que no tengan indicadores habilitados
        const capitulosFiltrados = estructuraResponse.capitulos.filter(cap =>
          cap.indicadores.some(ind => ind.habilitado)
        )

        setEstructura(capitulosFiltrados)
        if (capitulosFiltrados.length > 0) {
          setCurrentCapitulo(capitulosFiltrados[0])
        } else {
          // Manejar caso donde no hay ningún capítulo habilitado (raro pero posible)
          setEstructura([])
          setCurrentCapitulo(null)
        }


        // Si hay respuestas guardadas, pre-cargarlas
        if (savedResponses.length > 0) {
          const responsesMap: Record<string, number> = {}
          const apiResponsesMap: Record<number, number> = {}

          // Primero, eliminar duplicados de la API (tomar la última ocurrencia)
          const uniqueResponses = new Map<number, number>()
          savedResponses.forEach(r => {
            uniqueResponses.set(r.id_indicador, r.id_nivel_respuesta)
          })

          if (savedResponses.length !== uniqueResponses.size) {
            console.warn(`⚠️ API devolvió ${savedResponses.length} respuestas pero solo ${uniqueResponses.size} son únicas`)
          }

          // Buscar el nivel de puntos para cada respuesta guardada
          estructuraResponse.capitulos.forEach(cap => {
            cap.indicadores.forEach(ind => {
              const savedNivelId = uniqueResponses.get(ind.indicador.id_indicador)
              if (savedNivelId !== undefined) {
                // Guardar para API (id_indicador -> id_nivel_respuesta)
                apiResponsesMap[ind.indicador.id_indicador] = savedNivelId

                // Guardar para UI (puntos)
                const nivel = ind.niveles_respuesta.find(n => n.id_nivel_respuesta === savedNivelId)
                if (nivel) {
                  const key = `${cap.capitulo.id_capitulo}-${ind.indicador.id_indicador}`
                  responsesMap[key] = nivel.puntos
                }
              }
            })
          })
          setResponses(responsesMap)
          setResponsesForApi(apiResponsesMap)
          console.log(`✅ Cargadas ${Object.keys(apiResponsesMap).length} respuestas guardadas (únicas)`)
        }

        setIsSelectingSegment(false)
      }
    } catch (error) {
      console.error('Error al continuar autoevaluación:', error)
      setLoadError(error instanceof Error ? error.message : 'Error al cargar la autoevaluación pendiente')
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar cancelar autoevaluación pendiente y crear nueva
  const handleCancelPending = async () => {
    if (!pendingInfo || !idBodega) return

    const autoId = String(pendingInfo.id)
    console.log('Cancelando autoevaluación:', autoId)

    setShowPendingDialog(false)
    setIsLoading(true)

    try {
      // Llamar al endpoint para cancelar la autoevaluación pendiente
      await cancelarAutoevaluacion(autoId)
    } catch (error) {
      console.error('Error al cancelar autoevaluación:', error)
      // Continuar aunque falle el cancelar
    }

    // Limpiar info pendiente y recargar página para crear nueva
    setPendingInfo(null)
    setSavedResponses([])

    // Crear nueva autoevaluación
    try {
      const result = await crearAutoevaluacion(idBodega)
      const { data } = result
      const auto = data.autoevaluacion_pendiente
      const autoNewId = String(auto.id_autoevaluacion)

      setAssessmentId(autoNewId)
      const segmentosData = await obtenerSegmentos(autoNewId)
      setSegmentos(segmentosData)
      setIsSelectingSegment(true)
    } catch (error) {
      console.error('Error al crear nueva autoevaluación:', error)
      setLoadError(error instanceof Error ? error.message : 'Error al crear la autoevaluación')
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar si se puede finalizar
  useEffect(() => {
    if (estructura.length === 0) return

    const totalIndicadoresHabilitados = estructura.reduce(
      (acc, cap) => acc + cap.indicadores.filter(ind => ind.habilitado).length,
      0
    )
    const completedIndicators = Object.keys(responses).length
    setCanFinalize(completedIndicators === totalIndicadoresHabilitados && totalIndicadoresHabilitados > 0)
  }, [responses, estructura])

  // Manejar cambio de respuesta
  const handleResponseChange = async (indicador: IndicadorEstructura, newLevel: number, newNivelId: number) => {
    if (!assessmentId || !currentCapitulo) return

    const key = `${currentCapitulo.capitulo.id_capitulo}-${indicador.indicador.id_indicador}`

    // Actualizar estado para UI (puntos)
    setResponses(prev => ({
      ...prev,
      [key]: newLevel
    }))

    // Actualizar estado para API (id_indicador -> id_nivel_respuesta)
    const updatedApiResponses = {
      ...responsesForApi,
      [indicador.indicador.id_indicador]: newNivelId
    }
    setResponsesForApi(updatedApiResponses)

    // Convertir a array y enviar TODAS las respuestas
    const respuestasArray = Object.entries(updatedApiResponses).map(([idIndicador, idNivelRespuesta]) => ({
      id_indicador: parseInt(idIndicador),
      id_nivel_respuesta: idNivelRespuesta
    }))

    // Verificar que no haya duplicados (seguridad adicional)
    const indicadoresIds = respuestasArray.map(r => r.id_indicador)
    const hasDuplicates = indicadoresIds.length !== new Set(indicadoresIds).size
    if (hasDuplicates) {
      console.error('⚠️ ERROR: Respuestas duplicadas detectadas:', indicadoresIds)
      // No debería pasar nunca con un objeto, pero por seguridad
      return
    }

    console.log('=== GUARDANDO RESPUESTAS ===')
    console.log('Total a enviar:', respuestasArray.length)
    console.log('Respuestas:', respuestasArray)

    savingCount.current++
    setIsSaving(true)
    try {
      await guardarRespuestas(assessmentId, respuestasArray)
      console.log(`✅ Guardadas ${respuestasArray.length} respuestas exitosamente`)
    } catch (error) {
      console.error('❌ Error al guardar respuestas:', error)
    } finally {
      savingCount.current--
      if (savingCount.current === 0) {
        setIsSaving(false)
      }
    }
  }

  // Verificar si el capítulo actual está completo
  const isCurrentChapterComplete = (): boolean => {
    if (!currentCapitulo) return false

    const indicadoresHabilitados = currentCapitulo.indicadores.filter(ind => ind.habilitado)
    const indicadoresRespondidos = indicadoresHabilitados.filter(ind => {
      const key = `${currentCapitulo.capitulo.id_capitulo}-${ind.indicador.id_indicador}`
      return responses[key] !== undefined
    })

    return indicadoresRespondidos.length === indicadoresHabilitados.length
  }

  // Navegación de Capítulos
  const cambiarCapitulo = (direction: 'next' | 'prev') => {
    if (!currentCapitulo) return
    const currentIndex = estructura.findIndex(c => c.capitulo.id_capitulo === currentCapitulo.capitulo.id_capitulo)
    if (currentIndex === -1) return

    // Validar que el capítulo actual esté completo antes de avanzar
    if (direction === 'next') {
      if (!isCurrentChapterComplete()) {
        const indicadoresHabilitados = currentCapitulo.indicadores.filter(ind => ind.habilitado)
        const indicadoresRespondidos = indicadoresHabilitados.filter(ind => {
          const key = `${currentCapitulo.capitulo.id_capitulo}-${ind.indicador.id_indicador}`
          return responses[key] !== undefined
        })
        const faltantes = indicadoresHabilitados.length - indicadoresRespondidos.length
        alert(`Debes completar todos los indicadores de este capítulo antes de continuar.\n\nFaltan ${faltantes} indicador(es) por responder.`)
        return
      }

      if (currentIndex < estructura.length - 1) {
        setCurrentCapitulo(estructura[currentIndex + 1])
        window.scrollTo(0, 0)
      }
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentCapitulo(estructura[currentIndex - 1])
      window.scrollTo(0, 0)
    }
  }

  const handleFinalizeAssessment = async () => {
    if (!assessmentId) return
    setIsFinalizing(true)

    // Intentar llamar a la API, pero no bloquear si falla
    try {
      await completarAutoevaluacion(assessmentId)
    } catch (apiError) {
      console.warn('La API falló al finalizar, procediendo con guardado local:', apiError)
      // Continuamos flujo para guardar localmente
    }

    try {
      // Calcular el puntaje total locamente
      const totalScore = Object.values(responses).reduce((acc, puntos) => acc + puntos, 0)
      const maxScore = estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).reduce((sum, ind) => {
        const maxPuntos = Math.max(...ind.niveles_respuesta.map(n => n.puntos))
        return sum + (isFinite(maxPuntos) ? maxPuntos : 0)
      }, 0), 0)
      const porcentaje = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

      // Transformar respuestas para que usen solo el ID del indicador como key (requerido por scoring utils)
      const responsesForScoring: Record<number, number> = {}
      Object.entries(responses).forEach(([key, points]) => {
        // key formato: "capId-indId"
        const parts = key.split('-')
        if (parts.length === 2) {
          const indId = parseInt(parts[1])
          if (!isNaN(indId)) {
            responsesForScoring[indId] = points
          }
        }
      })

      // Construir objeto de resultado completo para historial
      const resultadoCompleto: ResultadoDetallado = {
        autoevaluacion: {
          id_autoevaluacion: parseInt(assessmentId),
          fecha_inicio: new Date().toISOString(), // Usamos fecha actual como referencia
          estado: 'completada',
          id_bodega: idBodega || 0,
          id_segmento: selectedSegment?.id_segmento || null,
          nombre_segmento: selectedSegment?.nombre, // Guardamos el nombre para determinar nivel
          puntaje_final: totalScore,
          puntaje_maximo: maxScore,
          porcentaje: porcentaje,
          id_nivel_sostenibilidad: null // Se podría calcular si fuera necesario
        },
        capitulos: calculateChapterScores(responsesForScoring, estructura)
      }

      // Guardar usando la utilidad centralizada
      saveResultToLocalHistory(resultadoCompleto)

      // Obtener datos del usuario para guardar bodega y responsable
      const usuarioStr = localStorage.getItem('usuario')
      const usuarioData = usuarioStr ? JSON.parse(usuarioStr) : null

      // Obtener el responsable activo desde la API (como en configuración)
      let nombreResponsable = 'N/A'
      const idCuenta = usuarioData?.id_cuenta
      if (idCuenta) {
        try {
          const responsablesResponse = await fetch(`/api/cuentas/${idCuenta}/responsables`, {
            credentials: 'include'
          })
          if (responsablesResponse.ok) {
            const responsables = await responsablesResponse.json()
            const responsableActivo = responsables.find((r: { activo: boolean }) => r.activo)
            if (responsableActivo) {
              nombreResponsable = `${responsableActivo.nombre || ''} ${responsableActivo.apellido || ''}`.trim() || 'N/A'
            }
          }
        } catch (e) {
          console.error('Error al obtener responsable:', e)
        }
      }

      // Mantener compatibilidad con otras vistas que puedan usar este formato específico anterior (opcional)
      const resultData = {
        assessmentId,
        puntaje_final: totalScore,
        puntaje_maximo: maxScore,
        porcentaje,
        fecha_completo: new Date().toISOString(),
        segmento: selectedSegment?.nombre || 'N/A',
        // Datos de bodega y responsable
        nombre_bodega: usuarioData?.bodega?.nombre_fantasia || usuarioData?.bodega?.razon_social || 'N/A',
        responsable: nombreResponsable
      }
      localStorage.setItem(`resultado_${assessmentId}`, JSON.stringify(resultData))

      // Calcular el nivel de sostenibilidad basado en puntaje y segmento
      const nivelCalculado = determineLevelByScoreAndSegment(totalScore, selectedSegment?.nombre)

      // Guardar como último resultado completado para la vista principal de resultados
      // Usamos calculateChapterScoresWithResponses para incluir los indicadores y respuestas detalladas
      const ultimoResultado = {
        ...resultData,
        capitulos: calculateChapterScoresWithResponses(responsesForScoring, estructura),
        nivel_sostenibilidad: nivelCalculado.nombre
      }
      localStorage.setItem('ultimo_resultado_completado', JSON.stringify(ultimoResultado))

      // Redirigir a la página de resultados principal
      router.push('/dashboard/resultados')
    } catch (error) {
      console.error('Error al finalizar:', error)
      alert(error instanceof Error ? error.message : 'Error al finalizar la autoevaluación')
      setIsFinalizing(false)
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
    const currentId = assessmentId || (pendingInfo ? String(pendingInfo.id) : null)
    if (!currentId) return
    if (estructura.length > 0) {
      if (!confirm(`¿Desea cambiar al segmento "${segmento.nombre}"? Esto recargará la estructura de la evaluación.`)) return
    }

    setIsLoading(true)
    try {
      await seleccionarSegmento(currentId, segmento.id_segmento)
      setSelectedSegment(segmento)
      setAssessmentId(currentId) // Asegurar que assessmentId esté seteado
      const response = await obtenerEstructuraAutoevaluacion(currentId)

      // Filtrar capítulos que no tengan indicadores habilitados
      const capitulosFiltrados = response.capitulos.filter(cap =>
        cap.indicadores.some(ind => ind.habilitado)
      )

      setEstructura(capitulosFiltrados)
      if (capitulosFiltrados.length > 0) {
        // Mostramos el modal y mantenemos isSelectingSegment=true para que se renderice el modal sobre la lista
        setShowConfirmationModal(true)
      } else {
        // Si no hay capítulos (raro), salimos de la selección
        setIsSelectingSegment(false)
      }
    } catch (error) {
      console.error('Error al procesar segmento:', error)
      alert(error instanceof Error ? error.message : 'Error al procesar el segmento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartFromModal = () => {
    setShowConfirmationModal(false)
    setIsSelectingSegment(false)
    if (estructura.length > 0) {
      setCurrentCapitulo(estructura[0])
    }
  }

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

  if (!isSelectingSegment && !currentCapitulo) {
    return <div className="p-8">No hay datos disponibles</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-8 space-y-6">
        {!isSelectingSegment && estructura.length > 0 && (
          <div className="bg-muted border border-[#880D1E] p-4 rounded-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 w-full md:w-auto">
              <div className="flex items-center gap-3 justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex-1 sm:flex-initial">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Categoría</div>
                  <div className="font-bold text-lg leading-tight text-foreground truncate">
                    {selectedSegment?.nombre.split(' ')[0] || "General"}
                  </div>
                </div>

              </div>

              <div className="flex gap-6 sm:border-l sm:border-border sm:pl-6 justify-between sm:justify-start overflow-x-auto pb-2 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <div className="whitespace-nowrap">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Indicadores</div>
                  <div className="font-bold text-lg leading-tight text-foreground">
                    {estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).length, 0)}
                  </div>
                </div>

                <div className="whitespace-nowrap border-l border-border pl-6">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Máx Puntos</div>
                  <div className="font-bold text-lg leading-tight text-foreground">
                    {estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).reduce((sum, ind) => {
                      const maxPuntos = Math.max(...ind.niveles_respuesta.map(n => n.puntos))
                      return sum + (isFinite(maxPuntos) ? maxPuntos : 0)
                    }, 0), 0)}
                  </div>
                </div>

                <div className="whitespace-nowrap border-l border-border pl-6">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Tu Puntaje</div>
                  <div className="font-bold text-lg leading-tight bg-gradient-to-r from-coviar-borravino to-coviar-red bg-clip-text text-transparent">
                    {Object.values(responses).reduce((acc, puntos) => acc + puntos, 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full md:max-w-xs lg:max-w-sm xl:max-w-md">
              <div className="text-xs text-muted-foreground mb-2 flex justify-between">
                <span>Progreso</span>
                <span>{Math.round((Object.keys(responses).length / Math.max(1, estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).length, 0))) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-coviar-borravino to-coviar-red transition-all duration-500 ease-out"
                  style={{ width: `${(Object.keys(responses).length / Math.max(1, estructura.reduce((acc, cap) => acc + cap.indicadores.filter(i => i.habilitado).length, 0))) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

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
              const savedValue = responses[key]

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
                      onValueChange={(v: string) => {
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
                            <span className="font-medium text-foreground whitespace-nowrap mr-2">{nivel.nombre}</span>
                            {nivel.descripcion && (
                              <span className="text-sm text-muted-foreground text-pretty">{nivel.descripcion}</span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )
            })}

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-8 border-t">
              <Button
                variant="outline"
                onClick={() => cambiarCapitulo('prev')}
                disabled={estructura.findIndex(c => c.capitulo.id_capitulo === currentCapitulo.capitulo.id_capitulo) === 0}
                className="w-full sm:w-auto"
              >
                Anterior Capítulo
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-white"
              >
                Guardar y Salir
              </Button>

              {estructura.findIndex(c => c.capitulo.id_capitulo === currentCapitulo.capitulo.id_capitulo) === estructura.length - 1 ? (
                <Button
                  onClick={handleFinalizeAssessment}
                  disabled={!canFinalize || isFinalizing || isSaving}
                  className="bg-coviar-borravino hover:bg-coviar-borravino-dark text-white w-full sm:w-auto"
                >
                  {isSaving ? "Guardando..." : isFinalizing ? "Finalizando..." : "Finalizar Autoevaluación"}
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {!isCurrentChapterComplete() && (
                    <span className="text-sm text-amber-600 flex items-center gap-1 order-2 sm:order-1 text-center sm:text-left">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Completa todos los indicadores
                    </span>
                  )}
                  <Button
                    onClick={() => cambiarCapitulo('next')}
                    disabled={!isCurrentChapterComplete()}
                    className={`${!isCurrentChapterComplete() ? "opacity-50" : ""} w-full sm:w-auto order-1 sm:order-2`}
                  >
                    Siguiente Capítulo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

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
                          {seg?.min_turistas != null
                            ? seg.max_turistas != null
                              ? `${seg.min_turistas.toLocaleString()} - ${seg.max_turistas.toLocaleString()} turistas anuales`
                              : `Desde ${seg.min_turistas.toLocaleString()} turistas anuales`
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

      {/* Diálogo de Autoevaluación Pendiente */}
      <Dialog open={showPendingDialog} onOpenChange={setShowPendingDialog}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 text-white">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <DialogTitle className="text-xl font-bold text-white">
                  Autoevaluación Pendiente
                </DialogTitle>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-6 py-5 space-y-4">
            {pendingInfo && (
              <div className="space-y-3">
                {/* Fecha de inicio */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-lg">📅</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fecha de inicio</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(pendingInfo.fechaInicio).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Estado del segmento/respuestas */}
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${!pendingInfo.tieneSegmento
                  ? 'bg-amber-50 border-amber-200'
                  : pendingInfo.cantidadRespuestas === 0
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-green-50 border-green-200'
                  }`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${!pendingInfo.tieneSegmento
                    ? 'bg-amber-100'
                    : pendingInfo.cantidadRespuestas === 0
                      ? 'bg-blue-100'
                      : 'bg-green-100'
                    }`}>
                    <span className="text-lg">
                      {!pendingInfo.tieneSegmento ? '⚠️' : pendingInfo.cantidadRespuestas === 0 ? '📊' : '📝'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Estado</p>
                    <p className={`text-sm font-semibold ${!pendingInfo.tieneSegmento
                      ? 'text-amber-700'
                      : pendingInfo.cantidadRespuestas === 0
                        ? 'text-blue-700'
                        : 'text-green-700'
                      }`}>
                      {!pendingInfo.tieneSegmento
                        ? 'Sin segmento seleccionado'
                        : pendingInfo.cantidadRespuestas === 0
                          ? 'Segmento seleccionado - Sin respuestas'
                          : `${pendingInfo.cantidadRespuestas} respuestas guardadas`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje informativo */}
            <p className="text-center text-sm text-gray-600 py-2">
              {!pendingInfo?.tieneSegmento
                ? "Para continuar, debes seleccionar un segmento."
                : pendingInfo.cantidadRespuestas > 0
                  ? "Tienes respuestas guardadas que se cargarán automáticamente."
                  : "Puedes continuar respondiendo el cuestionario."
              }
            </p>
          </div>

          {/* Footer con botones */}
          <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleCancelPending}
              className="order-2 sm:order-1 border-gray-300 bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900"
            >
              {pendingInfo?.cantidadRespuestas && pendingInfo.cantidadRespuestas > 0
                ? "Cancelar y Perder Respuestas"
                : "Cancelar y Crear Nueva"}
            </Button>
            <Button
              onClick={handleContinuePending}
              className="order-1 sm:order-2 bg-coviar-borravino hover:bg-coviar-borravino-dark text-white font-medium"
            >
              {!pendingInfo?.tieneSegmento
                ? "Seleccionar Segmento"
                : "Continuar Autoevaluación"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de segmento */}
      {selectedSegment && (
        <SegmentConfirmationModal
          isOpen={showConfirmationModal}
          onClose={handleStartFromModal}
          segmentName={selectedSegment.nombre}
          estructura={estructura}
        />
      )}
    </div>
  )
}
