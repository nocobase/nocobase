/** The runtimes page's and the "Add runtime" dialog's words, merged into this plugin's locale (`en-US.ts`). */
const runtimesEnUS = {
  runtimes: {
    title: 'Runtimes',
    description:
      'The runtimes that run agents, and the coding tools each one reported.',
    add: 'Add runtime',
    loadFailed: 'Could not load the runtimes',
    emptyTitle: 'No runtimes connected yet',
    emptyDescription:
      'Once a runtime is connected, runner agents take on work there with its coding tools.',
    noneConnected: 'No runtime is connected.',
    revokedList_one: '{{count}} revoked runtime',
    revokedList_other: '{{count}} revoked runtimes',
    lastSeen: 'Last seen {{time}}',
    activity: {
      online: 'Online {{active}}/{{slots}}',
      busy: 'Busy {{active}}/{{slots}}',
      offline: 'Offline · {{time}}',
      offlineNever: 'Offline',
    },
    toolUsage: {
      label: 'Runs by coding tool',
      item: '{{tool}} {{used}}/{{limit}}',
    },
    toolSlots: {
      label: 'Limits per coding tool',
      hint: 'How many runs of each coding tool it takes at once, such as fewer for a tool whose subscription allows fewer sessions. Leave one empty to bound it by the concurrent runs only.',
      none: 'No limit',
      invalid: 'Enter whole numbers from 1 to 64, or leave them empty.',
      inputLabel: 'Runs of {{tool}} at once',
      overTotal:
        'The limit of {{tools}} is above the max concurrent runs ({{slots}}): at most {{slots}} run at once.',
      noneChecked: 'Check a coding tool above to limit it.',
    },
    toolTable: {
      tool: 'Tool',
      enabled: 'On',
      state: 'Status',
      limit: 'At once',
      active: 'Running',
    },
    policy: {
      title: 'Local policy',
      description:
        'What the runtime’s owner lets it take, as it reported. It is changed on the machine, not here.',
      none: 'No local policy: it takes any work it is registered for.',
      any: 'Any',
      nothing: 'None',
      agents: 'Agents',
      subjects: 'Subjects',
      repos: 'Repositories',
    },
    jobs: {
      allow: 'Allow build jobs',
      hint: 'Builds and other steps this application configures, run without a model. This runtime reports: {{kinds}}.',
      unsupported:
        'This runtime’s runner does not take jobs. Update the runner to turn this on.',
    },
    noTools: 'No coding tool found',
    actionsFor: 'Actions for {{name}}',
    columns: {
      name: 'Name',
      status: 'Status',
      tools: 'Tools',
      sharing: 'Sharing',
      version: 'Runner',
      lastSeen: 'Last seen',
      slots: 'Max concurrent runs',
    },
    detail: {
      general: 'General',
      tools: 'Tools',
      toolsDescription:
        'The coding tools it reported. Work for a tool that is off is not sent here. Switches and limits are saved with “Save”.',
      version: 'Runner {{version}}',
      runs: 'Recent runs',
      runsEmpty: 'No runs yet.',
      runsFailed: 'Could not load its runs.',
      readOnly: 'Only its owner or a manager of runtimes can change it.',
      owner: 'Owner {{name}}',
    },
    status: {
      online: 'Online',
      offline: 'Offline',
      revoked: 'Revoked',
      upgrade_required: 'Upgrade required',
    },
    upgradeRequired: {
      title: 'This runtime needs an upgrade',
      older:
        'Its runner {{version}} speaks agent protocol {{protocol}}; this application needs protocol {{required}}. It stays connected but runs nothing until it is updated.',
      newer:
        'Its runner {{version}} speaks agent protocol {{protocol}}, newer than this application (protocol {{required}}). It stays connected but runs nothing until it runs a runner this application serves.',
      latest:
        'This application serves runner {{latest}}. Run this on its host to update it:',
      noLatest:
        'Install a runner that speaks protocol {{required}}, or run this on its host to update it:',
      reinstall:
        'Its runner does not say how it was installed. Install it again on its host with the command from Add runtime.',
    },
    tool: {
      signedIn: 'Signed in',
      signedOut: 'Not signed in',
      notInstalled: 'Not installed',
      off: 'Off',
      offHint: 'Off: work for this tool is not sent to this runtime.',
      enableLabel: 'Run {{tool}} on {{name}}',
      version: 'Version {{version}}',
    },
    trust: {
      label: 'Who it works for',
      team: 'Team',
      teamHint:
        'Runs work anyone on the team starts, with their variables and secrets. For shared servers and VMs.',
      ownerOnly: 'Personal',
      ownerOnlyHint:
        'Runs only the work you start. The default for a runtime you add.',
      personalOnly:
        'This runtime will be personal: it runs only the work you start. You can share it with the team later.',
    },
    share: {
      title: 'Share {{name}} with the team?',
      description:
        'Other people’s runs will run on this runtime, with their variables and secrets, and can read what is on it. Share it only if that is fine.',
      confirm: 'Share with team',
    },
    edit: {
      button: 'Edit',
      title: 'Edit {{name}}',
      name: 'Name',
      nameRequired: 'Enter a name.',
      slotsHint: 'How many runs the runtime takes at once.',
      slotsInvalid: 'Enter a whole number from 1 to 64.',
      saved: 'Saved {{name}}',
    },
    upgrade: {
      show: 'Version {{version}}: a newer runner is available',
      available: 'Update available',
      badge: 'Upgradable',
      title: 'A newer runner for {{name}}',
      description: 'Installed {{version}}, this application serves {{latest}}.',
      hint: 'It updates itself once no agent is running. To update it now, run this on its host.',
    },
    revoke: {
      title: 'Revoke the credential of {{name}}?',
      description:
        'Its runner stops at its next request and its runs go back to the queue. To connect it again, add the runtime again.',
      confirm: 'Revoke',
      done: 'Revoked the credential of {{name}}',
    },
    delete: {
      title: 'Delete {{name}}?',
      description:
        'The revoked runtime is removed from the list. Its past runs stay.',
      confirm: 'Delete',
      done: 'Deleted {{name}}',
    },
  },
  connect: {
    title: 'Add runtime',
    description:
      'Run the command below on a host that has a coding tool installed: a server, a VM or your own device.',
    createCredential: 'Generate install command',
    advanced: 'Advanced: limits per coding tool',
    run: "Run this on that host. It downloads the runner (nocobase-runner) and this application's CLI from this application (no Node.js needed), registers the runner and starts it at login:",
    installed: 'Already have nocobase-runner installed? Register it instead:',
    unsupported:
      'The runner does not run on Windows yet. Use macOS or Linux, or WSL.',
    tokenOnce:
      'The command carries a one-time credential for a "{{trust}}" runtime. It works once, until {{time}}.',
    after:
      'Within seconds the runtime appears in the list, with each coding tool it found…',
    tokenTools: 'Coding tools: {{tools}}.',
    tools: 'Coding tools',
    toolsHint:
      'This runtime is offered work only for the checked tools. You can change it on the Runtimes page at any time.',
    toolsRequired: 'Choose at least one coding tool.',
    slots: 'Max concurrent runs',
    slotsHint:
      'How many runs the runtime takes at once. You can change it on the Runtimes page at any time.',
    tokenSlots: 'Max concurrent runs: {{slots}}.',
    tokenToolSlots: 'Per coding tool: {{limits}}.',
    connected: '{{name}} is connected.',
    done: 'Done',
    system: {
      macos: 'macOS',
      linux: 'Linux',
      windows: 'Windows',
    },
  },
};

export type RuntimesLocale = typeof runtimesEnUS;

export default runtimesEnUS;
