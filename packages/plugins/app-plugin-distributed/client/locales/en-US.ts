import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    title: 'Cluster and distributed',
    description:
      'Which backends this instance uses, and whether the application can run on several instances.',
  },
  page: {
    description:
      'To run on several servers or processes, caching, locks, background jobs, queues, realtime messages and ID generation must use shared backends. This page shows the backends this instance actually selected and where each setting comes from, and checks whether the application can safely run on several instances. Settings live in the application configuration; redeploy after changing them.',
    loading: 'Loading…',
    loadFailed: 'The status could not be loaded.',
    retry: 'Retry',
  },
  summary: {
    single: 'Single instance',
    singleCaption: 'The current configuration fits one instance',
    shared: '{{shared}} / {{total}}',
    sharedCaption: 'services shared',
    requiredCaption: 'must be fixed',
    recommendedCaption: 'recommended',
  },
  sections: {
    scale: 'Can it run on several instances',
    services: 'Shared services',
    idGeneration: 'ID generation',
    checklist: 'Before going live',
    notes: 'Notes',
  },
  level: {
    required: 'Must fix',
    recommended: 'Recommended',
    ok: 'OK',
  },
  singleHint:
    'Running one instance needs no change. To scale out: prepare Redis and a shared PostgreSQL or MySQL database → install the Redis plugins you need → change the configuration → verify with two instances.',
  fix: 'How to fix',
  table: {
    service: 'Service',
    backend: 'Selected backend',
    sharing: 'Scope',
    plugin: 'Redis plugin',
    source: 'Source',
    adapter: 'Adapter',
  },
  services: {
    caching: {
      name: 'Caching',
      usage: 'Sign-in state, permissions, configuration cache',
    },
    concurrency: {
      name: 'Concurrency locks',
      usage: 'Migrations, numbering, idempotency',
    },
    jobs: {
      name: 'Background jobs',
      usage: 'Scheduled tasks, knowledge indexing',
    },
    queue: { name: 'Queue', usage: 'Notification delivery' },
    realtime: { name: 'Realtime messages', usage: 'Inbox, presence' },
  },
  sharing: {
    shared: 'Shared between instances',
    local: 'This instance only',
    unknown: 'Not declared',
  },
  source: { configured: 'Configured', default: 'Default' },
  notSet: '(not set)',
  unavailable: 'Not used by this application',
  unregistered: 'Adapter not registered',
  selections: 'Chosen by name',
  selection: '{{consumer}} → {{backend}}',
  howToChange: 'How to change',
  howToChangeIntro:
    'Install the Redis plugin of each service, register its server plugin, then select it in the configuration:',
  idGeneration: {
    mode: 'Mode',
    modeHint:
      'With several instances, assign worker IDs automatically so every instance takes its own.',
    auto: 'Automatic · one worker ID per instance',
    manual: 'Manual · workerId {{workerId}}',
  },
  checklist: {
    intro:
      'The page cannot check these by itself. Confirm them by acting on two instances:',
    files: 'A file uploaded on instance A can be downloaded from instance B',
    realtime:
      'A message produced on A reaches a user connected to B in real time, and nothing is lost after reconnecting',
    queue:
      'A task queued on A can be processed by B, and retries do not repeat side effects',
    secrets:
      'Every instance uses the same secrets.keys, and sign-in works across instances',
    websocket:
      'The load balancer forwards WebSocket connections and matches the application’s path and domain',
  },
  notes: {
    current:
      'This page shows only the instance you are connected to. It cannot tell whether other instances are configured the same way; deploy them from one configuration.',
    noTest:
      'There is no “Test connection”: Redis plugins connect when the application starts, and the application does not start when they cannot. Connection errors while running appear in the logs.',
    instances:
      'A list of running instances appears only with automatic worker IDs, provided by a commercial plugin.',
  },
  checks: {
    database: {
      sqlite: {
        title: 'Database',
        detail:
          'SQLite serves one instance only. Several instances need PostgreSQL or MySQL.',
        fix: 'Move the data to PostgreSQL or MySQL and point the main database connection at it.',
      },
      shared: {
        title: 'Database',
        detail: '{{dialect}}: every instance connects to the same database.',
      },
    },
    service: {
      unregistered: {
        title: '{{service}}',
        detail:
          '{{configPath}} selects the adapter “{{adapter}}”, which no registered plugin provides. The service fails when it is first used.',
        fix: 'Install and register the plugin that provides “{{adapter}}”, or select another backend.',
      },
      local: {
        title: '{{service}} is still local to this instance',
        detail:
          'Each instance keeps its own state. Install {{plugin}} and set {{configPath}} to a Redis backend.',
        fix: 'Install {{plugin}}, register its server plugin, and select it:',
      },
      selectionLocal: {
        title: '{{service}}',
        detail:
          '{{consumer}} explicitly uses the backend “{{backend}}”, which is local to this instance.',
      },
    },
    services: {
      local: {
        title: 'Caching, locks, background jobs, queue, realtime messages',
        detail: 'All local to this instance: {{services}}.',
      },
    },
    files: {
      local: {
        title: 'File storage',
        detail:
          'Files in {{collections}} are on this host’s disk; other instances cannot read them.',
        fix: 'Use a shared disk such as S3 for these file collections, and move their existing files there.',
      },
      defaultLocal: {
        title: 'File storage',
        detail:
          'The default disk stores files on this host’s disk; other instances cannot read them.',
        fix: 'Set the default disk to a shared one such as S3.',
      },
      shared: {
        title: 'File storage',
        detail: 'No file collection keeps files on this host’s disk.',
      },
    },
    idGeneration: {
      auto: {
        title: 'ID generation',
        detail:
          'Assigned automatically: every instance takes its own worker ID.',
      },
      manual: {
        title: 'ID generation',
        detail:
          'Manual worker ID {{workerId}}. Two instances with the same worker ID can generate the same IDs.',
        fix: 'Give every instance its own SNOWFLAKE_WORKER_ID, or install a plugin that assigns worker IDs automatically.',
      },
    },
    secrets: {
      set: {
        title: 'Secrets',
        detail:
          'secrets.keys is set. Make sure every instance uses the same keys.',
      },
      missing: {
        title: 'Secrets',
        detail:
          'secrets.keys is not set. Every instance needs the same keys to read what the others encrypt.',
        fix: 'Generate a key with openssl rand -hex 32 and set it on every instance.',
      },
    },
    publicOrigin: {
      set: { title: 'Public address', detail: 'app.publicOrigin = {{origin}}' },
      missing: {
        title: 'Public address',
        detail:
          'app.publicOrigin is not set. Behind a load balancer, links and callbacks need the public address.',
        fix: 'Set app.publicOrigin to the address users open.',
      },
    },
    checkFailed: {
      title: 'A check could not run',
      detail: 'The check “{{check}}” failed; see the logs.',
    },
  },
};

export type DistributedResource = LocaleResource<typeof enUS>;
export default enUS;
