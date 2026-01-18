"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Autoevaluacion } from "@/lib/api/types"

export default function HistorialPage() {
  const [assessments, setAssessments] = useState<Autoevaluacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarHistorial() {
      try {
        // TODO: Cuando la API esté lista, descomentar esto:
        // const data = await obtenerAutoevaluaciones()
        // setAssessments(data)

        // Por ahora, mostrar vacío
        setAssessments([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el historial')
      } finally {
        setIsLoading(false)
      }
    }

    cargarHistorial()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Cargando historial...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Historial de Evaluaciones</h1>
        <p className="text-muted-foreground">Visualiza tus evaluaciones anteriores</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evaluaciones Realizadas</CardTitle>
          <CardDescription>Lista de todas tus autoevaluaciones</CardDescription>
        </CardHeader>
        <CardContent>
          {!assessments || assessments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tienes evaluaciones registradas todavía
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Puntaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell>
                      {new Date(assessment.fecha).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assessment.completada
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {assessment.completada ? "Completada" : "En Progreso"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {assessment.puntaje ? `${assessment.puntaje}%` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nota</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El historial de evaluaciones estará disponible una vez que la API esté completamente implementada.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
