import type { NotificationServerResource } from './en-US.js';

const frFR: NotificationServerResource = {
  errors: {
    logNotFound: 'Journal de notification introuvable.',
    kindNotFound: 'Type de notification introuvable.',
    channelNotFound:
      'Aucun canal de notification activé ne s’appelle « {{name}} ».',
    channelTestUnsupported:
      'Le canal « {{name}} » ne peut pas envoyer de message de test.',
    channelNoRecipient:
      'Le canal « {{name}} » n’a ni adresse ni appareil pour vous.',
    deliveryNotFound: 'Envoi introuvable.',
    deliveryNotRetryable:
      'Cet envoi ne peut pas être relancé : seul un envoi en échec dont le canal n’a pas changé peut l’être.',
    retryReasonRequired: 'Indiquez la raison de la relance.',
    preferenceUnknown: 'Cette notification n’a pas ce canal.',
    preferenceRequired:
      'Cette notification est toujours envoyée sur ce canal ; elle ne peut pas être désactivée.',
  },
  test: {
    title: 'Notification de test',
    body: 'Ceci est un test envoyé depuis Paramètres › Notifications pour le canal « {{channel}} ».',
  },
  authorization: {
    section: 'Messages',
    title: 'Notifications',
    read: 'Consulter',
    manage: 'Gérer',
  },
};

export default frFR;
