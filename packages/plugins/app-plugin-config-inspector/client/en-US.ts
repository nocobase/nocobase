const resource = {
  configInspector: {
    title: 'Application configuration',
    lead: 'Read only. See the settings the application runs with, where each one comes from and config.yml with credentials masked. To change a setting, edit config.yml or the environment and reload.',
    refresh: 'Refresh',
    retry: 'Retry',
    error: 'Unable to load the application configuration.',
    facts: {
      file: 'Configuration file',
      noFile: 'Not found, defaults apply',
      loadedAt: 'Last loaded',
      reloads: 'Reloaded {{count}} times',
      customized: 'Differs from the example',
      customizedCount: '{{count}} settings',
      sources: 'Value sources',
    },
    views: {
      label: 'View',
      modules: 'By module',
      variables: 'Environment',
      file: 'Full config.yml',
    },
    leads: {
      modules: 'Browse by module. All three views show the same configuration.',
      variables: 'Environment variables take precedence over config.yml.',
      file: 'The current config.yml, with credentials replaced by ••••••.',
    },
    search: 'Search settings, paths or variables',
    onlyCustomized: 'Changed only ({{count}})',
    noMatch: 'No matching settings.',
    customized: 'Differs from the example',
    configured: 'Configured',
    notSet: 'Not set',
    notEnabled: 'Not enabled',
    notConfigured: 'Not configured',
    firstStartOnly: 'First installation only',
    fromEnvironment: 'Environment {{count}}',
    overrides: 'Overrides the file value',
    emptyModule: 'Neither config.yml nor the code defaults have this section.',
    source: {
      file: 'Config file',
      environment: 'Environment',
      default: 'Default',
      unknown: 'Other source',
    },
    legend: {
      customized: 'Differs from the version example',
      file: 'Read from config.yml',
      environment: 'Set or overridden by the environment',
      default: 'Not configured, the code default applies',
    },
    variables: {
      lead: 'Environment variables the application declares. Credentials only show whether they are set.',
      set: 'Set ({{count}})',
      all: 'All ({{count}})',
      name: 'Variable',
      path: 'Setting',
      value: 'Value',
      state: 'State',
      none: 'No environment variable is set.',
      isSet: 'Set',
    },
    file: {
      unchanged: '… {{count}} lines match the example',
      compare: 'Compare with example',
      full: 'Full file',
      envNote:
        'Environment variables override the same settings in the file; "By module" shows the values in effect.',
      missing:
        'The application read no configuration file; every setting comes from the environment and code defaults.',
      tooLarge:
        'The file is too long to compare with the example line by line; it is shown in full.',
      noExample: 'The application ships no config.example.yml to compare with.',
    },
    groups: {
      basics: 'Basics',
      accounts: 'Accounts and messaging',
      data: 'Database',
      storage: 'File storage',
      apiLogging: 'API and logging',
      scaling: 'Multiple replicas',
      scalingHint: 'Only needed when the application runs several replicas',
      other: 'Other',
      otherHint:
        'The remaining sections of the example, described by its comments',
    },
    modules: {
      appearance: {
        title: 'Appearance and language',
        description: 'Title, default color scheme and default language.',
      },
      access: {
        title: 'Address',
        description: 'Public origin, server port and base path.',
      },
      mailers: {
        title: 'Outgoing mail',
        description:
          'The sender shared by sign-in, user invitations and email notification channels. Configuring a sender does not create a notification channel.',
      },
      notification: {
        title: 'Notification channels',
        description: 'Where notifications go.',
      },
      auth: {
        title: 'Sign-in and sessions',
        description: 'How users sign in to the application.',
      },
      initialAdmin: {
        title: 'Initial administrator',
        description:
          'Created only when the user table is empty at the first installation; later changes do not reset the account.',
      },
      secrets: {
        title: 'Secrets',
        description:
          'Master keys that encrypt stored credentials and derive the sign-in and session keys.',
      },
      mail: {
        title: 'Incoming mail',
        description:
          'Mailbox sync interval, OAuth callbacks and push settings.',
      },
      database: {
        title: 'Database',
        description:
          'Where application data is stored and whether migrations run at startup.',
      },
      snowflake: {
        title: 'Snowflake IDs',
        description:
          'Each concurrently running instance needs a unique workerId.',
      },
      storage: {
        title: 'File storage',
        description: 'Where uploaded attachments and files are stored.',
      },
      logging: {
        title: 'Logging',
        description: 'Log level, file and console output.',
      },
      api: {
        title: 'API limits',
        description:
          'Limits every /api request meets before its route; all off by default.',
      },
      jobs: {
        title: 'Background jobs',
        description:
          'Background and scheduled jobs. Without configuration they run in memory, for a single process only.',
      },
      cache: { title: 'Cache', description: 'Where cached data is kept.' },
      concurrency: {
        title: 'Locks',
        description:
          'Keeps several processes from handling the same thing at once.',
      },
      queue: {
        title: 'Message queue',
        description: 'Events and tasks passed between processes.',
      },
      realtime: {
        title: 'Realtime',
        description: 'How live page updates travel between processes.',
      },
    },
  },
};
export default resource;
