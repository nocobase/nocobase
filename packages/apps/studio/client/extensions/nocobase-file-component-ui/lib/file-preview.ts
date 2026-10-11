import type { FileRecord } from '@nocobase/app-plugin-file/client';

export type FilePreviewKind =
  | 'image'
  | 'pdf'
  | 'audio'
  | 'video'
  | 'text'
  | 'markdown'
  | 'ooxml'
  | 'office'
  | 'unsupported';

export type OfficeOpenXmlFormat = 'docx' | 'xlsx' | 'pptx';

const ACTIVE_MIME_TYPES: ReadonlySet<string> = new Set([
  'application/xhtml+xml',
  'application/xml',
  'image/svg+xml',
  'text/html',
  'text/xml',
]);
const ACTIVE_EXTENSIONS: ReadonlySet<string> = new Set([
  '.htm',
  '.html',
  '.svg',
  '.xhtml',
  '.xml',
]);
const OFFICE_OPEN_XML_EXTENSIONS: Readonly<
  Record<string, OfficeOpenXmlFormat>
> = {
  '.docx': 'docx',
  '.pptx': 'pptx',
  '.xlsx': 'xlsx',
};
const OFFICE_OPEN_XML_MIME_TYPES: Readonly<
  Record<string, OfficeOpenXmlFormat>
> = {
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
};
const OFFICE_EXTENSIONS: ReadonlySet<string> = new Set([
  '.doc',
  '.odf',
  '.odg',
  '.odm',
  '.odp',
  '.ods',
  '.odt',
  '.otg',
  '.oth',
  '.otp',
  '.ots',
  '.ott',
  '.ppt',
  '.xls',
]);
const OFFICE_MIME_TYPES: ReadonlySet<string> = new Set([
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.oasis.opendocument.formula',
  'application/vnd.oasis.opendocument.graphics',
  'application/vnd.oasis.opendocument.graphics-template',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.presentation-template',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.spreadsheet-template',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.text-master',
  'application/vnd.oasis.opendocument.text-template',
]);

export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot < 0 ? '' : filename.slice(dot).toLowerCase();
}

export function isSafeImagePreview(file: FileRecord): boolean {
  const mimeType = file.mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  return (
    mimeType.startsWith('image/') &&
    mimeType !== 'image/svg+xml' &&
    !ACTIVE_EXTENSIONS.has(fileExtension(file.filename))
  );
}

export function resolveOfficeOpenXmlFormat(
  file: FileRecord,
): OfficeOpenXmlFormat | undefined {
  const mimeType = file.mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  const extension = fileExtension(file.filename);
  if (
    ACTIVE_MIME_TYPES.has(mimeType) ||
    mimeType.endsWith('+xml') ||
    ACTIVE_EXTENSIONS.has(extension) ||
    OFFICE_EXTENSIONS.has(extension)
  ) {
    return undefined;
  }

  const extensionFormat = OFFICE_OPEN_XML_EXTENSIONS[extension];
  if (extensionFormat) return extensionFormat;
  return OFFICE_OPEN_XML_MIME_TYPES[mimeType];
}

export function resolveFilePreviewKind(file: FileRecord): FilePreviewKind {
  const mimeType = file.mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  const extension = fileExtension(file.filename);
  if (
    ACTIVE_MIME_TYPES.has(mimeType) ||
    mimeType.endsWith('+xml') ||
    ACTIVE_EXTENSIONS.has(extension)
  ) {
    return 'unsupported';
  }
  if (mimeType === 'text/markdown' || extension === '.md') return 'markdown';
  if (resolveOfficeOpenXmlFormat(file)) return 'ooxml';
  if (OFFICE_MIME_TYPES.has(mimeType) || OFFICE_EXTENSIONS.has(extension)) {
    return 'office';
  }
  if (isSafeImagePreview(file)) return 'image';
  if (mimeType === 'application/pdf' || extension === '.pdf') return 'pdf';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    extension === '.json'
  ) {
    return 'text';
  }
  return 'unsupported';
}

export function resolveOfficeEmbedUrl(value: string): string | undefined {
  let source: URL;
  try {
    source = new URL(value);
  } catch {
    return undefined;
  }
  if (source.protocol !== 'http:' && source.protocol !== 'https:') {
    return undefined;
  }
  if (source.username || source.password) return undefined;
  if (!isPublicOfficeHostname(source.hostname)) return undefined;
  const embed = new URL('https://view.officeapps.live.com/op/embed.aspx');
  embed.searchParams.set('src', source.toString());
  return embed.toString();
}

function isPublicOfficeHostname(hostname: string): boolean {
  const value = hostname
    .toLowerCase()
    .replace(/^\[|\]$/gu, '')
    .replace(/\.$/u, '');
  if (
    !value ||
    value === 'localhost' ||
    value.endsWith('.localhost') ||
    value.endsWith('.local') ||
    value.endsWith('.internal') ||
    value.endsWith('.lan') ||
    !value.includes('.') ||
    value === '::1' ||
    value === '0:0:0:0:0:0:0:1' ||
    value.includes(':')
  ) {
    return false;
  }
  const octets = value.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return true;
  }
  const [first = -1, second = -1] = octets;
  return !(
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}
