import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  // The shared list, form and overlay components (`components/`).
  actions: {
    close: 'Close',
  },
  dataTable: {
    filters: 'Filters',
    filtersApplied: 'Filters · {{count}}',
    firstPage: 'Go to first page',
    hideColumn: 'Hide',
    lastPage: 'Go to last page',
    nextPage: 'Go to next page',
    pageOf: 'Page {{page}} of {{pageCount}}',
    previousPage: 'Go to previous page',
    rowsPerPage: 'Rows per page',
    selectPage: 'Select all on this page',
    selectedCount: '{{selected}} of {{total}} row(s) selected.',
    sort: 'Sort',
    sortAscending: 'Asc',
    sortBy: 'Sort by',
    sortDescending: 'Desc',
    toggleColumns: 'Toggle columns',
    view: 'View',
  },
  formFeedback: {
    denied:
      'You cannot submit this form with your current access. Your input has been kept.',
    failed: 'Unable to save. Your input has been kept. Try again.',
    field: 'This value was rejected. Check it and try again.',
    invalid: 'Check the highlighted fields and try again.',
    network:
      'Unable to connect. Check your connection and try again. Your input has been kept.',
  },
  listFeedback: {
    clear: 'Clear filters',
    loading: 'Loading',
    refreshFailed: 'Refresh failed; showing previous data',
    retry: 'Retry',
    retrying: 'Retrying…',
    signIn: 'Sign in',
    empty: 'No data yet',
    noResults: 'No results',
    forbidden: 'Access denied',
    unauthenticated: 'Session expired',
    failed: 'Unable to load list',
  },
  pendingFeedback: {
    longWait: 'This is taking longer than usual. You can keep waiting.',
    working: 'Working…',
  },
  routeOverlay: {
    close: 'Close',
  },
  status: {
    loading: 'Loading',
    refreshing: 'Refreshing',
  },
  management: {
    actions: 'Actions',
    actionsFor: 'Actions for {{name}}',
    all: 'All statuses',
    allRoles: 'All roles',
    assignedRoles: 'Assigned roles',
    backToSource: 'Return to previous page',
    cancel: 'Cancel',
    clear: 'Clear filters',
    confirm: 'Confirm',
    conflict:
      'The request conflicts with current data. Review the latest record before trying again.',
    create: 'Create',
    created: 'Created user "{{name}}"',
    denied: 'You do not have access. Contact an administrator.',
    disable: 'Disable',
    disableHint:
      'This user will be unable to sign in and existing sessions will end.',
    disableTitle: 'Disable user "{{name}}"?',
    disabled: 'Disabled',
    discardHint: 'Your unsaved changes will be lost.',
    discardTitle: 'Discard changes?',
    editUser: 'Edit user',
    email: 'Email',
    enable: 'Enable',
    enableHint: 'This user will be able to sign in again.',
    enableTitle: 'Enable user "{{name}}"?',
    enabled: 'Enabled',
    failed: 'Unable to complete the request. Try again.',
    identityConflict: 'This email or username is already in use.',
    invalidEmail: 'Enter a valid email address',
    invalidRequest:
      'Some values are invalid. Check your input or filters and try again.',
    listChanged: 'The list has changed. Please retry.',
    loading: 'Loading',
    missing: 'This record does not exist or has been deleted.',
    name: 'Name',
    newUser: 'New user',
    noAssignedRoles: 'No assigned roles',
    noRoleAccess:
      'This user can still sign in and use account basics. No business access is granted by roles.',
    noRolesFound: 'No roles found.',
    password: 'Initial password',
    passwordPolicy: 'Password does not meet the current password policy.',
    required: 'Enter a value for this field',
    retry: 'Retry',
    revokeHint: 'This user will need to sign in again.',
    revokeRoleHint: 'Access granted by the listed roles will be removed.',
    revokeRoleTitle: 'Revoke roles from "{{name}}"?',
    revokeSessions: 'Revoke sessions',
    revokeTitle: 'Revoke sessions for "{{name}}"?',
    roleFilter: 'Filter by role',
    roleFilterIncomplete:
      'Choose both a role scope and a role, or clear the filters.',
    save: 'Save',
    saved: 'Saved "{{name}}"',
    saving: 'Saving…',
    searchRoles: 'Search roles',
    selectRoles: 'Select roles',
    sessionEnded: 'Your session has ended. Sign in again.',
    signInAgain: 'Sign in again',
    status: 'Status',
    total_one: '{{count}} user',
    total_other: '{{count}} users',
    userActionSaved: {
      disable: 'Disabled user "{{name}}"',
      enable: 'Enabled user "{{name}}"',
      revokeSessions: 'Revoked active sessions for "{{name}}"',
    },
    userSearch: 'Search names, usernames or emails',
    username: 'Username',
    users: 'Users',
    usersDescription: 'Manage accounts, access and active sessions.',
  },
  page: {
    loading: 'Loading',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'Users',
      category: 'Accounts',
      name: 'User invitation',
      trigger:
        'An administrator invites someone, or resends an invitation, with email selected.',
      recipients:
        'The person being invited, at the email address entered for them.',
      businessRule:
        'Sent every time an invitation is created or resent with email selected. There is no separate switch to turn it off.',
      languagePolicy:
        "Written in one language, chosen when inviting: the inviter's interface language unless another is picked. Resending keeps it. If that language has no email text, the email shows the application's default language and English.",
      channel: 'Invitation email sender',
      variables: {
        app: 'Application name',
        inviter: 'Name of the person who sent the invitation',
        items: 'Roles or access the invitation grants',
        date: "When the invitation expires, in the email's language and in UTC",
        url: 'Link for accepting the invitation; the preview uses a fake link',
      },
    },
  },
  accept: {
    title: 'Accept the invitation',
    language: 'Language',
    description: '{{inviter}} invited you.',
    summary: 'You will also join: {{items}}',
    loading: 'Loading the invitation…',
    email: 'Email',
    name: 'Name',
    username: 'Username (optional)',
    usernameHint: 'You can use this username to sign in.',
    password: 'Password',
    nameRequired: 'Enter your name.',
    passwordTooShort: 'The password needs at least {{min}} characters.',
    submit: 'Create account and join',
    join: 'Accept invitation',
    submitting: 'Joining…',
    signedIn:
      'You are signed in as {{name}}. Sign out to accept this invitation with a new account.',
    signOut: 'Sign out',
    signOutFailed: 'Could not sign out.',
    existingAccount:
      'This address already has an account. Sign in with it to continue.',
    alreadyHaveAccount: 'Already have an account? Sign in',
    goToLogin: 'Go to sign in',
    errors: {
      notFound: 'This invitation link is not valid.',
      expired: 'This invitation has expired. Ask for a new one.',
      accepted: 'This invitation has already been accepted.',
      revoked: 'This invitation has been revoked.',
      password: 'The password does not meet the requirements.',
      usernameConflict:
        'This username is already used as a username or email. Choose another.',
      accountConflict: 'An account with this address cannot be created.',
      failed: 'Something went wrong. Please try again.',
    },
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
