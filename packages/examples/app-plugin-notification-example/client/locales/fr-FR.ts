import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  notificationTemplates: {
    contributor: 'Exemples de notifications',
    category: 'Tâches',
    assigned: {
      name: 'Tâche assignée',
      trigger: 'Une tâche est créée.',
      recipients:
        "La personne assignée, même si elle s'est assigné la tâche elle-même.",
    },
    updated: {
      name: 'Tâche mise à jour',
      trigger: "Une tâche est modifiée, y compris lorsqu'elle est réassignée.",
      recipients:
        "Le créateur, l'ancienne personne assignée et la nouvelle, une fois chacun. La personne qui a fait la modification n'est pas notifiée.",
    },
    businessRule:
      "Envoyé chaque fois que l'action sur la tâche a lieu. Aucun interrupteur séparé ne permet de le désactiver.",
    languagePolicy:
      'Toujours en anglais, quelle que soit la langue du destinataire.',
    channel: 'Boîte de réception des tâches',
    variables: {
      title: 'Titre de la tâche',
      description: 'Description de la tâche',
      status: 'Statut de la tâche',
    },
  },
  navigation: {
    tasks: 'Exemples de notifications',
    taskManagement: 'Tâches',
    taskDetail: 'Détails de la tâche',
  },
  common: {
    close: 'Fermer',
    loading: 'Chargement…',
    saving: 'Sauvegarde…',
  },
  fields: {
    title: 'Titre',
    description: 'Description',
    status: 'Statut',
    assignee: 'Responsable assigné',
    creator: 'Créateur',
    chooseAssignee: 'Choisir un utilisateur',
  },
  status: {
    open: 'Ouvert',
    'in-progress': 'En cours',
    done: 'Terminé',
  },
  tasks: {
    title: 'Tâches',
    description:
      "Attribuez une petite tâche à un autre utilisateur. Le responsable reçoit une notification dans l'application avec le résumé de la tâche et peut modifier la tâche à partir de la page de détail. Utilisez le bouton de notification dans la barre supérieure pour ouvrir vos notifications de messages.",
    listTitle: 'Toutes les tâches',
    listDescription:
      'Toutes les tâches que vous avez créées ou auxquelles vous avez été affecté.',
    count: 'Enregistrements {{count}}',
    empty: "Aucune tâche pour l'instant.",
    assignee: 'Attribué à',
    columns: {
      title: 'Titre',
      description: 'Description',
      status: 'Statut',
      creator: 'Créateur',
      assignee: 'Responsable assigné',
      updatedAt: 'Dernière mise à jour',
      actions: 'Actions',
    },
    view: 'Afficher les détails',
    retryRead: 'Réessayer',
    previous: 'Précédent',
    next: 'Suivant',
    page: 'Page {{page}}',
    add: 'Nouvelle tâche',
    drawerTitle: 'Nouvelle tâche',
    drawerDescription:
      "La création d'une tâche envoie ses informations de base au destinataire.",
    create: 'Créer une tâche',
    cancel: 'Annuler',
  },
  taskDetail: {
    title: 'Détails de la tâche',
    summary: 'Détails de la tâche',
    createdAt: 'Créé',
    updatedAt: 'Dernière mise à jour',
    notificationHint:
      "Une fois qu'une tâche est enregistrée, les personnes concernées autres que l'éditeur actuel sont informées : le créateur et le destinataire actuel. Si le cessionnaire change, les cessionnaires précédents et les nouveaux en sont informés.",
    edit: 'Modifier la tâche',
    retryRead: 'Réessayer',
    save: 'Enregistrer les modifications',
    cancel: 'Annuler',
    back: 'Retour aux tâches',
  },
};

export default frFR;
