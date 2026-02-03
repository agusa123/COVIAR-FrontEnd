// lib/utils/export-utils.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AutoevaluacionHistorial, ResultadoDetallado } from '@/lib/api/types'
import { determineSustainabilityLevel } from './scoring'

/**
 * Exporta los datos del historial a un archivo CSV
 */
export function exportHistorialToCSV(
    evaluaciones: AutoevaluacionHistorial[],
    filename: string = 'historial_autoevaluaciones'
): void {
    // Headers del CSV
    const headers = [
        'ID',
        'Fecha',
        'Estado',
        'Puntaje Obtenido',
        'Puntaje Máximo',
        'Porcentaje',
        'Nivel de Sostenibilidad'
    ]

    // Filas de datos
    const rows = evaluaciones.map(ev => {
        const nivel = ev.porcentaje !== null
            ? determineSustainabilityLevel(ev.porcentaje).nombre
            : 'N/A'

        return [
            ev.id_autoevaluacion.toString(),
            formatDate(ev.fecha_inicio),
            capitalizeFirst(ev.estado),
            ev.puntaje_final?.toString() ?? '-',
            ev.puntaje_maximo?.toString() ?? '-',
            ev.porcentaje !== null ? `${ev.porcentaje}%` : '-',
            nivel
        ]
    })

    // Construir CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Descargar archivo
    downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Exporta una evaluación detallada a CSV con capítulos e indicadores
 */
export function exportResultadoDetalladoToCSV(
    resultado: ResultadoDetallado,
    filename: string = 'evaluacion_detallada'
): void {
    const { autoevaluacion: ev, capitulos } = resultado

    // Info general
    const generalInfo = [
        ['Información de la Evaluación'],
        ['ID', ev.id_autoevaluacion.toString()],
        ['Fecha', formatDate(ev.fecha_inicio)],
        ['Puntaje Total', `${ev.puntaje_final ?? '-'} / ${ev.puntaje_maximo ?? '-'}`],
        ['Porcentaje', ev.porcentaje !== null ? `${ev.porcentaje}%` : '-'],
        ['Nivel', ev.porcentaje !== null ? determineSustainabilityLevel(ev.porcentaje).nombre : 'N/A'],
        [''],
        ['Detalle por Capítulo'],
        ['Capítulo', 'Puntaje', 'Máximo', 'Porcentaje', 'Indicadores Completados']
    ]

    const capituloRows = capitulos.map(cap => [
        cap.nombre,
        cap.puntaje_obtenido.toString(),
        cap.puntaje_maximo.toString(),
        `${cap.porcentaje}%`,
        `${cap.indicadores_completados} / ${cap.indicadores_total}`
    ])

    const csvContent = [
        ...generalInfo.map(row => row.map(cell => `"${cell}"`).join(',')),
        ...capituloRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Exporta el historial de evaluaciones a PDF
 */
export function exportHistorialToPDF(
    evaluaciones: AutoevaluacionHistorial[],
    bodegaNombre: string = 'Bodega',
    filename: string = 'historial_autoevaluaciones'
): void {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.setTextColor(136, 13, 30) // #880D1E
    doc.text('Historia de Guía de Autoevaluación de Sostenibilidad', 14, 20)

    // Subtítulo
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text('Evaluaciones de sostenibilidad enoturística completadas', 14, 28)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 34)

    // Tabla de evaluaciones
    const tableData = evaluaciones.map((ev, index) => {
        const nivel = ev.porcentaje !== null
            ? determineSustainabilityLevel(ev.porcentaje).nombre
            : 'N/A'

        return [
            `#${evaluaciones.length - index}`,
            formatDate(ev.fecha_inicio),
            `${ev.puntaje_final ?? '-'} / ${ev.puntaje_maximo ?? '-'}`,
            ev.porcentaje !== null ? `${ev.porcentaje}%` : '-',
            nivel
        ]
    })

    autoTable(doc, {
        startY: 42,
        head: [['Evaluación', 'Fecha', 'Puntaje', 'Porcentaje', 'Nivel']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [136, 13, 30],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10,
            cellPadding: 4
        },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40 },
            3: { cellWidth: 35 },
            4: { cellWidth: 45 }
        }
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
            `Página ${i} de ${pageCount} - COVIAR Autoevaluación de Sostenibilidad`,
            14,
            doc.internal.pageSize.height - 10
        )
    }

    doc.save(`${filename}.pdf`)
}

/**
 * Exporta una evaluación detallada a PDF con capítulos
 */
export function exportResultadoDetalladoToPDF(
    resultado: ResultadoDetallado,
    bodegaNombre: string = 'Bodega',
    filename: string = 'evaluacion_detallada'
): void {
    const doc = new jsPDF()
    const { autoevaluacion: ev, capitulos } = resultado

    const nivel = ev.porcentaje !== null
        ? determineSustainabilityLevel(ev.porcentaje)
        : null

    // Título
    doc.setFontSize(18)
    doc.setTextColor(136, 13, 30)
    doc.text('Resultado de Autoevaluación de Sostenibilidad', 14, 20)

    // Info general
    doc.setFontSize(11)
    doc.setTextColor(60)
    doc.text(`Evaluación #${ev.id_autoevaluacion}`, 14, 32)
    doc.text(`Fecha: ${formatDate(ev.fecha_inicio)}`, 14, 39)

    // Métricas principales
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text('Resumen de Resultados', 14, 52)

    doc.setFontSize(11)
    doc.text(`Puntaje Total: ${ev.puntaje_final ?? '-'} / ${ev.puntaje_maximo ?? '-'}`, 14, 62)
    doc.text(`Porcentaje: ${ev.porcentaje !== null ? `${ev.porcentaje}%` : '-'}`, 14, 69)
    doc.text(`Nivel de Sostenibilidad: ${nivel?.nombre ?? 'N/A'}`, 14, 76)

    // Tabla de capítulos
    const tableData = capitulos.map(cap => [
        cap.nombre,
        `${cap.puntaje_obtenido} / ${cap.puntaje_maximo}`,
        `${cap.porcentaje}%`,
        `${cap.indicadores_completados} / ${cap.indicadores_total}`
    ])

    autoTable(doc, {
        startY: 88,
        head: [['Capítulo', 'Puntaje', 'Porcentaje', 'Indicadores']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [136, 13, 30],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10,
            cellPadding: 4
        }
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
            `Página ${i} de ${pageCount} - COVIAR Autoevaluación de Sostenibilidad`,
            14,
            doc.internal.pageSize.height - 10
        )
    }

    doc.save(`${filename}.pdf`)
}

// ============= HELPERS =============

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
