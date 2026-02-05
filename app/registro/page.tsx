"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { registrarBodega } from "@/lib/api/auth"
import {
  getProvincias,
  getDepartamentosPorProvincia,
  getLocalidadesPorDepartamento,
  type Provincia,
  type Departamento,
  type Localidad
} from "@/lib/api/ubicacion"

export default function RegistroPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Datos de Acceso (cuenta)
  const [emailLogin, setEmailLogin] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Datos de la Bodega
  const [nombreFantasia, setNombreFantasia] = useState("")
  const [emailInstitucional, setEmailInstitucional] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [cuit, setCuit] = useState("")
  const [invBod, setInvBod] = useState("")
  const [invVin, setInvVin] = useState("")
  const [telefono, setTelefono] = useState("")

  // Responsable
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [cargo, setCargo] = useState("")
  const [dni, setDni] = useState("")

  // Ubicación
  const [provinciaId, setProvinciaId] = useState<string>("")
  const [departamentoId, setDepartamentoId] = useState<string>("")
  const [localidadId, setLocalidadId] = useState<string>("")
  const [calle, setCalle] = useState("")
  const [numeracion, setNumeracion] = useState("")

  // Datos cargados de la API
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [localidades, setLocalidades] = useState<Localidad[]>([])
  const [loadingProvincias, setLoadingProvincias] = useState(true)
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false)
  const [loadingLocalidades, setLoadingLocalidades] = useState(false)

  // Cargar provincias al montar el componente (solo una vez)
  useEffect(() => {
    let isMounted = true

    async function cargarProvincias() {
      try {
        const data = await getProvincias()
        if (isMounted) {
          setProvincias(data)
        }
      } catch (err) {
        console.error("Error cargando provincias:", err)
      } finally {
        if (isMounted) {
          setLoadingProvincias(false)
        }
      }
    }

    cargarProvincias()

    return () => {
      isMounted = false
    }
  }, [])

  // Handler para cuando cambia la provincia - NO usar useEffect para esto
  const handleProvinciaChange = (value: string) => {
    setProvinciaId(value)
    // Limpiar selecciones dependientes
    setDepartamentoId("")
    setDepartamentos([])
    setLocalidadId("")
    setLocalidades([])

    if (value) {
      setLoadingDepartamentos(true)
      getDepartamentosPorProvincia(Number(value))
        .then((data) => {
          setDepartamentos(data)
        })
        .catch((err) => {
          console.error("Error cargando departamentos:", err)
          setDepartamentos([])
        })
        .finally(() => {
          setLoadingDepartamentos(false)
        })
    }
  }

  // Handler para cuando cambia el departamento - NO usar useEffect para esto
  const handleDepartamentoChange = (value: string) => {
    setDepartamentoId(value)
    // Limpiar selección dependiente
    setLocalidadId("")
    setLocalidades([])

    if (value) {
      setLoadingLocalidades(true)
      getLocalidadesPorDepartamento(Number(value))
        .then((data) => {
          setLocalidades(data)
        })
        .catch((err) => {
          console.error("Error cargando localidades:", err)
          setLocalidades([])
        })
        .finally(() => {
          setLoadingLocalidades(false)
        })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validar contraseñas
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      setIsLoading(false)
      return
    }

    if (!localidadId) {
      setError("Debe seleccionar una localidad")
      setIsLoading(false)
      return
    }

    // Validar formato INV (1 letra y 5 números) si hay valor
    const invRegex = /^[a-zA-Z]\d{5}$/
    if (invBod && !invRegex.test(invBod)) {
      setError("El N° Bodega INV debe tener 1 letra y 5 números (ej: A12345)")
      setIsLoading(false)
      return
    }

    if (invVin && !invRegex.test(invVin)) {
      setError("El N° de Viñedo INV debe tener 1 letra y 5 números (ej: B67890)")
      setIsLoading(false)
      return
    }

    try {
      // Construir el objeto de registro según el formato de la API
      const registroData = {
        bodega: {
          razon_social: razonSocial.trim(),
          nombre_fantasia: nombreFantasia.trim(),
          cuit: cuit.trim(),
          inv_bod: invBod.trim() || undefined,
          inv_vin: invVin.trim() || undefined,
          calle: calle.trim(),
          numeracion: numeracion.trim() || undefined,
          id_localidad: Number(localidadId),
          telefono: telefono.trim(),
          email_institucional: emailInstitucional.trim(),
        },
        cuenta: {
          email_login: emailLogin.trim(),
          password: password,
        },
        responsable: {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          cargo: cargo.trim(),
          dni: dni.trim() || undefined,
        },
      }

      await registrarBodega(registroData)
      router.push("/registro-exitoso")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al registrar la bodega")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 py-12 bg-gray-100">

      {/* Volver al inicio */}
      <Link href="/" className="absolute top-8 left-8 z-50 flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
        <div className="bg-white/10 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/20 transition-all">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        </div>
        <span className="font-medium text-sm drop-shadow-md">Volver al inicio</span>
      </Link>

      {/* Background from Landing */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/header-banner.png" alt="Viñedo" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-coviar-borravino/95 to-coviar-borravino/70 mix-blend-multiply"></div>
      </div>

      <Card className="relative z-10 w-full max-w-2xl overflow-hidden p-0 shadow-2xl border-0">
        <CardHeader className="bg-white border-b p-8">
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logos/logocolorhorz.png" alt="Coviar" className="h-20 object-contain" />
          </div>
          <CardTitle className="text-2xl text-center font-serif text-coviar-borravino font-bold">Registro de Bodega</CardTitle>
          <CardDescription className="text-gray-500 text-center">
            Complete el formulario para registrar su bodega en la plataforma de sostenibilidad
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Sección: Datos de Acceso */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-coviar-borravino border-b border-coviar-borravino/20 pb-2">
                Datos de Acceso
              </h3>

              <div className="space-y-2">
                <Label htmlFor="emailLogin">Mail <span className="text-red-500">*</span></Label>
                <Input
                  id="emailLogin"
                  type="email"
                  required
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Repetir contraseña <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita la contraseña"
                      className="pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Sección: Datos de la Bodega */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-coviar-borravino border-b border-coviar-borravino/20 pb-2">
                Datos de la Bodega
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombreFantasia">Nombre Fantasía <span className="text-red-500">*</span></Label>
                  <Input
                    id="nombreFantasia"
                    required
                    value={nombreFantasia}
                    onChange={(e) => setNombreFantasia(e.target.value)}
                    placeholder="Ej: Bodega Los Andes"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razonSocial">Razón Social <span className="text-red-500">*</span></Label>
                  <Input
                    id="razonSocial"
                    required
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Ej: Bodega Los Andes S.A."
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailInstitucional">Mail Institucional <span className="text-red-500">*</span></Label>
                  <Input
                    id="emailInstitucional"
                    type="email"
                    required
                    value={emailInstitucional}
                    onChange={(e) => setEmailInstitucional(e.target.value)}
                    placeholder="contacto@bodega.com"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono <span className="text-red-500">*</span></Label>
                  <Input
                    id="telefono"
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: 2614567890"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cuit">CUIT <span className="text-red-500">*</span></Label>
                  <Input
                    id="cuit"
                    required
                    value={cuit}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 11)
                      setCuit(value)
                    }}
                    placeholder="Ej: 20304050607"
                    maxLength={11}
                    inputMode="numeric"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invBod">N° Bodega INV</Label>
                  <Input
                    id="invBod"
                    value={invBod}
                    onChange={(e) => setInvBod(e.target.value)}
                    placeholder="Ej: A12345"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invVin">N° de Viñedo INV</Label>
                  <Input
                    id="invVin"
                    value={invVin}
                    onChange={(e) => setInvVin(e.target.value)}
                    placeholder="Ej: B67890"
                    className="h-11"
                  />
                </div>
              </div>
            </section>

            {/* Sección: Responsable */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-coviar-borravino border-b border-coviar-borravino/20 pb-2">
                Responsable
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                  <Input
                    id="nombre"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Juan"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido <span className="text-red-500">*</span></Label>
                  <Input
                    id="apellido"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Ej: Pérez"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo <span className="text-red-500">*</span></Label>
                  <Input
                    id="cargo"
                    required
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ej: Gerente General"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Ej: 12345678"
                    className="h-11"
                  />
                </div>
              </div>
            </section>

            {/* Sección: Ubicación */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-coviar-borravino border-b border-coviar-borravino/20 pb-2">
                Ubicación
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia <span className="text-red-500">*</span></Label>
                  <Select
                    value={provinciaId}
                    onValueChange={handleProvinciaChange}
                    disabled={loadingProvincias}
                  >
                    <SelectTrigger id="provincia" className="w-full h-11">
                      <SelectValue placeholder={loadingProvincias ? "Cargando..." : "Seleccione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {provincias.map((prov) => (
                        <SelectItem key={prov.id_provincia} value={prov.id_provincia.toString()}>
                          {prov.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento <span className="text-red-500">*</span></Label>
                  <Select
                    value={departamentoId}
                    onValueChange={handleDepartamentoChange}
                    disabled={!provinciaId || loadingDepartamentos}
                  >
                    <SelectTrigger id="departamento" className="w-full h-11">
                      <SelectValue
                        placeholder={
                          loadingDepartamentos
                            ? "Cargando..."
                            : provinciaId
                              ? "Seleccione"
                              : "Primero provincia"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dep) => (
                        <SelectItem key={dep.id_departamento} value={dep.id_departamento.toString()}>
                          {dep.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localidad">Localidad <span className="text-red-500">*</span></Label>
                  <Select
                    value={localidadId}
                    onValueChange={setLocalidadId}
                    disabled={!departamentoId || loadingLocalidades}
                  >
                    <SelectTrigger id="localidad" className="w-full h-11">
                      <SelectValue
                        placeholder={
                          loadingLocalidades
                            ? "Cargando..."
                            : departamentoId
                              ? "Seleccione"
                              : "Primero depto."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {localidades.map((loc) => (
                        <SelectItem key={loc.id_localidad} value={loc.id_localidad.toString()}>
                          {loc.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calle">Calle <span className="text-red-500">*</span></Label>
                  <Input
                    id="calle"
                    required
                    value={calle}
                    onChange={(e) => setCalle(e.target.value)}
                    placeholder="Ej: Av. San Martín"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeracion">Numeración</Label>
                  <Input
                    id="numeracion"
                    value={numeracion}
                    onChange={(e) => setNumeracion(e.target.value)}
                    placeholder="S/N si no tiene"
                    className="h-11"
                  />
                </div>
              </div>
            </section>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-coviar-borravino hover:bg-coviar-borravino-dark h-12 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Registrar Bodega"}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">O</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-center text-sm text-muted-foreground mb-3">¿Ya tienes una cuenta?</p>
              <Link href="/login" className="w-full block">
                <Button variant="outline" type="button" className="w-full border-coviar-borravino text-coviar-borravino hover:bg-coviar-borravino hover:text-white h-11 text-base font-medium transition-colors">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs z-10 p-4">
        &copy; {new Date().getFullYear()} Corporación Vitivinícola Argentina. Todos los derechos reservados.
      </div>
    </div>
  )
}