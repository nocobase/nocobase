import { enUS as skillProjectsenUS } from '../pages/skill-projects/locales.js';
import { workflowNamesEnUS } from '../../shared/workflow-names.js';
import type { LocaleResource } from '@nocobase/i18n';

import agentChatEnUS from '#extensions/nocobase-agent-chat/locales/en-US';
import systemEnUS from './system/en-US.js';

const enUS = {
  skillProjects: skillProjectsenUS,
  knowledge: {
    indexing: 'Knowledge indexing',
    title: 'Knowledge base',
    spaces: { default: 'Default knowledge base' },
    chat: {
      title: 'Start knowledge AI chat',
      description: 'Choose how this conversation retrieves knowledge.',
      strategy: 'Knowledge retrieval policy',
      onDemand: 'On-demand retrieval',
      onDemandDescription:
        'Search for internal knowledge or when explicitly requested; greetings and questions independent of the knowledge base may be answered directly.',
      always: 'Retrieve for every question',
      alwaysDescription:
        'Instruct AI to search before answering each new question and disclose missing or insufficient evidence.',
      policyNote:
        'The policy applies throughout the new conversation. It is a model instruction, not an enforced tool-execution guarantee.',
      start: 'Start chat',
      starting: 'Starting…',
      expired: 'Your session has ended. Sign in again to start a conversation.',
      forbidden:
        'You do not have permission to start this conversation. Ask an administrator for access.',
      failed:
        'The conversation could not be created. Check the model configuration and try again.',
      unknown:
        'The result is unknown. A conversation may already exist. Check chat history before starting another one.',
      history: 'Check chat history',
      signIn: 'Sign in again',
      retry: 'Retry',
    },
  },
  aiFormFill: {
    title: 'AI form assistance',
    description: 'Describe your request and let AI help fill the form.',
    draftTitle: 'Purchase request',
    formDescription: 'Tell us what you need to purchase and why.',
    draftOnly: 'Filling demo only. Nothing is submitted or saved.',
    name: 'Purchase item',
    namePlaceholder: 'For example: designer laptops',
    department: 'Requesting department',
    departmentPlaceholder: 'Select a department',
    departments: {
      design: 'Product Design',
      engineering: 'Engineering',
      marketing: 'Marketing',
      admin: 'Administration',
    },
    quantity: 'Quantity',
    quantityPlaceholder: 'Enter quantity',
    budget: 'Estimated total',
    budgetPlaceholder: 'Enter the estimated total',
    currency: 'CNY',
    arrival: 'Expected delivery date',
    arrivalPlaceholder: 'Select a date',
    purpose: 'Purchase purpose',
    purposePlaceholder: 'Describe the use or reason for this purchase',
    openChat: 'AI fill',
    chatHint: 'Describe what to fill in AI chat.',
    unavailable:
      'AI assistance is unavailable. Check the chat and model configuration.',
    hint: 'Try “AI fill” above, or enter the details manually.',
    clear: 'Clear form',
    undo: 'Undo this fill',
    completed: 'Filled {{count}} fields. You can keep editing.',
    retry: 'Retry',
    prompt:
      'Please purchase 3 designer laptops for the Product Design department, with an estimated total of CNY 36,000 and delivery by November 6, 2026. They will be used by new designers for daily design work and prototyping. Fill only the current form; do not submit or save it.',
    askFailed: 'Could not open chat. Check your connection and try again.',
    proposalTitle: 'Form values',
    applying: 'Updating the draft…',
    apply: 'Apply to draft',
    dismiss: 'Dismiss',
    proposalPending: 'Preparing form values…',
    proposalFailed: 'The proposal could not be completed. Send a new request.',
    invalidProposal: 'The proposal is invalid. Request a new proposal.',
    invalidName: 'Enter a name between 1 and 120 characters.',
    invalidBudget: 'Enter a total from 0 to 1,000,000.',
    invalidDraft:
      'Check the quantity (1–10,000), total (0–1,000,000) and other form values before sending.',
    applied: 'Applied to the browser draft. Nothing was saved.',
    dismissed: 'Dismissed. The draft was not changed.',
    stale:
      'The form or draft has changed. Include the current form and generate a new proposal.',
    missingSource:
      'The selected source form is missing or does not match this proposal. Open the source history or generate a new proposal.',
    failed:
      'The draft update could not be confirmed. Review the draft before trying again.',
    partial:
      'Only part of the draft may have changed. Review the draft and generate a new proposal.',
    priority: 'Priority',
    subscribe: 'Receive updates',
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    yes: 'Yes',
    no: 'No',
  },
  structuredExtraction: {
    title: 'AI structured extraction',
    description:
      'Extract key information from text and organize it into an editable form.',
    contactTitle: 'Contact profile',
    contactDescription:
      'Extract contact details, a nested address and a list of skills.',
    orderTitle: 'Purchase order',
    orderDescription:
      'Extract a supplier, contact and up to five purchase items.',
    contactSample:
      'Alex Chen is a product manager at Example Studio in Shanghai, China. Email: alex@example.test; phone: +86 138 0000 0000. Skills: product design, TypeScript, data analysis.',
    orderSample:
      'Please order from Example Supplies. Contact: Morgan Lee, morgan@example.test. Currency: USD. We need 3 keyboards at 49.50 each and 2 monitors at 220 each. Please use recyclable packaging.',
    model: 'Language model',
    selectModel: 'Select a model',
    source: 'Source text',
    result: 'Extracted information',
    extracted: 'Extracted',
    scenarios: 'Extraction examples',
    extract: 'Extract',
    extracting: 'Extracting…',
    localOnly: 'Edit the result directly. Nothing is saved.',
    success: 'Extracted information filled into the form',
    noModels: 'No chat models are available.',
    missingInput: 'Select a model and enter source text.',
    textTooLong: 'Enter no more than 20,000 characters.',
    invalidText: 'Enter between 1 and 20,000 characters.',
    invalidModel: 'This model is unavailable. Select an available model.',
    errorTitle: 'Could not extract information',
    requestFailed:
      'Extraction failed. Check the model configuration and retry manually.',
    timeout:
      'Extraction timed out; the result is unknown. Do not immediately resubmit.',
    forbidden:
      'You do not have permission to use this feature. Contact an administrator.',
    sessionExpired: 'Your session expired. Sign in again.',
    invalidSchema:
      "This demo's output schema is invalid. Check its definition.",
    catalogFailed: 'Could not load models.',
    retry: 'Retry',
    signIn: 'Sign in again',
    emptyItems: 'No items yet. Extract text to fill them in.',
    itemNumber: 'Item {{number}}',
    fields: {
      name: 'Name',
      company: 'Company',
      jobTitle: 'Job title',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      city: 'City',
      country: 'Country',
      skills: 'Skills (comma-separated)',
      supplier: 'Supplier',
      contact: 'Contact',
      currency: 'Currency',
      notes: 'Notes',
      items: 'Items',
      product: 'Product',
      quantity: 'Quantity',
      unitPrice: 'Unit price',
    },
  },
  workflows: {
    operation: 'Operation',
    resultingState: 'Resulting state',
    initialState: 'Initial',
    finalState: 'Final',
    processDescription: 'Workflow description',
    processSummary:
      '{{title}} has {{states}} states and {{transitions}} transitions. The diagram shows how records move between states.',
    initialStates: 'Initial states',
    finalStates: 'Final states',
    stateTransitions: 'State transitions',
    manualTransition: 'User action',
    automaticTransition: 'Automatic',
    noTransitions: 'No state transitions are defined.',
    processDiagram: 'Workflow diagram',

    dragCategory: 'Drag to reorder {{title}}',
    categoryMenu: 'Category menu: {{title}}',
    moveCategoryUp: 'Move up',
    moveCategoryDown: 'Move down',
    savingCategories: 'Saving category changes',
    editCategoryTitle: 'Edit category',
    categoryDialogHelp: 'Choose a name for this workflow category.',
    changeCategory: 'Change category: {{title}}',

    readOnlyParameters:
      'This workflow has configurable parameters. Your access is read-only.',
    unsavedParameters: 'Your parameter changes have not been saved.',
    keepParameterEditing: 'Keep editing',
    discardParameterChanges: 'Discard changes',
    reloadParameterRevision: 'Load latest revision and keep draft',
    nodeParametersDescription:
      'Only parameters associated with this node or transition are shown. Other workflow parameters remain unchanged.',
    workflowParameters: 'Workflow parameters',
    parameterRevision: 'Workflow parameter version {{revision}}',
    parametersTitle: '{{name}} parameters',
    parametersDescription:
      'These settings apply only to this workflow. Existing snapshots remain unchanged.',
    discardParameters: 'Discard unsaved parameter changes?',
    noParameters: 'This workflow has no configurable parameters.',
    addParameterEntry: 'Add entry',
    removeParameterEntry: 'Remove entry',
    saveParameters: 'Save parameters',
    parametersSaved: 'Parameters saved.',
    parametersFailed: 'Could not save parameters.',
    officeRules: {
      removeTitle: 'Remove department “{{name}}”?',
      removeAction: 'Remove department',
      reloadTitle: 'Discard edits and reload?',
      reloadAction: 'Discard and reload',

      invalidDepartmentName:
        'Use a unique department name of 1–100 characters.',
      clerksRequired: 'Select at least one clerk for this department.',
      removeSelectedDepartment:
        'Clear this department from Allowed departments before removing it. Other workflows may also reference it.',

      removeDepartment:
        'Remove shared department “{{name}}”? This affects new dispatch rows in all office workflows. Existing task participants are retained.',
      reloadConfirm:
        'Reload the latest configuration and discard your unsaved workflow and shared department changes?',

      title: 'Dispatch rules',
      help: 'Resolve participants from the shared organization when adding a dispatch row. Existing rows keep their participants.',
      departments: 'Allowed departments',
      allDepartments:
        'No selection allows all shared departments. Selecting departments restricts distribution to those departments.',
      ownDepartment: 'Only allow the department of the current task',
      assigneeRole: 'Default executor role',
      ccHeads: 'Copy department heads by default',
      ccLeaders: 'Copy leaders by default',
      sharedOrganization: 'Shared departments and role members',
      sharedHelp:
        'Shared by incoming documents, clerk tasks and team tasks. Changes apply to new dispatch rows in all three workflows. Maintain role membership here; workflow rules select who receives each task.',
      legacyHelp:
        'Legacy workflow departments are combined here. For duplicate names, incoming settings take precedence, then clerk and team settings. Saving shared departments replaces the legacy sources for future rows.',
      searchPeople: 'Search people for {{role}}',
      noPeople:
        'No additional matching people. Clear the search to show selected members only.',
      invalidOrganization: 'Check department names and clerk membership below.',
      departmentInUse:
        'This department is selected by another workflow. Update that workflow before renaming or removing it.',
    },
    parameterFields: {
      departments: 'Departments',
      managementGroups: 'Management groups',
      holidays: 'Work calendar',
      name: 'Name',
      clerks: 'Clerks',
      heads: 'Department heads',
      leaders: 'Leaders',
      members: 'Members',
      date: 'Date',
      workday: 'Working day (otherwise a holiday)',
    },
    parameterSettings: 'Parameter settings',
    back: 'Back',
    systemManagement: 'System management',
    allCategories: 'All categories',
    uncategorized: 'Uncategorized',
    manageCategories: 'Manage categories',
    categoryHelp:
      'Organize workflows without changing their definitions. Lower sort orders appear first.',
    discardChanges: 'Discard unsaved category changes?',
    editCategory: 'Edit',
    deleteCategory: 'Delete',
    deleteCategoryConfirm:
      'Delete “{{title}}”? Its workflows will become uncategorized.',
    confirmDelete: 'Confirm deletion',
    cancel: 'Cancel',
    addCategory: 'New category',
    categoryColor: 'Color',
    categoryColors: {
      gray: 'Gray',
      red: 'Red',
      orange: 'Orange',
      amber: 'Amber',
      green: 'Green',
      teal: 'Teal',
      blue: 'Blue',
      indigo: 'Indigo',
      purple: 'Purple',
      pink: 'Pink',
    },
    categoryName: 'Category name',
    categoryOrder: 'Sort order',
    save: 'Save',
    saveFailed:
      'Could not save. Check your access and refresh the list before retrying.',
    category: 'Category',
    categoryFilter: 'Filter by category',

    group: 'Workflow',
    businessGroup: 'Business workflows',
    managementGroup: 'Workflow management',
    title: 'Workflow management',
    description:
      'Browse every example workflow and inspect its execution history.',
    definitions: 'Workflow definitions',
    executions: 'Execution records',
    definition: 'Workflow definition',
    execution: 'Workflow execution',
    executionCount: 'Executions',
    executionActivity: 'Executions',
    lastExecutedAt: 'Last {{date}}',
    neverExecuted: 'Not executed yet',
    workflow: 'Workflow',
    source: 'Source',
    states: 'States',
    transitions: 'Transitions',
    record: 'Record ID',
    recordTitle: 'Title',
    state: 'Status',
    createdAt: 'Created at',
    all: 'All workflows',
    filter: 'Filter by workflow',
    clear: 'Clear filter',
    filterByName: 'Filter by name',
    refresh: 'Refresh',
    previous: 'Previous',
    next: 'Next',
    pagination: 'Page {{page}} · {{total}} executions',
    noDefinitions: 'No workflow definitions.',
    noExecutions: 'No executions yet. Start a workflow from its example page.',
    noResults: 'No executions for this workflow.',
    loading: 'Loading workflows',
    failed: 'Could not load workflows. Please try again.',
    forbidden: 'You do not have access to this workflow.',
    notFound: 'This workflow or execution no longer exists.',
    signIn: 'Sign in to view workflows.',
    retry: 'Retry',
    executionCountLink: 'Executions: {{count}}',
    viewExecutions: 'View executions',
    parameterHint:
      'Click a configured node or transition to adjust its runtime parameters. Other nodes show their definition details. Changes apply according to each workflow’s snapshot or live mode.',
    currentState: 'Displayed state',
    latest: 'Latest progress',
    historyHint:
      'Select a history step to see the path up to that point. Current and visited nodes have distinct colors; unvisited branches remain muted.',
    history: 'Transition history',
    step: 'Step',
    transition: 'Transition',
    from: 'From',
    to: 'To',
    actor: 'Actor',
    time: 'Time',
    showStep: 'Show progress at step {{step}}',
    created: 'Created',
    noHistory: 'No transitions recorded.',
    effects: 'Effect runs',
    effect: 'Effect',
    attempts: 'Attempts',
    error: 'Error',
    noEffects: 'No effect runs.',
    executionDescription:
      'Inspect the recorded path and review each transition in order.',
    executionParameters: 'Parameters used by this execution',
    snapshotHint:
      'These values come from the execution record. Snapshot values remain fixed; live values are resolved again when the workflow runs.',
    sources: {
      lifecycle: 'Lifecycle examples',
      office: 'Office workflows',
    },
    names: workflowNamesEnUS,
    runStates: {
      queued: 'Queued',
      running: 'Running',
      succeeded: 'Succeeded',
      failed: 'Failed',
      dead: 'Stopped',
      cancelled: 'Cancelled',
    },
  },
  // The template's own copy: the shell, the sign-in pages and shared components. Keep it in `./system/` so a
  // template upgrade can replace it without touching the application's copy below.
  ...systemEnUS,
  ...agentChatEnUS,
  onlineAgent: {
    group: 'Agents',
    agents: 'Agents',
    runtimes: 'Runtimes',
    skills: 'Skills',
    newSkill: 'New skill',
    skillDetail: 'Skill details',
    connectRuntime: 'Connect runtime',
    models: 'Models',
    openModels: 'Open models',
    checkingModels: 'Checking chat models…',
    catalogFailed: 'Could not load chat models.',
    noModels: {
      title: 'No chat model configured',
      description:
        'Add a model service and enable a chat model to start chatting.',
      readOnly: 'Ask an administrator to configure a chat model.',
    },
  },
  aiTranslation: {
    title: 'AI Translation',
    description: 'Translate naturally. Keep the meaning.',
    model: 'Language model',
    selectModel: 'Select a model',
    translate: 'Translate',
    translating: 'Translating…',
    original: 'Original',
    translation: 'Translation',
    sourceLanguage: 'Source language',
    targetLanguage: 'Target language',
    sourcePlaceholder: 'Enter text to translate',
    resultPlaceholder: 'Your translation will appear here',
    limit: 'Use up to 10,000 characters',
    required: 'Enter text to translate',
    noModels:
      'No chat model is available. Configure one or ask an administrator.',
    catalogFailed: 'Could not load models. Please try again.',
    unavailable:
      'The model catalog is unavailable. Reload or contact an administrator.',
    failed: 'Translation failed. Check the model and try again.',
    timeout: 'Translation timed out. Please try again later.',
    unknownOutcome:
      'The connection was interrupted; the result is unknown. Translating again may call the model twice.',
    forbidden: 'You do not have access. Ask an administrator.',
    sessionExpired: 'Your session expired. Sign in again.',
    signIn: 'Sign in again',
    retry: 'Retry',
    success: 'Translation complete',
    workspace: 'Translation workspace',
    swap: 'Swap languages',
    clear: 'Clear',
    copy: 'Copy',
    copied: 'Translation copied',
    copyFailed: 'Could not copy. Select the translation and copy it manually.',
    tryExample: 'Try an example',
    examples: {
      product: {
        title: 'Product introduction',
        text: 'NocoBase is an extensible application development platform that helps teams build and deliver business applications faster.',
      },
      email: {
        title: 'Business email',
        text: 'Hello, thank you for your interest in our product. We would like to invite you to an online demo next Wednesday to explore how it can help your team work more efficiently. We look forward to hearing from you.',
      },
      notice: {
        title: 'Event announcement',
        text: 'Join us this Friday at 3 p.m. for a product discussion. Bring your ideas and explore new possibilities with the team.',
      },
    },
    languages: {
      auto: 'Detect language',
      'zh-CN': 'Simplified Chinese',
      en: 'English',
      ja: 'Japanese',
      ko: 'Korean',
      fr: 'French',
      de: 'German',
      es: 'Spanish',
    },
  },
  i18nExamples: {
    title: 'Internationalization',
    description:
      'Explore plurals, missing translations and regional formats. Switch language from the account menu to see the results update.',
    pluralTitle: 'Plurals',
    pluralDescription:
      'English uses different forms for one and other counts. Chinese uses the same wording for both.',
    count: 'Item count',
    countHint: 'Enter a non-negative safe integer or choose a preset.',
    presets: 'Count presets',
    invalidCount: 'Enter a valid non-negative safe integer.',
    itemCount_one: '{{count}} item',
    itemCount_other: '{{count}} items',
    fallbackTitle: 'Missing translations',
    fallbackDescription:
      'Switch to Chinese: the English-only message falls back to English. The last two rows have no translation in either language.',
    fallbackChain:
      'Lookup order: current language ({{locale}}) → application default ({{defaultLocale}}) → en-US. Repeated languages are checked once.',
    scenarios: {
      translated: 'Available in both languages',
      englishOnly: 'Available in English only',
      withDefault: 'Missing, with defaultValue',
      withoutDefault: 'Missing, without defaultValue',
    },
    scenario: 'Scenario / key',
    result: 'Rendered result',
    source: 'Source',
    keySource: 'Key itself',
    defaultValue: 'Translation unavailable.',
    isolationNote:
      'These deliberately incomplete resources use an isolated I18nRuntime with the current language and application default. The application’s own translations remain complete.',
    loading: 'Loading fallback examples',
    error: 'Unable to load the fallback examples.',
    retry: 'Retry',
    formatTitle: 'Regional formats',
    formatDescription:
      'Compare the same number, USD amount and UTC timestamp using Intl.NumberFormat and Intl.DateTimeFormat.',
    region: 'Region',
    number: 'Number',
    currency: 'Currency (USD)',
    date: 'Date and time (UTC)',
    formatNote:
      'Formatting changes presentation, not value: no currency conversion takes place. These regions do not add interface languages; the comparison stays fixed when you switch language.',
  },
  noticeLoading: 'Loading notice…',
  noticeLoadError: 'Unable to load the plugin notice.',
  routeOverlays: {
    title: 'Route dialogs and drawers',
    description:
      'Open a dialog or drawer, then open another layer. Close the child to return to your draft. Each layer has its own URL.',
    openDialog: 'Open dialog',
    openDrawer: 'Open drawer',
    dialogCardTitle: 'Dialog route',
    dialogCardDescription:
      'Keep the user focused on one task with a centered, URL-addressable layer.',
    dialogPattern: 'Centered overlay',
    dialogFeatureFocus: 'Focused task flow',
    dialogFeatureNested: 'Can open a child drawer',
    dialogFeatureConfirm: 'Supports close confirmation',
    drawerCardTitle: 'Drawer route',
    drawerCardDescription:
      'Keep the underlying page visible while a side panel handles a secondary task.',
    drawerPattern: 'Side panel',
    drawerFeatureContext: 'Keeps page context visible',
    drawerFeatureNested: 'Can open a child dialog',
    drawerFeatureHistory: 'Works with browser history',
    guideTitle: 'Try the nested flow',
    guideDescription:
      'Move between layers to see how each route is reflected in the address bar and browser history.',
    stepOneTitle: 'Open a layer',
    stepOneDescription: 'Start with a dialog or drawer from the cards above.',
    stepTwoTitle: 'Open the next layer',
    stepTwoDescription: 'Use the action inside the overlay to continue deeper.',
    stepThreeTitle: 'Return to your draft',
    stepThreeDescription:
      'Close the child layer and the parent keeps its local state.',
    deepLinks: 'Jump directly:',
    openDialogDrawer: 'Dialog → Drawer',
    openDrawerDialog: 'Drawer → Dialog',
    currentRoute: 'Current route',
    stateDescription:
      'Every layer is a real route. Use browser back and forward to move through the same flow.',
    preview: 'Preview',
    newExample: 'New example',
    childPagesCardTitle: 'Nested pages',
    childPagesCardDescription:
      'Open a page instead of an overlay and watch the breadcrumb gain a level for each one.',
    openChildPages: 'Open nested pages',
    childPagesTitle: 'Nested pages',
    childPagesDescription:
      'Each of these is its own page rather than a layer, so opening one replaces this content and adds a breadcrumb level.',
    openTopic: 'Open page',
    openTopicDialog: 'Open dialog',
    topicQuotation: 'Quotation routing',
    topicQuotationSummary:
      'Route a quotation to the reviewer who owns the account.',
    topicOnboarding: 'Onboarding checklist',
    topicOnboardingSummary:
      'Track the steps a new teammate works through in their first week.',
    topicRenewal: 'Renewal reminder',
    topicRenewalSummary:
      'Notify the owner before a subscription reaches its renewal date.',
    topicHint:
      'The breadcrumb above gained a level when this page opened, because this page is somewhere you can return to.',
    topicOverlayHint:
      'Open the dialog above and the breadcrumb stays put: the address bar changes, but an overlay is not another destination.',
    topicDialogTitle: 'A layer above the page',
    topicDialogDescription:
      'This dialog is a child route of the page behind it, and names no destination.',
    topicDialogHint:
      'The address bar changed, but the breadcrumb did not: the page behind this layer is still where you are.',
    dialogTitle: 'Dialog example',
    drawerTitle: 'Drawer example',
    hint: 'Type a draft and open a child layer to try keeping your work in place.',
    draft: 'Draft',
    allowClose: 'Allow closing this layer',
    historyHint:
      'Turn off closing to keep this layer open when you press Escape, click outside, or use Close. Browser back and forward still navigate normally.',
    showToast: 'Show a notification',
    toastTitle: 'Shown from inside the overlay',
    toastDescription: 'Notifications stay above dialogs and drawers.',
  },
  numbers: {
    title: 'Numeric types',
    description:
      'Compare actual database values and JavaScript types through Query and Repository. All results come from the current application database.',
    sort: 'Sort rows by',
    asc: 'Ascending',
    desc: 'Descending',
    sortNote:
      'Sorting is performed by the database and preserves numeric ordering; BIGINT and DECIMAL are not converted to Number().',
    source: 'Read with',
    sample: 'Dataset',
    all: 'All samples',
    nullOnly: 'Null sample',
    emptyOnly: 'Empty result',
    refresh: 'Refresh',
    loading: 'Loading numeric examples…',
    error:
      'Unable to load numeric examples. Check your connection and sign-in status, then retry.',
    retry: 'Try again',
    empty: 'No rows in this selection. Aggregate results are shown below.',
    rows: 'Stored values',
    aggregates: 'Aggregate results',
    field: 'Field / type',
    scenario: 'Sample',
    database: 'Database: {{dialect}}',
    legend:
      'Values use JSON notation: strings have quotes; numbers do not. The label below each value shows its actual JavaScript type; null remains null.',
    aggregateNote:
      'COUNT(field) ignores nulls. SUM/AVG for INTEGER, BIGINT and DECIMAL preserve database strings; SUM/AVG for FLOAT and DOUBLE return numbers, matching their field values. MIN/MAX preserve the field type. An empty selection returns 0 for COUNT and null for the other aggregates. The non-null increments ID is counted even in the null sample.',
    precisionNote:
      'Decimal strings retain database formatting. SQLite numeric storage and floating-point arithmetic may round values; converting a result to a string cannot restore lost precision. Avoid Number() when using BIGINT or DECIMAL values.',
    idNote:
      'The ID is generated with increments. Its physical type depends on the database, so Query and Repository may expose different types for this field.',
    samples: {
      small: 'Small integer',
      negative: 'Negative values',
      zero: 'Zero',
      large: 'Large value',
      adjacent: 'Adjacent large integer',
      fraction: 'Fraction',
      null: 'Null values',
    },
  },
  examples: {
    aiFormFill: {
      title: 'AI form assistance',
      description:
        'Review an application-owned tool proposal and explicitly fill a local draft without saving records.',
    },
    onlineAgent: {
      title: 'Online Agent',
      description:
        'Configure a chat model and talk to Online Agent from any page.',
      open: 'Open Agent chat',
    },
    i18n: {
      title: 'Internationalization',
      description:
        'Try plural forms, missing-translation fallbacks and regional number, currency and date formats.',
    },
    notificationTasks: {
      title: 'Task notifications',
      description:
        'Assign tasks to different users and let recipients update the task from the notification detail page.',
    },
    routeOverlays: {
      title: 'Route dialogs and drawers',
      description:
        'Open a dialog or drawer, then open another layer. Close the child to return to your draft. Each layer has its own URL.',
    },
    numbers: {
      title: 'Numeric types',
      description:
        'Compare INTEGER, BIGINT, DECIMAL, FLOAT and DOUBLE values, return types and aggregates.',
    },
    externalCrm: {
      title: 'External database',
      description:
        'Read orders and customers from a database another system owns, through an external connection and its metadata files.',
    },
    eyebrow: 'NocoBase Examples',
    title: 'Explore working examples',
    description:
      'Learn by using complete examples. Browse content, explore related records, and see how application features work together.',
    start: 'Start with articles',
    open: 'Open example',
    accessNote:
      'Examples use the application’s authentication and permissions. Sign in as an administrator to explore; other accounts need the corresponding permissions.',
    articles: {
      title: 'Article management',
      description:
        'A complete application feature with initial content, search, drafts, publishing and editing.',
    },
    repository: {
      title: 'Repository queries',
      description:
        'Explore record queries, filters, sorting, pagination and related data.',
    },
    crm: {
      title: 'Customers and contacts',
      description:
        'Browse a CRM example and explore relationships between customers and their contacts.',
    },
    orders: {
      title: 'Orders and products',
      description:
        'Explore orders, line items and products in a connected business example.',
    },
    authorization: {
      title: 'Authorization',
      description:
        'Configure sales feature permissions and data scopes with default access, sharing and restriction rules.',
    },
    files: {
      title: 'File management',
      description:
        'Explore the file repository example and its upload and file management interface.',
    },
    templatePrint: {
      title: 'Template printing',
      description:
        'Generate DOCX or PDF invoices from authorized quote data; PDF requires LibreOffice on the application server.',
    },
    routes: {
      title: 'Application routes',
      description:
        'See a plugin contribute a page to the application and share its navigation and layout.',
    },
  },
  articles: {
    title: 'Articles',
    workspace: 'Content workspace',
    description:
      'Capture ideas, share knowledge, and keep your content up to date.',
    new: 'New article',
    edit: 'Edit article',
    all: 'All articles',
    published: 'Published',
    draft: 'Draft',
    archived: 'Archived',
    filter: 'Filter by status',
    search: 'Search titles…',
    loading: 'Loading articles…',
    loadError: 'Unable to load articles. Check your connection and try again.',
    retry: 'Try again',
    empty: 'No matching articles',
    emptyHint: 'Try another search or create your first article.',
    noSummary: 'No summary yet.',
    read: 'Read article',
    total: '{{count}} articles',
    previous: 'Previous page',
    next: 'Next page',
    preview: 'Article preview',
    noContent: 'No content yet.',
    editorHint: 'Save your ideas as a draft, or publish when ready.',
    fieldTitle: 'Title',
    summary: 'Summary',
    content: 'Content',
    status: 'Status',
    saveError: 'Unable to save. Check your permissions and try again.',
    saving: 'Saving…',
  },
  externalCrm: {
    eyebrow: 'External database example',
    title: 'CRM orders',
    description:
      'These rows live in a database this application does not own. The externalCrm connection reads its schema, never changes it, and layers titles and the customer relation on top from database/externalCrm/metadata/*.json. The page addresses everything by logical name; the crm_ table prefix never appears here.',
    readOnly: 'Read-only',
    customers: '{{count}} customers',
    filter: 'Filter by status',
    status: {
      all: 'All orders',
      paid: 'Paid',
      shipped: 'Shipped',
      draft: 'Draft',
    },
    refresh: 'Refresh',
    loading: 'Loading orders…',
    loadError:
      'Unable to load orders. Check that you are signed in and that the external CRM database is reachable.',
    retry: 'Retry',
    empty: 'No matching orders',
    emptyHint:
      'The SQLite stand-in is filled with sample orders on startup; a real CRM shows whatever it holds.',
    columns: {
      orderNo: 'Order number',
      customer: 'Customer',
      status: 'Status',
      totalAmount: 'Total amount',
      placedAt: 'Placed at',
    },
    note: 'Writes are not exposed: the CRM owns this data, so the routes register only query actions and the Policy grants reads alone.',
  },
  // A group written here replaces the system group of the same name rather than merging with it, so a shared group
  // is extended by spreading the system one first.
  navigation: {
    ...systemEnUS.navigation,
    i18nExamples: 'Internationalization',
    numbers: 'Numeric types',
    externalCrm: 'External CRM',
    routeOverlays: 'Route dialogs and drawers',
    articles: 'Articles',
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
