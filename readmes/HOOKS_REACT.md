# React Hooks Personalizados - Guía Completa

## 📋 Tabla de Contenidos

1. [¿Qué son los React Hooks?](#qué-son-los-react-hooks)
2. [¿Para qué sirven?](#para-qué-sirven)
3. [Estructura del directorio hooks](#estructura-del-directorio-hooks)
4. [Explicación Detallada de Cada Hook](#explicación-detallada-de-cada-hook)
5. [Estado Actual del Proyecto](#estado-actual-del-proyecto)
6. [Comparación: Código Actual vs Usando Hooks](#comparación-código-actual-vs-usando-hooks)
7. [Conceptos Técnicos](#conceptos-técnicos)
8. [Ejemplos Prácticos](#ejemplos-prácticos)
9. [Beneficios de Usar Hooks](#beneficios-de-usar-hooks)
10. [Guía de Migración](#guía-de-migración)

---

## ¿Qué son los React Hooks?

Los **React Hooks** son funciones especiales que te permiten "enganchar" (hook into) características de React como el estado y el ciclo de vida en componentes funcionales.

### Hooks Nativos de React:

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react'

// useState - Maneja estado en componentes
const [count, setCount] = useState(0)

// useEffect - Ejecuta código en el ciclo de vida
useEffect(() => {
  // Código que se ejecuta después del render
}, [dependencies])

// useCallback - Memoriza funciones
const memoizedFn = useCallback(() => {
  // función
}, [dependencies])

// useMemo - Memoriza valores calculados
const memoizedValue = useMemo(() => computeExpensiveValue(), [dependencies])
```

### Hooks Personalizados (Custom Hooks):

Son **tus propias funciones** que usan hooks nativos de React para encapsular lógica reutilizable.

```typescript
// Custom hook
export function useAuth() {
  const [usuario, setUsuario] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ... lógica de autenticación ...

  return { usuario, isAuthenticated, logout }
}

// Uso en componentes
function MiComponente() {
  const { usuario, isAuthenticated, logout } = useAuth()
  // ... usar los valores ...
}
```

---

## ¿Para qué sirven?

Los hooks personalizados resuelven varios problemas:

### 1. **Evitar Código Duplicado**

Sin hooks, tienes que repetir la misma lógica en cada componente:

```typescript
// ❌ Componente A - Código duplicado
function ComponenteA() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('usuario')
    if (user) setUsuario(JSON.parse(user))
  }, [])

  // ... resto del componente
}

// ❌ Componente B - Mismo código duplicado
function ComponenteB() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('usuario')
    if (user) setUsuario(JSON.parse(user))
  }, [])

  // ... resto del componente
}
```

Con hooks, escribes la lógica una sola vez:

```typescript
// ✅ Hook personalizado
function useAuth() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('usuario')
    if (user) setUsuario(JSON.parse(user))
  }, [])

  return { usuario }
}

// ✅ Componente A
function ComponenteA() {
  const { usuario } = useAuth()
  // ... resto del componente
}

// ✅ Componente B
function ComponenteB() {
  const { usuario } = useAuth()
  // ... resto del componente
}
```

---

### 2. **Separación de Responsabilidades**

Los hooks separan la **lógica de negocio** de la **presentación**:

```typescript
// ✅ LÓGICA (Hook)
function useAuth() {
  const [usuario, setUsuario] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Lógica compleja de autenticación
    const user = getCurrentUser()
    setUsuario(user)
    setIsLoading(false)
  }, [])

  const logout = async () => {
    await logoutUsuario()
    clearAuthData()
    setUsuario(null)
  }

  return { usuario, isLoading, logout }
}

// ✅ PRESENTACIÓN (Componente)
function Dashboard() {
  const { usuario, isLoading, logout } = useAuth()

  if (isLoading) return <Spinner />

  return (
    <div>
      <h1>Bienvenido {usuario?.nombre}</h1>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  )
}
```

El componente **no necesita saber cómo** funciona la autenticación internamente.

---

### 3. **Facilitar Testing**

Puedes testear el hook de forma aislada:

```typescript
// Test del hook (sin UI)
test('useAuth devuelve usuario del localStorage', () => {
  localStorage.setItem('usuario', JSON.stringify({ nombre: 'Juan' }))

  const { result } = renderHook(() => useAuth())

  expect(result.current.usuario.nombre).toBe('Juan')
})

