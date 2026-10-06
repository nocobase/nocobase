const ACTIVE_MIME_TYPES: ReadonlySet<string> = new Set([
  'application/xhtml+xml',
  'application/xml',
  'image/svg+xml',
  'text/html',
  'text/xml',
]);

// Active markup runs script when a browser treats it as a document.
export function isActiveMarkupMimeType(value: string): boolean {
  const mimeType = value.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  return ACTIVE_MIME_TYPES.has(mimeType) || mimeType.endsWith('+xml');
}
