import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  business: {
    scenarios: 'Scénarios temps réel',
    tabs: {
      tasks: 'Tâches',
      inbox: 'Boîte de réception',
      exports: 'Exportations',
      lab: 'Laboratoire de capacités',
    },
    assignee: 'Responsable assigné',
    creator: 'Créé par',
    updated: 'Dernière mise à jour',
    statusLabel: 'Statut',
    detail: 'Détails de la tâche',
    saving: 'Sauvegarde…',
    saved: 'Statut de la tâche mis à jour',
    updating: 'Mise à jour…',
    previous: 'Précédent',
    next: 'Suivant',
    close: 'Fermer',
    cancel: 'Annuler',
    create: 'Créer',
    created: 'Tâche créée "{{title}}"',
    status: {
      open: 'À faire',
      'in-progress': 'En cours',
      done: 'Terminé',
    },
    actions: {
      'in-progress': 'Démarrer',
      done: 'Terminé',
      open: 'Réouvrir',
    },
    form: {
      help: "Décrivez le travail et choisissez qui doit s'en charger.",
      title: 'Titre',
      description: 'Description',
      choose: 'Choisir un cessionnaire',
      titleRequired: 'Saisissez un titre de 1 à 200 caractères.',
      descriptionRequired: 'Décrivez ce qui doit être fait.',
      assigneeRequired: 'Choisissez un cessionnaire actif.',
    },
    errors: {
      session: 'Votre session est terminée. Connectez-vous à nouveau.',
      forbidden:
        "Vous n'avez plus accès à cette tâche. Fermez-le et vérifiez auprès de son créateur.",
      missing:
        "Cet enregistrement n'existe plus. Fermez-le ou revenez à la liste actuelle.",
      failed: 'La demande a échoué. Veuillez réessayer.',
      active:
        'Une exportation est toujours en cours. Attendez que ça se termine.',
    },
    read: 'Lire',
    unread: 'Non lu',
    markRead: 'Marc a lu',
    markUnread: 'Marquer comme non lu',
    markedRead: 'Notification marquée comme lue',
    markedUnread: 'Notification marquée non lue',
    loadMore: 'Charger plus',
    jobs: {
      queued: "En file d'attente",
      running: 'Exportation',
      completed: 'Prêt à télécharger',
      failed: 'Échec',
    },
    tasks: {
      title: 'Collaboration dans les tâches',
      description:
        'Attribuez les travaux et suivez ensemble leur avancement en temps réel.',
      try: "Essayez deux fenêtres : créez une tâche ici, puis regardez-la apparaître et changer de statut dans l'autre fenêtre. Seules les tâches que vous avez créées ou assignées sont visibles.",
      create: 'Nouvelle tâche',
      empty: "Aucune tâche pour l'instant",
      emptyHelp:
        'Créez une tâche réelle, attribuez-la à vous-même ou à un collègue et suivez-la ici.',
      stageEmpty: 'Aucune tâche à ce stade sur cette page',
      page: "Page {{page}} · Tâches {{count}} au total. Les colonnes affichent jusqu'à 30 tâches sur cette page.",
    },
    inbox: {
      title: 'Boîte de réception personnelle',
      description:
        "Recevez des affectations de tâches et des mises à jour, et synchronisez l'état de lecture sur toutes les fenêtres.",
      try: 'Attribuez-vous une tâche pour recevoir une notification. Pour la collaboration, utilisez un autre compte : les mises à jour préviennent les autres participants. Cette boîte de réception comprend toutes les notifications de votre candidature.',
      empty: "Aucune notification pour l'instant",
      emptyHelp:
        'Créez une tâche qui vous est assignée dans Tâches, puis revenez ici.',
    },
    exports: {
      missing:
        "Ce fichier d'exportation n'est plus disponible. Créez une nouvelle exportation pour télécharger vos tâches actuelles.",
      title: 'Exportations de tâches',
      description:
        'Exportez vos tâches visibles en arrière-plan et téléchargez le CSV résultant.',
      try: 'Démarrez une exportation, changez de page, puis revenez pour la télécharger. Une autre fenêtre suit le même travail. La progression compte les vraies lignes ; une petite exportation peut se terminer immédiatement.',
      create: 'Exporter des tâches',
      empty: "Aucune exportation pour l'instant",
      emptyHelp:
        'Générez un instantané CSV de vos tâches, y compris leurs descriptions, leur statut et leurs responsables.',
      accepted: "L'exportation a commencé",
      active:
        'Une exportation est en cours. Vous pouvez quitter cette page et revenir plus tard.',
      file: 'Tâches CSV',
      rows: 'Lignes {{processed}} / {{total}} traitées',
      progress: "Progression de l'exportation",
      limit:
        "L'export dépasse 5 000 tâches. Cet exemple prend en charge au maximum 5 000 lignes par exportation.",
      failed:
        "L'exportation a échoué. Utilisez les tâches d'exportation pour démarrer une nouvelle tentative.",
      download: 'Télécharger',
      downloaded: 'Le téléchargement CSV a commencé',
      retention:
        'Vos 20 dernières exportations sont conservées. Chaque fichier est un instantané des tâches auxquelles vous pouviez accéder lors de sa génération.',
    },
  },
  routeOverlay: {
    close: 'Fermer',
  },
  title: 'Exemples en temps réel',
  description:
    "Explorez les abonnements, le contrôle d'accès et la récupération avec des événements en direct et des instantanés observables.",
  scope:
    "Les valeurs de démonstration appartiennent à votre compte, sont actives dans ce processus uniquement et sont réinitialisées après une heure d'inactivité ou un redémarrage du serveur.",
  account: 'Compte courant',
  loading: 'Chargement',
  working: 'Travailler…',
  retry: 'Réessayer',
  reload: 'Recharger la démonstration',
  signIn: 'Connectez-vous à nouveau',
  cancel: 'Annuler',
  connection: 'Connexion',
  subscription: 'Abonnement',
  events: 'Événements reçus',
  ready: 'Remerciements',
  snapshot: 'Instantané observé',
  reads: "Lectures d'instantanés terminées",
  readAt: 'Dernière lecture réussie',
  waiting: 'En attendant le premier événement…',
  none: 'Pas encore disponible',
  topic: 'Sujet',
  receipt: 'Dernier accusé de réception de publication',
  pause: "Suspendre l'abonnement",
  resume: "Reprendre l'abonnement",
  reconnect: 'Reconnexion',
  states: {
    idle: 'Inactif',
    connecting: 'Connexion',
    open: 'Ouvert',
    reconnecting: 'Reconnexion',
    closed: 'Fermé',
    pending: 'En attente',
    subscribing: 'Abonnement',
    subscribed: 'Abonné',
    error: 'Erreur',
  },
  clock: {
    title: '1. Sujet public et hook React',
    description:
      "useRealtimeTopic s'abonne à l'horloge publique. La pause libère la montre de cette carte.",
    latest: 'Dernière heure du serveur',
    paused:
      'Cette carte est en pause. Reprenez pour recevoir de nouveaux ticks.',
    initial:
      "L'horloge commence à publier lorsque son premier abonné est reconnu.",
  },
  personal: {
    title: '2. Événements personnels',
    description:
      "submitFor cible votre compte. Un autre onglet de ce compte reçoit l'événement ; un autre compte ne le fait pas.",
    send: 'Envoyer sur mon compte',
    empty:
      "Aucun événement personnel pour l'instant. Envoyez-en un pour observer la livraison.",
    recovery:
      'onReady lit le dernier instantané personnel après chaque accusé de réception.',
  },
  room: {
    title: '3. Autorisation de ressources dynamiques',
    description:
      "Cette salle utilise la même politique de propriétaire et d'accès pour les lectures HTTP et la livraison en temps réel.",
    allowed: 'Accès accordé',
    denied: 'Accès refusé',
    grant: "Accorder l'accès",
    revoke: "Révoquer l'accès",
    retry: "Réessayer l'abonnement",
    send: 'Publier le changement de salle',
    grantHint: "Accordez l'accès, puis réessayez l'abonnement refusé.",
    retryHint:
      "L'accès est accordé. Réessayez pour obtenir un nouvel accusé de réception.",
    revokeTitle: "Révoquer l'accès à votre salle de démonstration ?",
    revokeDescription:
      "Les abonnements existants perdent l'accès et effacent l'instantané de la salle. Vous pouvez accorder à nouveau l'accès.",
    blocked:
      "L'instantané de la salle est masqué alors que l'accès est refusé.",
    success: 'Accès à la salle mis à jour',
  },
  counter: {
    title: '4. Actualisation et rattrapage fusionnés',
    description:
      'Cinq invalidations mettent à jour un compteur. useRealtimeRefresh fusionne les lectures ; comparer le nombre augmente après la préparation initiale.',
    burst: 'Publier 5 modifications',
    pause: "Suspendre l'actualisation en direct",
    resume: "Reprendre l'actualisation en direct",
    paused:
      "L'actualisation de l'instantané est suspendue ; l'observateur d'événement reste actif. Publiez à nouveau, puis reprenez pour rattraper votre retard.",
    running:
      "L'actualisation de l'instantané est active. Les onglets masqués s'actualisent lorsqu'ils sont à nouveau visibles.",
    refreshing: "Actualisation de l'instantané…",
    note: 'Cette valeur provient uniquement du API lu, jamais de la réponse de publication.',
  },
  unknown: {
    title: "5. Erreurs d'abonnement",
    description:
      'Un sujet non déclaré est rejeté sans arrêter les sujets autorisés.',
    try: 'Essayez un sujet inconnu',
    explanation:
      'TOPIC_NOT_FOUND est attendu ici. Le serveur doit déclarer un sujet avant de pouvoir y souscrire.',
    initial:
      "Démarrez la tentative d'observation d'une erreur de protocole réelle.",
  },
  recovery: {
    title: '6. Récupération de connexion',
    description:
      'Déconnectez les sockets locaux de ce compte, y compris les autres onglets. Le client se reconnecte automatiquement et onReady récupère les modifications manquées.',
    disconnect: 'Simuler la déconnexion',
    history: 'États de connexion récents',
    note: "La reconnexion en haut rouvre la connexion de l'application partagée. Les événements sont transitoires : les instantanés récupèrent leur état sans relecture.",
    instruction:
      "Publier les modifications depuis un autre onglet. Reprenez une actualisation en pause pour rattraper votre retard ; reconnect récupère les instantanés pendant que l'actualisation est active.",
    disconnected: 'Sockets temps réel déconnectés',
  },
  published: 'Publication acceptée',
  errors: {
    request: 'La demande a échoué. Essayer à nouveau.',
    session: 'Votre session est terminée. Connectez-vous à nouveau.',
    forbidden: "L'accès est refusé. Vérifiez vos autorisations actuelles.",
    expired:
      'La manifestation est terminée. Rechargez-le pour créer une nouvelle pièce.',
    capacity: 'La manifestation est occupée. Réessayez plus tard.',
    subscription:
      "L'abonnement a échoué. Reconnectez-vous ou réessayez une fois l’accès restauré.",
  },
};

export default frFR;
