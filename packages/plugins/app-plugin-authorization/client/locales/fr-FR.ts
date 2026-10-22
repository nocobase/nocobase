import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  permissionSets: {
    builtIn: {
      root: 'Administrateur système',
      member: 'Membre',
    },
  },
  sections: {
    pages: 'Autorisations des pages',
    page: 'Pages',
    business: 'Autorisations professionnelles',
    administration: 'Administration',
    other: 'Autres',
  },
  options: {
    defaultAndSharing: 'Utiliser la portée des données par défaut',
    actions: {
      assign: 'Gérer les affectations',
      configure: 'Configurer',
      inspect: 'Inspecter les autorisations',
      read: 'Lire',
      create: 'Créer',
      update: 'Mettre à jour',
      delete: 'Supprimer',
      access: 'Accès',
    },
    settingsModules: {
      authorization: 'Autorisation',
    },
    pages: {
      all: 'Toutes les pages',
      allDescription:
        "Autoriser l'accès à chaque page, y compris les pages ajoutées ultérieurement.",
    },
    settings: {
      inspector: 'Inspecteur des autorisations',
      'permission-sets': 'Ensembles de permissions',
    },
    subjectTypes: {
      authenticated: 'Tous les utilisateurs connectés',
      authenticatedDescription:
        "S'applique à chaque utilisateur disposant d'une session connectée valide.",
      user: 'Utilisateurs',
    },
    recordAccessPolicies: {
      allRecords: 'Tous les enregistrements',
      recordsIOwn: 'Dossiers que je possède',
      recordsICreated: "Enregistrements que j'ai créés",
      customFilter: 'Filtre personnalisé',
      customFilterHint:
        'Sélectionnez les enregistrements avec une condition de filtre personnalisée.',
    },
  },
};

export default frFR;