// Test del componente (solo UI, mockeando el hook)
test('Dashboard muestra nombre del usuario', () => {
  jest.mock('@/lib/hooks', () => ({
    useAuth: () => ({ usuario: { nombre: 'Juan' }, isLoading: false })
  }))

  render(<Dashboard />)
  expect(screen.getByText('Bienvenido Juan')).toBeInTheDocument()
})
```

---

### 4. **Composición**

Puedes combinar múltiples hooks:

```typescript
function useDashboard() {
  const { usuario, isAuthenticated } = useAuth()
  const { datos, isLoading } = useDatos()
  const { permisos } = usePermisos(usuario?.rol)

  return {
    usuario,
    isAuthenticated,
    datos,
    isLoading,
    permisos,
  }
}

function Dashboard() {
  const { usuario, datos, permisos } = useDashboard()
  // Todo en una sola línea
}
```

---

## Estructura del directorio hooks

```
lib/hooks/
├── useAuth.ts      → Hook de autenticación completo
├── useUser.ts      → Hook simple para datos del usuario
└── index.ts        → Exportaciones centralizadas
```

---

## Explicación Detallada de Cada Hook

### 📄 `useAuth.ts` - Hook de Autenticación

**Propósito:** Proporcionar toda la funcionalidad de autenticación en un solo lugar.

```typescript
export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // 1. INICIALIZACIÓN: Verifica localStorage al montar
  useEffect(() => {
    const storedUser = getCurrentUser()
    if (storedUser) {
      setUsuario(storedUser)
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  // 2. REFRESH: Actualiza los datos del usuario
  const refresh = useCallback(async () => {
    const storedUser = getCurrentUser()
    setUsuario(storedUser)
    setIsAuthenticated(storedUser !== null)
  }, [])

  // 3. LOGOUT: Cierra sesión
  const logout = useCallback(async () => {
    await logoutUsuario()
    clearAuthData()
    setUsuario(null)
    setIsAuthenticated(false)
    router.push('/login')
  }, [router])

  // 4. VERIFICACIÓN DE ROLES: Comprueba el rol del usuario
  const hasRole = useCallback(
    (rol: string) => {
      return usuario?.rol === rol
    },
    [usuario]
  )

  return {
    usuario,           // Objeto Usuario completo
    isAuthenticated,   // true/false
    isLoading,         // true mientras verifica
    refresh,           // Función para refrescar
    logout,            // Función para cerrar sesión
    hasRole,           // Función para verificar rol
  }
}
```

#### Retorno del Hook:

| Propiedad | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `usuario` | `Usuario \| null` | El objeto del usuario actual o `null` | `usuario.nombre`, `usuario.email` |
| `isAuthenticated` | `boolean` | Indica si hay un usuario autenticado | `if (isAuthenticated) { ... }` |
| `isLoading` | `boolean` | `true` mientras verifica localStorage | Mostrar spinner de carga |
| `refresh()` | `() => Promise<void>` | Refresca los datos del usuario | Llamar después de actualizar perfil |
| `logout()` | `() => Promise<void>` | Cierra sesión y redirige a login | Botón de "Cerrar Sesión" |
| `hasRole(rol)` | `(rol: string) => boolean` | Verifica si el usuario tiene un rol | `hasRole('administrador')` |

#### Flujo Interno:

```
┌─────────────────────────────────────────────────────────┐
│  Componente llama a useAuth()                           │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────┐
│  INICIALIZACIÓN                                         │
│  - useState inicializa: usuario=null, isLoading=true    │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────┐
│  useEffect SE EJECUTA (solo una vez al montar)          │
│  1. Lee localStorage: getCurrentUser()                  │
│  2. Si hay usuario:                                     │
│     - setUsuario(usuario)                               │
│     - setIsAuthenticated(true)                          │
│  3. setIsLoading(false)                                 │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────┐
│  COMPONENTE SE RE-RENDERIZA                             │
│  - Ahora tiene: usuario, isAuthenticated=true,          │
│    isLoading=false                                      │
│  - Puede mostrar UI basada en estos valores             │
└─────────────────────────────────────────────────────────┘
```

#### Casos de Uso:

##### 1. **Proteger Rutas**
```typescript
function DashboardLayout({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) return <Spinner />
  if (!isAuthenticated) return null

  return <div>{children}</div>
}
```

##### 2. **Mostrar Información del Usuario**
```typescript
function Header() {
  const { usuario, logout } = useAuth()

  return (
    <header>
      <p>Bienvenido, {usuario?.nombre}</p>
      <button onClick={logout}>Cerrar Sesión</button>
    </header>
  )
}
```

##### 3. **Verificar Permisos por Rol**
```typescript
function AdminPanel() {
  const { hasRole, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !hasRole('administrador')) {
      alert('No tienes permisos')
      router.push('/dashboard')
    }
  }, [hasRole, isLoading, router])

  if (isLoading) return <Spinner />
  if (!hasRole('administrador')) return null

  return <div>Panel de Administrador</div>
}
```

---

### 📄 `useUser.ts` - Hook de Usuario Simple

**Propósito:** Acceso simple a los datos del usuario sin funcionalidad extra.

```typescript
export function useUser() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    // Lee el usuario de localStorage
    const storedUser = getCurrentUser()
    setUsuario(storedUser)

    // Escucha cambios en localStorage (útil si hay múltiples tabs)
    const handleStorageChange = () => {
      const updatedUser = getCurrentUser()
      setUsuario(updatedUser)
    }

    window.addEventListener('storage', handleStorageChange)

    // Limpieza al desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return usuario
}
```

#### Retorno del Hook:

Solo devuelve `Usuario | null` (no es un objeto, es el valor directo).

#### ¿Cuándo usar `useUser` en lugar de `useAuth`?

| Necesitas... | Usa... |
|-------------|--------|
| Solo mostrar datos del usuario (nombre, email, etc.) | `useUser` |
| Función de logout | `useAuth` |
| Verificar si está autenticado | `useAuth` |
| Verificar roles/permisos | `useAuth` |
| Refrescar datos del usuario | `useAuth` |
| Proteger rutas | `useAuth` |

**Regla general:** Si solo necesitas **leer datos**, usa `useUser`. Si necesitas **funcionalidad**, usa `useAuth`.

#### Ejemplo de Uso:

```typescript
function UserGreeting() {
  const usuario = useUser()

  if (!usuario) return <p>Cargando...</p>

  return (
    <div>
      <h2>¡Hola, {usuario.nombre} {usuario.apellido}!</h2>
      <p>Email: {usuario.email}</p>
      <p>Rol: {usuario.rol}</p>
    </div>
  )
}
```

---

### 📄 `index.ts` - Exportaciones

```typescript
export { useAuth } from './useAuth'
export { useUser } from './useUser'
```

**Beneficio:** Importaciones más limpias.

```typescript
// ✅ Con index.ts
import { useAuth, useUser } from '@/lib/hooks'

