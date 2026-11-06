/** Formats supported by the local text extractor. Safe to import in browsers. */
export const SUPPORTED_DOCUMENT_EXTENSIONS: readonly string[] = [
  'pdf',
  'docx',
  'doc',
  'xlsx',
  'xls',
  'xlsm',
  'pptx',
  'txt',
  'md',
  'json',
  'csv',
];
export function isParsed(ext: string): boolean {
  return SUPPORTED_DOCUMENT_EXTENSIONS.includes(ext.toLowerCase());
}
