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
    menu: 'Compte : {{name}}',
    title: 'Comptes',
    description:
      'Entrez dans la démo avec l’un de ces comptes pour voir ce que voit chacun.',
    enter: 'Entrer',
    signedInAs: 'Connecté en tant que {{name}} · Changer',
    current: 'Actuel',
    entering: 'Connexion…',
    failed: 'Impossible d’accéder à ce compte.',
    unavailable: 'Aucun compte n’est disponible pour le moment.',
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
      'Attendez la fin de l’opération en cours avant d’en lancer une autre.',
    disabled: {
      title: 'Cette application n’est pas une démonstration',
      help: 'Le mode démonstration est désactivé. Le déploiement l’active avec NOCOBASE_DEMO_MODE=true.',
    },
    cancel: 'Annuler',
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
      unavailable: 'Aucun compte n’est disponible pour le moment.',
      title: 'Comptes',
      username: 'Identifiant {{username}}',
      copyLink: 'Copier le lien',
      copyLinkFor: 'Copier le lien d’accès de {{name}}',
      openFor: 'Ouvrir la démonstration en tant que {{name}}',
      copied: 'Copié',
      copyFailed: 'Copie impossible. Copiez le lien depuis la barre d’adresse.',
    },
    schedule: {
      title: 'Réinitialisation quotidienne',
      description:
        'Les données de démonstration sont réinitialisées automatiquement chaque jour. La planification est configurée via les variables d’environnement.',
      time: 'Heure',
      language: 'Langue',
      timezone: 'Fuseau horaire',
      next: 'Prochaine réinitialisation : {{time}}',
    },
  },
};
export default resource;
