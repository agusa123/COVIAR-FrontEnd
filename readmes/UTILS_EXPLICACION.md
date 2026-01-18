# Directorio Utils - Guía Completa

## 📋 Tabla de Contenidos

1. [¿Qué es el directorio utils?](#qué-es-el-directorio-utils)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Explicación Detallada de Cada Archivo](#explicación-detallada-de-cada-archivo)
4. [Estado Actual del Proyecto](#estado-actual-del-proyecto)
5. [Comparación: Con y Sin Utils](#comparación-con-y-sin-utils)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Relación con Otros Directorios](#relación-con-otros-directorios)
8. [Beneficios](#beneficios)

---

## ¿Qué es el directorio utils?

El directorio `lib/utils/` contiene **funciones utilitarias** (helper functions) que son pequeñas, reutilizables y de propósito específico. Son funciones "puras" que:

- ✅ **No tienen estado** - No usan `useState`, `useEffect`, etc.
- ✅ **Son síncronas** (en su mayoría) - No hacen peticiones HTTP
- ✅ **Hacen una cosa bien** - Cada función tiene un propósito específico
- ✅ **Son reutilizables** - Se usan en múltiples lugares del proyecto

### Diferencia entre `utils/`, `hooks/` y `api/`:

| Directorio | Propósito | Ejemplo | Características |
|------------|-----------|---------|-----------------|
| **`lib/utils/`** | Funciones auxiliares | Leer/escribir localStorage, verificar roles | Funciones puras, síncronas |
| **`lib/hooks/`** | Lógica con estado de React | useAuth, useUser | Usan hooks de React, manejan estado |
| **`lib/api/`** | Comunicación con backend | Login, registro, obtener perfil | Peticiones HTTP, asíncronas |

**Analogía:**
- **`utils/`** = Herramientas en una caja (martillo, destornillador)
- **`hooks/`** = Máquinas que usan las herramientas (taladro eléctrico)
- **`api/`** = Mensajeros que traen/llevan información (servicio de correo)

---

## Estructura de Archivos

```
lib/
├── utils/
│   ├── storage.ts       → Funciones para localStorage (bajo nivel)
│   ├── auth-utils.ts    → Funciones de autenticación (alto nivel)
│   └── index.ts         → Exportaciones centralizadas
└── utils.ts             → Utilidad para clases CSS (shadcn/ui)
```

**Nota importante:** Hay **dos** lugares con "utils":
1. **`lib/utils/`** (directorio) - Nuestras utilidades personalizadas
2. **`lib/utils.ts`** (archivo) - Utilidad de shadcn/ui para CSS (función `cn`)

---

## Explicación Detallada de Cada Archivo

### 📄 `lib/utils/storage.ts` - Manejo de localStorage

**Propósito:** Proveer una **capa de abstracción** sobre `localStorage` del navegador con manejo de errores.

#### ¿Por qué necesitamos esto?

El `localStorage` del navegador tiene varios problemas:

1. **No funciona en Server Side Rendering (SSR)** - `window` no existe en el servidor
2. **Puede lanzar errores** - Si el almacenamiento está lleno o deshabilitado
3. **Solo guarda strings** - Necesitas `JSON.stringify`/`JSON.parse` manualmente
4. **Sin TypeScript** - No hay tipos para los valores guardados

**Este archivo soluciona todos estos problemas.**

---

#### Constante: `STORAGE_KEYS`

```typescript
export const STORAGE_KEYS = {
  USER: 'usuario',
  TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
} as const
```

**¿Para qué sirve?**

Centraliza las claves de localStorage para evitar errores de tipeo.

```typescript
// ❌ Sin STORAGE_KEYS (propenso a errores)
localStorage.setItem('usuario', JSON.stringify(user))  // ¿era 'usuario' o 'user'?
localStorage.getItem('User')  // ¡Mayúscula por error!

// ✅ Con STORAGE_KEYS (autocompletado + sin errores)
setItem(STORAGE_KEYS.USER, user)  // El IDE autocompleta
getItem(STORAGE_KEYS.USER)  // Siempre la misma clave
```

**Beneficio:** Si cambias el nombre de una clave, solo lo cambias en un lugar.

---

#### Función: `setItem(key, value)`

```typescript
export function setItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return  // 1. Verifica SSR

  try {
    // 2. Serializa automáticamente
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    localStorage.setItem(key, serialized)
  } catch (error) {
    // 3. Maneja errores silenciosamente
    console.error(`Error al guardar en localStorage (${key}):`, error)
  }
}
```

**¿Qué hace?**

1. **Verifica SSR:** Si `window` no existe (servidor), no hace nada
2. **Serializa automáticamente:** Convierte objetos a JSON
3. **Maneja errores:** Si localStorage está lleno o deshabilitado, no rompe la app

**Comparación:**

```typescript
// ❌ localStorage directo (propenso a errores)
localStorage.setItem('usuario', JSON.stringify(usuario))  // ¿Y si no existe window?

// ✅ Con setItem (seguro)
setItem(STORAGE_KEYS.USER, usuario)  // Maneja todo automáticamente
```

---

#### Función: `getItem<T>(key)`

```typescript
export function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null  // 1. Verifica SSR

  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    // 2. Intenta parsear como JSON
    try {
      return JSON.parse(item) as T
    } catch {
      // 3. Si falla, devuelve como string
      return item as T
    }
  } catch (error) {
    console.error(`Error al leer de localStorage (${key}):`, error)
    return null
  }
}
```

**¿Qué hace?**

1. **Verifica SSR:** Devuelve `null` si no hay `window`
2. **Parsea automáticamente:** Intenta convertir el JSON a objeto
3. **Devuelve string si falla:** Si no es JSON válido, devuelve el string directo
4. **TypeScript genérico:** Puedes especificar el tipo de retorno

**Ejemplo:**

```typescript
// Guardar un objeto
setItem(STORAGE_KEYS.USER, { nombre: 'Juan', email: 'juan@example.com' })

// Leer con tipo
const usuario = getItem<Usuario>(STORAGE_KEYS.USER)
//    ^^^^^^^ TypeScript sabe que es Usuario | null

if (usuario) {
  console.log(usuario.nombre)  // ✅ Autocompletado funciona
}
```

---

#### Función: `removeItem(key)`

```typescript
export function removeItem(key: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error al eliminar de localStorage (${key}):`, error)
  }
}
```

**¿Qué hace?**

Elimina un valor de localStorage con protección SSR y manejo de errores.

---

#### Función: `clear()`

```typescript
export function clear(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.clear()
  } catch (error) {
    console.error('Error al limpiar localStorage:', error)
  }
}
```

**¿Qué hace?**

Limpia **TODO** el localStorage. **¡Cuidado!** Esto borra TODOS los datos, no solo los de tu app.

**Uso:** Generalmente se usa en desarrollo para resetear el estado.

---

#### Función: `hasItem(key)`

```typescript
export function hasItem(key: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}
```

**¿Qué hace?**

Verifica si existe una clave en localStorage sin leer su valor.

```typescript
if (hasItem(STORAGE_KEYS.TOKEN)) {
  console.log('Usuario tiene token')
}
```

---

### 📄 `lib/utils/auth-utils.ts` - Utilidades de Autenticación

**Propósito:** Funciones de **alto nivel** específicas para autenticación que usan `storage.ts`.

Este archivo es una **capa de abstracción** sobre `storage.ts` para operaciones de autenticación comunes.

---

#### Relación entre `storage.ts` y `auth-utils.ts`:

```
┌─────────────────────────────────────────┐
│  COMPONENTES / HOOKS                    │
│  (app/login, useAuth, etc.)             │
└────────────────┬────────────────────────┘
                 │ Usan funciones de alto nivel
                 ↓
