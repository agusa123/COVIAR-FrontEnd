"use client"

import { Home, ClipboardList, History, Settings, LogOut, User, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Usuario {
  cuenta: {
    id: number
    email: string
    tipo_cuenta: string
  }
  bodega: {
    id: number
    razon_social: string
    nombre_fantasia: string
    cuit: string
    calle: string
    numeracion: string
    telefono: string
    email_institucional: string
    localidad: {
      id: number
      nombre: string
      departamento: string
      provincia: string
    }
  }
  responsable: {
    id: number
    nombre: string
    apellido: string
    cargo: string
    dni: string
    activo: boolean
  }
}

const navigation = [
  { name: "Inicio", href: "/dashboard", icon: Home },
  { name: "Autoevaluación", href: "/dashboard/autoevaluacion", icon: ClipboardList },
  { name: "Historial", href: "/dashboard/historial", icon: History },
  { name: "Resultados", href: "/dashboard/resultados", icon: BarChart3 },
]

const bottomNavigation = [{ name: "Configuración", href: "/dashboard/configuracion", icon: Settings }]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario')
    if (usuarioStr) {
      try {
        const parsedUsuario = JSON.parse(usuarioStr)
        setUsuario(parsedUsuario)
      } catch (error) {
        console.error('Error al parsear usuario:', error)
      }
    }
  }, [])

  const handleLogout = async () => {
    // Importar dinámicamente para evitar problemas de SSR
    const { logoutUsuario } = await import('@/lib/api/auth')
    await logoutUsuario()

    // Redirigir a página de despedida
    router.push("/logout")
  }

  // Obtener iniciales del responsable
  const getInitials = () => {
    if (!usuario?.responsable) return "U"
    const nombre = usuario.responsable.nombre?.[0] || ""
    const apellido = usuario.responsable.apellido?.[0] || ""
    return (nombre + apellido).toUpperCase() || "U"
  }

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header con logo */}
      <div className="flex h-auto min-h-[120px] w-full items-center justify-center border-b border-sidebar-border bg-black py-4 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/logos/logoclarovert.png"
          alt="Coviar - Corporación Vitivinícola Argentina"
          className="w-full h-auto object-contain"
          style={{ maxWidth: "200px" }}
        />
      </div>

      {/* Sección de usuario */}
      {usuario && (
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            {/* Avatar con iniciales */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
              {getInitials()}
            </div>
            {/* Info del usuario */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {usuario.responsable?.nombre} {usuario.responsable?.apellido}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {usuario.responsable?.cargo}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {usuario.bodega?.nombre_fantasia}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navegación principal */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Navegación inferior */}
      <div className="border-t border-sidebar-border p-4 space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
