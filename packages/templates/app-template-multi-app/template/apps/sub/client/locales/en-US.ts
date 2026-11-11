import fileUi from '../extensions/nocobase-file-component-ui/locales/en-US.js';
import type { LocaleResource } from '@nocobase/i18n';

import systemEnUS from './system/en-US.js';

const enUS = {
  // The template's own copy: the shell, the sign-in pages, shared components and the homepage. Keep it in
  // `./system/` so a template upgrade can replace it without touching the application's copy below.
  ...systemEnUS,
  ...fileUi,
  sso: {
    slowDescription:
      'Check your connection and try again, or return to the workbench.',
    slowTitle: 'This is taking longer than expected',
    failedTitle: 'Unable to open application',
    deniedDescription:
      'Contact your administrator to request access to this application.',
    denied: 'You do not have access',
    reenter: 'Enter again',
    signedOutDescription: 'Sign in with your platform account to enter again.',
    signedOut: 'You have signed out of this application',
    entering: 'Opening application…',
    continue: 'Continue with platform account',
    choose: 'Choose how to sign in.',
    loading: 'Loading sign-in options…',
    reload: 'Reload sign-in options',

    title: 'Platform sign-in',
    description: 'Use your platform identity to enter this application.',
    failed:
      'Sign-in failed or application access was denied. Contact your administrator or retry.',
    connecting: 'Connecting to platform sign-in…',
    retry: 'Retry platform sign-in',
    localLogin: 'Use a local application account',
  },
  switcher: {
    label: 'Switch application: {{name}}',
    title: 'Switch application',
    loading: 'Loading applications…',
    failed: 'Applications could not be loaded.',
    signInRequired: 'Sign in to the platform to view your applications.',
    empty: 'No running applications are available.',
    retry: 'Retry',
    back: 'Back to workbench',
  },
  lab: {
    readAccess: 'Read business records',
    editAccess: 'Edit business records',
    platformReader: 'Platform reader',
    platformEditor: 'Platform editor',

    retry: 'Retry original operation',
    pending:
      'The outcome is not confirmed. Retry the original operation using its existing request key to prevent duplicates.',

    overview: 'Overview',
    description: 'Manage this application’s own data and settings.',
    total: 'Records',
    version: 'App version',
    manager: 'Manager',
    recent: 'Recent records',
    empty: 'No records yet',
    records: 'Records',
    recordsDescription:
      'Records are stored independently for this application.',
    create: 'New record',
    refresh: 'Refresh',
    search: 'Search name or location',
    searchAction: 'Search',
    clear: 'Clear',
    name: 'Name',
    detail: 'Specification / details',
    location: 'Location',
    createdAt: 'Created at',
    actions: 'Actions',
    delete: 'Delete',
    noResults: 'No matching records',
    count: '{{count}} records',
    previous: 'Previous',
    next: 'Next',
    cancel: 'Cancel',
    saving: 'Saving…',
    submit: 'Create',
    deleteTitle: 'Delete “{{name}}”',
    deleteWarning:
      'This record will be permanently deleted from this application.',
    settings: 'Settings',
    settingsDescription: 'Settings apply only to this application.',
    basicSettings: 'Basic settings',
    save: 'Save',
    saved: 'Saved',
    loading: 'Loading…',
    error: 'Request failed. Please retry.',
    error401: 'Your session expired. Sign in again.',
    error403: 'Administrator access required.',
    error404: 'This record no longer exists.',
    system: 'System',
    navigation: 'Application navigation',
    back: 'Back to portal',
    title: 'Reagent management',
  },
  // The application's copy goes here, one group per feature. A shared group such as `navigation` is extended by
  // spreading the system one first, `navigation: { ...systemEnUS.navigation, orders: 'Orders' }`, since a group
  // written here replaces the system group of the same name rather than merging with it.
};

/**
 * The shape every locale of this application follows, derived from the English wording above.
 *
 * Anything a plugin does not translate falls back to this namespace, so a term defined here is reused everywhere
 * without each plugin repeating it.
 */
export type AppResource = LocaleResource<typeof enUS>;

export default enUS;
