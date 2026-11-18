import { useState, type ReactElement } from 'react';
import { Button } from '#components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

import {
  PermissionEditor,
  type PermissionAction,
  type PermissionGrants,
  type PermissionModule,
  type PermissionScopeOption,
} from '#components/permission-editor';

// Example data only: an application builds its modules from its own menus and implemented operations.
const RECORDS: readonly PermissionScopeOption[] = [
  { value: 'all', label: 'All records' },
  { value: 'department-tree', label: 'Their department and below' },
  { value: 'department', label: 'Their department' },
  { value: 'own', label: 'Their own records' },
];

const PROJECTS: readonly PermissionScopeOption[] = [
  { value: 'all', label: 'All projects' },
  { value: 'team', label: 'Their team’s projects' },
  { value: 'own', label: 'Projects they own' },
];

const view = (
  id: string,
  label: string,
  description?: string,
): PermissionAction => ({
  id,
  label,
  description,
  view: true,
  scopes: [{ id: 'records', options: RECORDS, defaultValue: 'own' }],
});

/** A basic or business action whose data scope follows View. */
const follows = (
  id: string,
  label: string,
  extra: Partial<PermissionAction> = {},
): PermissionAction => ({
  id,
  label,
  scopes: [{ id: 'records', followsView: true }],
  ...extra,
});

