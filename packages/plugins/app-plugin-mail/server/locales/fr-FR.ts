import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  errors: {
    invalidRecipient:
      'Corrigez les adresses e-mail et les noms affichés des destinataires avant l’envoi.',
    accessDenied: "L'accès à la messagerie est requis.",
    idempotencyConflict:
      "La clé d'idempotence est déjà associée à une autre requête.",
    invalidRequest: "La ​​demande de courrier n'est pas valide.",
    accountCredentialsInvalid:
      "L'authentification de la boîte aux lettres a échoué. Vérifiez votre nom de connexion et votre mot de passe ou code d'autorisation, et confirmez que IMAP/SMTP est activé. Gmail et d'autres services peuvent nécessiter un mot de passe d'application.",
    requestFailed: "La demande par courrier n'a pas pu être complétée.",
    providerRateLimited:
      'Le service de messagerie reçoit trop de requêtes. Réessayez plus tard.',
    providerUnavailable:
      "Le service de messagerie n'a pas pu être contacté. Réessayez plus tard.",
    reauthorizationRequired:
      'Ce compte de messagerie doit être reconnecté avant de pouvoir être utilisé.',
    syncRunNotFound: "La synchronisation du courrier n'a pas été trouvée.",
    messageNotFound: "Le message électronique n'a pas été trouvé.",
    authorizationStateRequired:
      "L'état d'autorisation de messagerie est requis.",
  },
};

export default frFR;
