import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  templates: {
    title: 'Modèles de notification',
    coverage:
      'Les notifications que le système envoie automatiquement, et leur apparence. Les notifications envoyées par des workflows ou du code personnalisé peuvent ne pas figurer ici. Cette page est en lecture seule.',
    filters: 'Filtrer les modèles',
    search: 'Rechercher des modèles',
    category: 'Catégorie',
    channel: 'Canal',
    all: 'Tous',
    details: 'Détails du modèle',
    close: 'Fermer',
    providedBy: 'Fourni par {{name}}',
    trigger: 'Quand il est envoyé',
    recipients: 'Qui le reçoit',
    businessRule: "Conditions d'envoi",
    languagePolicy: 'Langue',
    combined:
      'Un seul message contient toutes les langues ({{languages}}). Chaque destinataire reçoit le même contenu.',
    singleLocale: 'Envoyé uniquement en {{language}}.',
    status: "Canaux d'envoi",
    statusHelp:
      'Indique si chaque canal est configuré. Cela ne teste pas la connexion et ne garantit pas que les messages sont remis.',
    configured: 'Configuré',
    unconfigured: 'Non configuré',
    enabled: 'Activé',
    disabled: 'Désactivé',
    variables: 'Variables',
    variablesHelp:
      "Espaces réservés remplacés par les vraies valeurs lors de l'envoi de la notification.",
    language: 'Langue',
    synthetic:
      "Utilise des données d'exemple fictives. L'aperçu n'envoie jamais de notification.",
    definition: 'Modèle avec variables',
    preview: 'Aperçu',
    html: 'Version HTML (affichée sous forme de code)',
    technical: 'Détails techniques',
    templateId: 'ID du modèle',
    package: 'Paquet',
    channelNames: 'Noms des canaux',
    channelTypes: {
      inApp: "Message dans l'application",
      email: 'E-mail',
    },
    loading: 'Chargement…',
    failed: 'Impossible de charger les modèles.',
    forbidden:
      "Vous n'avez pas l'autorisation de consulter les modèles de notification.",
    notFound: "Ce modèle n'existe plus.",
    retry: 'Réessayer',
    empty: "Il n'y a pas encore de modèle de notification.",
    noResults: 'Aucun modèle ne correspond à ces filtres.',
  },
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
