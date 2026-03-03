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