┌─────────────────────────────────────────┐
│  auth-utils.ts (ALTO NIVEL)             │
│  - getCurrentUser()                     │
│  - setCurrentUser()                     │
│  - isAuthenticated()                    │
│  - hasRole()                            │
└────────────────┬────────────────────────┘
                 │ Usan funciones de bajo nivel
                 ↓
┌─────────────────────────────────────────┐
│  storage.ts (BAJO NIVEL)                │
│  - getItem()                            │
│  - setItem()                            │
│  - removeItem()                         │
└────────────────┬────────────────────────┘
                 │ Interactúa con el navegador
                 ↓
┌─────────────────────────────────────────┐
│  localStorage del navegador             │
└─────────────────────────────────────────┘
```

**Beneficio:** Los componentes no necesitan saber qué clave usar ni cómo parsear los datos.

---

#### Función: `getCurrentUser()`

```typescript
export function getCurrentUser(): Usuario | null {
  return getItem<Usuario>(STORAGE_KEYS.USER)
}
```

**¿Qué hace?**

Lee el usuario actual de localStorage con el tipo correcto.

**Sin auth-utils:**
```typescript
// ❌ Necesitas recordar la clave y el tipo
const usuarioStr = localStorage.getItem('usuario')
const usuario = usuarioStr ? JSON.parse(usuarioStr) as Usuario : null
```

**Con auth-utils:**
```typescript
// ✅ Simple y claro
const usuario = getCurrentUser()
```

---

#### Función: `setCurrentUser(usuario)`

```typescript
export function setCurrentUser(usuario: Usuario): void {
  setItem(STORAGE_KEYS.USER, usuario)
}
```

**¿Qué hace?**

Guarda el usuario en localStorage.

**Comparación:**
```typescript
// ❌ Sin auth-utils
localStorage.setItem('usuario', JSON.stringify(usuario))

