import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AcademicReportData, ReportConfig } from '../types';
import { mergeConfig, reportFileName } from '../template';
import { periodLabel } from '../../periods';

const DARK = [31, 41, 55] as [number, number, number];
const GRAY = [107, 114, 128] as [number, number, number];
const GREEN = [16, 185, 129] as [number, number, number];
const RED = [239, 68, 68] as [number, number, number];
const LINE = [226, 232, 240] as [number, number, number];

const gradeLabelOf = (data: AcademicReportData) =>
  data.grade ? `${data.grade.nombre} "${data.grade.tipo_grado}"` : 'Sin asignar';

/** Plantilla DEFAULT del boletín en PDF. Consume AcademicReportData. */
export function renderBoletinPDF(data: AcademicReportData, config: ReportConfig | null) {
  const opts = mergeConfig(config);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 18;

  // Encabezado
  doc.setFillColor(...opts.primary);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(data.institution.nombre, marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Boletín de Calificaciones — ${periodLabel(data.period)}`, marginX, y + 7);

  // Estudiante
  y = 40;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${data.student.nombre} ${data.student.apellido}`, marginX, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAY);
  doc.text(
    `Documento: ${data.student.tipo_documento || ''} ${data.student.identificacion || ''}    Grado: ${gradeLabelOf(data)}    Género: ${data.student.genero || 'N/E'}    Edad: ${data.student.edad ?? '—'} años`,
    marginX,
    y
  );
  y += 5;
  doc.setDrawColor(...LINE);
  doc.line(marginX, y, pageWidth - marginX, y);

  // Materias (resumen por materia)
  y += 8;
  if (data.subjects.length === 0) {
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('El estudiante no tiene materias asignadas en este período.', marginX, y);
    y += 12;
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Materia', 'Docente', 'Evaluaciones', 'Promedio', 'Estado']],
      body: data.subjects.map(s => [
        s.materia,
        opts.showTeacher ? (s.docente || '—') : '—',
        String(s.evaluaciones.length),
        s.promedio.toFixed(2),
        s.estado,
      ]),
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 9, cellPadding: 3.5, textColor: DARK },
      headStyles: { fillColor: opts.primary, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
      didParseCell: hook => {
        if (hook.section === 'body' && hook.column.index === 4) {
          const estado = String(hook.cell.raw);
          if (estado === 'Aprobado') {
            hook.cell.styles.textColor = GREEN;
            hook.cell.styles.fontStyle = 'bold';
          } else if (estado === 'Reprobado') {
            hook.cell.styles.textColor = RED;
            hook.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Evaluaciones (detalle por materia/evaluación)
  if (opts.showEvaluations) {
    const rows: (string | number)[][] = [];
    for (const s of data.subjects) {
      for (const ev of s.evaluaciones) {
        rows.push([s.materia, ev.nombre, ev.porcentaje ?? '—', ev.nota ?? '—']);
      }
    }
    if (rows.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      doc.text('Detalle de Evaluaciones', marginX, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Materia', 'Evaluación', '%', 'Nota']],
        body: rows,
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 8.5, cellPadding: 3, textColor: DARK },
        headStyles: { fillColor: opts.primary, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }

  // Asistencia
  if (opts.showAttendance) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text('Asistencia', marginX, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(
      `Presente: ${data.attendance.presente}    Ausente: ${data.attendance.ausente}    Inasist. justificadas: ${data.attendance.justificada}    Total: ${data.attendance.total}    Tasa: ${data.attendance.tasa}%`,
      marginX,
      y
    );
    y += 10;
  }

  // Resumen
  const passing = data.summary.estadoGlobal === 'Aprobado';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...(passing ? GREEN : RED));
  doc.text(`Promedio General: ${data.summary.promedioGeneral.toFixed(2)} (${data.summary.estadoGlobal})`, marginX, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    `Escala de calificación: 0 - ${data.summary.escalaMaxima}    Nota mínima de aprobación: ${data.summary.notaMinimaAprobacion}`,
    marginX,
    y
  );

  // Pie
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...LINE);
  doc.line(marginX, pageHeight - 16, pageWidth - marginX, pageHeight - 16);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(
    `${data.institution.nombre} · Generado el ${fecha} · Documento generado automáticamente, no requiere firma.`,
    marginX,
    pageHeight - 10
  );

  doc.save(reportFileName(data, 'pdf'));
}
