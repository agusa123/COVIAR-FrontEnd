# Arquitectura de la API - Guía Completa

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Explicación Detallada de Cada Archivo](#explicación-detallada-de-cada-archivo)
4. [Conceptos Técnicos](#conceptos-técnicos)
5. [Flujos Completos](#flujos-completos)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Visión General

Este proyecto utiliza una arquitectura cliente-servidor mediante API REST. La comunicación con el backend está completamente abstraída en el directorio `lib/api/`, lo que proporciona:

- ✅ **Centralización** - Todo el código de API en un solo lugar
- ✅ **Reutilización** - Funciones compartidas en toda la aplicación
- ✅ **Type Safety** - TypeScript garantiza tipos correctos
- ✅ **Mantenibilidad** - Cambios en un solo lugar afectan toda la app
- ✅ **Manejo de Errores** - Gestión centralizada de errores HTTP

---

## Estructura de Archivos

```
lib/
├── api/
│   ├── client.ts       → Motor HTTP base (fetch, errores, headers)
│   ├── types.ts        → Definiciones TypeScript (interfaces, tipos)
│   ├── auth.ts         → Servicios de autenticación
│   ├── users.ts        → Servicios de gestión de usuarios
│   └── index.ts        → Exportaciones centralizadas
├── hooks/
│   ├── useAuth.ts      → Hook React para autenticación
│   ├── useUser.ts      → Hook React para datos de usuario
│   └── index.ts        → Exportaciones centralizadas
└── utils/
    ├── storage.ts      → Manejo de localStorage
    ├── auth-utils.ts   → Utilidades de autenticación
    └── index.ts        → Exportaciones centralizadas
```

---

## Explicación Detallada de Cada Archivo

### 📄 `lib/api/client.ts` - El Cliente HTTP Base

**Propósito:** Es el **corazón** de toda la comunicación con el backend. Todas las peticiones HTTP pasan por aquí.

#### Función Principal: `apiRequest<T>()`

```typescript
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T>
```

**¿Qué hace?**
1. Construye la URL completa (`API_BASE_URL + endpoint`)
2. Prepara los headers (Content-Type, Authorization)
3. Ejecuta el `fetch()` con timeout (30 segundos)
4. Maneja errores HTTP (400, 401, 404, 500, etc.)
5. Parsea la respuesta JSON
6. Extrae automáticamente el campo `data` de `{ success: true, data: {...} }`
7. Devuelve los datos tipados

**Funciones Helper:**
```typescript
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}
```

**Características:**
- ✅ Inyección automática del token JWT (cuando `requiresAuth: true`)
- ✅ Timeout configurable (previene peticiones infinitas)
- ✅ Manejo de errores con `ApiClientError` personalizado
- ✅ Extracción automática del campo `data` de respuestas envueltas

---

### 📄 `lib/api/types.ts` - Definiciones TypeScript

**Propósito:** Contiene todos los **contratos de tipos** entre frontend y backend.

#### Interfaces Principales:

```typescript
// Estructura de un usuario
export interface Usuario {
  idUsuario: number
  email: string
  nombre: string
  apellido: string
  rol: string
  activo: boolean
  fecha_registro: string
  ultimo_acceso?: string | null
  password_hash?: string  // Solo viene del backend, nunca enviarlo
}

// Wrapper genérico para respuestas de la API
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// Petición de login
export interface LoginRequest {
  email: string
  password: string
}

// Respuesta de login (si incluye token)
export interface LoginResponse {
  usuario: Usuario
  token?: string
}

// Petición de registro
export interface RegistroRequest {
  email: string
  password: string
  nombre: string
  apellido: string
  rol: string
}

// Petición de actualización de perfil
export interface ActualizarPerfilRequest {
  nombre?: string
  apellido?: string
  email?: string
}

// Clase de error personalizada
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}
```

**Beneficios:**
- ✅ Autocompletado en el IDE
- ✅ Validación de tipos en tiempo de desarrollo
- ✅ Documentación implícita del contrato API
- ✅ Refactorización segura

---

### 📄 `lib/api/auth.ts` - Servicios de Autenticación

**Propósito:** Contiene todas las funciones relacionadas con **autenticación**.

#### Funciones Disponibles:

##### 1. `loginUsuario(data: LoginRequest): Promise<Usuario>`

```typescript
export async function loginUsuario(data: LoginRequest): Promise<Usuario> {
  console.log('API: Iniciando petición de login a /api/usuarios/verificar')
  console.log('API: Datos enviados:', { email: data.email })

  const response = await api.post<Usuario | LoginResponse>(
    '/api/usuarios/verificar',
    data
  )

  console.log('API: Respuesta recibida del servidor:', response)

  let usuario: Usuario

  // Maneja múltiples formatos de respuesta
  if ('usuario' in response) {
    usuario = response.usuario
    if (response.token) {
      localStorage.setItem('token', response.token)
    }
  } else {
    usuario = response as Usuario
  }

  console.log('API: Usuario procesado:', usuario)
  localStorage.setItem('usuario', JSON.stringify(usuario))

  return usuario
}
```

**Endpoint:** `POST /api/usuarios/verificar`
**Body:** `{ email: string, password: string }`
**Respuesta:** `{ success: true, data: { idUsuario, email, nombre, ... } }`

---

##### 2. `registrarUsuario(data: RegistroRequest): Promise<Usuario>`

```typescript
export async function registrarUsuario(data: RegistroRequest): Promise<Usuario> {
  console.log('API: Iniciando petición de registro a /api/usuarios')
  console.log('API: Datos enviados:', {
    email: data.email,
    nombre: data.nombre,
    apellido: data.apellido,
    rol: data.rol,
  })

  const usuario = await api.post<Usuario>('/api/usuarios', data)

  console.log('API: Usuario registrado exitosamente:', usuario)
  localStorage.setItem('usuario', JSON.stringify(usuario))

  return usuario
}
```

**Endpoint:** `POST /api/usuarios`
**Body:** `{ email, password, nombre, apellido, rol }`
**Respuesta:** `{ success: true, data: { idUsuario, email, ... } }`

---

##### 3. `logoutUsuario(): Promise<void>`

```typescript
export async function logoutUsuario(): Promise<void> {
  // Limpia toda la información de autenticación
  localStorage.removeItem('usuario')
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
}
```

**Acción:** Limpia el localStorage (no requiere petición al backend)

---

##### 4. `solicitarRestablecimientoPassword(email: string): Promise<void>`

```typescript
export async function solicitarRestablecimientoPassword(
  email: string
): Promise<void> {
  await api.post<void>('/api/usuarios/restablecer-password', { email })
}
```

**Endpoint:** `POST /api/usuarios/restablecer-password`
**Body:** `{ email: string }`

---

### 📄 `lib/api/users.ts` - Servicios de Gestión de Usuarios

**Propósito:** Funciones para **operaciones de perfil** (todas requieren autenticación).

#### Funciones Disponibles:

##### 1. `obtenerPerfil(): Promise<Usuario>`

```typescript
export async function obtenerPerfil(): Promise<Usuario> {
  return api.get<Usuario>('/api/usuarios/perfil', { requiresAuth: true })
}
```

**Endpoint:** `GET /api/usuarios/perfil`
**Headers:** `Authorization: Bearer <token>`
**Respuesta:** `{ success: true, data: { idUsuario, email, ... } }`

---

##### 2. `actualizarPerfil(data: ActualizarPerfilRequest): Promise<Usuario>`

```typescript
export async function actualizarPerfil(
  data: ActualizarPerfilRequest
): Promise<Usuario> {
  const usuario = await api.put<Usuario>('/api/usuarios/perfil', data, {
    requiresAuth: true,
  })

  // Actualiza localStorage con los nuevos datos
  localStorage.setItem('usuario', JSON.stringify(usuario))

  return usuario
}
```

**Endpoint:** `PUT /api/usuarios/perfil`
**Headers:** `Authorization: Bearer <token>`
**Body:** `{ nombre?, apellido?, email? }`
**Respuesta:** `{ success: true, data: { ...usuario actualizado } }`

---

##### 3. `cambiarPassword(data: CambiarPasswordRequest): Promise<void>`

```typescript
export async function cambiarPassword(
  data: CambiarPasswordRequest
): Promise<void> {
  await api.put<void>('/api/usuarios/password', data, {
    requiresAuth: true,
  })
}
```

**Endpoint:** `PUT /api/usuarios/password`
**Headers:** `Authorization: Bearer <token>`
**Body:** `{ passwordActual: string, passwordNuevo: string }`

---

##### 4. `eliminarCuenta(): Promise<void>`

```typescript
export async function eliminarCuenta(): Promise<void> {
  await api.delete<void>('/api/usuarios/perfil', {
    requiresAuth: true,
  })

  // Limpia localStorage después de eliminar
  await logoutUsuario()
}
```

**Endpoint:** `DELETE /api/usuarios/perfil`
**Headers:** `Authorization: Bearer <token>`

---

### 📄 `lib/api/index.ts` - Punto de Entrada

**Propósito:** **Barrel export** - Re-exporta todo desde un solo lugar para importaciones más limpias.

```typescript
// Re-exporta desde client.ts
export { api, apiRequest } from './client'

// Re-exporta desde types.ts
export type {
  Usuario,
  LoginRequest,
  LoginResponse,
  RegistroRequest,
  ActualizarPerfilRequest,
  CambiarPasswordRequest,
  ApiResponse,
  RequestOptions,
}
export { ApiClientError } from './types'

// Re-exporta desde auth.ts
export {
  loginUsuario,
  registrarUsuario,
  logoutUsuario,
  solicitarRestablecimientoPassword,
} from './auth'

// Re-exporta desde users.ts
export {
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  eliminarCuenta,
} from './users'
```

**Beneficio:**

```typescript
// ❌ Sin index.ts (importaciones largas)
import { loginUsuario } from '@/lib/api/auth'
import { obtenerPerfil } from '@/lib/api/users'
import { Usuario } from '@/lib/api/types'

// ✅ Con index.ts (importaciones limpias)
import { loginUsuario, obtenerPerfil, Usuario } from '@/lib/api'
```

---

## Conceptos Técnicos

### 🔷 Generics en TypeScript (`<T>`)

Un **generic** es como una "variable" para tipos. Permite que una función sea reutilizable con diferentes tipos de datos.

#### ¿Qué es `<T>`?

```typescript
function apiRequest<T>(endpoint: string): Promise<T> {
  // T es un placeholder para "cualquier tipo"
}
```

#### Analogía:
Imagina una caja que puede contener diferentes cosas:
- `Caja<Zapatos>` → Caja de zapatos
- `Caja<Libros>` → Caja de libros
- `Caja<Juguetes>` → Caja de juguetes

El `<T>` funciona igual: "esta función puede devolver diferentes tipos, especifica cuál cuando la uses".

#### Ejemplo Práctico:

```typescript
// Llamada 1: T = Usuario
const usuario = await apiRequest<Usuario>('/api/usuarios/1')
// TypeScript sabe que 'usuario' es de tipo Usuario
console.log(usuario.email)  // ✅ Autocompletado funciona

// Llamada 2: T = Historial[]
const historial = await apiRequest<Historial[]>('/api/historial')
// TypeScript sabe que 'historial' es un array de Historial
console.log(historial[0].fecha)  // ✅ Autocompletado funciona

// Llamada 3: T = void
await apiRequest<void>('/api/logout')
// No devuelve nada
```

#### ¿Por qué no usar un tipo fijo?

```typescript
// ❌ Sin genéricos (tendríamos que crear muchas funciones)
function apiRequestUsuario(endpoint: string): Promise<Usuario> { ... }
function apiRequestHistorial(endpoint: string): Promise<Historial[]> { ... }
function apiRequestPerfil(endpoint: string): Promise<Perfil> { ... }
// ¡Una función por cada tipo!

// ✅ Con genéricos (una sola función para todos)
function apiRequest<T>(endpoint: string): Promise<T> { ... }
```

#### Beneficios:
- ✅ **Reutilización** - Una función para múltiples tipos
- ✅ **Type Safety** - TypeScript verifica tipos correctos
- ✅ **Autocompletado** - El IDE sabe qué propiedades tiene cada tipo
- ✅ **Prevención de errores** - Errores en tiempo de desarrollo, no runtime

---

### 🔷 Promesas y Async/Await

Las peticiones HTTP son **asíncronas** (no bloquean la ejecución).

```typescript
// apiRequest devuelve una Promise
export async function apiRequest<T>(...): Promise<T> {
  const response = await fetch(url)  // Espera la respuesta
  const data = await response.json()  // Espera el parsing
  return data  // Devuelve el resultado
}

// En los componentes usamos await
const usuario = await loginUsuario({ email, password })
```

---

### 🔷 Extracción Automática de `data`

El backend siempre responde con esta estructura:

```json
{
  "success": true,
  "data": {
    "idUsuario": 12,
    "email": "user@example.com",
    ...
  }
}
```

El `client.ts` **automáticamente extrae** el campo `data`:

```typescript
// En client.ts (línea ~124)
const apiResponse = data as ApiResponse<T>
return apiResponse.data  // ← Devuelve solo el contenido de 'data'
```

Por eso en tus componentes solo recibes el objeto directo:

```typescript
// No recibes { success: true, data: {...} }
// Solo recibes { idUsuario: 12, email: "...", ... }
const usuario = await loginUsuario({ email, password })
console.log(usuario.idUsuario)  // ✅ Acceso directo
```

---

### 🔷 Inyección Automática del Token

Cuando usas `requiresAuth: true`, el cliente automáticamente:

```typescript
// En client.ts (línea ~93-96)
const token = localStorage.getItem('token')
if (requiresAuth && token) {
  requestHeaders.Authorization = `Bearer ${token}`
}
```

Esto significa que **no necesitas** agregar manualmente el token:

```typescript
// ❌ NO necesitas hacer esto
const token = localStorage.getItem('token')
fetch('/api/usuarios/perfil', {
  headers: { Authorization: `Bearer ${token}` }
})

// ✅ Solo haz esto
await obtenerPerfil()  // El token se agrega automáticamente
```

---

## Flujos Completos

### 🔄 Flujo de Login

```
┌─────────────────┐
│  app/login/     │
│  page.tsx       │
└────────┬────────┘
         │ 1. Usuario hace click en "Iniciar Sesión"
         │ handleLogin({ email, password })
         ↓
┌─────────────────┐
│  lib/api/       │
│  auth.ts        │ 2. loginUsuario(data)
└────────┬────────┘
         │ 3. api.post<Usuario>('/api/usuarios/verificar', data)
         ↓
┌─────────────────┐
│  lib/api/       │
│  client.ts      │ 4. apiRequest<Usuario>(endpoint, options)
└────────┬────────┘
         │ 5. fetch(url, { method: 'POST', body: JSON.stringify(data) })
         ↓
┌─────────────────┐
│  Backend API    │ 6. POST /api/usuarios/verificar
│  (Go/Java/etc)  │    Body: { email, password }
└────────┬────────┘
         │ 7. Responde: { success: true, data: { idUsuario, email, ... } }
         ↓
┌─────────────────┐
│  lib/api/       │
│  client.ts      │ 8. Extrae 'data' del response
└────────┬────────┘
         │ 9. Devuelve Usuario
         ↓
┌─────────────────┐
│  lib/api/       │
│  auth.ts        │ 10. localStorage.setItem('usuario', JSON.stringify(usuario))
└────────┬────────┘
         │ 11. Devuelve usuario
         ↓
┌─────────────────┐
│  app/login/     │
│  page.tsx       │ 12. router.push('/dashboard')
└─────────────────┘
```

---

### 🔄 Flujo de Obtener Perfil (con autenticación)

```
┌─────────────────┐
│  app/dashboard/ │
│  configuracion/ │
│  page.tsx       │
└────────┬────────┘
         │ 1. Usuario visita /dashboard/configuracion
         │ useEffect(() => { ... })
         ↓
┌─────────────────┐
│  lib/api/       │
│  users.ts       │ 2. obtenerPerfil()
└────────┬────────┘
         │ 3. api.get<Usuario>('/api/usuarios/perfil', { requiresAuth: true })
         ↓
┌─────────────────┐
│  lib/api/       │
│  client.ts      │ 4. apiRequest<Usuario>(endpoint, { requiresAuth: true })
│                 │ 5. Lee token de localStorage
│                 │ 6. Agrega header: Authorization: Bearer <token>
└────────┬────────┘
         │ 7. fetch(url, { method: 'GET', headers: { Authorization: ... } })
         ↓
┌─────────────────┐
│  Backend API    │ 8. GET /api/usuarios/perfil
│                 │    Headers: Authorization: Bearer <token>
└────────┬────────┘
         │ 9. Verifica token
         │ 10. Responde: { success: true, data: { idUsuario, email, ... } }
         ↓
┌─────────────────┐
│  lib/api/       │
│  client.ts      │ 11. Extrae 'data' del response
└────────┬────────┘
         │ 12. Devuelve Usuario
         ↓
┌─────────────────┐
│  lib/api/       │
│  users.ts       │ 13. Devuelve usuario
└────────┬────────┘
         │ 14. Devuelve usuario
         ↓
┌─────────────────┐
│  app/dashboard/ │
│  configuracion/ │
│  page.tsx       │ 15. setPerfil(usuario)
│                 │ 16. Renderiza formulario con datos
└─────────────────┘
```

---

### 🔄 Flujo de Manejo de Errores

```
┌─────────────────┐
│  Componente     │
│  (cualquiera)   │
└────────┬────────┘
         │ 1. try { await loginUsuario(...) }
         ↓
┌─────────────────┐
│  lib/api/       │
│  auth.ts        │ 2. await api.post(...)
└────────┬────────┘
         │ 3. await apiRequest(...)
         ↓
┌─────────────────┐
│  lib/api/       │
│  client.ts      │ 4. await fetch(...)
└────────┬────────┘
         │ 5. Response status: 401 Unauthorized
         ↓
┌─────────────────┐
│  lib/api/       │
│  client.ts      │ 6. if (!response.ok) {
│                 │      throw new ApiClientError(...)
│                 │    }
└────────┬────────┘
         │ 7. throw ApiClientError
         ↑
         │ (el error se propaga hacia arriba)
         ↓
┌─────────────────┐
│  Componente     │
│  (cualquiera)   │ 8. catch (error) {
│                 │      if (error instanceof ApiClientError) {
│                 │        // Muestra mensaje de error al usuario
│                 │        setError(error.message)
│                 │      }
│                 │    }
└─────────────────┘
```

---

## Ejemplos de Uso

### Ejemplo 1: Login en un Componente

```typescript
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUsuario, ApiClientError } from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Llama a la API
      const usuario = await loginUsuario({
        email: email.trim(),
        password: password.trim(),
      })

      console.log('Login exitoso:', usuario)

      // Redirige al dashboard
      router.push('/dashboard')
    } catch (err) {
      // Maneja errores
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          setError('Email o contraseña incorrectos')
        } else if (err.statusCode === 500) {
          setError('Error del servidor. Intenta más tarde.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error de conexión. Verifica tu internet.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
      </button>
    </form>
  )
}
```

---

### Ejemplo 2: Actualizar Perfil

```typescript
// app/dashboard/configuracion/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { obtenerPerfil, actualizarPerfil, Usuario, ApiClientError } from '@/lib/api'

export default function ConfiguracionPage() {
  const [perfil, setPerfil] = useState<Usuario | null>(null)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // Cargar perfil al montar el componente
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const data = await obtenerPerfil()
        setPerfil(data)
        setNombre(data.nombre)
        setApellido(data.apellido)
      } catch (err) {
        console.error('Error al cargar perfil:', err)
      } finally {
        setIsLoading(false)
      }
    }

    cargarPerfil()
  }, [])

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensaje('')
    setIsSaving(true)

    try {
      const perfilActualizado = await actualizarPerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
      })

      setPerfil(perfilActualizado)
      setMensaje('Perfil actualizado correctamente')
    } catch (err) {
      if (err instanceof ApiClientError) {
        setMensaje(`Error: ${err.message}`)
      } else {
        setMensaje('Error al actualizar perfil')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div>Cargando...</div>
  }

  return (
    <form onSubmit={handleGuardar}>
      <h1>Configuración de Perfil</h1>

      <div>
        <label>Email:</label>
        <p>{perfil?.email}</p>
      </div>

      <div>
        <label>Nombre:</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Apellido:</label>
        <input
          type="text"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
        />
      </div>

      {mensaje && <p>{mensaje}</p>}

      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  )
}
```

---

### Ejemplo 3: Usar el Hook useAuth

```typescript
// app/dashboard/layout.tsx
'use client'

import { useAuth } from '@/lib/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { usuario, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = async () => {
    await logout()
    // logout() ya hace router.push('/login')
  }

  if (isLoading) {
    return <div>Cargando...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div>
      <header>
        <h1>Bienvenido, {usuario?.nombre}!</h1>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </header>
      <main>{children}</main>
    </div>
  )
}
```

---

### Ejemplo 4: Llamadas en Paralelo

```typescript
// Ejemplo: cargar múltiples datos a la vez
async function cargarDatosDashboard() {
  try {
    // Ejecuta ambas peticiones en paralelo
    const [perfil, historial] = await Promise.all([
      obtenerPerfil(),
      api.get<Historial[]>('/api/historial'),
    ])

    console.log('Perfil:', perfil)
    console.log('Historial:', historial)
  } catch (err) {
    console.error('Error al cargar datos:', err)
  }
}
```

---

## Resumen Visual de la Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPONENTES REACT                        │
│  (app/login, app/registro, app/dashboard/*, etc.)              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Importan funciones
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                         lib/api/index.ts                         │
│                    (Punto de entrada unificado)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Re-exporta desde
                ┌───────────┼───────────┐
                ↓           ↓           ↓
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ auth.ts  │  │ users.ts │  │ types.ts │
        │          │  │          │  │          │
        │ Login    │  │ Perfil   │  │ Usuario  │
        │ Registro │  │ Update   │  │ Request  │
        │ Logout   │  │ Delete   │  │ Response │
        └────┬─────┘  └────┬─────┘  └──────────┘
             │             │
             └─────┬───────┘
                   │ Usan
                   ↓
        ┌──────────────────┐
        │   client.ts      │
        │                  │
        │ apiRequest<T>()  │
        │ api.get()        │
        │ api.post()       │
        │ api.put()        │
        │ api.delete()     │
        └────────┬─────────┘
                 │ fetch()
                 ↓
        ┌──────────────────┐
        │   BACKEND API    │
        │  (REST Server)   │
        └──────────────────┘
```

---

## Checklist de Implementación

Cuando necesites agregar una nueva funcionalidad de API:

### ✅ 1. Define los tipos en `types.ts`
```typescript
export interface NuevoRecurso {
  id: number
  nombre: string
  // ... otros campos
}

export interface CrearRecursoRequest {
  nombre: string
  // ... campos necesarios
}
```

### ✅ 2. Crea las funciones en `auth.ts` o `users.ts` (o crea un nuevo archivo)
```typescript
// En lib/api/recursos.ts
export async function obtenerRecursos(): Promise<NuevoRecurso[]> {
  return api.get<NuevoRecurso[]>('/api/recursos')
}

export async function crearRecurso(data: CrearRecursoRequest): Promise<NuevoRecurso> {
  return api.post<NuevoRecurso>('/api/recursos', data)
}
```

### ✅ 3. Exporta desde `index.ts`
```typescript
// En lib/api/index.ts
export type { NuevoRecurso, CrearRecursoRequest } from './tipos'
export { obtenerRecursos, crearRecurso } from './recursos'
```

### ✅ 4. Usa en tus componentes
```typescript
import { obtenerRecursos, crearRecurso } from '@/lib/api'

const recursos = await obtenerRecursos()
const nuevo = await crearRecurso({ nombre: 'Test' })
```

---

## Ventajas de Esta Arquitectura

| Ventaja | Descripción |
|---------|-------------|
| **Centralización** | Todo el código de API en un solo lugar (`lib/api/`) |
| **Type Safety** | TypeScript verifica tipos en tiempo de desarrollo |
| **Reutilización** | Las funciones se usan en múltiples componentes |
| **Mantenibilidad** | Cambiar la API solo requiere modificar `lib/api/` |
| **Testeable** | Fácil de mockear para pruebas unitarias |
| **Escalable** | Agregar nuevos endpoints es simple y consistente |
| **Autocompletado** | El IDE sugiere funciones y propiedades automáticamente |
| **Manejo de Errores** | Gestión centralizada de errores HTTP |
| **Autenticación** | Inyección automática del token JWT |
| **Abstracción** | Los componentes no necesitan conocer detalles HTTP |

---

## Glosario de Términos

| Término | Definición |
|---------|------------|
| **API** | Application Programming Interface - Interfaz para comunicación entre sistemas |
| **REST** | Representational State Transfer - Arquitectura de APIs usando HTTP |
| **Endpoint** | URL específica de una operación de la API (ej: `/api/usuarios/verificar`) |
| **Generic (`<T>`)** | Tipo parametrizado que permite reutilizar código con diferentes tipos |
| **Promise** | Objeto que representa el resultado futuro de una operación asíncrona |
| **Async/Await** | Sintaxis para trabajar con Promesas de forma más legible |
| **Type Safety** | Verificación de tipos en tiempo de compilación para prevenir errores |
| **JWT** | JSON Web Token - Token encriptado para autenticación |
| **localStorage** | Almacenamiento del navegador que persiste entre sesiones |
| **Barrel Export** | Archivo `index.ts` que re-exporta desde múltiples archivos |
| **HTTP Methods** | GET (leer), POST (crear), PUT (actualizar), DELETE (eliminar) |
| **Status Code** | Código numérico que indica el resultado de una petición HTTP |

---

## Preguntas Frecuentes

### ¿Por qué usar `async/await` en lugar de `.then()`?

```typescript
// ❌ Con .then() (menos legible)
loginUsuario(data)
  .then(usuario => {
    console.log(usuario)
    return obtenerPerfil()
  })
  .then(perfil => {
    console.log(perfil)
  })
  .catch(error => {
    console.error(error)
  })

// ✅ Con async/await (más legible)
try {
  const usuario = await loginUsuario(data)
  console.log(usuario)

  const perfil = await obtenerPerfil()
  console.log(perfil)
} catch (error) {
  console.error(error)
}
```

### ¿Por qué extraer el campo `data` automáticamente?

Para simplificar el código en los componentes:

```typescript
// ❌ Sin extracción automática
const response = await loginUsuario(data)
const usuario = response.data  // Siempre tendrías que hacer esto
console.log(usuario.email)

// ✅ Con extracción automática
const usuario = await loginUsuario(data)
console.log(usuario.email)  // Acceso directo
```

### ¿Cuándo usar `requiresAuth: true`?

Usa `requiresAuth: true` para endpoints que requieren que el usuario esté autenticado:

```typescript
// ✅ Login y registro NO requieren autenticación
await loginUsuario({ email, password })
await registrarUsuario({ email, password, nombre, apellido, rol })

// ✅ Operaciones de perfil SÍ requieren autenticación
await obtenerPerfil()  // requiresAuth: true
await actualizarPerfil({ nombre: 'Nuevo' })  // requiresAuth: true
```

### ¿Dónde se guarda el token JWT?

El token se guarda en `localStorage`:

```typescript
// Guardado automático en auth.ts
localStorage.setItem('token', response.token)

// Lectura automática en client.ts
const token = localStorage.getItem('token')
```

**Nota:** Actualmente el backend no envía token, pero el frontend está preparado para cuando lo haga.

---

## Recursos Adicionales

- **Documentos relacionados:**
  - [README.md](README.md) - Información general del proyecto
  - [API_INTEGRATION.md](API_INTEGRATION.md) - Guía de integración de la API
  - [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Guía de migración desde Supabase

- **TypeScript:**
  - [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
  - [Async/Await](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Statements/async_function)

- **Next.js:**
  - [App Router](https://nextjs.org/docs/app)
  - [Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

---

**Última actualización:** 2026-01-18
**Versión del proyecto:** Compatible con Next.js 16, React 19