// ✅ Con auth-utils
setCurrentUser(usuario)
```

---

#### Función: `removeCurrentUser()`

```typescript
export function removeCurrentUser(): void {
  removeItem(STORAGE_KEYS.USER)
}
```

**¿Qué hace?**

Elimina el usuario de localStorage.

---

#### Función: `getAuthToken()`

```typescript
export function getAuthToken(): string | null {
  // 1. Intenta obtener token directo
  const token = getItem<string>(STORAGE_KEYS.TOKEN)
  if (token) return token

  // 2. Alternativa: obtener del objeto usuario (si está incluido ahí)
  const usuario = getCurrentUser()
  return usuario && 'token' in usuario
    ? (usuario as Usuario & { token?: string }).token || null
    : null
}
```

**¿Qué hace?**

Obtiene el token de autenticación, buscando en dos lugares:
1. Primero en `localStorage['token']`
2. Si no existe, intenta leerlo del objeto usuario (por si el backend lo envía ahí)

**Beneficio:** Flexible para diferentes formatos de respuesta del backend.

---

#### Función: `setAuthToken(token)`, `removeAuthToken()`

```typescript
export function setAuthToken(token: string): void {
  setItem(STORAGE_KEYS.TOKEN, token)
}

export function removeAuthToken(): void {
  removeItem(STORAGE_KEYS.TOKEN)
}
```

**¿Qué hacen?**

Guardar y eliminar el token JWT.

---

#### Función: `isAuthenticated()`

```typescript
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
```

**¿Qué hace?**

Verifica si hay un usuario autenticado (si existe en localStorage).

**Uso:**
```typescript
if (isAuthenticated()) {
  console.log('Usuario logueado')
} else {
  router.push('/login')
}
```

---

#### Función: `clearAuthData()`

```typescript
export function clearAuthData(): void {
  removeCurrentUser()
  removeAuthToken()
  removeItem(STORAGE_KEYS.REFRESH_TOKEN)
}
```

**¿Qué hace?**

Limpia **todos** los datos de autenticación (usuario, token, refresh token).

**Uso:** Se llama al hacer logout.

```typescript
// En lib/api/auth.ts
export async function logoutUsuario(): Promise<void> {
  clearAuthData()  // Limpia todo
}
```

---

#### Función: `hasRole(role)`

```typescript
export function hasRole(role: string): boolean {
  const usuario = getCurrentUser()
  return usuario?.rol === role
}
```

**¿Qué hace?**

Verifica si el usuario actual tiene un rol específico.

**Ejemplo:**
```typescript
if (hasRole('administrador')) {
  console.log('Es administrador')
}
```

---

#### Función: `hasAnyRole(roles)`

```typescript
export function hasAnyRole(roles: string[]): boolean {
  const usuario = getCurrentUser()
  return usuario ? roles.includes(usuario.rol) : false
}
```

**¿Qué hace?**

Verifica si el usuario tiene **alguno** de los roles especificados.

**Ejemplo:**
```typescript
if (hasAnyRole(['administrador', 'bodega'])) {
  console.log('Puede acceder a esta sección')
}
```

---

#### Función: `isUserActive()`

```typescript
export function isUserActive(): boolean {
  const usuario = getCurrentUser()
  return usuario?.activo ?? false
}
```

**¿Qué hace?**

Verifica si el usuario está activo (no bloqueado/suspendido).

**Ejemplo:**
```typescript
if (!isUserActive()) {
  alert('Tu cuenta ha sido desactivada')
  logout()
}
```

---

### 📄 `lib/utils/index.ts` - Exportaciones

```typescript
// Utilidades de almacenamiento
export {
  setItem,
  getItem,
  removeItem,
  clear,
  hasItem,
  STORAGE_KEYS,
} from './storage'

