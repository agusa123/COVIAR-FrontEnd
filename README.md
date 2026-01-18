# COVIAR - Sistema de Autoevaluación de Sostenibilidad Enoturística

Sistema web para la gestión y autoevaluación de prácticas sostenibles en bodegas y viñedos de Argentina.

## Estado del Proyecto

✅ **Migrado de Supabase a API REST** - Enero 2026

Este proyecto ha sido completamente reestructurado para consumir una API REST en lugar de Supabase.

## Tecnologías

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS, Radix UI
- **Lenguaje**: TypeScript
- **API Client**: Fetch API con wrapper personalizado
- **Autenticación**: JWT (preparado para implementación)
- **Gestión de Estado**: React Hooks + localStorage

## Estructura del Proyecto

```
front/
├── app/                          # Páginas y rutas (Next.js App Router)
│   ├── registro/                # Registro de usuarios
│   ├── login/                   # Inicio de sesión
│   ├── dashboard/               # Panel principal
│   │   ├── autoevaluacion/     # Autoevaluación de sostenibilidad
│   │   ├── configuracion/      # Configuración de cuenta
│   │   └── historial/          # Historial de evaluaciones
│   └── recuperar-contrasena/   # Recuperación de contraseña
├── components/                  # Componentes React reutilizables
│   └── ui/                     # Componentes de UI (Radix UI)
├── lib/
│   ├── api/                    # 🆕 Servicios de API REST
│   │   ├── client.ts          # Cliente HTTP base
│   │   ├── auth.ts            # Autenticación
│   │   ├── users.ts           # Usuarios
│   │   └── types.ts           # Tipos TypeScript
│   ├── hooks/                  # 🆕 React Hooks personalizados
│   │   ├── useAuth.ts         # Hook de autenticación
│   │   └── useUser.ts         # Hook de usuario
│   └── utils/                  # 🆕 Utilidades
│       ├── storage.ts         # Gestión de localStorage
│       └── auth-utils.ts      # Utilidades de autenticación
└── public/                     # Archivos estáticos
```

## Instalación

### Prerrequisitos

- Node.js 18+ o compatible
- npm o pnpm
- Backend API corriendo en `http://localhost:8080` (o configurar URL)

### Pasos

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd front
```

2. **Instalar dependencias**

```bash
npm install
# o
pnpm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. **Remover dependencias de Supabase (si aún existen)**

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
# o
pnpm remove @supabase/ssr @supabase/supabase-js
```

5. **Iniciar servidor de desarrollo**

```bash
npm run dev
# o
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Compilar para producción
npm run start    # Iniciar en modo producción
npm run lint     # Ejecutar linter
```

## Arquitectura de la API

### Cliente HTTP

El proyecto incluye un cliente HTTP completo en `lib/api/client.ts`:

- Manejo automático de headers
- Soporte para autenticación JWT
- Manejo centralizado de errores
- Timeouts configurables
- Tipos TypeScript completos

**Ejemplo de uso:**

```typescript
import { api } from '@/lib/api'

// GET
const usuarios = await api.get<Usuario[]>('/api/usuarios')

// POST
const nuevo = await api.post('/api/usuarios', data)
```

### Servicios Disponibles

#### Autenticación (`lib/api/auth.ts`)

```typescript
import { registrarUsuario, loginUsuario, logoutUsuario } from '@/lib/api/auth'

// Registro
const usuario = await registrarUsuario({
  email: 'user@example.com',
  password: 'pass123',
  nombre: 'Juan',
  apellido: 'Pérez',
  rol: 'bodega'
})

// Login
const usuario = await loginUsuario({
  email: 'user@example.com',
  password: 'pass123'
})

// Logout
await logoutUsuario()
```

#### Usuarios (`lib/api/users.ts`)

```typescript
import { obtenerPerfil, actualizarPerfil } from '@/lib/api/users'

