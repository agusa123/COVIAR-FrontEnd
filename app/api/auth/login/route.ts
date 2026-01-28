import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        console.log('Proxy Login: Enviando login a', `${API_BASE_URL}/api/v1/auth/login`)

        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            credentials: 'include', // Incluir cookies
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
            console.error('Proxy Login: Error del backend:', response.status, data)
            return NextResponse.json(
                { message: data.message || `Error ${response.status}: ${response.statusText}` },
                { status: response.status }
            )
        }

        console.log('Proxy Login: Login exitoso')

        // Crear respuesta y reenviar cookies del backend al cliente
        const nextResponse = NextResponse.json(data)

        // Reenviar todas las cookies del backend
        const setCookieHeaders = response.headers.getSetCookie?.() || []
        for (const cookie of setCookieHeaders) {
            nextResponse.headers.append('set-cookie', cookie)
        }

        // Alternativa si getSetCookie no está disponible
        const setCookieHeader = response.headers.get('set-cookie')
        if (setCookieHeader && setCookieHeaders.length === 0) {
            nextResponse.headers.set('set-cookie', setCookieHeader)
        }

        return nextResponse
    } catch (error) {
        console.error('Proxy Login: Error de conexión:', error)
        return NextResponse.json(
            { message: 'No se pudo conectar con el servidor backend' },
            { status: 503 }
        )
    }
}