// Utilidades de autenticación
export {
  getCurrentUser,
  setCurrentUser,
  removeCurrentUser,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  clearAuthData,
  hasRole,
  hasAnyRole,
  isUserActive,
} from './auth-utils'
```

**Propósito:** Permite importar desde un solo lugar.

```typescript
// ✅ Con index.ts
import { getCurrentUser, isAuthenticated, setItem } from '@/lib/utils'

// ❌ Sin index.ts
import { getCurrentUser, isAuthenticated } from '@/lib/utils/auth-utils'
import { setItem } from '@/lib/utils/storage'
```

---

### 📄 `lib/utils.ts` - Utilidad CSS (shadcn/ui)

Este archivo **NO está relacionado** con `lib/utils/` (el directorio). Es una utilidad para combinar clases CSS de Tailwind.

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**¿Qué hace?**

Combina clases CSS de Tailwind inteligentemente, resolviendo conflictos.

**Ejemplo:**

```typescript
// Sin cn - Conflictos de clases
<div className="text-red-500 text-blue-500">
  {/* ¿Qué color? 🤔 Ambas se aplican, resultado impredecible */}
</div>

// Con cn - Resuelve conflictos automáticamente
import { cn } from '@/lib/utils'

<div className={cn("text-red-500", "text-blue-500")}>
  {/* Solo text-blue-500 se aplica (la última gana) ✅ */}
</div>

// Uso común: Clases condicionales
<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-blue-500",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
  Click me
</button>
```

**Dónde se usa:** En componentes de UI (shadcn/ui) como `Button`, `Card`, `Input`, etc.

---

## Estado Actual del Proyecto

### ✅ ¿Qué está implementado?

1. **`lib/utils/` existe** con:
   - `storage.ts` - 5 funciones + 1 constante
   - `auth-utils.ts` - 10 funciones
   - `index.ts` - Exportaciones

2. **`lib/utils.ts` existe** con:
   - Función `cn()` para clases CSS

### ✅ ¿Qué se está usando?

1. **Los hooks usan auth-utils:**
   - `useAuth.ts` importa: `getCurrentUser`, `isAuthenticated`, `clearAuthData`
   - `useUser.ts` importa: `getCurrentUser`

2. **Los componentes UI usan utils.ts:**
   - Todos los componentes de `components/ui/` usan `cn()`

### ❌ ¿Qué NO se está usando directamente?

Los componentes **no usan** directamente las funciones de `lib/utils/auth-utils.ts` ni `lib/utils/storage.ts`.

**Flujo actual:**
```
Componentes → useAuth/useUser → auth-utils → storage → localStorage
```

**NO existe:**
```
Componentes → auth-utils directamente ❌
```

**Esto está bien** porque:
- Los componentes deberían usar hooks (capa de abstracción más alta)
- Los hooks usan auth-utils internamente
- Mantiene la separación de responsabilidades

---

## Comparación: Con y Sin Utils

### Ejemplo 1: Obtener Usuario

#### ❌ Sin utils (código directo):

```typescript
function MiComponente() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    // Código repetitivo y propenso a errores
    if (typeof window === 'undefined') return

    try {
      const usuarioStr = localStorage.getItem('usuario')
      if (usuarioStr) {
        const user = JSON.parse(usuarioStr)
        setUsuario(user)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }, [])

  return <div>{usuario?.nombre}</div>
}
```

**Problemas:**
- 14 líneas de código repetitivo
- Manejo manual de SSR
- Manejo manual de JSON
- Propenso a errores

---

#### ✅ Con utils (usando auth-utils):

```typescript
import { getCurrentUser } from '@/lib/utils/auth-utils'

function MiComponente() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const user = getCurrentUser()
    setUsuario(user)
  }, [])

  return <div>{usuario?.nombre}</div>
}
```

**Mejoras:**
- 4 líneas en lugar de 14 (reducción del 71%)
- Manejo automático de errores
- Código más legible

---

#### ✅✅ Aún mejor: Con hooks (usando useUser):

```typescript
import { useUser } from '@/lib/hooks'

function MiComponente() {
  const usuario = useUser()
  return <div>{usuario?.nombre}</div>
}
```

**Mejoras:**
- 1 línea en lugar de 14 (reducción del 93%)
- Estado reactivo automático
- Código super limpio

**Jerarquía de abstracción:**
```
Nivel 3 (Más alto):   useUser()            ← Más simple para componentes
                        ↓
