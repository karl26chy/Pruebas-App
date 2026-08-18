import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AcademicYearReportData, ReportConfig, ReportYearSubject } from '../types';
import { mergeConfig, reportFileName } from '../template';

const DARK = [31, 41, 55] as [number, number, number];
const GRAY = [107, 114, 128] as [number, number, number];
const GREEN = [16, 185, 129] as [number, number, number];
const RED = [239, 68, 68] as [number, number, number];
const LINE = [226, 232, 240] as [number, number, number];

const num = (v: number | null | undefined) => (v === null || v === undefined ? '—' : v.toFixed(2));
const gradeLabelOf = (data: AcademicYearReportData) =>
  data.grade ? `${data.grade.nombre} "${data.grade.tipo_grado}"` : 'Sin asignar';

function subjectRow(s: ReportYearSubject, showTeacher: boolean): (string | number)[] {
  const cells: (string | number)[] = [s.materia];
  if (showTeacher) cells.push(s.docente || '—');
  for (const b of s.porPeriodo) cells.push(`${num(b.valoracion)}${b.desempeno ? ` (${b.desempeno})` : ''}`);
  cells.push(`${num(s.definitiva)}${s.desempenoDefinitiva ? ` (${s.desempenoDefinitiva})` : ''}`);
  return cells;
}

/** Plantilla DEFAULT del boletín anual en PDF (genérica, datos dinámicos). */
export function renderBoletinPDF(data: AcademicYearReportData, config: ReportConfig | null) {
  const opts = mergeConfig(config);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 18;

  doc.setFillColor(...opts.primary);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(data.institution.nombre, marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Boletín de Calificaciones — Año ${data.year}`, marginX, y + 7);

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

  y += 8;
  const head: string[] = ['Materia'];
  if (opts.showTeacher) head.push('Docente');
  for (const p of data.periods) head.push(`P${p.period.numero}`);
  head.push('Definitiva');

  autoTable(doc, {
    startY: y,
    head: [head],
    body: data.subjects.map(s => subjectRow(s, opts.showTeacher)),
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8.5, cellPadding: 3, textColor: DARK },
    headStyles: { fillColor: opts.primary, textColor: 255, fontStyle: 'bold' },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

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

  const pg = data.summary.promedioGeneralDefinitivo;
  const aprobado = data.summary.desempenoGlobal !== 'Z';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...(aprobado ? GREEN : RED));
  doc.text(`Promedio General Definitivo: ${num(pg)} (${data.summary.desempenoGlobal || 'Sin notas'})`, marginX, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    `Escala de calificación: 0 - ${data.summary.escalaMaxima}    Nota mínima de aprobación: ${data.summary.notaMinimaAprobacion}`,
    marginX,
    y
  );

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...LINE);
  doc.line(marginX, pageHeight - 16, pageWidth - marginX, pageHeight - 16);
  doc.setTextColor(...GRAY);
  doc.setFontSize(7.5);
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(
    `${data.institution.nombre} · Generado el ${fecha} · Documento generado automáticamente, no requiere firma.`,
    marginX,
    pageHeight - 10
  );

  doc.save(reportFileName(data, 'pdf'));
}
