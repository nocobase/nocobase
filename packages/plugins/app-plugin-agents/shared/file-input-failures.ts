/** Public, fixed guidance only; never derive these reasons from Provider messages. */
export type FileInputFailureReason =
  | 'imageCapability'
  | 'unsupportedFormat'
  | 'formatMismatch'
  | 'invalidInline'
  | 'fileTooLarge'
  | 'inputTooLarge'
  | 'documentTooLarge'
  | 'contextTooLarge'
  | 'fileCount'
  | 'nativeFileCount'
  | 'unreadable'
  | 'extractionFailed'
  | 'extractionTimeout'
  | 'preparationFailed';

export const fileInputFailureTitles: Readonly<
  Record<FileInputFailureReason, string>
> = {
  imageCapability:
    'Image input is not configured for this model. Switch to a model with verified image support.',
  unsupportedFormat:
    'Input for this attachment format is not configured for the selected model, and no local text extractor supports it. Use a supported document format or a model with verified file support.',
  formatMismatch:
    'The attachment filename and media type describe different document formats. Check the file format and upload it again.',
  invalidInline:
    'The attached file data is invalid or too large. Upload the file again or use a smaller file.',
  fileTooLarge: 'An attachment exceeds its byte budget. Use a smaller file.',
  inputTooLarge:
    'The conversation attachments exceed the input byte budget. Use smaller files or start a new conversation.',
  documentTooLarge:
    'The attachment exceeds its extracted text budget. Use a smaller file.',
  contextTooLarge:
    'The conversation attachments exceed the extracted text budget. Use smaller files or start a new conversation.',
  fileCount:
    'The conversation exceeds the 100 file input limit. Start a new conversation.',
  nativeFileCount:
    'The conversation exceeds the configured native file limit. Use fewer attachments or convert them to a supported text document.',
  unreadable:
    'The attachment contains no readable text. Scanned documents require OCR.',
  extractionFailed:
    'The attachment text could not be extracted. Check that the document is readable and upload it again.',
  extractionTimeout:
    'Attachment text extraction timed out. Use a smaller file or try again.',
  preparationFailed:
    'The attachment could not be prepared. Check your access and the file format, then try again.',
};

export function isFileInputFailureReason(
  value: unknown,
): value is FileInputFailureReason {
  return (
    typeof value === 'string' && Object.hasOwn(fileInputFailureTitles, value)
  );
}