// ❌ Sin index.ts
import { useAuth } from '@/lib/hooks/useAuth'
import { useUser } from '@/lib/hooks/useUser'
```

---

## Estado Actual del Proyecto

### ✅ ¿Qué está implementado?

1. **Los hooks existen** en `lib/hooks/`:
   - `useAuth.ts` - Completamente funcional
   - `useUser.ts` - Completamente funcional
   - `index.ts` - Exporta ambos hooks

2. **Los hooks están correctamente escritos**:
   - Usan TypeScript con tipos correctos
   - Siguen las mejores prácticas de React
   - Tienen todas las funcionalidades necesarias

### ❌ ¿Qué NO está implementado?

**NINGÚN componente está usando los hooks.**

Los componentes tienen código directo duplicado en lugar de usar los hooks.

---

## Comparación: Código Actual vs Usando Hooks

### Archivo 1: `app/dashboard/layout.tsx`

#### ❌ CÓDIGO ACTUAL (Sin hooks):

```typescript
// app/dashboard/layout.tsx
'use client'

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 🔴 CÓDIGO DUPLICADO - Esta lógica está repetida en varios componentes
    const usuarioStr = localStorage.getItem('usuario')

    if (!usuarioStr) {
      console.log('No hay usuario en localStorage, redirigiendo a login')
      router.push("/login")
      return
    }

    try {
      const usuario = JSON.parse(usuarioStr)
      console.log('Usuario encontrado en localStorage:', usuario)

      if (!usuario || !usuario.email) {
        console.log('Usuario inválido (sin email), limpiando localStorage')
        localStorage.removeItem('usuario')
        router.push("/login")
        return
      }

      console.log('Usuario válido, permitiendo acceso al dashboard')
      setIsLoading(false)
    } catch (error) {
      console.error('Error al parsear usuario de localStorage:', error)
      localStorage.removeItem('usuario')
      router.push("/login")
    }
  }, [router])

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
```

**Problemas:**
- 🔴 Código duplicado (38 líneas de lógica de autenticación)
- 🔴 Mezcla lógica de negocio con presentación
- 🔴 Difícil de testear
- 🔴 Difícil de mantener (si cambias la lógica, hay que cambiar en todos los archivos)

---

#### ✅ CÓDIGO CON HOOKS (Usando useAuth):

```typescript
// app/dashboard/layout.tsx
'use client'

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useAuth } from "@/lib/hooks"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

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

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  )
}
```

**Mejoras:**
- ✅ Solo 2 líneas de lógica (`useAuth()` + verificación)
- ✅ 38 líneas → 12 líneas (reducción del 68%)
- ✅ Más legible y mantenible
- ✅ Lógica centralizada en el hook
- ✅ Fácil de testear (mockear el hook)

---

### Archivo 2: `app/dashboard/configuracion/page.tsx`

#### ❌ CÓDIGO ACTUAL (Sin hooks):

```typescript
// app/dashboard/configuracion/page.tsx
'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Usuario } from "@/lib/api/types"

