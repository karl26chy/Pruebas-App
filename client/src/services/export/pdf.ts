import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRows, type ExportTable } from './types';
import { PRIMARY } from './theme';

export function exportToPDF({ title, headers, rows, fileName }: ExportTable) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 20);
  autoTable(doc, {
    head: [headers],
    body: formatRows(rows),
    startY: 28,
    styles: { fontSize: 9 },
    headStyles: { fillColor: PRIMARY },
  });
  doc.save(`${fileName}.pdf`);
}
