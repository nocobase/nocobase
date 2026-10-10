import { accountSettingsEnUS, preferencesEnUS } from '../account/locales.js';
import type { LocaleResource } from '@nocobase/i18n';
import { gitEnUS } from '../git/locales.js';
import { knowledgeEnUS } from '../knowledge/locales.js';
import { issuesEnUS } from '../issues/locales.js';
import { projectPageEnUS } from '../projects/locales.js';
import { ciSetupEnUS } from '../releases/ci-setup/locales.js';
import { previewsEnUS, deploysEnUS } from '../previews/locales.js';
import agentChatEnUS from '@/extensions/nocobase-agent-chat/locales/en-US';
import deviceApprovalEnUS from '@/extensions/nocobase-device-approval/locales/en-US';
import inboxEnUS from '@/extensions/nocobase-inbox/locales/en-US';
import planCardEnUS from '@/extensions/nocobase-plan-card/locales/en-US';

const enUS = {
  overrides: {
    '@nocobase/app-plugin-agents': {
      runWait: {
        reasons: {
          toolSlotsFull:
            'Waiting for a {{tool}} slot: all taken on every fitting runtime ({{used}}/{{limit}})',
        },
      },
    },
  },
  // The UI Library's agent-chat block (the chat panel, `extensions/nocobase-agent-chat`); the keys below may reword it.
  ...agentChatEnUS,
  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  // The UI Library's plan-card block (a plan in the chat, the inbox and its page); the keys below may reword it.
  ...planCardEnUS,
  'inbox.loading': 'Loading…',
  'inbox.loadFailedDescription': 'The request failed. Please try again.',
  'auth.signInTitle': 'Sign in to {{name}}',
  'auth.or': 'Or continue with',
  'auth.activity.live': 'Live',
  'auth.activity.heading': 'Plan. Build. Ship.',
  'auth.activity.description': 'Your 24/7 AI agent team, at work.',
  'auth.activity.via': 'via {{tool}} on {{runner}}',
  'auth.activity.issues.pm34': 'Export issues as CSV',
  'auth.activity.issues.pm35': 'Notify people @mentioned in comments',
  'auth.activity.statuses.todo': 'Todo',
  'auth.activity.statuses.in_progress': 'In progress',
  'auth.activity.statuses.in_review': 'In review',
  'auth.activity.statuses.done': 'Done',
  'auth.activity.actions.created': 'created {{identifier}}',
  'auth.activity.actions.statusChanged': 'moved {{identifier}} to In progress',
  'auth.activity.actions.prOpened': 'opened a pull request for {{identifier}}',
  'auth.activity.actions.commented': 'commented on {{identifier}}',
  'auth.activity.actions.previewReady': 'deployed a preview of {{identifier}}',
  'auth.activity.actions.approved':
    'approved the status change of {{identifier}}',
  'auth.activity.actions.merged':
    '{{identifier}}: {{repo}}#{{number}} was merged',
  'auth.activity.actions.deployApproved':
    'approved deploying {{release}} to {{environment}}',
  'auth.activity.prTitle': 'feat(issues): export the issue list as CSV',
  'auth.activity.comment':
    "Looks good. Could the export keep the list's current filters?",
  'auth.activity.environment': 'Production',
  'auth.loginDescription': 'Sign in with your username or email and password.',
  'auth.registerTitle': 'Create an account',
  'auth.registerDescription': 'Create an account to get started.',
  'auth.forgotTitle': 'Forgot password',
  'auth.forgotDescription':
    'Enter your email and we will send a reset link if the account exists.',
  'auth.resetTitle': 'Reset password',
  'auth.resetDescription': 'Choose a new password for your account.',
  'auth.identifier': 'Username or email',
  'auth.password': 'Password',
  'auth.signIn': 'Sign in',
  'auth.signingIn': 'Signing in…',
  'auth.hidePassword': 'Hide password',
  'auth.showPassword': 'Show password',
  'auth.forgotLink': 'Forgot password?',
  'auth.signUp': 'Sign up',
  'auth.noAccount': "Don't have an account?",
  'auth.backToSignIn': 'Back to sign in',
  'auth.createAccount': 'Create account',
  'auth.creatingAccount': 'Creating account…',
  'auth.name': 'Name',
  'auth.username': 'Username',
  'auth.email': 'Email',
  'auth.confirmPassword': 'Confirm password',
  'auth.existingAccount': 'Already have an account?',
  'auth.resetting': 'Resetting…',
  'auth.newPassword': 'New password',
  'auth.confirmNewPassword': 'Confirm new password',
  'auth.invalidResetLink':
    'This password reset link is invalid or has expired.',
  'auth.sendResetLink': 'Send reset link',
  'auth.sending': 'Sending…',
  'auth.resetSent': 'If the account exists, a reset link has been sent.',
  'auth.rememberPassword': 'Remember your password?',
  'auth.methods': 'Authentication methods',
  'auth.continueWith': 'Continue with {provider}',
  'status.loading': 'Loading',
  'status.loadingPage': 'Loading page',
  'status.denied': 'Access denied',
  'status.pageFailed': 'Unable to load page',
  'status.retry': 'Retry',
  'navigation.brandHome': 'NocoBase home',
  'navigation.brandApps': 'NocoBase applications',
  'auth.passwordMismatch': "Passwords don't match.",
  'routeOverlay.close': 'Close',
  'issueCard.priority.urgent': 'Urgent',
  'issueCard.priority.high': 'High',
  'issueCard.priority.medium': 'Medium',
  'issueCard.priority.low': 'Low',
  'issueCard.due': 'Due {{date}}',
  'issueCard.overdue': 'Overdue since {{date}}',
  'issueCard.owner': 'Owner',
  'issueCard.executor': 'Executor',
  'issueCard.loading': 'Loading issue',
  'status.deniedDescription': 'You do not have permission to access {{label}}.',
  'status.routeFailedDescription':
    'Route {{label}} from {{packageName}} could not be loaded.',
  home: {
    title: 'Start building your application',
    description:
      'Describe what you need to your AI Agent, then build pages, data models, and business workflows.',
    heading: 'What should we work on?',
    modes: { online: 'Online', runner: 'Runner' },
    inputLabel: 'Message',
    placeholders: {
      online: 'Ask about your projects and issues, or have them organized…',
      runner: 'Describe the work for a coding agent…',
    },
    blockers: {
      noModel:
        'Online agents need a model service: add one and turn on a chat model, and agents can answer.',
      noAgent:
        'There is no agent you may talk to. Ask an administrator to create one.',
    },
    send: 'Send',
    setUpModels: 'Add a model service',
    sendFailed: 'The message could not be sent. Try again.',
    recent: 'Recent conversations',
    allConversations: 'View all',
    untitled: 'Untitled conversation',
    agentSetup: {
      open: 'Use Studio in your agent',
      title: 'Use Studio in your agent',
      description:
        'Paste this prompt into a coding agent such as Claude Code or Codex. It installs the nb-studio CLI and signs it in.',
      prompt:
        'Please install and set up the Studio CLI so you can work with the projects and issues on Studio ({{server}}):\n' +
        '1. Run `{{install}}` to install studio.\n' +
        '2. Run `nb-studio login --server {{server}}` and tell me the code it shows; I will confirm it in my browser.\n' +
        '3. Once signed in, run `nb-studio docs` to learn the commands, then use nb-studio for what I ask instead of calling the HTTP API directly.',
      promptLabel: 'Prompt for your agent',
      preparing: 'Preparing the prompt',
      identity:
        'The CLI acts as you, with the same permissions you have in Studio. Signing in needs your confirmation in the browser.',
      expiry: 'This link works for 30 minutes; you can generate a new one.',
      runtime:
        'This installs the CLI only. To run agents on this machine, add it under Agent team › Runtimes › Add runtime, which installs nocobase-runner.',
      regenerate: 'Generate new link',
      copy: 'Copy',
      copied: 'Copied',
      copyFailed: 'Could not copy the prompt',
      failed: 'Could not prepare the prompt. Try again.',
    },
  },
  dashboard: {
    description:
      'How delivery goes, how the agents perform, and what is stuck.',
    period: 'Period',
    days: '{{count}} days',
    viewAll: 'View all',
    previous: 'vs {{value}} before',
    points: '{{value}} pts',
    unchanged: 'No change',
    needsIssues: 'Needs the projects plugin',
    definition: 'How “{{name}}” is measured',
    sparkline: '{{name}} over the period',
    states: {
      loading: 'Loading',
      failed: 'Could not load this. Check your connection and retry.',
      signedOut: 'Your session has ended. Sign in again to see this.',
      noAccess: 'You do not have access to this. Ask an administrator.',
    },
    figures: {
      completed: {
        label: 'Issues completed',
        info: 'Throughput: issues that entered a done status in the period. An issue completed twice counts once, on the last time.',
      },
      cycleTimeP50Ms: {
        label: 'Median cycle time',
        info: 'From start to done: from the first time an issue entered a started status (or its creation, when created in one) to its completion. The median over the issues completed in the period; issues done without being started are left out.',
      },
      agentShare: {
        label: 'Completed by agents',
        info: 'Of the issues completed in the period, the share whose executor is an agent.',
      },
      costPerIssue: {
        label: 'Cost per issue',
        info: 'What the agents’ usage reported in the period cost, at the current model prices, divided by the issues completed in the period.',
      },
      successRate: {
        label: 'Run success rate',
        info: 'Of the runs queued in the period that have ended, the share that completed rather than failed. Cancelled and unfinished runs are left out.',
      },
      reworkRate: {
        label: 'Rework rate',
        info: 'Issues executed by agents that were sent back in the period — from In review, or reopened from done, to an earlier status — over the issues agents completed in the period.',
      },
      runsPerIssue: {
        label: 'Runs per issue',
        info: 'Every run, of any outcome and at any time, on the issues agents completed in the period, divided by those issues.',
      },
      interventionRate: {
        label: 'Human intervention',
        info: 'Of the runs on issues queued in the period that ended, the share during which the agent moved its issue to Blocked to ask its owner. Runs have no waiting-for-input state, so this is the signal used.',
      },
      queueWaitP50Ms: {
        label: 'Median queue wait',
        info: 'From queued to claimed by a runner or the server, the median over the runs queued in the period.',
      },
    },
    agents: {
      title: 'Agent performance',
      description:
        'How agents’ work went in the period, against the period before.',
      chart: 'Runs by outcome',
      chartDescription: 'Runs queued each day, by how they ended so far.',
      noRunsTitle: 'No runs in this period',
      noRunsDescription:
        'Give an issue to an agent and its runs show here by outcome.',
    },
    series: {
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      open: 'In progress',
    },
    attention: {
      title: 'Needs attention',
      description: 'Only what is stuck or late now.',
      blocked: 'Blocked',
      overdue: 'Overdue',
      reviewWaits: 'Waiting for review over {{count}} days',
      failedRuns: 'Failed in the last 24 hours',
      waiting: 'for {{value}}',
      due: 'due {{value}}',
      open: 'open {{value}}',
      failed: '{{agent}} · {{value}} ago',
      anAgent: 'An agent',
      opensOnHost: 'Opens on the code host',
      queue: 'Agent queue',
      more: '{{count}} more',
      allClearTitle: 'All clear',
      allClearDescription:
        'Nothing is blocked or overdue, no pull request has waited over {{count}} days, and no run failed in the last 24 hours.',
    },
    projects: {
      title: 'By project',
      description:
        'Each project you can see: progress now, and delivery in the period.',
      progress: '{{done}}/{{total}} · {{percent}}',
      columns: {
        project: 'Project',
        progress: 'Progress',
        completed: 'Completed',
        cycleTime: 'Median cycle time',
        blocked: 'Blocked',
      },
      emptyTitle: 'No projects yet',
      emptyDescription:
        'Create a project and its progress and delivery show here.',
    },
  },

  appearance: {
    title: 'Appearance',
    mode: 'Color mode',
    preset: 'Theme',
    menu: 'Theme',
    density: 'Density',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    themes: { default: 'Spacious', compact: 'Compact' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    refresh: 'Refresh',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    language: 'Language',
  },
  notices: {
    serverLocaleFallback:
      'The server does not support this language, so server messages will use English.',
    languageChangeFailed:
      'Unable to complete the language change. Please try again.',
  },
  profile: {
    reloadFailed:
      'Unable to refresh account data. Your edits are kept. Please retry.',
    description: 'Manage your name, username and password.',
    detailsDescription: 'Your display name appears on tasks and comments.',
    name: 'Display name',
    save: 'Save',
    saving: 'Saving…',
    currentPassword: 'Current password',
    passwordDescription: 'Other sessions will be signed out after saving.',
    changePassword: 'Change password',
    saved: 'Profile saved',
    passwordChanged: 'Password changed',
    loadFailed: 'Unable to load your profile. Please retry.',
    signInAgain: 'Your session has expired. Sign in again.',
    saveFailed: 'Unable to save. Please try again.',
    refreshFailed:
      'Saved, but account data could not refresh. Reload the page.',
    nameRequired: 'Enter a display name.',
    usernameInvalid: 'Use 3–30 letters, numbers, underscores or dots.',
    usernameTaken: 'This username is taken. Choose another.',
    wrongPassword: 'The current password is incorrect. Try again.',
    passwordRequired: 'Enter a password.',
    passwordTooShort: 'This password is too short. Use a longer password.',
    passwordTooLong: 'This password is too long. Use a shorter password.',
    noPassword:
      'This account has no password. Use your existing sign-in method.',
    apiKeys: 'API keys',
    apiKeysDescription:
      'Create keys that let scripts and integrations call this application as you.',
    apiKeysLink: 'Open API keys',
  },
  account: {
    profile: 'Profile',
    signOutFailed: 'Unable to sign out. Please try again.',
    openMenu: 'Open account menu',
    fallback: 'Account',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
  },
  navigation: {
    inbox: 'Inbox',
    myIssues: 'My issues',
    development: 'Development',
    issues: 'Issues',
    projects: 'Projects',
    knowledge: 'Knowledge',
    agentTeam: 'Agent team',
    agents: 'Agents',
    runtimes: 'Runtimes',
    skills: 'Skills',
    models: 'Models',
    releases: 'Releases',
    releaseApps: 'Apps',
    environments: 'Deploy environments',
    usage: 'Usage',
    config: 'Settings',
    home: 'Home',
    dashboard: 'Dashboard',
    open: 'Open navigation',
    close: 'Close navigation',
    expand: 'Expand navigation',
    collapse: 'Collapse navigation',
    label: 'Application navigation',
    breadcrumb: 'Breadcrumb',
    breadcrumbMore: 'Show the levels in between',
    back: 'Back',
  },
  dataTable: {
    noResults: 'No results.',
    sortAscending: 'Asc',
    sortDescending: 'Desc',
    hideColumn: 'Hide',
    view: 'View',
    toggleColumns: 'Toggle columns',
    selectedCount: '{{selected}} of {{total}} row(s) selected.',
    rowsPerPage: 'Rows per page',
    pageOf: 'Page {{page}} of {{pageCount}}',
    firstPage: 'Go to first page',
    previousPage: 'Go to previous page',
    nextPage: 'Go to next page',
    lastPage: 'Go to last page',
  },
  datePicker: {
    placeholder: 'Pick a date',
    rangePlaceholder: 'Pick a date range',
  },
  // Settings, members and roles (`pages/config`).
  'actions.cancel': 'Cancel',
  'common.breadcrumb': 'Breadcrumb',
  'common.clearFilters': 'Clear filters',
  'common.close': 'Close',
  'common.create': 'Create',
  'common.createNamed': 'Create “{{name}}”',
  'common.creating': 'Creating…',
  'common.forbidden': 'You do not have permission to do this.',
  'memberPicker.empty': 'No member matches.',
  'common.loading': 'Loading…',
  'common.noOptions': 'No options',
  'common.requestFailed': 'The request failed. Please try again.',
  'common.retry': 'Retry',
  'common.save': 'Save',
  'common.saving': 'Saving',
  'common.unknown': 'Unknown',
  'config.defaultRole.description':
    'Given once to someone who joins, on their first visit or when they accept an invitation. It can be taken away later like any other role.',
  'config.defaultRole.none': 'None',
  'config.defaultRole.saved': 'Default role saved',
  'config.defaultRole.title': 'Default role for new members',
  'config.general.description':
    'Issue identifiers and the role new members start with.',
  'config.knowledgeSearch.description':
    'The models and methods agents use to search the knowledge base.',
  'config.noAccess': 'No settings to show',
  'config.noAccessDescription':
    'Your roles do not let you read any of the settings.',
  'config.noRole.description':
    'Ask an administrator to give you a role in Settings → Members.',
  'config.noRole.title': 'You have no role yet',
  'config.nav.general': 'General',
  'config.nav.labels': 'Labels',
  'config.nav.members': 'Members',
  'config.nav.roles': 'Roles',
  'config.nav.workflows': 'Workflow templates',
  'config.nav.label': 'Settings navigation',
  'config.nav.back': 'Back',
  'config.nav.groups.workspace': 'Workspace',
  'config.nav.groups.access': 'Members & access',
  'config.nav.groups.projects': 'Projects',
  'config.nav.groups.integrations': 'Integrations',
  'errors.API_KEY_SESSION_FORBIDDEN':
    'API keys are managed only from a signed-in session.',
  'errors.SCOPED_KEY_FORBIDDEN':
    'This is not available to scoped API keys or organization API keys.',
  'errors.EMPTY_SCOPE': 'Choose at least one permission.',
  'errors.UNKNOWN_SCOPE_OBJECT':
    'One of the chosen records is not available to you.',
  'errors.EXPIRY_REQUIRED': 'A key with a scope must expire.',
  'errors.GIT_DEVICE_FLOW_DISABLED':
    'The app does not allow connecting with a code: an administrator turns on its device flow in the app’s settings on the host.',
  'errors.INVALID_PERSONAL_TOKEN':
    'The host refused the token: check that it is valid, not expired and pasted whole.',
  'errors.GIT_PERSONAL_TOKENS_DISABLED':
    'Personal tokens are turned off for this connection.',
  'errors.GIT_PERSONAL_UNAVAILABLE':
    'This connection does not offer that way of connecting your account.',
  'errors.INVALID_EXPIRY': 'The expiry is not allowed.',
  'errors.INVALID_NAME': 'Enter a name of at most 100 characters.',
  'errors.APPS_NOT_CREATABLE':
    'Only someone who may create Apps, or deploy to every App, has Studio set Apps up.',
  'errors.PREVIEW_ENVIRONMENT_UNSUITABLE':
    'Previews need an environment that runs uploaded archives and is not protected.',
  'errors.UNKNOWN_ENVIRONMENT': 'The environment no longer exists.',
  'keys.pageTitle': 'API keys',
  'keys.pageDescription':
    'Keys that let scripts, CI and integrations call this application as you. A key with a scope can do only what you choose, and never more than you can.',
  'keys.title': 'Keys',
  'keys.create': 'Create key',
  'keys.createTitle': 'Create an API key',
  'keys.createDescription':
    'The key is shown once. Its permissions cannot be changed later; create another key instead.',
  'keys.name': 'Name',
  'keys.namePlaceholder': 'GitHub Actions deploy',
  'keys.description': 'Description',
  'keys.expiry.label': 'Expires',
  'keys.expiry.days_one': 'In {{count}} day',
  'keys.expiry.days_other': 'In {{count}} days',
  'keys.expiry.never': 'Never',
  'keys.expiry.capped_one': 'A key with a scope expires within {{count}} day.',
  'keys.expiry.capped_other':
    'A key with a scope expires within {{count}} days.',
  'keys.permissions': 'Permissions',
  'keys.fullOwn': 'All permissions',
  'keys.fullOwnDescription': 'The same as your account, now and as it changes.',
  'keys.scoped': 'Only selected permissions',
  'keys.scopedDescription': 'Choose what the key may do, group by group.',
  'keys.presets.label': 'Start from a preset',
  'keys.presets.none': 'None',
  'keys.categories.business': 'Business',
  'keys.categories.administration': 'Administration',
  'keys.categories.account': 'Account',
  'keys.levels.none': 'No access',
  'keys.levels.read': 'Read',
  'keys.levels.write': 'Read and write',
  'keys.levels.admin': 'Admin',
  'keys.levelFor': 'Access to {{name}}',
  'keys.notHeld': 'not held',
  'keys.notHeldHint':
    'Not all of this is held today; the key gets only what is.',
  'keys.objects.all': 'All {{name}}',
  'keys.objects.pick': 'Only selected',
  'keys.objects.choose': 'Choose {{name}}',
  'keys.objects.placeholder': 'Choose {{name}}…',
  'keys.objects.empty': 'Nothing to choose from.',
  'keys.objectsFor': 'Which records {{name}} reaches',
  'keys.scopeNote':
    'A key never does more than its owner may: when the owner loses a permission, so does the key.',
  'keys.problems.name': 'Enter a name.',
  'keys.problems.empty': 'Choose at least one permission.',
  'keys.problems.objects': 'Choose the records, or allow all of them.',
  'keys.scope.full': 'All permissions',
  'keys.scope.objectCount_one': '{{count}} selected',
  'keys.scope.objectCount_other': '{{count}} selected',
  'keys.columns.name': 'Name',
  'keys.columns.scope': 'Permissions',
  'keys.columns.expires': 'Expires',
  'keys.columns.lastUsed': 'Last used',
  'keys.columns.created': 'Created',
  'keys.actions': 'Actions',
  'keys.expired': 'Expired',
  'keys.neverUsed': 'Never',
  'keys.empty': 'No keys yet',
  'keys.emptyDescription':
    'Create a key to call Studio from scripts and tools with only the permissions you choose.',
  'keys.emptyNoAccess': 'Ask an administrator to create a key.',
  'keys.loadFailed': 'Could not load the keys.',
  'keys.createFailed': 'Could not create the key.',
  'keys.rotate': 'Rotate',
  'keys.actionsFor': 'Actions for {{name}}',
  'keys.rotateTitle': 'Rotate the key {{name}}?',
  'keys.rotateDescription':
    'A new secret replaces it with the same permissions and lifetime. The current secret stops working at once.',
  'keys.rotateFailed': 'Could not rotate the key.',
  'keys.revoke': 'Revoke',
  'keys.revokeTitle': 'Revoke the key {{name}}?',
  'keys.revokeDescription': 'Anything that uses it stops working at once.',
  'keys.revokeFailed': 'Could not revoke the key.',
  'keys.revoked': 'Key {{name}} revoked.',
  'keys.secretTitle': 'Key {{name}}',
  'keys.secretOnce':
    'Copy it now and keep it somewhere safe: it is shown only once.',
  'keys.secret': 'Secret',
  'keys.copy': 'Copy',
  'keys.copied': 'Key copied.',
  'keys.done': 'Done',
  'keyScopes.members.title': 'Members and roles',
  'keyScopes.members.description':
    'Read: see the members and roles. Read and write: also invite and give roles. Admin: also define roles.',
  'keyScopes.reports.title': 'Reports',
  'keyScopes.reports.description':
    'Read the team dashboard, the metrics and the usage of agent runs.',
  'keyScopes.knowledge.title': 'Knowledge',
  'keyScopes.knowledge.description':
    'Read the knowledge base; propose changes; edit it and open the system knowledge page.',
  'keyScopes.presets.readOnly.title': 'Read only',
  'keyScopes.presets.readOnly.description': 'Read everything you can read.',
  'config.nav.git': 'Git',
  'config.nav.apiKeys': 'API keys',
  'config.nav.knowledgeSearch': 'Knowledge search',
  'common.apiKey': 'API key',
  'errors.API_KEY_IDENTITY':
    'An API key’s permissions are chosen on the key, not by roles.',
  'errors.API_KEY_CREATION_FORBIDDEN':
    'Your organization does not let you create API keys of your own.',
  'errors.SCOPE_REQUIRED': 'Choose the key’s permissions.',
  'errors.KEY_SCOPE_EXCEEDS_YOURS':
    'A key may hold only permissions you hold yourself.',
  'keys.creationOff':
    'Your organization has turned off creating API keys of your own. You can still see and revoke the ones you have.',
  'orgKeys.title': 'API keys',
  'orgKeys.description':
    'Keys for CI, scripts and other systems: they belong to no one and hold only the permissions chosen for them.',
  'orgKeys.managedBy': 'Managed by {{repo}}',
  'orgKeys.managedHint':
    'Studio keeps this key for the repository’s CI in {{project}}: it rotates it and limits it to the Apps the repository builds. Disabling or deleting it hands the CI back to the manual setup.',
  'orgKeys.actsAs': 'What a key does is shown under its name with this tag.',
  'orgKeys.personalLink': 'Your own keys are in Account settings.',
  'orgKeys.create': 'Create key',
  'orgKeys.createTitle': 'Create an API key',
  'orgKeys.createDescription':
    'Choose what the key may do. Its secret is shown once, after you create it.',
  'orgKeys.namePlaceholder': 'GitHub Actions deploy',
  'orgKeys.permissionsHint':
    'Start from a preset such as CI deploy, or choose group by group. You can give only what you hold yourself.',
  'orgKeys.createFailed': 'Could not create the key.',
  'orgKeys.edit': 'Edit',
  'orgKeys.editTitle': 'Edit {{name}}',
  'orgKeys.editDescription':
    'A change of permissions takes effect at once and is recorded in the key’s history. You can give only what you hold yourself.',
  'orgKeys.save': 'Save',
  'orgKeys.saved': 'Key {{name}} saved.',
  'orgKeys.saveFailed': 'Could not change the key.',
  'orgKeys.rotateDescription':
    'A new secret replaces the current one, which stops working at once. The key keeps its name, permissions and history; its expiry is renewed for the same lifetime.',
  'orgKeys.disable': 'Disable',
  'orgKeys.enable': 'Enable',
  'orgKeys.disabled': 'Key {{name}} disabled; it stopped working.',
  'orgKeys.enabled': 'Key {{name}} enabled.',
  'orgKeys.delete': 'Delete',
  'orgKeys.deleteTitle': 'Delete the key {{name}}?',
  'orgKeys.deleteDescription':
    'It stops working at once and cannot be restored. Its name stays on what it did.',
  'orgKeys.deleted': 'Key {{name}} deleted.',
  'orgKeys.deleteFailed': 'Could not delete the key.',
  'orgKeys.loadFailed': 'Could not load the API keys.',
  'orgKeys.empty': 'No API keys yet',
  'orgKeys.emptyDescription':
    'Create a key to let CI, scripts and other systems call Studio with only the permissions you choose.',
  'orgKeys.emptyNoAccess': 'Ask an administrator to create an API key.',
  'orgKeys.actionsFor': 'Actions for {{name}}',
  'orgKeys.columns.created': 'Created',
  'orgKeys.columns.status': 'Status',
  'orgKeys.status.active': 'Active',
  'orgKeys.status.disabled': 'Disabled',
  'orgKeys.status.expired': 'Expired',
  'orgKeys.history': 'History',
  'orgKeys.historyTitle': 'History of {{name}}',
  'orgKeys.historyDescription': 'What was done to the key, and by whom.',
  'orgKeys.historyFailed': 'Could not load the history.',
  'orgKeys.events.created': 'Created',
  'orgKeys.events.updated': 'Renamed or described',
  'orgKeys.events.permissions-changed': 'Permissions changed',
  'orgKeys.events.rotated': 'Rotated',
  'orgKeys.events.disabled': 'Disabled',
  'orgKeys.events.enabled': 'Enabled',
  'orgKeys.events.deleted': 'Deleted',
  'orgKeys.errors.exceeds':
    'A key may hold only permissions you hold yourself.',
  'orgKeys.errors.objects':
    'One of the chosen records is not available to you.',
  'errors.LAST_OWNER': 'The last owner cannot lose the owner role.',
  'errors.ROLE_BUILT_IN': 'Built-in roles cannot be deleted.',
  'errors.ROLE_IN_USE':
    'Someone still holds this role; change their roles first.',
  'errors.ROLE_NOT_EDITABLE':
    'The owner role holds everything; it cannot be edited.',
  'errors.USER_DISABLED': 'A disabled account cannot be given a role.',
  'errors.INVALID_SLUG':
    'The slug takes lower-case letters, digits and hyphens.',
  'errors.INVALID_TITLE': 'A title is required (at most 200 characters).',
  'invitations.invite': 'Invite members',
  'members.columns.email': 'Email',
  'members.columns.name': 'Name',
  'members.columns.roles': 'Roles',
  'members.description':
    'Everyone who works in projects, with their roles; system administrators hold everything and are not listed.',
  'members.loadFailed': 'Unable to load members',
  'members.title': 'Members',
  'properties.you': '(you)',
  'roles.actions': 'Actions',
  'roles.admin': 'Admin',
  'roles.assigned': 'Roles of {{name}} updated.',
  'roles.backToList': 'Back to roles',
  'roles.breadcrumb': 'Role',
  'roles.builtIn': 'Built-in',
  'roles.capabilities.apiKeys.read': 'See the organization’s API keys',
  'roles.capabilities.apiKeys.manage':
    'Create, change, rotate and delete the organization’s API keys, within one’s own permissions',
  'roles.capabilities.git.read': 'See the connections to code hosts',
  'roles.capabilities.git.manage':
    'Add, change and remove connections to code hosts',
  'roles.capabilities.personalApiKeys.create': 'Create API keys of one’s own',
  'roles.capabilities.knowledgeSearch.read':
    'See how the knowledge base is searched',
  'roles.capabilities.knowledgeSearch.manage':
    'Choose the knowledge base’s embedding, rerank and context models and its thresholds',
  'roles.columns.holders': 'Holders',
  'roles.columns.kind': 'Type',
  'roles.columns.name': 'Name',
  'roles.contributor': 'Member',
  'roles.copyOf': '{{name}} (copy)',
  'roles.created': 'Role {{name}} created.',
  'roles.custom': 'Custom',
  'roles.defineRolesNote':
    'Holding "Create and edit roles" gives access to anything in projects: its holder can add any ability to their own role.',
  'roles.delete': 'Delete',
  'roles.deleted': 'Role {{name}} deleted.',
  'roles.deleteDescription': 'The role and its permissions are removed.',
  'roles.deleteInUse':
    '{{count}} people still hold this role. Change their roles before deleting it.',
  'roles.actionsFor': 'Actions for {{name}}',
  'roles.deleteTitle': 'Delete the role {{name}}?',
  'roles.description':
    'A role decides which pages its holders open, which settings they may change, and how far each business operation reaches.',
  'roles.discard': 'Discard changes',
  'roles.duplicate': 'Duplicate as new role',
  'roles.errors.builtIn': 'Built-in roles cannot be deleted.',
  'roles.errors.inUse':
    'Someone still holds this role; change their roles first.',
  'roles.errors.invalidTitle': 'The name must be 1 to 100 characters.',
  'roles.errors.isDefault':
    'New members get this role. Choose another default role first.',
  'roles.errors.lastOwner': 'The last owner keeps the owner role.',
  'roles.errors.notEditable': 'The owner role is not changed here.',
  'roles.errors.notOffered':
    'The role contains something that cannot be granted.',
  'roles.errors.systemAdmin':
    'A system administrator’s roles are managed in the permission settings.',
  'roles.errors.userDisabled': 'A disabled account cannot be given a role.',
  'roles.groups.business': 'Business operations',
  'roles.groups.pages': 'Pages',
  'roles.groups.settings': 'Settings',
  'roles.holders': 'Held by {{count}}',
  'roles.items.apiKeys': 'API keys',
  'roles.items.git': 'Git connections',
  'roles.items.knowledgeSearch': 'Knowledge search',
  'roles.items.personalApiKeys': 'Personal API keys',
  'roles.levels.all': 'All',
  'roles.levels.none': 'None',
  'roles.levels.related': 'Related',
  'roles.related.knowledgeSeen': 'System and projects I can see',
  'roles.related.knowledgeSeenHint':
    'The system knowledge, and the spaces of projects I can see',
  'roles.related.knowledgeLed': 'Projects I lead',
  'roles.related.knowledgeLedHint':
    'The spaces of projects I lead; the system knowledge needs All',
  'roles.related.appsSeen': 'Ones I created or in projects I can see',
  'roles.related.appsSeenHint':
    'Apps I created, Apps linked to projects I can see, and previews of issues I can see',
  'roles.related.appsLed': 'Ones I created or in projects I lead',
  'roles.related.appsLedHint':
    'Apps I created, Apps linked to projects I lead, and previews of issues I can edit',
  'roles.loadFailed': 'Unable to load roles',
  'roles.name': 'Name',
  'roles.new': 'New role',
  'roles.newTitle': 'New role',
  'roles.none': 'No role',
  'roles.notFound': 'This role does not exist.',
  'roles.owner': 'Owner',
  'roles.ownerReadOnly':
    'The owner role holds every project permission and is not changed here.',
  'roles.pick': 'Add a role',
  'roles.rolesFor': 'Roles of {{name}}',
  'roles.save': 'Save',
  'roles.saved': 'Role {{name}} saved.',
  'roles.scope': 'Roles',
  'roles.scopeFor': 'How far {{name}} reaches',
  'roles.title': 'Roles',
  'inbox.description':
    'Decisions waiting for you, and updates on the issues you follow.',
  'inbox.kinds.plans': 'Plans',
  'issuePlans.title': 'Related plans',
  'issuePlans.more': 'Show more',
  'issuePlans.awaiting': '{{count}} awaiting your decision',
  'inbox.tabs.plans': 'Plans',
  'inbox.plans.label': 'Plan',
  'inbox.plans.open': 'Open plan',
  'inbox.plans.filterLabel': 'Plan status',
  'inbox.plans.filter.all': 'All plans',
  'inbox.plans.filter.open': 'Waiting for decision',
  'inbox.plans.filter.executed': 'Executed',
  'inbox.plans.filter.voided': 'Voided',
  'inbox.plans.filter.expired': 'Expired',
  'inbox.plans.loadFailed': 'Unable to load your plans',
  'inbox.plans.loadOneFailed': 'Unable to load this plan',
  'inbox.plans.empty': 'No plans yet',
  'inbox.plans.emptyDescription':
    'Changes an agent proposes in your conversations, and executors suggested to you, show up here for you to decide.',
  'inbox.plans.noMatch': 'No plans with this status',
  'inbox.plans.noMatchDescription':
    'Clear the filter to see all the plans you decide.',
  'inbox.plans.clearFilter': 'Clear filter',
  'inbox.plans.noneOpen': 'No plans waiting for you',
  'inbox.plans.nothingSelected': 'Select a plan to see its changes',
  'inbox.emptyDescription':
    'Approval requests and updates on your issues show up here.',
  'inbox.headerPending': 'Inbox, {{count}} waiting',
  'inbox.headerUnread': 'Inbox, {{count}} unread',
  'inbox.pendingBadgeHint':
    '{{count}} decisions waiting, not the unread count; it goes down once they are handled.',
  'inbox.unreadBadgeHint':
    '{{count}} unread, with no decision waiting on you; it goes down as you read them.',
  'inbox.types.approval_requested': 'Approval requested',
  'inbox.types.approval_decided': 'Approval decided',
  'inbox.types.owner_notified': 'Status change',
  'inbox.text.approval_requested':
    '{{identifier}} waits for your approval to move to {{status}}',
  'inbox.text.approval_decided.approved':
    '{{identifier}} moved to {{status}}: approved',
  'inbox.text.approval_decided.rejected':
    '{{identifier}}: moving to {{status}} was rejected',
  'inbox.text.owner_notified': '{{identifier}} is now {{status}}',
  'inbox.types.dependency_released': 'Unblocked',
  'inbox.types.batch_done': 'Stage done',
  'inbox.text.dependency_released':
    '{{releasedByIdentifier}} is done; {{identifier}} can start',
  'inbox.text.batch_done': 'All sub-issues of {{identifier}} are finished',
  'inbox.text.batch_done_stage':
    'Stage {{stage}} of {{identifier}} is finished',
  'inbox.types.commented': 'New comment',
  'inbox.types.mentioned': 'Mentioned',
  'inbox.types.status_changed': 'Status changed',
  'inbox.types.owner_assigned': 'You are the owner',
  'inbox.types.executor_assigned': 'Assigned to you',
  'inbox.types.executor_suggested': 'Suggested executor',
  'inbox.text.commented': '{{actor}} commented on {{identifier}}',
  'inbox.text.commented_many': '{{count}} new comments on {{identifier}}',
  'inbox.text.mentioned.comment':
    '{{actor}} mentioned you in a comment on {{identifier}}',
  'inbox.text.mentioned.description':
    '{{actor}} mentioned you in {{identifier}}',
  'inbox.text.status_changed': '{{actor}} moved {{identifier}} to {{status}}',
  'inbox.text.owner_assigned': '{{actor}} made you the owner of {{identifier}}',
  'inbox.text.executor_assigned':
    '{{actor}} made you the executor of {{identifier}}',
  'inbox.text.executor_suggested':
    '{{agentName}} is suggested to execute {{identifier}}',
  'inbox.someone': 'Someone',
  'inbox.titles.approval_requested': 'Status change waiting for approval',
  'inbox.outcomes.retried': 'Retried',
  'inbox.outcomes.reassigned': 'Given to a person',
  'inbox.outcomes.cancelled': 'Not retried',
  'inbox.runFailed.retry': 'Retry',
  'inbox.runFailed.reassign': 'Give to a person',
  'inbox.runFailed.reassignTitle': 'Who takes the issue over?',
  'inbox.runFailed.pickPerson': 'Search people',
  'inbox.runFailed.reassignConfirm': 'Make executor',
  'inbox.runFailed.cancel': "Don't retry",
  'inbox.runFailed.forbidden':
    "Only the issue's owner or someone who may edit it decides here.",
  'inbox.runFailed.done.retry': 'The agent is trying again.',
  'inbox.runFailed.done.reassign': '{{name}} is now the executor.',
  'inbox.runFailed.done.cancel': 'The run will not be retried.',
  'inbox.outcomes.stale': 'No longer applies',
  'inbox.outcomes.accepted': 'Accepted',
  'inbox.outcomes.dismissed': 'Dismissed',
  'inbox.outcomes.superseded': 'Replaced',
  'inbox.outcomes.expired': 'Expired',
  'inbox.outcomes.changesRequested': 'Sent back',
  'inbox.outcomes.moved': 'Moved on',
  'inbox.types.design_review': 'Design proposal to review',
  'inbox.text.design_review':
    'The design proposal for {{identifier}} is waiting for your review',
  'design.tag': 'Proposal',
  'design.title': 'Design proposal',
  'design.cardTitle': 'The design proposal for {{identifier}}',
  'design.waiting': 'Waiting for review',
  'design.by': '{{name}}, {{time}}',
  'design.expand': 'Show the whole proposal',
  'design.collapse': 'Show less',
  'design.approve': 'Approve for development',
  'design.requestChanges': 'Send back',
  'design.done.approve': 'Approved. The issue moves to development.',
  'design.done.requestChanges':
    'Sent back. The agent revises the proposal from your comment.',
  'inbox.suggestion.accept': 'Accept',
  'inbox.suggestion.dismiss': 'Dismiss',
  'inbox.suggestion.done.accept': 'Accepted. The agent works on the issue now.',
  'inbox.suggestion.done.dismiss': 'Dismissed.',
  'inbox.suggestion.failed':
    'The suggestion could not be applied; the issue changed meanwhile.',
  'inbox.suggestion.gone': 'This suggestion no longer applies.',
  'inbox.suggestion.forbidden': "Only the issue's owner decides here.",
  'inbox.openIssue': 'Open issue',
  'inbox.owner': 'Owner',
  'inbox.request.move':
    '{{actor}} asks to move the status from {{from}} to {{to}}.',
  'inbox.request.done.approved': 'Approved.',
  'inbox.request.done.rejected': 'Rejected.',
  'inbox.request.done.stale':
    'The request no longer applies: the issue changed meanwhile.',
  'inbox.request.gone': 'This request has been handled.',
  'inbox.request.forbidden':
    'You are not an approver of this request, so you cannot decide it here.',
  'inbox.request.conflict': 'This decision was already made.',
  'inbox.request.change': 'Change',
  'inbox.request.requester': 'Requested by',
  'inbox.request.approvers': 'Approvers',
  'inbox.request.since': 'Requested',
  'inbox.recent': 'Latest activity',
  'inbox.body.status_changed':
    '{{actor}} changed the status from {{from}} to {{to}}.',
  'inbox.body.batch_done': 'All sub-issues are done.',
  'inbox.body.batch_done_stage': 'Stage {{stage}} of the sub-issues is done.',
  'inbox.body.dependency_released':
    '{{identifier}} is done, so this issue can start.',
  'inbox.body.commented': '{{actor}} commented.',
  'inbox.body.mentioned': '{{actor}} mentioned you.',
  'inbox.body.owner_assigned': '{{actor}} made you the owner.',
  'inbox.body.executor_assigned': '{{actor}} assigned it to you.',
  'inbox.body.executor_suggested':
    '{{identifier}} entered {{status}}, whose workflow suggests {{agentName}} as the executor. Accept to hand it over.',
  'inbox.body.approval_approved': 'Approved: moved to {{to}}.',
  'inbox.body.approval_rejected': '{{actor}} rejected moving it to {{to}}.',
  'inbox.here.title': 'Waiting for you',
  'inbox.here.viewInInbox': 'View in inbox',
  'inbox.here.design': 'Review the proposal below',
  'inbox.types.agent_blocked': 'Agent blocked',
  'inbox.titles.agent_blocked': 'Agent blocked: needs your input',
  'inbox.text.agent_blocked': '{{actor}} is blocked on {{identifier}}',
  'inbox.body.agent_blocked': '{{actor}} is blocked and needs your input.',
  'inbox.blocked.question': '{{actor}} asks:',
  'inbox.blocked.answer': 'Reply',
  'inbox.blocked.answerTitle': 'Reply to the agent',
  'inbox.blocked.answerPlaceholder':
    'Your answer goes on the issue as a comment, and the agent picks it up.',
  'inbox.blocked.send': 'Send',
  'inbox.blocked.unblock': 'Unblock to',
  'inbox.blocked.unblockHint':
    'Move the issue back to where the agent was working, so it goes on.',
  'inbox.blocked.reassign': 'Reassign',
  'inbox.blocked.forbidden':
    "Only the issue's owner or someone who may edit it decides here.",
  'inbox.blocked.done.answer': 'Sent. The agent picks up your answer.',
  'inbox.blocked.done.unblock': 'Unblocked. The agent goes on.',
  'inbox.blocked.done.reassign': 'Reassigned.',
  'inbox.types.pr_merged': 'PR merged',
  'inbox.text.pr_merged': '{{identifier}}: {{repo}}#{{number}} was merged',
  'inbox.body.pr_merged': 'PR {{repo}}#{{number}} was merged.',
  'inbox.body.pr_merged_by': '{{actor}} merged PR {{repo}}#{{number}}.',
  'inbox.types.approval_stale': 'Approval no longer applies',
  'inbox.text.approval_stale':
    '{{identifier}}: moving to {{status}} was approved but no longer applies',
  'inbox.body.approval_stale':
    'Moving to {{to}} was approved, but it no longer meets its entry conditions.',
  'inbox.body.approval_stale_why':
    'Moving to {{to}} was approved, but it no longer meets its entry conditions: {{message}}',
  'inbox.body.approval_agent_approved':
    'The move the agent asked for was approved: moved to {{to}}.',
  'inbox.body.approval_agent_rejected':
    'The move to {{to}} the agent asked for was rejected.',
  'inbox.outcomes.answered': 'Answered',
  'inbox.outcomes.unblocked': 'Unblocked',
  'inbox.outcomes.upgraded': 'Upgraded',
  'inbox.outcomes.issueMoved': 'Issue moved on',
  'inbox.outcomes.reopened': 'Issues reopened',
  'inbox.types.run_failed_final': 'Run failed',
  'inbox.types.stage_action_problem': 'Stage action skipped',
  'inbox.titles.run_failed_final': 'Run failed: what next?',
  'inbox.text.run_failed_final':
    '{{agentName}} could not finish {{identifier}}',
  'inbox.text.stage_action_problem':
    'A stage action of {{identifier}} was skipped',
  'inbox.body.run_failed_final':
    'The run failed after {{attempts}} attempts ({{reason}}). Retry it, give the issue to a person, or leave it.',
  'inbox.body.stage_action_problem':
    '"{{rule}}" in {{status}} was skipped: {{why}}.',
  'inbox.stageRules.runAgent': 'Run agent',
  'inbox.stageRules.suggestExecutor': 'Suggest executor',
  'inbox.stageSkips.ownerCannotInvoke':
    'the owner may not give work to the agent',
  'inbox.stageSkips.noAgentExecutor':
    'no executor is assigned. Assign one and it starts at once',
  'inbox.stageSkips.agentUnavailable': 'the agent is archived or deleted',
  'inbox.stageSkips.cannotInvoke':
    'the person who moved the issue may not wake the agent',
  'inbox.stageSkips.suppressed':
    'too many runs started for this status recently',
  'inbox.chime.label': 'Sound reminder',
  'inbox.chime.hint': 'Chime when a new decision waits for you.',
  'common.cancel': 'Cancel',
  runFailureReasons: {
    runnerOffline: 'Runtime offline',
    leaseExpired: 'Lease expired',
    startTimeout: 'Did not start',
    cancelled: 'Cancelled',
    idleTimeout: 'Idle too long',
    setupFailed: 'Setup failed',
    checkoutFailed: 'Checkout failed',
    cliUnavailable: 'CLI unavailable',
    toolAuth: 'Tool not signed in',
    toolQuota: 'Tool quota',
    toolRateLimit: 'Tool rate limit',
    toolNetwork: 'Tool network',
    toolProcess: 'Tool crashed',
    contextOverflow: 'Context overflow',
    queuedExpired: 'Queue expired',
    modelUnavailable: 'Model unavailable',
    stepLimit: 'Too many tool calls',
    unknown: 'Unknown',
  },
  /** What Studio contributes to the agents plugin's pages and the projects plugin's workflow editor. */
  studioAgents: {
    principalKinds: { agent: 'Agent' },
    workflowTemplates: {
      software: 'Software development',
      softwareDescription:
        'The Solution designer analyses and proposes in Analysis; the Proposal reviewer reviews the proposal and passes it on or sends it back, to UI review (前端评审) when it changes the interface, where the Frontend designer passes it on or sends it back; the issue’s executor works in In progress and the Code reviewer comments on the pull request in In review. An issue moves to Done once its pull requests are merged. To capture lessons into the knowledge base, add a Retrospective rule to Done.',
    },
    /**
     * The 软件开发 (software) template's owner notices, for its notifyOwner rules to name as
     * `{ key: 'studioAgents.templateMessages.<name>', ns: 'studio', defaultValue }`.
     */
    templateMessages: {
      inReview:
        'Review the change and merge its pull request: the issue moves to Done once it is merged (check any required checklist items first). Or move it back to In progress with a comment.',
    },
    /** The template's ways to start an issue (its startOption rules), named the same way. */
    templateStarts: {
      backlogLabel: 'Plan later',
      backlogHint:
        'The issue waits in Backlog. Nothing starts until it leaves Backlog.',
      developLabel: 'Straight to development',
      developHint:
        'For a small change with clear bounds: the agent implements it right away.',
      designLabel: 'Design first',
      designHint:
        'The agent analyses and submits a design proposal; development starts once you approve it.',
    },
    subjects: { issue: 'Issue', project: 'Project', intake: 'Intake with AI' },
    triggers: {
      assigned: 'Assigned',
      mention: 'Mention',
      reply: 'Reply',
      comment: 'Comment',
      statusChange: 'Status change',
      ownerChanged: 'Owner change',
      projectChanged: 'Moved to another project',
      unblocked: 'Unblocked',
      subtasksFinished: 'Sub-issues done',
      stageEntered: 'Workflow stage',
      planDecided: 'Plan decided',
      prChecksFailed: 'Checks failed',
      prConflict: 'Pull request conflict',
      retrospective: 'Retrospective',
      intake: 'Intake with AI',
    },
    sources: { askAgent: 'Ask agent', intake: 'Intake' },
    scopes: {
      project: 'Project',
      projectDescription:
        'Variables and default skills every run in the project gets.',
      workdir: 'Working directory',
      workdirDescription:
        'Variables and default skills every run in one of a project’s working directories gets.',
    },
    scopeSections: {
      projectVariables:
        'Given to every agent working in this project. A working directory’s own variables, then the agent’s, win over these.',
      workdirVariables:
        'Given to every agent working in this directory, over the project’s. The agent’s own variables win over these.',
      projectSkills:
        'Every agent working in this project gets these skills too.',
      workdirSkills:
        'Every agent working in this directory gets these skills too.',
    },
    actionGroups: {
      studio: {
        reports: 'Reports',
        git: 'Git',
        previews: 'Previews',
        admin: 'Administration',
      },
    },
    actions: {
      studio: {
        'reports/read': 'Read reports and metrics',
        'git/open-pr': 'Open and link pull requests',
        'previews/manage': 'Manage previews: logs, take down, retry',
      },
    },
    actionDescriptions: {
      studio: {
        'reports/read':
          'Read the Reports page’s metrics and usage for the person who woke it.',
        'git/open-pr':
          'Open pull requests for its work and link them to the issue.',
        'previews/manage':
          'Read preview logs, take previews down and retry them.',
      },
    },
    actionReasons: {
      pm: {
        'projects/delete':
          'deleting a project and its issues is a person’s decision.',
        'issues/moderate-comments':
          'removing other people’s comments is a person’s call.',
        general: 'project settings decide how everyone works.',
        labels: 'labels are shared by everyone’s work.',
        workflows: 'workflows decide how every issue moves.',
        members: 'membership and roles decide who may do what.',
      },
      agents: {
        'agents/edit':
          'an agent may not change agents or skills, including its own.',
        agents: 'an agent may not administer agents, including itself.',
        runners: 'runtimes run every agent’s work.',
        prices: 'model prices are set by a person.',
        services: 'model services hold the provider keys agents run with.',
      },
      rel: {
        'apps/create': 'people create the Apps agents deploy to.',
        'apps/configure': 'an App’s configuration may hold secrets.',
        'apps/upload': 'releases come from a build, not from an agent.',
        'apps/deploy-protected':
          'only a person approves a deployment to a protected environment.',
        'apps/operate': 'starting and stopping Apps is left to people.',
        'apps/delete': 'deleting an App and its data is a person’s decision.',
        environments: 'environments hold the credentials deployments use.',
      },
      kb: {
        'knowledge/edit':
          'agents propose changes; a person reviews and accepts them.',
        'knowledge/manage': 'who may read knowledge is decided by a person.',
      },
      studio: {
        apiKeys: 'keys act for the workspace outside any run.',
        personalApiKeys: 'an agent does not mint keys.',
        git: 'connections hold the workspace’s code host credentials.',
        knowledgeSearch: 'how knowledge is searched is set up by a person.',
      },
    },
    references: {
      label: 'Mentioned in this reply',
      project: 'Project',
      knowledge: 'Knowledge',
    },
    activity: {
      executorWaits:
        'made {{name}} the executor; it starts when the issue enters In progress',
    },
    presets: {
      projectLead: {
        name: 'Project lead',
        description:
          'Plans the work, splits issues into deliverable parts, coordinates who does them and answers questions; hands development to the developers and complex designs to the Solution designer.',
      },
      projectAssistant: {
        name: 'Project assistant',
        description:
          'Answers questions about projects and issues, keeps the work organized, and turns requests into issues and plans for you to confirm.',
      },
      solutionDesigner: {
        name: 'Solution designer',
        description:
          'Analyses issues and writes the design proposal, recommending which developer should build it. Does not write code.',
      },
      proposalReviewer: {
        name: 'Proposal reviewer',
        description:
          'Reviews design proposals, comments its findings, and passes approved ones on to UI review or development. Does not write code.',
      },
      seniorDeveloper: {
        name: 'Senior developer',
        description:
          'Builds changes that need design judgement: across modules, migrations and security-related work, through to a pull request.',
      },
      developer: {
        name: 'Developer',
        description:
          'Builds small changes with clear bounds, such as fixes, UI touch-ups and added tests, through to a pull request.',
      },
      frontendDesigner: {
        name: 'Frontend designer',
        description:
          'Reviews the interface side of approved proposals: interaction flow, components and design system, themes and dark mode, mobile widths and accessibility. Does not write code.',
      },
      codeReviewer: {
        name: 'Code reviewer',
        description:
          'Reviews the pull requests of issues handed over for review, and comments its findings. Does not write code.',
      },
    },
    delegation: {
      events: {
        finished: '{{identifier}} · {{agent}} finished',
        needsInput: '{{identifier}} · {{agent}} needs your input',
        inReview: '{{identifier}} · {{agent}} asks for review',
        failed: '{{identifier}} · {{agent}} could not finish',
        issueClosed: '{{identifier}} is {{status}}',
        prOpened: '{{identifier}} has a pull request',
      },
      pullRequest: 'PR #{{number}} {{title}}',
      stopFollowing: 'Stop following',
      followAgain: 'Follow again',
      notFollowing: 'Not following',
    },
    news: {
      planDecided: {
        executed: 'The operation plan “{{title}}” was executed.',
        failed:
          'The operation plan “{{title}}” failed; nothing of it was applied.',
        stale:
          'The operation plan “{{title}}” was not executed: something it changes was changed meanwhile.',
        undone: 'The operation plan “{{title}}” was undone.',
      },
    },
    stageRules: {
      agent: 'Agent',
      agentsUnavailable:
        'You cannot list agents here; the rule keeps the agent it names.',
      assign: 'Make it the executor',
      assignHint:
        'Off: the agent runs once (a reviewer, say) and the issue keeps its executor.',
      chooseAgent: 'Choose an agent',
      currentExecutor: 'The issue’s agent executor',
      instruction: 'Stage instruction',
      instructionHint:
        'Becomes the workflow stage instruction of the run. Placeholders: {{placeholders}}',
      instructionPlaceholder:
        'Optional: what the agent should do in this stage',
      reason: 'Reason (optional)',
      runAgent: 'Run agent',
      maxRuns: 'Maximum runs (optional)',
      windowHours: 'Window in hours (optional)',
      limitHint:
        'Defaults to 3 runs in 24 hours and applies only to entries caused by agents or the system. Only started runs count; environment failures and cancelled runs are excluded. A person moving the issue always wakes the agent and restarts the count.',
      withLimit:
        '{{summary}} · Up to {{maxRuns}} agent-driven runs in {{windowHours}} hours',
      limitReached: 'Automatic stage runs paused',
      continue: 'Continue',
      continueHint:
        'This status reached {{maxRuns}} runs in {{windowHours}} hours. Continue to start the agent once and restart the count.',
      continued: 'Stage run continued',
      continueStale: 'This action has changed. Refresh the issue.',
      continueFailed:
        'Could not continue. Check the agent and issue blockers, then retry.',
      continueInIssue: 'Continue on the issue',
      runAgentAgent: 'Runs {{agent}} as the executor',
      runAgentCurrent: 'Runs the issue’s agent',
      runAgentHint:
        'Entering this status wakes the agent without the owner’s confirmation. The loop guard applies only to entries caused by agents or the system and defaults to 3 runs per issue and status in 24 hours; a person moving the issue is never stopped.',
      runAgentWithoutAssign: 'Runs {{agent}} once, keeping the executor',
      suggestExecutor: 'Suggests {{agent}} as the executor to the owner',
      suggestExecutorHint:
        'Proposes an operation plan in the owner’s inbox, and notifies them: once they execute it, the agent becomes the executor and starts working.',
      suggestExecutorTitle: 'Suggest executor',
      suggestNoAgent: 'Suggests an executor to the owner (no agent chosen)',
      unknownAgent: 'an agent you cannot see',
      withInstruction: '{{summary}}: {{instruction}}',
    },
  },
  pmChat: {
    askAgent: {
      drafts: {
        issue: 'Where does this issue stand, and what should happen next?',
        project: 'Summarize this project’s progress and risks.',
        inbox: 'What does this notification need from me?',
      },
    },
    filters: {
      search: 'search “{{value}}”',
      project: 'a project',
      label: 'label',
      owner: 'owner: {{name}}',
      executor: 'executor: {{name}}',
      someone: 'someone',
    },
    plans: {
      suggestTitle: 'Let {{agent}} work on {{identifier}}',
      suggestDescription:
        '{{identifier}} ({{title}}) entered {{status}}, whose workflow suggests {{agent}} as the executor.',
      suggestDescriptionReason:
        '{{identifier}} ({{title}}) entered {{status}}, whose workflow suggests {{agent}} as the executor: {{reason}}',
    },
    intake: {
      organize: 'Let an agent organize',
      waiting: 'The agent is organizing…',
      startFailed: 'Could not hand these requirements to an agent',
      retry: 'Try organizing again',
      tooLong:
        'The requirements and files are too long for one message. Shorten the text or remove some files, then try again.',
      requestFailed:
        'The request failed. Your requirements are still here; check your connection and try again.',
      noAgent:
        'No usable default agent is configured. Choose a default agent in your account preferences, or ask an administrator to configure the team default, then try again.',
      modelMissing:
        'The selected online agent has no model configured. Ask an administrator to configure its model in Agent team, then try again.',
      modelUnavailable:
        'The selected online agent’s model is unavailable. Ask an administrator to check its model service and enabled models, then try again.',
      noRunner:
        'No suitable online runtime can run this agent for you. Check runtime status, tool sign-in and sharing policy in Agent team, then try again.',
      agentUnavailable:
        'The selected agent is unavailable or you cannot invoke it. Choose another default agent or ask an administrator to check its access, then try again.',
      runNotStarted:
        'The agent could not start or was cancelled before the handoff. Check the agent and try again.',
      sessionEnded:
        'Your session has ended. Sign in again to organize these requirements.',
      forbidden:
        'You cannot invoke this agent. Ask an administrator to check your access.',
      chatUnavailable:
        'Chat is unavailable. Ask an administrator to enable chat before organizing with an agent.',
      filesOnly: 'The requirements are in the files below.',
      conversationTitle: 'Organize: {{text}}',
    },
  },
  // Issue previews, CI builds, a repository's linked Apps and deployment marks, with the card suggesting to reopen
  // what a deployment no longer runs.
  previews: previewsEnUS,
  deploys: deploysEnUS,

  // Studio's pull requests (`client/git`).
  studioGit: gitEnUS,
  accountSettings: accountSettingsEnUS,
  preferences: preferencesEnUS,
  knowledge: knowledgeEnUS,
  issuesPage: issuesEnUS,
  projectPage: projectPageEnUS,
  // A repository's "Deployment" (`client/releases/ci-setup`).
  ciSetup: ciSetupEnUS,
  knowledgeRules: {
    retrospective: 'Retrospective',
    retrospectiveHint:
      'Entering this status wakes the agent to look back on the issue: it checks the user manual first, then proposes what else is worth keeping. It does not become the executor.',
    retrospectiveAgent: 'Wakes {{agent}} for a retrospective',
    retrospectiveCurrent: 'Wakes the issue’s agent for a retrospective',
  },
};

/**
 * The shape every locale of this application follows, derived from the English wording above.
 *
 * Anything a plugin does not translate falls back to this namespace, so a term defined here is reused everywhere
 * without each plugin repeating it.
 */
export type AppResource = LocaleResource<typeof enUS>;

export default enUS;
