/** The runtimes page's and the "Add runtime" dialog's words, merged into this plugin's locale (`en-US.ts`). */
const runtimesEnUS = {
  runtimes: {
    capacity: {
      actual: 'Last effective slots: {{slots}}',
      online: 'Effective slots · online settings',
      pending: 'Waiting for runner to sync online settings',
      legacy: 'Legacy local slots · upgrade the application server',
      upgrade: 'Sync status unavailable · upgrade the runner',
      lastReported: 'Last reported: {{time}}',
    },
    quota: {
      workspaceStatus: {
        active: 'Work continues',
        ended: 'Ended · cleanup allowed',
        checks: 'Ended · checks pending',
        inUse: 'Retained: in use',
        changed: 'Retained: reused',
        trackedChanges: 'Retained: uncommitted files',
        unpushed: 'Retained: unpushed work',
        missingEvidence: 'Retained: verification needed',
        gitFailed: 'Retained: Git check failed',
        runNotFound: 'Retained: run not found',
        ownershipUnknown: 'Retained: owner unverified',
        ambiguousSubject: 'Retained: ambiguous task',
        bindingUnavailable: 'Retained: binding unavailable',
        subjectUnknown: 'Retained: task unknown',
        unknown: 'Retained: unverified',
      },
      usageLimit: 'Usage limit',
      shortReset: 'resets {{time}}',
      shortUnknown: 'reset unknown',
      automatic: 'Clears by itself at the reset.',
      since: 'since {{time}}',
      marks_one: '{{count}} quota mark',
      marks_other: '{{count}} quota marks',
      queueHint:
        'An agent at quota can still be selected. Work will queue with its existing waiting deadline.',
      partial: 'Runs on {{available}} · {{blocked}} at quota',

      workspaceSize: 'Workspace size: {{value}}',
      providers_one: '{{count}} provider at quota',
      providers_other: '{{count}} providers at quota',
      runColumns: {
        issue: 'Issue / conversation',
        agent: 'Agent',
        status: 'Status',
        started: 'Started',
        duration: 'Duration',
      },
      filter: {
        all: 'All',
        active: 'Active',
        retained: 'Retained',
        ended: 'Ended',
      },
      columns: {
        directory: 'Directory / task',
        type: 'Type',
        size: 'Size',
        push: 'Push state',
        status: 'Status',
        lastUsed: 'Last used',
      },
      previous: 'Previous',
      next: 'Next',
      working: 'Working',
      readOnly: 'Read-only copy',
      clean: 'Clean',
      unpushed: 'Unpushed',
      overview: 'Overview',
      workspaces: 'Workspaces',
      runs: 'Runs',
      title: 'Quota',
      reached: 'Quota reached',
      unknown: 'Reset time unknown',
      resets: 'Resets {{time}}',
      near: 'Near limit',
      clear: 'Clear',
      clearMark: 'Clear mark',
      confirm: 'Clear this mark? {{target}} gets work again.',
      observed: 'Last reported {{time}}',
      usedPercent: '{{percent}}% used',
      ok: 'OK',
      hint: 'Known reset times restore eligibility automatically. For unknown resets, restore the quota and clear the mark. Only the runtime owner and administrators can clear marks.',
    },
    workspaces: {
      paused:
        'New work is paused until disk space recovers. Existing runs continue.',
      working: 'Type: Working directory',
      readOnly: 'Type: Read-only copy',
      size: 'Size: {{value}}',
      pushed: 'Push state: Clean, no unpushed work',
      unpushed: 'Push state: Uncommitted, unpushed or unverified work',
      notApplicable: 'Push state: Not applicable',
      title: 'Workspace diagnostics',
      low: 'Low disk space',
      previousLow: 'Last report: low disk space',
      notReported: 'No workspace report received yet',
      diskUnknown: 'Disk space could not be measured',
      thresholdOff: 'No minimum free space warning configured',
      free: 'Free space: {{value}}',
      threshold: 'Minimum free space: {{value}}',
      reportedAt: 'Last reported: {{time}}',
      stale:
        'These are previous readings; current disk space is not confirmed.',
      empty: 'No working directories in the latest report',
      ended: 'Ended',
      active: 'Work continues',
      unknown: 'Cannot confirm whether work ended',
      oldRunner: 'This runner has not provided diagnostic reasons',
      noCleanup: 'Local cleanup result has not been received',
      discardsUntracked: 'Cleanup will discard untracked files',
      decision: {
        settled: 'Work ended; local cleanup checks are required',
        active: 'Work continues',
        runNotFound: 'Cannot confirm: run not found',
        ownershipUnknown:
          'Cannot confirm: runner ownership could not be verified',
        ambiguousSubject: 'Cannot confirm: ambiguous subject key',
        bindingUnavailable:
          'Cannot confirm: application has no workspace binding',
        subjectUnknown:
          'Cannot confirm: application could not resolve the subject',
      },
      cleanup: {
        allowed: 'Ended; cleanup allowed',
        inUse: 'Retained: directory is in use',
        changed: 'Retained: directory has been reused',
        trackedChanges: 'Retained: tracked files have uncommitted changes',
        unpushed:
          'Retained: unpushed commits or insufficient local commit objects',
        missingEvidence: 'Retained: insufficient commit evidence',
        gitFailed: 'Retained: Git check failed',
      },
    },
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
      low_disk: 'Low disk space {{active}}/{{slots}}',
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
    variables: {
      title: 'Variables from this machine',
      description:
        'The variables it provides to runs that take them from the runtime, by name; the values stay on the machine. Set one there with `nocobase-runner env set NAME`, or pass it with `--pass-env NAME`.',
      none: 'None: a run that takes a variable from the runtime fails here before it starts.',
      unknown:
        'Not reported: its runner is older than this feature. Update the runner to see them.',
    },
    jobs: {
      allow: 'Allow build jobs',
      hint: 'Builds and other steps this application configures, run without a model. This runtime reports: {{kinds}}.',
      unsupported:
        'This runtime’s runner does not take jobs. Update the runner to turn this on.',
    },
    pathHint:
      'The runner finds coding tools using its own PATH. In a terminal where which codex / which claude works, run nocobase-runner service install again and restart the service (or run nocobase-runner start again) so it gets the correct PATH.',
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
        'Only selected tools are detected and offered work. Switches and limits are saved with “Save”.',
      version: 'Runner {{version}}',
      runs: 'Recent runs',
      runsEmpty: 'No runs yet.',
      runsFailed: 'Could not load its runs.',
      readOnly: 'Only its owner can change it.',
      owner: 'Owner {{name}}',
    },
    status: {
      updatePending: 'Runner waiting for update',
      pruning: 'Runner cleaning shared store',
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
      checking: 'Waiting for detection',
      failed: 'Detection failed',
      redetect: 'Detect again',
      notProvided: 'Not provided',
      signedIn: 'Signed in',
      signedOut: 'Login required',
      notInstalled: 'Not installed',
      off: 'Off',
      offHint: 'Off: work for this tool is not sent to this runtime.',
      enableLabel: 'Run {{tool}} on {{name}}',
      version: 'Version {{version}}',
    },
    trust: {
      isolationHint:
        'For both personal and shared runtimes, run the runner in a VM or isolated environment: agents have full access, and the runner is not a sandbox.',
      label: 'Usage scope',
      team: 'Shared',
      teamHint:
        'Runs tasks started by any user and receives their variables and secrets.',
      ownerOnly: 'Personal',
      ownerOnlyHint:
        'Runs only tasks started by its owner. Runtimes you add are personal by default.',
      personalOnly:
        'This runtime will be personal: it runs only tasks started by its owner. You can share it with all users later.',
    },
    share: {
      title: 'Share {{name}} with all users?',
      description:
        'Other people’s runs will run on this runtime, with their variables and secrets, and can read what is on it. Share it only if that is fine.',
      confirm: 'Share with all users',
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
      'Choose the coding tools and usage scope, then set up the runner on the target machine.',
    createCredential: 'Generate install command',
    advanced: 'Advanced: limits per coding tool',
    run: "Run this on that host. It downloads the runner (nocobase-runner) and this application's CLI from this application, registers the runner and starts it at login:",
    nodeRequired:
      'The host needs Node.js 24 or newer (check with node --version). The command stops and says how to install it when it is missing.',
    installed: 'Already have nocobase-runner installed? Register it instead:',
    prompt: 'Prompt',
    manual: 'Manual',
    promptHint:
      'Copy the full prompt below to an agent (Claude Code, Codex, etc.) on the target machine. On small screens, scroll the dialog to read every step. It includes a one-time credential; share it only with that agent.',
    windowsPowerShell:
      '1. Install WSL: run in PowerShell, then restart Windows:',
    windowsUbuntu:
      '2. Open Ubuntu and run the Linux command below. Install Node.js and coding tools inside WSL Ubuntu.',
    windowsNetwork:
      'If WSL cannot access the internet, enable mirrored networking in WSL.',
    promptWindows:
      'FIRST, determine whether you are running inside WSL Ubuntu. If you are NOT in WSL Ubuntu, STOP: do not run any installation or registration commands. Tell the user to run wsl --install in PowerShell, restart Windows, then open the agent inside WSL Ubuntu and run this prompt again. Continue with the steps below ONLY inside WSL Ubuntu. Install both Node.js and the coding tools inside WSL. If WSL cannot access the internet, enable mirrored networking.\n\n',
    promptBody:
      'Set up this machine as a NocoBase runner. Use a VM or isolated environment: agents have full access and the runner is not a sandbox.\n\nCheck Node.js 24 or newer and that these coding tools are installed and signed in: {{tools}}. Use their official installation methods, not snap packages.\n\nRun this one-time registration command to install the runner and application CLI, register it, and install its background service:\n{{command}}\n\nResolve common setup problems: ensure the service PATH contains the coding tools (check which codex / which claude in the installation terminal, then run nocobase-runner service install again and restart the service); configure any required proxy for downloads and for the service; resolve npm global install permissions using a user-owned prefix or a Node version manager, without sudo npm install.\n\nFinish with nocobase-runner status and confirm the connection and coding tools. Report any remaining login or network steps for me to complete. Treat the registration credential as a secret and do not include it in your report.',
    tokenOnce:
      'The command carries a one-time credential for a "{{trust}}" runtime. It works once, until {{time}}.',
    after:
      'Within seconds the runtime appears in the list, with each coding tool it found…',
    tokenTools: 'Coding tools: {{tools}}.',
    tools: 'Coding tools',
    toolsHint:
      'Only checked tools are detected and offered work. You can change it on the Runtimes page at any time.',
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
