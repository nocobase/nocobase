import type { LocaleResource } from '@nocobase/i18n';

/**
 * Display vocabulary shared by the client and server locale catalogues.
 */
const enUS = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: 'Page access',
    page: 'Pages',
    business: 'Business operations',
    administration: 'System and tools',
    other: 'Other',
  },
  options: {
    defaultAndSharing: 'Use default data scope',
    actions: {
      assign: 'Manage assignments',
      configure: 'Configure',
      inspect: 'Inspect permissions',

      read: 'Read',
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
      access: 'Access',
    },
    settingsModules: { authorization: 'Authorization' },
    pages: {
      all: 'All pages',
      allDescription:
        'Allow access to every page, including pages added later.',
    },
    settings: {
      inspector: 'Permission inspector',
      'permission-sets': 'Permission Sets',
    },
    subjectTypes: {
      authenticated: 'All signed-in users',
      authenticatedDescription:
        'Applies to every user with a valid signed-in session.',
      user: 'Users',
    },
    recordAccessPolicies: {
      allRecords: 'All Records',
      recordsIOwn: 'Records I Own',
      recordsICreated: 'Records I Created',
      customFilter: 'Custom Filter',
      customFilterHint: 'Select records with a custom filter condition.',
    },
  },
};

/** English is the source of truth for this catalogue's shape. */
export type AuthorizationServerResource = LocaleResource<typeof enUS>;

export default enUS;
