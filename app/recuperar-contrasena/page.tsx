"use client"

import type React from "react"

import { useState } from "react"
import { solicitarRestablecimientoPassword } from "@/lib/api/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      await solicitarRestablecimientoPassword(email)
      setMessage("Se ha enviado un correo con instrucciones para recuperar tu contraseña")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al solicitar el restablecimiento")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-gray-100">

      {/* Volver al inicio */}
      <Link href="/" className="absolute top-8 left-8 z-50 flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
        <div className="bg-white/10 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/20 transition-all">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        </div>
        <span className="font-medium text-sm drop-shadow-md">Volver al inicio</span>
      </Link>

      {/* Background from Landing/Login */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/header-banner.png" alt="Viñedo" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-coviar-borravino/95 to-coviar-borravino/70 mix-blend-multiply"></div>
      </div>

      <Card className="relative z-10 w-full max-w-md overflow-hidden p-0 shadow-2xl border-0">
        <CardHeader className="bg-white border-b p-8">
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logos/logocolorhorz.png" alt="Coviar" className="h-20 object-contain" />
          </div>
          <CardTitle className="text-2xl text-center font-serif text-coviar-borravino font-bold">Recuperar Contraseña</CardTitle>
          <CardDescription className="text-gray-500 text-center">
            Ingresa tu email para recibir instrucciones
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

            {message && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200">{message}</div>}

            <Button type="submit" className="w-full bg-coviar-borravino hover:bg-coviar-borravino-dark h-11 text-base font-medium" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Instrucciones"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">O</span>
              </div>
            </div>

            <div className="text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-coviar-borravino transition-colors font-medium">
                Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs z-10 p-4">
        &copy; {new Date().getFullYear()} Corporación Vitivinícola Argentina. Todos los derechos reservados.
      </div>
    </div>
  )
}
