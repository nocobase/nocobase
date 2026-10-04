import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
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
  notifications: { unreadLabel: 'Notifications, {{count}} unread' },
  overrides: {
    '@nocobase/app-plugin-notification-in-app': {
      inbox: { title: 'Notifications' },
    },
  },
  noticeLoading: 'Loading notice…',
  noticeLoadError: 'Unable to load the plugin notice.',
  'auth.welcome': 'Welcome back',
  'auth.loginDescription': 'Sign in with your username or email and password.',
  'auth.registerTitle': 'Create an account',
  'auth.registerDescription': 'Create an account to get started.',
  'auth.forgotTitle': 'Forgot password',
  'auth.forgotDescription':
    'Enter your email and we will send a reset link if the account exists.',
  'auth.resetDescription': 'Choose a new password for your account.',
  'auth.resetTitle': 'Reset password',
  'auth.identifier': 'Username or email',
  'auth.password': 'Password',
  'auth.signIn': 'Sign in',
  'auth.signingIn': 'Signing in…',
  'auth.hidePassword': 'Hide password',
  'auth.showPassword': 'Show password',
  'auth.forgotLink': 'Forgot password?',
  'auth.noAccount': "Don't have an account?",
  'auth.signUp': 'Sign up',
  'auth.createAccount': 'Create account',
  'auth.creatingAccount': 'Creating account…',
  'auth.name': 'Name',
  'auth.username': 'Username',
  'auth.email': 'Email',
  'auth.confirmPassword': 'Confirm password',
  'auth.existingAccount': 'Already have an account?',
  'auth.passwordMismatch': "Passwords don't match.",
  'auth.resetting': 'Resetting…',
  'auth.newPassword': 'New password',
  'auth.confirmNewPassword': 'Confirm new password',
  'auth.invalidResetLink':
    'This password reset link is invalid or has expired.',
  'auth.backToSignIn': 'Back to sign in',
  'auth.sendResetLink': 'Send reset link',
  'auth.sending': 'Sending…',
  'auth.resetSent': 'If the account exists, a reset link has been sent.',
  'auth.rememberPassword': 'Remember your password?',
  'auth.methods': 'Sign-in methods',
  'auth.or': 'Or continue with',
  'auth.continueWith': 'Continue with {provider}',
  'auth.about': 'About this application',
  'auth.platform': 'AI-native application platform',
  'auth.marketingTitleFirst': 'Let AI build freely.',
  'auth.marketingTitleSecond': 'NocoBase keeps it',
  'auth.marketingTitleThird': 'reliable.',
  'auth.marketingDescription':
    'Give AI a flexible frontend framework to shape each experience, while NocoBase secures the data, permissions, workflows and governance underneath.',
  'auth.frontend': 'AI-native frontend',
  'auth.frontendDescription':
    'Compose interfaces freely on a flexible framework.',
  'auth.foundation': 'NocoBase foundation',
  'auth.foundationDescription':
    'Reliable data, access control, workflows and governance.',
  'auth.marketingFooter': 'Freedom above. Confidence below.',
  'status.loading': 'Loading',
  'status.loadingPage': 'Loading page',
  'status.loadingSettings': 'Loading settings',
  'status.loadingDev': 'Loading dev tools',
  'status.denied': 'Access denied',
  'status.pageFailed': 'Unable to load page',
  'status.retry': 'Retry',
  'navigation.brandHome': 'NocoBase home',
  'navigation.brandApps': 'NocoBase applications',
  'routeOverlay.close': 'Close',
  'status.deniedDescription': 'You do not have permission to access {{label}}.',
  'status.routeFailedDescription':
    'Route {{label}} from {{packageName}} could not be loaded.',
  shell: {
    workspace: 'AI application workspace',
    buildFreely: 'AI builds freely.',
    reliability: '<brand>NocoBase</brand> keeps it reliable.',
  },
  surface: {
    backToApp: 'Back to app',
    loading: 'Loading {{title}}',
    navigation: '{{title}} navigation',
    page: '{{title}} page',
  },
  settings: {
    title: 'Settings',
    emptyTitle: 'No settings available',
    emptyDescription:
      'No enabled plugin contributes a settings page you have access to.',
  },
  dev: {
    componentExamples: 'Component examples',
    title: 'Dev tools',
    emptyTitle: 'No dev tools available',
    emptyDescription:
      'No enabled plugin contributes a dev page you have access to.',
  },
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
    workflows: {
      title: 'Workflow examples',
      description:
        'Route quotations, generate analytics reports, and diagnose failures. Open a workflow, enable it, and run it with the sample inputs in its description.',
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
  appearance: {
    title: 'Appearance',
    mode: 'Color mode',
    preset: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    themes: { default: 'Spacious', compact: 'Compact' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
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
  account: {
    signOutFailed: 'Unable to sign out. Please try again.',
    openMenu: 'Open account menu',
    fallback: 'Account',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
  },
  navigation: {
    i18nExamples: 'Internationalization',
    notifications: 'Notifications',
    numbers: 'Numeric types',
    externalCrm: 'External CRM',
    routeOverlays: 'Route dialogs and drawers',
    articles: 'Articles',
    home: 'Home',
    open: 'Open navigation',
    close: 'Close navigation',
    expand: 'Expand navigation',
    collapse: 'Collapse navigation',
    toggle: 'Expand or collapse navigation',
    label: 'Application navigation',
    description: 'Go to a page of this application.',
    breadcrumb: 'Breadcrumb',
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
};

/**
 * The shape every locale of this application follows, derived from the English wording above.
 *
 * Anything a plugin does not translate falls back to this namespace, so a term defined here is reused everywhere
 * without each plugin repeating it.
 */
export type AppResource = LocaleResource<typeof enUS>;

export default enUS;
