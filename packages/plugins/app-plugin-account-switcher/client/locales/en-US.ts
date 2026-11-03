import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  menu: {
    switchAccount: 'Switch account',
    search: 'Search name or email',
    loading: 'Loading accounts…',
    empty: 'No matching accounts',
    more: '{{count}} more. Search to narrow the list.',
    loadFailed: 'Unable to load accounts.',
  },
  banner: {
    actingAs: 'Acting as {{name}}',
    description: 'Changes are recorded under this account.',
    return: 'Return to {{name}}',
  },
  errors: {
    switchFailed: 'Unable to switch account. Please try again.',
    returnFailed: 'Unable to return to your account. Please try again.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type AccountSwitcherResource = LocaleResource<typeof enUS>;

export default enUS;
