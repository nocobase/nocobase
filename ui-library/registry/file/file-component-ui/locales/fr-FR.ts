import type { FileUiResource } from './en-US.js';
const messages = {
  'files.ooxmlLoadFailed':
    'Impossible de restituer ce fichier Office Open XML.',
  'files.ooxmlLoadTimedOut':
    "Le chargement de l'aperçu n'a pas été terminé dans les minutes {{minutes}}.",
  'files.previewRequestFailed': "La demande d'aperçu a échoué ({{status}}).",
  uploadFailed: 'Le téléchargement du fichier a échoué.',
  fileLimitReached: 'Le nombre maximum de fichiers a été atteint.',
  fileTooLarge: 'Le fichier dépasse la taille maximale.',
  fileTypeNotAllowed: "Le type de fichier n'est pas autorisé.",
  removalFailed: 'La ​​suppression du fichier a échoué.',
  urlNotAllowed: "Le fichier URL n'est pas autorisé.",
  downloadFailed: 'Le téléchargement du fichier a échoué.',
  invalidUrl: "Le fichier URL est manquant ou n'est pas autorisé.",
  pdfPreviewFailed: "Impossible de charger l'aperçu PDF.",
  pdfPreviewMarkup:
    "Le fichier URL renvoie du HTML ou du XML au lieu d'un PDF.",
  previewFailed: "Impossible de charger l'aperçu du fichier.",
  'files.empty': 'Aucun dossier.',
  'files.preview': 'Aperçu',
  'files.download': 'Télécharger',
  'files.remove': 'Supprimer',
  'files.chooseMany': 'Choisir les fichiers',
  'files.chooseOne': 'Choisir un fichier',
  'files.retry': 'Réessayer',
  'files.done': 'Terminé',
  'files.uploading': 'Téléchargement',
  'files.failed': 'Échec',
  'files.pending': 'En attente',
  'files.previous': 'Fichier précédent',
  'files.next': 'Fichier suivant',
  'files.loadingPreview': "Chargement de l'aperçu...",
  'files.downloadFile': 'Télécharger le fichier',
  'files.previewUnavailable':
    "L'aperçu n'est pas disponible pour ce type de fichier.",
  'files.imageFailed':
    "Cette image n'a pas pu être affichée. Il est peut-être corrompu ou dans un format non pris en charge.",
  'files.officeFailed': "Office Online n'a pas pu charger ce fichier.",
  'files.officeUrl':
    'Office Online nécessite un fichier absolu URL accessible sur Internet.',
  'files.cancelFile': 'Annuler {{filename}}',
  'files.status.uploading': 'Téléchargement',
  'files.status.pending': 'En attente',
  'files.status.error': 'Échec',
};

const resource: FileUiResource = { fileUi: messages };
export default resource;
