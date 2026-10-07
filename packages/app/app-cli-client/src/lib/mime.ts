// A file's media type from its extension, for files the CLI uploads: the server keeps the type it is sent, and a
// browser previews a screenshot only when it is sent as an image.
import path from 'node:path';

const TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  txt: 'text/plain',
  log: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  html: 'text/html',
  xml: 'application/xml',
  yaml: 'application/yaml',
  yml: 'application/yaml',
  zip: 'application/zip',
  gz: 'application/gzip',
  tgz: 'application/gzip',
  har: 'application/json',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/** The media type of `file` by its extension; `application/octet-stream` when it has none the CLI knows. */
export function mediaTypeOf(file: string): string {
  const ext = path.extname(file).slice(1).toLowerCase();
  return TYPES[ext] ?? 'application/octet-stream';
}
