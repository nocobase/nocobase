import type { FileUiResource } from './en-US.js';
const messages = {
  'files.ooxmlLoadFailed':
    'Diese Office Open XML-Datei kann nicht gerendert werden.',
  'files.ooxmlLoadTimedOut':
    'Die Vorschau wurde nicht innerhalb von {{minutes}} Minuten vollständig geladen.',
  'files.previewRequestFailed':
    'Vorschauanforderung fehlgeschlagen ({{status}}).',
  uploadFailed: 'Datei-Upload fehlgeschlagen.',
  fileLimitReached: 'Die maximale Anzahl an Dateien wurde erreicht.',
  fileTooLarge: 'Datei überschreitet die maximale Größe.',
  fileTypeNotAllowed: 'Dateityp ist nicht zulässig.',
  removalFailed: 'Das Entfernen der Datei ist fehlgeschlagen.',
  urlNotAllowed: 'Datei URL ist nicht zulässig.',
  downloadFailed: 'Datei-Download fehlgeschlagen.',
  invalidUrl: 'Datei URL fehlt oder ist nicht zulässig.',
  pdfPreviewFailed: 'Die PDF-Vorschau kann nicht geladen werden.',
  pdfPreviewMarkup: 'Die Datei URL gab HTML oder XML statt einer PDF zurück.',
  previewFailed: 'Die Dateivorschau konnte nicht geladen werden.',
  'files.empty': 'Keine Akten.',
  'files.preview': 'Vorschau',
  'files.download': 'Herunterladen',
  'files.remove': 'Entfernen',
  'files.chooseMany': 'Dateien auswählen',
  'files.chooseOne': 'Datei auswählen',
  'files.retry': 'Erneut versuchen',
  'files.done': 'Erledigt',
  'files.uploading': 'Hochladen',
  'files.failed': 'Fehlgeschlagen',
  'files.pending': 'Ausstehend',
  'files.previous': 'Vorherige Datei',
  'files.next': 'Nächste Datei',
  'files.loadingPreview': 'Vorschau wird geladen...',
  'files.downloadFile': 'Datei herunterladen',
  'files.previewUnavailable':
    'Die Vorschau ist für diesen Dateityp nicht verfügbar.',
  'files.imageFailed':
    'Dieses Bild konnte nicht angezeigt werden. Möglicherweise ist es beschädigt oder liegt in einem nicht unterstützten Format vor.',
  'files.officeFailed': 'Office Online konnte diese Datei nicht laden.',
  'files.officeUrl':
    'Office Online erfordert eine über das Internet zugängliche absolute Datei URL.',
  'files.cancelFile': 'Abbrechen {{filename}}',
  'files.status.uploading': 'Hochladen',
  'files.status.pending': 'Ausstehend',
  'files.status.error': 'Fehlgeschlagen',
};

const resource: FileUiResource = { fileUi: messages };
export default resource;