export default function ConfiguracionPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarPerfil() {
      try {
        // 🔴 CÓDIGO DUPLICADO - Leer de localStorage
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
      {/* ... resto del componente ... */}
    </div>
  )
}
```

**Problemas:**
- 🔴 Duplica la lógica de leer localStorage
- 🔴 Duplica el estado `isLoading`
- 🔴 Código repetitivo

---

#### ✅ CÓDIGO CON HOOKS (Usando useUser):

```typescript
// app/dashboard/configuracion/page.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/lib/hooks"

export default function ConfiguracionPage() {
  const usuario = useUser()

  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Cargando configuración...</p>
      </div>
    )
  }

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
        </CardContent>
      </Card>
    </div>
  )
}
```

**Mejoras:**
- ✅ 1 línea en lugar de 33 líneas de lógica
- ✅ Reducción del 97% en código de lógica
- ✅ Más legible y conciso
- ✅ Sin estados locales innecesarios

---

### Archivo 3: Componente con Logout

#### ❌ CÓDIGO ACTUAL (Sin hooks):

```typescript
// Ejemplo hipotético actual
function Header() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('usuario')
    if (user) setUsuario(JSON.parse(user))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('usuario')
    localStorage.removeItem('token')
    router.push('/login')
  }

  return (
    <header>
      <p>Bienvenido, {usuario?.nombre}</p>
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </header>
  )
}
```

---

#### ✅ CÓDIGO CON HOOKS (Usando useAuth):

```typescript
// Con useAuth
import { useAuth } from '@/lib/hooks'

function Header() {
  const { usuario, logout } = useAuth()

  return (
    <header>
      <p>Bienvenido, {usuario?.nombre}</p>
      <button onClick={logout}>Cerrar Sesión</button>
    </header>
  )
}
```

**Mejoras:**
- ✅ 2 líneas en lugar de 15
- ✅ Reducción del 87%
- ✅ `logout()` incluye toda la lógica (limpiar storage + redirigir)

---

## Conceptos Técnicos

### 🔷 ¿Qué es un Hook?

Un hook es una **función que comienza con "use"** y puede llamar a otros hooks.

```typescript
// ✅ Es un hook (comienza con "use")
function useAuth() {
  const [state, setState] = useState(null)
  return { state }
}

// ❌ NO es un hook (no comienza con "use")
function getAuth() {
  const [state, setState] = useState(null) // ❌ ERROR: Hooks solo en funciones "use"
  return { state }
}
```

**Reglas de los Hooks:**
1. Solo llamar hooks en el nivel superior (no dentro de loops, if, o funciones anidadas)
2. Solo llamar hooks desde componentes React o custom hooks
3. Los nombres deben empezar con "use"

---

### 🔷 `useState` - Estado Local

Permite que un componente "recuerde" valores entre renders.

```typescript
const [valor, setValor] = useState(inicial)

// valor: El valor actual
// setValor: Función para actualizar el valor
// inicial: Valor inicial
```

**Ejemplo:**

```typescript
function Contador() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  )
}

// Cada vez que llamas setCount(), el componente se re-renderiza
```

---

### 🔷 `useEffect` - Efectos Secundarios

Ejecuta código después de que el componente se renderiza.

```typescript
useEffect(() => {
  // Código que se ejecuta después del render

  return () => {
    // Cleanup (opcional): se ejecuta al desmontar
  }
}, [dependencias])

