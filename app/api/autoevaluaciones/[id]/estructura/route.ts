import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        console.log('Proxy Autoevaluacion: Obteniendo estructura para ID', id)

        // Reenviar todas las cookies del cliente al backend
        const cookies = request.headers.get('Cookie')

        // Obtener token de autorización si existe
        const authHeader = request.headers.get('Authorization')

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        }

        // Reenviar cookies si existen (para autenticación basada en sesión)
        if (cookies) {
            headers['Cookie'] = cookies
        }

        // Reenviar header de autorización si existe (para JWT)
        if (authHeader) {
            headers['Authorization'] = authHeader
        }

        const backendUrl = `${API_BASE_URL}/api/v1/autoevaluaciones/${id}/estructura`
        console.log('Proxy Autoevaluacion: Llamando a', backendUrl)

        const response = await fetch(backendUrl, {
            method: 'GET',
            headers,
            credentials: 'include', // Incluir cookies en la petición
        })

        console.log('Proxy Autoevaluacion: Respuesta del backend:', response.status)

        // Si es texto plano o error, intentar obtener como texto primero
        const contentType = response.headers.get('content-type')
        let data

        if (contentType && contentType.includes('application/json')) {
            data = await response.json().catch(() => ({}))
        } else {
            const text = await response.text()
            console.log('Proxy Autoevaluacion: Respuesta no-JSON:', text)
            data = { message: text || `Error ${response.status}` }
        }

        if (!response.ok) {
            console.error('Proxy Autoevaluacion: Error del backend:', response.status, data)
            return NextResponse.json(
                { message: data.message || data.error || `Error ${response.status}: ${response.statusText}` },
                { status: response.status }
            )
        }

        console.log('Proxy Autoevaluacion: Estructura obtenida exitosamente')

        // Crear respuesta y reenviar cookies del backend al cliente
        const nextResponse = NextResponse.json(data)
        const setCookieHeader = response.headers.get('set-cookie')
        if (setCookieHeader) {
            nextResponse.headers.set('set-cookie', setCookieHeader)
        }

        return nextResponse
    } catch (error) {
        console.error('Proxy Autoevaluacion: Error de conexión:', error)
        return NextResponse.json(
            { message: 'No se pudo conectar con el servidor backend' },
            { status: 503 }
        )
    }
}
