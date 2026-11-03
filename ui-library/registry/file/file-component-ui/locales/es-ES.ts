import type { FileUiResource } from './en-US.js';
const messages = {
  'files.ooxmlLoadFailed': 'No se puede procesar este archivo Office Open XML.',
  'files.ooxmlLoadTimedOut':
    'La ​​vista previa no terminó de cargarse en {{minutes}} minutos.',
  'files.previewRequestFailed':
    'La solicitud de vista previa falló ({{status}}).',
  uploadFailed: 'Falló la carga del archivo.',
  fileLimitReached: 'Se alcanzó el número máximo de archivos.',
  fileTooLarge: 'El archivo excede el tamaño máximo.',
  fileTypeNotAllowed: 'El tipo de archivo no está permitido.',
  removalFailed: 'Falló la eliminación del archivo.',
  urlNotAllowed: 'El archivo URL no está permitido.',
  downloadFailed: 'Falló la descarga del archivo.',
  invalidUrl: 'Falta el archivo URL o no está permitido.',
  pdfPreviewFailed: 'No se puede cargar la vista previa del PDF.',
  pdfPreviewMarkup: 'El archivo URL devolvió HTML o XML en lugar de un PDF.',
  previewFailed: 'No se puede cargar la vista previa del archivo.',
  'files.empty': 'Sin archivos.',
  'files.preview': 'Vista previa',
  'files.download': 'Descargar',
  'files.remove': 'Quitar',
  'files.chooseMany': 'Elegir archivos',
  'files.chooseOne': 'Elegir archivo',
  'files.retry': 'Reintentar',
  'files.done': 'Hecho',
  'files.uploading': 'Subiendo',
  'files.failed': 'Falló',
  'files.pending': 'Pendiente',
  'files.previous': 'Archivo anterior',
  'files.next': 'Siguiente archivo',
  'files.loadingPreview': 'Cargando vista previa...',
  'files.downloadFile': 'Descargar archivo',
  'files.previewUnavailable':
    'La vista previa no está disponible para este tipo de archivo.',
  'files.imageFailed':
    'Esta imagen no se pudo mostrar. Puede que esté dañado o tenga un formato no compatible.',
  'files.officeFailed': 'Office Online no pudo cargar este archivo.',
  'files.officeUrl':
    'Office Online requiere un archivo absoluto accesible desde Internet URL.',
  'files.cancelFile': 'Cancelar {{filename}}',
  'files.status.uploading': 'Subiendo',
  'files.status.pending': 'Pendiente',
  'files.status.error': 'Falló',
};

const resource: FileUiResource = { fileUi: messages };
export default resource;
