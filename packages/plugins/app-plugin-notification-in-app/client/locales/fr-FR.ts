import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  inbox: {
    eyebrow: 'Boîte de réception personnelle',
    title: 'Centre de messagerie',
    unreadCount: '{{count}} non lu',
    description:
      'Mises à jour des applications et des flux de travail que vous utilisez.',
    markAllRead: 'Marquer tout comme lu',
    messagesTitle: 'Messages',
    messagesDescription:
      "Les messages intégrés à l'application conservent un état de lecture indépendant pour l'utilisateur actuel.",
    unreadFilter: 'Non lu',
    unavailable: 'Boîte de réception indisponible',
    retry: 'Réessayer',
    loading: 'Chargement des notifications…',
    emptyTitle: 'Vous êtes tous rattrapés',
    emptyDescription: 'De nouvelles notifications apparaîtront ici.',
    loadingMore: 'Chargement…',
    loadMore: 'Charger plus',
    scrollMore: 'Faites défiler vers le bas pour en charger davantage',
    noMore: 'Plus de messages',
    expand: 'Afficher plus',
    collapse: 'Afficher moins',
    channel: "Dans l'application",
    open: 'Ouvert',
    markUnread: 'Marquer comme non lu',
    markRead: 'Marc a lu',
    delete: 'Supprimer la notification',
    errors: {
      update: 'La mise à jour de la boîte de réception a échoué.',
      loadMore: 'Impossible de charger davantage de notifications.',
      markAllRead: 'Impossible de marquer les notifications comme lues.',
    },
  },
};

export default frFR;
