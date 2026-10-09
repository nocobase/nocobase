/** Fold only recognizable mail history; ordinary authored blockquotes stay visible. */
export function foldMailQuotedContent(document: Document, label: string): void {
  const wrap = (nodes: readonly Node[]): void => {
    const first = nodes[0];
    if (!first?.parentNode || nodes.length === 0) return;
    const details = document.createElement('details');
    details.className = 'nocobase-mail-quoted-content';
    const summary = document.createElement('summary');
    summary.textContent = label;
    summary.style.cssText =
      'cursor:pointer;color:#666;padding:8px 0;font:14px/1.5 Arial,sans-serif';
    first.parentNode.insertBefore(details, first);
    details.append(summary, ...nodes);
  };
  const nodes = [...document.body.childNodes];
  const start = nodes.findIndex(
    (node) =>
      node.nodeType === 8 &&
      /^nocobase-mail-(?:reply|forward):start$/u.test(node.nodeValue ?? ''),
  );
  if (start >= 0) {
    const endMarker = nodes[start].nodeValue!.replace(':start', ':end');
    const end = nodes
      .map((node) => (node.nodeType === 8 ? node.nodeValue : null))
      .lastIndexOf(endMarker);
    if (end > start) {
      wrap(nodes.slice(start + 1, end));
      return;
    }
  }
  // Outlook and Thunderbird mark the beginning of a trailing history section.
  const separator = document.querySelector('#divRplyFwdMsg, .moz-cite-prefix');
  if (separator) {
    const tail: Node[] = [];
    for (let node: Node | null = separator; node; node = node.nextSibling)
      tail.push(node);
    wrap(tail);
  }
  for (const quote of document.querySelectorAll(
    '.gmail_quote, .yahoo_quoted, blockquote[type="cite"]',
  )) {
    if (!quote.closest('details.nocobase-mail-quoted-content')) wrap([quote]);
  }
}

/** Recognize conventional trailing plain-text replies without hiding the new response. */
export function splitMailQuotedText(text: string): {
  body: string;
  quote?: string;
} {
  const lines = text.split('\n');
  const start = lines.findIndex(
    (line) =>
      /^\s*>/u.test(line) ||
      /^On .+wrote:\s*$/u.test(line) ||
      /^在.+写道[：:]\s*$/u.test(line) ||
      /^-{2,}\s*(?:Original Message|Forwarded message|原始邮件|转发邮件)\s*-{2,}\s*$/iu.test(
        line,
      ),
  );
  if (start < 0) return { body: text };
  // Interleaved replies remain fully visible rather than being mistaken for history.
  if (
    lines.slice(start).some((line) => /^\s*>/u.test(line)) &&
    lines
      .slice(/^\s*>/u.test(lines[start]) ? start : start + 1)
      .some((line) => line.trim() && !/^\s*>/u.test(line))
  )
    return { body: text };
  return {
    body: lines.slice(0, start).join('\n'),
    quote: lines.slice(start).join('\n'),
  };
}
