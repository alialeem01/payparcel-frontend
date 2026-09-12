export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Opens a new tab and writes a full HTML document into it, then triggers
// print via the document's own onload script. Deliberately does NOT pass
// 'noopener'/'noreferrer' - those make window.open() return null in every
// browser, which would make it impossible to write anything into the new
// tab. Safe here since the window only ever receives our own trusted HTML,
// never navigates to an external URL.
export function openPrintDocument(html: string): void {
  const printWin = window.open('', '_blank')
  if (printWin) {
    printWin.document.open()
    printWin.document.write(html)
    printWin.document.close()
  }
}
