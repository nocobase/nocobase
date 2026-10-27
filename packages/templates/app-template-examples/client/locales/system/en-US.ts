import settings from './settings-en-US.js';
import type { LocaleResource } from '@nocobase/i18n';
import deviceApprovalEnUS from '#extensions/nocobase-device-approval/locales/en-US';
import inboxEnUS from '#extensions/nocobase-inbox/locales/en-US';

/**
 * The copy of what the template ships: the shell, the sign-in pages and shared components. A template upgrade
 * replaces this file, so put the application's own copy in `../en-US.ts` rather than here.
 */
const systemEnUS = {
  listFeedback: {
    loading: 'Loading…',
    empty: 'No data yet.',
    noResults: 'No matching results.',
    forbidden: 'Access denied.',
    unauthenticated: 'Session expired.',
    failed: 'Unable to load list.',
    refreshFailed: 'Refresh failed. Previous data remains visible.',
    retry: 'Retry',
    retrying: 'Retrying…',
    clear: 'Clear filters',
    signIn: 'Sign in',
  },
  flowDiagram: {
    controls: 'Diagram controls',
    fitView: 'Fit to view',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    escapeHint: 'Press Escape to exit',
    leavesTo: 'Leaves to',
    arrivesFrom: 'Arrives from',
    otherRoutes: 'Other routes',
    minimap: 'Diagram overview',

    configure: 'Configure',
    overview: 'Diagram overview',
    actualSize: 'Actual size',
    states: 'States',
    transitions: 'Transitions',
    configurable: 'Parameters',
    current: 'Current',
    visited: 'Visited',
    initial: 'Initial',
    final: 'Final',
    state: 'State',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    fit: 'Fit to view',

    empty: 'No states to display.',
    loading: 'Laying out diagram…',
    failed: 'Unable to lay out this diagram.',
    nodeHelp: 'Press Enter or Space to select a state.',
    edgeHelp: 'Press Enter or Space to select a transition.',
  },
  settings,
  'auth.preparingSession': 'Preparing your session…',
  'auth.connectionFailed': 'Unable to connect',
  'auth.connectionFailedDescription':
    'The realtime connection could not be prepared. Retry to enter the application, or sign out.',

  'auth.passwordResetSuccess':
    'Your password has been reset. Sign in with your new password.',
  'auth.requestNewResetLink': 'Request a new reset link',

  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  // Shared form wording overrides the defaults included by composed blocks.
  formFeedback: {
    field: 'This value was rejected. Check it and try again.',
    invalid: 'Check the highlighted fields and try again.',
    failed: 'Unable to save. Your input has been kept. Try again.',
    network:
      'Unable to connect. Check your connection and try again. Your input has been kept.',
    denied:
      'You cannot submit this form with your current access. Your input has been kept.',
  },
  // The UI Library component of the header's inbox button.
  'inboxButton.title': 'Inbox',
  'inboxButton.pending': 'Inbox, {{count}} waiting',
  'inboxButton.unread': 'Inbox, {{count}} unread',
  'inboxButton.pendingHint':
    '{{count}} waiting for you; it goes down once they are handled.',
  'inboxButton.unreadHint': '{{count}} unread; it goes down as you read them.',
  'auth.welcome': 'Welcome back',
  'auth.loginDescription': 'Sign in with your username or email and password.',
  'auth.registerTitle': 'Create an account',
  'auth.registerDescription': 'Create an account to get started.',
  'auth.forgotTitle': 'Forgot password',
  'auth.forgotDescription':
    'Enter your email and we will send a reset link if the account exists.',
  'auth.passwordResetUnavailable':
    'Self-service password reset is not enabled. Contact an administrator to reset your password.',
  'auth.capabilityLoadFailed': 'Could not check password reset availability.',
  'auth.retry': 'Retry',
  'auth.loading': 'Loading',
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
    'Give AI a flexible frontend framework to shape each experience, while NocoBase secures the data, permissions and governance underneath.',
  'auth.frontend': 'AI-native frontend',
  'auth.frontendDescription':
    'Compose interfaces freely on a flexible framework.',
  'auth.foundation': 'NocoBase foundation',
  'auth.foundationDescription': 'Reliable data, access control and governance.',
  'auth.marketingFooter': 'Freedom above. Confidence below.',
  'status.loading': 'Loading',
  'status.loadingPage': 'Loading page',
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
    buildFreely: 'AI builds freely.',
    reliability: '<brand>NocoBase</brand> keeps it reliable.',
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
  account: {
    signOutFailed: 'Unable to sign out. Please try again.',
    openMenu: 'Open account menu',
    fallback: 'Account',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
  },
  navigation: {
    home: 'Home',
    open: 'Open navigation',
    close: 'Close navigation',
    expand: 'Expand navigation',
    collapse: 'Collapse navigation',
    toggle: 'Expand or collapse navigation',
    label: 'Application navigation',
    description: 'Go to a page of this application.',
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
};

/** The shape every locale's system copy follows, derived from the English wording above. */
export type SystemResource = LocaleResource<typeof systemEnUS>;

export default systemEnUS;
