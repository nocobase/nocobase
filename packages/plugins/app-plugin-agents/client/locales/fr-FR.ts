import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  modelSuggestions: {
    design:
      'Raisonnement le plus avancé : propositions, architecture, enquêtes difficiles et revue des modifications importantes ; aussi implémentation courante et modifications entre paquets.',
    large:
      'Implémentations importantes, modifications entre paquets, refactorisation et implémentation courante ; aussi propositions, revue de code et petites modifications.',
    review:
      'Revue de code et analyse des échecs CI ; aussi propositions et enquêtes difficiles.',
    routine:
      'Implémentation courante, petites corrections, tests et textes ; aussi analyse des échecs CI.',
    small:
      'Petites modifications, éditions mécaniques et tests, économiques et rapides ; aussi analyse des échecs CI.',
    explanation:
      'Compréhension des besoins, explications et rédaction de propositions.',
  },
  goodAtTemplates: {
    fill: 'Remplir avec un modèle',
    design: 'Conception et revue',
    large: 'Implémentation importante',
    review: 'Revue de code et CI',
    routine: 'Implémentation courante',
    small: 'Petites modifications',
    explanation: 'Explications et propositions',
    undo: 'Annuler',
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
    TOOLS_REFRESH_UNSUPPORTED:
      'Ce runner ne prend pas en charge l’actualisation du statut. Redémarrez-le.',
    RUNNER_REFRESH_UNAVAILABLE:
      'Le statut d’un runner révoqué ne peut pas être actualisé.',
    boundRunnerIncompatible:
      'Cet environnement ne peut pas exécuter l’Agent sélectionné. Changez d’environnement pour continuer.',
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
    gemini: 'Gemini CLI',
    copilot: 'GitHub Copilot',
    cursor: 'Cursor',
    qwen: 'Qwen Code',
    kimi: 'Kimi CLI',
    codebuddy: 'CodeBuddy Code',
    qoder: 'Qoder CLI',
    goose: 'Goose',
    auggie: 'Auggie',
    droid: 'Factory Droid',
    kilo: 'Kilo Code',
    cline: 'Cline',
    amp: 'Amp',
    vibe: 'Mistral Vibe',
    dsh: 'DeepSeek Harness',
  },
  agents: {
    unavailableNow: 'Indisponible actuellement',
    title: 'Agents',
    description:
      'Ajoutez des Agents à partir des modèles signalés par les environnements d’exécution. Le Lead Agent confie chaque étape d’une tâche à l’Agent dont la description correspond.',
    fromRunners: 'Agents des environnements d’exécution',
    display: {
      search: 'Rechercher des modèles ou des fournisseurs',
      select: 'Sélectionnez {{name}}',
      showDisabled: 'Afficher désactivés',
      hideDisabled: 'Masquer désactivés',
    },
    filterLabel: 'Afficher les Agents',
    filters: {
      all: 'Tous les {{count}}',
      enabled: 'Activé {{count}}',
      unreported: 'Aucun environnement d’exécution {{count}}',
    },
    loadFailed: 'Impossible de charger les Agents',
    loadMore: 'Charger plus',
    emptyTitle: "Aucun Agent pour l'instant",
    emptyDescription:
      'Connectez un environnement d’exécution disposant d’un outil de codage avec une session ouverte, puis ajoutez un Agent depuis « Modèles disponibles ».',
    noneInFilter: 'Aucun Agent ici.',
    howToAdd:
      'Pour ajouter un Agent, installez un outil de développement sur un environnement d’exécution et connectez-vous à un modèle que vous pouvez utiliser : une fois signalé par l’environnement, ajoutez-le depuis Modèles disponibles en décrivant ses points forts. Un Agent présent uniquement sur des environnements personnels ne travaille que sur les tâches lancées par leurs propriétaires.',
    goodAtMissing: 'Pas encore écrit',
    columns: {
      agent: 'Agent',
      goodAt: 'Bon à',
      where: 'Où il court',
      effort: 'Effort de raisonnement',
      state: 'Statut',
    },
    where: {
      none: 'Aucun environnement d’exécution',
      team_one: "Exécuteur d'équipe {{count}}",
      team_other: "Exécuteurs de l'équipe {{count}}",
      personal_one: 'Exécuteur personnel {{count}} en ligne',
      personal_other: 'Exécuteurs personnels {{count}} en ligne',
      both: 'Équipe {{team}} · Personnel {{personal}}',
      names: '{{names}}',
      noneOnline: 'Aucun environnement d’exécution en ligne actuellement',
      personalOnly: 'Exécuteurs personnels uniquement',
      lastReported: 'Dernier rapport {{when}}',
      team_many: "Exécuteurs de l'équipe {{count}}",
      personal_many: 'Exécuteurs personnels {{count}} en ligne',
    },
    state: {
      enabled: 'Activé',
      disabled: 'Désactivé',
      unreported: 'Aucun environnement d’exécution',
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
      reportedBy_one:
        'Rapporté par le environnement d’exécution {{count}} en ligne : {{names}}.',
      reportedBy_other:
        'Rapporté par les environnements d’exécution de {{count}} en ligne : {{names}}.',
      noRunnerNow:
        "Aucun environnement d’exécution qui l'a n'est en ligne actuellement.",
      goodAtHint:
        "Le Lead Agent décide ce qu'il doit donner à cet Agent par ces mots. Dites ce qui convient et ce qui ne convient pas.",
      goodAtRequired: "Écrivez ce pour quoi il est bon avant de l'activer.",
      effortHint:
        "Le Lead Agent ne peut pas le modifier lorsqu'il lui confie le travail.",
      personalOnly:
        'Seuls des environnements personnels l’ont : le Lead Agent ne lui confie que les tâches lancées par leurs propriétaires.',
      reportedBy_many:
        'Rapporté par les environnements d’exécution de {{count}} en ligne : {{names}}.',
    },
    edit: {
      button: 'Modifier',
      buttonFor: 'Modifier {{name}}',
      title: 'Modifier {{name}}',
      enabled: 'Activé',
      done: '{{name}} enregistré',
    },
    available: {
      open: 'Ajouter un Agent',
      title: 'Modèles disponibles',
      description:
        'Seuls les outils cochés sur l’environnement d’exécution sont détectés et apparaissent ici. Les combinaisons recommandées par l’application se créent et s’activent d’elles-mêmes dès qu’un environnement d’exécution les signale ; ajoutez-en un Agent à partir de n’importe quelle autre.',
      recommended: 'Activé automatiquement dès le signalement',
      added: 'Ajouté',
      add: 'Ajouter',
      status: {
        available: 'Disponible',
        needsSetup: 'Configuration requise',
        versionTooOld: 'Version trop ancienne',
        failed: 'Détection échouée',
      },
      details: 'Détails de l’outil',
      setupCommand: 'Exécutez {{command}} sur l’environnement d’exécution.',
      setupUnknown:
        'Cet outil doit être configuré, mais nous ne connaissons pas la commande correspondante.',
      upgradeAdvice:
        'Mettez à jour l’outil et son adaptateur ACP dans l’environnement, puis relancez la détection.',
      minimumVersionUnknown:
        'La version minimale compatible de l’outil est inconnue. Consultez sa documentation de compatibilité.',
      noDetail: 'L’outil n’a donné aucun détail supplémentaire.',
      showMore: 'Afficher plus',
      showLess: 'Afficher moins',
      groupSearchPlaceholder: 'Rechercher les modèles de cet outil',
      group_one: '{{tool}} · {{count}} modèle · {{runners}}',
      group_other: '{{tool}} · {{count}} modèles · {{runners}}',
      group_many: '{{tool}} · {{count}} modèles · {{runners}}',
      runners_one: '{{count}} environnement d’exécution',
      runners_other: '{{count}} environnements d’exécution',
      runners_many: '{{count}} environnements d’exécution',
      noModels: 'Aucun modèle ici.',
      selectedCount_one: '{{count}} sélectionné',
      selectedCount_other: '{{count}} sélectionnés',
      selectedCount_many: '{{count}} sélectionnés',
      addSelected: 'Ajouter {{count}}',
      confirmTitle_one: 'Ajouter {{count}} Agent',
      confirmTitle_other: 'Ajouter {{count}} Agents',
      confirmTitle_many: 'Ajouter {{count}} agents',
      confirmAction_one: 'Ajouter {{count}}',
      confirmAction_other: 'Ajouter {{count}}',
      confirmAction_many: 'Ajouter {{count}}',
      goodAtNeeded: 'En quoi est-il bon ?',
      addedCount_one: '{{count}} Agent ajouté.',
      addedCount_other: '{{count}} Agents ajoutés.',
      addedCount_many: '{{count}} agents ajoutés.',
      addedPartial:
        '{{succeeded}} ajoutés, {{failed}} n’ont pas pu être ajoutés. Raison sous chacun.',
      addFailed:
        '{{failed}} n’ont pas pu être ajoutés. Raison sous chacun ; réessayez.',
    },
  },
  agentTypes: {
    label: "Type d'agent",
    question: "Quel genre d'Agent?",
    online: 'En ligne',
    runner: 'Exécuteur',
    onlineHint:
      "Réponses en quelques secondes sur le serveur via un service de modèle. Aucun runtime n'est nécessaire ; il ne peut pas toucher au code.",
    runnerHint:
      'Pilote un outil de codage sur un runtime et travaille dans un répertoire de travail : code, fichiers, commandes.',
    immutable:
      "Un Agent garde son type ; créer un autre Agent pour l'autre type.",
    onServer: 'Sur le serveur',
    filterAll: 'Tous types',
    noneOfType: 'Aucun Agent de ce type.',
  },
  agentSkills: {
    title: 'Compétences',
    description:
      "Manuels que l'Agent lit lorsqu'une tâche correspond à sa description. Placé dans son répertoire de travail avant chaque exécution.",
    manage: 'Gérer les compétences',
    placeholder: 'Sélectionner les compétences',
    empty: "Aucune compétence pour l'instant.",
    save: 'Sauvegarder les compétences',
    descriptionOnline:
      "Manuels que l'Agent lit lorsqu'une tâche correspond à sa description, dans un bac à sable en lecture seule sur le serveur.",
    onlineScripts:
      "Les scripts ne sont pas exécutés pour les Agents en ligne : l'Agent peut les lire, pas les exécuter.",
    skippedScripts: ': {{paths}}',
    pathSeparator: ', ',
  },
  brief: {
    preview: "Aperçu de l'invite complète",
    previewTitle: "Aperçu de l'invite complète",
    previewDescription:
      "Quelle série de cet Agent serait envoyée maintenant, sur un sujet inventé. Rien n'est mis en file d'attente.",
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
      "Les règles de la plateforme sont envoyées en anglais ; l'Agent répond toujours dans votre langue.",
    agentPrompt: "Invite de l'agent (écrite par vous)",
    noAgentPrompt: "Cet Agent n'a pas d'invite propre.",
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
      "Transmis à l'outil de codage à chaque exécution et masqué dans les enregistrements d'exécution ; les valeurs ne s’affichent plus après l’enregistrement. Toute personne pouvant utiliser un Agent partagé peut recevoir ces valeurs sur son propre ordinateur ; marquez les secrets à haut risque « Exécutions d'équipe uniquement ».",
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
      "Sans cela, une exécution envoie la valeur au runtime qui la prend, y compris le runtime personnel de toute personne susceptible d'utiliser l'Agent. Avec lui, seul un runtime d'équipe effectue des exécutions qui obtiennent cette variable.",
    teamRunnersOnlyBadge: "Runtimes d'équipe uniquement",
    fromRunner: 'Extraire du runtime',
    fromRunnerHint:
      "Aucune valeur n'est conservée ici : le runtime qui effectue une exécution la fournit depuis sa propre machine, définie ici avec {{command}} ou transmise avec `--pass-env`. Un environnement d'exécution qui ne le fournit pas échoue avant son démarrage.",
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
      'Donné à chaque Agent travaillant ici. Des variables plus spécifiques (celui d’un répertoire de travail, puis celui de l’Agent) l’emportent.',
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
        "Appels de modèles en dehors des exécutions d'Agents, comme l'indexation et la recherche dans la base de connaissances.",
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
      "Quelles sont les exécutions d'Agent utilisées et leur coût aux prix actuels des modèles.",
    loadFailed: "Impossible de charger l'utilisation",
    groupBy: 'Regrouper par',
    groupByValue: 'Groupe par {{group}}',
    empty: 'Aucune course sur cette période.',
    total: 'Total',
    noGroup: 'Aucun',
    unknown: 'Inconnu',
    onlineTool: 'En ligne (services modèles)',
    setPrices: 'Définir les prix',
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
      allAgents: 'Tous les Agents',
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
      'Chaque Agent travaillant ici acquiert également ces compétences.',
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
    transcriptTitle: 'Transcription de l’exécution',
    viewAll: 'Tout afficher {{count}}',
    allTitle: 'Toutes les exécutions ({{count}})',
    filters: {
      agent: 'Agent',
      status: 'Statut',
      allAgents: 'Tous les Agents',
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
      "Ce qu'on a dit à l'Agent lors de la dernière réclamation de ce run.",
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
    title: 'Transcription de l’exécution',
    notFound: "Cette exécution n'existe pas.",
    waiting: "En attente du démarrage de l'Agent…",
    empty: "Cette exécution n'a enregistré aucun événement.",
    fetchFailed:
      'Impossible de récupérer de nouveaux événements. Nouvelle tentative…',
    expand: 'Afficher tout',
    truncated: 'Coupure : le texte intégral était trop long à conserver.',
    summary_one: "Création d'un événement {{created}} · {{count}}",
    summary_other: 'Événements {{created}} · {{count}} créés',
    took: 'a pris {{duration}}',
    pendingInputs_one: "Commentaire {{count}} en attente de l'Agent",
    pendingInputs_other: "Commentaires {{count}} en attente de l'Agent",
    inputDelivered_one: "Remis à l'Agent",
    inputDelivered_other: "Entrées {{count}} fournies à l'Agent",
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
    idleTimeout: "L'Agent cesse de progresser.",
    setupFailed: "Le run n'a pas pu être préparé.",
    cliUnavailable:
      "Le moteur d'exécution n'a pas pu installer la CLI de l'application.",
    workspaceBusy:
      'Le répertoire de travail est occupé ; en attendant une autre tentative.',
    checkoutFailed: "L'extraction du référentiel a échoué.",
    toolAuth: "L'outil de codage n'est pas connecté au runtime.",
    toolQuota: "L'outil de codage n'a plus de quota.",
    sessionUnavailable:
      'La session d’origine de l’outil de programmation n’a pas pu être reprise.',
    toolRateLimit: "L'outil de codage était limité en débit.",
    toolNetwork: "L'outil de codage n'a pas pu atteindre son service.",
    toolProcess: "L'outil de codage s'est arrêté de manière inattendue.",
    contextOverflow: 'La conversation est devenue trop longue pour le modèle.',
    delegatedQueueTimeout:
      "Expiration du délai d'attente de la file d'attente de délégation ; retiré",
    queuedExpired: 'Aucun runtime n’a pris le environnement d’exécution.',
    modelUnavailable: 'Le modèle de l’Agent n’est pas disponible.',
    stepLimit: "L'Agent a appelé tools trop souvent sans répondre.",
    policyRefused:
      'Aucune politique d’exécution ne lui permet d’effectuer ce travail.',
    prepareNetwork:
      "Le moteur d'exécution n'a pas pu atteindre l'hôte du référentiel lors de la préparation de l'exécution.",
    repoAccessUnavailable: 'L’accès au dépôt est temporairement indisponible.',
    repoAccessDenied:
      'L’application ne délivrera pas d’informations d’identification pour l’un des référentiels de l’exécution.',
    unknown: "L'exécution a échoué.",
  },
  runtimes: {
    refresh: {
      button: 'Actualiser le statut',
      checking: 'Vérification…',
      restart: 'Redémarrez le runner pour actualiser son statut.',
    },
    pathHint:
      'Le runner trouve les outils de développement avec son propre PATH. Dans un terminal où which codex / which claude fonctionne, relancez nocobase-runner service install et redémarrez le service (ou relancez nocobase-runner start) pour qu’il obtienne le bon PATH.',
    quota: {
      ceilingReached: 'Seuil de quota atteint',
      ceilingLabel: 'Suspendre à',
      ceilingInput:
        'Suspendre les nouveaux travaux {{tool}} au pourcentage utilisé',
      ceilingSave: 'Appliquer',
      ceilingInvalid:
        'Saisissez un pourcentage entier de 1 à 100, ou laissez vide.',
      ceilingPaused:
        'Une fenêtre a atteint le plafond ; les nouveaux travaux concernés attendent la réinitialisation ou un changement du plafond.',

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
        "Un Agent au quota peut toujours être sélectionné. Les travaux seront mis en file d'attente avec leur délai d'attente existant.",
      partial: 'Fonctionne sur {{available}} · {{blocked}} au quota',
      workspaceSize: "Taille de l'espace de travail : {{value}}",
      providers_one: 'Fournisseur {{count}} au quota',
      providers_other: 'Fournisseurs {{count}} au quota',
      models_one: '{{count}} modèle au quota',
      models_other: '{{count}} modèles au quota',
      models_many: '{{count}} modèles au quota',
      percent: '{{percent}}%',
      runColumns: {
        issue: 'Tâche / conversation',
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
      confirmTitle: 'Effacer la marque de quota de {{target}} ?',
      confirm:
        'Ne l’effacez qu’après avoir confirmé que le quota est rétabli. {{target}} retrouve du travail immédiatement ; si le quota est encore épuisé, la prochaine exécution le marque à nouveau.',
      observed: 'Dernier rapport {{time}}',
      usedPercent: '{{percent}}% utilisé',
      noUsage: 'Aucune donnée de quota pour le moment',
      hint: 'Une marque s’efface d’elle-même à l’heure de réinitialisation connue, ou quand l’outil signale à nouveau du quota disponible. Ne l’effacez à la main qu’après avoir confirmé que le quota est rétabli. Seuls le propriétaire du runtime et les administrateurs peuvent effacer les marques.',
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
      oldRunner:
        "Ce environnement d’exécution n'a pas fourni de raisons de diagnostic",
      noCleanup: "Le résultat du nettoyage local n'a pas été reçu",
      discardsUntracked: 'Le nettoyage supprimera les fichiers non suivis',
      decision: {
        settled:
          'Travaux terminés; des contrôles de nettoyage locaux sont requis',
        active: 'Les travaux continuent',
        runNotFound: 'Impossible de confirmer : exécution introuvable',
        ownershipUnknown:
          "Impossible de confirmer : la propriété du environnement d’exécution n'a pas pu être vérifiée",
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
      "Les environnements d'exécution qui exécutent les Agents et les outils de codage signalés par chacun.",
    add: "Ajouter un environnement d'exécution",
    loadFailed: 'Impossible de charger les runtimes',
    emptyTitle: "Aucun environnement d'exécution connecté pour le moment",
    emptyDescription:
      "Une fois qu'un runtime est connecté, les Agents d'exécution y travaillent avec ses outils de codage.",
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
      short: 'Exécutions {{used}}/{{limit}}',
      hint: 'Au plus {{limit}} exécutions {{tool}} à la fois ; {{used}} en cours',
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
        'Non signalé : son runner est plus ancien que cette fonctionnalité. Mettez à jour le environnement d’exécution pour les voir.',
    },
    jobs: {
      allow: 'Autoriser les tâches de build',
      hint: 'Les builds et autres étapes configurées par cette application sont exécutés sans modèle. Ce runtime rapporte : {{kinds}}.',
      unsupported:
        "Le programme d'exécution de ce runtime ne prend pas de tâches. Mettez à jour le environnement d’exécution pour l'activer.",
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
      runsTotal: '{{count}} exécutions',
      runsPagination: 'Pagination de l’historique',
      runsPrevious: 'Précédent',
      runsNext: 'Suivant',
      runsPage: 'Page {{page}} sur {{pageCount}}',
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
        "Son environnement d’exécution {{version}} parle le protocole d'Agent {{protocol}} ; cette application nécessite le protocole {{required}}. Il reste connecté mais n'exécute rien jusqu'à ce qu'il soit mis à jour.",
      newer:
        "Son runner {{version}} parle le protocole d'Agent {{protocol}}, plus récent que cette application (protocole {{required}}). Il reste connecté mais n'exécute rien jusqu'à ce qu'il exécute un environnement d’exécution servi par cette application.",
      latest:
        "Cette application sert le programme d'exécution {{latest}}. Exécutez ceci sur son hôte pour le mettre à jour :",
      noLatest:
        'Installez un environnement d’exécution qui parle le protocole {{required}}, ou exécutez-le sur son hôte pour le mettre à jour :',
      reinstall:
        'Son runner ne précise pas comment il a été installé. Installez-le à nouveau sur son hôte avec la commande de Add runtime.',
    },
    tool: {
      checking: 'En attente de détection',
      failed: 'Échec de la détection',
      redetect: 'Détecter à nouveau',
      notProvided: 'Non fourni',
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
      isolationHint:
        'Pour les environnements d’exécution personnels comme partagés, exécutez le runner dans une machine virtuelle ou un environnement isolé : les Agents ont un accès complet et le runner n’est pas un bac à sable.',
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
      latest: 'À jour',
      installed: 'Version {{version}}',
      title: 'Un environnement d’exécution plus récent pour {{name}}',
      description: '{{version}} installée, cette application sert {{latest}}.',
      hint: "Il se met à jour lorsqu'aucun Agent n'est en cours d'exécution. Pour le mettre à jour maintenant, exécutez-le sur son hôte.",
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
    manual: 'Ou installez-le vous-même',
    promptTitle: 'Laisser un Agent le configurer',
    promptCopy: 'Copier l’instruction pour l’Agent',
    promptShow: 'Voir l’instruction',
    promptHide: 'Masquer l’instruction',
    promptHint:
      'Copiez cette instruction vers un Agent (Claude Code, Codex, etc.) sur la machine cible : il effectuera les étapes ci-dessous à votre place. Elle contient un identifiant à usage unique : ne la donnez qu’à cet Agent.',
    windowsPowerShell:
      '1. Installez WSL : exécutez dans PowerShell, puis redémarrez Windows :',
    windowsUbuntu:
      '2. Ouvrez Ubuntu et exécutez la commande Linux ci-dessous. Installez Node.js et les outils de développement dans WSL Ubuntu.',
    windowsNetwork:
      'Si WSL n’a pas accès à Internet, activez la mise en réseau en miroir dans WSL.',
    promptWindows:
      'D’ABORD, détermine si tu t’exécutes dans WSL Ubuntu. Si tu n’es PAS dans WSL Ubuntu, ARRÊTE-TOI : n’exécute aucune commande d’installation ou d’enregistrement. Dis à l’utilisateur d’exécuter wsl --install dans PowerShell, de redémarrer Windows, puis d’ouvrir l’Agent dans WSL Ubuntu et de relancer cette instruction. Poursuis les étapes ci-dessous UNIQUEMENT dans WSL Ubuntu. Installe Node.js et les outils de développement dans WSL. Si WSL n’a pas accès à Internet, active la mise en réseau en miroir.\n\n',
    promptBody:
      'Configure cette machine comme environnement d’exécution NocoBase. Utilise une machine virtuelle ou un environnement isolé : les Agents ont un accès complet et le runner n’est pas un bac à sable.\n\nVérifie que Node.js 24 ou plus récent est présent et que ces outils de développement sont installés et connectés : {{tools}}. Utilise leurs méthodes d’installation officielles, pas les paquets snap.\n\nExécute cette commande d’enregistrement à usage unique pour installer le runner et la CLI de l’application, l’enregistrer et installer son service en arrière-plan :\n{{command}}\n\nRésous les problèmes de configuration courants : assure-toi que le PATH du service contient les outils de développement (vérifie which codex / which claude dans le terminal d’installation, puis relance nocobase-runner service install et redémarre le service) ; configure le proxy nécessaire pour les téléchargements et pour le service ; résous les droits d’installation globale npm avec un préfixe appartenant à l’utilisateur ou un gestionnaire de versions Node, sans sudo npm install.\n\nTermine par nocobase-runner status et confirme la connexion et les outils de développement. Signale-moi les étapes de connexion ou de réseau qu’il me reste à faire. Traite l’identifiant d’enregistrement comme un secret et ne l’inclus pas dans ton rapport.',
    title: "Ajouter un environnement d'exécution",
    description:
      "Exécutez la commande ci-dessous sur un hôte sur lequel un outil de codage est installé : un serveur, une VM ou votre propre appareil. Les agents y fonctionnent avec un accès complet, en tant qu'utilisateur qui exécute le environnement d’exécution, et peuvent lire et modifier tout ce que l'utilisateur peut faire, clés SSH et autres informations d'identification incluses. Le runner n'est pas une barrière de sécurité : exécutez-le en tant qu'utilisateur dédié, dans un conteneur ou dans une VM.",
    createCredential: "Générer la commande d'installation",
    advanced: 'Avancé : limites par outil de codage',
    run: 'Exécutez ceci sur cet hôte. Il télécharge le runner (nocobase-runner) et la CLI de cette application à partir de cette application, enregistre le runner et le démarre à la connexion :',
    nodeRequired:
      "L'hôte a besoin de Node.js 24 ou plus récent (vérifiez avec node --version). La commande s'arrête et indique comment l'installer lorsqu'elle est manquante.",
    installed: 'Nocobase-runner est-il déjà installé ? Enregistrez-le plutôt :',
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
    // Keep new guidance available in English until this locale is translated.
    executionFailed:
      'L’exécution a échoué. Relisez la conversation enregistrée avant de réessayer.',
    fileInputFailures: {
      imageCapability:
        'L’entrée d’images n’est pas configurée pour ce modèle. Passez à un modèle dont la prise en charge des images est vérifiée.',
      unsupportedFormat:
        'L’entrée pour ce format de pièce jointe n’est pas configurée pour le modèle sélectionné, et aucun extracteur de texte local ne le prend en charge. Utilisez un format de document pris en charge ou un modèle dont la prise en charge des fichiers est vérifiée.',
      formatMismatch:
        'Le nom du fichier joint et son type de média indiquent des formats de document différents. Vérifiez le format du fichier et téléversez-le à nouveau.',
      invalidInline:
        'Les données du fichier joint sont invalides ou trop volumineuses. Téléversez-le à nouveau ou utilisez un fichier plus petit.',
      fileTooLarge:
        'Une pièce jointe dépasse sa taille maximale. Utilisez un fichier plus petit.',
      inputTooLarge:
        'Les pièces jointes de la conversation dépassent la limite d’entrée. Utilisez des fichiers plus petits ou démarrez une nouvelle conversation.',
      documentTooLarge:
        'La pièce jointe dépasse la limite de texte extrait. Utilisez un fichier plus petit.',
      contextTooLarge:
        'Les pièces jointes de la conversation dépassent la limite de texte extrait. Utilisez des fichiers plus petits ou démarrez une nouvelle conversation.',
      fileCount:
        'La conversation dépasse la limite de 100 fichiers en entrée. Démarrez une nouvelle conversation.',
      nativeFileCount:
        'La conversation dépasse la limite configurée de fichiers natifs. Utilisez moins de pièces jointes ou convertissez-les en un document texte pris en charge.',
      unreadable:
        'La pièce jointe ne contient aucun texte lisible. Les documents numérisés nécessitent l’OCR.',
      extractionFailed:
        'Impossible d’extraire le texte de la pièce jointe. Vérifiez que le document est lisible et téléversez-le à nouveau.',
      extractionTimeout:
        'L’extraction du texte de la pièce jointe a expiré. Utilisez un fichier plus petit ou réessayez.',
      preparationFailed:
        'Impossible de préparer la pièce jointe. Vérifiez votre accès et le format du fichier, puis réessayez.',
    },
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
      noRunner: 'Aucun environnement d’exécution en ligne, ne peut être choisi',
      othersPersonal:
        "Seuls les environnements d’exécution personnels des autres l'ont",
      modelUnavailable: 'Modèle indisponible',
    },
    offline: {
      fallbackDone: 'Cette conversation utilise désormais un autre Agent',
      restoreDone: 'Rebasculé',
      newSession:
        "L'Agent démarre une nouvelle session et lit cette conversation.",
    },
    notice: {
      switchedToDefault:
        "Passé à {{name}}, la valeur par défaut du système, jusqu'à ce que {{own}} soit de retour.",
      switchedToOnline:
        "{{own}} n'a pas de environnement d’exécution pour vous maintenant, donc {{name}} répond jusqu'à ce que {{own}} soit de retour.",
      onlineFallbackUnavailable:
        "L'Agent de secours en ligne ne peut pas répondre ({{reason}}). Cette conversation reste avec {{own}} en attendant un environnement d’exécution.",
      switchedAgent:
        'Passage à {{name}} en conservant l’historique de cette conversation.',
      switchedBack: 'De retour avec {{name}}.',
      runFailed: "L'Agent s'arrête avant de répondre.",
      runFailedReason: "L'Agent s'arrête avant de répondre : {{reason}}",
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
      hint: "Répertorie les Agents activés et explique pourquoi on ne peut pas vous répondre maintenant. Les réponses courent sur un environnement d’exécution : la première réponse attend qu'on la prenne, généralement quelques secondes.",
      chooseFor: 'Choisissez un Agent',
      empty: 'Aucun Agent que vous ne pouvez choisir',
      none: 'Aucun Agent',
      unknown: 'Agent inconnu',
      placeholder: 'Choisissez un Agent',
      myDefault: 'Mon défaut',
      systemDefault: 'Valeur par défaut du système',
    },
  },
  chatProfile: {
    loadFailed: 'Impossible de charger les paramètres de votre Agent',
    defaultAgent: 'My Agent de chat par défaut',
    systemDefault: 'Valeur par défaut du système',
    systemDefaultNamed: 'Valeur par défaut du système ({{name}})',
    noDefault: "Aucune valeur par défaut du système n'est définie.",
    saved: 'Agent de chat par défaut enregistré',
  },
  models: {
    title: 'Modèles',
    description:
      "Les services modèles que les Agents en ligne appellent et les modèles que chacun propose : modèles de chat pour les Agents, modèles d'intégration et de reclassement pour la recherche.",
  },
  defaultModel: {
    title: 'Modèle de discussion par défaut',
    description:
      "Les Agents en ligne sans modèle de leur propre réponse, comme un nouvel Agent ou un Agent fourni avec l'application.",
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
        'Une fois que vous avez ajouté un service modèle, les Agents en ligne peuvent répondre via celui-ci.',
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
        "Les Agents en ligne ne peuvent utiliser ses modèles que lorsqu'il est activé.",
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
        "Vérifiez les modèles proposés par ce service et indiquez à quoi chacun sert : les modèles de chat répondent aux Agents, intègrent le texte d'index des modèles pour la recherche, reclassent les modèles dans l'ordre des résultats de recherche. Un modèle d'intégration peut demander des vecteurs d'une taille.",
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
      save: 'Enregistrer le prix de {{model}}',
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
      "Une fois que vous avez ajouté une compétence, les Agents lisent son SKILL.md chaque fois qu'une tâche l'exige.",
    emptyReadOnly: "Demandez à un administrateur d'ajouter une compétence.",
    content: 'SKILL.md',
    contentHint:
      'Le nom du dossier est le nom du dossier de la compétence : le modifier renomme la compétence. La description indique aux Agents quand la lire.',
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
      'Tout Agent et tout lieu utilisant cette compétence par défaut la perd.',
    readOnly:
      "Seuls le créateur de la compétence et les administrateurs de l'espace de travail peuvent modifier cette compétence.",
    conflict:
      "Quelqu'un d'autre vient de modifier cette compétence. La dernière version est chargée ; essayer à nouveau.",
    conflictTitle: "Quelqu'un d'autre vient de modifier cette compétence",
    conflictDraft:
      "Quelqu'un a enregistré une nouvelle version après que vous ayez commencé à modifier, vos modifications n'ont donc pas été enregistrées. Copiez ce que vous souhaitez conserver, puis chargez la dernière version et modifiez-la à nouveau.",
    loadLatest: 'Charger la dernière version',
    mountedAgents: 'Agents attachés',
    noAgents: 'Pas encore attaché à un Agent.',
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
      'Possède des scripts : les Agents en ligne peuvent les lire mais ne les exécutent jamais',
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
          "Les Agents de code peuvent s'exécuter. Les Agents en ligne le lisent uniquement.",
        references:
          'Les Agents de documentation lisent quand ils en ont besoin.',
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
        "Que fait cette compétence et quand un Agent doit l'utiliser.",
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
        'Chaque enregistrement crée une nouvelle version ; les Agents reçoivent toujours la plus récente.',
      current: 'Actuel',
      compare: 'Comparer',
      compareTitle: 'Version {{version}} → version {{current}}',
      compareDescription:
        'Lignes supprimées depuis en rouge, ajoutées en vert.',
      unchanged: 'inchangé',
      restore: 'Restaurer',
      restoreTitle: 'Restaurer la version {{version}} ?',
      restoreDescription:
        "Elle est à nouveau enregistrée en tant que version la plus récente ; les Agents l'obtiennent lors de leur prochaine exécution. Rien n'est perdu : la version actuelle reste dans l'historique.",
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
      toolNotInstalled:
        "Aucun environnement d’exécution connecté n'a installé cet outil",
      incompatible:
        'Les environnements d’exécution connectés ne prennent pas en charge cette charge de travail ; mise à niveau requise',
      restricted:
        "Restrictions liées à la stratégie d'exécution, au répertoire ou aux variables",
      unknown: "L'éligibilité à la charge de travail n'est pas établie",
      agentArchived: "L'Agent est archivé",
      delayed: 'Prévu pour {{until}}',
      noRunnerOnline: "Pas d'exécution en ligne",
      runnersOffline: "Ses environnements d'exécution sont hors ligne",
      toolQuota: 'Quota de l’outil épuisé ; réinitialisation : {{until}}',
      toolUnavailable:
        'Outil non connecté, désactivé ou modèle demandé indisponible ({{tool}})',
      noSharedRunner:
        'Seuls les environnements d’exécution personnels des autres personnes sont en ligne',
      missingFeatures:
        "Aucun moteur d'exécution ne prend en charge {{features}}",
      secretsNotAllowed:
        "Nécessite un environnement d'exécution en équipe : {{variables}} est uniquement destiné aux environnements d'exécution en équipe.",
      sameWorkActive: 'Après la course, déjà dessus',
      concurrencyFull: 'Accès simultané complet ({{active}}/{{limit}})',
      runnersBusy: 'Les environnements d’exécution compatibles sont pleins',
      toolSlotsFull: 'Emplacements {{tool}} pleins ({{used}}/{{limit}})',
      setupRetrying:
        'La préparation a échoué ; nouvelle tentative : {{detail}}',
      next: 'Next pour un runtime gratuit',
    },
    unknown: "En file d'attente ({{reason}})",
    quotaResetUnknown: 'inconnue',
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
              "Modifier les paramètres, les compétences et les variables d'un Agent, l'archiver, le restaurer et le supprimer, et modifier les compétences. Un Agent ne dispose d'aucune capacité autre que celle de l'éditeur.",
            related:
              "Agents de changement et compétences (Agents qu'ils possèdent et compétences qu'ils ont créées)",
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
          "Voir Agents, compétences et courses ; changer d'Agent et de compétence, annuler et réessayer les exécutions.",
      },
      runners: {
        title: 'Environnements d’exécution',
        description:
          "Voir environnements d’exécution et jetons d'inscription ; gérer les environnements d’exécution.",
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
