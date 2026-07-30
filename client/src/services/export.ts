import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Row = (string | number | boolean)[];

interface ExportTable {
  title: string;
  headers: string[];
  rows: Row[];
  fileName: string;
}

function formatRows(rows: Row[]): string[][] {
  return rows.map(r => r.map(cell => String(cell)));
}

export function exportToPDF({ title, headers, rows, fileName }: ExportTable) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 20);
  autoTable(doc, {
    head: [headers],
    body: formatRows(rows),
    startY: 28,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  doc.save(`${fileName}.pdf`);
}

export function exportToExcel({ title, headers, rows, fileName }: ExportTable) {
  const data = [headers, ...formatRows(rows)];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

interface BoletinMateria {
  nombre: string;
  evaluaciones: number;
  promedio: number;
  estado: string;
}

interface BoletinData {
  institucion: string;
  estudiante: string;
  identificacion: string;
  grado: string;
  edad: number | string;
  genero: string;
  materias: BoletinMateria[];
  promedioGeneral: number | string;
  notaMinima: number;
  asistenciaTasa: number;
  ausencias: number;
  tardanzas: number;
  fileName: string;
}

export function exportBoletinToExcel(data: BoletinData) {
  const aoa: (string | number)[][] = [
    [`Boletín Informativo - ${data.institucion}`],
    [],
    ['Estudiante', data.estudiante],
    ['Identificación', data.identificacion],
    ['Grado', data.grado],
    ['Edad', data.edad],
    ['Género', data.genero],
    [],
    ['Materia', 'Evaluaciones', 'Promedio', 'Estado'],
    ...data.materias.map(m => [m.nombre, m.evaluaciones, m.promedio, m.estado]),
    [],
    ['Promedio General', data.promedioGeneral],
    [],
    ['Asistencia'],
    ['Tasa de Asistencia (%)', data.asistenciaTasa],
    ['Ausencias', data.ausencias],
    ['Tardanzas', data.tardanzas],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Boletín');
  XLSX.writeFile(wb, `${data.fileName}.xlsx`);
}

const PRIMARY: [number, number, number] = [79, 70, 229];
const GREEN: [number, number, number] = [16, 185, 129];
const RED: [number, number, number] = [239, 68, 68];
const GRAY_TEXT: [number, number, number] = [107, 114, 128];
const DARK_TEXT: [number, number, number] = [31, 41, 55];
const LINE: [number, number, number] = [226, 232, 240];

export function exportBoletinToPDF(data: BoletinData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 18;

  // Header
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(data.institucion, marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Boletín Informativo de Calificaciones', marginX, y + 7);

  // Student info
  y = 40;
  doc.setTextColor(...DARK_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(data.estudiante, marginX, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    `Identificación: ${data.identificacion}    Grado: ${data.grado}    Edad: ${data.edad} años    Género: ${data.genero}`,
    marginX,
    y
  );

  y += 5;
  doc.setDrawColor(...LINE);
  doc.line(marginX, y, pageWidth - marginX, y);

  // Grades table
  y += 8;
  if (data.materias.length === 0) {
    doc.setTextColor(...GRAY_TEXT);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Sin notas registradas para este estudiante.', marginX, y);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Materia', 'Evaluaciones', 'Promedio', 'Estado']],
      body: data.materias.map(m => [m.nombre, String(m.evaluaciones), String(m.promedio), m.estado]),
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 9.5, cellPadding: 4, textColor: DARK_TEXT },
      headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
      didParseCell: hook => {
        if (hook.section === 'body' && hook.column.index === 3) {
          const isPass = hook.cell.raw === 'Aprobado';
          hook.cell.styles.textColor = isPass ? GREEN : RED;
          hook.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // Summary
  const passing = Number(data.promedioGeneral) >= data.notaMinima;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...(passing ? GREEN : RED));
  doc.text(`Promedio General: ${data.promedioGeneral} (${passing ? 'Aprobado' : 'Reprobado'})`, marginX, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    `Asistencia: ${data.asistenciaTasa}%    Ausencias: ${data.ausencias}    Tardanzas: ${data.tardanzas}`,
    marginX,
    y
  );

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...LINE);
  doc.line(marginX, pageHeight - 16, pageWidth - marginX, pageHeight - 16);
  doc.setTextColor(...GRAY_TEXT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`${data.institucion} · Generado el ${fecha} · Documento generado automáticamente, no requiere firma.`, marginX, pageHeight - 10);

  doc.save(`${data.fileName}.pdf`);
}
