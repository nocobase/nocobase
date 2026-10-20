import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Exemples de planifications de travaux',
    update: "Règles de démarrage et d'arrêt",
  },
  navigation: {
    group: "Exemple d'emplois",
    jobs: 'Travaux ponctuels',
    schedules: 'Planifications',
  },
  jobs: {
    title: 'Tâches en arrière-plan',
    description:
      "Chaque travail attend dans la file d'attente, puis travaille pendant dix secondes et rapporte 10 % de progression chaque seconde. Les progrès arrivent sur WebSocket pendant que cette page est ouverte.",
    create: 'Créer un travail',
    creating: 'Création…',
    listTitle: 'Vos emplois',
    count: 'Emplois {{count}}',
    empty: "Pas encore d'emplois. Créez-en un pour suivre sa progression.",
    loading: 'Chargement…',
    job: 'Tâche {{id}}',
    createdAt: 'Créé {{time}}',
    attempt: 'Tentative {{attempt}}',
    progress: 'Progrès',
    live: 'En direct',
    offline: 'Reconnexion',
  },
  schedules: {
    title: 'Planifications',
    description:
      "Règles récurrentes sur un ScheduleExecutor. Chaque règle que cette page peut démarrer est définie dans le code, de sorte que son gestionnaire est enregistré avant le démarrage de l'exécuteur – une règle démarrée avant un redémarrage continue de s'exécuter après. Les modifications arrivent sur WebSocket pendant que cette page est ouverte.",
    listTitle: 'Règles',
    loading: 'Chargement…',
    start: 'Démarrer',
    stop: 'Arrêter',
    builtIn: 'Intégré',
    every: 'Tous les {{seconds}}',
    cron: 'Cron {{cron}} (UTC)',
    limit: 'au plus de fois {{limit}}',
    nextRun: 'Prochaine exécution dans les {{seconds}}',
    nextRunDue: 'Prochaine exécution prévue maintenant',
    noNextRun: 'Plus aucune course',
    firings: "{{count}} s'exécute sur cette instance",
    delay: 'a démarré {{ms}} ms en retard',
    noRuns: 'Aucune course pour l’instant.',
    live: 'En direct',
    offline: 'Reconnexion',
    rule: {
      heartbeat: 'Battement de coeur',
      interval: 'Intervalle',
      limited: 'Limité',
      cron: 'Cron',
    },
    ruleDescription: {
      heartbeat:
        "Le plugin écrit cette règle à chaque démarrage et ne l'arrête jamais.",
      interval:
        "Changez l'intervalle pendant l'exécution ; la prochaine exécution est planifiée à partir de la nouvelle.",
      limited:
        'Se termine tout seul après cinq exécutions. Recommencez pour cinq autres.',
      cron: "S'exécute au début de chaque minute.",
    },
    state: {
      active: 'Actif',
      ended: 'Terminé',
      stopped: 'Arrêté',
    },
    outcome: {
      running: 'En cours d’exécution',
      succeeded: 'Réussi',
      failed: 'Échec',
    },
  },
  status: {
    queued: "En file d'attente",
    running: 'En cours d’exécution',
    completed: 'Terminé',
    failed: 'Échec',
  },
};

export default frFR;
