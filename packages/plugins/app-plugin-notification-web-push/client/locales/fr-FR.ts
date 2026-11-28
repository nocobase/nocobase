import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  'push.deviceCount': 'Enregistrés : {{total}} · Activés : {{active}}',
  'push.active': 'Enabled',
  'push.paused': 'Paused',
  'push.pause': 'Pause',
  'push.resume': 'Resume',
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
  'push.testSent': 'Le service push a accepté la notification de test.',
  'push.invalid':
    'Le navigateur a renvoyé des données d’abonnement non valides. Réessayez de vous abonner.',
  'push.endpoint':
    'Le serveur ne prend pas en charge le service push de ce navigateur.',
  'push.owned':
    'L’abonnement de ce navigateur appartient à un autre compte. Supprimez-le de ce compte avant de vous réabonner.',
  'push.browserFailed':
    'Le navigateur n’a pas pu créer l’abonnement push. Vérifiez les paramètres de notification et la connexion.',
  'push.expired':
    'L’abonnement a expiré ou a été supprimé. Réabonnez-vous depuis cet appareil.',
  'push.testPaused':
    'Réactivez le push sur cet appareil avant d’envoyer un test.',
  'push.testLimited': 'Attendez 30 secondes entre les notifications de test.',
  'push.testNetwork':
    'Le serveur n’a pas pu joindre le service push. Demandez à un administrateur de vérifier le réseau et le proxy Web Push.',
  'push.testGatewayAuth':
    'Le service push a refusé les identifiants du serveur. Demandez à un administrateur de vérifier la clé VAPID.',
  'push.testGatewayLimited':
    'Le service push limite les requêtes. Réessayez plus tard.',
  'push.testGateway':
    'Le service push n’a pas pu accepter la notification de test. Réessayez plus tard.',
  'push.failed':
    'Impossible de mettre à jour les notifications push. Veuillez réessayer.',
  'push.loadingFailed':
    'Impossible de charger les appareils. Veuillez réessayer.',
  'push.retry': 'Réessayer',
  'channelType.title': 'Push navigateur',
  'channelType.testHint':
    'Envoie une notification de test aux navigateurs pour lesquels vous avez activé le push. Activez-le d’abord dans Paramètres personnels › Notifications.',
};

export default frFR;
