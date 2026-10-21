import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    settings: 'System settings',
    foundation: 'App foundation',
  },
  page: {
    title: 'App foundation',
    description:
      'Your application focuses on business. Data, permissions and workflows are supported by NocoBase Core: common capabilities developed, tested and maintained by NocoBase, and upgraded with official releases.',
    bandTitle: 'NocoBase Core',
    bandDescription:
      'The capabilities this application uses light up in turn. Select one to see what it does here.',
    score: '{{active}} / {{total}}',
    scoreCaption: 'capabilities support this application',
    refresh: 'Refresh',
    refreshing: 'Collecting…',
    updatedAt: 'Collected {{time}}',
    loading: 'Collecting what this application uses…',
    refreshFailed:
      'The latest refresh failed. Showing the last successfully collected result.',
    loadFailed: 'The overview could not be loaded.',
    forbidden:
      'Only an administrator with unrestricted access can view the App foundation.',
    retry: 'Try again',
    undetermined_one: '{{count}} capability could not be determined',
    undetermined_other: '{{count}} capabilities could not be determined',
    highlightsLabel: 'Key numbers',
    unavailable: 'Not available',
    lowerBound: 'At least this many: part of it could not be read.',
  },
  matrix: {
    collections: 'Data collections: {{names}}',
    title: 'Business modules and foundation capabilities',
    description:
      'See which foundation capabilities support each module. Select a checkmark to see the connection and what you would need to build yourself.',
    modules: 'Business modules',
    summary: 'Capabilities: {{count}} · Pages: {{pages}}',
    inspect: 'Inspect {{module}} × {{capability}}',
    unknown: 'Not identified',
    empty:
      'No business module has been discovered yet. Modules appear here as pages and navigation are added.',
    legend:
      '✓ Identified integration; · no connection identified. Code references describe dependencies, not execution counts.',
    partial:
      'Some page dependencies could not be read; their confirmed connections are still shown.',
    evidence: {
      page: 'Page registered in the application',
      authentication: 'Sign-in required by the page',
      authorization: 'Page access controlled by permissions',
      provider: 'Page contributed by this provider',
      source: 'Provider referenced by page code',
      apiSource: 'Provider referenced by a matched API handler',
    },
  },
  inventory: {
    recognitionNotes: 'Recognition notes',
    title: 'Capabilities and providers',
    description:
      'Capabilities reflect the current application and its registered Core, official and Pro plugins and application extensions.',
    discovered: 'provider packages discovered',
    mapped: 'classified provider packages',
    unmapped: 'awaiting classification',
    partial: 'Discovery is incomplete. Could not read: {{sources}}.',
    selectedCategory: 'Providers for {{category}}',
    usageBoundary:
      'These packages are associated with this category. The usage status above describes the category as a whole; it does not mean every listed package is enabled, configured or in use.',
    noCategoryProviders:
      'No provider recognized by the current catalog was found for this category.',
    extensionsTitle: 'Additional providers · awaiting recognition',
    extensionsDescription:
      'Discovered providers without a category stay visible here. Their capabilities and use need identification; they are not automatically counted as integrations or marked unused.',
    noExtensions:
      'No additional provider was found within the current discovery scope.',
    discoveryBoundary:
      'Scope: direct application dependencies, known provider packages and owners of public database, forwarded API and browser-observed client contributions. This does not enumerate every runtime contribution, transitive extension or application-local module. Source and Pro edition need a trusted catalog entry; package names and licenses alone are not verification.',
    versionUnknown: 'Version unavailable',
    origin: 'Source',
    officialCatalog: 'NocoBase catalog',
    unverifiedOrigin: 'Source unverified',
    installation: 'Installation',
    installed: 'Manifest found',
    manifestUnavailable: 'Manifest unavailable',
    registration: 'Registration',
    observed: 'Current runtime contribution observed',
    registrationUnknown: 'Not confirmed · does not mean disabled',
    evidence: 'Evidence',
    noEvidence: 'None confirmed',
    categories: 'Categories',
    awaitingRecognition: 'Awaiting classification',
    evidenceLabels: {
      manifest: 'Installed package manifest',
      databaseContribution: 'Database task contribution',
      apiContribution: 'Forwarded API contribution',
      foundationRuntime: 'Foundation service running',
      clientContribution: 'Browser-observed client contribution',
      serverRegistration: 'Server plugin registration',
    },
  },
  status: {
    active: 'In use',
    needsSetup: 'Ready, needs setup',
    unused: 'Not used yet',
    undetermined: 'Undetermined',
    legendActive: 'In use here {{count}}',
    legendNeedsSetup: 'Ready, needs setup {{count}}',
    legendUnused: 'Not used yet {{count}}',
  },
  detail: {
    collectionCount: '{{count}} collections',
    collectionPreview: 'Collection preview',
    collectionsTitle: 'Collections',
    noCollectionMatches: 'No matching collections',
    noCollectionMatchesHint: 'Try another name or clear the search.',
    collectionRange: 'Showing {{from}}–{{to}} of {{total}}',
    closeCollections: 'Close collections',
    viewCollections: 'View all collections',
    searchCollections: 'Search collections',
    collectionResults: '{{count}} matching collections',
    previousPage: 'Previous',
    nextPage: 'Next',
    countRecords: 'Count business records',
    recordsOnDemand:
      'Business record totals are counted on demand. Large databases may take longer.',
    recordsCountedAt: 'Records counted {{time}}',

    businessModules: 'Connected business modules',
    inThisApp: 'In this application',
    withoutFoundation: 'Without the foundation',
    onceInUse: 'Once in use',
    whyNot: 'Why it is not in use',
    liveData: 'Live data',
    parts: 'What it consists of',
    packages: 'Provided by NocoBase packages',
    noPackages: 'No package of this capability is installed.',
    noFacts: 'Nothing established yet.',
    partial:
      'Part of the evidence could not be read; the values marked as lower bounds count only what was read.',
    failed:
      'This capability could not be examined this time, so it has no status. Refresh to try again.',
    unreadable: 'Could not read: {{sources}}',
    timeout: 'Examining it took too long.',
  },
  capabilities: {
    dataModeling: {
      name: 'Data modeling',
      tagline: 'Collections, fields, relations and migrations',
      without:
        'Writing schema changes by hand, building queries, filters and paging, guarding against injection, and keeping every database dialect working.',
      onceInUse:
        'Every Collection is defined by a migration and read through one query interface, on any supported database.',
    },
    files: {
      name: 'File management',
      tagline: 'Uploads, storage and attachments',
      without:
        'Writing uploads, storage adapters, size and type checks and download links for every place that takes a file.',
      onceInUse:
        'Upload, store and serve attachments through one file Collection contract and the configured storage.',
    },
    usersAndOrganizations: {
      name: 'Users & organizations',
      tagline: 'Accounts, sign-in and invitations',
      without:
        'Building sign-up, sign-in, sessions, password reset and account administration, and keeping them secure.',
      onceInUse:
        'Accounts, sign-in and invitations are ready; the people of the application are managed in one place.',
    },
    permissions: {
      name: 'Permissions',
      tagline: 'Permission sets, sharing and restriction rules',
      without:
        'Checking access in every endpoint by hand, with no single place to see or change who may do what.',
      onceInUse:
        'Grant pages, data and actions through permission sets, enforced on the server for every request.',
    },
    workflows: {
      name: 'Workflows & approvals',
      tagline: 'Lifecycles, transitions and schedules',
      without:
        'Hand-written status fields and transitions, with no record of who moved what, and retries and timeouts built again each time.',
      onceInUse:
        'Model a business process as a lifecycle: guarded transitions, a full history and effects that retry on their own.',
    },
    aiAgents: {
      name: 'AI & agents',
      tagline: 'Model services, agents and runners',
      without:
        'Integrating each model provider, storing keys, recording usage and running agents safely, all by hand.',
      onceInUse:
        'Use enabled model services for OnlineAgent and model gateway calls, or register runners for agent execution.',
    },
    knowledge: {
      name: 'Knowledge base',
      tagline: 'Spaces, documents and retrieval',
      without:
        'Building document storage, versions, access and search before anyone can share what they know.',
      onceInUse:
        'Keep documents in knowledge spaces with versions and access, searchable by people and agents.',
    },
    mail: {
      name: 'Mail',
      tagline: 'Mailboxes, sync and sending',
      without:
        'Connecting each mail provider, syncing folders, handling authorization and retrying sends by hand.',
      onceInUse:
        'Connect mailboxes and read, sync and send mail inside the application.',
    },
    notifications: {
      name: 'Notifications',
      tagline: 'Channels, deliveries and in-app messages',
      without:
        'Writing a sender per channel, with retries, deduplication and delivery records of its own.',
      onceInUse:
        'Send through configured channels with retries, deduplication and a record of every delivery.',
    },
    integrations: {
      name: 'Integrations',
      tagline: 'API keys and external access',
      without:
        'Issuing and checking credentials for every external system that calls the application.',
      onceInUse:
        'External systems call the application with API keys that carry their owner’s permissions.',
    },
    interface: {
      name: 'Interface & configuration',
      tagline: 'Pages, navigation, languages and themes',
      without:
        'Building routing, navigation, translations and theming before the first business page.',
      onceInUse:
        'Pages, menus, languages and themes come from the NocoBase client runtime.',
    },
    audit: {
      name: 'Audit log',
      tagline: 'A record of sensitive operations',
      without:
        'Recording who did what by hand, in every place that changes something important.',
      onceInUse:
        'A record of sensitive operations across the application, kept in one place.',
    },
    operations: {
      name: 'Operations',
      tagline: 'Migrations, jobs, queues and secrets',
      without:
        'Running schema upgrades, background jobs, queues and secret storage with scripts of your own.',
      onceInUse:
        'Upgrades run as recorded migrations, with jobs, queues and secrets provided by the server.',
    },
  },
  reasons: {
    installedNotUsed:
      'Installed, but no current enablement or usage evidence has been identified.',
    noRecognizedAudit:
      'No audit provider is recognized by the current catalog; additional extensions may provide this capability.',
    noDatabase: 'The application runs without a database.',
    notRegistered:
      'The plugin that provides it is not part of this application.',
    notProvided: 'NocoBase Core does not provide it yet.',
    noFileCollection: 'No Collection of the application stores files.',
    noDrive: 'File Collections exist, but no storage is configured.',
    noAccounts: 'The application has no accounts.',
    onlyUnrestrictedAccess:
      'Only the unrestricted administrators have access; no permission set grants anything to anyone else yet.',
    noWorkflows: 'No lifecycle is persisted and no schedule is enabled.',
    noSchedules: 'No schedule is enabled.',
    noModelOrRunner: 'No model service is enabled and no runner is registered.',
    noModelService: 'No model service is enabled.',
    noAgent: 'No agent is defined.',
    noDocuments: 'No document has been added to a knowledge space.',
    noConnectedMailbox: 'No mailbox is connected.',
    noChannel: 'No notification channel is configured.',
    noApiKey: 'No API key exists.',
    noUsedApiKey:
      'API keys exist, but none has been used to call the application.',
    noClient: 'The application serves no NocoBase client.',
    notConfigured: 'Not configured.',
  },
  facts: {
    collectionOwnershipUnknown:
      'An unclassified runtime extension was found. Collection ownership is unconfirmed, so business counts are withheld.',
    noApplicationCollections:
      'The data layer runs the application, which has no Collections of its own yet.',
    applicationCollectionsPreview:
      'This application has {{count}} collections, including {{names}}.',
    applicationCollections:
      '{{count}} Collections of the application’s own: {{names}}.',
    relations: '{{count}} relations connect them.',
    fileCollections: '{{count}} file Collections: {{names}}.',
    accounts: '{{count}} accounts sign in through NocoBase authentication.',
    permissionSets:
      '{{count}} permission sets besides the unrestricted one: {{names}}.',
    accessRules: '{{count}} sharing, restriction or default access rules.',
    lifecyclesWithoutTransitions:
      'The lifecycle store is in place; no record has moved through a lifecycle yet.',
    lifecycles:
      '{{count}} lifecycles have recorded {{transitions}} transitions: {{names}}.',
    schedules: '{{count}} schedules are enabled.',
    modelServices:
      '{{count}} enabled model services support OnlineAgent and model gateway calls.',
    runners: '{{count}} registered runners support agent execution.',
    agents: '{{count}} agents, {{runs}} runs so far.',
    documents: '{{count}} documents in knowledge spaces.',
    mailboxes: '{{count}} mailboxes are connected.',
    mailboxesNeedAttention:
      '{{count}} mailboxes need someone to act before they sync again.',
    channels: '{{count}} notification channels: {{names}}.',
    usedApiKeys: '{{count}} API keys have been used to call the application.',
    locales: 'Offered in {{count}} languages: {{names}}.',
    migrations:
      '{{count}} migrations have run, {{own}} of them the application’s own.',
    latestMigration: 'The latest ran at {{at}}.',
    registeredExtension: 'The extension is registered in this application.',
  },
  parts: {
    accounts: 'Accounts',
    organizations: 'Organizations',
    permissionSets: 'Permission sets',
    sharingRules: 'Sharing rules',
    restrictionRules: 'Restriction rules',
    defaultAccess: 'Default access',
    lifecycles: 'Lifecycles',
    schedules: 'Schedules',
    modelServices: 'Model services',
    agents: 'Agents',
    runners: 'Runners',
    migrations: 'Migrations',
    jobs: 'Jobs',
    queue: 'Queue',
    secrets: 'Secrets',
    caching: 'Caching',
  },
  metrics: {
    businessRecords: 'business records',
    businessCollections: 'business Collections',
    views: 'views',
    fields: 'fields',
    relations: 'relations',
    systemCollections: 'NocoBase system Collections',
    files: 'files',
    storedBytes: 'stored, as recorded',
    fileCollections: 'file Collections',
    accounts: 'accounts',
    disabledAccounts: 'disabled accounts',
    invitations: 'invitations',
    grants: 'grants',
    permissionSets: 'permission sets',
    assignments: 'assignments',
    sharingRules: 'sharing rules',
    restrictionRules: 'restriction rules',
    defaultAccess: 'default access rules',
    transitions: 'state transitions',
    lifecycles: 'lifecycles with transitions',
    effectsSucceeded: 'effects succeeded',
    effectsFailed: 'effects failed',
    effectsPending: 'effects waiting',
    schedules: 'enabled schedules',
    scheduleOccurrences: 'schedule occurrences',
    agents: 'agents',
    modelServices: 'enabled model services',
    runners: 'runners',
    runs: 'runs',
    modelCalls: 'model calls outside runs',
    tokens: 'tokens',
    documents: 'documents',
    spaces: 'knowledge spaces',
    chunks: 'chunks',
    connectedMailboxes: 'connected mailboxes',
    mailboxesNeedAttention: 'mailboxes needing attention',
    messages: 'messages',
    submissions: 'messages submitted for sending',
    failedSubmissions: 'sends failed',
    acceptedDeliveries: 'deliveries accepted by providers',
    notifications: 'notifications',
    deliveries: 'deliveries',
    failedDeliveries: 'deliveries failed',
    pendingDeliveries: 'deliveries in flight',
    deliveryAttempts: 'delivery attempts',
    inAppMessages: 'in-app messages',
    inAppMessagesRead: 'in-app messages read',
    channels: 'channels',
    usedApiKeys: 'API keys used',
    apiKeys: 'enabled API keys',
    locales: 'languages',
    migrations: 'migrations run',
    applicationMigrations: 'of the application’s own migrations',
    seeds: 'seeds run',
  },
  dynamic: {
    pending: 'Pending recognition',
    pendingDescription:
      'This plugin is registered. Its configuration and actual use have not yet been determined.',
  },
};

export type FoundationResource = LocaleResource<typeof enUS>;
export default enUS;
