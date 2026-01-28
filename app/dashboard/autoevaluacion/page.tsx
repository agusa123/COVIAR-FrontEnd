"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, Check, Ban, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { obtenerEstructuraAutoevaluacion } from "@/lib/api/autoevaluacion"
import type { CapituloEstructura, IndicadorEstructura } from "@/lib/api/types"

export default function AutoevaluacionPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)

  // Estado para la estructura de la API
  const [estructura, setEstructura] = useState<CapituloEstructura[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Estado para navegación
  const [currentCapitulo, setCurrentCapitulo] = useState<CapituloEstructura | null>(null)
  const [currentIndicador, setCurrentIndicador] = useState<IndicadorEstructura | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [canFinalize, setCanFinalize] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  // Obtener usuario y ID de autoevaluación
  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario')

    if (!usuarioStr) {
      router.push("/login")
      return
    }

    try {
      const usuario = JSON.parse(usuarioStr)
      // Manejar diferentes formatos de ID de usuario del backend
      const userId = usuario.idUsuario ?? usuario.id_usuario ?? usuario.id
      if (userId) {
        setUserId(userId.toString())
      }

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

  // Cargar estructura cuando tengamos el ID de autoevaluación
  useEffect(() => {
    if (!assessmentId) return

    const cargarEstructura = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await obtenerEstructuraAutoevaluacion(assessmentId)
        setEstructura(response.capitulos)

        // Inicializar primer capítulo e indicador habilitado
        if (response.capitulos.length > 0) {
          const primerCapitulo = response.capitulos[0]
          setCurrentCapitulo(primerCapitulo)

          // Buscar el primer indicador habilitado
          const primerIndicadorHabilitado = primerCapitulo.indicadores.find(ind => ind.habilitado)
          if (primerIndicadorHabilitado) {
            setCurrentIndicador(primerIndicadorHabilitado)
          } else if (primerCapitulo.indicadores.length > 0) {
            setCurrentIndicador(primerCapitulo.indicadores[0])
          }
        }
      } catch (error) {
        console.error('Error al cargar estructura:', error)
        setLoadError(error instanceof Error ? error.message : 'Error al cargar la estructura')
      } finally {
        setIsLoading(false)
      }
    }

    cargarEstructura()
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

  const handleSelectIndicator = (capitulo: CapituloEstructura, indicador: IndicadorEstructura) => {
    // Solo permitir selección de indicadores habilitados
    if (!indicador.habilitado) return

    setCurrentCapitulo(capitulo)
    setCurrentIndicador(indicador)
    const key = `${capitulo.capitulo.id_capitulo}-${indicador.indicador.id_indicador}`
    setSelectedLevel(responses[key] ?? null)
  }

  const handleSaveResponse = async () => {
    if (!currentCapitulo || !currentIndicador || selectedLevel === null || !currentIndicador.habilitado) {
      return
    }

    setIsSaving(true)

    // TODO: Conectar con backend Go para guardar respuestas
    console.log('Guardando respuesta:', {
      userId,
      assessmentId,
      indicador: currentIndicador.indicador,
      nivelRespuesta: selectedLevel
    })

    // Guardar respuesta localmente por ahora
    const key = `${currentCapitulo.capitulo.id_capitulo}-${currentIndicador.indicador.id_indicador}`
    setResponses(prev => ({
      ...prev,
      [key]: selectedLevel
    }))

    setIsSaving(false)
  }

  const handleFinalizeAssessment = async () => {
    setIsFinalizing(true)

    // TODO: Enviar evaluación completa al backend
    console.log('Finalizando evaluación:', responses)

    alert('Evaluación guardada localmente. Próximamente se guardará en el servidor.')

    setIsFinalizing(false)
    router.push('/dashboard')
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

  if (!currentCapitulo || !currentIndicador) {
    return <div className="p-8">No hay datos disponibles</div>
  }

  const isResponseSaved = (capituloId: number, indicadorId: number) => {
    return `${capituloId}-${indicadorId}` in responses
  }

  // Verificar si es el último indicador habilitado
  const ultimoCapitulo = estructura[estructura.length - 1]
  const ultimosIndicadoresHabilitados = ultimoCapitulo?.indicadores.filter(ind => ind.habilitado) || []
  const ultimoIndicadorHabilitado = ultimosIndicadoresHabilitados[ultimosIndicadoresHabilitados.length - 1]
  const isLastIndicator =
    currentCapitulo.capitulo.id_capitulo === ultimoCapitulo?.capitulo.id_capitulo &&
    currentIndicador.indicador.id_indicador === ultimoIndicadorHabilitado?.indicador.id_indicador

  return (
    <div className="flex h-full">
      {/* Left sidebar with chapters and indicators */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b bg-primary">
          <h2 className="font-semibold text-primary-foreground">Capítulos e Indicadores</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-4 space-y-4">
            {estructura.map((capitulo) => (
              <div key={capitulo.capitulo.id_capitulo} className="space-y-2">
                <h3 className="font-semibold text-sm">{capitulo.capitulo.nombre}</h3>
                <div className="space-y-1">
                  {capitulo.indicadores.map((indicadorWrapper) => {
                    const isActive =
                      currentCapitulo.capitulo.id_capitulo === capitulo.capitulo.id_capitulo &&
                      currentIndicador.indicador.id_indicador === indicadorWrapper.indicador.id_indicador
                    const isSaved = isResponseSaved(capitulo.capitulo.id_capitulo, indicadorWrapper.indicador.id_indicador)
                    const isDisabled = !indicadorWrapper.habilitado

                    return (
                      <button
                        key={indicadorWrapper.indicador.id_indicador}
                        onClick={() => handleSelectIndicator(capitulo, indicadorWrapper)}
                        disabled={isDisabled}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${isDisabled
                          ? "opacity-50 cursor-not-allowed bg-muted/20 text-muted-foreground"
                          : isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          {isDisabled ? (
                            <Ban className="w-4 h-4 text-muted-foreground" />
                          ) : isSaved ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : null}
                          {indicadorWrapper.indicador.nombre}
                        </span>
                        {!isDisabled && <ChevronRight className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right content area */}
      <div className="flex-1 p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">
              {currentCapitulo.capitulo.nombre} - {currentIndicador.indicador.nombre}
            </CardTitle>
            <CardDescription className="text-balance">
              {currentIndicador.indicador.descripcion}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!currentIndicador.habilitado ? (
              <div className="p-6 bg-muted/30 rounded-lg border border-dashed text-center">
                <Ban className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground font-medium">Indicador no aplicable</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Este indicador no es pertinente para tu segmento.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <RadioGroup
                    value={selectedLevel?.toString()}
                    onValueChange={(v) => setSelectedLevel(Number.parseInt(v))}
                    className="space-y-4"
                  >
                    {currentIndicador.niveles_respuesta.map((nivel) => (
                      <div
                        key={nivel.id_nivel_respuesta}
                        onClick={() => setSelectedLevel(nivel.puntos)}
                        className={`p-4 border rounded-lg transition-colors cursor-pointer ${selectedLevel === nivel.puntos
                          ? "bg-primary/10 border-primary ring-2 ring-primary"
                          : "bg-muted/30 hover:bg-muted/50 hover:border-primary/50"
                          }`}
                      >
                        <RadioGroupItem
                          value={nivel.puntos.toString()}
                          id={`nivel-${nivel.id_nivel_respuesta}`}
                          className="sr-only"
                        />
                        <Label htmlFor={`nivel-${nivel.id_nivel_respuesta}`} className="cursor-pointer block">
                          <div className="font-semibold mb-2">{nivel.nombre}</div>
                          {nivel.descripcion && (
                            <div className="text-sm text-muted-foreground text-pretty">{nivel.descripcion}</div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Button
                  onClick={handleSaveResponse}
                  disabled={selectedLevel === null || isSaving}
                  className="w-full"
                >
                  {isSaving ? "Guardando..." : "Guardar y Continuar"}
                </Button>

                {isLastIndicator && canFinalize && (
                  <Button
                    onClick={handleFinalizeAssessment}
                    disabled={isFinalizing}
                    variant="default"
                    size="lg"
                    className="w-full bg-[#81242d] hover:bg-[#6D1A1A]"
                  >
                    {isFinalizing ? "Finalizando..." : "Finalizar Autoevaluación"}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
