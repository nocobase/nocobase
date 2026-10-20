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
    sendTest: 'Envoyer une notification de test',
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
  test: {
    title: 'Envoyer une notification de test',
    description:
      'Sélectionnez un mode de livraison, puis cliquez sur Envoyer. Le message est envoyé au destinataire que vous indiquez et enregistré ci-dessous.',
    close: 'Fermer la boîte de dialogue de notification de test',
    loadingProviders: 'Chargement des fournisseurs configurés…',
    noProviders: "Aucun fournisseur activé n'est configuré.",
    channelProvider: 'Mode de livraison',
    selectProvider: 'Sélectionnez un mode de livraison',
    singleProviderLabel: '{{channel}} ({{provider}})',
    recipient: 'Destinataire',
    userIdPlaceholder: 'ID utilisateur',
    emailHelp: "L'adresse e-mail qui doit recevoir ce test.",
    userHelp: "ID utilisateur qui doit recevoir ce message dans l'application.",
    messageTitle: 'Titre',
    message: 'Message',
    cancel: 'Annuler',
    sending: 'Envoi…',
    send: 'Envoyer',
    defaultTitle: 'Test de notification NocoBase',
    defaultBody: "Il s'agit d'une notification de test provenant de NocoBase.",
    accepted: 'Notification de test {{id}} acceptée.',
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
