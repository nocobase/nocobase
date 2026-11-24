import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  inbox: {
    title: 'Boîte de réception',
    views: {
      all: 'Tout',
      unread: 'Non lus',
      todo: 'En attente',
    },
    categories: 'Catégories',
    readAll: 'Tout marquer comme lu',
    open: 'Ouvrir',
    actions: {
      read: 'Marquer comme lu',
      unread: 'Marquer comme non lu',
      delete: 'Supprimer',
    },
    tabs: {
      today: "Aujourd'hui",
      info: 'Plus tôt',
      decision: 'En attente',
    },
    actionsFor: 'Actions pour {{title}}',
    allRead: 'Tout a été marqué comme lu.',
    back: 'Retour à la liste',
    cancel: 'Annuler',
    clearFilter: 'Effacer le filtre',
    count: '×{{count}}',
    deleted: 'Supprimé.',
    description: 'Notifications et demandes qui vous sont adressées.',
    empty: {
      decision: 'Aucune décision ne vous attend',
      info: 'Aucune notification',
      todo: 'Rien ne vous attend',
      unread: 'Vous êtes à jour',
    },
    emptyAll: 'Rien ici',
    emptyDescription:
      'Les notifications et demandes qui vous sont adressées apparaissent ici.',
    filters: 'Filtres de la boîte de réception',
    forbidden: 'Vous n’êtes pas autorisé à effectuer cette action.',
    keyMove: 'Déplacer',
    keyOpen: 'Ouvertes',
    kinds: {
      all: 'Tous les types',
      decision: 'Décisions',
      info: 'Plus tôt',
      label: 'Type',
      today: 'Aujourd’hui',
    },
    detailsUnavailable:
      'Certains détails de la boîte de réception n’ont pas pu être chargés.',
    loadFailed: 'Impossible de charger la boîte de réception',
    loadFailedDescription: 'Vérifiez votre connexion et réessayez.',
    loadMore: 'Charger plus',
    loading: 'Chargement',
    noMatchDescription: 'Effacez le filtre pour voir tous les types.',
    nothingSelected: 'Sélectionnez un élément pour l’afficher',
    notification: 'Notification',
    outcomes: { approved: 'Approuvé', rejected: 'Refusé', withdrawn: 'Retiré' },
    pendingDecisions: '{{count}} en attente',
    request: {
      approve: 'Approuver',
      commentFor: '{{action}} : {{title}}',
      commentPlaceholder: 'Écrivez quelque chose…',
      newLine: 'pour une nouvelle ligne',
      quickSend: 'pour envoyer',
      reject: 'Refuser',
    },
    requestFailed: 'La requête a échoué. Réessayez.',
    resolved: 'Traité',
    retry: 'Réessayer',
    unread: 'Non lu',
    unreadCount: '{{count}} non lu(s)',
  },
  inboxButton: {
    title: 'Boîte de réception',
    viewAll: 'Ouvrir la boîte',
    empty: 'Aucun message pour le moment',
    pending: 'Boîte de réception, {{count}} en attente',
    recent: 'Messages récents',
    unread: 'Boîte de réception, {{count}} non lus',
  },
  nav: {
    inbox: 'Boîte de réception',
  },
  common: { loading: 'Chargement' },
};

export default frFR;