// dependencias: Array de valores que, al cambiar, re-ejecutan el efecto
```

**Ejemplo:**

```typescript
useEffect(() => {
  console.log('Componente montado')

  return () => {
    console.log('Componente desmontado')
  }
}, []) // Array vacío = solo se ejecuta una vez al montar
```

**Casos comunes:**

```typescript
// 1. Al montar (solo una vez)
useEffect(() => {
  cargarDatos()
}, [])

// 2. Cuando cambia una variable
useEffect(() => {
  console.log('ID cambió:', id)
}, [id])

// 3. En cada render (generalmente se evita)
useEffect(() => {
  console.log('En cada render')
}) // Sin array de dependencias
```

---

### 🔷 `useCallback` - Memorización de Funciones

Memoriza una función para que no se cree una nueva en cada render.

```typescript
const memoizedFn = useCallback(() => {
  // función
}, [dependencias])
```

**¿Por qué usarlo?**

```typescript
// ❌ Sin useCallback
function Componente() {
  const handleClick = () => {
    console.log('Click')
  }

  // handleClick es una NUEVA función en cada render
  // Si se pasa a un componente hijo, causa re-renders innecesarios

  return <BotonHijo onClick={handleClick} />
}

// ✅ Con useCallback
function Componente() {
  const handleClick = useCallback(() => {
    console.log('Click')
  }, [])

  // handleClick es la MISMA función en cada render
  // El componente hijo no se re-renderiza innecesariamente

  return <BotonHijo onClick={handleClick} />
}
```

---

### 🔷 Estado Reactivo

Cuando cambias el estado con `setState`, React **automáticamente re-renderiza** el componente.

```typescript
function Ejemplo() {
  const [count, setCount] = useState(0)

  console.log('Render! Count:', count)

  return <button onClick={() => setCount(count + 1)}>+1</button>
}

// Secuencia:
// 1. Render inicial: count = 0
// 2. Usuario hace click → setCount(1)
// 3. React re-renderiza: count = 1
// 4. Usuario hace click → setCount(2)
// 5. React re-renderiza: count = 2
```

---

## Ejemplos Prácticos

### Ejemplo 1: Proteger una Ruta con useAuth

```typescript
// app/dashboard/layout.tsx
'use client'

import { useAuth } from '@/lib/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({ children }) {
  const { usuario, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Redirige si no está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('No autenticado, redirigiendo a /login')
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Muestra spinner mientras verifica
  if (isLoading) {
    return <div>Cargando...</div>
  }

  // No renderiza nada si no está autenticado (ya está redirigiendo)
  if (!isAuthenticated) {
    return null
  }

  // Usuario autenticado, muestra el dashboard
  return (
    <div>
      <header>
        <h1>Bienvenido, {usuario?.nombre}!</h1>
      </header>
      <main>{children}</main>
    </div>
  )
}
```

**Explicación:**
1. `useAuth()` verifica localStorage automáticamente
2. Mientras `isLoading` es `true`, muestra spinner
3. Si `isAuthenticated` es `false`, redirige a login
4. Si está autenticado, muestra el contenido

---

### Ejemplo 2: Botón de Logout

```typescript
// components/logout-button.tsx
'use client'

import { useAuth } from '@/lib/hooks'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const { usuario, logout } = useAuth()

  const handleLogout = async () => {
    const confirmar = window.confirm('¿Seguro que quieres cerrar sesión?')
    if (confirmar) {
      await logout()
      // logout() automáticamente:
      // - Limpia localStorage
      // - Actualiza estados
      // - Redirige a /login
    }
  }

  return (
    <div className="flex items-center gap-4">
      <p className="text-sm">Sesión de: {usuario?.email}</p>
      <Button onClick={handleLogout} variant="outline">
        Cerrar Sesión
      </Button>
    </div>
  )
}
```

---

### Ejemplo 3: Mostrar Datos del Usuario con useUser

```typescript
// components/user-profile.tsx
'use client'

