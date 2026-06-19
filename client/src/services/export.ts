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
