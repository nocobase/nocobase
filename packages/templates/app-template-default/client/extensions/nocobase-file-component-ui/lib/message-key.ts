// Built-in errors remain readable when passed between Registry components.
const messageKeys = new Map<string, string>([
  ['File upload failed.', 'fileUi.uploadFailed'],
  ['The maximum number of files has been reached.', 'fileUi.fileLimitReached'],
  ['File exceeds the maximum size.', 'fileUi.fileTooLarge'],
  ['File type is not allowed.', 'fileUi.fileTypeNotAllowed'],
  ['File removal failed.', 'fileUi.removalFailed'],
  ['File URL is not allowed.', 'fileUi.urlNotAllowed'],
  ['File download failed.', 'fileUi.downloadFailed'],
  ['File URL is missing or not allowed.', 'fileUi.invalidUrl'],
  ['Unable to load the PDF preview.', 'fileUi.pdfPreviewFailed'],
  [
    'The file URL returned HTML or XML instead of a PDF.',
    'fileUi.pdfPreviewMarkup',
  ],
  ['Unable to load the file preview.', 'fileUi.previewFailed'],
]);

export function messageKey(message: string): string {
  return messageKeys.get(message) ?? message;
}
