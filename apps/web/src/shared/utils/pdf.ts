import { jsPDF } from "jspdf";

export function exportToPDF(title: string, headers: string[], rows: any[][], filename: string) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900 (primary text)
  doc.text(title, 14, 22);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500 (muted text)
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 29);
  
  // Draw header separator line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 34, 196, 34);
  
  let y = 46;
  
  // Draw Table Headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  
  const totalWidth = 182;
  const colWidth = totalWidth / headers.length;
  
  headers.forEach((header, i) => {
    doc.text(header.toUpperCase(), 14 + i * colWidth, y);
  });
  
  y += 5;
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(14, y, 196, y);
  y += 9;
  
  // Draw Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59); // slate-800
  
  rows.forEach((row) => {
    // If y is close to page bottom, add page and redraw headers
    if (y > 275) {
      doc.addPage();
      y = 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      headers.forEach((header, i) => {
        doc.text(header.toUpperCase(), 14 + i * colWidth, y);
      });
      y += 5;
      doc.setDrawColor(203, 213, 225);
      doc.line(14, y, 196, y);
      y += 9;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
    }
    
    row.forEach((cell, i) => {
      let cellText = String(cell ?? "");
      // Truncate text if it overflows its column slot to prevent overlap
      const maxChars = Math.floor(colWidth * 0.22);
      if (cellText.length > maxChars) {
        cellText = cellText.substring(0, maxChars - 3) + "...";
      }
      doc.text(cellText, 14 + i * colWidth, y);
    });
    
    y += 8;
  });
  
  doc.save(filename);
}