Nivel 2:              getCurrentUser()      ← Para lógica sin estado
                        ↓
Nivel 1 (Más bajo):   getItem()            ← Para uso general de storage
                        ↓
Nivel 0:              localStorage         ← Navegador nativo
```

---

### Ejemplo 2: Verificar Autenticación

#### ❌ Sin utils:

```typescript
function ProtectedRoute({ children }) {
  const router = useRouter()

  useEffect(() => {
    // Código repetitivo
    if (typeof window === 'undefined') return

    const usuarioStr = localStorage.getItem('usuario')
    if (!usuarioStr) {
      router.push('/login')
      return
    }

    try {
      const usuario = JSON.parse(usuarioStr)
      if (!usuario || !usuario.email) {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    }
  }, [router])

  return <>{children}</>
}
```

**Problemas:**
- 20 líneas de código
- Lógica compleja y difícil de leer
- Propenso a errores

---

#### ✅ Con utils (usando isAuthenticated):

```typescript
import { isAuthenticated } from '@/lib/utils/auth-utils'

function ProtectedRoute({ children }) {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  return <>{children}</>
}
```

**Mejoras:**
- 9 líneas en lugar de 20 (reducción del 55%)
- Lógica clara y legible
- Reutilizable

---

#### ✅✅ Aún mejor: Con hooks (usando useAuth):

```typescript
import { useAuth } from '@/lib/hooks'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) return <Spinner />
  if (!isAuthenticated) return null

  return <>{children}</>
}
```

**Mejoras:**
- Maneja estado de carga
- Más robusto
- Código declarativo

---

### Ejemplo 3: Limpiar Datos de Autenticación

#### ❌ Sin utils:

```typescript
function handleLogout() {
  localStorage.removeItem('usuario')
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  router.push('/login')
}
```

**Problemas:**
- Fácil olvidar alguna clave
- Código duplicado en múltiples lugares

---

#### ✅ Con utils (usando clearAuthData):

```typescript
import { clearAuthData } from '@/lib/utils/auth-utils'

function handleLogout() {
  clearAuthData()  // Limpia todo automáticamente
  router.push('/login')
}
```

**Mejoras:**
- Una sola línea
- No puedes olvidar ninguna clave
- Centralizado (si necesitas limpiar algo más, lo agregas en un solo lugar)

---

## Ejemplos Prácticos

### Ejemplo 1: Guardar y Leer Configuración del Usuario

```typescript
import { setItem, getItem } from '@/lib/utils'

// Guardar preferencias
function guardarPreferencias() {
  const preferencias = {
    tema: 'dark',
    idioma: 'es',
    notificaciones: true,
  }

  setItem('preferencias', preferencias)
}

// Leer preferencias
function cargarPreferencias() {
  const preferencias = getItem<{
    tema: string
    idioma: string
    notificaciones: boolean
  }>('preferencias')

  if (preferencias) {
    console.log('Tema:', preferencias.tema)
  }
}
```

---

### Ejemplo 2: Verificar Permisos por Rol

```typescript
import { hasRole, hasAnyRole } from '@/lib/utils/auth-utils'

function AdminPanel() {
  // Verificar un solo rol
  if (!hasRole('administrador')) {
    return <div>No tienes permisos</div>
  }

  return <div>Panel de Administrador</div>
}

function ReportesPanel() {
  // Verificar múltiples roles
  if (!hasAnyRole(['administrador', 'bodega'])) {
    return <div>No tienes permisos</div>
  }

  return <div>Reportes</div>
}
```

---

### Ejemplo 3: Middleware de Autenticación

```typescript
import { isAuthenticated, getCurrentUser } from '@/lib/utils/auth-utils'

function withAuth(Component: React.ComponentType) {
  return function AuthenticatedComponent(props: any) {
    const router = useRouter()

    useEffect(() => {
      if (!isAuthenticated()) {
        router.push('/login')
      }
    }, [router])

    if (!isAuthenticated()) {
      return null
    }

    return <Component {...props} />
  }
}

// Uso
const ProtectedDashboard = withAuth(Dashboard)
```

---

### Ejemplo 4: Guardar Datos Temporales

```typescript
import { setItem, getItem, removeItem } from '@/lib/utils'