import { useUser } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function UserProfile() {
  const usuario = useUser()

  if (!usuario) {
    return <p>Cargando datos del usuario...</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Nombre:</strong> {usuario.nombre} {usuario.apellido}</p>
          <p><strong>Email:</strong> {usuario.email}</p>
          <p><strong>Rol:</strong> {usuario.rol}</p>
          <p><strong>Estado:</strong> {usuario.activo ? 'Activo' : 'Inactivo'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Ejemplo 4: Verificar Permisos por Rol

```typescript
// app/dashboard/admin/page.tsx
'use client'

import { useAuth } from '@/lib/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
  const { usuario, hasRole, isLoading } = useAuth()
  const router = useRouter()

  // Redirige si no es administrador
  useEffect(() => {
    if (!isLoading && !hasRole('administrador')) {
      alert('No tienes permisos para acceder a esta página')
      router.push('/dashboard')
    }
  }, [hasRole, isLoading, router])

  // Muestra loading mientras verifica
  if (isLoading) {
    return <div>Verificando permisos...</div>
  }

  // No renderiza si no tiene el rol
  if (!hasRole('administrador')) {
    return null
  }

  // Usuario es administrador, muestra el panel
  return (
    <div>
      <h1>Panel de Administrador</h1>
      <p>Bienvenido, {usuario?.nombre}</p>
      {/* Contenido solo para administradores */}
    </div>
  )
}
```

---

### Ejemplo 5: Refrescar Datos del Usuario

```typescript
// app/dashboard/configuracion/page.tsx
'use client'

import { useAuth } from '@/lib/hooks'
import { actualizarPerfil } from '@/lib/api'
import { useState } from 'react'

export default function ConfiguracionPage() {
  const { usuario, refresh } = useAuth()
  const [nombre, setNombre] = useState(usuario?.nombre || '')
  const [apellido, setApellido] = useState(usuario?.apellido || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleGuardar = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Actualiza el perfil en la API
      await actualizarPerfil({ nombre, apellido })

      // Refresca los datos del usuario en el hook
      await refresh()

      alert('Perfil actualizado correctamente')
    } catch (error) {
      alert('Error al actualizar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  if (!usuario) return <div>Cargando...</div>

  return (
    <form onSubmit={handleGuardar}>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre"
      />
      <input
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
        placeholder="Apellido"
      />
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
```

---

### Ejemplo 6: Combinar Múltiples Hooks

```typescript
// components/dashboard-header.tsx
'use client'

import { useAuth } from '@/lib/hooks'
import { LogoutButton } from './logout-button'

export function DashboardHeader() {
  const { usuario, hasRole } = useAuth()

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {usuario?.nombre} {usuario?.apellido} - {usuario?.rol}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {hasRole('administrador') && (
          <a href="/dashboard/admin" className="text-sm text-primary hover:underline">
            Panel de Administrador
          </a>
        )}
        <LogoutButton />
      </div>
    </header>
  )
}
```

---

## Beneficios de Usar Hooks

| Beneficio | Sin Hooks | Con Hooks |
|-----------|-----------|-----------|
| **Código duplicado** | Lógica repetida en cada componente | Lógica centralizada en el hook |
| **Líneas de código** | 30-40 líneas por componente | 1-5 líneas por componente |
| **Legibilidad** | Mezcla lógica con UI | Separación clara |
| **Mantenimiento** | Cambios en múltiples archivos | Cambios en un solo lugar |
| **Testing** | Difícil (testear todo junto) | Fácil (testear hook + UI separados) |
| **Reutilización** | Copy-paste entre archivos | Import del hook |
| **Consistencia** | Cada componente puede variar | Comportamiento uniforme |
| **Refactorización** | Arriesgado (muchos lugares) | Seguro (un solo lugar) |

---

### Comparación Numérica Real del Proyecto:

| Archivo | Líneas sin Hooks | Líneas con Hooks | Reducción |
|---------|------------------|------------------|-----------|
| `app/dashboard/layout.tsx` | 68 líneas | 42 líneas | -38% |
| `app/dashboard/configuracion/page.tsx` | 124 líneas | 95 líneas | -23% |
| `app/login/page.tsx` | 117 líneas | 117 líneas | 0% (ya usa API) |
| Componente de Logout (hipotético) | 25 líneas | 12 líneas | -52% |

**Total estimado:**
- **Antes:** ~334 líneas de código relacionado con autenticación
- **Después:** ~266 líneas
- **Ahorro:** ~68 líneas (20% de reducción)

Además, la **calidad del código** mejora significativamente:
- ✅ Más legible
- ✅ Más mantenible
- ✅ Más testeable
- ✅ Más consistente

---

## Guía de Migración

Si quisieras migrar el proyecto actual para usar hooks (NO lo hagas ahora, esto es solo referencia), estos serían los pasos:

### Paso 1: Identificar Componentes que Necesitan Autenticación

Busca componentes que:
- Leen `localStorage.getItem('usuario')`
- Verifican si el usuario está autenticado
- Redirigen a `/login`
- Muestran datos del usuario

En este proyecto:
- `app/dashboard/layout.tsx`
- `app/dashboard/configuracion/page.tsx`
- `app/dashboard/historial/page.tsx` (probablemente)
- Cualquier otro componente que use datos del usuario

---

### Paso 2: Reemplazar Lógica con useAuth o useUser

#### Para componentes que necesitan verificar autenticación:

**Antes:**
```typescript
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  const usuarioStr = localStorage.getItem('usuario')
  if (!usuarioStr) {
    router.push("/login")
    return
  }
  // ... más lógica ...
  setIsLoading(false)
}, [])
```

**Después:**
```typescript
const { isAuthenticated, isLoading } = useAuth()

useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push("/login")
  }
}, [isAuthenticated, isLoading, router])
```

---

#### Para componentes que solo necesitan datos del usuario:

**Antes:**
```typescript
const [usuario, setUsuario] = useState<Usuario | null>(null)

useEffect(() => {
  const usuarioStr = localStorage.getItem('usuario')
  if (usuarioStr) {
    const user = JSON.parse(usuarioStr) as Usuario
    setUsuario(user)
  }
}, [])
```

**Después:**
```typescript
const usuario = useUser()
```

---

### Paso 3: Agregar Funcionalidad de Logout

**Antes:**
```typescript
const handleLogout = () => {
  localStorage.removeItem('usuario')
  localStorage.removeItem('token')
  router.push('/login')
}
```

**Después:**
```typescript
const { logout } = useAuth()

const handleLogout = async () => {
  await logout() // Ya hace todo automáticamente
}
```

---

### Paso 4: Testear

Después de cada cambio:
1. Verifica que el login funciona
2. Verifica que la redirección funciona
3. Verifica que el logout funciona
4. Verifica que los datos del usuario se muestran correctamente

---

## Diagramas de Flujo

### Flujo de useAuth()

```
┌─────────────────────────────────────────────────┐
│  Componente: const { usuario, isAuthenticated,  │
│             isLoading, logout } = useAuth()     │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  useAuth() SE EJECUTA                           │
│  - Inicializa estados:                          │
│    * usuario = null                             │
│    * isAuthenticated = false                    │
│    * isLoading = true                           │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  useEffect() SE EJECUTA (solo al montar)        │
│  - Llama a getCurrentUser()                     │
│  - Lee localStorage.getItem('usuario')          │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ↓                         ↓
┌───────────────┐         ┌───────────────┐
│ Usuario       │         │ No hay        │
│ encontrado    │         │ usuario       │
└───────┬───────┘         └───────┬───────┘
        │                         │
        ↓                         ↓
┌───────────────┐         ┌───────────────┐
│ setUsuario()  │         │ Mantiene      │
│ setIsAuth(T)  │         │ estados null  │
└───────┬───────┘         └───────┬───────┘
        │                         │
        └────────────┬────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  setIsLoading(false)                            │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  COMPONENTE SE RE-RENDERIZA                     │
│  - Recibe los valores actualizados              │
│  - isLoading = false                            │
│  - usuario = Usuario | null                     │
│  - isAuthenticated = true | false               │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  Componente renderiza UI basada en los valores  │
│  - if (isLoading) → Spinner                     │
│  - if (!isAuthenticated) → Redirigir            │
│  - else → Mostrar contenido                     │
└─────────────────────────────────────────────────┘
```

---

### Flujo de logout()

```
┌─────────────────────────────────────────────────┐
│  Usuario hace click en "Cerrar Sesión"          │
│  onClick={() => logout()}                       │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  logout() función del hook useAuth              │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  1. Llama a logoutUsuario() de lib/api/auth.ts  │
│     (función de la API)                         │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  2. Llama a clearAuthData() de lib/utils        │
│     - localStorage.removeItem('usuario')        │
│     - localStorage.removeItem('token')          │
│     - localStorage.removeItem('refresh_token')  │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  3. Actualiza estados del hook                  │
│     - setUsuario(null)                          │
│     - setIsAuthenticated(false)                 │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  4. Redirige a /login                           │
│     - router.push('/login')                     │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  Componente se re-renderiza                     │
│  - usuario = null                               │
│  - isAuthenticated = false                      │
│  - Usuario ve la página de login                │
└─────────────────────────────────────────────────┘
```

---

## Resumen Ejecutivo

### ¿Qué son los hooks?
Funciones reutilizables que encapsulan lógica de React (estado, efectos, etc.).

### ¿Para qué sirven?
- Evitar código duplicado
- Separar lógica de presentación
- Facilitar testing
- Mejorar mantenibilidad

### Hooks en este proyecto:
- **`useAuth()`** - Autenticación completa (logout, verificación, roles)
- **`useUser()`** - Solo datos del usuario (más simple)

### Estado actual:
- ✅ Los hooks existen y están bien implementados
- ❌ Ningún componente los está usando actualmente
- 🔴 Hay código duplicado en múltiples componentes

### Beneficios potenciales de usar hooks:
- Reducción de ~20% en líneas de código
- Código más legible y mantenible
- Lógica centralizada
- Más fácil de testear
- Consistencia entre componentes

### Comparación rápida:

| Aspecto | Sin Hooks (Actual) | Con Hooks |
|---------|-------------------|-----------|
| Líneas de código por componente | 30-40 | 2-5 |
| Mantenibilidad | Baja (código duplicado) | Alta (centralizado) |
| Legibilidad | Media (mezcla lógica + UI) | Alta (separado) |
| Testing | Difícil | Fácil |
| Consistencia | Varía por componente | Uniforme |

---

## Preguntas Frecuentes

### ¿Por qué no se están usando los hooks si ya existen?

Los hooks fueron creados durante la migración de Supabase a API REST, pero los componentes no se actualizaron para usarlos. Los componentes mantienen el código directo original.

### ¿Es obligatorio usar hooks?

No. El código actual funciona correctamente. Los hooks son una **mejora opcional** que hace el código más mantenible y reutilizable.

### ¿Cuándo debería usar useAuth vs useUser?

- **`useAuth`**: Cuando necesitas funcionalidad (logout, verificar autenticación, roles)
- **`useUser`**: Cuando solo necesitas leer datos del usuario

### ¿Los hooks afectan el rendimiento?

No negativamente. De hecho, pueden **mejorar** el rendimiento con técnicas como `useCallback` y `useMemo`.

### ¿Puedo crear mis propios hooks?

Sí. Cualquier función que comienza con "use" y usa hooks de React es un custom hook válido.

```typescript
// Ejemplo: Hook personalizado para un contador
function useContador(inicial = 0) {
  const [count, setCount] = useState(inicial)

  const incrementar = () => setCount(count + 1)
  const decrementar = () => setCount(count - 1)
  const reset = () => setCount(inicial)

  return { count, incrementar, decrementar, reset }
}

// Uso
function MiComponente() {
  const { count, incrementar, decrementar, reset } = useContador(10)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={incrementar}>+</button>
      <button onClick={decrementar}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

### ¿Los hooks funcionan en Server Components?

**No.** Los hooks solo funcionan en **Client Components** (componentes con `'use client'`).

```typescript
// ❌ NO funciona en Server Components
export default function ServerComponent() {
  const { usuario } = useAuth() // ERROR
  return <div>{usuario?.nombre}</div>
}

// ✅ Funciona en Client Components
'use client'

export default function ClientComponent() {
  const { usuario } = useAuth() // ✅ OK
  return <div>{usuario?.nombre}</div>
}
```

### ¿Qué pasa si localStorage está vacío?

`useAuth` maneja este caso automáticamente:
- `usuario` será `null`
- `isAuthenticated` será `false`
- `isLoading` será `false`

El componente puede decidir qué hacer (ej: redirigir a login).

---

## Recursos Adicionales

### Documentación Oficial:
- [React Hooks](https://react.dev/reference/react)
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [useState](https://react.dev/reference/react/useState)
- [useEffect](https://react.dev/reference/react/useEffect)
- [useCallback](https://react.dev/reference/react/useCallback)

### Documentos del Proyecto:
- [README.md](README.md) - Información general
- [ARQUITECTURA_API.md](ARQUITECTURA_API.md) - Arquitectura de la API
- [API_INTEGRATION.md](API_INTEGRATION.md) - Guía de integración

---

**Última actualización:** 2026-01-18
**Versión del proyecto:** Compatible con Next.js 16, React 19
