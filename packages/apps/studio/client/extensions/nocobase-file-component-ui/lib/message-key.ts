// Built-in errors remain readable when passed between Registry components.
const messageKeys = new Map<string, string>([
  ['File upload failed.', 'uploadFailed'],
  ['The maximum number of files has been reached.', 'fileLimitReached'],
  ['File exceeds the maximum size.', 'fileTooLarge'],
  ['File type is not allowed.', 'fileTypeNotAllowed'],
  ['File removal failed.', 'removalFailed'],
  ['File URL is not allowed.', 'urlNotAllowed'],
  ['File download failed.', 'downloadFailed'],
  ['File URL is missing or not allowed.', 'invalidUrl'],
  ['Unable to load the PDF preview.', 'pdfPreviewFailed'],
  ['Unable to load the file preview.', 'previewFailed'],
]);

export function messageKey(message: string): string {
  return messageKeys.get(message) ?? message;
}
