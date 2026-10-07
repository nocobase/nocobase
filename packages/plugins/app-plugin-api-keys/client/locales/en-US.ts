import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Close',
  nav: { apiKeys: 'API keys' },
  page: {
    loading: 'Loading',
    title: 'API keys',
    description:
      'Create keys that let scripts and integrations call this application as you.',
    add: 'Create key',
    empty: 'You have no API keys yet.',
    unnamed: 'Unnamed key',
    never: 'Never',
    unused: 'Never used',
    active: 'Active',
    expired: 'Expired',
    disabled: 'Disabled',
    columns: {
      name: 'Name',
      key: 'Key',
      status: 'Status',
      lastUsed: 'Last used',
      expires: 'Expires',
      actions: 'Actions',
    },
    actions: { revoke: 'Revoke key' },
  },
  form: {
    title: 'Create API key',
    description:
      'The key acts as you. It carries exactly the permissions your account has.',
    name: 'Name',
    namePlaceholder: 'Nightly export job',
    expiry: 'Expires',
    expiryChoices: {
      never: 'Never',
      '7': 'In 7 days',
      '30': 'In 30 days',
      '90': 'In 90 days',
      '365': 'In 1 year',
    },
    cancel: 'Cancel',
    create: 'Create key',
  },
  reveal: {
    title: 'Copy your key now',
    description:
      '“{{name}}” has been created. This is the only time the key is shown.',
    usage: 'Send it as the x-api-key request header.',
    copy: 'Copy key',
    done: 'Done',
  },
  revoke: {
    title: 'Revoke key "{{name}}"?',
    description:
      'Requests using “{{name}}” will fail immediately. This cannot be undone.',
    cancel: 'Cancel',
    confirm: 'Revoke key',
  },
  errors: {
    loadFailed: 'Could not load your API keys.',
    createFailed: 'Could not create the API key.',
    revokeFailed: 'Could not revoke the API key.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type ApiKeysResource = LocaleResource<typeof enUS>;

export default enUS;