// Obtener perfil
const perfil = await obtenerPerfil()

// Actualizar perfil
await actualizarPerfil({
  nombre: 'Nuevo Nombre'
})
```

### React Hooks

#### useAuth

```typescript
import { useAuth } from '@/lib/hooks'

function MiComponente() {
  const { usuario, isAuthenticated, logout } = useAuth()

  return (
    <div>
      <p>Hola {usuario?.nombre}</p>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  )
}
```

#### useRequireAuth

```typescript
import { useRequireAuth } from '@/lib/hooks'

export default function PaginaProtegida() {
  const { isAuthenticated, isLoading } = useRequireAuth()

  if (isLoading) return <div>Cargando...</div>

  return <div>Contenido protegido</div>
}
```

## Documentación

- 📖 **[API_INTEGRATION.md](API_INTEGRATION.md)** - Guía completa de uso de la API
- 🔄 **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Guía de migración desde Supabase
- 📋 **[REESTRUCTURACION_RESUMEN.md](REESTRUCTURACION_RESUMEN.md)** - Resumen de cambios
- 💻 **[COMANDOS_UTILES.md](COMANDOS_UTILES.md)** - Comandos útiles para desarrollo

## Endpoints de la API

El frontend está preparado para consumir los siguientes endpoints:

### Autenticación
- `POST /api/usuarios` - Registro
- `POST /api/usuarios/verificar` - Login
- `POST /api/usuarios/logout` - Logout
- `POST /api/usuarios/recuperar-password` - Recuperar contraseña

### Usuarios
- `GET /api/usuarios/perfil` - Obtener perfil
- `PUT /api/usuarios/perfil` - Actualizar perfil
- `POST /api/usuarios/cambiar-password` - Cambiar contraseña

### Autoevaluaciones (Futuro)
- `GET /api/autoevaluaciones` - Listar evaluaciones
- `POST /api/autoevaluaciones` - Crear evaluación
- `GET /api/autoevaluaciones/:id` - Obtener evaluación

## Estado Actual

### ✅ Implementado

- Cliente HTTP con fetch
- Servicios de autenticación
- Servicios de usuarios
- Hooks de React (useAuth, useUser)
- Gestión de localStorage
- Páginas de registro y login
- Dashboard principal
- Sistema de tipos TypeScript

### 🚧 Pendiente

- Integración completa con API backend
- Autenticación con JWT
- Refresh tokens
- Middleware de Next.js para rutas protegidas
- Tests automatizados

## Testing

### Sin la API (Modo Actual)

El frontend funciona con datos en localStorage:

1. Ir a `/registro`
2. Registrar un usuario
3. Los datos se guardan localmente
4. Login con las credenciales
5. Navegar por el dashboard

### Con la API

Una vez que la API esté lista:

1. Descomentar las llamadas a la API (buscar `// TODO:` en el código)
2. Configurar `NEXT_PUBLIC_API_URL`
3. Probar flujos completos

## Build

```bash
# Compilar
npm run build

# Verificar build
npm run start
```

## Deploy

### Vercel (Recomendado)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno:
   - `NEXT_PUBLIC_API_URL=https://api.tu-dominio.com`
3. Deploy automático

### Otros

```bash
npm run build
npm run start
```

## Troubleshooting

### Puerto 3000 en uso

```bash
PORT=3001 npm run dev
```

### Errores de compilación

```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Problemas con CORS

Verificar que el backend tenga CORS habilitado para:
- `http://localhost:3000` (desarrollo)
- Tu dominio de producción

## Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## Licencia

[Especificar licencia]

## Contacto

Para preguntas sobre el proyecto:
- Revisar la documentación en los archivos `.md`
- Buscar `TODO:` en el código para ver tareas pendientes
- Consultar [API_INTEGRATION.md](API_INTEGRATION.md) para detalles técnicos

---

**Última actualización**: Enero 2026
**Estado**: Listo para integración con API
