import type { SchedulerResource } from './en-US.js';

const frFR: SchedulerResource = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: {
    title: 'Tâches planifiées',
    read: 'Consulter',
    manage: 'Gérer',
  },
  nav: { automation: 'Automatisation', schedules: 'Tâches planifiées' },
  page: {
    title: 'Tâches planifiées',
    description:
      'Tâches que les plugins et l’application définissent dans le code et exécutent selon un calendrier. Voyez quand elles s’exécutent et comment chaque exécution s’est terminée, et mettez-les en pause ou reprenez-les. Leurs règles vivent dans le code ; cette page ne peut ni les créer ni les modifier.',
    loadFailed: 'Impossible de charger les tâches planifiées.',
    retry: 'Réessayer',
    close: 'Fermer',
    copy: 'Copier',
    copied: 'Copié',
    loadMore: 'Charger plus',
    none: '—',
    tabs: { tasks: 'Tâches', runs: 'Exécutions', config: 'Configuration' },
  },
  tasks: {
    attention: {
      title_one: '{{count}} élément requiert votre attention',
      title_many: '{{count}} éléments requièrent votre attention',
      title_other: '{{count}} éléments requièrent votre attention',
      target:
        'La cible {{target}} de « {{title}} » est indisponible ({{state}}), donc chaque déclenchement est enregistré comme ignoré.',
      waiting:
        'L’exécution de « {{title}} » démarrée {{time}} attend toujours son résultat.',
      failed:
        'La dernière exécution de « {{title}} » s’est terminée avec le statut {{status}}.',
    },
    stats: {
      total: 'Tâches planifiées',
      running: 'Actives',
      attention: 'À traiter',
      next: 'Prochaine exécution',
      nextOf: 'Prochaine exécution · {{title}}',
    },
    filters: {
      all: 'Toutes',
      running: 'Actives',
      attention: 'À traiter',
      paused: 'En pause',
      removed: 'Retirées du code',
      search: 'Rechercher par nom ou key',
    },
    columns: {
      task: 'Tâche',
      rule: 'Règle',
      next: 'Prochaine exécution',
      last: 'Dernière exécution',
      totals: 'Totaux',
      state: 'Statut',
      enabled: 'Activée',
    },
    totals: '{{runs}} exécutions · {{succeeded}} réussies',
    noMatch: 'Aucune tâche planifiée ne correspond à ces filtres.',
    enable: 'Reprendre « {{title}} »',
    disable: 'Mettre en pause « {{title}} »',
    toggleFailed: 'Impossible de modifier la tâche planifiée.',
    readOnly:
      'Vous pouvez consulter les tâches planifiées, mais pas les mettre en pause ni les reprendre.',
    notes: {
      running:
        '« Active » signifie seulement que la tâche est activée et que sa cible existe ; le résultat de chaque exécution indique si le travail a réussi. Les totaux comptent chaque déclenchement, échecs et ignorés compris.',
      pause:
        'La mise en pause ne concerne que les exécutions suivantes. Les mises à jour du code et les redéploiements laissent l’interrupteur tel quel.',
      removed:
        '« Retirées du code » : après `scheduler sync --finalize`, les tâches qui ne figurent plus dans le code sont marquées ainsi ; leur historique est conservé et elles ne peuvent pas être reprises.',
      internal:
        'Les tâches internes en arrière-plan, comme les nouvelles tentatives de notifications, la synchronisation des e-mails, l’indexation des connaissances et le nettoyage des exécutions d’agents, ne sont pas listées ici ; leurs plugins les gèrent.',
    },
  },
  state: {
    running: 'Active',
    paused: 'En pause',
    unavailable: 'Cible indisponible',
    removed: 'Retirée du code',
  },
  targetState: {
    ready: 'Disponible',
    disabled: 'Désactivée',
    missing: 'Introuvable',
    invalid: 'Configuration invalide',
  },
  pause: {
    title: 'Mettre en pause « {{title}} » ?',
    description:
      'Elle ne s’exécutera plus à l’heure prévue jusqu’à ce que quelqu’un la reprenne.',
    running:
      'Les exécutions déjà démarrées ou en attente de résultat ne sont pas annulées.',
    missed:
      'À la reprise, elle continue à partir de la prochaine heure prévue ; les exécutions manquées pendant la pause ne sont pas rattrapées.',
    redeploy: 'Un redéploiement ne la reprend pas.',
    limit:
      'Pour une tâche avec une limite d’exécutions, les exécutions déjà effectuées continuent de compter.',
    cancel: 'Annuler',
    confirm: 'Mettre en pause',
  },
  empty: {
    title: 'Aucune tâche planifiée pour le moment',
    description:
      'Les tâches planifiées sont définies dans le code avec `defineSchedule` par les plugins ou l’application. Installez un plugin qui définit des tâches planifiées, ou définissez-en une dans l’application et redémarrez : elles apparaîtront ici.',
    internal:
      'Les tâches internes en arrière-plan, comme les nouvelles tentatives de notifications, la synchronisation des e-mails et l’indexation des connaissances, ne sont pas listées ici ; elles continuent de s’exécuter selon leurs propres règles.',
  },
  detail: {
    back: 'Tâches planifiées',
    notFound: 'Cette tâche planifiée n’existe pas.',
    key: 'Key',
    rule: 'Règle',
    upcoming: 'Prochaines exécutions',
    noUpcoming: 'Aucune prévue',
    window: 'Période · limite d’exécutions',
    unlimited: 'Illimitée',
    windowFrom: 'à partir du {{time}}',
    windowTo: 'jusqu’au {{time}}',
    limit_one: '{{count}} exécution',
    limit_many: '{{count}} exécutions',
    limit_other: '{{count}} exécutions',
    target: 'Cible',
    totals: 'Totaux',
    source: 'Définie dans',
    sourceCode:
      'Code (`defineSchedule`). Pour modifier la règle ou la cible, modifiez le code et redéployez.',
    runs: 'Exécutions',
    noRuns: 'Aucune exécution pour le moment.',
    runsNote:
      'Les exécutions sont listées de la plus récente à la plus ancienne. La configuration de la cible d’une exécution n’est jamais renvoyée ni affichée. Un nombre de tentatives supérieur à 1 signifie que la même exécution a été livrée à nouveau ; elle compte toujours comme une seule exécution.',
  },
  runs: {
    allTasks: 'Toutes les tâches planifiées',
    groups: {
      all: 'Toutes',
      failed: 'Échec · délai dépassé',
      waiting: 'En attente de résultat',
      skipped: 'Ignorées',
      succeeded: 'Réussies',
    },
    ranges: {
      day: 'Dernières 24 heures',
      week: '7 derniers jours',
      month: '30 derniers jours',
      quarter: '90 derniers jours',
    },
    columns: {
      planned: 'Heure prévue',
      task: 'Tâche planifiée',
      result: 'Résultat',
      reason: 'Motif · lié',
      executions: 'Tentatives',
      duration: 'Durée',
      summary: 'Résumé du résultat',
    },
    noRuns: 'Aucune exécution ne correspond à ces filtres.',
    notes: {
      order:
        'Exécutions de toutes les tâches planifiées, de la plus récente à la plus ancienne. Les échecs, les délais dépassés et les longues attentes apparaissent aussi en haut de l’onglet Tâches.',
      removed: 'Les tâches retirées du code conservent ici leur historique.',
    },
  },
  status: {
    pending: 'En file d’attente',
    running: 'En cours',
    waiting: 'En attente de résultat',
    succeeded: 'Réussie',
    failed: 'Échec',
    skipped: 'Ignorée',
    cancelled: 'Annulée',
    timed_out: 'Délai dépassé',
    triggered: 'Déclenchée (ancien enregistrement)',
  },
  reason: {
    'target-missing': 'La cible n’existe pas',
    'target-disabled': 'La cible est désactivée',
    'target-invalid': 'La configuration de la cible est invalide',
    'target-not-found': 'Le type de cible n’est pas enregistré',
    'invalid-config': 'La configuration de la cible est invalide',
    'dispatch-failed': 'Échec au démarrage ; consultez le journal du serveur',
    'observer-failed': 'La vérification du résultat de la cible a échoué',
    'observer-unavailable': 'La cible ne peut pas communiquer son résultat',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: 'Chronologie',
    started: 'Démarrée',
    accepted: 'Acceptée par la cible',
    finished: 'Terminée',
    notYet: 'Pas encore de résultat',
    executions: 'Tentatives',
    target: 'Cible',
    related: 'Lié',
    receipt: 'Accusé de réception',
    summary: 'Résumé du résultat',
    reason: 'Motif',
    waitingNote:
      'Tant qu’une exécution attend son résultat, le planificateur interroge la cible sur son état jusqu’à ce qu’elle signale une réussite, un échec, une annulation ou un délai dépassé. Le planificateur ne fixe lui-même aucun délai ; c’est la cible qui décide. Si une exécution attend longtemps, ouvrez l’élément lié pour suivre sa progression.',
  },
  config: {
    memory:
      'Les tâches planifiées s’exécutent dans la mémoire de cette instance : convient uniquement à une seule instance.',
    memoryHint:
      'Avec une seule instance, rien à changer ; pour en exécuter plusieurs, suivez « Passer à Redis » ci-dessous.',
    shared:
      'Les tâches planifiées s’exécutent sur {{adapter}} : plusieurs instances peuvent les exécuter.',
    columns: {
      setting: 'Paramètre',
      value: 'Valeur actuelle',
      effect: 'Effet sur les tâches planifiées',
      source: 'Source',
    },
    sources: {
      environment: 'Variable d’environnement',
      config: 'config.yml',
      default: 'Par défaut',
      backend: 'Défini par le backend',
    },
    rows: {
      configuration: 'Configuration jobs',
      backend: 'Backend',
      multiInstance: 'Plusieurs instances',
      concurrency: 'Concurrence',
      attempts: 'Tentatives',
      connection: 'Connexion',
    },
    builtIn: 'memory intégrée',
    selectedByScheduler:
      'Choisi par `scheduler.jobs` (`SCHEDULER_JOBS`) pour les seules tâches planifiées.',
    selectedByDefault:
      '`scheduler.jobs` n’est pas défini, donc les tâches planifiées suivent `jobs.default`.',
    selectedByBuiltIn:
      'Ni `scheduler.jobs` ni `jobs.default` ne sont définis, donc la valeur par défaut intégrée s’applique.',
    memoryBackend: 'memory (cette instance)',
    memoryEffect:
      'Les règles résident dans la mémoire de ce processus et sont écrites dans {{path}} lors d’un arrêt normal.',
    sharedEffect:
      'Les règles résident dans {{adapter}}, partagées par toutes les instances.',
    plugin: '{{plugin}} enregistré',
    supported: 'Pris en charge',
    unsupported: 'Non pris en charge',
    multiSupported:
      'Chaque déclenchement s’exécute sur une seule instance ; si une instance plante, une exécution peut parfois être livrée à nouveau.',
    multiUnsupported:
      'Chaque instance exécute chaque tâche planifiée de son côté, donc la même tâche s’exécute plusieurs fois.',
    concurrencyEffect_zero:
      'Jusqu’à {{count}} exécutions à la fois ; les autres attendent leur tour.',
    concurrencyEffect_one:
      'Une exécution à la fois ; une exécution lente fait attendre les autres arrivées à échéance.',
    concurrencyEffect_many:
      'Jusqu’à {{count}} exécutions à la fois ; les autres attendent leur tour.',
    concurrencyEffect_other:
      'Jusqu’à {{count}} exécutions à la fois ; les autres attendent leur tour.',
    attemptsOk: 'Correct',
    attemptsWarn: 'Devrait être 1',
    attemptsEffect:
      'Une exécution échouée est enregistrée comme échec et la tâche s’exécute de nouveau à l’heure suivante ; laissez cette valeur à 1.',
    attemptsWarnEffect:
      'Une exécution échouée est déjà enregistrée, donc une nouvelle tentative de la même exécution n’a aucun effet ; réglez les tentatives sur 1.',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: 'Le mot de passe n’est jamais affiché.',
    redis: {
      title: 'Passer à Redis (pour plusieurs instances)',
      step1:
        'Installez le plugin commercial `@nocobase/app-plugin-jobs-redis` et enregistrez-le sur chaque instance.',
      step2:
        'Ajoutez un backend Redis à `config.yml` et faites-y pointer les tâches planifiées (extrait ci-dessous).',
      step3:
        'Redéployez toutes les instances, puis revenez vérifier que « Plusieurs instances » indique Pris en charge.',
      warning:
        'Si le nom est erroné, si le plugin n’est pas enregistré ou si Redis est injoignable, l’application ne démarre pas ; elle ne se replie jamais sur memory.',
    },
    removed: {
      title: 'Tâches planifiées retirées du code',
      consistent: 'Cohérent, rien à faire.',
      consistentHint:
        'Lorsqu’une tâche planifiée est supprimée du code et déployée, elle apparaît ici avec la marche à suivre pour la nettoyer.',
      warning_one:
        '{{count}} tâche planifiée ne figure plus dans le code de cette version mais n’a pas été nettoyée.',
      warning_many:
        '{{count}} tâches planifiées ne figurent plus dans le code de cette version mais n’ont pas été nettoyées.',
      warning_other:
        '{{count}} tâches planifiées ne figurent plus dans le code de cette version mais n’ont pas été nettoyées.',
      warningHint:
        'Elles ne s’exécutent pas à l’échéance (le journal affiche « A schedule fired that this instance has no definition for »), mais la liste des tâches les affiche comme d’habitude.',
      columns: {
        task: 'Tâche planifiée',
        last: 'Dernière exécution',
        after: 'Après nettoyage',
      },
      after:
        'Marquée « Retirée du code », ne se déclenche plus jamais, historique conservé.',
      neverRan: 'Jamais exécutée',
      how: 'Comment nettoyer',
      howHint:
        'Une fois que toutes les instances exécutent la nouvelle version, lancez ceci une fois sur n’importe quel serveur :',
      why: 'Pourquoi pas automatiquement : pendant un déploiement progressif, l’ancienne et la nouvelle version tournent côte à côte, et un nettoyage automatique pourrait supprimer des tâches que l’ancienne version utilise encore.',
      full: 'Lancez-le uniquement sur un build complet incluant tous les plugins ; sinon, les tâches des plugins non chargés seront aussi marquées comme retirées.',
    },
    readOnly:
      'Cette page est en lecture seule : ces paramètres résident dans la configuration de l’application et prennent effet au redéploiement.',
  },
  cron: {
    everyMinute: 'Toutes les minutes',
    everyMinutes: 'Toutes les {{count}} minutes',
    everyHour: 'Toutes les heures à la minute {{minute}}',
    everyHours: 'Toutes les {{count}} heures',
    daily: 'Tous les jours à {{time}}',
    weekdays: 'Du lundi au vendredi à {{time}}',
    weekly: 'Chaque {{day}} à {{time}}',
    monthly: 'Le {{day}} de chaque mois à {{time}}',
  },
};

export default frFR;
