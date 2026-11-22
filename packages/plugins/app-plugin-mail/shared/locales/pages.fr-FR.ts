import type { MailPagesResource } from './pages.en-US.js';

const pagesFrFR: MailPagesResource = {
  navigation: {
    mail: 'Courrier',
    mailTeam: "Courrier de l'équipe",
    mailAccounts: 'Comptes de messagerie',
    mailAccountsDescription:
      'Connectez vos boîtes aux lettres et gérez signatures, modèles et étiquettes.',
    mailSettings: 'Courrier',
    mailSettingsDescription:
      "Fournisseurs de messagerie, état de chaque compte, journaux de synchronisation et d'envoi.",
  },
  access: {
    section: 'Courrier',
    team: {
      title: "Courrier de l'équipe",
      description: 'Courrier synchronisé des membres, en lecture seule.',
      actions: {
        view: 'Afficher',
        process: 'Traiter (marquer comme lu, suivre, archiver)',
      },
    },
    settings: {
      title: 'Courrier',
      actions: {
        read: 'Afficher',
        manage:
          'Gérer (relancer et annuler les synchronisations et envois des membres)',
      },
    },
  },
  pages: {
    loading: 'Chargement…',
    empty: 'Rien à afficher.',
    member: 'Membre',
    allMembers: 'Tous les membres',
    workspace: {
      reauthorizationNotice:
        "{{addresses}} doit être reconnecté : d'ici là, aucune synchronisation ni aucun envoi n'a lieu.",
      reauthorize: 'Reconnecter dans Comptes de messagerie',
      needsReauthorization: 'réautorisation requise',
    },
    accounts: {
      title: 'Comptes de messagerie',
      description:
        "Connectez vos boîtes aux lettres pour envoyer et recevoir dans Courrier. Vous seul voyez votre courrier ; les personnes ayant accès au Courrier de l'équipe peuvent le lire sans le modifier.",
      reauthorizationNotice:
        "L'autorisation de {{addresses}} n'est plus acceptée : aucune synchronisation ni aucun envoi n'a lieu tant que vous ne le reconnectez pas avec le même fournisseur.",
      reauthorize: 'Reconnecter',
      tabs: {
        accounts: 'Comptes',
        signatures: 'Signatures',
        templates: 'Modèles',
        labels: 'Étiquettes',
        activity: 'Activité',
      },
    },
    activity: {
      sends: 'Envois',
      syncs: 'Synchronisations',
    },
    logs: {
      started: 'Début',
      time: 'Heure',
      account: 'Compte',
      accountMember: 'Compte · membre',
      mode: 'Mode',
      initial: 'Première synchronisation',
      incremental: 'Incrémentielle',
      result: 'Résultat',
      allResults: 'Tous les résultats',
      detail: 'Détail',
      reason: 'Raison',
      processed: '{{count}} messages',
      subject: 'Objet',
      recipients: 'Destinataires',
      recipientCount: 'Destinataires',
      bulk: 'Envoi groupé',
      bulkCount: '{{count}} (groupé)',
      showRecipients: 'Afficher les destinataires',
      hideRecipients: 'Masquer les destinataires',
      scheduled: 'Programmé',
      retry: 'Relancer',
      cancel: 'Annuler',
      window: 'Période',
      windows: {
        day: 'Dernières 24 heures',
        week: '7 derniers jours',
        month: '30 derniers jours',
        all: 'Toute la période',
      },
    },
    team: {
      title: "Courrier de l'équipe",
      description:
        'Lisez le courrier synchronisé par les membres, pour les passations et les contrôles de conformité. Ouvrir un message ne le marque pas comme lu et vous ne pouvez pas répondre.',
      account: 'Compte',
      allAccounts: 'Tous les comptes',
      participant: 'Adresse ou @domaine',
      keyword: "Mot-clé de l'objet",
      memberAccount: 'Membre · compte',
      counterpart: 'Avec',
      view: 'Afficher',
      selectAll: 'Tout sélectionner sur cette page',
      empty: 'Aucun courrier synchronisé ne correspond.',
      readOnly: "Lecture seule. L'ouvrir ne le marque pas comme lu.",
      applied: '{{succeeded}} mis à jour, {{failed}} en échec.',
      actions: {
        markRead: 'Marquer comme lu',
        star: 'Suivre',
        archive: 'Archiver',
      },
    },
    settings: {
      title: 'Courrier',
      description:
        "Les fournisseurs de messagerie que les membres peuvent connecter, et l'état de connexion, de synchronisation et d'envoi de chaque compte. Aucun contenu de message n'est affiché ici. Les e-mails de notification système se configurent dans Notifications.",
      tabs: {
        providers: 'Fournisseurs',
        accounts: 'Comptes',
        syncRuns: 'Journaux de synchronisation',
        submissions: "Journaux d'envoi",
        runtime: "Configuration d'exécution",
      },
      sources: {
        environment: "Variable d'environnement",
        config: 'config.yml',
        default: 'Par défaut',
        code: 'Code',
        unknown: 'Inconnu',
      },
      providers: {
        name: 'Nom',
        type: 'Type',
        capabilities: 'Capacités',
        accounts: 'Comptes',
        source: 'Source',
        attention: '{{count}} nécessitent une réautorisation',
        howTo: 'Ajouter un fournisseur',
        howToDescription:
          "Ajoutez une entrée sous mail.providers dans la configuration de l'application et conservez les secrets dans des variables d'environnement. Redémarrez l'application pour l'appliquer.",
        callbackHint:
          'Enregistrez cette URL de redirection OAuth auprès de Google ou de Microsoft :',
      },
      accounts: {
        filter: {
          all: 'Tous',
          attention: 'Réautorisation requise',
          suspended: 'Désactivés',
        },
        provider: 'Fournisseur',
        allProviders: 'Tous les fournisseurs',
        search: 'Membre ou adresse',
        lastSynced: 'Dernière synchronisation',
        status: 'État',
        showRuns: 'Synchronisations',
        note: 'Les administrateurs ne peuvent ni autoriser ni supprimer les comptes des membres. Chaque membre reconnecte son propre compte dans Paramètres personnels › Comptes de messagerie.',
      },
      runtime: {
        setting: 'Paramètre',
        value: 'Valeur actuelle',
        effect: 'Effet',
        automaticSyncInterval: 'Intervalle de synchronisation automatique',
        automaticSyncIntervalEffect:
          'Fréquence à laquelle les comptes sans notifications push sont vérifiés pour du nouveau courrier.',
        syncBatchSize: 'Messages par lot de synchronisation',
        syncBatchSizeEffect:
          'Des lots plus grands terminent plus vite une première synchronisation, mais atteignent plus facilement les limites de débit du fournisseur.',
        oauthCallbackUrl: 'URL de redirection OAuth',
        oauthCallbackUrlEffect:
          'Enregistrez-la dans la console développeur de Google ou de Microsoft.',
        oauthReturnUrl: "Page après l'autorisation",
        oauthReturnUrlEffect:
          'Page où revient une personne après avoir connecté un compte OAuth.',
        pushWebhook: 'Webhook push',
        pushWebhookEffect:
          "Sans lui, Gmail et Microsoft 365 sont aussi vérifiés à l'intervalle de synchronisation.",
        jobs: 'Tâches en arrière-plan',
        jobsEffect:
          "Les déploiements à plusieurs instances nécessitent une file d'attente partagée.",
        logRetention: 'Conservation des journaux',
        logRetentionEffect:
          'Les synchronisations et envois terminés plus anciens sont supprimés automatiquement.',
        credentialVault: 'Stockage des identifiants',
        credentialVaultEffect:
          'Emplacement des jetons OAuth et des mots de passe des comptes connectés.',
        minutes: '{{count}} minutes',
        days: '{{count}} jours',
        keepForever: 'Conservés indéfiniment',
        notConfigured: 'Non configuré',
        secretConfigured: 'Secret configuré',
        secretMissing: 'Aucun secret configuré',
        jobsDefault: 'Suit jobs.default',
        vaultBuiltin: "Intégré, dans la base de données de l'application",
        vaultApplication: "Enregistré par l'application",
        copy: 'Copier',
        copied: 'Copié',
        readOnly:
          "Lecture seule : ces paramètres proviennent de config.yml et des variables d'environnement MAIL_* et s'appliquent après un redémarrage.",
      },
    },
  },
};

export default pagesFrFR;
