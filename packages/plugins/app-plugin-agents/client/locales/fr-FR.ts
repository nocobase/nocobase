import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  modelSuggestions: {
    design:
      'Conception, architecture, investigation de problèmes complexes et revue de changements importants.',
    routine:
      'Implémentations au périmètre clair, petites corrections, tests et rédaction.',
    small: 'Petits changements mécaniques, rapides et économiques.',
    explanation:
      'Compréhension des besoins, rédaction de propositions et d’explications.',
    large:
      'Implémentations de grande ampleur, modifications entre paquets et refactorisation.',
    review: 'Revue de code et analyse des échecs de CI.',
  },
  actions: {
    back: 'Retour',
    cancel: 'Annuler',
    close: 'Fermer',
    delete: 'Supprimer',
    edit: 'Modifier',
    save: 'Enregistrer',
  },
  common: {
    refresh: 'Actualiser',
    cancel: 'Annuler',
    copy: 'Copier',
    copied: 'Copié',
    save: 'Enregistrer',
    close: 'Fermer',
    create: 'Créer',
    createNamed: 'Créer "{{name}}"',
    creating: 'Création…',
    noOptions: 'Aucune option',
    forbidden: "Vous n'êtes pas autorisé à faire cela.",
    loading: 'Chargement',
    notFound: "Il n'existe plus.",
    requestFailed: 'La demande a échoué. Essayer à nouveau.',
    retry: 'Réessayer',
    secretKept: 'Définir — laisser vide pour le conserver',
  },
  status: {
    loading: 'Chargement',
  },
  unsavedChanges: {
    description: "Ce que vous avez entré n'a pas été soumis et sera perdu.",
    discard: 'Jeter',
    keepEditing: 'Continuer à éditer',
    title: 'Supprimer les modifications non enregistrées ?',
  },
  errors: {
    CONFLICT: 'Entre-temps, cela a changé. Rechargez et réessayez.',
    REVISION_CONFLICT: 'Entre-temps, cela a changé. Rechargez et réessayez.',
    FORBIDDEN: "Vous n'êtes pas autorisé à faire cela.",
    AGENT_NOT_FOUND: "Il n'existe plus.",
    RUN_NOT_FOUND: "Il n'existe plus.",
    SKILL_NOT_FOUND: "Il n'existe plus.",
    SKILL_VERSION_NOT_FOUND: "Il n'existe plus.",
    CONVERSATION_NOT_FOUND: "Il n'existe plus.",
    RUNNER_NOT_FOUND: "Il n'existe plus.",
    VARIABLE_NOT_FOUND: "Il n'existe plus.",
    MODEL_SERVICE_NOT_FOUND: "Il n'existe plus.",
    SCOPE_NOT_FOUND: "Il n'existe plus.",
    INVALID_INPUT: 'Certaines valeurs ne sont pas valides.',
    SECRETS_KEY_MISSING:
      "Les variables ne peuvent pas être enregistrées ou affichées : le serveur n'a pas de clé secrète. Demandez à un administrateur de définir secrets.keys dans la configuration de l'application.",
  },
  command: {
    copy: 'Commande de copie',
    copied: 'Copié',
    copyFailed:
      'Impossible de copier. Sélectionnez la commande et copiez-la vous-même.',
  },
  tools: {
    claude: 'Claude Code',
    codex: 'Codex',
    opencode: 'OpenCode',
    pi: 'Pi',
  },
  agents: {
    title: 'Agents',
    description:
      "Chaque outil de codage et modèle signalé par un exécuteur est un agent. Le chef de projet confie chaque étape d'un problème à l'agent dont la description correspond.",
    fromRunners: 'Agents des exécuteurs',
    discovery: {
      selectAll: 'Sélectionner tous les résultats',
      selectFirst: 'Sélectionnez les premiers résultats {{limit}}',
      selectionCount: 'Groupes {{count}} / {{limit}} sélectionnés',
      clearSelection: 'Effacer la sélection',
      new: 'Nouvelles découvertes ({{count}})',
      ignored: 'Ignoré ({{count}})',
      search: 'Rechercher des modèles ou des fournisseurs',
      select: 'Sélectionnez {{name}}',
      ignore: 'Ignorer',
      restore: 'Restaurer',
      ignoreSelected: 'Ignorer la sélection',
      restoreSelected: 'Restaurer la sélection',
      enabled: 'Afficher activé',
      disabled: 'Afficher désactivé',
      provider: 'Fournisseur et exécuteur',
      saved: 'Préférences de découverte enregistrées',
    },
    filterLabel: 'Afficher les agents',
    filters: {
      all: 'Tous les {{count}}',
      enabled: 'Activé {{count}}',
      pending: 'Pour activer {{count}}',
      unreported: 'Aucun exécuteur {{count}}',
    },
    loadFailed: 'Impossible de charger les agents',
    emptyTitle: "Aucun agent pour l'instant",
    emptyDescription:
      'Connectez un runner avec un outil de codage connecté : chacun de ses modèles apparaît ici comme un agent à activer.',
    noneInFilter: 'Aucun agent ici.',
    howToAdd:
      "Pour ajouter un agent, installez un outil de codage sur un exécuteur et connectez-vous à un modèle que vous pouvez utiliser : une fois que le exécuteur l'a signalé, il apparaît ici, et vous l'activez en écrivant ce pour quoi il est bon. Un agent uniquement des exécuteurs personnels travaille uniquement sur les problèmes lancés par leurs propriétaires.",
    goodAtMissing: 'Pas encore écrit',
    columns: {
      agent: 'Agent',
      goodAt: 'Bon à',
      where: 'Où il court',
      effort: 'Effort de raisonnement',
      state: 'Statut',
    },
    where: {
      none: 'Aucun exécuteur',
      team_one: "Exécuteur d'équipe {{count}}",
      team_other: "Exécuteurs de l'équipe {{count}}",
      personal_one: 'Exécuteur personnel {{count}} en ligne',
      personal_other: 'Exécuteurs personnels {{count}} en ligne',
      both: 'Équipe {{team}} · Personnel {{personal}}',
      names: '{{names}}',
      noneOnline: 'Aucun exécuteur en ligne actuellement',
      personalOnly: 'Exécuteurs personnels uniquement',
      lastReported: 'Dernier rapport {{when}}',
      team_many: "Exécuteurs de l'équipe {{count}}",
      personal_many: 'Exécuteurs personnels {{count}} en ligne',
    },
    state: {
      enabled: 'Activé',
      pending: 'Pour activer',
      disabled: 'Désactivé',
      unreported: 'Aucun exécuteur',
    },
    effort: {
      default: "Valeur par défaut de l'outil",
      off: 'Désactivé',
      minimal: 'Minime',
      low: 'Faible',
      medium: 'Moyen',
      high: 'Élevé',
      xhigh: 'Très élevé',
      max: 'Max.',
      ultra: 'Ultra',
    },
    enable: {
      button: 'Remplir et activer',
      buttonFor: 'Remplissez et activez {{name}}',
      title: 'Activer {{name}}',
      reportedBy_one:
        'Rapporté par le exécuteur {{count}} en ligne : {{names}}.',
      reportedBy_other:
        'Rapporté par les exécuteurs de {{count}} en ligne : {{names}}.',
      noRunnerNow: "Aucun exécuteur qui l'a n'est en ligne actuellement.",
      goodAtHint:
        "Le chef de projet décide ce qu'il doit donner à cet agent par ces mots. Dites ce qui convient et ce qui ne convient pas.",
      goodAtRequired: "Écrivez ce pour quoi il est bon avant de l'activer.",
      effortHint:
        "Le chef de projet ne peut pas le modifier lorsqu'il lui confie le travail.",
      personalOnly:
        "Seuls les exécuteurs personnels l'ont : le chef de projet ne lui confie le travail que sur les problèmes lancés par ses propriétaires.",
      submit: 'Activer',
      done: '{{name}} est activé',
      reportedBy_many:
        'Rapporté par les exécuteurs de {{count}} en ligne : {{names}}.',
    },
    edit: {
      button: 'Modifier',
      buttonFor: 'Modifier {{name}}',
      title: 'Modifier {{name}}',
      enabled: 'Activé',
      done: '{{name}} enregistré',
    },
  },
  agentTypes: {
    label: "Type d'agent",
    question: "Quel genre d'agent?",
    online: 'En ligne',
    runner: 'Exécuteur',
    onlineHint:
      "Réponses en quelques secondes sur le serveur via un service de modèle. Aucun runtime n'est nécessaire ; il ne peut pas toucher au code.",
    runnerHint:
      'Pilote un outil de codage sur un runtime et travaille dans un répertoire de travail : code, fichiers, commandes.',
    immutable:
      "Un agent garde son type ; créer un autre agent pour l'autre type.",
    onServer: 'Sur le serveur',
    filterAll: 'Tous types',
    noneOfType: 'Aucun agent de ce type.',
  },
  agentSkills: {
    title: 'Compétences',
    description:
      "Manuels que l'agent lit lorsqu'une tâche correspond à sa description. Placé dans son répertoire de travail avant chaque exécution.",
    manage: 'Gérer les compétences',
    placeholder: 'Sélectionner les compétences',
    empty: "Aucune compétence pour l'instant.",
    save: 'Sauvegarder les compétences',
    descriptionOnline:
      "Manuels que l'agent lit lorsqu'une tâche correspond à sa description, dans un bac à sable en lecture seule sur le serveur.",
    onlineScripts:
      "Les scripts ne sont pas exécutés pour les agents en ligne : l'agent peut les lire, pas les exécuter.",
    skippedScripts: ': {{paths}}',
    pathSeparator: ', ',
  },
  brief: {
    preview: "Aperçu de l'invite complète",
    previewTitle: "Aperçu de l'invite complète",
    previewDescription:
      "Quelle série de cet agent serait envoyée maintenant, sur un sujet inventé. Rien n'est mis en file d'attente.",
    scenario: 'Scénario',
    sample:
      'Sur un sujet inventé : {{subject}}. Les valeurs marquées [échantillon] sont constituées.',
    previewFailed: "Impossible d'afficher l'invite complète.",
    system: 'Invite système',
    showAs: 'Afficher comme',
    rendered: 'Rendu',
    raw: 'Brut',
    platform:
      'Règles et tâches de la plateforme · à propos des caractères {{size}} (anglais)',
    platformNote:
      "Les règles de la plateforme sont envoyées en anglais ; l'agent répond toujours dans votre langue.",
    agentPrompt: "Invite de l'agent (écrite par vous)",
    noAgentPrompt: "Cet agent n'a pas d'invite propre.",
    firstMessage: 'Premier message',
    empty: 'Vide',
    previewPlaceholders:
      "Les notes entre crochets sur le runtime sont remplies par le runtime qui l'exécute : ses répertoires de travail et les invites d'initialisation des répertoires qu'il vient de préparer.",
    placeholders:
      "Les espaces réservés {{runner.…}} sont remplis par le moteur d'exécution qui l'exécute : ses répertoires de travail et les invites d'initialisation des répertoires qu'il vient de préparer.",
    layers: {
      system: 'Règles',
      task: 'Tâche',
      context: 'Contexte',
      agent: "Invite de l'agent",
      turn: 'Premier tour',
    },
  },
  envVars: {
    title: "Variables d'environnement",
    description:
      "Transmis à l'outil de codage à chaque exécution et masqué dans les enregistrements d'exécution ; les valeurs ne s’affichent plus après l’enregistrement. Toute personne pouvant utiliser un agent partagé peut recevoir ces valeurs sur son propre ordinateur ; marquez les secrets à haut risque « Exécutions d'équipe uniquement ».",
    add: 'Ajouter une variable',
    addTitle: "Ajouter une variable d'environnement",
    editTitle: 'Remplacer {{name}}',
    writeOnly:
      'La valeur est stockée cryptée et remplace la valeur précédente.',
    name: 'Nom',
    nameHint: 'Lettres majuscules, chiffres et traits de soulignement.',
    value: 'Valeur',
    valueTooLong: 'La valeur est supérieure à 8 Ko.',
    keepValueHint: 'Laissez-le vide pour conserver la valeur actuelle.',
    teamRunnersOnly: "Runtimes d'équipe uniquement",
    teamRunnersOnlyHint:
      "Sans cela, une exécution envoie la valeur au runtime qui la prend, y compris le runtime personnel de toute personne susceptible d'utiliser l'agent. Avec lui, seul un runtime d'équipe effectue des exécutions qui obtiennent cette variable.",
    teamRunnersOnlyBadge: "Runtimes d'équipe uniquement",
    fromRunner: 'Extraire du runtime',
    fromRunnerHint:
      "Aucune valeur n'est conservée ici : le runtime qui effectue une exécution la fournit depuis sa propre machine, définie ici avec `{{command}}` ou transmise avec `--pass-env`. Un environnement d'exécution qui ne le fournit pas échoue avant son démarrage.",
    fromRunnerBadge: "Depuis l'exécution",
    valueRequired:
      'Entrez une valeur ou continuez à la récupérer à partir du runtime.',
    empty: "Aucune variable d'environnement.",
    scope: 'Périmètre',
    updated: 'Mis à jour',
    actionsHead: 'Actions',
    edit: 'Remplacer la valeur',
    actions: 'Actions pour {{name}}',
    accessLog: "Journal d'accès",
    accessLogAll: "Afficher le journal d'accès complet",
    accessLogOf: "Journal d'accès de {{name}}",
    accessLogDescription:
      'Qui a consulté, défini ou supprimé les variables, quand et quelles exécutions les ont reçues.',
    delete: 'Supprimer',
    deleteTitle: 'Supprimer {{name}} ?',
    deleteDescription:
      'Les exécutions ultérieures ne reçoivent plus la variable.',
    deleteConfirm: 'Supprimer',
    deleted: '{{name}} supprimé.',
    saved: '{{name}} enregistré.',
    updatedBy: '{{name}} · {{time}}',
    reveal: 'Révéler les valeurs',
    revealTitle: 'Révéler les valeurs ?',
    revealAudit:
      "La révélation est enregistrée dans le journal d'accès avec votre nom et l'heure.",
    revealedTitle: 'Valeurs variables',
    revealedNote:
      'Cette révélation a été enregistrée. Fermez-le lorsque vous avez terminé.',
    runner: 'Exécution {{id}}',
    auditsEmpty: "Rien d'enregistré pour l'instant.",
    auditAction: {
      reveal: 'révélé',
      set: 'réglé',
      delete: 'supprimé',
      deliver: 'reçu pour une course',
    },
    nameProblems: {
      required: 'Entrez un nom.',
      pattern:
        'Utilisez uniquement des lettres majuscules, des chiffres et des traits de soulignement, sans commencer par un chiffre.',
      reserved: 'Ce nom est réservé.',
      duplicate: 'Une variable portant ce nom existe ; modifiez-le à la place.',
    },
  },
  scopeVariables: {
    title: 'Variables et secrets',
    description:
      'Donné à chaque agent travaillant ici. Des variables plus spécifiques (celui d’un répertoire de travail, puis celui de l’agent) l’emportent.',
  },
  scopes: {
    workdir: 'Répertoire de travail',
  },
  subjects: {
    conversation: 'Conversation',
    consultation: 'Consultations',
  },
  usage: {
    otherUse: {
      title: 'Autre utilisation du modèle',
      description:
        "Appels de modèles en dehors des exécutions d'agents, comme l'indexation et la recherche dans la base de connaissances.",
      purpose: 'Utiliser',
      source: 'Interrogé par',
      model: 'Modèle',
      calls: 'Appels',
      units: 'Objets',
      purposes: {
        embedding: 'Intégrations',
        rerank: 'Reclassement',
        text: 'Texte utilitaire',
      },
    },
    title: 'Utilisation',
    description:
      "Quelles sont les exécutions d'agent utilisées et leur coût aux prix actuels des modèles.",
    loadFailed: "Impossible de charger l'utilisation",
    groupBy: 'Regrouper par',
    groupByValue: 'Groupe par {{group}}',
    empty: 'Aucune course sur cette période.',
    total: 'Total',
    noGroup: 'Aucun',
    unknown: 'Inconnu',
    onlineTool: 'En ligne (services modèles)',
    setPrices: 'Fixer les prix',
    chart: {
      title: 'Tendance quotidienne',
      metric: 'Afficher',
      cost: 'Coût',
      tokens: 'Jetons',
      total: 'Total',
      other: 'Autres',
    },
    pricedNote:
      "Le coût couvre les exécutions {{priced}} des {{total}} ; ces modèles n'ont pas encore de prix : {{models}}.",
    filters: {
      allGroups: 'Tous : {{group}}',
      agent: 'Agent',
      allAgents: 'Tous les agents',
      person: 'Réveillé par',
      allPeople: 'Tout le monde',
      range: 'Plage de dates',
      presets: 'Portées rapides',
    },
    presets: {
      last7: '7 derniers jours',
      last30: '30 derniers jours',
      thisMonth: 'Ce mois-ci',
      lastMonth: 'Le mois dernier',
      last90: '90 derniers jours',
    },
    groups: {
      agent: 'Agent',
      person: 'Réveillé par',
      group: 'Groupe',
      subject: 'Objet',
      day: 'Jour',
      model: 'Modèle',
      tool: 'Outil de codage',
      type: "Type d'agent",
    },
    columns: {
      runs: 'Exécutions',
      duration: 'Durée',
      input: 'Entrée',
      output: 'Sortie',
      cacheRead: 'Lecture du cache',
      cacheWrite: 'Écriture dans le cache',
      cost: 'Coût estimé',
    },
  },
  defaultSkills: {
    title: 'Compétences par défaut',
    description:
      'Chaque agent travaillant ici acquiert également ces compétences.',
    save: 'Sauvegarder les compétences',
    saved: 'Compétences par défaut enregistrées.',
  },
  runs: {
    title: "Journal d'exécution",
    empty: 'Aucune course pour l’instant.',
    loadFailed: "Impossible de charger le journal d'exécution",
    unknownAgent: 'Agent',
    attempt: 'tentative {{attempt}} de {{max}}',
    viewTranscript: 'Voir la transcription',
    transcriptTitle: 'Exécuter la transcription',
    viewAll: 'Tout afficher {{count}}',
    allTitle: 'Toutes les exécutions ({{count}})',
    filters: {
      agent: 'Agent',
      status: 'Statut',
      allAgents: 'Tous les agents',
      allStatuses: 'Tous les statuts',
    },
    noMatch: 'Aucune exécution ne correspond à ces filtres.',
    cancel: 'Arrêter',
    stopping: 'Arrêter…',
    cancelTitle: 'Arrêter cette exécution ?',
    cancelDescription: '{{name}} sera arrêté. Ce que cela a déjà changé reste.',
    cancelRequested: 'Arrêt demandé',
    retry: 'Réessayer',
    retried: "Exécution à nouveau en file d'attente",
    viewBrief: "Afficher l'invite complète",
    briefTitle: 'Invite complète',
    briefDescription:
      "Ce qu'on a dit à l'agent lors de la dernière réclamation de ce run.",
    briefOf: 'Tentative {{attempt}}, réclamation {{time}}',
    briefUnavailable:
      "Aucune invite complète n'est disponible pour cette exécution.",
    processDataCleared:
      "Les données du processus d'exécution ont été effacées dans le cadre de la stratégie de rétention.",
    briefFailed: "Impossible de charger l'invite complète",
    workspaceReset: {
      button: 'Nettoyer le répertoire de travail',
      title: 'Nettoyer le répertoire de travail ?',
      description:
        "L'exécution suivante démarre à partir d'une nouvelle extraction et reçoit à nouveau les invites d'initialisation. Les modifications qui n’ont pas été poussées sont perdues dans ce runtime. Un répertoire utilisé sur place n'est jamais supprimé.",
      confirm: 'Nettoyer',
      done: "L'exécution suivante démarre à partir d'une nouvelle extraction.",
    },
    stateChanged: "L'exécution a changé d'état. Le journal a été actualisé.",
    status: {
      queued: "En file d'attente",
      dispatched: 'Expédié',
      running: 'En cours d’exécution',
      completed: 'Tour terminé',
      failed: 'Échec',
      cancelled: 'Annulé',
      cancelling: 'Arrêt',
    },
    trigger: {
      retry: 'Réessayer',
      message: 'Message',
      consultation: 'Consultations',
    },
    activity: {
      queued: "{{name}} était en file d'attente",
      dispatched: '{{name}} démarre',
      running: '{{name}} a commencé à fonctionner',
      completed: '{{name}} termine son tour',
      failed: 'Échec du {{name}}',
      cancelled: '{{name}} a été arrêté',
    },
    live: {
      working: '{{name}} fonctionne',
      workingFor: '{{name}} fonctionne · {{minutes}} min',
      queued: "{{name}} est en file d'attente",
    },
  },
  transcript: {
    title: 'Exécuter la transcription',
    notFound: "Cette exécution n'existe pas.",
    waiting: "En attente du démarrage de l'agent…",
    empty: "Cette exécution n'a enregistré aucun événement.",
    fetchFailed:
      'Impossible de récupérer de nouveaux événements. Nouvelle tentative…',
    expand: 'Afficher tout',
    truncated: 'Coupure : le texte intégral était trop long à conserver.',
    summary_one: "Création d'un événement {{created}} · {{count}}",
    summary_other: 'Événements {{created}} · {{count}} créés',
    took: 'a pris {{duration}}',
    pendingInputs_one: "Commentaire {{count}} en attente de l'agent",
    pendingInputs_other: "Commentaires {{count}} en attente de l'agent",
    inputDelivered_one: "Remis à l'agent",
    inputDelivered_other: "Entrées {{count}} fournies à l'agent",
    tokens: 'Jetons {{input}} entrants, {{output}} sortants',
    kinds: {
      text: 'Agent',
      thinking: 'Penser',
      toolUse: 'Outil',
      toolResult: 'Résultat',
      allowed: 'Autorisé',
      denied: 'Refusé',
      input: 'Entrée',
      checkout: 'Paiement',
      status: 'Statut',
      error: 'Erreur',
      usage: 'Utilisation',
    },
    summary_many: 'Événements {{created}} · {{count}} créés',
    pendingInputs_many: "Commentaires {{count}} en attente de l'agent",
    inputDelivered_many: "Entrées {{count}} fournies à l'agent",
    inputDelivered_zero: "Entrées {{count}} fournies à l'agent",
  },
  failures: {
    runnerUpgrade:
      "Interrompu pour une mise à jour de la machine d'exécution ; la course continuera.",
    runnerDiskFull: "La machine d'exécution a manqué d'espace disque.",
    runnerOfflineBeforeStart:
      "Le moteur d'exécution s'est déconnecté avant de démarrer l'exécution.",
    runnerOffline: "Le moteur d'exécution s'est déconnecté.",
    leaseExpired: "Le moteur d'exécution a arrêté de générer des rapports.",
    startTimeout: "Le moteur d'exécution n'a pas démarré l'exécution à temps.",
    cancelled: 'Annulé.',
    idleTimeout: "L'agent cesse de progresser.",
    setupFailed: "Le run n'a pas pu être préparé.",
    cliUnavailable:
      "Le moteur d'exécution n'a pas pu installer la CLI de l'application.",
    workspaceBusy:
      'Le répertoire de travail est occupé ; en attendant une autre tentative.',
    checkoutFailed: "L'extraction du référentiel a échoué.",
    toolAuth: "L'outil de codage n'est pas connecté au runtime.",
    toolQuota: "L'outil de codage n'a plus de quota.",
    toolRateLimit: "L'outil de codage était limité en débit.",
    toolNetwork: "L'outil de codage n'a pas pu atteindre son service.",
    toolProcess: "L'outil de codage s'est arrêté de manière inattendue.",
    contextOverflow: 'La conversation est devenue trop longue pour le modèle.',
    delegatedQueueTimeout:
      "Expiration du délai d'attente de la file d'attente de délégation ; retiré",
    queuedExpired: 'Aucun runtime n’a pris le temps d’exécution.',
    modelUnavailable: 'Le modèle de l’agent n’est pas disponible.',
    stepLimit: "L'agent a appelé tools trop souvent sans répondre.",
    policyRefused:
      'Aucune politique d’exécution ne lui permet d’effectuer ce travail.',
    prepareNetwork:
      "Le moteur d'exécution n'a pas pu atteindre l'hôte du référentiel lors de la préparation de l'exécution.",
    repoAccessUnavailable:
      "L’accréditation d’un référentiel ne pouvait pas être délivrée pour l’instant ; l'exécution sera réessayée.",
    repoAccessDenied:
      'L’application ne délivrera pas d’informations d’identification pour l’un des référentiels de l’exécution.',
    unknown: "L'exécution a échoué.",
  },
  runtimes: {
    quota: {
      workspaceStatus: {
        active: 'Les travaux continuent',
        ended: 'Terminé · nettoyage autorisé',
        checks: 'Terminé · chèques en attente',
        inUse: "Conservé : en cours d'utilisation",
        changed: 'Conservé : réutilisé',
        trackedChanges: 'Conservé : fichiers non validés',
        unpushed: 'Retenu : travail non poussé',
        missingEvidence: 'Conservé : vérification nécessaire',
        gitFailed: 'Conservé : échec de la vérification Git',
        runNotFound: 'Conservé : exécution introuvable',
        ownershipUnknown: 'Conservé : propriétaire non vérifié',
        ambiguousSubject: 'Retenu : tâche ambiguë',
        bindingUnavailable: 'Conservé : liaison indisponible',
        subjectUnknown: 'Retenu : tâche inconnue',
        unknown: 'Conservé : non vérifié',
      },
      usageLimit: "Limite d'utilisation",
      shortReset: 'réinitialise {{time}}',
      shortUnknown: 'réinitialisation inconnue',
      automatic: "S'efface tout seul à la réinitialisation.",
      since: 'depuis {{time}}',
      marks_one: 'Quota {{count}}',
      marks_other: 'Quotas {{count}}',
      queueHint:
        "Un agent au quota peut toujours être sélectionné. Les travaux seront mis en file d'attente avec leur délai d'attente existant.",
      partial: 'Fonctionne sur {{available}} · {{blocked}} au quota',
      workspaceSize: "Taille de l'espace de travail : {{value}}",
      providers_one: 'Fournisseur {{count}} au quota',
      providers_other: 'Fournisseurs {{count}} au quota',
      runColumns: {
        issue: 'Problème/conversation',
        agent: 'Agent',
        status: 'Statut',
        started: 'Démarré',
        duration: 'Durée',
      },
      filter: {
        all: 'Tous',
        active: 'Actif',
        retained: 'Retenu',
        ended: 'Terminé',
      },
      columns: {
        directory: 'Répertoire / tâche',
        type: 'Type',
        size: 'Taille',
        push: 'État poussé',
        status: 'Statut',
        lastUsed: 'Dernière utilisation',
      },
      previous: 'Précédent',
      next: 'Suivant',
      working: 'Travail',
      readOnly: 'Copie en lecture seule',
      clean: 'Nettoyer',
      unpushed: 'Non poussé',
      overview: 'Aperçu',
      workspaces: 'Espaces de travail',
      runs: 'Exécutions',
      title: 'Quota',
      reached: 'Quota atteint',
      unknown: 'Heure de réinitialisation inconnue',
      resets: 'Réinitialise {{time}}',
      near: 'Proche de la limite',
      clear: 'Effacer',
      clearMark: 'Effacer la marque',
      confirm: 'Effacer cette marque ? {{target}} retrouve du travail.',
      observed: 'Dernier rapport {{time}}',
      usedPercent: '{{percent}}% utilisé',
      ok: "D'accord",
      hint: "Les heures de réinitialisation connues rétablissent automatiquement l'éligibilité. Pour les réinitialisations inconnues, restaurez le quota et effacez la marque. Seuls le propriétaire du runtime et les administrateurs peuvent effacer les marques.",
      marks_many: 'Quotas {{count}}',
      providers_many: 'Fournisseurs {{count}} au quota',
    },
    workspaces: {
      paused:
        "Les nouveaux travaux sont suspendus jusqu'à ce que l'espace disque soit récupéré. Les courses existantes se poursuivent.",
      working: 'Type : Répertoire de travail',
      readOnly: 'Type : Copie en lecture seule',
      size: 'Taille : {{value}}',
      pushed: 'État poussé : propre, pas de travail non poussé',
      unpushed: 'État push : travail non validé, non poussé ou non vérifié',
      notApplicable: 'État Push : non applicable',
      title: "Diagnostics de l'espace de travail",
      low: 'Espace disque faible',
      previousLow: 'Dernier rapport : espace disque faible',
      notReported: "Aucun rapport d'espace de travail reçu pour l'instant",
      diskUnknown: "L'espace disque n'a pas pu être mesuré",
      thresholdOff: "Aucun avertissement d'espace libre minimum configuré",
      free: 'Espace libre : {{value}}',
      threshold: 'Espace libre minimum : {{value}}',
      reportedAt: 'Dernier rapport : {{time}}',
      stale:
        "Ce sont des lectures antérieures; l'espace disque actuel n'est pas confirmé.",
      empty: 'Aucun répertoire de travail dans le dernier rapport',
      ended: 'Terminé',
      active: 'Les travaux continuent',
      unknown: 'Impossible de confirmer si le travail est terminé',
      oldRunner: "Ce exécuteur n'a pas fourni de raisons de diagnostic",
      noCleanup: "Le résultat du nettoyage local n'a pas été reçu",
      discardsUntracked: 'Le nettoyage supprimera les fichiers non suivis',
      decision: {
        settled:
          'Travaux terminés; des contrôles de nettoyage locaux sont requis',
        active: 'Les travaux continuent',
        runNotFound: 'Impossible de confirmer : exécution introuvable',
        ownershipUnknown:
          "Impossible de confirmer : la propriété du exécuteur n'a pas pu être vérifiée",
        ambiguousSubject: "Impossible de confirmer : clé d'objet ambiguë",
        bindingUnavailable:
          "Impossible de confirmer : l'application n'a pas de liaison d'espace de travail",
        subjectUnknown:
          "Impossible de confirmer : la demande n'a pas pu résoudre le sujet",
      },
      cleanup: {
        allowed: 'Terminé; nettoyage autorisé',
        inUse: "Conservé : le répertoire est en cours d'utilisation",
        changed: 'Conservé : le répertoire a été réutilisé',
        trackedChanges:
          'Conservé : les fichiers suivis comportent des modifications non validées',
        unpushed:
          'Conservé : validations non poussées ou objets de validation locaux insuffisants',
        missingEvidence: 'Conservé : preuves de commettre insuffisantes',
        gitFailed: 'Conservé : échec de la vérification Git',
      },
    },
    title: 'Environnements d’exécution',
    description:
      "Les environnements d'exécution qui exécutent les agents et les outils de codage signalés par chacun.",
    add: "Ajouter un environnement d'exécution",
    loadFailed: 'Impossible de charger les runtimes',
    emptyTitle: "Aucun environnement d'exécution connecté pour le moment",
    emptyDescription:
      "Une fois qu'un runtime est connecté, les agents d'exécution y travaillent avec ses outils de codage.",
    noneConnected: 'Aucun runtime n’est connecté.',
    revokedList_one: 'Exécution révoquée {{count}}',
    revokedList_other:
      "Les environnements d'exécution {{count}} ont été révoqués.",
    lastSeen: 'Vu pour la dernière fois {{time}}',
    activity: {
      online: 'En ligne {{active}}/{{slots}}',
      busy: 'Occupé {{active}}/{{slots}}',
      low_disk: 'Espace disque faible {{active}}/{{slots}}',
      offline: 'Hors ligne · {{time}}',
      offlineNever: 'Hors ligne',
    },
    toolUsage: {
      label: "Exécuté par l'outil de codage",
      item: '{{tool}} {{used}}/{{limit}}',
    },
    toolSlots: {
      label: 'Limites par outil de codage',
      hint: "Combien d'exécutions de chaque outil de codage sont nécessaires en même temps, par exemple moins pour un outil dont l'abonnement autorise moins de sessions. Laissez-en un vide pour le limiter uniquement aux exécutions simultanées.",
      none: 'Aucune limite',
      invalid: 'Entrez les nombres entiers de 1 à 64 ou laissez-les vides.',
      inputLabel: 'Exécutions de {{tool}} en même temps',
      overTotal:
        "La limite de {{tools}} est supérieure au nombre maximal d'exécutions simultanées ({{slots}}) : au plus {{slots}} s'exécute en même temps.",
      noneChecked: 'Vérifiez un outil de codage ci-dessus pour le limiter.',
    },
    toolTable: {
      tool: 'Outil',
      enabled: 'Sur',
      state: 'Statut',
      limit: 'Immédiatement',
      active: 'En cours d’exécution',
    },
    policy: {
      title: 'Politique locale',
      description:
        "Ce que le propriétaire du runtime lui permet de prendre, comme il l'a signalé. C'est modifié sur la machine, pas ici.",
      none: "Pas de politique locale : elle accepte n'importe quel travail pour lequel elle est inscrite.",
      any: "N'importe quel",
      nothing: 'Aucun',
      agents: 'Agents',
      subjects: 'Sujets',
      repos: 'Dépôts',
    },
    variables: {
      title: 'Variables de cette machine',
      description:
        "Les variables qu'il fournit aux exécutions qui les extraient du runtime, par leur nom ; les valeurs restent sur la machine. Définissez-en un ici avec `nocobase-runner env set NAME`, ou transmettez-le avec `--pass-env NAME`.",
      none: 'Aucun : une exécution qui prend une variable du runtime échoue ici avant de démarrer.',
      unknown:
        'Non signalé : son runner est plus ancien que cette fonctionnalité. Mettez à jour le exécuteur pour les voir.',
    },
    jobs: {
      allow: 'Autoriser les tâches de build',
      hint: 'Les builds et autres étapes configurées par cette application sont exécutés sans modèle. Ce runtime rapporte : {{kinds}}.',
      unsupported:
        "Le programme d'exécution de ce runtime ne prend pas de tâches. Mettez à jour le exécuteur pour l'activer.",
    },
    noTools: 'Aucun outil de codage trouvé',
    actionsFor: 'Actions pour {{name}}',
    columns: {
      name: 'Nom',
      status: 'Statut',
      tools: 'Outils',
      sharing: 'Partage',
      version: 'Exécuteur',
      lastSeen: 'Vu pour la dernière fois',
      slots: "Nombre maximal d'exécutions simultanées",
    },
    detail: {
      general: 'Général',
      tools: 'Outils',
      toolsDescription:
        'Les outils de codage signalés. Les travaux pour un outil désactivé ou dont le quota est épuisé ne sont pas envoyés ici. Les interrupteurs et les limites sont enregistrés avec « Enregistrer ».',
      version: 'Couloir {{version}}',
      runs: 'Exécutions récentes',
      runsEmpty: 'Aucune course pour l’instant.',
      runsFailed: 'Impossible de charger ses exécutions.',
      readOnly: 'Seul son propriétaire peut le modifier.',
      owner: 'Propriétaire {{name}}',
    },
    status: {
      updatePending: 'Runner en attente de mise à jour',
      pruning: 'Runner nettoyant le magasin partagé',
      online: 'En ligne',
      offline: 'Hors ligne',
      revoked: 'Révoqué',
      upgrade_required: 'Mise à niveau requise',
    },
    upgradeRequired: {
      title: 'Ce runtime nécessite une mise à niveau',
      older:
        "Son exécuteur {{version}} parle le protocole d'agent {{protocol}} ; cette application nécessite le protocole {{required}}. Il reste connecté mais n'exécute rien jusqu'à ce qu'il soit mis à jour.",
      newer:
        "Son runner {{version}} parle le protocole d'agent {{protocol}}, plus récent que cette application (protocole {{required}}). Il reste connecté mais n'exécute rien jusqu'à ce qu'il exécute un exécuteur servi par cette application.",
      latest:
        "Cette application sert le programme d'exécution {{latest}}. Exécutez ceci sur son hôte pour le mettre à jour :",
      noLatest:
        'Installez un exécuteur qui parle le protocole {{required}}, ou exécutez-le sur son hôte pour le mettre à jour :',
      reinstall:
        'Son runner ne précise pas comment il a été installé. Installez-le à nouveau sur son hôte avec la commande de Add runtime.',
    },
    tool: {
      signedIn: 'Connecté',
      signedOut: 'Non connecté',
      notInstalled: 'Non installé',
      off: 'Désactivé',
      offHint:
        "Désactivé : le travail pour cet outil n'est pas envoyé à ce runtime.",
      enableLabel: 'Exécutez {{tool}} sur {{name}}',
      version: 'Version {{version}}',
    },
    trust: {
      label: 'Pour qui ça marche',
      team: 'Équipe',
      teamHint:
        "Exécute le travail que tout membre de l'équipe commence, avec ses variables et ses secrets. Pour les serveurs partagés et les machines virtuelles.",
      ownerOnly: 'Personnel',
      ownerOnlyHint:
        'Exécute uniquement le travail que vous démarrez. Valeur par défaut pour un runtime que vous ajoutez.',
      personalOnly:
        "Ce runtime sera personnel : il exécute uniquement le travail que vous démarrez. Vous pourrez le partager avec l'équipe plus tard.",
    },
    share: {
      title: "Partager {{name}} avec l'équipe ?",
      description:
        "Les exécutions d'autres personnes s'exécuteront sur ce moteur d'exécution, avec leurs variables et leurs secrets, et pourront lire ce qu'il contient. Partagez-le seulement si cela vous convient.",
      confirm: "Partager avec l'équipe",
    },
    edit: {
      button: 'Modifier',
      title: 'Modifier {{name}}',
      name: 'Nom',
      nameRequired: 'Entrez un nom.',
      slotsHint: "Combien d'exécutions le runtime prend en même temps.",
      slotsInvalid: 'Entrez un nombre entier de 1 à 64.',
      saved: '{{name}} enregistré',
    },
    upgrade: {
      show: 'Version {{version}} : un runner plus récent est disponible',
      available: 'Mise à jour disponible',
      badge: 'Évolutif',
      title: 'Un exécuteur plus récent pour {{name}}',
      description: '{{version}} installée, cette application sert {{latest}}.',
      hint: "Il se met à jour lorsqu'aucun agent n'est en cours d'exécution. Pour le mettre à jour maintenant, exécutez-le sur son hôte.",
    },
    revoke: {
      title: "Révoquer les informations d'identification de {{name}} ?",
      description:
        "Son runner s'arrête à sa prochaine requête et ses exécutions retournent dans la file d'attente. Pour le reconnecter, ajoutez à nouveau le runtime.",
      confirm: 'Révoquer',
      done: "Révocation des informations d'identification de {{name}}",
    },
    delete: {
      title: 'Supprimer {{name}} ?',
      description:
        'Le runtime révoqué est supprimé de la liste. Ses courses passées restent.',
      confirm: 'Supprimer',
      done: '{{name}} supprimé',
    },
    revokedList_many:
      "Les environnements d'exécution {{count}} ont été révoqués.",
  },
  connect: {
    title: "Ajouter un environnement d'exécution",
    description:
      "Exécutez la commande ci-dessous sur un hôte sur lequel un outil de codage est installé : un serveur, une VM ou votre propre appareil. Les agents y fonctionnent avec un accès complet, en tant qu'utilisateur qui exécute le exécuteur, et peuvent lire et modifier tout ce que l'utilisateur peut faire, clés SSH et autres informations d'identification incluses. Le runner n'est pas une barrière de sécurité : exécutez-le en tant qu'utilisateur dédié, dans un conteneur ou dans une VM.",
    createCredential: "Générer la commande d'installation",
    advanced: 'Avancé : limites par outil de codage',
    run: 'Exécutez ceci sur cet hôte. Il télécharge le runner (nocobase-runner) et la CLI de cette application à partir de cette application, enregistre le runner et le démarre à la connexion :',
    nodeRequired:
      "L'hôte a besoin de Node.js 24 ou plus récent (vérifiez avec node --version). La commande s'arrête et indique comment l'installer lorsqu'elle est manquante.",
    installed: 'Nocobase-runner est-il déjà installé ? Enregistrez-le plutôt :',
    unsupported:
      "Le programme d'exécution ne s'exécute pas encore sous Windows. Utilisez macOS ou Linux, ou WSL.",
    tokenOnce:
      'La commande comporte un identifiant unique pour un environnement d\'exécution "{{trust}}". Cela fonctionne une fois, jusqu\'à {{time}}.',
    after:
      'En quelques secondes, le runtime apparaît dans la liste, avec chaque outil de codage trouvé…',
    tokenTools: 'Outils de codage : {{tools}}.',
    tools: 'Outils de codage',
    toolsHint:
      'Ce runtime ne fonctionne que pour les outils cochés. Vous pouvez le modifier à tout moment sur la page Runtimes.',
    toolsRequired: 'Choisissez au moins un outil de codage.',
    slots: "Nombre maximal d'exécutions simultanées",
    slotsHint:
      "Combien d'exécutions le runtime prend en même temps. Vous pouvez le modifier à tout moment sur la page Runtimes.",
    tokenSlots: "Nombre maximal d'exécutions simultanées : {{slots}}.",
    tokenToolSlots: 'Par outil de codage : {{limits}}.',
    connected: '{{name}} est connecté.',
    done: 'Terminé',
    system: {
      macos: 'macOS',
      linux: 'Linux',
      windows: 'Windows',
    },
  },
  chat: {
    untitled: 'Conversation sans titre',
    renamed: 'Renommé',
    archivedNamed: 'Archivé « {{title}} »',
    unarchived: 'Conversation restaurée',
    undo: 'Annuler',
    sendFailed: "Le message n'a pas été envoyé. Essayer à nouveau.",
    availability: {
      online: 'En ligne',
      agentMissing: 'Supprimé',
      agentArchived: 'Non activé',
      forbidden: 'Non disponible pour vous',
      noModel: "Configurez d'abord un modèle de chat",
      noRunner: 'Aucun exécuteur en ligne, ne peut être choisi',
      othersPersonal: "Seuls les exécuteurs personnels des autres l'ont",
      modelUnavailable: 'Modèle indisponible',
    },
    offline: {
      fallbackDone: 'Cette conversation utilise désormais un autre agent',
      restoreDone: 'Rebasculé',
      newSession:
        "L'agent démarre une nouvelle session et lit cette conversation.",
    },
    notice: {
      switchedToDefault:
        "Passé à {{name}}, la valeur par défaut du système, jusqu'à ce que {{own}} soit de retour.",
      switchedToOnline:
        "{{own}} n'a pas de exécuteur pour vous maintenant, donc {{name}} répond jusqu'à ce que {{own}} soit de retour.",
      onlineFallbackUnavailable:
        "L'agent de secours en ligne ne peut pas répondre ({{reason}}). Cette conversation reste avec {{own}} en attendant un exécuteur.",
      switchedBack: 'De retour avec {{name}}.',
      runFailed: "L'agent s'arrête avant de répondre.",
      runFailedReason: "L'agent s'arrête avant de répondre : {{reason}}",
      runCancelled: 'Annulation demandée.',
    },
    consultation: {
      unavailableTitle: 'Agent consulté indisponible',
      snapshotTitle: "{{name}} demandé à l'époque",
      title: 'Consulté {{name}}',
    },
    steps: {
      thinking: 'Penser…',
      reading: 'En regardant {{subject}}',
      working: 'Travail sur {{subject}}',
    },
    agents: {
      personalOnly: 'Exécuteurs personnels uniquement',
      hint: "Répertorie les agents activés et explique pourquoi on ne peut pas vous répondre maintenant. Les réponses courent sur un exécuteur : la première réponse attend qu'on la prenne, généralement quelques secondes.",
      chooseFor: 'Choisissez un agent',
      empty: 'Aucun agent que vous ne pouvez choisir',
      none: 'Aucun agent',
      unknown: 'Agent inconnu',
      placeholder: 'Choisissez un agent',
      myDefault: 'Mon défaut',
      systemDefault: 'Valeur par défaut du système',
    },
  },
  chatProfile: {
    loadFailed: 'Impossible de charger les paramètres de votre agent',
    defaultAgent: 'Mon agent de chat par défaut',
    systemDefault: 'Valeur par défaut du système',
    systemDefaultNamed: 'Valeur par défaut du système ({{name}})',
    noDefault: "Aucune valeur par défaut du système n'est définie.",
    saved: 'Agent de chat par défaut enregistré',
  },
  models: {
    title: 'Modèles',
    description:
      "Les services modèles que les agents en ligne appellent et les modèles que chacun propose : modèles de chat pour les agents, modèles d'intégration et de reclassement pour la recherche.",
  },
  defaultModel: {
    title: 'Modèle de discussion par défaut',
    description:
      "Les agents en ligne sans modèle de leur propre réponse, comme un nouvel agent ou un agent fourni avec l'application.",
    none: "Aucun modèle de chat n'est encore activé. Ajoutez un service de modèle et activez un modèle de discussion : le premier devient le modèle par défaut.",
    saved: 'Le modèle de discussion par défaut est désormais {{model}}.',
  },
  services: {
    list: 'Services modèles',
    columns: {
      name: 'Nom',
      provider: 'Type de fournisseur',
      status: 'Statut',
    },
    loadFailed: 'Impossible de charger les services de modèles',
    empty: {
      title: 'Pas encore de service modèle',
      description:
        'Une fois que vous avez ajouté un service modèle, les agents en ligne peuvent répondre via celui-ci.',
      readOnly: "Demandez à un administrateur d'ajouter un service modèle.",
    },
    add: {
      open: 'Ajouter un service',
      title: 'Ajouter un service modèle',
      provider: 'Type de fournisseur',
      created: '{{title}} ajouté.',
    },
    status: {
      on: 'Sur',
      off: 'Désactivé',
      noKey: 'Pas de clé API',
      noModels: 'Aucun modèle sur',
    },
    service: {
      edit: 'Modifier {{title}}',
      defaultHost: 'Valeur par défaut du fournisseur',
      actions: "Plus d'actions pour {{title}}",
      turnOn: 'Allumer',
      turnOff: 'Éteindre',
      turnedOn: '{{title}} est activé.',
      turnedOff: '{{title}} est éteint.',
      name: 'Nom',
      enabled: 'Activé',
      enabledHint:
        "Les agents en ligne ne peuvent utiliser ses modèles que lorsqu'il est activé.",
      saved: '{{title}} enregistré.',
      delete: 'Supprimer',
      deleteTitle: 'Supprimer {{title}} ?',
      deleteDescription:
        "Les agents qui utilisent ses modèles cessent de répondre jusqu'à ce qu'on leur en donne un autre, et ses prix modèles sont supprimés.",
      deleted: '{{title}} supprimé.',
    },
    connection: {
      apiKey: 'Touche API',
      keyPlaceholder: 'Collez la clé API',
      baseUrl: 'URL de base',
      baseUrlHint:
        'Empty utilise la valeur par défaut du fournisseur, {{url}}.',
      baseUrlRequired: 'L’adresse du API du fournisseur.',
      baseUrlInvalid: 'La base URL commence par http:// ou https://.',
      test: 'Tester la connexion',
      testing: 'Test…',
      testOk: 'Connecté : {{model}} a répondu.',
      testFailed: "{{model}} n'a pas répondu : {{message}}",
      testNeedsModel: 'Vérifiez un modèle pour tester la connexion.',
      openCodeHint:
        "OpenCode envoie x-opencode-session à chaque requête (un identifiant de session par conversation). Il dessert chaque famille de modèles à travers son propre API : DeepSeek, GLM, Kimi et MiMo jusqu'à DeepSeek ou OpenAI-compatible, Claude, MiniMax et Qwen jusqu'à Anthropic, GPT et Grok jusqu'à OpenAI. Ajoutez un service de chaque type dont vous avez besoin, le tout avec cette base URL.",
    },
    models: {
      title: 'Modèles',
      description:
        "Vérifiez les modèles proposés par ce service et indiquez à quoi chacun sert : les modèles de chat répondent aux agents, intègrent le texte d'index des modèles pour la recherche, reclassent les modèles dans l'ordre des résultats de recherche. Un modèle d'intégration peut demander des vecteurs d'une taille.",
      fetching: 'Récupération des modèles du fournisseur…',
      fetchFailed: 'Le fournisseur ne liste pas ses modèles : {{message}}',
      fetch: 'Récupérer des modèles',
      search: 'Rechercher des modèles',
      noMatch: 'Aucun modèle ne correspond.',
      empty:
        'Pas encore de modèle. Récupérez-les auprès du fournisseur ou ajoutez-en un par son identifiant.',
      add: 'Ajouter un modèle',
      addPlaceholder: 'ID du modèle',
      kind: 'À quoi sert {{model}}',
      kinds: {
        chat: 'Bavarder',
        embedding: 'Intégration',
        rerank: 'Reclassement',
      },
      test: 'Test {{model}}',
      testOk: 'Réponse : {{kind}}.',
      testFailed: "N'a pas répondu : {{message}}",
      notKind: {
        chat: 'Ce modèle ne ressemble pas à un modèle de chat',
        embedding: "Ce modèle ne ressemble pas à un modèle d'intégration",
        rerank: 'Ce modèle ne ressemble pas à un modèle de reclassement',
      },
      looksLike: '{{notKind}} : il répond comme {{kind}}.',
      kindNouns: {
        chat: 'un modèle de chat',
        embedding: "un modèle d'intégration",
        rerank: 'un modèle de reclassement',
      },
      dimensions: 'Taille du vecteur de {{model}}',
      dimensionsPlaceholder: 'Par défaut',
      counts: {
        chat: 'Discussion {{count}}',
        embedding: 'Intégration {{count}}',
        rerank: 'Reclassement de {{count}}',
      },
    },
  },
  prices: {
    loadFailed: 'Impossible de charger les prix des modèles',
    section: {
      title: 'Tarifs des modèles',
      description:
        'Par million de jetons, entrée/sortie. Les rapports en calculent les coûts.',
      online: 'En ligne (services modèles)',
      noOnline:
        "Aucun modèle à tarifer pour l'instant. Activez d'abord un service de modèles et ses modèles.",
      runner: 'Runner (outils de codage)',
    },
    price: {
      model: 'Modèle',
      state: 'Source de prix et actions',
      input: 'Entrée / 1M',
      output: 'Sortie / 1M',
      inputOf: "Prix d'entrée de {{model}}, par million de jetons",
      outputOf: 'Prix de sortie de {{model}}, par million de jetons',
      save: 'Économisez le prix de {{model}}',
      saved: 'Prix du {{model}} économisé.',
      remove: 'Supprimer le prix du {{model}}',
      removed: 'Prix du {{model}} supprimé.',
      unpriced: 'Sans prix',
      unpricedHint:
        "Son coût est indiqué « - » dans les rapports jusqu'à ce qu'il ait un prix.",
      via: 'par {{pattern}}',
      viaHint:
        'Tarifé selon la règle {{pattern}}. Économiser ici donne à ce modèle son propre prix.',
      invalid: 'Les prix sont des nombres de 0 ou plus.',
      readOnly:
        'Seule la personne qui gère les prix des modèles peut les modifier.',
    },
    tool: {
      description:
        'Quel est le coût des exécutions de {{tool}}, en fonction du modèle rapporté par chaque exécution.',
      subscription: 'Abonnement (non facturé)',
      subscriptionTag: 'Abonnement',
      subscriptionHint:
        'Payé par forfait mensuel : ses exécutions ne coûtent rien dans les rapports.',
      subscribed: '{{tool}} est facturé par abonnement.',
      unsubscribed: '{{tool}} est facturé selon ses prix.',
      seen: 'Modèles vus en courses',
      noneSeen: "Aucune exécution de {{tool}} n'a encore signalé de modèle.",
      rules: 'Règles de prix ({{count}})',
      rulesHint:
        'Une règle est un identifiant de modèle ou un modèle tel que claude-sonnet-4* ; le match le plus spécifique gagne.',
      ruleModel: 'Modèle ou patron',
      addRule: 'Ajouter un prix',
      ruleAdded: 'Prix du {{model}} ajouté.',
    },
  },
  skills: {
    attachments: 'Pièces jointes',
    globalMount: 'Attachement global',
    globalMountDescription:
      'Enregistre immédiatement. Toutes les courses futures recevront cette compétence.',
    mountSaved: 'Paramètres de pièce jointe enregistrés.',
    mountRetry: 'Impossible de charger les paramètres. Réessayer',
    unavailableTarget: 'Cible indisponible',
    noAttachments: 'Non joint nulle part.',
    title: 'Compétences',
    description:
      'Instructions réutilisables avec fichiers de support. Attachez les valeurs par défaut de l’équipe globalement ou à un projet ou un répertoire de travail.',
    new: 'Nouvelle compétence',
    newTitle: 'Nouvelle compétence',
    newDescription:
      'Écrivez SKILL.md : son texte préliminaire nomme et décrit la compétence. Ajoutez des fichiers maintenant ou plus tard.',
    breadcrumb: 'Compétence',
    loadFailed: 'Impossible de charger les compétences',
    backToList: 'Retour aux compétences',
    emptyTitle: "Aucune compétence pour l'instant",
    emptyDescription:
      "Une fois que vous avez ajouté une compétence, les agents lisent son SKILL.md chaque fois qu'une tâche l'exige.",
    emptyReadOnly: "Demandez à un administrateur d'ajouter une compétence.",
    content: 'SKILL.md',
    contentHint:
      'Le nom du dossier est le nom du dossier de la compétence : le modifier renomme la compétence. La description indique aux agents quand la lire.',
    contentTooLarge: 'SKILL.md est plus grand que {{max}}.',
    emptyContent: "Cette compétence n'a pas encore de contenu.",
    created: 'Compétence créée "{{name}}"',
    saved: 'Enregistré sous la version {{version}}.',
    saveVersion: 'Enregistrer la nouvelle version',
    editing: 'Édition',
    note: 'Note',
    notePlaceholder: 'Ce qui a changé dans cette version (facultatif)',
    deleted: 'Compétence supprimée "{{name}}".',
    edit: 'Modifier',
    delete: 'Supprimer la compétence',
    deleteTitle: 'Supprimer la compétence "{{name}}" ?',
    deleteDescription:
      'Tout agent et tout lieu utilisant cette compétence par défaut la perd.',
    readOnly:
      "Seuls le créateur de la compétence et les administrateurs de l'espace de travail peuvent modifier cette compétence.",
    conflict:
      "Quelqu'un d'autre vient de modifier cette compétence. La dernière version est chargée ; essayer à nouveau.",
    conflictTitle: "Quelqu'un d'autre vient de modifier cette compétence",
    conflictDraft:
      "Quelqu'un a enregistré une nouvelle version après que vous ayez commencé à modifier, vos modifications n'ont donc pas été enregistrées. Copiez ce que vous souhaitez conserver, puis chargez la dernière version et modifiez-la à nouveau.",
    loadLatest: 'Charger la dernière version',
    mountedAgents: 'Agents attachés',
    noAgents: 'Pas encore attaché à un agent.',
    defaults: 'Compétence par défaut de : {{places}}.',
    defaultsSeparator: ', ',
    files: 'Fichiers',
    usage: 'Fichiers {{files}}/{{maxFiles}} · {{size}}/{{maxSize}}',
    uploadTooLarge: '{{name}} est plus grand que {{max}}.',
    uploadInvalidName:
      "{{name}} ne peut pas être ajouté ici ; renommez-le d'abord.",
    skillTooLarge: 'Une compétence contient au maximum {{max}} en tout.',
    tooManyFiles: 'Une compétence contient au plus des fichiers {{max}}.',
    filesTooLarge: 'Plus grand que {{max}} : {{paths}}.',
    binaryFile: 'Fichier binaire, {{size}}. Il ne peut pas être modifié ici.',
    executable: 'Exécutable',
    scriptBadge: 'Scénario',
    scriptsNote:
      'Possède des scripts : les agents en ligne peuvent les lire mais ne les exécutent jamais',
    compatibility: 'Compatibilité : {{value}}',
    fileContent: 'Contenu de {{path}}',
    export: 'Exporter',
    exportVersion: 'Exporter la version {{version}} sous forme de zip',
    import: 'Importer',
    importVersion: 'Importer une nouvelle version',
    imported: 'Compétence importée "{{name}}".',
    importInvalid:
      "Le SKILL.md de l'archive ne peut pas être utilisé : {{problem}}",
    tree: {
      label: 'Fichiers de compétences',
      newFile: 'Nouveau fichier',
      newFolder: 'Nouveau dossier',
      upload: 'Télécharger des fichiers',
      actionsFor: 'Actions pour {{name}}',
      rename: 'Renommer',
      delete: 'Supprimer',
      download: 'Télécharger',
      replace: 'Remplacer',
      markExecutable: 'Marquer comme exécutable',
      unmarkExecutable: 'Marquer comme non exécutable',
      dropHint: 'Déposez les fichiers sur un dossier pour les y télécharger.',
    },
    entry: {
      description:
        'Les noms sont vérifiés par rapport aux fichiers déjà présents.',
      folderHint:
        "Un dossier vide n'est pas enregistré : ajoutez-y un fichier avant d'enregistrer.",
      location: 'Localisation',
      root: 'Dossier de compétences (/)',
      name: 'Nom',
      renameTitle: 'Renommer "{{name}}"',
      conventional: {
        scripts:
          "Les agents de code peuvent s'exécuter. Les agents en ligne le lisent uniquement.",
        references:
          'Les agents de documentation lisent quand ils en ont besoin.',
        assets: 'Modèles, images et autres ressources.',
      },
      problems: {
        required: 'Entrez un nom.',
        invalid: 'Utilisez un nom sans "/", autre que "." et "..".',
        taken: 'Un fichier ou un dossier portant ce nom existe déjà.',
        reserved:
          'SKILL.md est la compétence elle-même ; choisissez un autre nom.',
      },
      deleteFileTitle: 'Supprimer le fichier "{{name}}" ?',
      deleteFolderTitle:
        'Supprimer le dossier "{{name}}" et tout ce qu\'il contient ?',
      deleteDescription:
        'Il est retiré de ce projet ; les versions enregistrées le conservent.',
    },
    editor: {
      write: 'Écrire',
      preview: 'Aperçu',
      nothingToPreview: "Rien à prévisualiser pour l'instant.",
      noPreview: "Pas d'aperçu pour ce genre de fichier.",
    },
    frontMatter: {
      title: 'Correction de la façade de SKILL.md',
      reasons: {
        missing:
          'Démarrez SKILL.md avec les préambules entre deux lignes "---", avec le nom et la description.',
        yaml: "Le sujet initial n'est pas un YAML valide.",
        notMapping:
          'Le premier élément doit être constitué de clés et de valeurs, telles que « nom : ma-compétence ».',
        required: 'Ajouter {{field}}.',
        empty: '{{field}} ne doit pas être vide.',
        type: 'Le type de {{field}} est incorrect.',
        tooLong: '{{field}} est plus long que les caractères {{max}}.',
        pattern:
          "utilise des lettres minuscules, des chiffres et des traits d'union simples, et ne commence ni ne se termine par un trait d'union.",
        mismatch: 'doit être le nom du dossier contenant SKILL.md.',
        taken: 'Une autre compétence porte ce nom ; choisissez-en un autre.',
      },
    },
    template: {
      description:
        "Que fait cette compétence et quand un agent doit l'utiliser.",
      title: 'Nouvelle compétence',
      whenToUse: 'Quand utiliser',
      whenToUseHint: 'Décrire les tâches qui font appel à cette compétence.',
      steps: 'Étapes',
      stepsHint: '1. La première chose à faire.\n2. La suivante.',
      examples: 'Exemples',
      examplesHint: 'Afficher une entrée et à quoi ressemble un bon résultat.',
    },
    columns: {
      name: 'Nom',
      description: 'Description',
      files: 'Fichiers',
      version: 'Version',
      agents: 'Agents',
      updated: 'Mis à jour',
    },
    versions: {
      title: 'Versions',
      description:
        'Chaque sauvegarde est une nouvelle version ; les agents reçoivent toujours les dernières informations.',
      current: 'Actuel',
      compare: 'Comparer',
      compareTitle: 'Version {{version}} → version {{current}}',
      compareDescription:
        'Lignes supprimées depuis en rouge, ajoutées en vert.',
      unchanged: 'inchangé',
      restore: 'Restaurer',
      restoreTitle: 'Restaurer la version {{version}} ?',
      restoreDescription:
        "Elle est à nouveau enregistrée en tant que version la plus récente ; les agents l'obtiennent lors de leur prochaine exécution. Rien n'est perdu : la version actuelle reste dans l'historique.",
      restored: 'Version restaurée {{version}} comme version {{current}}.',
    },
  },
  runWait: {
    capacity:
      'Emplacements utilisés ici {{used}}/{{limit}} ; {{detail}}; signalé comme étant gratuit dans toutes les applications {{reportedFree}}',
    reasons: {
      updatePending:
        'Runner en attente de mise à jour ; le nouveau travail est suspendu',
      pruning:
        'Exécuteur nettoyant magasin partagé; le nouveau travail est suspendu',
      toolNotInstalled: "Aucun exécuteur connecté n'a installé cet outil",
      incompatible:
        'Les exécuteurs connectés ne prennent pas en charge cette charge de travail ; mise à niveau requise',
      restricted:
        "Restrictions liées à la stratégie d'exécution, au répertoire ou aux variables",
      unknown: "L'éligibilité à la charge de travail n'est pas établie",
      agentArchived: "L'agent est archivé",
      delayed: 'Prévu pour {{until}}',
      noRunnerOnline: "Pas d'exécution en ligne",
      runnersOffline: "Ses environnements d'exécution sont hors ligne",
      toolUnavailable:
        'Outil non connecté, désactivé ou modèle demandé indisponible ({{tool}})',
      noSharedRunner:
        'Seuls les exécuteurs personnels des autres personnes sont en ligne',
      missingFeatures:
        "Aucun moteur d'exécution ne prend en charge {{features}}",
      secretsNotAllowed:
        "Nécessite un environnement d'exécution en équipe : {{variables}} est uniquement destiné aux environnements d'exécution en équipe.",
      sameWorkActive: 'Après la course, déjà dessus',
      concurrencyFull: 'Accès simultané complet ({{active}}/{{limit}})',
      runnersBusy: 'Les exécuteurs compatibles sont pleins',
      toolSlotsFull: 'Emplacements {{tool}} pleins ({{used}}/{{limit}})',
      setupRetrying:
        'La préparation a échoué ; nouvelle tentative : {{detail}}',
      next: 'Next pour un runtime gratuit',
    },
    unknown: "En file d'attente ({{reason}})",
    unknownValue: '—',
  },
  access: {
    section: 'Équipe d’agents',
    businessSection: 'Équipe d’agents',
    businesses: {
      agents: {
        title: 'Agents et compétences',
        description:
          "Les agents de l'équipe et les compétences qu'ils utilisent.",
        actions: {
          edit: {
            title: 'Agents de changement et compétences',
            description:
              "Modifier les paramètres, les compétences et les variables d'un agent, l'archiver, le restaurer et le supprimer, et modifier les compétences. Un agent ne dispose d'aucune capacité autre que celle de l'éditeur.",
            related:
              "Agents de changement et compétences (agents qu'ils possèdent et compétences qu'ils ont créées)",
            relatedLabel:
              "Agents que je possède et compétences que j'ai créées",
            relatedHint:
              "Agents dont je suis propriétaire et compétences que j'ai créées",
            all: 'Agents de changement et compétences (tous)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agents',
        runners: 'Environnements d’exécution',
        prices: 'Tarifs des modèles',
        services: 'Services modèles',
      },
    },
    actions: {
      read: 'Afficher',
      manage: 'Gérer',
    },
    keyScopes: {
      agents: {
        title: 'Agents',
        description:
          "Voir agents, compétences et courses ; changer d'agent et de compétence, annuler et réessayer les exécutions.",
      },
      runners: {
        title: 'Environnements d’exécution',
        description:
          "Voir exécuteurs et jetons d'inscription ; gérer les exécuteurs.",
      },
      prices: {
        title: 'Tarifs des modèles',
        description:
          'Voir le modèle de prix à partir duquel les coûts sont estimés ; changez-les.',
      },
      services: {
        title: 'Services modèles',
        description:
          "Voir les services modèles et les modèles qu'ils proposent, jamais leurs clés.",
      },
    },
  },
};

export default frFR;
