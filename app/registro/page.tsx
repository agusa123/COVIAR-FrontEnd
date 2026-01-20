"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import Link from "next/link"
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

  // Cargar provincias al montar el componente
  useEffect(() => {
    async function cargarProvincias() {
      try {
        const data = await getProvincias()
        setProvincias(data)
      } catch (err) {
        console.error("Error cargando provincias:", err)
      } finally {
        setLoadingProvincias(false)
      }
    }
    cargarProvincias()
  }, [])

  // Cargar departamentos cuando cambia la provincia
  useEffect(() => {
    if (!provinciaId) {
      setDepartamentos([])
      setDepartamentoId("")
      setLocalidades([])
      setLocalidadId("")
      return
    }

    async function cargarDepartamentos() {
      setLoadingDepartamentos(true)
      setDepartamentoId("")
      setLocalidades([])
      setLocalidadId("")
      try {
        const data = await getDepartamentosPorProvincia(Number(provinciaId))
        setDepartamentos(data)
      } catch (err) {
        console.error("Error cargando departamentos:", err)
        setDepartamentos([])
      } finally {
        setLoadingDepartamentos(false)
      }
    }
    cargarDepartamentos()
  }, [provinciaId])

  // Cargar localidades cuando cambia el departamento
  useEffect(() => {
    if (!departamentoId) {
      setLocalidades([])
      setLocalidadId("")
      return
    }

    async function cargarLocalidades() {
      setLoadingLocalidades(true)
      setLocalidadId("")
      try {
        const data = await getLocalidadesPorDepartamento(Number(departamentoId))
        setLocalidades(data)
      } catch (err) {
        console.error("Error cargando localidades:", err)
        setLocalidades([])
      } finally {
        setLoadingLocalidades(false)
      }
    }
    cargarLocalidades()
  }, [departamentoId])

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
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#722F37] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[#722F37]">Coviar</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Corporación Vitivinícola Argentina</p>
        <h2 className="text-2xl font-semibold mt-4">Registro de Bodega – Perfil de la Bodega</h2>
        <p className="text-muted-foreground mt-2">Complete el formulario para registrar su bodega en la plataforma de sostenibilidad</p>
      </div>

      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Sección: Datos de Acceso */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-[#722F37] border-b border-[#722F37]/20 pb-2">
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña <span className="text-red-500">*</span></Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Repetir contraseña <span className="text-red-500">*</span></Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la contraseña"
                />
              </div>
            </section>

            {/* Sección: Datos de la Bodega */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-[#722F37] border-b border-[#722F37]/20 pb-2">
                Datos de la Bodega
              </h3>

              <div className="space-y-2">
                <Label htmlFor="nombreFantasia">Nombre Fantasía <span className="text-red-500">*</span></Label>
                <Input
                  id="nombreFantasia"
                  required
                  value={nombreFantasia}
                  onChange={(e) => setNombreFantasia(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailInstitucional">Mail Institucional <span className="text-red-500">*</span></Label>
                <Input
                  id="emailInstitucional"
                  type="email"
                  required
                  value={emailInstitucional}
                  onChange={(e) => setEmailInstitucional(e.target.value)}
                  placeholder="contacto@bodega.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón Social <span className="text-red-500">*</span></Label>
                <Input
                  id="razonSocial"
                  required
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuit">CUIT <span className="text-red-500">*</span></Label>
                <Input
                  id="cuit"
                  required
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invBod">N° Bodega INV</Label>
                <Input
                  id="invBod"
                  value={invBod}
                  onChange={(e) => setInvBod(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invVin">N° de Viñedo INV</Label>
                <Input
                  id="invVin"
                  value={invVin}
                  onChange={(e) => setInvVin(e.target.value)}
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
                />
              </div>
            </section>

            {/* Sección: Responsable */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-[#722F37] border-b border-[#722F37]/20 pb-2">
                Responsable
              </h3>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                <Input
                  id="nombre"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido <span className="text-red-500">*</span></Label>
                <Input
                  id="apellido"
                  required
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo <span className="text-red-500">*</span></Label>
                <Input
                  id="cargo"
                  required
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej: Gerente General"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>
            </section>

            {/* Sección: Ubicación */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-[#722F37] border-b border-[#722F37]/20 pb-2">
                Ubicación
              </h3>

              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia <span className="text-red-500">*</span></Label>
                <Select
                  value={provinciaId}
                  onValueChange={setProvinciaId}
                  disabled={loadingProvincias}
                >
                  <SelectTrigger id="provincia" className="w-full">
                    <SelectValue placeholder={loadingProvincias ? "Cargando provincias..." : "Seleccione provincia"} />
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
                  onValueChange={setDepartamentoId}
                  disabled={!provinciaId || loadingDepartamentos}
                >
                  <SelectTrigger id="departamento" className="w-full">
                    <SelectValue
                      placeholder={
                        loadingDepartamentos
                          ? "Cargando departamentos..."
                          : provinciaId
                            ? "Seleccione departamento"
                            : "Primero seleccione provincia"
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
                  <SelectTrigger id="localidad" className="w-full">
                    <SelectValue
                      placeholder={
                        loadingLocalidades
                          ? "Cargando localidades..."
                          : departamentoId
                            ? "Seleccione localidad"
                            : "Primero seleccione departamento"
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

              <div className="space-y-2">
                <Label htmlFor="calle">Calle <span className="text-red-500">*</span></Label>
                <Input
                  id="calle"
                  required
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeracion">Numeración</Label>
                <Input
                  id="numeracion"
                  value={numeracion}
                  onChange={(e) => setNumeracion(e.target.value)}
                  placeholder="S/N si no tiene"
                />
              </div>
            </section>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white py-6 text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Registrar Bodega"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-[#722F37] hover:underline font-medium">
                Inicia sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}