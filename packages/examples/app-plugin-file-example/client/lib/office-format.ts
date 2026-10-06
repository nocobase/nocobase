import type { FileRecord } from '@nocobase/app-plugin-file/client';

import { isActiveMarkupMimeType } from './mime.js';

export type OfficeOpenXmlFormat = 'docx' | 'xlsx' | 'pptx';

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

export function resolveOfficeOpenXmlFormat(
  file: FileRecord,
): OfficeOpenXmlFormat | undefined {
  const mimeType = file.mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  const dot = file.filename.lastIndexOf('.');
  const extension = dot < 0 ? '' : file.filename.slice(dot).toLowerCase();
  if (
    isActiveMarkupMimeType(mimeType) ||
    ACTIVE_EXTENSIONS.has(extension) ||
    OFFICE_EXTENSIONS.has(extension)
  ) {
    return undefined;
  }

  const extensionFormat = OFFICE_OPEN_XML_EXTENSIONS[extension];
  if (extensionFormat) return extensionFormat;
  return OFFICE_OPEN_XML_MIME_TYPES[mimeType];
}
