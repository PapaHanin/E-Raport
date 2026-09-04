import { Student, MataPelajaran, NilaiSiswaMapel, RaporSiswaDetail, SchoolProfile, ClassLevel, P5Project, P5StudentScore } from '../types';

export type PrintPaperSize = 'F4';

/**
 * Builds standard CSS styles to be injected into printable documents (Strictly F4 / Folio: 215mm x 330mm)
 */
export function getPrintDocumentStyles(paperSize: PrintPaperSize = 'F4'): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap');
    
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      line-height: 1.35;
      font-size: 11px;
    }

    .no-print-toolbar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #1e1b4b;
      color: white;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .no-print-toolbar h1 {
      font-size: 14px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-print {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-print:hover {
      background: #4338ca;
    }

    .btn-close {
      background: #334155;
      color: #f8fafc;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-close:hover {
      background: #475569;
    }

    .print-sheet-container {
      max-width: 860px;
      margin: 24px auto;
      padding: 0 12px 40px;
    }

    .rapor-page {
      background: white;
      color: #0f172a;
      padding: 28px 36px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      position: relative;
    }

    .page-break {
      page-break-after: always !important;
      break-after: page !important;
      height: 0;
      display: block;
      margin: 0;
      padding: 0;
      border: none;
    }

    .break-inside-avoid,
    .page-break-inside-avoid {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    table th, table td {
      padding: 5px 8px;
      vertical-align: top;
    }

    tr, td, th {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .border-table th, .border-table td {
      border: 1px solid #64748b;
    }

    .border-table th {
      background-color: #f1f5f9 !important;
      font-weight: 700;
      text-align: center;
    }

    @media print {
      @page {
        size: 215mm 330mm;
        margin: 8mm 12mm 8mm 12mm;
      }

      body {
        background-color: white !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .no-print-toolbar, .print\\:hidden, #pinned-sidebar-navigation, #app-main-header, footer {
        display: none !important;
      }

      .print-sheet-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .rapor-page {
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin-bottom: 0 !important;
      }

      .break-inside-avoid,
      .page-break-inside-avoid {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  `;
}

/**
 * Triggers printing via a clean, isolated popup window or tab.
 * This completely bypasses iframe print security restrictions in AI Studio.
 */
export function openPrintWindow(
  htmlContent: string,
  documentTitle: string = 'Laporan Hasil Belajar Siswa',
  paperSize: PrintPaperSize = 'F4'
): boolean {
  try {
    const printWindow = window.open('', '_blank', 'width=950,height=900,menubar=no,toolbar=no,location=no,status=no');
    
    if (!printWindow) {
      return false; // Popup blocked
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <style>
          ${getPrintDocumentStyles(paperSize)}
        </style>
      </head>
      <body>
        <div class="no-print-toolbar">
          <h1>
            <span>📄</span>
            <span>${documentTitle}</span>
          </h1>
          <div class="toolbar-actions">
            <button onclick="window.print()" class="btn-print">
              🖨️ Cetak / Simpan PDF
            </button>
            <button onclick="window.close()" class="btn-close">
              ✕ Tutup
            </button>
          </div>
        </div>

        <div class="print-sheet-container">
          ${htmlContent}
        </div>

        <script>
          // Automatically focus and prompt print dialog after content renders
          window.addEventListener('load', () => {
            setTimeout(() => {
              window.print();
            }, 600);
          });
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    return true;
  } catch (err) {
    console.error('Failed to open print window:', err);
    return false;
  }
}

/**
 * Downloads a standalone, styled HTML document of the report that can be opened and printed anywhere.
 */
export function downloadReportAsHtmlFile(
  htmlContent: string,
  filename: string = 'Rapor_Siswa.html',
  documentTitle: string = 'Laporan Hasil Belajar (e-Rapor Merdeka)',
  paperSize: PrintPaperSize = 'F4'
): void {
  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    ${getPrintDocumentStyles(paperSize)}
  </style>
</head>
<body>
  <div class="no-print-toolbar">
    <h1>
      <span>📄</span>
      <span>${documentTitle}</span>
    </h1>
    <div class="toolbar-actions">
      <button onclick="window.print()" class="btn-print">
        🖨️ Cetak / Simpan PDF
      </button>
    </div>
  </div>

  <div class="print-sheet-container">
    ${htmlContent}
  </div>

  <script>
    // Prompt print dialog when file is opened
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.html') ? filename : `${filename}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
