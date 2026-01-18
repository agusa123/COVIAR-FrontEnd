"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Usuario } from "@/lib/api/types"

export default function DashboardPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    // Obtener usuario de localStorage
    const usuarioStr = localStorage.getItem('usuario')
    if (usuarioStr) {
      try {
        const user = JSON.parse(usuarioStr)
        setUsuario(user)
      } catch (error) {
        console.error('Error al parsear usuario:', error)
      }
    }
  }, [])

  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Bienvenido, {usuario.nombre} {usuario.apellido}
        </h1>
        <p className="text-muted-foreground">Panel de control de sostenibilidad enoturística COVIAR</p>
      </div>

      {/* Información del Usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre Completo</p>
              <p className="text-lg font-medium">{usuario.nombre} {usuario.apellido}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg font-medium">{usuario.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rol</p>
              <p className="text-lg font-medium capitalize">{usuario.rol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="text-lg font-medium">
                {usuario.activo ? (
                  <span className="text-green-600">✓ Activo</span>
                ) : (
                  <span className="text-red-600">✗ Inactivo</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Registro</p>
              <p className="text-lg font-medium">
                {new Date(usuario.fecha_registro).toLocaleDateString('es-AR')}
              </p>
            </div>
            {usuario.ultimo_acceso && (
              <div>
                <p className="text-sm text-muted-foreground">Último Acceso</p>
                <p className="text-lg font-medium">
                  {new Date(usuario.ultimo_acceso).toLocaleDateString('es-AR')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas de Acceso Rápido */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Autoevaluación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Completa la evaluación de sostenibilidad de tu bodega
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/autoevaluacion">
                Iniciar Evaluación
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Revisa tus evaluaciones anteriores
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/historial">
                Ver Historial
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gestiona tu cuenta y preferencias
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/configuracion">
                Configurar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Evaluaciones Completadas</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">0%</p>
              <p className="text-sm text-muted-foreground">Nivel de Sostenibilidad</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">Última Evaluación</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
