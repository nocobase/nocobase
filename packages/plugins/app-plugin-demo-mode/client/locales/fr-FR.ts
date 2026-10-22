import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Données de démonstration',
    read: 'Afficher',
    manage: 'Générer et effacer',
    configuration: 'Configuration de démonstration',
    configure: 'Configurer',
  },
  accounts: {
    menu: 'Compte de démonstration : {{name}}',
    title: 'Comptes de démonstration',
    description:
      'Entrez dans la démo avec l’un de ces comptes pour voir ce que voit chacun.',
    enter: 'Entrer',
    signedInAs: 'Connecté en tant que {{name}} · Changer',
    current: 'Actuel',
    entering: 'Connexion…',
    failed: 'Impossible d’entrer avec ce compte de démonstration.',
    unavailable:
      'Aucun compte de démonstration n’est disponible pour le moment.',
    password: 'Se connecter avec un mot de passe',
  },
  refused: {
    title:
      'Ceci est une démonstration. Les modifications ne peuvent pas être enregistrées.',
    description: 'Le reste fonctionne normalement.',
  },
  settings: {
    title: 'Environnement de démonstration',
    refresh: 'Actualiser',
    retry: 'Réessayer',
    busy: 'Les données de démonstration sont en cours de génération ou d’effacement',
    busyHelp:
      'Les réglages pourront être enregistrés à nouveau une fois l’opération terminée.',
    disabled: {
      title: 'Cette application n’est pas une démonstration',
      help: 'Le mode démonstration est désactivé. Le déploiement l’active avec NOCOBASE_DEMO_MODE.',
    },
    cancel: 'Annuler',
    save: 'Enregistrer',
    apply: 'Appliquer les modifications',
    unsaved: 'Modifications non enregistrées',
    discardAndReload: 'Abandonner mes modifications et recharger',
    switch: {
      on: 'Activé',
      off: 'Désactivé',
    },
    mode: {
      readOnly: 'Lecture seule',
      observe: 'Observation',
      readOnlyHelp:
        'Les visiteurs peuvent ouvrir toutes les pages, mais leurs modifications ne sont pas enregistrées, sauf si une exception ci-dessous le permet.',
      observeHelp:
        'Rien n’est refusé : les écritures que le mode lecture seule refuserait sont seulement journalisées, pour savoir quoi autoriser.',
    },
    tabs: {
      overview: 'Vue d’ensemble',
      schedule: 'Réinitialisation quotidienne',
      writes: 'Écritures des visiteurs',
      simulation: 'Simulation et IA',
    },
    leave: {
      title: 'Quitter sans enregistrer ?',
      description:
        'Les modifications non enregistrées de cette page seront perdues.',
      stay: 'Continuer la modification',
      discard: 'Abandonner les modifications',
    },
    errors: {
      failed: 'La requête n’a pas abouti. Réessayez.',
      conflict: 'Un autre administrateur a enregistré ce réglage en premier.',
      busy: 'Les données de démonstration sont en cours de génération ou d’effacement. Réessayez une fois terminé.',
      exists:
        'Les données de démonstration sont déjà générées. Réinitialisez-les plutôt.',
      demoModeRequired:
        'Possible uniquement lorsque le mode démonstration est activé.',
      accountConflict:
        'Un nom d’utilisateur de démonstration appartient à un compte que la démonstration ne possède pas.',
      unavailable:
        'Cette application ne fournit pas de données de démonstration.',
      signedOut: 'Votre session a expiré. Reconnectez-vous.',
      denied: 'Vous n’avez pas l’autorisation de gérer la démonstration.',
    },
    data: {
      title: 'Données de démonstration',
      state: {
        importing: 'Génération',
        clearing: 'Effacement',
        resetting: 'Réinitialisation',
        failed: 'Échec',
        ready: 'Prêtes',
        none: 'Non générées',
      },
      presentSummary: 'Générées en {{language}} · {{time}}',
      resettingSummary:
        'Effacement des données actuelles, puis nouvelle génération en {{language}}.',
      phase: {
        clearing: 'Effacement',
        generating: 'Nouvelle génération',
      },
      absentSummary:
        'Générez les données de démonstration pour que les visiteurs explorent l’application à travers une histoire complète.',
      language: 'Langue',
      clear: 'Effacer',
      reset: 'Réinitialiser',
      generate: 'Générer',
      failed: 'La dernière exécution n’a pas abouti',
      readOnly:
        'Vous pouvez consulter les données de démonstration ; générer, réinitialiser et effacer demandent l’autorisation de gestion.',
      unavailable: 'Aucune donnée de démonstration',
      unavailableHelp:
        'Cette application n’enregistre pas de jeu de données de démonstration.',
      cleared: 'Données de démonstration effacées',
      resetStarted: 'Réinitialisation des données de démonstration',
      importStarted: 'Génération des données de démonstration',
      confirm: {
        import: {
          title: 'Générer les données de démonstration ?',
          description:
            'Les données sont générées en {{language}} et leurs comptes de démonstration sont activés.',
        },
        reset: {
          title: 'Réinitialiser les données de démonstration ?',
          description:
            'Toutes les données métier de cette instance sont supprimées, y compris ce que les visiteurs ont ajouté, puis régénérées en {{language}}.',
        },
        clear: {
          title: 'Effacer les données de démonstration ?',
          description:
            'Toutes les données métier de cette instance sont supprimées, y compris ce que les visiteurs ont ajouté, et les comptes de démonstration sont désactivés. Les réglages et les administrateurs sont conservés.',
        },
      },
    },
    visitors: {
      title: 'Accès des visiteurs',
      description:
        'Les visiteurs entrent dans l’un de ces comptes sans mot de passe et peuvent passer de l’un à l’autre depuis le coin de chaque page.',
      off: 'La connexion rapide est désactivée pour ce déploiement.',
      pending:
        'Les comptes apparaissent ici une fois les données de démonstration prêtes.',
      noData:
        'Générez d’abord les données de démonstration ; leurs comptes apparaîtront ici.',
      credentials: 'Utilisateur {{username}} · mot de passe {{password}}',
      copyLink: 'Copier le lien',
      copyLinkFor: 'Copier le lien d’accès de {{name}}',
      openFor: 'Ouvrir la démonstration en tant que {{name}}',
      copied: 'Copié',
      copyFailed: 'Copie impossible. Copiez le lien depuis la barre d’adresse.',
      embed: 'Intégrer dans une page web',
      copyEmbed: 'Copier le code d’intégration',
      embedHelp:
        'La page doit être sur le même site que cette démonstration, par exemple un autre sous-domaine du même domaine ; sinon le navigateur ne garde pas les visiteurs connectés dans le cadre.',
    },
    schedule: {
      title: 'Réinitialisation quotidienne',
      description:
        'Une fois par jour, supprime ce que les visiteurs ont modifié et régénère les données de démonstration.',
      confirmTitle: 'Enregistrer la réinitialisation quotidienne ?',
      confirmDescription:
        'À l’heure ci-dessous, toutes les données métier de cette instance sont supprimées puis régénérées.',
      summary: 'Chaque jour à {{time}} ({{timezone}}), en {{language}}',
      off: 'Non planifiée',
      enabled: 'Réinitialiser chaque jour',
      enabledHelp:
        'Utilise l’administrateur qui a généré les données de démonstration en dernier.',
      time: 'Heure',
      hour: 'Heure',
      minute: 'Minute',
      language: 'Langue',
      timezone: 'Fuseau horaire',
      noTimezone: 'Aucun fuseau horaire ne correspond',
      invalidTimezone: 'Choisissez un fuseau horaire dans la liste.',
      next: 'Prochaine réinitialisation : {{time}}',
    },
    writes: {
      intro:
        'En lecture seule, toute modification est refusée. N’ouvrez que ce que les visiteurs doivent essayer, et seulement pour les enregistrements de la démonstration ; les autorisations métier s’appliquent toujours.',
      allow: 'Autoriser',
      revoke: 'Refuser à nouveau',
      scope: 'Portée',
      confirmTitle: 'Modifier ce que les visiteurs peuvent écrire ?',
      confirmDescription:
        'Les modifications des visiteurs sur ces éléments sont réellement enregistrées jusqu’à la prochaine réinitialisation.',
      operation: {
        insert: 'Créer',
        update: 'Modifier',
        delete: 'Supprimer',
      },
      capabilities: {
        title: 'Opérations métier',
        description:
          'Opérations que l’application a déclarées sûres à ouvrir, chacune limitée à une portée.',
        empty: 'Aucune opération enregistrée',
        emptyHelp:
          'L’application n’a enregistré aucune opération pouvant être ouverte en démonstration.',
      },
      collections: {
        title: 'Collections',
        description:
          'Toute requête autorisée peut écrire dans ces collections. À réserver à un état que personne ne peut détourner, comme les préférences d’affichage.',
        label: 'Collections que les visiteurs peuvent écrire',
        placeholder: 'Rechercher des collections',
        noMatch: 'Aucune collection ne correspond',
        fixed: 'Toujours accessibles en écriture',
        fixedHelp:
          'Les sessions de connexion et les exceptions propres au déploiement (NOCOBASE_DEMO_WRITABLE_COLLECTIONS) ; elles ne peuvent pas être modifiées ici.',
      },
    },
    simulation: {
      kind: {
        model: 'Modèle',
        tool: 'Outil',
        runner: 'Runner',
      },
      mocks: {
        title: 'Simulations',
        description:
          'Ce qui répond à la place des services externes dans cette démonstration.',
        confirmTitle: 'Modifier les simulations ?',
        confirmDescription:
          'Une simulation désactivée fait échouer ce travail ; il n’est jamais envoyé au vrai service.',
        empty: 'Aucune simulation enregistrée',
        emptyHelp: 'L’application n’a enregistré aucun service simulé.',
        onHelp: 'Répond avec des résultats simulés.',
        offHelp: 'Désactivée : le travail est refusé.',
      },
      chat: {
        title: 'Chat en ligne',
        description:
          'Permet aux visiteurs de discuter avec l’IA de l’application.',
        confirmTitle: 'Enregistrer les réglages du chat en ligne ?',
        confirmDescription:
          'Les conversations des visiteurs suivent ces réglages dès leur prochain message.',
        confirmLive:
          'Un vrai modèle répond aux visiteurs et chaque conversation est facturée sur son service de modèles.',
        enabled: 'Les visiteurs peuvent discuter',
        enabledHelp: 'Désactivé : le chat refuse les messages des visiteurs.',
        model: 'Réponses de',
        simulated: 'Modèle simulé',
        live: 'Un vrai modèle',
        simulatedHelp: 'Réponses scénarisées ; aucun coût.',
        liveHelp:
          'Un service de modèles existant répond ; ses identifiants y restent.',
        service: 'Service de modèles',
        modelId: 'Modèle',
        cost: 'Chaque conversation d’un visiteur consomme des tokens de ce service.',
        tools: 'Outils',
        noTools: 'L’application ne déclare aucun outil de chat.',
        policy: {
          deny: 'Refuser',
          read: 'Lire les données',
          mock: 'Simuler',
        },
      },
    },
  },
};
export default resource;
