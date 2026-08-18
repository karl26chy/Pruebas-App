import jsPDF from 'jspdf';
import autoTable, { type CellInput } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { AcademicYearReportData, ReportConfig } from '../types';
import { mergeConfig, reportFileName, configText } from '../template';

/**
 * Plantilla INSTITUCIONAL "liceo_alegre_juventud".
 *
 * EL DISEÑO ES FIJO, EL CONTENIDO ES DINÁMICO:
 *  · materias  → AcademicYearReportData.subjects (materias del grado del estudiante);
 *  · períodos  → AcademicYearReportData.periods (los que existan en el año);
 *  · notas/desempeño/asistencia → vienen del backend (AcademicYearReportData).
 * Nada está hardcodeado. Si se agrega una materia o un período en el sistema,
 * el boletín se adapta sin tocar este código.
 */

const GOLD: [number, number, number] = [136, 112, 48];
const INK: [number, number, number] = [48, 48, 48];
const GRAY: [number, number, number] = [110, 110, 110];

const num = (v: number | null | undefined) => (v === null || v === undefined ? '—' : Number(v).toFixed(2));
const nint = (v: number | null | undefined) => (v === null || v === undefined ? '—' : String(v));

async function loadLogo(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return `data:${res.headers.get('content-type') || 'image/png'};base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

/** Bandas S/A/B/Z escaladas a la escala de la institución (factor escala/5). */
function bands(escalaMaxima: number) {
  const k = (escalaMaxima || 5) / 5;
  const r = (x: number) => Math.round(x * 10) / 10;
  return {
    s0: r(4.6 * k), s1: r(5 * k),
    a0: r(4.0 * k), a1: r(4.5 * k),
    b0: r(3.0 * k), b1: r(3.9 * k),
    z0: 0, z1: r(2.9 * k),
  };
}

const periodoHeader = (p: AcademicYearReportData['periods'][number]) =>
  (String(p.period.nombre || '').toUpperCase().trim()) || `PERIODO ${p.period.numero}`;

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

export async function renderLiceoPDF(data: AcademicYearReportData, config: ReportConfig | null) {
  const opts = mergeConfig(config);
  const primary = opts.primary || GOLD;
  const secondary = opts.secondary || INK;
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const usableW = pageW - marginX * 2;

  const logoUrl = config?.logo_url || null;
  let logoData: string | null = null;
  if (logoUrl && opts.showLogo) logoData = await loadLogo(logoUrl);

  // --- Franja superior institucional ---
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, 6, 'F');

  let y = 10;

  // --- Logo (centrado, proporcional) ---
  if (logoData) {
    const logoH = 15;
    const logoW = (logoH * 1368) / 205; // proporción del logo real
    const lx = (pageW - Math.min(logoW, usableW)) / 2;
    doc.addImage(logoData, 'PNG', lx, y, Math.min(logoW, usableW), logoH);
    y += logoH + 2;
  }

  // --- Nombre de la institución + título ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...secondary);
  doc.text(data.institution.nombre.toUpperCase(), pageW / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(11);
  doc.text(`INFORME ACADEMICO Y CONVIVENCIAL ${data.year}`, pageW / 2, y, { align: 'center' });
  y += 3;
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.8);
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;

  // --- Datos del estudiante ---
  const gradeLabel = data.grade ? `${data.grade.nombre} "${data.grade.tipo_grado}"` : 'Sin asignar';
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...secondary);
  const izquierda = [
    `ESTUDIANTE: ${data.student.nombre} ${data.student.apellido}`,
    `IDENTIFICACIÓN: ${data.student.tipo_documento || ''} ${data.student.identificacion || ''}`.replace(/\s+/g, ' ').trim(),
    `GRADO: ${gradeLabel}`,
  ];
  for (const line of izquierda) {
    doc.text(line, marginX, y);
    y += 5;
  }
  const derecha = [`AÑO: ${data.year}`, `GENERADO: ${fecha}`];
  let dy = y - (izquierda.length + 1) * 5;
  for (const line of derecha) {
    doc.text(line, pageW - marginX, dy, { align: 'right' });
    dy += 5;
  }
  y += 3;

  // --- Tabla académica (columnas dinámicas) ---
  const N = data.periods.length;

  // Encabezado plano: la celda F de cada período lleva el nombre del período.
  const head: CellInput[] = ['AREAS'];
  for (const p of data.periods) {
    head.push(`${periodoHeader(p)}\nF`, 'V', 'D');
  }
  head.push('Definitiva');

  const body: CellInput[][] = data.subjects.map(s => {
    const row: CellInput[] = [s.materia];
    for (const b of s.porPeriodo) {
      row.push(nint(b.fallas));
      row.push(num(b.valoracion));
      row.push(b.desempeno || '—');
    }
    row.push(num(s.definitiva));
    return row;
  });

  const foot: CellInput[][] = [['PROMEDIO']];
  for (let i = 0; i < N; i++) {
    const prom = data.summary.promediosPeriodo[i];
    foot[0].push('', num(prom), data.summary.desempenosPeriodo[i] || '—');
  }
  foot[0].push(num(data.summary.promedioGeneralDefinitivo));

  const columnStyles: { [key: string]: { halign: 'left' | 'center' } } = { 0: { halign: 'left' } };
  for (let i = 1; i < 1 + N * 3; i++) columnStyles[i] = { halign: 'center' };
  columnStyles[1 + N * 3] = { halign: 'center' };

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    foot,
    margin: { left: marginX, right: marginX },
    tableWidth: usableW,
    styles: { fontSize: 6.8, cellPadding: 1.2, cellWidth: 'auto', overflow: 'ellipsize', textColor: secondary, lineColor: [180, 180, 180], lineWidth: 0.2 },
    headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', halign: 'center' },
    footStyles: { fillColor: [235, 230, 215], textColor: secondary, fontStyle: 'bold', halign: 'center' },
    columnStyles,
    didParseCell: hook => {
      if (hook.section === 'foot' && hook.column.index === 1 + N * 3) {
        hook.cell.styles.halign = 'center';
      }
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // --- Asistencia (resumen anual) ---
  if (opts.showAttendance) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primary);
    doc.text('ASISTENCIA', marginX, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondary);
    doc.text(
      `Presente: ${data.attendance.presente}    Ausente: ${data.attendance.ausente}    Inasist. justificadas: ${data.attendance.justificada}    Total: ${data.attendance.total}    Tasa: ${data.attendance.tasa}%`,
      marginX,
      y
    );
    y += 5;
    const conAsistencia = data.subjects.filter(s => s.porPeriodo.some(b => b.fallas !== null || b.justificadas !== null));
    if (conAsistencia.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Materia', 'Fallas', 'Justificadas']],
        body: conAsistencia.map(s => [
          s.materia,
          String(s.porPeriodo.reduce((a, b) => a + (b.fallas || 0), 0)),
          String(s.porPeriodo.reduce((a, b) => a + (b.justificadas || 0), 0)),
        ]),
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 7.5, cellPadding: 1.5, textColor: secondary },
        headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 80, halign: 'left' }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 40, halign: 'center' } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
    }
  }

  // --- Observación, director de grupo, rectora ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...secondary);
  doc.text(`OBSERVACIÓN DEL ESTUDIANTE: ${configText(config, 'observacion', '')}`, marginX, y);
  y += 5.5;
  doc.text(`DIRECTOR DE GRUPO: ${configText(config, 'directorDeGrupo', '')}`, marginX, y);
  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.text(`RECTORA: ${configText(config, 'rectora', '')}`, marginX, y);
  y += 7;

  // --- Escala de evaluación (dinámica según escala_maxima) ---
  const b = bands(data.summary.escalaMaxima);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...GRAY);
  doc.text(
    `Escala de Evaluación Académica: S= Superior ${b.s0} a ${b.s1} ; A= Alto ${b.a0} a ${b.a1} ; B= Básico ${b.b0} a ${b.b1} ; Z= Bajo ${b.z0} a ${b.z1}`,
    marginX,
    y
  );
  y += 4;
  doc.text('F= Fallas    V= Valoración    D= Desempeño', marginX, y);

  // --- Promedio general definitivo ---
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...secondary);
  doc.text(
    `Promedio General Definitivo: ${num(data.summary.promedioGeneralDefinitivo)} (${data.summary.desempenoGlobal || 'Sin notas'})`,
    marginX,
    y
  );

  // --- Firmas ---
  const fy = pageH - 22;
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.3);
  doc.line(marginX, fy, marginX + 70, fy);
  doc.line(pageW - marginX - 70, fy, pageW - marginX, fy);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Rectora', marginX + 25, fy + 5);
  doc.text('Director de Grupo', pageW - marginX - 45, fy + 5);

  // --- Pie ---
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.6);
  doc.line(marginX, pageH - 12, pageW - marginX, pageH - 12);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(
    `${data.institution.nombre} · Generado el ${fecha} · Documento generado automáticamente, no requiere firma.`,
    pageW / 2,
    pageH - 7,
    { align: 'center' }
  );

  doc.save(reportFileName(data, 'pdf'));
}

// ---------------------------------------------------------------------------
// Excel
// ---------------------------------------------------------------------------

export function renderLiceoExcel(data: AcademicYearReportData, config: ReportConfig | null) {
  const gradeLabel = data.grade ? `${data.grade.nombre} "${data.grade.tipo_grado}"` : 'Sin asignar';

  const aoa: (string | number)[][] = [
    [data.institution.nombre.toUpperCase()],
    [`INFORME ACADEMICO Y CONVIVENCIAL ${data.year}`],
    [],
    ['ESTUDIANTE', `${data.student.nombre} ${data.student.apellido}`],
    ['IDENTIFICACIÓN', `${data.student.tipo_documento || ''} ${data.student.identificacion || ''}`.trim()],
    ['GRADO', gradeLabel],
    ['AÑO', data.year],
    [],
  ];

  const head: (string | number)[] = ['AREAS'];
  for (const p of data.periods) head.push(`${periodoHeader(p)} (F/V/D)`);
  head.push('Definitiva');
  aoa.push(head);

  for (const s of data.subjects) {
    const row: (string | number)[] = [s.materia];
    for (const b of s.porPeriodo) {
      row.push(
        b.valoracion === null
          ? '—'
          : `F:${b.fallas ?? '—'} V:${b.valoracion} D:${b.desempeno || '—'}`
      );
    }
    row.push(s.definitiva === null ? '—' : `${s.definitiva} ${s.desempenoDefinitiva || ''}`.trim());
    aoa.push(row);
  }

  const promRow: (string | number)[] = ['PROMEDIO'];
  for (const p of data.summary.promediosPeriodo) promRow.push(p === null ? '—' : p);
  promRow.push(data.summary.promedioGeneralDefinitivo ?? '—');
  aoa.push(promRow);

  aoa.push(
    [],
    ['ASISTENCIA'],
    ['Presente', data.attendance.presente],
    ['Ausente', data.attendance.ausente],
    ['Inasist. justificadas', data.attendance.justificada],
    ['Total', data.attendance.total],
    ['Tasa (%)', data.attendance.tasa],
    [],
    ['OBSERVACIÓN DEL ESTUDIANTE', configText(config, 'observacion', '')],
    ['DIRECTOR DE GRUPO', configText(config, 'directorDeGrupo', '')],
    ['RECTORA', configText(config, 'rectora', '')],
    [],
    ['Escala de Evaluación Académica', `S= Superior ${bands(data.summary.escalaMaxima).s0} a ${bands(data.summary.escalaMaxima).s1} ; A= Alto ${bands(data.summary.escalaMaxima).a0} a ${bands(data.summary.escalaMaxima).a1} ; B= Básico ${bands(data.summary.escalaMaxima).b0} a ${bands(data.summary.escalaMaxima).b1} ; Z= Bajo ${bands(data.summary.escalaMaxima).z0} a ${bands(data.summary.escalaMaxima).z1}`],
    ['Leyenda', 'F= Fallas    V= Valoración    D= Desempeño'],
    [],
    ['Rectora', 'Director de Grupo'],
  );

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 38 }, { wch: 26 }, { wch: 14 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Boletín');
  XLSX.writeFile(wb, reportFileName(data, 'xlsx'));
}
