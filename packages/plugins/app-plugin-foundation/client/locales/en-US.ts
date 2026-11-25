const enUS = {
  nav: {
    plugins: 'Plugins',
    pluginsDescription:
      'The plugins this application uses, their versions, and how to enable the rest.',
  },
  access: {
    section: 'System',
    settings: { plugins: 'Plugins' },
    actions: { read: 'View' },
  },
  page: {
    title: 'Plugins',
    description:
      'Which plugins this application uses. Enabling or disabling one changes the application’s code and takes effect after a restart, so this page gives the commands to run rather than switches.',
    deployed:
      'To enable a plugin, register it in the source project and redeploy the application.',
    attention_one: '{{count}} plugin needs attention and is listed first.',
    attention_other: '{{count}} plugins need attention and are listed first.',
    search: 'Search by name or package',
    loading: 'Loading plugins…',
    loadFailed: 'The plugins could not be loaded.',
    retry: 'Try again',
    empty: 'No plugins match.',
  },
  filters: {
    label: 'Show',
    all: 'All {{count}}',
    enabled: 'Enabled {{count}}',
    disabled: 'Not enabled {{count}}',
    attention: 'Needs attention {{count}}',
  },
  columns: {
    plugin: 'Plugin',
    version: 'Version',
    status: 'Status',
    actions: 'Actions',
  },
  groups: {
    enabled: 'Enabled {{count}}',
    disabled: 'Not enabled {{count}}',
  },
  status: {
    enabled: 'Enabled',
    skillsOnly: 'Enabled · Skills only',
    enabledAttention: 'Enabled · Needs attention',
    disabled: 'Not enabled',
    disabledAttention: 'Not enabled · Needs attention',
    unknown: "Can't tell · Rebuild",
  },
  reasons: {
    partial:
      'Only partly enabled: its pages open, but their data does not load. Run the enable command again to fix it.',
    devDependency:
      'Enabled, but not included when the application is deployed, so the live application will be missing it. Run the enable command again to fix it.',
    missingRequires: '“{{title}}” needs {{names}}, which is not enabled.',
    other:
      'Not set up completely in this application. Run the enable command again to fix it.',
    requiresFirst: 'Enable first: {{names}} (the enable command includes it)',
    unknown:
      "This application was built before the build recorded which command-line plugins it registers, so whether this one is enabled can't be told here. Run pnpm build again and redeploy to see it.",
  },
  actions: {
    commands: 'Commands',
    commandsFor: 'Commands for {{title}}',
    enable: 'How to enable',
    enableFor: 'How to enable {{title}}',
  },
  commands: {
    title: 'Commands for {{title}}',
    description:
      'Run in the application’s code directory, then restart it; for the live application, build and deploy again.',
    fix: 'Fixes what needs attention',
    update: 'Updates to the newest version',
    unregister: 'Disables it; its data is kept',
    dependents:
      'Enabled plugins that depend on it: {{names}}. Disable them together with it.',
    noDependents:
      'No enabled plugin depends on it, so it can be disabled on its own.',
    optionalDependents:
      'Enabled plugins that use it optionally: {{names}}. They keep working without it but lose the features that need it.',
  },
  enable: {
    title: 'Enable {{title}}',
    description: 'Run in the application’s code directory:',
    requires:
      '{{title}} depends on {{names}}, which is not enabled yet either; the command includes it.',
    development:
      'Local development: restart pnpm dev after running it, then refresh this page to see it enabled.',
    live: 'Live application: commit the change, run pnpm build --tar, and upgrade with the installer.',
    data: 'Its first start creates its tables. Disabling it later with plugin unregister keeps its data.',
  },
  dialog: {
    copy: 'Copy command',
    copied: 'Copied',
    copyFailed: 'Copying failed; select the command and copy it.',
    close: 'Got it',
  },
};

export type FoundationResource = typeof enUS;

export default enUS;
