import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BoletinData } from './types';
import { PRIMARY, GREEN, RED, GRAY_TEXT, DARK_TEXT, LINE, ROW_ALT } from './theme';

/** Boletín informativo de calificaciones de un estudiante, en PDF. */
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
    `Documento: ${data.documento}    Grado: ${data.grado}    Edad: ${data.edad} años    Género: ${data.genero}`,
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
      alternateRowStyles: { fillColor: ROW_ALT },
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
    `Asistencia: ${data.asistenciaTasa}%    Ausencias: ${data.ausencias}    Inasist. justificadas: ${data.justificadas}`,
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
