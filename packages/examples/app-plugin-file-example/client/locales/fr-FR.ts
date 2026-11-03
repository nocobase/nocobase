import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  retrySubmission: 'Réessayer l’opération initiale',

  officePreviewTitle: 'Aperçu du bureau local',
  officePreviewDescription:
    "Téléchargez un fichier DOCX, XLSX ou PPTX ci-dessous, puis sélectionnez Aperçu. Les documents s'affichent dans votre navigateur sans Office Online ni service de prévisualisation externe. Les pièces jointes de commande utilisent le même aperçu.",
  officePreviewLimits:
    "Aucune connexion Internet n'est requise lorsque l'application et le service de fichiers sont accessibles sur votre réseau local. Ce n’est pas un mode totalement déconnecté. Les anciens fichiers DOC, XLS, PPT et OpenDocument restent téléchargeables uniquement dans cet exemple.",
  title: 'Pièces jointes',
  description:
    'Téléchargez un ou plusieurs fichiers et prévisualisez-les sur place. Les enregistrements sont stockés via le référentiel de fichiers API.',
  apiHint:
    'Cette page conserve le flux brut du référentiel : le contrôle de téléchargement appelle uploadOne pour un seul fichier et uploadMany pour un lot.',
  retention:
    "La suppression d'un enregistrement supprime uniquement ses métadonnées ; l'objet stocké reste sur le disque.",
  choose: 'Choisir les fichiers',
  uploading: 'Téléchargement…',
  dropHint: 'ou déposez les fichiers ici',
  tooLarge: 'Le fichier dépasse la taille maximale',
  rejected: "Le type de fichier n'est pas autorisé",
  uploadFailed: 'Échec du téléchargement',
  preview: 'Aperçu',
  download: 'Télécharger',
  remove: 'Supprimer',
  unlink: 'Supprimer de la commande',
  empty: "Aucun fichier pour l'instant.",
  close: 'Fermer',
  previous: 'Précédent',
  next: 'Suivant',
  loading: 'Chargement…',
  previewUnsupported:
    "Ce type de fichier n'a pas d'aperçu en ligne. Téléchargez-le plutôt.",
  previewFailed: "Le fichier n'a pas pu être chargé.",
  navGroup: 'Exemple de fichier',
  navAttachments: 'Pièces jointes',
  navProfiles: 'Avatars de profil',
  navOrders: 'Pièces jointes aux commandes',
  profilesTitle: 'Avatars de profil (individuels)',
  profilesDescription:
    "Un profil possède au plus un avatar. Le téléchargement d'un nouvel avatar remplace le fichier précédent.",
  profilesRelationHint:
    'Relation : fileExampleProfiles.avatar est une relation hasOne avec fileExampleProfileAvatars, qui conserve un profileId unique.',
  noAvatar: "Pas d'avatar",
  profilesNoFile: "Aucun fichier d'avatar connecté",
  profilesEmpty:
    'Aucun profil trouvé. Exécutez l’exemple de graine pour créer des enregistrements de démonstration.',
  uploadAvatar: 'Télécharger un avatar',
  replaceAvatar: "Remplacer l'avatar",
  removeAvatar: "Supprimer l'avatar",
  avatarHint:
    'Le téléchargement stocke le fichier puis le connecte via la relation de profil ; la suppression efface uniquement la relation.',
  ordersTitle: 'Ordre des pièces jointes (un à plusieurs)',
  ordersDescription:
    'Une ordonnance possède un nombre illimité de pièces jointes. Sélectionnez plusieurs fichiers à la fois pour les télécharger par lots.',
  ordersRelationHint:
    'Relation : fileExampleOrders.attachments est une relation hasMany avec fileExampleOrderAttachments via orderId.',
  ordersNoFiles: 'Aucune pièce jointe sur cette commande.',
  ordersEmpty:
    'Aucune commande trouvée. Exécutez l’exemple de graine pour créer des enregistrements de démonstration.',
  ordersHint:
    "La suppression d'une pièce jointe efface la relation d'ordre. L'enregistrement du fichier reste disponible dans le référentiel de fichiers.",
  'status.draft': 'Brouillon',
  'status.submitted': 'Soumis',
  'status.archived': 'Archivé',
};

export default frFR;
