import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  logs: {
    deliveryOperations: 'Opérations de livraison',
    recipeDescription:
      'Tracez chaque transfert de canal et chaque tentative de fournisseur.',
    redacted:
      'Les corps des messages, les destinataires et les jetons de bail sont expurgés.',
    providerAttempts: 'Tentatives du fournisseur',
    eyebrow: 'Notifications',
    title: 'Journaux de notifications',
    description:
      'Tracez la livraison des notifications et chaque tentative du fournisseur. Les corps des messages, les destinataires et les jetons de bail sont expurgés.',
    refreshing: 'Rafraîchissant…',
    refresh: 'Actualiser',
    deliveriesShown: 'Livraisons affichées',
    needAttention: "Besoin d'attention",
    unavailable: 'Journaux indisponibles',
    recent: 'Notifications récentes',
    loading: "Chargement de l'historique des livraisons…",
    emptyTitle: 'Pas encore de livraisons',
    emptyDescription:
      "Les enregistrements de livraison apparaîtront ici après l'envoi des notifications.",
    expand: 'Développer la notification',
    collapse: "Notification d'effondrement",
    noDeliveries: 'Aucune livraison enregistrée.',
    noAttempts: 'Aucune tentative enregistrée.',
    columns: {
      source: 'Origine',
      notificationId: 'ID de notification',
      status: 'Statut',
      deliveries: 'Livraisons',
      created: 'Créé',
      channel: 'Canal',
      provider: 'Fournisseur',
      attempts: 'Tentatives',
      updated: 'Mis à jour',
    },
  },
  status: {
    pending: 'en attente',
    processing: 'traitement',
    completed: 'terminé',
    partial: 'partiel',
    failed: 'a échoué',
    unknown: 'inconnu',
    preparing: 'préparation',
    submitting: 'soumission',
    retrying: 'nouvelle tentative',
    accepted: 'accepté',
  },
  errors: {
    requestFailed: 'La demande de notification a échoué.',
    inAppRecipientNotFound:
      "Le destinataire des notifications dans l'application n'existe pas.",
  },
};

export default frFR;
