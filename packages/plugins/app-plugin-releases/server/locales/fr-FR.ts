import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  access: {
    section: 'Versions',
    pages: {
      'rel-apps': 'Applications',
    },
    businessSection: 'Versions',
    businesses: {
      apps: {
        title: 'Applications',
        description:
          "Applications, leurs versions, déploiements et environnement d'exécution.",
        actions: {
          view: {
            title: 'Afficher les applications',
            description:
              "Voir les applications, leurs versions, déploiements et statut d'exécution",
            related: 'Afficher les applications (celles qui leur sont liées)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Afficher les applications (toutes)',
          },
          readLogs: {
            title: 'Lire les journaux',
            description: "Lire les journaux d'application et de déploiement",
            related: 'Lire les journaux (ceux qui leur sont liés)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Lire les journaux (tous)',
          },
          create: {
            title: 'Créer des applications',
            description: 'Créer des applications dans un environnement',
            all: 'Créer des applications',
          },
          configure: {
            title: 'Configurer les applications',
            description:
              "Lire et modifier la configuration d'une application, qui peut contenir des secrets",
            related: 'Configurer les applications (celles qui leur sont liées)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Configurer les applications (toutes)',
          },
          upload: {
            title: 'Télécharger les versions',
            description: 'Télécharger et promouvoir des versions',
            related: 'Télécharger les versions (celles qui leur sont liées)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Télécharger les versions (toutes)',
          },
          deploy: {
            title: 'Déployer',
            description:
              'Déployer et restaurer sur des environnements non protégés, demander des déploiements sur ceux protégés',
            related: 'Déployer (ceux qui leur sont liés)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Déployer (tous)',
          },
          deployProtected: {
            title: 'Approuver les déploiements protégés',
            description:
              'Approuver les déploiements dans des environnements protégés qui ne nomment aucun approbateur ; les gens seulement',
            related:
              'Approuver les déploiements protégés (ceux qui leur sont liés)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Approuver les déploiements protégés (tous)',
          },
          operate: {
            title: 'Démarrer et arrêter',
            description: 'Démarrer, arrêter et redémarrer les applications',
            related: 'Démarrer et arrêter (ceux qui leur sont liés)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Démarrer et arrêter (tous)',
          },
          delete: {
            title: 'Supprimer des applications',
            description: 'Supprimer une application avec ses données',
            related: 'Supprimer les applications (celles qui leur sont liées)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Supprimer les applications (toutes)',
          },
        },
      },
    },
    recordAccess: {
      owned: "Applications qu'ils ont créées",
    },
    settings: {
      rel: {
        environments: 'Déployer des environnements',
      },
    },
    keyScopes: {
      apps: {
        title: 'Applications et déploiements',
        description:
          'Lire : voir les applications, les versions, les déploiements et les journaux. Lire et écrire : téléchargez également des versions. Administrateur : déployez et démarrez ou arrêtez également des applications.',
        objects: 'Applications',
      },
      environments: {
        title: 'Déployer des environnements',
        description:
          'Lire : répertorier les environnements. Lire et écrire : gérez-les.',
      },
      presets: {
        ciDeploy: {
          title: 'Déploiement CI',
          description:
            'Téléchargez les versions sur les applications choisies et déployez-les pendant 90 jours.',
        },
        ciUpload: {
          title: 'Téléchargement de CI',
          description:
            'Téléchargez les versions vers les applications choisies sans les déployer, pendant 90 jours.',
        },
      },
    },
    actions: {
      read: 'Afficher',
      manage: 'Gérer',
      view: 'Afficher',
      'read-logs': 'Lire les journaux',
      create: 'Créer',
      configure: 'Configurer',
      upload: 'Télécharger les versions',
      deploy: 'Déployer',
      'deploy-protected': 'Approuver les déploiements protégés',
      operate: 'Démarrer et arrêter',
      delete: 'Supprimer',
    },
  },
  drivers: {
    host: 'Ce serveur',
  },
};

export default frFR;
