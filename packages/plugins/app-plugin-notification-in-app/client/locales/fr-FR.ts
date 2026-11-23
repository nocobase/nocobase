import type { InAppNotificationClientResource } from './en-US.js';

const frFR: InAppNotificationClientResource = {
  common: {
    loading: 'Chargement',
  },
  inbox: {
    actions: {
      delete: 'Supprimer',
      read: 'Marquer comme lu',
      unread: 'Marquer comme non lu',
    },
    actionsFor: 'Actions pour {{title}}',
    allRead: 'Tout a été marqué comme lu.',
    back: 'Retour à la liste',
    cancel: 'Annuler',
    categories: 'Catégories',
    clearFilter: 'Effacer le filtre',
    count: '×{{count}}',
    deleted: 'Supprimé.',
    description: 'Les notifications et demandes qui vous sont adressées.',
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
    keyOpen: 'Ouvrir',
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
    open: 'Ouvrir',
    outcomes: {
      approved: 'Approuvé',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
    },
    pendingDecisions: '{{count}} en attente',
    readAll: 'Tout marquer comme lu',
    request: {
      approve: 'Approuver',
      commentFor: '{{action}} : {{title}}',
      commentPlaceholder: 'Écrivez quelque chose…',
      newLine: 'pour aller à la ligne',
      quickSend: 'pour envoyer',
      reject: 'Rejeter',
    },
    requestFailed: 'La requête a échoué. Réessayez.',
    resolved: 'Traité',
    retry: 'Réessayer',
    tabs: {
      decision: 'En attente',
      info: 'Plus tôt',
      today: "Aujourd'hui",
    },
    title: 'Boîte de réception',
    unread: 'Non lus',
    unreadCount: '{{count}} non lu(s)',
    views: {
      all: 'Tout',
      todo: 'En attente',
      unread: 'Non lus',
    },
  },
  inboxButton: {
    empty: 'Aucun message pour l’instant',
    pending: 'Boîte de réception, {{count}} en attente',
    recent: 'Messages récents',
    title: 'Boîte de réception',
    unread: 'Boîte de réception, {{count}} non lu(s)',
    viewAll: 'Ouvrir la boîte',
  },
  nav: {
    inbox: 'Boîte de réception',
  },
};

export default frFR;
