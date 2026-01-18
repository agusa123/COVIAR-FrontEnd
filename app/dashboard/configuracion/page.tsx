"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { obtenerPerfil } from "@/lib/api/users" // TODO: Descomentar cuando la API esté lista
import type { Usuario } from "@/lib/api/types"

export default function ConfiguracionPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarPerfil() {
      try {
        // Intentar obtener perfil desde localStorage primero
        const usuarioStr = localStorage.getItem('usuario')
        if (usuarioStr) {
          const user = JSON.parse(usuarioStr) as Usuario
          setUsuario(user)
        }

        // TODO: Cuando la API esté lista, descomentar esto:
        // const perfil = await obtenerPerfil()
        // setUsuario(perfil)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el perfil')
      } finally {
        setIsLoading(false)
      }
    }

    cargarPerfil()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Cargando configuración...</p>
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

  if (!usuario) return null

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>Datos de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nombre</p>
            <p className="font-medium">{usuario.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Apellido</p>
            <p className="font-medium">{usuario.apellido}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{usuario.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rol</p>
            <p className="font-medium capitalize">{usuario.rol}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estado</p>
            <p className="font-medium">
              {usuario.activo ? (
                <span className="text-green-600">✓ Activo</span>
              ) : (
                <span className="text-red-600">✗ Inactivo</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fecha de Registro</p>
            <p className="font-medium">
              {new Date(usuario.fecha_registro).toLocaleDateString('es-AR')}
            </p>
          </div>
          {usuario.ultimo_acceso && (
            <div>
              <p className="text-sm text-muted-foreground">Último Acceso</p>
              <p className="font-medium">
                {new Date(usuario.ultimo_acceso).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nota</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Las funciones de edición de perfil estarán disponibles una vez que la API esté completamente implementada.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
