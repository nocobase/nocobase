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
      issues: 'Tâches',
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
        title: 'Tâches',
        description:
          'Les tâches et leurs commentaires, dans un projet ou indépendantes.',
        actions: {
          view: {
            title: 'Voir les tâches',
            description:
              'Voir les tâches dans les listes, les tableaux et leurs détails',
            related: 'Voir les tâches (celles qu’ils peuvent voir)',
            relatedLabel: 'Dans les projets, je peux voir',
            relatedHint:
              'Tâches sans projet et tâches des projets que je peux voir',
            all: 'Voir les tâches (toutes)',
          },
          create: {
            title: 'Créer des tâches',
            description: 'Créer des tâches, dans un projet ou indépendantes',
            related: 'Créer des tâches (dans les projets qu’ils peuvent voir)',
            relatedLabel: 'Dans les projets, je peux voir',
            relatedHint:
              'Tâches sans projet ou dans les projets que je peux voir',
            all: 'Créer des tâches (toutes)',
          },
          edit: {
            title: 'Modifier des tâches',
            description:
              'Titre, description, priorité, dates, étiquettes, exécutants et statuts ouverts',
            related: 'Modifier des tâches (celles qu’ils peuvent voir)',
            relatedLabel: 'Dans les projets, je peux voir',
            relatedHint:
              'Tâches sans projet et tâches des projets que je peux voir',
            all: 'Modifier des tâches (toutes)',
          },
          comment: {
            title: 'Commenter des tâches',
            description:
              'Commenter, répondre et résoudre les fils de discussion ; modifier et supprimer leurs propres commentaires',
            related: 'Commenter des tâches (celles qu’ils peuvent voir)',
            relatedLabel: 'Dans les projets, je peux voir',
            relatedHint:
              'Tâches sans projet et tâches des projets que je peux voir',
            all: 'Commenter des tâches (toutes)',
          },
          moderateComments: {
            title: 'Commentaires modérés',
            description: 'Supprimer les commentaires des autres',
            related:
              'Modérer les commentaires (sur leurs tâches ou les projets qu’ils dirigent)',
            relatedLabel: 'Sur mes tâches ou dans les projets que je dirige',
            relatedHint:
              'Commentaires sur mes tâches et sur les tâches des projets que je dirige',
            all: 'Commentaires modérés (tous)',
          },
          close: {
            title: 'Clore des tâches',
            description: 'Marquer une tâche comme terminée ou annulée',
            related:
              'Clore des tâches (les leurs ou celles des projets qu’ils dirigent)',
            relatedLabel:
              'Ceux que je possède ou dans les projets que je dirige',
            relatedHint: 'Mes tâches et les tâches des projets que je dirige',
            all: 'Clore des tâches (toutes)',
          },
          changeOwner: {
            title: 'Changer le propriétaire',
            description:
              'Confier une tâche à une autre personne qui en devient responsable',
            related:
              "Changer le propriétaire (ceux qu'ils possèdent ou dont ils dirigent le projet)",
            relatedLabel:
              'Ceux que je possède ou dans les projets que je dirige',
            relatedHint: 'Mes tâches et les tâches des projets que je dirige',
            all: 'Changer le propriétaire (tous)',
          },
          delete: {
            title: 'Supprimer et restaurer des tâches',
            description: 'Supprimer des tâches et restaurer celles supprimées',
            all: 'Supprimer et restaurer des tâches',
          },
        },
      },
      attachments: {
        title: 'Pièces jointes',
        description: 'Fichiers joints aux tâches et aux commentaires.',
        actions: {
          upload: {
            title: 'Télécharger des pièces jointes',
            description:
              'Joindre des fichiers aux tâches qu’ils peuvent modifier et à leurs commentaires',
            related:
              'Téléverser des pièces jointes (sur les tâches qu’ils peuvent voir)',
            relatedLabel: 'Sur les tâches des projets que je peux voir',
            relatedHint:
              'Fichiers sur les tâches sans projet et sur les tâches des projets que je peux voir',
            all: 'Télécharger des pièces jointes (toutes)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Projets',
      pmIssues: 'Tâches',
    },
    recordAccess: {
      visible: 'Projets et tâches qu’ils peuvent voir',
      managed: 'Projets qu’ils dirigent et tâches dont ils sont responsables',
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
        title: 'Tâches',
        description:
          'Voir les tâches ; les créer, modifier, commenter, clore et réattribuer ; modérer les commentaires et supprimer des tâches.',
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
    batchDone: 'Toutes les sous-tâches de {{identifier}} sont terminées',
    batchDoneStage:
      'L’étape {{stage}} des sous-tâches de {{identifier}} est terminée',
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
    backlog: 'Backlog',
    blocked: 'Bloqué',
    cancelled: 'Annulé',
    done: 'Terminé',
    in_progress: 'En cours',
    in_review: 'En révision',
  },
};

export default frFR;
