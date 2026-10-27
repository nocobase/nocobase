import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  'push.title': 'Notifications poussées',
  'push.description':
    "Recevez des rappels sur chaque appareil, même lorsque l'application est fermée.",
  'push.subscribe': 'Abonnez-vous à cet appareil',
  'push.name': "Nom de l'appareil",
  'push.empty': 'Aucun appareil abonné',
  'push.emptyHint':
    "Abonnez-vous à cet appareil pour recevoir des rappels lorsque l'application est fermée.",
  'push.ios':
    "Sur iOS ou iPadOS 16.4 ou version ultérieure, ouvrez le menu Partager de Safari, choisissez Ajouter à l'écran d'accueil, puis ouvrez l'application à partir de son icône pour vous abonner.",
  'push.unsupported':
    'Push nécessite HTTPS et un navigateur prenant en charge Web Push.',
  'push.unavailable':
    "Le push n'est pas configuré. Demandez à un administrateur de configurer VAPID et la clé secrète.",
  'push.denied':
    'Les notifications sont bloquées. Autorisez-les dans les paramètres du site de votre navigateur, puis réessayez.',
  'push.current': 'Cet appareil',
  'push.more': 'Actions du périphérique',
  'push.test': 'Envoyer une notification de test',
  'push.remove': 'Supprimer',
  'push.removeTitle': 'Supprimer le périphérique « {{name}} » ?',
  'push.removeHint':
    'Cet appareil ne recevra plus de notifications push. Vous pouvez vous réabonner à partir de cet appareil.',
  'push.cancel': 'Annuler',
  'push.saved': "Paramètres de l'appareil enregistrés",
  'push.saving': "Sauvegarde des paramètres de l'appareil",
  'push.testSent': "Notification de test en file d'attente",
  'push.failed':
    'Impossible de mettre à jour les notifications push. Veuillez réessayer.',
  'push.loadingFailed':
    'Impossible de charger les appareils. Veuillez réessayer.',
  'push.retry': 'Réessayer',
};

export default frFR;