const MODULES: readonly PermissionModule[] = [
  {
    id: 'home',
    label: 'Home',
    menus: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        public: 'Every signed-in user can open it.',
        actions: [],
      },
      {
        id: 'inbox',
        label: 'Inbox',
        public: 'It shows only the user’s own messages.',
        actions: [],
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    menus: [
      {
        id: 'accounts',
        label: 'Accounts',
        actions: [
          view(
            'accounts.view',
            'View accounts',
            'Open accounts and their history',
          ),
          { id: 'accounts.create', label: 'Create accounts' },
          follows('accounts.update', 'Edit accounts'),
          follows('accounts.destroy', 'Delete accounts', {
            description: 'Remove an account for good',
          }),
          follows('accounts.export', 'Export accounts', { risk: 'sensitive' }),
          follows('accounts.transfer', 'Transfer owner', {
            business: true,
            description: 'Hand an account to another rep',
          }),
        ],
      },
      {
        id: 'contacts',
        label: 'Contacts',
        actions: [
          view('contacts.view', 'View contacts'),
          { id: 'contacts.create', label: 'Create contacts' },
          follows('contacts.update', 'Edit contacts'),
          follows('contacts.destroy', 'Delete contacts'),
        ],
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    menus: [
      {
        id: 'deals',
        label: 'Deals',
        actions: [
          view('deals.view', 'View deals', 'Open deals and their history'),
          { id: 'deals.create', label: 'Create deals' },
          follows('deals.update', 'Edit deals', {
            description: 'Change the amount, stage and close date',
          }),
          follows('deals.destroy', 'Delete deals', {
            description: 'Remove a deal for good',
          }),
          follows('deals.export', 'Export deals', { risk: 'sensitive' }),
          follows('deals.move-stage', 'Move stage', { business: true }),
          follows('deals.mark-lost', 'Mark as lost', {
            business: true,
            description: 'Requires a reason',
          }),
        ],
      },
      {
        id: 'quotes',
        label: 'Quotes',
        actions: [
          view('quotes.view', 'View quotes'),
          {
            id: 'quotes.create',
            label: 'Create quote',
            description: 'Prepare a draft quotation',
          },
          follows('quotes.update', 'Edit quotes'),
          follows('quotes.destroy', 'Delete quotes'),
          {
            id: 'quotes.submit',
            label: 'Submit quote',
            business: true,
            description:
              'Submit an eligible quote after checking its linked project',
            scopes: [
              {
                // Never wider than View quotes; listed in View's order with quote-specific names.
                id: 'records',
                label: 'Quotes allowed for submission',
                followsView: true,
                options: [
                  { value: 'all', label: 'All quotes' },
                  {
                    value: 'department-tree',
                    label: 'Quotes of their department and below',
                  },
                  { value: 'department', label: 'Their department’s quotes' },
                  { value: 'own', label: 'Quotes they prepared' },
                ],
              },
              // Linked projects are a different kind of data, so this scope stays independent of View.
              { id: 'projects', label: 'Linked projects', options: PROJECTS },
            ],
          },
          follows('quotes.withdraw', 'Withdraw quote', {
            business: true,
            description: 'Withdraw an unprocessed quotation',
          }),
        ],
      },
      {
        id: 'contracts',
        label: 'Contracts',
        actions: [
          view(
            'contracts.view',
            'View contracts',
            'Browse the contract list and details',
          ),
          { id: 'contracts.create', label: 'Create contracts' },
          follows('contracts.update', 'Edit contracts'),
          follows('contracts.destroy', 'Delete contracts', {
            description: 'Deleted contracts cannot be restored',
          }),
          follows('contracts.export', 'Export contracts', {
            risk: 'sensitive',
          }),
          {
            id: 'contracts.approve',
            label: 'Approve contracts',
            business: true,
            scopes: [
              {
                id: 'amount',
                label: 'Amount up to',
                options: [
                  { value: 'any', label: 'No limit' },
                  { value: '500k', label: '$500,000' },
                  { value: '100k', label: '$100,000' },
                ],
                defaultValue: '100k',
              },
              {
                id: 'department',
                label: 'Contracts of',
                options: RECORDS.slice(0, 3),
                defaultValue: 'department',
              },
            ],
          },
          follows('contracts.archive', 'Archive contracts', { business: true }),
        ],
      },
      {
        id: 'orders',
        label: 'Orders',
        actions: [
          view('orders.view', 'View orders'),
          follows('orders.update', 'Edit orders'),
          follows('orders.deliver', 'Mark delivered', { business: true }),
        ],
      },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    menus: [
      {
        id: 'project-list',
        label: 'Projects',
        actions: [
          {
            id: 'projects.view',
            label: 'View projects',
            view: true,
            scopes: [{ id: 'records', options: PROJECTS, defaultValue: 'own' }],
          },
          {
            id: 'projects.update',
            label: 'Edit projects',
            scopes: [{ id: 'records', followsView: true }],
          },
          {
            id: 'projects.close',
            label: 'Close project',
            business: true,
            scopes: [{ id: 'records', followsView: true }],
          },
        ],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    administration: true,
    menus: [
      {
        id: 'users',
        label: 'Users',
        group: 'Organization & accounts',
        actions: [
          { id: 'users.view', label: 'View users', view: true },
          { id: 'users.create', label: 'Invite users' },
          { id: 'users.disable', label: 'Disable users' },
          {
            id: 'users.reset-password',
            label: 'Reset passwords',
            risk: 'high',
            description: 'Lets them sign in as someone else',
          },
        ],
      },
      {
        id: 'roles',
        label: 'Roles & permissions',
        group: 'Access control',
        actions: [
          {
            id: 'authorization.roles.view',
            label: 'View roles and permissions',
            view: true,
          },
          {
            id: 'authorization.roles.assign',
            label: 'Assign roles to users',
            risk: 'high',
          },
          {
            id: 'authorization.roles.update',
            label: 'Create and edit roles',
            risk: 'high',
            description: 'Can grant anything to anyone',
          },
        ],
        notice:
          'Anyone who can create and edit roles or assign them can give any role any permission, including Administrator. Grant these only to people trusted with full access.',
      },
      {
        id: 'data-rules',
        label: 'Data rules',
        group: 'Access control',
        actions: [
          {
            id: 'authorization.default-access.view',
            label: 'View default, sharing and restriction rules',
            view: true,
          },
          {
            id: 'authorization.default-access.update',
            label: 'Manage data rules',
            risk: 'high',
            description: 'Affects every role',
          },
        ],
      },
      {
        id: 'inspector',
        label: 'Permission inspector',
        group: 'Access control',
        actions: [
          {
            id: 'authorization.inspector.use',
            label: 'Inspect any user’s access',
            risk: 'sensitive',
          },
        ],
      },
      {
        id: 'workflows',
        label: 'Workflows',
        group: 'Automation & AI',
        actions: [
          {
            id: 'workflow-management.view',
            label: 'View workflows',
            view: true,
          },
          {
            id: 'workflow-management.update',
            label: 'Create and edit workflows',
            risk: 'high',
            description: 'Workflows run as the system',
          },
        ],
      },
      {
        id: 'schedules',
        label: 'Scheduled jobs',
        group: 'Automation & AI',
        actions: [
          {
            id: 'scheduler.schedules.view',
            label: 'View scheduled jobs',
            view: true,
          },
          { id: 'scheduler.schedules.update', label: 'Manage scheduled jobs' },
        ],
      },
      {
        id: 'agents',
        label: 'AI employees',
        group: 'Automation & AI',
        actions: [
          { id: 'agents.view', label: 'View AI employees', view: true },
          { id: 'agents.update', label: 'Configure AI employees' },
        ],
      },
      {
        id: 'knowledge',
        label: 'Knowledge base',
        group: 'Knowledge base',
        actions: [
          { id: 'kb.view', label: 'View knowledge bases', view: true },
          { id: 'kb.indexing', label: 'Rebuild search indexes' },
        ],
      },
    ],
  },
];

const ROLES: Readonly<
  Record<
    string,
    {
      readonly title: string;
      readonly grants: PermissionGrants;
      readonly unrestricted?: boolean;
    }
  >
> = {
  'sales-manager': {
    title: 'Sales Manager',
    grants: {
      'accounts.view': { scopes: { records: 'department-tree' } },
      'accounts.create': {},
      'accounts.update': { scopes: { records: 'own' } },
      'accounts.transfer': {},
      'contacts.view': { scopes: { records: 'department-tree' } },
      'contacts.create': {},
      'contacts.update': {},
      'deals.view': { scopes: { records: 'all' } },
      'deals.create': {},
      'deals.update': { scopes: { records: 'own' } },
      'deals.move-stage': {},
      'quotes.view': { scopes: { records: 'department' } },
      'quotes.submit': { scopes: { records: 'own', projects: 'team' } },
      'contracts.view': { scopes: { records: 'department-tree' } },
      'contracts.create': {},
      'contracts.update': { scopes: { records: 'department' } },
      'contracts.destroy': { scopes: { records: 'own' } },
      'contracts.export': {},
      'contracts.approve': {
        scopes: { amount: '500k', department: 'department-tree' },
      },
      'contracts.archive': {},
    },
  },
  'it-admin': {
    title: 'IT Administrator',
    grants: {
      'users.view': {},
      'users.create': {},
      'users.disable': {},
      'authorization.roles.view': {},
      'workflow-management.view': {},
      'scheduler.schedules.view': {},
      'agents.view': {},
      'agents.update': {},
    },
  },
  admin: { title: 'Administrator', grants: {}, unrestricted: true },
};

const ROLE_ITEMS = Object.entries(ROLES).map(([value, role]) => ({
  value,
  label: role.title,
}));

export function PermissionEditorDemo(): ReactElement {
  const [roleKey, setRoleKey] = useState('sales-manager');
  const [saved, setSaved] = useState<
    Readonly<Record<string, PermissionGrants>>
  >(() =>
    Object.fromEntries(
      Object.entries(ROLES).map(([key, role]) => [key, role.grants]),
    ),
  );
  const [draft, setDraft] = useState<PermissionGrants>(saved[roleKey]);
  const [message, setMessage] = useState('');
  const role = ROLES[roleKey];
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved[roleKey]);
  return (
    <div className='min-h-svh bg-background p-4 text-foreground sm:p-6'>
      <div className='mx-auto grid max-w-6xl gap-3'>
        <PermissionEditor
          key={roleKey}
          modules={MODULES}
          value={draft}
          onChange={setDraft}
          unrestricted={role.unrestricted}
          dirty={dirty}
          defaultMenuId='contracts'
          header={
            <div className='flex min-w-0 flex-wrap items-center gap-2'>
              <Select
                items={ROLE_ITEMS}
                value={roleKey}
                onValueChange={(next: string | null) => {
                  if (!next || next === roleKey) return;
                  if (
                    dirty &&
                    !window.confirm('Discard unsaved changes to this role?')
                  )
                    return;
                  setRoleKey(next);
                  setDraft(saved[next]);
                  setMessage('');
                }}
              >
                <SelectTrigger aria-label='Role' className='w-48'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ROLE_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <span className='text-sm text-muted-foreground'>
                Changes take effect after Save.
              </span>
              <span className='ml-auto flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setMessage(
                      `Opens the permission inspector with ${role.title} selected.`,
                    )
                  }
                >
                  Preview as this role
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setMessage(
                      `Creates a new role with ${role.title}’s permissions.`,
                    )
                  }
                >
                  Duplicate as new role
                </Button>
              </span>
              {message && (
                <p
                  role='status'
                  className='basis-full text-xs text-muted-foreground'
                >
                  {message}
                </p>
              )}
            </div>
          }
          footer={
            role.unrestricted ? null : (
              <>
                <Button
                  type='button'
                  variant='outline'
                  disabled={!dirty}
                  onClick={() => setDraft(saved[roleKey])}
                >
                  Discard changes
                </Button>
                <Button
                  type='button'
                  disabled={!dirty}
                  onClick={() =>
                    setSaved((current) => ({ ...current, [roleKey]: draft }))
                  }
                >
                  Save
                </Button>
              </>
            )
          }
        />
      </div>
    </div>
  );
}
