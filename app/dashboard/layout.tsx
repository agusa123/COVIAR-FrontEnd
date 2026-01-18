"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay usuario en localStorage
    const usuarioStr = localStorage.getItem('usuario')

    if (!usuarioStr) {
      // No hay usuario, redirigir a login
      console.log('No hay usuario en localStorage, redirigiendo a login')
      router.push("/login")
      return
    }

    try {
      const usuario = JSON.parse(usuarioStr)
      console.log('Usuario encontrado en localStorage:', usuario)

      // Verificar que el objeto tiene las propiedades necesarias
      // Ser más flexible: aceptar si tiene email (campo obligatorio)
      if (!usuario || !usuario.email) {
        console.log('Usuario inválido (sin email), limpiando localStorage')
        localStorage.removeItem('usuario')
        router.push("/login")
        return
      }

      console.log('Usuario válido, permitiendo acceso al dashboard')
      setIsLoading(false)
    } catch (error) {
      // Error al parsear, limpiar y redirigir
      console.error('Error al parsear usuario de localStorage:', error)
      localStorage.removeItem('usuario')
      router.push("/login")
    }
  }, [router])

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  )
}
