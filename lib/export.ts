import { SableDocument } from './types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'document'
  );
}

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildStyledHTML(doc: SableDocument, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(doc.title)}</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      max-width: 720px;
      margin: 0 auto;
      padding: 2rem 2rem 4rem;
      line-height: 1.8;
      color: #2D3436;
      background: #ffffff;
    }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; line-height: 1.2; }
    h2 { font-size: 1.75rem; margin-top: 2rem; margin-bottom: 1rem; }
    h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
    p { margin-bottom: 1.5rem; }
    blockquote {
      border-left: 4px solid #A7F3D0;
      padding-left: 1rem;
      margin: 1.5rem 0;
      color: #636e72;
    }
    code {
      background: #f1f3f4;
      padding: 0.15em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background: #f1f3f4;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code { background: none; padding: 0; }
    mark { background-color: #FDBA74; padding: 0.1em 0.2em; border-radius: 2px; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    ul, ol { padding-left: 1.5rem; margin-bottom: 1.5rem; }
    li { margin-bottom: 0.5rem; }
    hr { border: none; border-top: 2px solid #e0e0e0; margin: 2rem 0; }
    a { color: #13ec75; text-decoration: underline; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

export function exportHTML(doc: SableDocument, html: string): void {
  const fullHtml = buildStyledHTML(doc, `<h1>${escapeHtml(doc.title)}</h1>\n${html}`);
  downloadBlob(fullHtml, `${sanitizeFilename(doc.title)}.html`, 'text/html;charset=utf-8');
}

export async function exportMarkdown(doc: SableDocument, html: string): Promise<void> {
  const { default: TurndownService } = await import('turndown');
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
  const body = td.turndown(html);
  const markdown = `# ${doc.title}\n\n${body}`;
  downloadBlob(markdown, `${sanitizeFilename(doc.title)}.md`, 'text/markdown;charset=utf-8');
}

export async function exportZine(doc: SableDocument, html: string): Promise<void> {
  const sections = html
    .replace(/<hr\s*\/?>/gi, '---PAGE-BREAK---')
    .split('---PAGE-BREAK---')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const pages: string[] = [];

  pages.push(`
    <div class="zine-page zine-cover">
      <div class="zine-corner zine-corner-tl"></div>
      <div class="zine-corner zine-corner-tr"></div>
      <div class="zine-corner zine-corner-bl"></div>
      <div class="zine-corner zine-corner-br"></div>
      <div class="cover-inner">
        <div class="cover-rule"></div>
        <h1 class="cover-title">${escapeHtml(doc.title)}</h1>
        <div class="cover-rule"></div>
        <p class="cover-tagline">a zine</p>
      </div>
    </div>
  `);

  sections.forEach((section, i) => {
    pages.push(`
      <div class="zine-page">
        <div class="page-header">
          <span class="page-header-title">${escapeHtml(doc.title)}</span>
        </div>
        <div class="page-content">${section}</div>
        <div class="page-footer">
          <span class="page-number">${i + 1}</span>
        </div>
      </div>
    `);
  });

  pages.push(`
    <div class="zine-page zine-instructions">
      <div class="zine-corner zine-corner-tl"></div>
      <div class="zine-corner zine-corner-br"></div>
      <h2 class="inst-title">How to fold your zine</h2>
      <ol class="inst-list">
        <li>Print all pages double-sided on A4 paper</li>
        <li>Fold each sheet in half (portrait)</li>
        <li>Stack sheets in order and staple the spine</li>
        <li>Enjoy your handmade publication!</li>
      </ol>
      <p class="inst-foot">Made with Sable</p>
    </div>
  `);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(doc.title)} \u2014 Zine</title>
  <style>
    @page { size: A6; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: white; }
    .zine-page {
      width: 105mm; min-height: 148mm; padding: 10mm 11mm;
      page-break-after: always; break-after: page;
      position: relative; background: white; overflow: hidden;
      display: flex; flex-direction: column;
    }
    .zine-page::before {
      content: ''; position: absolute; inset: 3mm;
      border: 1px dashed rgba(45,52,54,0.18); pointer-events: none;
    }
    .zine-cover { justify-content: center; align-items: center; text-align: center; gap: 4mm; }
    .zine-corner { position: absolute; width: 6mm; height: 6mm; }
    .zine-corner-tl { top: 2mm; left: 2mm; border-top: 2px solid #2D3436; border-left: 2px solid #2D3436; }
    .zine-corner-tr { top: 2mm; right: 2mm; border-top: 2px solid #2D3436; border-right: 2px solid #2D3436; }
    .zine-corner-bl { bottom: 2mm; left: 2mm; border-bottom: 2px solid #2D3436; border-left: 2px solid #2D3436; }
    .zine-corner-br { bottom: 2mm; right: 2mm; border-bottom: 2px solid #2D3436; border-right: 2px solid #2D3436; }
    .cover-inner { display: flex; flex-direction: column; align-items: center; gap: 4mm; }
    .cover-rule { width: 55%; height: 2px; background: #13ec75; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover-title { font-size: 22pt; font-weight: 700; line-height: 1.2; color: #2D3436; letter-spacing: -0.02em; }
    .cover-tagline { font-family: 'Courier New', monospace; font-size: 8pt; color: #636e72; letter-spacing: 0.15em; text-transform: uppercase; }
    .page-header { display: flex; justify-content: center; padding-bottom: 3mm; margin-bottom: 3mm; border-bottom: 1px solid rgba(45,52,54,0.12); flex-shrink: 0; }
    .page-header-title { font-family: 'Courier New', monospace; font-size: 6.5pt; color: #b2bec3; letter-spacing: 0.12em; text-transform: uppercase; }
    .page-content { flex: 1; font-size: 9.5pt; line-height: 1.7; color: #2D3436; overflow: hidden; }
    .page-content h1 { font-size: 14pt; font-weight: 700; margin-bottom: 3mm; line-height: 1.2; }
    .page-content h2 { font-size: 11pt; font-weight: 700; margin-bottom: 2mm; margin-top: 3mm; }
    .page-content h3 { font-size: 10pt; font-weight: 700; margin-bottom: 1.5mm; margin-top: 2.5mm; }
    .page-content p { margin-bottom: 2.5mm; }
    .page-content blockquote { border-left: 2px solid #A7F3D0; padding-left: 3mm; margin: 2mm 0 2.5mm; color: #636e72; font-style: italic; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-content ul, .page-content ol { padding-left: 5mm; margin-bottom: 2.5mm; }
    .page-content li { margin-bottom: 0.8mm; }
    .page-content mark { background: #FDBA74; padding: 0 0.5mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-content code { font-family: 'Courier New', monospace; font-size: 8pt; background: #f1f3f4; padding: 0.1em 0.3em; border-radius: 2px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-footer { display: flex; justify-content: center; padding-top: 3mm; margin-top: 3mm; border-top: 1px solid rgba(45,52,54,0.1); flex-shrink: 0; }
    .page-number { font-family: 'Courier New', monospace; font-size: 7pt; color: #b2bec3; }
    .zine-instructions { justify-content: center; gap: 5mm; }
    .inst-title { font-size: 11pt; font-weight: 700; color: #2D3436; text-align: center; margin-bottom: 2mm; }
    .inst-list { font-size: 9pt; line-height: 2; color: #2D3436; padding-left: 5mm; }
    .inst-foot { font-family: 'Courier New', monospace; font-size: 7pt; color: #b2bec3; text-align: center; margin-top: 4mm; letter-spacing: 0.12em; }
    @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  ${pages.join('\n')}
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => {
      try {
        iframe.contentWindow!.focus();
        iframe.contentWindow!.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 1000);
      } catch (e) {
        document.body.removeChild(iframe);
        reject(e);
      }
    };
    const doc2 = iframe.contentDocument!;
    doc2.open();
    doc2.write(fullHtml);
    doc2.close();
  });
}

export async function exportPDF(doc: SableDocument, html: string): Promise<void> {
  // Replace <hr> with page-break markers so chapters start on new pages
  const contentWithBreaks = html.replace(
    /<hr\s*\/?>/gi,
    '<div class="page-break"></div>'
  );

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(doc.title)}</title>
  <style>
    @page { margin: 20mm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Georgia', serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #2D3436;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1 { font-size: 24pt; margin: 0 0 1rem; line-height: 1.2; }
    h2 { font-size: 18pt; margin: 2rem 0 1rem; }
    h3 { font-size: 14pt; margin: 1.5rem 0 0.75rem; }
    p  { margin: 0 0 1.2rem; }
    blockquote { border-left: 4px solid #A7F3D0; padding-left: 1rem; margin: 1.5rem 0; color: #636e72; }
    code { background: #f1f3f4; padding: 0.1em 0.35em; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 10pt; }
    pre { background: #f1f3f4; padding: 0.75rem 1rem; border-radius: 6px; margin: 0 0 1.2rem; }
    pre code { background: none; padding: 0; }
    mark { background-color: #FDBA74; padding: 0.1em 0.2em; border-radius: 2px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    ul, ol { padding-left: 1.5rem; margin: 0 0 1.2rem; }
    li { margin-bottom: 0.4rem; }
    a { color: #13ec75; text-decoration: underline; }
    .page-break { page-break-after: always; break-after: page; height: 0; margin: 0; padding: 0; border: none; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(doc.title)}</h1>
  ${contentWithBreaks}
</body>
</html>`;

  // Use a hidden iframe so no new tab ever appears
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => {
      try {
        iframe.contentWindow!.focus();
        iframe.contentWindow!.print();
        // Remove iframe after a short delay (gives browser time to spool the print job)
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 1000);
      } catch (e) {
        document.body.removeChild(iframe);
        reject(e);
      }
    };

    const doc2 = iframe.contentDocument!;
    doc2.open();
    doc2.write(fullHtml);
    doc2.close();
  });
}
