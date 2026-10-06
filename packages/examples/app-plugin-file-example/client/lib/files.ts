import type { FileRecord } from '@nocobase/app-plugin-file/client';

import { isActiveMarkupMimeType } from './mime.js';
import { resolveOfficeOpenXmlFormat } from './office-format.js';

export type FilePreviewKind =
  'image' | 'pdf' | 'text' | 'audio' | 'video' | 'ooxml' | 'unsupported';

const ACTIVE_EXTENSIONS: ReadonlySet<string> = new Set([
  '.htm',
  '.html',
  '.svg',
  '.xhtml',
  '.xml',
]);

export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot < 0 ? '' : filename.slice(dot).toLowerCase();
}

function mimeType(file: FileRecord): string {
  return file.mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

/** SVG, HTML and XML are active content and are never rendered inline. */
export function isSafeImage(file: FileRecord): boolean {
  const type = mimeType(file);
  return (
    type.startsWith('image/') &&
    type !== 'image/svg+xml' &&
    !ACTIVE_EXTENSIONS.has(fileExtension(file.filename))
  );
}

export function previewKind(file: FileRecord): FilePreviewKind {
  const type = mimeType(file);
  const extension = fileExtension(file.filename);
  if (ACTIVE_EXTENSIONS.has(extension) || isActiveMarkupMimeType(type))
    return 'unsupported';
  if (resolveOfficeOpenXmlFormat(file)) return 'ooxml';
  if (isSafeImage(file)) return 'image';
  if (type === 'application/pdf' || extension === '.pdf') return 'pdf';
  if (type.startsWith('audio/')) return 'audio';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('text/') || type === 'application/json') return 'text';
  return 'unsupported';
}

export function formatBytes(size: string | number): string {
  const bytes = typeof size === 'number' ? size : Number(size);
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

/** Native accept rules: a wildcard, a mime type, a type prefix or a suffix. */
export function acceptsFile(file: File, rules: readonly string[]): boolean {
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  return rules.some((rule) => {
    const value = rule.trim().toLowerCase();
    if (value === '*' || value === '*/*') return true;
    return value.endsWith('/*')
      ? file.type.toLowerCase().startsWith(value.slice(0, -1))
      : value.startsWith('.')
        ? name.endsWith(value)
        : file.type.toLowerCase() === value;
  });
}
