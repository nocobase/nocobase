import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  roles: {
    owner: 'Responsable',
    admin: 'Administrateur',
    member: 'Membre',
  },
  access: {
    sections: {
      projects: 'Projets',
      issues: 'Tickets',
      settings: 'Paramètres du projet',
      members: 'Membres et rôles',
    },
    businesses: {
      projects: {
        title: 'Projets',
        description: 'Projets, leurs membres, référentiels et avancement.',
        actions: {
          view: {
            title: 'Afficher les projets',
            description: 'Voir les projets, leur aperçu et leur avancement',
            related: "Afficher les projets (ceux qu'ils peuvent voir)",
            relatedLabel: 'Ceux que je peux voir',
            relatedHint:
              "Projets publics et privés que je dirige ou que j'ai rejoints",
            all: 'Afficher les projets (tous)',
          },
          create: {
            title: 'Créer des projets',
            description: 'Démarrer un nouveau projet et le diriger',
            all: 'Créer des projets',
          },
          manage: {
            title: 'Gérer des projets',
            description:
              'Renommer, modifier le statut, les dates et le lead, gérer les membres et les référentiels',
            related: "Gérer les projets (ceux qu'ils dirigent)",
            relatedLabel: 'Ceux que je dirige',
            relatedHint: 'Projets dont je suis le responsable',
            all: 'Gérer des projets (tous)',
          },
          delete: {
            title: 'Supprimer des projets',
            description: 'Supprimer les projets et restaurer ceux supprimés',
            all: 'Supprimer des projets',
          },
        },
      },
      issues: {
        title: 'Tickets',
        description: 'Les enjeux et leurs commentaires, en projet ou seuls.',
        actions: {
          view: {
            title: 'Afficher les problèmes',
            description:
              'Voir les problèmes dans les listes, les tableaux et leurs détails',
            related: "Afficher les problèmes (ceux qu'ils peuvent voir)",
            relatedLabel: 'Dans les projets, je peux voir',
            relatedHint:
              'Problèmes sans projet et problèmes dans les projets que je peux voir',
            all: 'Afficher les problèmes (tous)',
          },
          create: {
            title: 'Créer des problèmes',
            description: 'Créer des tickets, dans un projet ou seul',
            related:
              "Créer des problèmes (dans les projets qu'ils peuvent voir)",
            relatedLabel: 'Dans les projets, je peux voir',
            relatedHint:
              'Problèmes sans projet ou dans des projets que je peux voir',
            all: 'Créer des problèmes (tous)',
          },
          edit: {
            title: 'Modifier les problèmes',
            description:
              'Titre, description, priorité, dates, étiquettes, exécuteurs testamentaires et statuts ouverts',
            related: "Modifier les problèmes (ceux qu'ils peuvent voir)",
            relatedLabel: 'Dans les projets, je peux voir',
            relatedHint:
              'Problèmes sans projet et problèmes dans les projets que je peux voir',
            all: 'Modifier les problèmes (tous)',
          },
          comment: {
            title: 'Commentaire sur les questions',
            description:
              'Commenter, répondre et résoudre les fils de discussion ; modifier et supprimer leurs propres commentaires',
            related: "Commentez les problèmes (ceux qu'ils peuvent voir)",
            relatedLabel: 'Dans les projets, je peux voir',
            relatedHint:
              'Problèmes sans projet et problèmes dans les projets que je peux voir',
            all: 'Commentaires sur les problèmes (tous)',
          },
          moderateComments: {
            title: 'Commentaires modérés',
            description: 'Supprimer les commentaires des autres',
            related:
              'Commentaires modérés (sur les problèmes dont ils sont propriétaires ou dont ils dirigent le projet)',
            relatedLabel:
              'Sur les questions qui me appartiennent ou dans les projets que je mène',
            relatedHint:
              'Commentaires sur les problèmes qui me appartiennent et sur les problèmes des projets que je dirige',
            all: 'Commentaires modérés (tous)',
          },
          close: {
            title: 'Fermer les problèmes',
            description: 'Marquer un problème comme terminé ou annulé',
            related:
              'Problèmes clôturés (ceux qui leur appartiennent ou dont ils dirigent le projet)',
            relatedLabel:
              'Ceux que je possède ou dans les projets que je dirige',
            relatedHint:
              'Problèmes que je possède et problèmes liés aux projets que je dirige',
            all: 'Problèmes clôturés (tous)',
          },
          changeOwner: {
            title: 'Changer le propriétaire',
            description:
              "Confier un problème à quelqu'un d'autre pour qu'il en soit responsable",
            related:
              "Changer le propriétaire (ceux qu'ils possèdent ou dont ils dirigent le projet)",
            relatedLabel:
              'Ceux que je possède ou dans les projets que je dirige',
            relatedHint:
              'Problèmes que je possède et problèmes liés aux projets que je dirige',
            all: 'Changer le propriétaire (tous)',
          },
          delete: {
            title: 'Supprimer et restaurer les problèmes',
            description: 'Supprimer les problèmes et restaurer ceux supprimés',
            all: 'Supprimer et restaurer les problèmes',
          },
        },
      },
      attachments: {
        title: 'Pièces jointes',
        description: 'Fichiers joints aux problèmes et aux commentaires.',
        actions: {
          upload: {
            title: 'Télécharger des pièces jointes',
            description:
              "Joindre des fichiers aux numéros qu'ils peuvent modifier et à leurs commentaires",
            related:
              "Télécharger des pièces jointes (sur les problèmes qu'ils peuvent voir)",
            relatedLabel: 'Sur les problèmes dans les projets que je peux voir',
            relatedHint:
              'Fichiers sur les problèmes sans projet et sur les problèmes dans les projets que je peux voir',
            all: 'Télécharger des pièces jointes (toutes)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Projets',
      pmIssues: 'Tickets',
    },
    recordAccess: {
      visible: "Projets et problèmes qu'ils peuvent voir",
      managed: "Projets qu'ils mènent et enjeux dont ils sont propriétaires",
    },
    settings: {
      pm: {
        general: 'Général',
        labels: 'Etiquettes',
        members: 'Membres',
      },
    },
    keyScopes: {
      projects: {
        title: 'Projets',
        description: 'Voir projets; les gérer ; créez-les et supprimez-les.',
        objects: 'Projets',
      },
      issues: {
        title: 'Tickets',
        description:
          'Voir les problèmes ; les créer, les éditer, les commenter, les fermer et les réaffecter ; modérer les commentaires et supprimer les problèmes.',
      },
      settings: {
        title: 'Paramètres du projet',
        description: 'Paramètres généraux et étiquettes.',
      },
    },
    actions: {
      view: 'Afficher',
      create: 'Créer',
      manage: 'Gérer',
      edit: 'Modifier',
      close: 'Fermer',
      comment: 'Commentaire',
      moderateComments: 'Commentaires modérés',
      changeOwner: 'Changer de propriétaire',
      delete: 'Supprimer',
      upload: 'Téléverser',
      read: 'Afficher',
      update: 'Modifier',
      invite: 'Inviter',
      assign: 'Attribuer des rôles',
      'define-roles': 'Définir les rôles',
    },
  },
  notifications: {
    batchDone: 'Tous les sous-numéros de {{identifier}} sont terminés',
    batchDoneStage:
      "L'étape {{stage}} des sous-numéros de {{identifier}} est terminée",
    commented: '{{actor}} a commenté {{identifier}}',
    dependencyReleased:
      '{{releasedBy}} est terminé, donc {{identifier}} peut démarrer',
    executorAssigned: '{{actor}} vous a assigné {{identifier}}',
    mentioned: {
      comment: '{{actor}} vous a mentionné sur {{identifier}}',
      description: '{{actor}} vous a mentionné dans {{identifier}}',
    },
    ownerAssigned: '{{actor}} a fait de vous le propriétaire de {{identifier}}',
    someone: "Quelqu'un",
    statusChanged: '{{identifier}} déplacé vers {{status}}',
    ownerNotified: '{{identifier}} est maintenant {{status}}',
  },
  status: {
    backlog: 'Arriéré',
    blocked: 'Bloqué',
    cancelled: 'Annulé',
    done: 'Terminé',
    in_progress: 'En cours',
    in_review: 'En révision',
  },
};

export default frFR;
