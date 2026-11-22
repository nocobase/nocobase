import type { PermissionWorkspaceSelection } from '@nocobase/app-plugin-authorization/client/settings';

// Record access from the widest to the narrowest, as the example plugins define them.
const SALES_SCOPES = [
  'allRecords',
  'customFilter',
  'example.sales.region',
  'example.sales.public',
  'example.sales.own',
  'recordsIOwn',
  'example.sales.prepared',
];
const CRM_SCOPES = [
  'allRecords',
  'customFilter',
  'recordsIOwn',
  'example.crm.own',
];

/**
 * Configure this selection whenever the app adds a business feature. Give each action a localized description,
 * map each page's primary and related objects, and name additional scope slots with registered collection titles.
 * The authorization plugin reads it through its `workspace` option in `client/plugins.ts`; see
 * .agents/skills/nocobase-app-development/references/authorization.md for the role editor example.
 */
export const permissionWorkspaceSelection: PermissionWorkspaceSelection = {
  business: [
    // The authorization example's Sales pages: each composite resource has a page of the same id, its primary object.
    {
      type: 'composite',
      id: 'example.sales.projects',
      actions: ['view', 'edit'],
      scopeOrder: SALES_SCOPES,
    },
    {
      type: 'composite',
      id: 'example.sales.quotes',
      actions: ['view', 'edit', 'submit'],
      scopeOrder: SALES_SCOPES,
    },
    {
      type: 'composite',
      id: 'example.sales.orders',
      actions: ['view', 'manageRelations', 'deliver'],
      scopeOrder: SALES_SCOPES,
    },
    // Customers, contacts and sales reps: three objects the Customers and contacts page uses.
    {
      type: 'composite',
      id: 'example.crm.customers',
      actions: ['view', 'edit', 'assign'],
      scopeOrder: CRM_SCOPES,
    },
    {
      type: 'composite',
      id: 'example.crm.contacts',
      actions: ['view', 'edit'],
      scopeOrder: CRM_SCOPES,
    },
    {
      type: 'composite',
      id: 'example.crm.salesReps',
      actions: ['view'],
      scopeOrder: CRM_SCOPES,
    },
  ],
  pages: {
    'customer-contacts': {
      primary: ['example.crm.customers'],
      related: ['example.crm.contacts', 'example.crm.salesReps'],
    },
  },
};
