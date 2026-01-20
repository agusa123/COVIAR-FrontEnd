import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        console.log('Proxy: Enviando registro a', `${API_BASE_URL}/api/v1/registro`)
        console.log('Proxy: Body:', JSON.stringify(body, null, 2))

        const response = await fetch(`${API_BASE_URL}/api/v1/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
            console.error('Proxy: Error del backend:', response.status, data)
            return NextResponse.json(
                { message: data.message || `Error ${response.status}: ${response.statusText}` },
                { status: response.status }
            )
        }

        console.log('Proxy: Registro exitoso:', data)
        return NextResponse.json(data)
    } catch (error) {
        console.error('Proxy: Error de conexión:', error)
        return NextResponse.json(
            { message: 'No se pudo conectar con el servidor backend' },
            { status: 503 }
        )
    }
}
