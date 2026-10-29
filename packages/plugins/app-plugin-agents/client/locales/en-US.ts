import type { LocaleResource } from '@nocobase/i18n';

import accessEnUS from '../../shared/locales/access.en-US.js';
import chatEnUS from './chat.en-US.js';
import pricesEnUS from './prices.en-US.js';
import skillsEnUS from './skills.en-US.js';
import servicesEnUS from './services.en-US.js';
import runtimesEnUS from './runtimes.en-US.js';
import runWaitEnUS from './runWait.en-US.js';

const pages = {
  modelSuggestions: {
    design:
      'Strongest reasoning: proposals, architecture, hard investigations and reviews of important changes; also routine implementation, cross-package changes and writing proposals.',
    large:
      'Larger implementations, cross-package changes, refactoring and routine implementation; also proposals, code review and small changes.',
    review:
      'Code review and analysis of CI failures; also proposals and hard investigations.',
    routine:
      'Routine implementation, small fixes, tests and wording; also analysis of CI failures.',
    small:
      'Small changes, mechanical edits and tests, cheap and fast; also analysis of CI failures.',
    explanation:
      'Understanding requirements, explanations and writing proposals.',
  },
  goodAtTemplates: {
    label: 'Templates',
    design: 'Design and review',
    large: 'Larger implementation',
    review: 'Code review and CI',
    routine: 'Routine implementation',
    small: 'Small changes',
    explanation: 'Explanation and proposals',
    replaceTitle: 'Replace the current description?',
    replaceHint:
      'Your current text will be replaced by the selected template. You can edit it afterwards.',
    replace: 'Replace',
  },

  actions: {
    back: 'Back',
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
  },
  common: {
    refresh: 'Refresh',
    cancel: 'Cancel',
    copy: 'Copy',
    copied: 'Copied',
    save: 'Save',
    close: 'Close',
    create: 'Create',
    createNamed: 'Create "{{name}}"',
    creating: 'Creating…',
    noOptions: 'No options',
    forbidden: 'You are not allowed to do this.',
    loading: 'Loading',
    notFound: 'It no longer exists.',
    requestFailed: 'The request failed. Try again.',
    retry: 'Retry',
    secretKept: 'Set — leave empty to keep it',
  },
  status: { loading: 'Loading' },
  unsavedChanges: {
    description: 'What you entered has not been submitted and will be lost.',
    discard: 'Discard',
    keepEditing: 'Keep editing',
    title: 'Discard unsaved changes?',
  },
  errors: {
    boundRunnerIncompatible:
      'This runner cannot run the selected Agent. Switch runner or start a new conversation.',
    CONFLICT: 'It changed in the meantime. Reload and try again.',
    REVISION_CONFLICT: 'It changed in the meantime. Reload and try again.',
    FORBIDDEN: 'You are not allowed to do this.',
    AGENT_NOT_FOUND: 'It no longer exists.',
    RUN_NOT_FOUND: 'It no longer exists.',
    SKILL_NOT_FOUND: 'It no longer exists.',
    SKILL_VERSION_NOT_FOUND: 'It no longer exists.',
    CONVERSATION_NOT_FOUND: 'It no longer exists.',
    RUNNER_NOT_FOUND: 'It no longer exists.',
    VARIABLE_NOT_FOUND: 'It no longer exists.',
    MODEL_SERVICE_NOT_FOUND: 'It no longer exists.',
    SCOPE_NOT_FOUND: 'It no longer exists.',
    INVALID_INPUT: 'Some values are not valid.',
    SECRETS_KEY_MISSING:
      'Variables cannot be saved or shown: the server has no secrets key. Ask an administrator to set secrets.keys in the application configuration.',
  },
  command: {
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Could not copy. Select the text and copy it yourself.',
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
  },
  agents: {
    unavailableNow: 'Unavailable now',
    title: 'Agents',
    description:
      'Add agents from the models runners report. The Lead Agent hands each step of an issue to the agent whose description fits it.',
    fromRunners: 'Agents from runners',
    display: {
      search: 'Search models or providers',
      select: 'Select {{name}}',
      showDisabled: 'Show disabled',
      hideDisabled: 'Hide disabled',
    },
    filterLabel: 'Show agents',
    filters: {
      all: 'All {{count}}',
      enabled: 'Enabled {{count}}',
      unreported: 'No runner {{count}}',
    },
    loadFailed: 'Could not load the agents',
    loadMore: 'Load more',
    emptyTitle: 'No agents yet',
    emptyDescription:
      'Connect a runner with a coding tool signed in, then add an agent from Available models.',
    noneInFilter: 'No agent here.',
    howToAdd:
      'To add an agent, install a coding tool on a runner and sign in to a model you may use: once the runner reports it, add it from Available models by writing what it is good at. An agent only personal runners have works only on issues their owners start.',
    goodAtMissing: 'Not written yet',
    columns: {
      agent: 'Agent',
      goodAt: 'Good at',
      where: 'Where it runs',
      effort: 'Reasoning effort',
      state: 'Status',
    },
    where: {
      none: 'No runner',
      team_one: '{{count}} shared runner',
      team_other: '{{count}} shared runners',
      personal_one: '{{count}} personal runner online',
      personal_other: '{{count}} personal runners online',
      both: '{{team}} shared · {{personal}} personal',
      names: '{{names}}',
      noneOnline: 'No runner online now',
      personalOnly: 'Personal runners only',
      lastReported: 'Last reported {{when}}',
    },
    state: {
      enabled: 'Enabled',
      disabled: 'Disabled',
      unreported: 'No runner',
    },
    effort: {
      default: "Tool's default",
      off: 'Off',
      minimal: 'Minimal',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      xhigh: 'Extra high',
      max: 'Max',
      ultra: 'Ultra',
    },
    enable: {
      reportedBy_one: 'Reported by {{count}} runner online: {{names}}.',
      reportedBy_other: 'Reported by {{count}} runners online: {{names}}.',
      noRunnerNow: 'No runner that has it is online now.',
      goodAtHint:
        'The Lead Agent decides what to hand this agent by these words. Say what it suits and what it does not.',
      goodAtRequired: 'Write what it is good at before enabling it.',
      effortHint: 'The Lead Agent cannot change it when it hands work over.',
      personalOnly:
        'Only personal runners have it: the Lead Agent hands it work only on issues their owners start.',
    },
    edit: {
      button: 'Edit',
      buttonFor: 'Edit {{name}}',
      title: 'Edit {{name}}',
      enabled: 'Enabled',
      done: '{{name}} saved',
    },
    available: {
      open: 'Add agent',
      title: 'Available models',
      description:
        'Only the tools a runtime has checked are ever detected and listed here. The application’s recommended combinations create and enable themselves as soon as a runner reports them; add an agent from any other one.',
      recommended: 'Enabled automatically when reported',
      added: 'Added',
      add: 'Add',
      status: {
        available: 'Available',
        needsSetup: 'Needs setup',
        versionTooOld: 'Version too low',
        failed: 'Detection failed',
      },
      details: 'Tool details',
      setupCommand: 'Needs setup: run {{command}} on the runtime.',
      setupUnknown:
        'This tool needs setting up, but we don’t know the command for it.',
      upgradeAdvice:
        'Upgrade the tool and its ACP adapter to the latest releases on the runtime, then refresh detection.',
      minimumVersionUnknown:
        'Minimum supported tool release: unknown. Consult the tool’s compatibility documentation.',
      noDetail: 'The tool gave no further detail.',
      showMore: 'Show more',
      showLess: 'Show less',
      groupSearchPlaceholder: 'Search this tool’s models',
      group_one: '{{tool}} · {{count}} model · {{runners}}',
      group_other: '{{tool}} · {{count}} models · {{runners}}',
      runners_one: '{{count}} runtime',
      runners_other: '{{count}} runtimes',
      noModels: 'No model here.',
      selectedCount_one: '{{count}} selected',
      selectedCount_other: '{{count}} selected',
      addSelected: 'Add {{count}}',
      confirmTitle_one: 'Add {{count}} agent',
      confirmTitle_other: 'Add {{count}} agents',
      confirmAction_one: 'Add {{count}}',
      confirmAction_other: 'Add {{count}}',
      goodAtNeeded: 'What is it good at?',
      addedCount_one: 'Added {{count}} agent.',
      addedCount_other: 'Added {{count}} agents.',
      addedPartial:
        'Added {{succeeded}}, {{failed}} could not be added. See the reason under each.',
      addFailed:
        '{{failed}} could not be added. See the reason under each; try again.',
    },
  },
  agentTypes: {
    label: 'Agent type',
    question: 'What kind of agent?',
    online: 'Online',
    runner: 'Runner',
    onlineHint:
      'Answers in seconds on the server through a model service. No runtime needed; it cannot touch code.',
    runnerHint:
      'Drives a coding tool on a runtime and works in a working directory: code, files, commands.',
    immutable:
      'An agent keeps its type; create another agent for the other kind.',
    onServer: 'On the server',
    filterAll: 'All types',
    noneOfType: 'No agent of this type.',
  },
  agentSkills: {
    title: 'Skills',
    description:
      'Manuals the agent reads when a task matches their description. Placed in its working directory before every run.',
    manage: 'Manage skills',
    placeholder: 'Select skills',
    empty: 'No skills yet.',
    save: 'Save skills',
    descriptionOnline:
      'Manuals the agent reads when a task matches their description, in a read-only sandbox on the server.',
    onlineScripts:
      'Scripts are not executed for online agents: the agent can read them, not run them.',
    skippedScripts: ': {{paths}}',
    pathSeparator: ', ',
  },
  brief: {
    preview: 'Preview full prompt',
    previewTitle: 'Preview full prompt',
    previewDescription:
      'What a run of this agent would be sent now, on a made-up subject. Nothing is queued.',
    scenario: 'Scenario',
    sample:
      'On a made-up subject: {{subject}}. Values marked [sample] are made up.',
    previewFailed: 'Could not render the full prompt.',
    system: 'System prompt',
    showAs: 'Show as',
    rendered: 'Rendered',
    raw: 'Raw',
    platform: 'Platform rules and task · about {{size}} characters (English)',
    platformNote:
      'Platform rules are sent in English; the agent still replies in your language.',
    agentPrompt: 'Agent prompt (written by you)',
    noAgentPrompt: 'This agent has no prompt of its own.',
    firstMessage: 'First message',
    empty: 'Empty',
    previewPlaceholders:
      'The bracketed notes about the runtime are filled in by the runtime that runs it: its working directories, and the initialization prompts of directories it just prepared.',
    placeholders:
      'The {{runner.…}} placeholders are filled in by the runtime that runs it: its working directories, and the initialization prompts of directories it just prepared.',
    layers: {
      system: 'Rules',
      task: 'Task',
      context: 'Context',
      agent: 'Agent prompt',
      turn: 'First turn',
    },
  },
  envVars: {
    title: 'Environment variables',
    description:
      'Passed to the coding tool on every run and masked in run records; values are not shown again after saving. Anyone who may use a shared agent can receive these values on their own computer; mark high-risk secrets "Shared runtimes only".',
    add: 'Add variable',
    addTitle: 'Add environment variable',
    editTitle: 'Replace {{name}}',
    writeOnly: 'The value is stored encrypted and replaces the previous value.',
    name: 'Name',
    nameHint: 'Upper-case letters, digits and underscores.',
    value: 'Value',
    valueTooLong: 'The value is larger than 8 KB.',
    keepValueHint: 'Leave it empty to keep the current value.',
    teamRunnersOnly: 'Shared runtimes only',
    teamRunnersOnlyHint:
      'Without it, a run sends the value to the runtime that takes it, including the personal runtime of anyone who may use the agent. With it, only a shared runtime takes runs that get this variable.',
    teamRunnersOnlyBadge: 'Shared runtimes only',
    fromRunner: 'Take from the runtime',
    fromRunnerHint:
      'No value is kept here: the runtime that takes a run provides it from its own machine, set there with {{command}} or passed with `--pass-env`. A runtime that does not provide it fails the run before it starts.',
    fromRunnerBadge: 'From the runtime',
    valueRequired: 'Enter a value, or keep taking it from the runtime.',
    empty: 'No environment variables.',
    scope: 'Scope',
    updated: 'Updated',
    actionsHead: 'Actions',
    edit: 'Replace value',
    actions: 'Actions for {{name}}',
    accessLog: 'Access log',
    accessLogAll: 'View the full access log',
    accessLogOf: 'Access log of {{name}}',
    accessLogDescription:
      'Who viewed, set or deleted the variables and when, and which runs received them.',
    delete: 'Delete',
    deleteTitle: 'Delete {{name}}?',
    deleteDescription: 'Runs after this no longer receive the variable.',
    deleteConfirm: 'Delete',
    deleted: 'Deleted {{name}}.',
    saved: 'Saved {{name}}.',
    updatedBy: '{{name}} · {{time}}',
    reveal: 'Reveal values',
    revealTitle: 'Reveal the values?',
    revealAudit:
      'Revealing is recorded in the access log with your name and the time.',
    revealedTitle: 'Variable values',
    revealedNote: 'This reveal was recorded. Close it when you are done.',
    runner: 'Runtime {{id}}',
    auditsEmpty: 'Nothing recorded yet.',
    auditAction: {
      reveal: 'revealed',
      set: 'set',
      delete: 'deleted',
      deliver: 'received for a run',
    },
    nameProblems: {
      required: 'Enter a name.',
      pattern:
        'Use only upper-case letters, digits and underscores, not starting with a digit.',
      reserved: 'This name is reserved.',
      duplicate: 'A variable with this name exists; edit it instead.',
    },
  },
  scopeVariables: {
    title: 'Variables and secrets',
    description:
      'Given to every agent working here. More specific variables (a working directory’s, then the agent’s) win over these.',
  },
  scopes: { workdir: 'Working directory' },
  subjects: { conversation: 'Conversation', consultation: 'Consultation' },
  usage: {
    otherUse: {
      title: 'Other model use',
      description:
        'Model calls outside agent runs, such as indexing and searching the knowledge base.',
      purpose: 'Use',
      source: 'Asked by',
      model: 'Model',
      calls: 'Calls',
      units: 'Items',
      purposes: {
        embedding: 'Embeddings',
        rerank: 'Reranking',
        text: 'Utility text',
      },
    },
    title: 'Usage',
    description:
      'What agent runs used and what they cost at the current model prices.',
    loadFailed: 'Could not load the usage',
    groupBy: 'Group by',
    groupByValue: 'Group by {{group}}',
    empty: 'No runs in this period.',
    total: 'Total',
    noGroup: 'None',
    unknown: 'Unknown',
    onlineTool: 'Online (model services)',
    setPrices: 'Set prices',
    chart: {
      title: 'Daily trend',
      metric: 'Show',
      cost: 'Cost',
      tokens: 'Tokens',
      total: 'Total',
      other: 'Other',
    },
    pricedNote:
      'Cost covers {{priced}} of {{total}} runs; these models have no price yet: {{models}}.',
    filters: {
      allGroups: 'All: {{group}}',
      agent: 'Agent',
      allAgents: 'All agents',
      person: 'Woken by',
      allPeople: 'Everyone',
      range: 'Date range',
      presets: 'Quick ranges',
    },
    presets: {
      last7: 'Last 7 days',
      last30: 'Last 30 days',
      thisMonth: 'This month',
      lastMonth: 'Last month',
      last90: 'Last 90 days',
    },
    groups: {
      agent: 'Agent',
      person: 'Woken by',
      group: 'Group',
      subject: 'Subject',
      day: 'Day',
      model: 'Model',
      tool: 'Coding tool',
      type: 'Agent type',
    },
    columns: {
      runs: 'Runs',
      duration: 'Duration',
      input: 'Input',
      output: 'Output',
      cacheRead: 'Cache read',
      cacheWrite: 'Cache write',
      cost: 'Estimated cost',
    },
  },
  defaultSkills: {
    title: 'Default skills',
    description: 'Every agent working here gets these skills too.',
    save: 'Save skills',
    saved: 'Default skills saved.',
  },
  runs: {
    title: 'Execution log',
    empty: 'No runs yet.',
    loadFailed: 'Unable to load the execution log',
    unknownAgent: 'Agent',
    attempt: 'attempt {{attempt}} of {{max}}',
    viewTranscript: 'View transcript',
    transcriptTitle: 'Run transcript',
    viewAll: 'View all {{count}}',
    allTitle: 'All runs ({{count}})',
    filters: {
      agent: 'Agent',
      status: 'Status',
      allAgents: 'All agents',
      allStatuses: 'All statuses',
    },
    noMatch: 'No runs match these filters.',
    cancel: 'Stop',
    stopping: 'Stopping…',
    cancelTitle: 'Stop this run?',
    cancelDescription:
      '{{name}} will be stopped. What it already changed stays.',
    cancelRequested: 'Stop requested',
    retry: 'Retry',
    retried: 'Run queued again',
    viewBrief: 'View full prompt',
    briefTitle: 'Full prompt',
    briefDescription: 'What the agent was told when this run was last claimed.',
    briefOf: 'Attempt {{attempt}}, claimed {{time}}',
    briefUnavailable: 'No full prompt is available for this run.',
    processDataCleared:
      'Run process data has been cleared under the retention policy.',
    briefFailed: 'Could not load the full prompt',
    workspaceReset: {
      button: 'Clean working directory',
      title: 'Clean the working directory?',
      description:
        'The next run starts from a fresh checkout and is given the initialization prompts again. Changes that were not pushed are lost on that runtime. A directory used in place is never deleted.',
      confirm: 'Clean',
      done: 'The next run starts from a fresh checkout.',
    },
    stateChanged: 'The run changed state. The log has been refreshed.',
    status: {
      queued: 'Queued',
      dispatched: 'Dispatched',
      running: 'Running',
      completed: 'Turn ended',
      failed: 'Failed',
      cancelled: 'Cancelled',
      cancelling: 'Stopping',
    },
    /** This plugin's own triggers; a subject's are named by the application (the vocabulary). */
    trigger: {
      retry: 'Retry',
      message: 'Message',
      consultation: 'Consultation',
    },
    activity: {
      queued: '{{name}} was queued',
      dispatched: '{{name}} is starting',
      running: '{{name}} started working',
      completed: '{{name}} ended its turn',
      failed: '{{name}} failed',
      cancelled: '{{name}} was stopped',
    },
    live: {
      working: '{{name}} is working',
      workingFor: '{{name}} is working · {{minutes}} min',
      queued: '{{name}} is queued',
    },
  },
  transcript: {
    title: 'Run transcript',
    notFound: 'This run does not exist.',
    waiting: 'Waiting for the agent to start…',
    empty: 'This run recorded no events.',
    fetchFailed: 'Unable to fetch new events. Retrying…',
    expand: 'Show all',
    truncated: 'Cut short: the full text was too long to keep.',
    summary_one: 'Created {{created}} · {{count}} event',
    summary_other: 'Created {{created}} · {{count}} events',
    took: 'took {{duration}}',
    pendingInputs_one: '{{count}} comment waiting for the agent',
    pendingInputs_other: '{{count}} comments waiting for the agent',
    inputDelivered_one: 'Delivered to the agent',
    inputDelivered_other: '{{count}} inputs delivered to the agent',
    tokens: '{{input}} tokens in, {{output}} out',
    kinds: {
      text: 'Agent',
      thinking: 'Thinking',
      toolUse: 'Tool',
      toolResult: 'Result',
      allowed: 'Allowed',
      denied: 'Denied',
      input: 'Input',
      checkout: 'Checkout',
      status: 'Status',
      error: 'Error',
      usage: 'Usage',
    },
  },
  failures: {
    runnerUpgrade:
      'Interrupted for an execution machine update; the run will continue.',
    runnerDiskFull: 'The execution machine ran out of disk space.',
    runnerOfflineBeforeStart:
      'The runtime went offline before starting the run.',
    runnerOffline: 'The runtime went offline.',
    leaseExpired: 'The runtime stopped reporting.',
    startTimeout: 'The runtime did not start the run in time.',
    cancelled: 'Cancelled.',
    idleTimeout: 'The agent stopped making progress.',
    setupFailed: 'The run could not be prepared.',
    cliUnavailable: 'The runtime could not install the application CLI.',
    workspaceBusy:
      'The working directory is busy; waiting for another attempt.',
    checkoutFailed: 'The repository checkout failed.',
    toolAuth: 'The coding tool is not signed in on the runtime.',
    toolQuota: 'The coding tool ran out of quota.',
    toolRateLimit: 'The coding tool was rate limited.',
    toolNetwork: 'The coding tool could not reach its service.',
    toolProcess: 'The coding tool exited unexpectedly.',
    contextOverflow: 'The conversation grew too long for the model.',
    delegatedQueueTimeout: 'Delegation queue timeout; withdrawn',
    queuedExpired: 'No runtime took the run in time.',
    modelUnavailable: 'The agent’s model is not available.',
    stepLimit: 'The agent called tools too many times without answering.',
    policyRefused: 'No runtime’s policy lets it take this work.',
    prepareNetwork:
      'The runtime could not reach the repository host while preparing the run.',
    repoAccessUnavailable:
      'A repository’s credential could not be issued just now; the run will be tried again.',
    repoAccessDenied:
      'The application will not issue a credential for one of the run’s repositories.',
    unknown: 'The run failed.',
  },
};

/** The pages' texts with the permission titles the server registers (`shared/locales`). */
const enUS: typeof pages &
  typeof runtimesEnUS &
  typeof accessEnUS &
  typeof chatEnUS &
  typeof servicesEnUS &
  typeof pricesEnUS &
  typeof skillsEnUS &
  typeof runWaitEnUS = {
  ...pages,
  ...runtimesEnUS,
  ...chatEnUS,
  ...servicesEnUS,
  ...pricesEnUS,
  ...skillsEnUS,
  ...runWaitEnUS,
  access: accessEnUS.access,
};

/** English is the source of truth for this plugin's locale shape. */
export type AgentsResource = LocaleResource<typeof enUS>;

export default enUS;
