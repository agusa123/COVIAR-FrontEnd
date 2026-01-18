"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { assessmentData } from "@/lib/assessment/assessment-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, Check } from "lucide-react"
import { useRouter } from "next/navigation"


type Chapter = (typeof assessmentData.chapters)[0]
type Indicator = Chapter["indicators"][0]

export default function AutoevaluacionPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [currentIndicator, setCurrentIndicator] = useState<Indicator | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [canFinalize, setCanFinalize] = useState(false)
  const [isFinalizng, setIsFinalizing] = useState(false)

  useEffect(() => {
  // Obtener usuario de localStorage
  const usuarioStr = localStorage.getItem('usuario')
  
  if (!usuarioStr) {
    router.push("/login")
    return
  }
  
  try {
    const usuario = JSON.parse(usuarioStr)
    setUserId(usuario.idUsuario.toString())
    
    // Inicializar primer capítulo
    if (assessmentData.chapters.length > 0) {
      setCurrentChapter(assessmentData.chapters[0])
      if (assessmentData.chapters[0].indicators.length > 0) {
        setCurrentIndicator(assessmentData.chapters[0].indicators[0])
      }
    }
    } catch (error) {
      console.error('Error al obtener usuario:', error)
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    const totalIndicators = assessmentData.chapters.reduce((acc, ch) => acc + ch.indicators.length, 0)
    const completedIndicators = Object.keys(responses).length
    setCanFinalize(completedIndicators === totalIndicators)
  }, [responses])

  const handleSelectIndicator = (chapter: Chapter, indicator: Indicator) => {
    setCurrentChapter(chapter)
    setCurrentIndicator(indicator)
    const key = `${chapter.number}-${indicator.number}`
    setSelectedLevel(responses[key] ?? null)
  }

  const handleSaveResponse = async () => {
      if (!currentChapter || !currentIndicator || selectedLevel === null) {
        return
      }

      setIsSaving(true)
    
      // TODO: Conectar con backend Go para guardar respuestas
      console.log('Guardando respuesta:', {
        userId,
        indicator: currentIndicator,
        level: selectedLevel
      })
      
      // Guardar respuesta localmente por ahora
      const key = `${currentChapter.number}-${currentIndicator.number}`
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


  if (!currentChapter || !currentIndicator) {
    return <div className="p-8">Cargando...</div>
  }

  const isResponseSaved = (chapterNum: number, indicatorNum: string) => {
    return `${chapterNum}-${indicatorNum}` in responses
  }

  const isLastIndicator =
    currentChapter.number === 14 &&
    currentIndicator.number === currentChapter.indicators[currentChapter.indicators.length - 1].number

  return (
    <div className="flex h-full">
      {/* Left sidebar with chapters and indicators */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b bg-primary">
          <h2 className="font-semibold text-primary-foreground">Capítulos e Indicadores</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-4 space-y-4">
            {assessmentData.chapters.map((chapter) => (
              <div key={chapter.number} className="space-y-2">
                <h3 className="font-semibold text-sm">{chapter.name}</h3>
                <div className="space-y-1">
                  {chapter.indicators.map((indicator) => {
                    const isActive =
                      currentChapter.number === chapter.number && currentIndicator.number === indicator.number
                    const isSaved = isResponseSaved(chapter.number, indicator.number)

                    return (
                      <button
                        key={indicator.number}
                        onClick={() => handleSelectIndicator(chapter, indicator)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSaved && <Check className="w-4 h-4 text-primary" />}
                          {indicator.number} - {indicator.name}
                        </span>
                        <ChevronRight className="w-4 h-4" />
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
              {currentChapter.name} - Indicador {currentIndicator.number}
            </CardTitle>
            <CardDescription className="text-balance">{currentIndicator.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <RadioGroup
                value={selectedLevel?.toString()}
                onValueChange={(v) => setSelectedLevel(Number.parseInt(v))}
                className="space-y-4"
              >
                {currentIndicator.levels.map((level) => (
                  <div
                    key={level.level}
                    onClick={() => setSelectedLevel(level.level)}
                    className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                      selectedLevel === level.level
                        ? "bg-primary/10 border-primary ring-2 ring-primary"
                        : "bg-muted/30 hover:bg-muted/50 hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={level.level.toString()} id={`level-${level.level}`} className="sr-only" />
                    <Label htmlFor={`level-${level.level}`} className="cursor-pointer block">
                      <div className="font-semibold mb-2">Nivel {level.level}</div>
                      <div className="text-sm text-muted-foreground text-pretty">{level.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button onClick={handleSaveResponse} disabled={selectedLevel === null || isSaving} className="w-full">
              {isSaving ? "Guardando..." : "Guardar y Continuar"}
            </Button>

            {isLastIndicator && canFinalize && (
              <Button
                onClick={handleFinalizeAssessment}
                disabled={isFinalizng}
                variant="default"
                size="lg"
                className="w-full bg-[#81242d] hover:bg-[#6D1A1A]"
              >
                {isFinalizng ? "Finalizando..." : "Finalizar Autoevaluación"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
