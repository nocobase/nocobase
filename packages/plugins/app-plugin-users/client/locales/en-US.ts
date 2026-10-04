import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Close',
  nav: { users: 'User management' },
  assignment: {
    inspect: 'Check effective permissions',
    keepEditing: 'Keep editing',
    discardChanges: 'Discard changes',
    showMore: 'Show more',
    title: 'Permission assignments',
    description:
      'Manage permissions assigned directly to this user. Changes apply when saved.',
    search: 'Search names or descriptions',
    selectedOnly: 'Selected only',
    selected: '{{count}} selected',
    changes: '{{added}} added, {{removed}} removed',
    noChanges: 'No changes',
    empty: 'No matching options',
    protected: 'This assignment is protected and cannot be changed here',
    failed: 'Could not save. Please try again.',
    discard: 'Discard unsaved changes?',
  },
  page: {
    title: 'Users',
    description:
      'Manage accounts, permission assignments, and active sessions.',
    add: 'Add user',
    search: 'Search name, username, or email',
    allStatuses: 'All statuses',
    allRoles: 'All permission sets',
    enabled: 'Enabled',
    disabled: 'Disabled',
    noUsers: 'No users found.',
    total: '{{count}} users',
    previous: 'Previous',
    next: 'Next',
    selectRole: 'Select permission set',
    roles: 'Permission sets',
    systemAdministrator: 'System administrator',
    noDirectRoles: 'Not directly assigned',
    protectedRole: 'Protected assignment',
    authenticatedDefaultAccess:
      'Only direct assignments are shown here. Permissions received through all signed-in users, teams, or other subjects are not listed.',
    columns: { user: 'User', status: 'Status', actions: 'Actions' },
    actions: {
      menu: 'User actions',
      edit: 'Edit profile',
      resetPassword: 'Reset password',
      revokeSessions: 'Revoke sessions',
      enable: 'Enable account',
      delete: 'Delete user',
      disable: 'Disable account',
    },
  },
  form: {
    addTitle: 'Add user',
    editTitle: 'Edit user',
    addDescription: 'Create an account and assign permissions.',
    editDescription: 'Update the account profile.',
    name: 'Name',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    cancel: 'Cancel',
    save: 'Save',
    create: 'Create user',
  },
  password: {
    title: 'Reset password',
    description:
      'Set a new password for {{name}}. All sessions will be revoked.',
    newPassword: 'New password',
    submit: 'Reset password',
  },
  state: {
    enableTitle: 'Enable account?',
    disableTitle: 'Disable account?',
    enableDescription: '{{name}} will be able to sign in again.',
    disableDescription:
      '{{name}} will be signed out from every device immediately.',
    enable: 'Enable',
    disable: 'Disable',
  },
  deletion: {
    title: 'Delete user?',
    description:
      'Delete {{name}}? All sessions and API Keys will be revoked. Historical activity will be retained. This action cannot be undone.',
    success: 'User deleted.',
  },
  errors: {
    SELF_DELETE_NOT_ALLOWED: 'You cannot delete your own account.',
    LAST_ASSIGNMENT:
      'This user is the last one holding a permission set that must stay assigned.',
    USER_HAS_APPS:
      'Transfer or delete this user’s applications before deleting the user.',
    HUB_ADMIN_REQUIRED: 'Only a platform administrator can delete users.',
    PROTECTED_ROLE_ASSIGNMENT:
      'This role cannot be assigned or removed from User management.',
    USER_NOT_FOUND: 'The user no longer exists.',
    USER_DELETION_NOT_CONFIGURED:
      'User deletion is not configured for this application.',
    USER_EMAIL_CONFLICT: 'A user with this email already exists.',
    USER_USERNAME_CONFLICT: 'A user with this username already exists.',
    USER_IDENTITY_CONFLICT:
      'A user with this email or username already exists.',
    PASSWORD_TOO_SHORT: 'The password is too short.',
    PASSWORD_TOO_LONG: 'The password is too long.',
    operationFailed: 'The user operation failed.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
