import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';
import components from './components-en-US.js';
import settings from './settings-en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  // The Roles and permissions pages are not translated into this language yet and show in English.
  ...components,
  settings: {
    ...settings,
    unsavedCount_many: settings.unsavedCount_other,
    unsavedCountRisky_many: settings.unsavedCountRisky_other,
    review: {
      ...settings.review,
      description_many: settings.review.description_other,
      description_zero: settings.review.description_other,
      highRisk_many: settings.review.highRisk_other,
    },
    members: {
      ...settings.members,
      description_many: settings.members.description_other,
    },
    permissionEditor: {
      ...settings.permissionEditor,
      attention_many: settings.permissionEditor.attention_other,
      confirmDisable_many: settings.permissionEditor.confirmDisable_other,
      noticeScopeReset_many: settings.permissionEditor.noticeScopeReset_other,
      noticeTurnOnFirst_many: settings.permissionEditor.noticeTurnOnFirst_other,
      noticeManagedRequirement_many:
        settings.permissionEditor.noticeManagedRequirement_other,
      noticeManagedDependent_many:
        settings.permissionEditor.noticeManagedDependent_other,
      tabChanges_many: settings.permissionEditor.tabChanges_other,
    },
  },
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
      'permission-sets': 'Ensembles de permissions',
      'authentication-settings': 'Connexion et authentification',
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
