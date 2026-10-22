import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  navigation: {
    mailExample: 'Exemple de courrier',
    workspace: 'Boîte de réception et composition',
    accounts: 'Comptes',
    allMail: 'Tout le courrier',
    activity: 'Envoyer une activité',
    syncLogs: 'Journaux de synchronisation',
  },
  workspace: {
    title: 'Boîte de réception et composition',
    description:
      'Lisez des exemples de messages, inspectez les pièces jointes, répondez ou rédigez un nouveau message. Le fournisseur fictif accepte les envois sans contacter un service de messagerie externe.',
  },
  activity: {
    title: 'Envoyer une activité',
    description:
      "Examinez les enregistrements de livraison créés par le flux d’envoi normal de Mail. Le fournisseur fictif simule l'acceptation et Mail stocke le message dans le dossier Envoyé local.",
    subject: 'Objet',
    recipients: 'Destinataires',
    account: 'Envoi du compte',
    status: 'Statut',
    created: 'Soumis',
    noSubject: '(pas de sujet)',
    loadFailed: "Impossible de charger l'activité d'envoi.",
    emptyTitle: "Aucune activité d'envoi pour l'instant",
    emptyDescription:
      "Envoyez un exemple de message depuis l'espace de travail pour voir son résultat de livraison simulé ici.",
    statuses: {
      pending: 'En attente',
      submitting: 'Envoi',
      accepted: 'Accepté (simulé)',
      failed: 'Échec',
      unknown: 'Inconnu',
      cancelled: 'Annulé',
    },
  },
  providers: {
    demo: 'Gmail (maquette)',
    'demo-microsoft': 'Microsoft 365 (maquette)',
    'demo-imap-smtp': 'IMAP/SMTP (simulé)',
  },
  accounts: {
    title: 'Comptes de boîtes aux lettres',
    description:
      'Préparation des exemples de boîtes aux lettres et de leurs messages.',
  },
  allMail: {
    title: 'Tout le courrier',
    description:
      "Parcourez le courrier importé des boîtes aux lettres fictives, recherchez par mot-clé et inspectez le compte de chaque message, l'état de lecture, l'étoile et les métadonnées des pièces jointes.",
    listTitle: 'Liste des messages',
    resultCount: 'Messages {{count}}',
    pageCount: 'Page {{page}} de {{pages}}',
    searchLabel: 'Rechercher du courrier',
    searchPlaceholder:
      "Rechercher le sujet, l'expéditeur ou le contenu du message",
    search: 'Rechercher',
    account: 'Compte',
    from: 'De',
    subject: 'Objet et aperçu',
    flags: 'État des messages',
    date: 'Reçu',
    unread: 'Non lu',
    starred: 'Favoris',
    attachment: 'Pièce jointe',
    previous: 'Précédent',
    next: 'Suivant',
    emptyTitle: 'Aucun message trouvé',
    emptyDescription:
      'Essayez un autre mot-clé ou effacez la recherche pour afficher tous les messages fictifs.',
    loadFailed: 'Impossible de charger tous les messages.',
  },
  syncLogs: {
    title: 'Journaux de synchronisation',
    description:
      "Examinez l'historique et les exécutions de synchronisation incrémentielle pour les trois boîtes aux lettres fictives, y compris l'état, la phase, le nombre de traitements et les erreurs.",
    account: 'Compte de boîte aux lettres',
    mode: 'Mode synchronisation',
    status: 'Statut',
    phase: 'Phases',
    progress: 'Progrès',
    started: 'Démarré',
    completed: 'Terminé',
    error: 'Erreur',
    unknownAccount: 'Compte inconnu',
    empty:
      "Aucune synchronisation n'est encore exécutée. Démarrez une synchronisation à partir de la page des comptes.",
    loadFailed: 'Impossible de charger les journaux de synchronisation.',
    pageCount: "Page {{page}} de {{pages}} · {{total}} s'exécute",
    messages: 'Messages {{count}} traités',
    batches: 'Lots {{count}}',
    modes: {
      initial: 'Synchronisation initiale',
      incremental: 'Synchronisation incrémentielle',
    },
    statuses: {
      pending: 'En attente',
      running: 'En cours d’exécution',
      completed: 'Terminé',
      partial: 'Partielle',
      failed: 'Échec',
      cancelled: 'Annulé',
    },
    phases: {
      preparing: 'Préparation',
      history: 'Historique des messages',
      catchUp: 'Rattraper son retard',
      incremental: 'Mises à jour incrémentielles',
      completed: 'Terminé',
    },
  },
  demo: {
    noPreview: 'Aucun aperçu disponible.',
    preparing:
      'Préparation des données de la boîte aux lettres de démonstration…',
    retry: 'Réessayer la configuration',
    openWorkspace: "Ouvrir l'espace de travail de messagerie",
    refresh: 'Actualiser',
    loading: 'Chargement…',
  },
};

export default frFR;
