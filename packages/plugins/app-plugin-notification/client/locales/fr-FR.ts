import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  templates: {
    title: 'Modèles de notification',
    coverage:
      'Scénarios enregistrés uniquement. Les envois dynamiques, fonctions personnalisées et modèles privés sont exclus. Définitions et aperçus sont en lecture seule.',
    search: 'Rechercher des scénarios',
    category: 'Catégorie',
    channel: 'Canal',
    all: 'Tous',
    details: 'Voir les détails',
    close: 'Fermer les détails',
    trigger: 'Déclencheur',
    recipients: 'Règle des destinataires',
    businessRule: 'Activation métier',
    contributor: 'Source',
    languagePolicy: 'Comportement linguistique',
    status: 'Configuration du canal',
    statusHelp:
      'Enregistrer une définition ne signifie pas activer les notifications. La configuration ne garantit pas la connexion.',
    configured: 'Configuré',
    unconfigured: 'Non configuré',
    enabled: 'Activé',
    disabled: 'Désactivé',
    unknown: 'Inconnu',
    variables: 'Variables disponibles',
    language: 'Langue du contenu',
    synthetic:
      'Données synthétiques uniquement. Cet aperçu ne transmet aucune notification et ne modifie aucune configuration.',
    definition: 'Définition du modèle',
    preview: 'Aperçu synthétique',
    html: 'Source HTML (texte inerte)',
    loading: 'Chargement…',
    failed: 'Impossible de charger les modèles.',
    forbidden: 'Vous ne pouvez pas consulter ces modèles.',
    notFound: 'Ce modèle n’est plus enregistré.',
    retry: 'Réessayer',
    empty: 'Aucun scénario enregistré.',
    noResults: 'Aucun scénario ne correspond aux filtres.',
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