// Guardar borrador de formulario
function guardarBorrador(datos: any) {
  setItem('formulario_borrador', datos)
}

// Recuperar borrador
function recuperarBorrador() {
  return getItem('formulario_borrador')
}

// Limpiar borrador después de enviar
function limpiarBorrador() {
  removeItem('formulario_borrador')
}

// Uso en componente
function FormularioRegistro() {
  const [datos, setDatos] = useState(() => {
    // Recuperar borrador al cargar
    return recuperarBorrador() || { nombre: '', email: '' }
  })

  useEffect(() => {
    // Guardar borrador automáticamente
    const timer = setTimeout(() => {
      guardarBorrador(datos)
    }, 1000)

    return () => clearTimeout(timer)
  }, [datos])

  const handleSubmit = async () => {
    await enviarFormulario(datos)
    limpiarBorrador()  // Limpia después de enviar
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

---

### Ejemplo 5: Verificar Estado del Usuario

```typescript
import { getCurrentUser, isUserActive } from '@/lib/utils/auth-utils'

function DashboardLayout({ children }) {
  const usuario = getCurrentUser()

  // Verificar si el usuario está activo
  if (usuario && !isUserActive()) {
    return (
      <div className="p-8">
        <h1>Cuenta Desactivada</h1>
        <p>Tu cuenta ha sido desactivada. Contacta al administrador.</p>
      </div>
    )
  }

  return <>{children}</>
}
```

---

### Ejemplo 6: Manejo de Sesión con Expiración

```typescript
import { setItem, getItem, removeItem } from '@/lib/utils'

interface Sesion {
  usuario: Usuario
  expira: number  // timestamp
}

function guardarSesion(usuario: Usuario, duracionHoras: number = 24) {
  const sesion: Sesion = {
    usuario,
    expira: Date.now() + (duracionHoras * 60 * 60 * 1000),
  }

  setItem('sesion', sesion)
}

function obtenerSesion(): Usuario | null {
  const sesion = getItem<Sesion>('sesion')

  if (!sesion) return null

  // Verificar si expiró
  if (Date.now() > sesion.expira) {
    removeItem('sesion')  // Limpiar sesión expirada
    return null
  }

  return sesion.usuario
}

// Uso
function useSession() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    const user = obtenerSesion()
    if (user) {
      setUsuario(user)
    } else {
      // Sesión expirada, redirigir a login
      router.push('/login')
    }
  }, [])

  return usuario
}
```

---

## Relación con Otros Directorios

### Diagrama de Dependencias:

```
┌─────────────────────────────────────────────────────────┐
│  COMPONENTES REACT                                      │
│  (app/*, components/*)                                  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ↓            ↓            ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ lib/hooks│  │ lib/api  │  │lib/utils │
│          │  │          │  │(utils.ts)│
│ useAuth  │  │ Login    │  │ cn()     │
│ useUser  │  │ Registro │  │          │
└────┬─────┘  └────┬─────┘  └──────────┘
     │            │
     │            │
     └─────┬──────┘
           │
           ↓
┌───────────────────┐
│ lib/utils/        │
│ (directorio)      │
│                   │
│ auth-utils.ts     │
│ storage.ts        │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│  localStorage     │
│  (navegador)      │
└───────────────────┘
```

### ¿Quién usa qué?

| Quién | Usa | Para |
|-------|-----|------|
| **Componentes** | `lib/hooks` | Lógica de autenticación con estado |
| **Componentes** | `lib/api` | Peticiones HTTP |
| **Componentes UI** | `lib/utils.ts` | Función `cn()` para clases CSS |
| **Hooks** | `lib/utils/auth-utils` | Leer/escribir datos de autenticación |
| **Hooks** | `lib/utils/storage` | (indirectamente a través de auth-utils) |
| **API** | No usa utils | (podría usar storage para cache futuro) |
| **auth-utils** | `lib/utils/storage` | Operaciones de bajo nivel en localStorage |

### Flujo Completo de Login:

```
1. Usuario hace click en "Iniciar Sesión"
   ↓
2. Componente llama a loginUsuario() de lib/api/auth.ts
   ↓
3. API hace fetch al backend
   ↓
4. Backend responde con usuario
   ↓
5. API guarda en localStorage:
   localStorage.setItem('usuario', JSON.stringify(usuario))
   ↓
6. Componente redirige a /dashboard
   ↓
7. DashboardLayout usa useAuth()
   ↓
8. useAuth() llama a getCurrentUser() de lib/utils/auth-utils
   ↓
9. getCurrentUser() llama a getItem() de lib/utils/storage
   ↓
10. getItem() lee de localStorage
    ↓
11. Usuario se muestra en el dashboard
```

---

## Beneficios

### 1. **Abstracción de localStorage**

| Sin Utils | Con Utils |
|-----------|-----------|
| Cada componente maneja SSR | storage.ts maneja SSR una vez |
| JSON.stringify/parse manual | Serialización automática |
| Sin manejo de errores | Try-catch incorporado |
| Sin tipos TypeScript | Tipos genéricos `<T>` |

---

### 2. **Reutilización**

```typescript
// Sin utils - Repetir en cada archivo
const user = JSON.parse(localStorage.getItem('usuario') || 'null')

// Con utils - Una línea en todos lados
const user = getCurrentUser()
```

**Impacto:** Si cambia el formato de almacenamiento, cambias 1 archivo en lugar de 50.

---

### 3. **Mantenibilidad**

**Escenario:** Necesitas cambiar la clave de 'usuario' a 'current_user'.

```typescript
// ❌ Sin STORAGE_KEYS
// Tienes que buscar y reemplazar en 20 archivos:
localStorage.getItem('usuario')  // En archivo1.ts
localStorage.getItem('usuario')  // En archivo2.ts
// ... 18 archivos más

// ✅ Con STORAGE_KEYS
// Cambias en un solo lugar:
export const STORAGE_KEYS = {
  USER: 'current_user',  // ← Solo aquí
  // ...
}
```

---

### 4. **Seguridad de Tipos**

```typescript
// ❌ Sin tipos
const usuario = JSON.parse(localStorage.getItem('usuario'))
console.log(usuario.nonbre)  // ¡Typo! Runtime error

// ✅ Con tipos
const usuario = getCurrentUser()
console.log(usuario?.nonbre)  // Error en tiempo de compilación
console.log(usuario?.nombre)  // ✅ Correcto
```

---

### 5. **Consistencia**

Todos los componentes usan las mismas funciones → comportamiento uniforme.

```typescript
// Todos los componentes hacen lo mismo:
const usuario = getCurrentUser()

// En lugar de cada uno haciendo algo diferente:
// Componente A: JSON.parse(localStorage.getItem('usuario'))
// Componente B: JSON.parse(localStorage.getItem('user'))  // ¡Clave diferente!
// Componente C: JSON.parse(window.localStorage.getItem('usuario') || '{}')
```

---

### 6. **Testabilidad**

Puedes mockear las funciones fácilmente:

```typescript
// Test
jest.mock('@/lib/utils/auth-utils', () => ({
  getCurrentUser: jest.fn(() => ({ nombre: 'Juan', rol: 'admin' })),
  isAuthenticated: jest.fn(() => true),
}))

test('Muestra nombre del usuario', () => {
  render(<MiComponente />)
  expect(screen.getByText('Juan')).toBeInTheDocument()
})
```

---

## Comparación de Arquitectura

### Arquitectura Sin Utils:

```
Componentes (50 archivos)
    ↓ (cada uno maneja localStorage directamente)
localStorage (código duplicado 50 veces)
```

**Problemas:**
- Código duplicado
- Difícil de mantener
- Propenso a errores
- Sin reutilización

---

### Arquitectura Con Utils:

```
Componentes (50 archivos)
    ↓ (usan funciones utils)
lib/utils/auth-utils (10 funciones)
    ↓
lib/utils/storage (5 funciones)
    ↓
localStorage
```

**Beneficios:**
- Código centralizado
- Fácil de mantener
- Reutilizable
- Testeable
- Type-safe

---

## Resumen Ejecutivo

### ¿Qué es `lib/utils/`?

Directorio con **funciones auxiliares** para tareas comunes (principalmente localStorage y autenticación).

### Archivos Principales:

1. **`storage.ts`** (bajo nivel)
   - 5 funciones para manejar localStorage
   - Maneja SSR, serialización, errores
   - Genérico, se puede usar para cualquier cosa

2. **`auth-utils.ts`** (alto nivel)
   - 10 funciones específicas de autenticación
   - Usa `storage.ts` internamente
   - API más simple y semántica

3. **`index.ts`**
   - Re-exporta todo desde un lugar

4. **`lib/utils.ts`** (separado)
   - Utilidad CSS `cn()` para shadcn/ui
   - No relacionado con `lib/utils/` directorio

### ¿Quién lo usa?

- **`lib/hooks/useAuth.ts`** → usa `auth-utils`
- **`lib/hooks/useUser.ts`** → usa `auth-utils`
- **Componentes UI** → usan `utils.ts` (función `cn`)
- **Componentes normales** → NO usan utils directamente (usan hooks)

### Beneficios:

| Beneficio | Descripción |
|-----------|-------------|
| **Abstracción** | Oculta complejidad de localStorage |
| **Reutilización** | Una función, múltiples usos |
| **Mantenibilidad** | Cambios en un solo lugar |
| **Type Safety** | TypeScript genéricos |
| **Consistencia** | Comportamiento uniforme |
| **Testabilidad** | Fácil de mockear |

### Jerarquía de Abstracción:

```
Nivel 4 (Componentes):    <MiComponente />
                              ↓
Nivel 3 (Hooks):          useAuth(), useUser()
                              ↓
Nivel 2 (Auth Utils):     getCurrentUser(), isAuthenticated()
                              ↓
Nivel 1 (Storage):        getItem(), setItem()
                              ↓
Nivel 0 (Navegador):      localStorage
```

Cada nivel agrega más abstracción y conveniencia.

---

## Preguntas Frecuentes

### ¿Por qué hay `lib/utils/` y `lib/utils.ts`?

Son cosas diferentes:
- **`lib/utils/`** (directorio) - Nuestras utilidades personalizadas
- **`lib/utils.ts`** (archivo) - Utilidad de shadcn/ui para CSS

Es confuso pero es el estándar de shadcn/ui.

---

### ¿Cuándo usar `storage.ts` vs `auth-utils.ts`?

- **`auth-utils.ts`** - Para operaciones de autenticación (usuario, token, roles)
- **`storage.ts`** - Para cualquier otra cosa que quieras guardar en localStorage

Ejemplo:
```typescript
// ✅ Para autenticación, usa auth-utils
import { getCurrentUser } from '@/lib/utils/auth-utils'

// ✅ Para otras cosas, usa storage
import { getItem, setItem } from '@/lib/utils/storage'
setItem('preferencias_usuario', { tema: 'dark' })
```

---

### ¿Por qué no usar localStorage directamente?

Porque `localStorage` tiene problemas:
1. No funciona en SSR (Next.js)
2. Puede lanzar errores
3. Solo guarda strings (necesitas JSON.stringify)
4. Sin tipos TypeScript

Las utils resuelven todos estos problemas.

---

### ¿Puedo agregar mis propias funciones a utils?

¡Sí! Es para eso.

```typescript
// lib/utils/date-utils.ts
export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR')
}

export function esFechaFutura(fecha: string): boolean {
  return new Date(fecha) > new Date()
}

// lib/utils/index.ts
export { formatearFecha, esFechaFutura } from './date-utils'
```

**Regla:** Si una función se usa en 2+ lugares, muévela a utils.

---

### ¿Los utils pueden usar hooks de React?

**NO.** Los utils son funciones puras, **no pueden usar hooks**.

```typescript
// ❌ NO - Utils no pueden usar hooks
export function getMiUsuario() {
  const [usuario] = useState(null)  // ERROR
  return usuario
}

// ✅ SÍ - Esto va en hooks/
export function useMiUsuario() {
  const [usuario] = useState(null)  // ✅ OK
  return usuario
}
```

**Si necesitas estado o efectos, usa hooks, no utils.**

---

### ¿Qué pasa si localStorage está deshabilitado?

Las funciones de `storage.ts` manejan esto con `try-catch`. No rompen la app, solo loggean el error y devuelven `null` o no hacen nada.

```typescript
try {
  localStorage.setItem(key, value)
} catch (error) {
  console.error('Error al guardar:', error)
  // No rompe la app ✅
}
```

---

## Recursos Adicionales

### Documentos Relacionados:
- [ARQUITECTURA_API.md](ARQUITECTURA_API.md) - Sistema de API
- [HOOKS_REACT.md](HOOKS_REACT.md) - React Hooks personalizados
- [API_INTEGRATION.md](API_INTEGRATION.md) - Integración con API

### Conceptos:
- [localStorage MDN](https://developer.mozilla.org/es/docs/Web/API/Window/localStorage)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [React SSR](https://react.dev/reference/react-dom/server)

---

**Última actualización:** 2026-01-18
**Versión del proyecto:** Compatible con Next.js 16, React 19
