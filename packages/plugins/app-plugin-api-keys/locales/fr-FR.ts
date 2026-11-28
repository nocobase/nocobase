import type { AuditLocaleResource } from './en-US.js';

const frFR: AuditLocaleResource = {
  audit: {
    operations: {
      createPersonalKey: 'Créer une clé API personnelle',
      rotatePersonalKey: 'Effectuer la rotation d’une clé API personnelle',
      revokePersonalKey: 'Révoquer une clé API personnelle',
      revokeMemberKey: 'Révoquer la clé API personnelle d’un membre',
      updateRules: 'Mettre à jour les règles des clés API',
      createSystemKey: 'Créer une clé API système',
      updateSystemKey: 'Modifier une clé API système',
      replaceSystemKeyPermissions:
        'Remplacer les autorisations d’une clé API système',
      rotateSystemKey: 'Effectuer la rotation d’une clé API système',
      disableSystemKey: 'Désactiver une clé API système',
      enableSystemKey: 'Activer une clé API système',
      deleteSystemKey: 'Supprimer une clé API système',
    },
  },
};

export default frFR;
