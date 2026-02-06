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

  // Estado para errores de cada campo
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

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

  // Ubicacion
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

  // Funciones de validacion
  const validateEmail = (email: string): string => {
    if (!email.trim()) return "El email es requerido"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Ingrese un email valido"
    return ""
  }

  const validatePassword = (pass: string): string => {
    if (!pass) return "La contrasena es requerida"
    if (pass.length < 8) return "Minimo 8 caracteres"
    return ""
  }

  const validateConfirmPassword = (confirm: string, original: string): string => {
    if (!confirm) return "Confirme su contrasena"
    if (confirm !== original) return "Las contrasenas no coinciden"
    return ""
  }

  const validateRequired = (value: string, fieldName: string): string => {
    if (!value.trim()) return `${fieldName} es requerido`
    return ""
  }

  const validateCuit = (value: string): string => {
    if (!value.trim()) return "El CUIT es requerido"
    if (value.length !== 11) return "El CUIT debe tener 11 digitos"
    if (!/^\d+$/.test(value)) return "El CUIT solo debe contener numeros"
    return ""
  }

  const validateTelefono = (value: string): string => {
    if (!value.trim()) return "El telefono es requerido"
    if (!/^\d{7,15}$/.test(value.replace(/\s/g, ""))) return "Ingrese un telefono valido (7-15 digitos)"
    return ""
  }

  const validateInv = (value: string, fieldName: string): string => {
    if (!value.trim()) return "" // Campo opcional
    const invRegex = /^[a-zA-Z]\d{5}$/
    if (!invRegex.test(value)) return `${fieldName} debe tener 1 letra y 5 numeros (ej: A12345)`
    return ""
  }

  const validateDni = (value: string): string => {
    if (!value.trim()) return "El DNI es requerido"
    if (!/^\d{7,8}$/.test(value)) return "El DNI debe tener 7 u 8 digitos"
    return ""
  }

  const validateSelect = (value: string, fieldName: string): string => {
    if (!value) return `Seleccione ${fieldName}`
    return ""
  }

  // Validar un campo especifico
  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case "emailLogin":
        return validateEmail(value)
      case "password":
        return validatePassword(value)
      case "confirmPassword":
        return validateConfirmPassword(value, password)
      case "nombreFantasia":
        return validateRequired(value, "El nombre de fantasia")
      case "razonSocial":
        return validateRequired(value, "La razon social")
      case "emailInstitucional":
        return validateEmail(value)
      case "cuit":
        return validateCuit(value)
      case "telefono":
        return validateTelefono(value)
      case "invBod":
        return validateInv(value, "N Bodega INV")
      case "invVin":
        return validateInv(value, "N Vinedo INV")
      case "nombre":
        return validateRequired(value, "El nombre")
      case "apellido":
        return validateRequired(value, "El apellido")
      case "cargo":
        return validateRequired(value, "El cargo")
      case "dni":
        return validateDni(value)
      case "provinciaId":
        return validateSelect(value, "una provincia")
      case "departamentoId":
        return validateSelect(value, "un departamento")
      case "localidadId":
        return validateSelect(value, "una localidad")
      case "calle":
        return validateRequired(value, "La calle")
      default:
        return ""
    }
  }

  // Handler para onBlur - marca el campo como tocado y valida
  const handleBlur = (fieldName: string, value: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    const error = validateField(fieldName, value)
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }))
  }

  // Handler para onChange - solo actualiza el valor, sin validar en cada tecla
  const handleFieldChange = (fieldName: string, value: string, setter: (v: string) => void) => {
    setter(value)
    // Limpiar error si el campo ya estaba en error y el usuario esta corrigiendo
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: "" }))
    }
  }

  // Validar todos los campos
  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {}
    const allTouched: Record<string, boolean> = {}

    // Validar cada campo
    errors.emailLogin = validateEmail(emailLogin)
    errors.password = validatePassword(password)
    errors.confirmPassword = validateConfirmPassword(confirmPassword, password)
    errors.nombreFantasia = validateRequired(nombreFantasia, "El nombre de fantasia")
    errors.razonSocial = validateRequired(razonSocial, "La razon social")
    errors.emailInstitucional = validateEmail(emailInstitucional)
    errors.cuit = validateCuit(cuit)
    errors.telefono = validateTelefono(telefono)
    errors.invBod = validateInv(invBod, "N Bodega INV")
    errors.invVin = validateInv(invVin, "N Vinedo INV")
    errors.nombre = validateRequired(nombre, "El nombre")
    errors.apellido = validateRequired(apellido, "El apellido")
    errors.cargo = validateRequired(cargo, "El cargo")
    errors.dni = validateDni(dni)
    errors.provinciaId = validateSelect(provinciaId, "una provincia")
    errors.departamentoId = validateSelect(departamentoId, "un departamento")
    errors.localidadId = validateSelect(localidadId, "una localidad")
    errors.calle = validateRequired(calle, "La calle")

    // Marcar todos como tocados
    Object.keys(errors).forEach(key => { allTouched[key] = true })

    setFieldErrors(errors)
    setTouched(allTouched)

    // Retornar si hay errores (excluyendo campos opcionales vacios)
    return !Object.values(errors).some(e => e !== "")
  }

  // Helper para clases de error en inputs
  const getInputErrorClass = (fieldName: string) => 
    touched[fieldName] && fieldErrors[fieldName] ? "border-red-500 focus-visible:ring-red-500" : ""

  // Helper para clases de error en labels
  const getLabelErrorClass = (fieldName: string) => 
    touched[fieldName] && fieldErrors[fieldName] ? "text-red-500" : ""

  // Funcion helper para renderizar mensaje de error
  const renderErrorMessage = (fieldName: string) => {
    if (!touched[fieldName] || !fieldErrors[fieldName]) return null
    return (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {fieldErrors[fieldName]}
      </p>
    )
  }

  // Cargar provincias al montar el componente
  useEffect(() => {
    let isMounted = true

    const cargarProvincias = async () => {
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
    // Limpiar seleccion dependiente
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
    setError(null)

    // Validar todos los campos
    const isValid = validateAllFields()
    if (!isValid) {
      setError("Por favor, corrija los errores en el formulario antes de continuar")
      return
    }

    setIsLoading(true)

    try {
      // Construir el objeto de registro segun el formato de la API
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
      setError(err instanceof Error ? err.message : "Ocurrio un error al registrar la bodega")
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
          <img src="/assets/header-banner.png" alt="Vinedo" className="w-full h-full object-cover" />
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

            {/* Seccion: Datos de Acceso */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-coviar-borravino border-b border-coviar-borravino/20 pb-2">
                Datos de Acceso
              </h3>

              <div className="space-y-2">
                <Label htmlFor="emailLogin" className={getLabelErrorClass("emailLogin")}>Mail <span className="text-red-500">*</span></Label>
                <Input
                  id="emailLogin"
                  type="email"
                  value={emailLogin}
                  onChange={(e) => handleFieldChange("emailLogin", e.target.value, setEmailLogin)}
                  onBlur={() => handleBlur("emailLogin", emailLogin)}
                  placeholder="correo@ejemplo.com"
                  className={`h-11 ${getInputErrorClass("emailLogin")}`}
                />
                {renderErrorMessage("emailLogin")}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className={touched.password && fieldErrors.password ? "text-red-500" : ""}>
                    Contrasena <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handleFieldChange("password", e.target.value, setPassword)}
                      onBlur={() => handleBlur("password", password)}
                      placeholder="Minimo 8 caracteres"
                      className={`pr-10 h-11 ${touched.password && fieldErrors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {touched.password && fieldErrors.password && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className={touched.confirmPassword && fieldErrors.confirmPassword ? "text-red-500" : ""}>
                    Repetir contrasena <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => handleFieldChange("confirmPassword", e.target.value, setConfirmPassword)}
                      onBlur={() => handleBlur("confirmPassword", confirmPassword)}
                      placeholder="Repita la contrasena"
                      className={`pr-10 h-11 ${touched.confirmPassword && fieldErrors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {touched.confirmPassword && fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Seccion: Datos de la Bodega */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-coviar-borravino border-b border-coviar-borravino/20 pb-2">
                Datos de la Bodega
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombreFantasia" className={getLabelErrorClass("nombreFantasia")}>Nombre Fantasia <span className="text-red-500">*</span></Label>
                  <Input
                    id="nombreFantasia"
                    value={nombreFantasia}
                    onChange={(e) => handleFieldChange("nombreFantasia", e.target.value, setNombreFantasia)}
                    onBlur={() => handleBlur("nombreFantasia", nombreFantasia)}
                    placeholder="Ej: Bodega Los Andes"
                    className={`h-11 ${getInputErrorClass("nombreFantasia")}`}
                  />
                  {renderErrorMessage("nombreFantasia")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razonSocial" className={getLabelErrorClass("razonSocial")}>Razon Social <span className="text-red-500">*</span></Label>
                  <Input
                    id="razonSocial"
                    value={razonSocial}
                    onChange={(e) => handleFieldChange("razonSocial", e.target.value, setRazonSocial)}
                    onBlur={() => handleBlur("razonSocial", razonSocial)}
                    placeholder="Ej: Bodega Los Andes S.A."
                    className={`h-11 ${getInputErrorClass("razonSocial")}`}
                  />
                  {renderErrorMessage("razonSocial")}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailInstitucional" className={getLabelErrorClass("emailInstitucional")}>Mail Institucional <span className="text-red-500">*</span></Label>
                  <Input
                    id="emailInstitucional"
                    type="email"
                    value={emailInstitucional}
                    onChange={(e) => handleFieldChange("emailInstitucional", e.target.value, setEmailInstitucional)}
                    onBlur={() => handleBlur("emailInstitucional", emailInstitucional)}
                    placeholder="contacto@bodega.com"
                    className={`h-11 ${getInputErrorClass("emailInstitucional")}`}
                  />
                  {renderErrorMessage("emailInstitucional")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono" className={getLabelErrorClass("telefono")}>Telefono <span className="text-red-500">*</span></Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => handleFieldChange("telefono", e.target.value, setTelefono)}
                    onBlur={() => handleBlur("telefono", telefono)}
                    placeholder="Ej: 2614567890"
                    className={`h-11 ${getInputErrorClass("telefono")}`}
                  />
                  {renderErrorMessage("telefono")}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cuit" className={getLabelErrorClass("cuit")}>CUIT <span className="text-red-500">*</span></Label>
                  <Input
                    id="cuit"
                    value={cuit}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 11)
                      handleFieldChange("cuit", value, setCuit)
                    }}
                    onBlur={() => handleBlur("cuit", cuit)}
                    placeholder="Ej: 20304050607"
                    maxLength={11}
                    inputMode="numeric"
                    className={`h-11 ${getInputErrorClass("cuit")}`}
                  />
                  {renderErrorMessage("cuit")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invBod" className={getLabelErrorClass("invBod")}>N Bodega INV</Label>
                  <Input
                    id="invBod"
                    value={invBod}
                    onChange={(e) => handleFieldChange("invBod", e.target.value, setInvBod)}
                    onBlur={() => handleBlur("invBod", invBod)}
                    placeholder="Ej: A12345"
                    className={`h-11 ${getInputErrorClass("invBod")}`}
                  />
                  {renderErrorMessage("invBod")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invVin" className={getLabelErrorClass("invVin")}>N de Vinedo INV</Label>
                  <Input
                    id="invVin"
                    value={invVin}
                    onChange={(e) => handleFieldChange("invVin", e.target.value, setInvVin)}
                    onBlur={() => handleBlur("invVin", invVin)}
                    placeholder="Ej: B67890"
                    className={`h-11 ${getInputErrorClass("invVin")}`}
                  />
                  {renderErrorMessage("invVin")}
                </div>
              </div>
            </section>

            {/* Seccion: Responsable */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-coviar-borravino border-b border-coviar-borravino/20 pb-2">
                Responsable
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className={getLabelErrorClass("nombre")}>Nombre <span className="text-red-500">*</span></Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => handleFieldChange("nombre", e.target.value, setNombre)}
                    onBlur={() => handleBlur("nombre", nombre)}
                    placeholder="Ej: Juan"
                    className={`h-11 ${getInputErrorClass("nombre")}`}
                  />
                  {renderErrorMessage("nombre")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido" className={getLabelErrorClass("apellido")}>Apellido <span className="text-red-500">*</span></Label>
                  <Input
                    id="apellido"
                    value={apellido}
                    onChange={(e) => handleFieldChange("apellido", e.target.value, setApellido)}
                    onBlur={() => handleBlur("apellido", apellido)}
                    placeholder="Ej: Perez"
                    className={`h-11 ${getInputErrorClass("apellido")}`}
                  />
                  {renderErrorMessage("apellido")}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cargo" className={getLabelErrorClass("cargo")}>Cargo <span className="text-red-500">*</span></Label>
                  <Input
                    id="cargo"
                    value={cargo}
                    onChange={(e) => handleFieldChange("cargo", e.target.value, setCargo)}
                    onBlur={() => handleBlur("cargo", cargo)}
                    placeholder="Ej: Gerente General"
                    className={`h-11 ${getInputErrorClass("cargo")}`}
                  />
                  {renderErrorMessage("cargo")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni" className={getLabelErrorClass("dni")}>DNI <span className="text-red-500">*</span></Label>
                  <Input
                    id="dni"
                    value={dni}
                    onChange={(e) => handleFieldChange("dni", e.target.value, setDni)}
                    onBlur={() => handleBlur("dni", dni)}
                    placeholder="Ej: 12345678"
                    className={`h-11 ${getInputErrorClass("dni")}`}
                  />
                  {renderErrorMessage("dni")}
                </div>
              </div>
            </section>

            {/* Seccion: Ubicacion */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-coviar-borravino border-b border-coviar-borravino/20 pb-2">
                Ubicacion
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provincia" className={getLabelErrorClass("provinciaId")}>Provincia <span className="text-red-500">*</span></Label>
                  <Select
                    value={provinciaId}
                    onValueChange={(value) => {
                      handleProvinciaChange(value)
                      setTouched(prev => ({ ...prev, provinciaId: true }))
                      setFieldErrors(prev => ({ ...prev, provinciaId: "" }))
                    }}
                    disabled={loadingProvincias}
                  >
                    <SelectTrigger id="provincia" className={`h-11 ${getInputErrorClass("provinciaId")}`}>
                      <SelectValue placeholder={loadingProvincias ? "Cargando..." : "Seleccione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {provincias.map((p) => (
                        <SelectItem key={p.id_provincia} value={p.id_provincia.toString()}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {renderErrorMessage("provinciaId")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departamento" className={getLabelErrorClass("departamentoId")}>Departamento <span className="text-red-500">*</span></Label>
                  <Select
                    value={departamentoId}
                    onValueChange={(value) => {
                      handleDepartamentoChange(value)
                      setTouched(prev => ({ ...prev, departamentoId: true }))
                      setFieldErrors(prev => ({ ...prev, departamentoId: "" }))
                    }}
                    disabled={!provinciaId || loadingDepartamentos}
                  >
                    <SelectTrigger id="departamento" className={`h-11 ${getInputErrorClass("departamentoId")}`}>
                      <SelectValue placeholder={
                        loadingDepartamentos
                          ? "Cargando..."
                          : provinciaId
                            ? "Seleccione"
                            : "Primero provincia"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((d) => (
                        <SelectItem key={d.id_departamento} value={d.id_departamento.toString()}>
                          {d.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {renderErrorMessage("departamentoId")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localidad" className={getLabelErrorClass("localidadId")}>Localidad <span className="text-red-500">*</span></Label>
                  <Select
                    value={localidadId}
                    onValueChange={(value) => {
                      setLocalidadId(value)
                      setTouched(prev => ({ ...prev, localidadId: true }))
                      setFieldErrors(prev => ({ ...prev, localidadId: "" }))
                    }}
                    disabled={!departamentoId || loadingLocalidades}
                  >
                    <SelectTrigger id="localidad" className={`h-11 ${getInputErrorClass("localidadId")}`}>
                      <SelectValue placeholder={
                        loadingLocalidades
                          ? "Cargando..."
                          : departamentoId
                            ? "Seleccione"
                            : "Primero depto."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {localidades.map((l) => (
                        <SelectItem key={l.id_localidad} value={l.id_localidad.toString()}>
                          {l.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {renderErrorMessage("localidadId")}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calle" className={getLabelErrorClass("calle")}>Calle <span className="text-red-500">*</span></Label>
                  <Input
                    id="calle"
                    value={calle}
                    onChange={(e) => handleFieldChange("calle", e.target.value, setCalle)}
                    onBlur={() => handleBlur("calle", calle)}
                    placeholder="Ej: Av. San Martin"
                    className={`h-11 ${getInputErrorClass("calle")}`}
                  />
                  {renderErrorMessage("calle")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeracion">Numeracion</Label>
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
              <div className="text-sm text-white bg-red-500 p-4 rounded-md flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
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
              <p className="text-center text-sm text-muted-foreground mb-3">Ya tienes una cuenta?</p>
              <Link href="/login" className="w-full block">
                <Button variant="outline" type="button" className="w-full border-coviar-borravino text-coviar-borravino hover:bg-coviar-borravino hover:text-white h-11 text-base font-medium transition-colors">
                  Iniciar Sesion
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs z-10 p-4">
        &copy; {new Date().getFullYear()} Corporacion Vitivinicola Argentina. Todos los derechos reservados.
      </div>
    </div>
  )
}
