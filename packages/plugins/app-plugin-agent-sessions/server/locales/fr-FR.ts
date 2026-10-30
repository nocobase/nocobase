import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  errors: {
    retryUnavailable:
      'Envoyez les saisies en attente dans l’ordre. Seule la dernière saisie interrompue ou la prochaine saisie retirée peut être renvoyée.',
    stopTargetChanged:
      'Le tour en cours a changé. Actualisez avant de l’arrêter.',
    promptNotFound:
      "Aucun message avec cette identité n'existe dans la session.",
    promptStarted:
      'Le traitement du message a commencé et ne peut pas être retiré.',
    withdrawalUnsupported:
      "Cet ancien message ne peut pas être retiré en toute sécurité. Mettez à jour la ligne de commande et redémarrez la connexion de l'ordinateur.",
    bridgeReplaced:
      'Un autre pont a enregistré cet ordinateur. Redémarrez cette connexion.',
    submissionConflict:
      'Cet ID de soumission est déjà utilisé pour une autre demande.',
    authenticationRequired:
      "Connectez-vous pour utiliser les sessions d'agent.",
    computerNotFound:
      "Aucun ordinateur portant cet identifiant n'est connecté à votre compte.",
    sessionNotFound: 'Aucune session avec cet identifiant ne vous appartient.',
    computerOffline:
      "L'ordinateur est hors ligne. Démarrez le pont dessus, puis réessayez.",
    agentUnavailable: "L'ordinateur ne peut pas exécuter cet agent.",
    directoryNotAllowed:
      'Les sessions sur cet ordinateur fonctionnent uniquement sous les répertoires autorisés par son pont.',
    sessionArchived: "La session est archivée. Restaurez-le d'abord.",
    permissionRequestNotFound:
      "Cette demande d'autorisation a déjà reçu une réponse ou n'est plus en attente.",
    choiceNotFound: "L'agent n'offre pas ce choix ou cette valeur.",
    linkNotFound:
      "Rien de ce genre avec cet identifiant n'est lié à la session, ou son travail ne peut pas commencer à partir d'ici.",
    invalidPageToken: "Le jeton de page n'a pas été émis par cette liste.",
    upgradeRequired:
      'Le pont parle une autre version du protocole. Mettez à jour la ligne de commande sur cet ordinateur.',
    computerNotAnswering:
      "L'ordinateur n'a pas répondu à temps. Vérifiez que sa connexion fonctionne, puis réessayez.",
    folderUnavailable: "Le dossier ne peut pas être ouvert sur l'ordinateur.",
    discoveryFailed:
      "Impossible de charger les paramètres de l'agent. Vérifiez l'agent sur cet ordinateur et réessayez.",
    projectNotFound:
      "Un tel projet n'existe pas ou vous ne pouvez pas le voir.",
    referenceNotFound:
      "Quelque chose mentionné n'existe pas ou vous ne pouvez pas le voir.",
    imageNotFound:
      "Aucune image portant ce nom n'a été envoyée lors de la session.",
    computerKeyInvalid:
      "Cet ordinateur n'est plus connecté : il a été retiré, ou reconnecté depuis ailleurs. Exécutez `acp start` dessus pour le reconnecter.",
  },
};

export default frFR;
