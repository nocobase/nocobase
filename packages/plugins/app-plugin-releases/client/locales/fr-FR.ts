import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  access: {
    section: 'Versions',
    pages: {
      'rel-apps': 'Applications',
    },
    businessSection: 'Versions',
    businesses: {
      apps: {
        title: 'Applications',
        description:
          "Applications, leurs versions, déploiements et environnement d'exécution.",
        actions: {
          view: {
            title: 'Afficher les applications',
            description:
              "Voir les applications, leurs versions, déploiements et statut d'exécution",
            related: 'Afficher les applications (celles qui leur sont liées)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Afficher les applications (toutes)',
          },
          readLogs: {
            title: 'Lire les journaux',
            description: "Lire les journaux d'application et de déploiement",
            related: 'Lire les journaux (ceux qui leur sont liés)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Lire les journaux (tous)',
          },
          create: {
            title: 'Créer des applications',
            description: 'Créer des applications dans un environnement',
            all: 'Créer des applications',
          },
          configure: {
            title: 'Configurer les applications',
            description:
              "Lire et modifier la configuration d'une application, qui peut contenir des secrets",
            related: 'Configurer les applications (celles qui leur sont liées)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Configurer les applications (toutes)',
          },
          upload: {
            title: 'Télécharger les versions',
            description: 'Télécharger et promouvoir des versions',
            related: 'Télécharger les versions (celles qui leur sont liées)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Télécharger les versions (toutes)',
          },
          deploy: {
            title: 'Déployer',
            description:
              'Déployer et restaurer sur des environnements non protégés, demander des déploiements sur ceux protégés',
            related: 'Déployer (ceux qui leur sont liés)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Déployer (tous)',
          },
          deployProtected: {
            title: 'Approuver les déploiements protégés',
            description:
              'Approuver les déploiements dans des environnements protégés qui ne nomment aucun approbateur ; les gens seulement',
            related:
              'Approuver les déploiements protégés (ceux qui leur sont liés)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Approuver les déploiements protégés (tous)',
          },
          operate: {
            title: 'Démarrer et arrêter',
            description: 'Démarrer, arrêter et redémarrer les applications',
            related: 'Démarrer et arrêter (ceux qui leur sont liés)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Démarrer et arrêter (tous)',
          },
          delete: {
            title: 'Supprimer des applications',
            description: 'Supprimer une application avec ses données',
            related: 'Supprimer les applications (celles qui leur sont liées)',
            relatedLabel: "Ceux que j'ai créés",
            relatedHint:
              "Applications que j'ai créées et toutes les applications qui me concernent",
            all: 'Supprimer les applications (toutes)',
          },
        },
      },
    },
    recordAccess: {
      owned: "Applications qu'ils ont créées",
    },
    settings: {
      rel: {
        environments: 'Déployer des environnements',
      },
    },
    keyScopes: {
      apps: {
        title: 'Applications et déploiements',
        description:
          'Lire : voir les applications, les versions, les déploiements et les journaux. Lire et écrire : téléchargez également des versions. Administrateur : déployez et démarrez ou arrêtez également des applications.',
        objects: 'Applications',
      },
      environments: {
        title: 'Déployer des environnements',
        description:
          'Lire : répertorier les environnements. Lire et écrire : gérez-les.',
      },
      presets: {
        ciDeploy: {
          title: 'Déploiement CI',
          description:
            'Téléchargez les versions sur les applications choisies et déployez-les pendant 90 jours.',
        },
        ciUpload: {
          title: 'Téléchargement de CI',
          description:
            'Téléchargez les versions vers les applications choisies sans les déployer, pendant 90 jours.',
        },
      },
    },
    actions: {
      read: 'Afficher',
      manage: 'Gérer',
      view: 'Afficher',
      'read-logs': 'Lire les journaux',
      create: 'Créer',
      configure: 'Configurer',
      upload: 'Télécharger les versions',
      deploy: 'Déployer',
      'deploy-protected': 'Approuver les déploiements protégés',
      operate: 'Démarrer et arrêter',
      delete: 'Supprimer',
    },
  },
  drivers: {
    host: 'Ce serveur',
  },
  ui: {
    nav: {
      apps: 'Applications',
      environments: 'Déployer des environnements',
    },
    apps: {
      title: 'Applications',
      description: 'Applications, leurs versions et où elles sont déployées.',
      search: 'Recherche par ID ou nom',
      create: 'Créer une application',
      id: "Identifiant de l'application",
      name: 'Nom',
      environment: 'Environnement',
      version: 'Version',
      state: 'État',
      url: 'Adresse',
      labels: 'Etiquettes',
      loadFailed: 'Impossible de charger les applications.',
      loadOneFailed: "Impossible de charger l'application.",
      emptyTitle: "Aucune application pour l'instant",
      emptyNoAccess: 'Demandez à un administrateur de créer une application.',
      emptyDescription:
        'Créez une application, puis téléchargez une version et déployez-la dans un environnement.',
      noResults: 'Aucune application ne correspond à la recherche.',
      created: '{{name}} créé.',
      createDescription:
        'Une application est déployée dans un environnement ; ses sorties sont téléchargées par la suite.',
      idHint:
        "Lettres, chiffres, traits de soulignement et traits d'union ; une partie de son adresse. Cela ne peut pas changer plus tard.",
      noEnvironment: "Pas encore d'environnement",
      lastAccess: 'Dernière visite',
    },
    advanced: 'Avancé (facultatif)',
    labels: {
      name: 'Nom',
      value: 'Valeur',
      nameOf: "Nom de l'étiquette {{index}}",
      valueOf: 'Valeur du label {{index}}',
      remove: "Supprimer l'étiquette {{index}}",
      add: 'Ajouter une étiquette',
      hint: 'Les étiquettes permettent aux outils et aux utilisateurs de rechercher et de regrouper des applications et des versions.',
      count_one: 'Étiquette {{count}}',
      count_other: 'Étiquettes {{count}}',
      system: 'Libellés ajoutés par le système',
      systemHint: 'Ajouté par le système ; cela ne peut pas être modifié ici.',
      errors: {
        keyRequired: 'Entrez un nom pour cette valeur.',
        keyInvalid:
          'Utilisez des lettres, des chiffres, ".", "_", "/" ou "-", commençant par une lettre ou un chiffre (au maximum 63).',
        keyDuplicate: 'Ce nom est déjà utilisé.',
        valueTooLong: 'Au maximum des caractères {{max}}.',
        tooMany: 'Au plus des étiquettes {{max}}.',
      },
      count_many: 'Étiquettes {{count}}',
    },
    policy: {
      title: 'Environnement d’exécution',
      activationLabel: 'Démarrer',
      activation: {
        eager: 'Toujours en marche',
        onDemand: 'Commence en visite',
      },
      activationHint: {
        eager:
          'Démarré lors du déploiement et à chaque redémarrage du runtime.',
        onDemand:
          'Démarré par sa première visite après un déploiement ou un redémarrage du runtime.',
      },
      idleLabel: "Arrêtez-vous lorsque vous n'êtes pas visité pendant",
      dormantLabel: "Hiberner lorsqu'il n'est pas visité pendant",
      idleModeLabel: 'Fonctionnement du minuteur d’inactivité',
      dormantModeLabel: 'Fonctionnement du minuteur d’hibernation',
      minutes: 'minutes',
      hours: 'heures',
      neverIdle: 'Jamais',
      neverDormant: 'Jamais',
      timerMode: {
        inherit: 'Utiliser la valeur par défaut de l’environnement',
        custom: 'Définir une valeur personnalisée',
      },
      customTimerHint:
        'Une valeur personnalisée vide désactive ce minuteur ; la valeur par défaut de l’environnement n’est pas utilisée.',
      idleSummary: "s'arrête après {{minutes}} min sans visite",
      dormantSummary: 'hiberne après {{hours}} h',
      timersHint:
        'Une application arrêtée libère sa mémoire et redémarre à la prochaine visite. Une application en veille prolongée voit également ses fichiers décompressés supprimés ; la configuration et les données sont conservées et la prochaine visite les prépare à nouveau, ce qui prend plus de temps.',
      unsupported:
        "Cet environnement ne prend pas en charge le démarrage sur visite ; l'application continue de fonctionner.",
      errors: {
        idleInvalid:
          'Entrez les minutes entières de 1 à {{max}} ou laissez-le vide.',
        dormantInvalid:
          'Entrez les heures de 0,02 (une minute) à {{max}}, ou laissez ce champ vide.',
        dormantBeforeIdle: "L'hibernation doit intervenir après l'arrêt.",
      },
    },
    state: {
      pending: 'Démarrage',
      starting: 'Démarrage',
      running: 'En cours d’exécution',
      stopped: 'Arrêté',
      stoppedOnDemand: 'Arrêté (démarrage sur visite)',
      dormant: 'Hibernation (préparé en visite)',
      failed: 'Échec',
      unknown: 'Inconnu',
      deploying: 'Déploiement',
    },
    operate: {
      refreshFailed:
        "Impossible d'actualiser l'état de l'application. Les opérations ne sont pas disponibles jusqu'à ce que l'état soit actualisé. Vérifiez votre connexion et votre accès, puis réessayez.",
      disabled: {
        busy: 'Une opération est en cours.',
        unavailable:
          "L'état de l'application n'est pas disponible. Actualisez l'état avant d'utiliser l'application.",
        deploying: 'Un déploiement est en cours.',
        starting: "L'application démarre.",
        notDeployed: "Déployez d'abord une version.",
        alreadyRunning: "L'application est déjà en cours d'exécution.",
        notRunning: "L'application ne fonctionne pas.",
      },
      start: 'Démarrer',
      stop: 'Arrêter',
      restart: 'Redémarrer',
      done: {
        start: "L'application démarre.",
        stop: "L'application s'est arrêtée.",
        restart: "L'application redémarre.",
      },
    },
    releases: {
      title: 'Versions',
      upload: 'Télécharger une version',
      uploadAction: 'Téléverser',
      commit: 'Commit',
      commitHint:
        "Facultatif : le commit à partir duquel cette archive a été construite, enregistré en tant qu'étiquette sha.",
      uploaded: 'Version téléchargée.',
      checksum: 'Somme de contrôle',
      size: 'Taille',
      created: 'Créé',
      empty:
        'Pas encore de sortie. Téléchargez un package .tar.gz conçu pour cette application.',
      loadFailed: 'Impossible de charger les versions.',
    },
    deploy: {
      deploy: 'Déployer',
      started: 'Déploiement de {{version}}.',
      confirmProtected:
        'Cet environnement est protégé. Tapez {{appId}} pour déployer.',
    },
    deployments: {
      title: 'Déploiements',
      kind: 'Genre',
      status: 'Statut',
      by: 'Par',
      current: 'Actuel',
      logs: 'Journaux',
      rollback: 'Revenir en arrière',
      rollbackStarted: 'Revenir en arrière.',
      confirmRollbackTitle: 'Restaurer {{name}} ?',
      confirmRollback:
        "L'application revient à la version de ce déploiement ; ce qui a été déployé depuis est repris.",
      loadFailed: 'Impossible de charger les déploiements.',
      empty: 'Pas encore déployé.',
      hideLogs: 'Masquer les journaux',
      noLogs: 'Aucune ligne de journal.',
      statuses: {
        queued: "En file d'attente",
        deploying: 'Déploiement',
        succeeded: 'Réussi',
        failed: 'Échec',
      },
    },
    actors: {
      human: 'personne',
      agent: 'mandataire',
      key: 'clé',
      rule: 'règle',
      system: 'système',
    },
    requests: {
      title: 'Demandes de déploiement',
      pendingApproval: "En attente d'approbation",
      notice: {
        deploy: 'a demandé de déployer {{version}} sur {{environment}}',
        rollback: 'a demandé de restaurer {{environment}} en {{version}}',
      },
      someone: "Quelqu'un",
      review: 'Révision',
      view: 'Afficher',
      comment: 'Commentaire (facultatif)',
      decideFailed: "La décision n'a pas été rendue",
      request: 'Demander le déploiement',
      created: 'Déploiement demandé.',
      approve: 'Approuver',
      confirmApproveTitle: 'Approuver le déploiement de {{appId}} ?',
      reject: 'Rejeter',
      cancel: 'Retirer',
      requestedBy: 'Demandé par',
      decidedBy: 'Décidé par',
      note: 'Note',
      approvedToast: 'A approuvé le déploiement de {{appId}}.',
      rejectedToast: 'Rejet du déploiement de {{appId}}.',
      app: 'Application',
      commit: 'Commit',
      build: 'Construire',
      ciLog: 'Journal CI',
      requestedAt: 'Demandé',
      decisionNote: 'Note de décision',
      pinned:
        "somme de contrôle {{checksum}} ; l'approbation déploie exactement ceci",
      loadFailed: 'Impossible de charger la demande de déploiement.',
      detailTitle: {
        deploy: 'Demande de déploiement pour {{appId}}',
        rollback: 'Demande de restauration pour {{appId}}',
      },
      reviewTitle: {
        deploy: 'Examinez la demande de déploiement pour {{appId}}',
        rollback: 'Vérifiez la demande de restauration pour {{appId}}.',
      },
      done: {
        approve: 'Demande approuvée.',
        reject: 'Demande rejetée.',
        cancel: 'Demande retirée.',
      },
      kind: {
        deploy: 'Déployer',
        rollback: 'Restauration',
      },
      status: {
        pending: 'En attente',
        approved: 'Approuvé',
        rejected: 'Rejeté',
        cancelled: 'Retiré',
        deployed: 'Déployé',
        failed: 'Échec',
      },
    },
    variables: {
      title: 'Variables',
      description:
        "Variables d'environnement avec lesquelles cette application s'exécute. Chaque modification est enregistrée en une seule fois et atteint l'application lors de son prochain déploiement.",
      environmentDescription:
        "Chaque application de cet environnement, y compris les aperçus des demandes d'extraction, les obtient à moins qu'elle ne définisse les siennes. Répertorié avec ce que déclare la version la plus récente de chaque application. Les modifications sont enregistrées immédiatement et atteignent une application lors de son prochain déploiement.",
      add: 'Ajouter une variable',
      name: 'Nom',
      value: 'Valeur',
      source: 'Origine',
      secret: 'Secret',
      secretHint: "Un secret n'est plus jamais affiché une fois enregistré.",
      nameHint:
        'Lettres majuscules, chiffres et traits de soulignement commençant par une lettre.',
      invalidName:
        'Utilisez des lettres majuscules, des chiffres et des traits de soulignement, en commençant par une lettre.',
      valueOf: 'Valeur de {{name}}',
      set: 'Définir',
      notSet: 'Non défini',
      sources: {
        app: 'Application',
        environment: "De l'environnement",
        configFile: 'config.yml',
        generated: 'Généré',
        default: 'Par défaut',
        unset: 'Désarmé',
      },
      tags: {
        required: 'Obligatoire',
        secret: 'Secret',
        firstStartOnly: 'Premier démarrage uniquement',
        changed: 'Modifié – redémarrage nécessaire',
        missing: 'Manquant',
        undeclared: 'Non déclaré',
      },
      setValue: 'Valeur de consigne',
      replace: 'Remplacer',
      override: 'Remplacer',
      overrideOf: 'Remplacer {{name}}',
      overrideTitle: 'Remplacer {{name}}',
      overrideHint:
        "Cette application prend cette valeur au lieu de celle de son environnement. Enregistré immédiatement ; l'application l'obtient lors de son prochain déploiement.",
      savedAtOnce:
        "Sauvé immédiatement ; l'application l'obtient lors de son prochain déploiement.",
      updated: 'Mis à jour',
      clear: 'Effacer',
      addTitle: 'Ajouter une variable',
      setTitle: 'Définir {{name}}',
      save: 'Enregistrer',
      cancel: 'Annuler',
      saved: '{{name}} enregistré.',
      cleared: '{{name}} effacé.',
      loadFailed: 'Impossible de charger les variables.',
      emptyTitle: 'Aucune variable',
      emptyDescription:
        "La version déclare qu'aucun et aucun n'est défini. Ajoutez-en un pour le transmettre à l'application.",
      emptyEnvironmentTitle: "Aucune variable pour l'instant",
      emptyEnvironment:
        'Ajoutez-en un pour le transmettre à chaque application de cet environnement.',
      emptyEnvironmentReadOnly: "Demandez à un administrateur d'en ajouter un.",
      noManifest:
        "Cette version ne déclare pas ses variables, donc aucune n'est vérifiée avant un déploiement.",
      basis:
        'Répertoriés comme version la plus récente ({{version}}), les déclare. La valeur propre de l’application passe avant celle de son environnement.',
      noBuildTitle: 'Pas encore de construction',
      noBuildDescription:
        "Les variables apparaissent ici une fois la première version de l'application téléchargée. Vous pouvez maintenant en ajouter un à la main.",
      noBuild:
        'Pas encore de build : ce sont des valeurs définies manuellement.',
      undeclaredTitle: 'Non déclaré',
      undeclaredDescription:
        'La version la plus récente ne les déclare pas. Ils accèdent toujours à l’application ; effacez la propre valeur de l’application une fois qu’elle n’est plus nécessaire.',
      setOnEnvironment: 'Activé sur environnement',
      setOnApp: 'Définir sur cette application',
      declaredBy: 'Déclaré par',
      status: 'Statut',
      noApps: 'Aucune application ne le déclare',
      moreApps: '+{{count}}',
      appGroup: '{{label}} ×{{count}}',
      missingIn_one: "Manquant dans l'application {{count}}",
      missingIn_other: 'Manquant dans les applications {{count}}',
      missingInTitle: 'Obligatoire et aucune valeur pour : {{apps}}',
      environmentSet: 'Définir ici',
      environmentNotSet: 'Non défini ici',
      missingTitle: 'Les variables requises ne sont pas définies',
      missingDescription:
        "{{names}} doit être défini avant que la version la plus récente puisse être déployée : sur l'environnement pour chaque application, ou sur cette application seule.",
      review: 'Revoir les variables',
      changedTitle: 'Les changements de variables ne sont pas appliqués',
      changedDescription:
        "Une variable a changé depuis le déploiement de l'application. Cela prend effet lorsque l’application est à nouveau déployée.",
      apply: 'Appliquer et redémarrer',
      applied: 'Déploiement à nouveau avec les nouvelles variables.',
      needs_one: 'Nécessite une variable {{count}}',
      needs_other: 'Nécessite des variables {{count}}',
      missing: '{{count}} manquant',
      bulk: {
        edit: 'Modification groupée',
        title: 'Modification groupée des variables',
        reviewTitle: 'Vérifier les modifications',
        description:
          'Collez ou modifiez les lignes KEY=value, comme dans un fichier .env. Les lignes commençant par # sont ignorées.',
        appHint:
          "Répertorie les valeurs que cette application définit elle-même. Les valeurs de son environnement et les secrets ne sont pas affichés : ajoutez une ligne pour en remplacer une. La suppression d'une ligne efface cette valeur.",
        environmentHint:
          "Répertorie les valeurs de cet environnement. Les secrets ne sont pas affichés : ajoutez une ligne pour en remplacer une. La suppression d'une ligne efface cette valeur.",
        label: 'Variables (.env)',
        review: 'Vérifier les modifications',
        back: 'Retour',
        changes: 'Modifications',
        noChanges: 'Le texte fixe ce qui existe déjà.',
        nothing: 'Aucune modification à enregistrer',
        unchanged_one: 'La variable {{count}} reste telle quelle.',
        unchanged_other: 'Les variables {{count}} restent telles quelles.',
        save_one: 'Enregistrer {{count}} modification',
        save_other: 'Enregistrer {{count}} modifications',
        saved_one: 'Modification {{count}} enregistrée.',
        saved_other: 'Modifications {{count}} enregistrées.',
        secretOf: '{{name}} est un secret',
        failedTitle: "Certaines modifications n'ont pas été enregistrées",
        kinds: {
          add: 'Ajouter',
          change: 'Changement',
          remove: 'Supprimer',
        },
        problems: {
          syntax: 'Ligne {{line}} : écrivez-la sous la forme KEY=value.',
          name: "Ligne {{line}} : {{name}} n'est pas un nom valide. Utilisez des lettres majuscules, des chiffres et des traits de soulignement, en commençant par une lettre.",
          reserved:
            'Ligne {{line}} : {{name}} est défini par le runtime et ne peut pas être une variable.',
          duplicate:
            'Ligne {{line}} : {{name}} est déjà défini sur une ligne antérieure.',
          unterminated:
            "Ligne {{line}} : la citation autour de la valeur de {{name}} n'est pas fermée.",
        },
        unchanged_many: 'Les variables {{count}} restent telles quelles.',
        save_many: 'Enregistrer {{count}} modifications',
        saved_many: 'Modifications {{count}} enregistrées.',
      },
      missingIn_many: 'Manquant dans les applications {{count}}',
      needs_many: 'Nécessite des variables {{count}}',
    },
    tabs: {
      label: 'Sections de {{name}}',
      overview: 'Aperçu',
      deployments: 'Déploiements',
      variables: 'Variables',
      settings: 'Paramètres',
    },
    overview: {
      currentRelease: 'Version actuelle',
      recent: 'Déploiements récents',
      viewAll: 'Tout voir',
    },
    initialAdmin: {
      title: 'Premier administrateur',
      expires:
        'Généré pour le premier déploiement. Enregistrez-le maintenant : il est supprimé dans {{hours}} h.',
      kept: "Généré pour le premier déploiement ; il est conservé jusqu'à la suppression de l'application.",
      username: "Nom d'utilisateur",
      email: 'E-mail',
      password: 'Mot de passe',
      show: 'Afficher le mot de passe',
      hide: 'Masquer le mot de passe',
      copy: 'Copier le mot de passe',
      copied: 'Mot de passe copié.',
      copyFailed:
        'Impossible de copier le mot de passe. Affichez-le et copiez-le manuellement.',
      dismiss: "Je l'ai sauvegardé",
      dismissed:
        'Le premier administrateur a été supprimé du gestionnaire de versions.',
    },
    config: {
      title: 'Avancé',
      description:
        "Le config.yml de l'application déployée ; l'enregistrement recharge l'application. Préférez les variables pour les valeurs qui diffèrent selon l'environnement et pour les secrets.",
      loadFailed: 'Impossible de charger la configuration.',
      discard: 'Annuler les modifications',
      save: 'Sauvegarder et recharger',
      saved: 'Configuration enregistrée.',
      external:
        "Cette application lit sa configuration depuis la gestion des versions externe, il n'y a donc pas de config.yml à modifier ici. Définissez des valeurs qui diffèrent selon l'environnement en tant que variables.",
      externalTitle: 'Aucun config.yml à modifier',
      noFileTitle: 'Pas encore de config.yml',
      noFile:
        'Le premier déploiement crée config.yml. En attendant, configurez l’application avec des variables.',
      toVariables: 'Aller aux variables',
      maskedHint:
        "Les valeurs secrètes s'affichent sous la forme {{mask}}. Laissez le masque en place pour conserver la valeur stockée ou saisissez une nouvelle valeur dessus.",
      secrets: 'Secrets',
      secretsHint:
        'Les valeurs stockées ne sont jamais affichées. Remplacez ou effacez-en un ici ; cela prend effet lorsque vous enregistrez.',
      newValue: 'Nouvelle valeur pour {{path}}',
      replace: 'Remplacer {{path}}',
      clear: 'Effacer {{path}}',
    },
    settings: {
      edit: 'Runtime et étiquettes',
      editShort: 'Modifier',
      editDescription:
        "Quand l'application s'exécute et comment elle est étiquetée. Les modifications s'appliquent sans le redémarrer.",
      save: 'Enregistrer',
      saved: 'Paramètres enregistrés.',
      danger: "Supprimer l'application",
      delete: 'Supprimer avec ses données',
      deleteDescription:
        "Supprime l'application, ses versions, ses déploiements et ses données. Cela ne peut pas être annulé.",
      deleted: '{{name}} supprimé.',
      confirmDeleteTitle: 'Supprimer {{name}} ?',
      confirmDelete:
        'Cela supprime {{appId}} et toutes ses données. Tapez {{appId}} pour confirmer.',
    },
    common: {
      retry: 'Réessayer',
      refresh: 'Actualiser',
      actions: 'Actions',
      rowActions: 'Actions pour {{name}}',
    },
    errors: {
      requestFailed: 'La ​​demande a échoué.',
      reasons: {
        IMAGE_REQUIRED:
          "Cet environnement exécute des images de version, et la version ne contient aucune image. Enregistrez l'image que votre CI a poussée (`release image`), puis déployez-la.",
        ARCHIVE_REQUIRED:
          "Cet environnement exécute les archives de versions en cours ; téléchargez l'archive (`release upload`).",
        IMAGE_CONFLICT:
          'La version contient déjà une autre image pour cette plate-forme ; l’image d’une sortie ne change jamais.',
        INVALID_IMAGE:
          "Ce n'est pas une référence d'image avec un résumé sha256.",
        REGISTRY_EXISTS: 'Un registre avec cet identifiant existe déjà.',
        REGISTRY_IN_USE:
          "Les environnements sont extraits de ce registre ; choisissez d'abord un autre registre pour eux.",
        UNKNOWN_REGISTRY: "Ce registre n'existe pas.",
        INVALID_REGISTRY_URL:
          "Entrez l'origine du registre, telle que https://ghcr.io ou localhost:5000.",
        INVALID_REGISTRY_NAMESPACE:
          "L'espace de noms est constitué de composants de chemin en minuscules, tels que acme.",
        APP_EXISTS: 'Une application avec cet ID existe déjà.',
        APP_NOT_DEPLOYED: "L'application n'a pas encore été déployée.",
        APP_NOT_FOUND:
          "L'application n'existe pas ou vous ne la verrez peut-être pas.",
        APPROVAL_REQUIRED:
          'Cet environnement est protégé : demandez plutôt le déploiement.',
        ARTIFACT_TOO_LARGE: 'Le package de version est trop volumineux.',
        BASE_PATH_MISMATCH:
          'La version a été conçue pour un chemin de base différent.',
        CHECKSUM_MISMATCH:
          'Le package ne correspond pas à sa somme de contrôle.',
        CONFIG_NOT_EDITABLE:
          'La configuration de cette application ne peut pas être modifiée ici.',
        CONFIG_SECRET_NOT_STORED:
          "Une valeur masquée n'a aucun secret stocké à sa place. Tapez sa valeur à la place du masque.",
        CONFIG_RELOAD_FAILED:
          "La configuration a été enregistrée, mais l'application n'a pas pu la recharger.",
        CONFIG_TOO_LARGE: 'La configuration est trop grande.',
        CONFIRMATION_REQUIRED:
          "Saisissez l'ID de l'application pour confirmer.",
        DEPLOYMENT_IN_PROGRESS:
          'Un déploiement de cette application est déjà en cours.',
        DEPLOYMENT_NOT_FOUND: "Le déploiement n'existe pas.",
        DRIVER_UNAVAILABLE:
          'Le pilote de l’environnement n’est pas disponible.',
        ENVIRONMENT_DRIVER_FIXED:
          'Le pilote d’un environnement ne peut pas être modifié.',
        ENVIRONMENT_VARIANT_FIXED:
          'Le mode d’exécution d’un environnement ne peut pas être modifié ; créez plutôt un autre environnement.',
        ENVIRONMENT_EXISTS: 'Un environnement avec cet ID existe déjà.',
        ENVIRONMENT_FULL: "L'environnement a atteint sa limite d'applications.",
        ENVIRONMENT_IN_USE:
          'Les applications sont toujours déployées dans cet environnement.',
        ENVIRONMENT_NOT_FOUND: "L'environnement n'existe pas.",
        FORBIDDEN: "Vous n'avez pas la permission de faire cela.",
        IDEMPOTENCY_CONFLICT:
          'La même demande a été envoyée avec un contenu différent.',
        INVALID_ACTIVATION_POLICY:
          "La politique d'activation n'est pas valide.",
        INVALID_IDLE_STOP: "L'arrêt au ralenti n'est pas valide.",
        INVALID_DORMANCY: "La durée d'hibernation n'est pas valide.",
        INVALID_APP_ID:
          'Utilisez des lettres, des chiffres, des traits de soulignement et des traits d\'union pour l\'ID de l\'application, sans commencer par "__" ni par "new".',
        INVALID_APPROVERS: 'Les approbateurs ne sont pas valides.',
        INVALID_ARTIFACT_SIZE: "La taille du package n'est pas valide.",
        INVALID_ARTIFACT_VERSION: "La version commerciale n'est pas valide.",
        INVALID_ARTIFACT: "Le fichier n'est pas un package de version valide.",
        INVALID_CHECKSUM: "La somme de contrôle n'est pas valide.",
        INVALID_CONFIG_FILE: "La configuration n'est pas un YAML valide.",
        INVALID_CONFIG_MODE: "Le mode de configuration n'est pas valide.",
        INVALID_CONFIG_SECRET: "La modification secrète n'est pas valide.",
        INVALID_CONTENT_TYPE: 'Téléchargez un package .tar.gz.',
        INVALID_DEPLOYMENT_INPUT: "La demande de déploiement n'est pas valide.",
        INVALID_DRIVER: "Le pilote n'est pas valide.",
        INVALID_ENVIRONMENT_CONFIG:
          "Les paramètres d'environnement ne sont pas valides pour son pilote.",
        INVALID_ENVIRONMENT_ID:
          "Utilisez des lettres minuscules, des chiffres, des traits de soulignement et des traits d'union pour l'ID d'environnement.",
        INVALID_ENVIRONMENT_SETTINGS:
          "Les paramètres d'environnement ne sont pas valides.",
        INVALID_IDEMPOTENCY_KEY: "La clé de demande n'est pas valide.",
        INVALID_INPUT: 'Certains champs de la requête ne sont pas valides.',
        INVALID_LABELS:
          'Écrivez les étiquettes sous la forme clé=valeur, séparées par des virgules.',
        INVALID_LOG_CURSOR: "La position du journal n'est pas valide.",
        INVALID_LOG_ID: "Le journal n'existe pas.",
        INVALID_NOTE: 'La note est trop longue.',
        INVALID_PUBLIC_URL: "Le modèle public URL n'est pas valide.",
        INVALID_REQUEST: "La demande n'est pas valide.",
        INVALID_ROLLBACK_TARGET: 'Ce déploiement ne peut pas être restauré.',
        INVALID_SEARCH: "La recherche n'est pas valide.",
        INVALID_TICKET: "Le ticket n'est pas valide.",
        RELEASE_EXISTS: 'Cette version a déjà été téléchargée.',
        RELEASE_NOT_FOUND: "La ​​version n'existe pas.",
        REQUEST_DECIDED: 'La demande a déjà été tranchée.',
        REQUEST_NOT_FOUND: "La demande n'existe pas.",
        REQUEST_PENDING:
          "Une demande pour cette application est déjà en attente d'approbation.",
        RESTART_FAILED: "L'application n'a pas pu être redémarrée.",
        SESSION_REQUIRED: 'Connectez-vous à nouveau pour continuer.',
        START_FAILED: "L'application n'a pas pu être démarrée.",
        STOP_FAILED: "L'application n'a pas pu être arrêtée.",
        TICKET_DEPLOY_REFUSED: 'Le ticket ne permet pas ce déploiement.',
        TICKET_FORBIDDEN: 'Le ticket ne le permet pas.',
        UNSAFE_ARTIFACT: 'Le package contient des chemins non sécurisés.',
        VARIABLES_MISSING:
          'Les variables requises ne sont pas définies : {{names}}. Définissez-les dans les variables de l’application ou de son environnement, puis déployez-les à nouveau.',
        VARIABLE_RESERVED:
          'Ce nom est défini par le runtime et ne peut pas être une variable.',
        INVALID_VARIABLE_NAME:
          'Un nom de variable est composé de lettres majuscules, de chiffres et de traits de soulignement commençant par une lettre.',
        INVALID_VARIABLE_VALUE: 'La valeur est trop longue.',
        VARIABLE_NOT_FOUND: "La variable n'est pas définie.",
        INVALID_VARIABLES_MANIFEST:
          "Le manifeste des variables de la version (dist/variables.json) n'est pas valide.",
        INITIAL_ADMIN_UNAVAILABLE:
          "Il n'y a pas de premier administrateur à afficher.",
      },
      messages: {
        hostExited:
          'Le processus de l’application s’est arrêté avant qu’elle ne soit prête.',
        hostDisabled: "L'hôte de l'application est désactivé.",
        hostShutDown: "L'hôte de l'application s'est arrêté.",
        hostEntryMissing:
          'Le fichier d’entrée de l’hôte de l’application est manquant.',
        cannotRestart: "Cet hôte ne peut pas être redémarré à partir d'ici.",
        selfDeploy:
          "L'hôte ne peut pas déployer l'application dans laquelle il s'exécute.",
        noStatus:
          "L'hôte n'a pas indiqué comment s'est déroulé le déploiement.",
        interrupted: 'Le déploiement a été interrompu par un redémarrage.',
        notReported: "Le moteur d'exécution n'a pas signalé l'application.",
        notRunning: "L'application ne s'exécute pas après le redémarrage.",
        deploymentNotReported:
          "Le moteur d'exécution n'a pas signalé le déploiement.",
        notReady: "Ce n'est pas encore prêt; réessayez dans un instant.",
        checkTimeout: "Le test ne s'est pas terminé dans les 20 secondes.",
        hostNoSettings:
          'Le runtime local ne prend aucun paramètre de connexion.',
      },
      prefixed: {
        startFailed: 'Échec du démarrage : {{detail}}',
        stopFailed: "Échec de l'arrêt : {{detail}}",
        restartFailed: 'Échec du redémarrage : {{detail}}',
        outcomeUnreadable: 'Impossible de lire le résultat : {{detail}}',
      },
    },
    confirm: {
      cancel: 'Annuler',
      typeLabel: 'Tapez {{text}} pour confirmer',
    },
    environments: {
      title: 'Déployer des environnements',
      description:
        "Où les applications sont déployées et qui peut s'y déployer.",
      open: 'Ouvrir',
      loadOneFailed: "Impossible de charger l'environnement.",
      settingsTitle: "Paramètres d'environnement",
      readOnly:
        'Vous pouvez afficher les paramètres de cet environnement mais pas les modifier.',
      danger: "Supprimer l'environnement",
      deleteDescription:
        "Supprime l'environnement et ses variables. Les applications déployées ici doivent d'abord être supprimées.",
      discard: 'Annuler les modifications',
      anyone: 'Quiconque peut déployer',
      unlimited: 'Aucune limite',
      apps: 'Applications',
      appsDescription: 'Applications déployées dans cet environnement.',
      appsEmpty: "Aucune application n'est encore déployée ici.",
      sampleData: 'Charger des exemples de données lors du premier déploiement',
      sampleDataHint:
        "Le premier déploiement d'une application installe ici ses exemples de données (APP_SAMPLE_DATA=true). Utilisez-le pour les aperçus, pas pour la production.",
      add: 'Ajouter un environnement',
      edit: 'Modifier',
      delete: 'Supprimer',
      save: 'Enregistrer',
      cancel: 'Annuler',
      check: 'Vérifier',
      reachable: '{{name}} est accessible.',
      unreachable: '{{name}} n’est pas accessible.',
      deleted: 'Environnement {{name}} supprimé.',
      saved: 'Environnement {{name}} enregistré.',
      added: 'Environnement {{name}} ajouté.',
      loadFailed: 'Impossible de charger les environnements.',
      emptyTitle: "Aucun environnement pour l'instant",
      emptyNoAccess: "Demandez à un administrateur d'ajouter un environnement.",
      emptyDescription:
        'Ajoutez un environnement dans lequel les applications doivent être déployées.',
      editTitle: 'Modifier {{name}}',
      formDescription:
        'Où les applications sont déployées, comment elles sont atteintes et qui peut y être déployée.',
      configHint: "Les paramètres du pilote, en tant qu'objet JSON.",
      secretHint:
        "Stocké crypté et ne s'affiche plus jamais ; laisser vide pour conserver.",
      invalidJson: 'Entrez un objet JSON, tel que {}.',
      protectedHint:
        "Chaque déploiement, par une personne ou par CI, attend un approbateur, qui saisit à nouveau l'ID de l'application pour l'approuver.",
      approversColumn: 'Approbateurs',
      approversPlaceholder: 'Choisir les approbateurs',
      approversHint:
        "Chacun d'entre eux peut approuver, y compris ses propres demandes. Si aucun n’est choisi, ce sont les personnes autorisées à approuver les déploiements protégés qui décident.",
      confirmDelete: "Supprimer l'environnement {{id}} ?",
      id: "ID d'environnement",
      name: 'Nom',
      driver: 'Pilote',
      runsOn: 'Fonctionne sur',
      policy: 'Politique',
      publicUrl: 'Modèle public URL',
      config: 'Paramètres (JSON)',
      secret: "Informations d'identification (JSON, écriture seule)",
      secretStored:
        "Les informations d'identification sont stockées ; saisissez-en de nouveaux pour les remplacer.",
      protected: 'Protégé',
      approvers: 'Approbateurs',
      pickDriver:
        "Choisissez le mode d'exécution des applications dans cet environnement. Un environnement garde son moteur.",
      next: 'Continuer',
      addWith: "Ajouter l'environnement {{driver}}",
      changeDriver: 'Changement',
      basics: 'Environnement',
      namePlaceholder: 'Mise en scène',
      idHint:
        'Lettres minuscules, chiffres, traits de soulignement et tirets ; ne peut pas être modifié ultérieurement.',
      policyDescription: 'Qui peut être déployé ici.',
      appDefaults: 'Applications',
      appDefaultsDescription:
        "Au plus ce nombre d'applications, et lorsqu'une application créée sans sa propre politique d'exécution s'arrête et devient inactive. Vide : pas de limite, jamais.",
      maxApps: 'La plupart des applications',
      defaultIdle: 'Arrêt après (minutes sans visite)',
      defaultDormant: 'Dormant après (heures sans visite)',
      noForm:
        'Aucun formulaire de paramètres ; les paramètres sont saisis sous la forme JSON ({{kind}}).',
      imageSource: 'Libérer les images',
      imageSourceDescription:
        "Extrayez l'image de chaque version d'un registre par résumé, avec ses informations d'identification d'extraction, afin que cet environnement exécute l'image même CI poussée et que d'autres environnements ont exécutés.",
      registry: 'Registre',
      noRegistry: 'Aucun : extraire des images publiques de manière anonyme',
      newRegistry: 'Nouveau registre',
      editRegistry: 'Modifier',
      cancelRegistryEdit: "Annuler l'édition",
      registryShared:
        "Les modifications s'appliquent à chaque environnement extrait de ce registre.",
    },
    registries: {
      check: 'Tester la connexion',
      url: 'Adresse',
      urlHint:
        "Son origine, telle que https://ghcr.io;, une adresse d'hôte local est atteinte via HTTP.",
      namespace: 'Espace de noms',
      namespaceHint:
        'Les images de libération du chemin passent en dessous, comme acme.',
      pull: 'Extraire les identifiants',
      pullHint:
        'Pour les environnements qui extraient de ce registre ; laissez-les de côté là où cela permet des extractions anonymes.',
      username: "Nom d'utilisateur",
      password: 'Mot de passe ou jeton',
      checkOk: 'Connecté',
      checkFailed: 'Le test de connexion a échoué.',
      checkFailedTitle: "Impossible d'utiliser le registre",
      anonymous:
        "Le registre répond sans informations d'identification : toute personne qui y accède peut retirer le message.",
      status: {
        ok: 'accepté',
        failed: 'refusé',
        notSet: 'non défini',
      },
    },
    artifacts: {
      title: 'Artefacts',
      tarball: 'Archiver',
      image: 'Image',
      ran: 'Couru',
      ranTarball: 'Archive, en cours',
    },
    driverForm: {
      advanced: 'Paramètres avancés',
      advancedHint:
        'Les valeurs par défaut conviennent à la plupart des environnements ; ouvrez un groupe pour le changer.',
      on: 'Sur',
      off: 'Désactivé',
      noLimit: 'Aucune limite',
      writeOnly: '(écriture seule)',
      secretSet: 'Définir',
      secretCleared: "Supprimé lors de l'enregistrement",
      replace: 'Remplacer',
      clear: 'Supprimer',
      undo: 'Annuler',
      keepStored: 'Conserver celui stocké',
      jsonTitle: 'Paramètres du pilote',
      jsonDescription:
        "Ce pilote n'a pas de formulaire de paramètres ; entrez ses paramètres sous la forme JSON.",
      check: 'Tester la connexion',
      checkOk: 'Connecté',
      checkFailed: 'Le test de connexion a échoué.',
      checkFailedTitle: 'Impossible de se connecter',
      fixErrors:
        'Certains paramètres doivent être corrigés ; ils sont marqués ci-dessus.',
      errors: {
        required: 'Obligatoire.',
        number: 'Entrez un numéro.',
        integer: 'Entrez un nombre entier.',
        range: 'Hors de la plage autorisée.',
        mapLine: 'Écrivez un NAME=value par ligne.',
        mapName:
          'Les noms sont des lettres, des chiffres et des traits de soulignement qui ne commencent pas par un chiffre.',
      },
    },
    driverForms: {
      host: {
        description:
          'Exécute des applications sur ce serveur : dans le processus enfant App Host, cette application démarre, ou chacune dans un conteneur Docker.',
        runtime: 'Mode exécution',
        backend: 'Mode exécution',
        backendInProcess: 'En cours',
        backendInProcessHint:
          "S'exécute dans le processus enfant App Host que ce serveur démarre, partagé par toutes ces applications. Adapté aux avant-premières.",
        backendDocker: 'Docker',
        backendDockerHint:
          'Un conteneur par application, isolés les uns des autres. Adapté aux tests et à la production.',
        dockerConnection: 'Connexion Docker',
        dockerConnectionDescription:
          'Utilise le Docker sur ce serveur, trouvé à partir de DOCKER_HOST ou du contexte Docker actuel, avec les paramètres de conteneur recommandés. Testez la connexion pour voir quel Docker il a trouvé.',
        access: "Adresse d'accès",
        publicUrl: 'Modèle public URL',
        publicUrlHint:
          "Où les gens ouvrent une application, avec {appId} dans le chemin ou le nom d'hôte ; vide utilise la propre adresse du serveur.",
        check: {
          url: 'Adresse',
          apps: "Applications en cours d'exécution",
          endpoint: 'Docker',
          version: 'Version Docker',
          platform: 'Plateforme',
          errors: {
            unsupported:
              'Seul Docker sur ce serveur est pris en charge : DOCKER_HOST doit être un socket unix:// ou un proxy de socket tcp://.',
            socketMissing:
              "Il n'y a pas de socket Docker à cet endroit. Docker est-il installé et exécuté sur ce serveur ?",
            permission:
              "Docker a refusé l'accès. L'utilisateur sous lequel cette application s'exécute ne peut pas utiliser le socket Docker.",
            refused:
              "Rien n'accepte les connexions à cette adresse. Vérifiez que Docker est en cours d'exécution.",
            timeout: "Docker n'a pas répondu à temps.",
          },
        },
      },
    },
  },
  actions: {
    close: 'Fermer',
  },
  status: {
    loading: 'Chargement',
  },
};

export default frFR;
