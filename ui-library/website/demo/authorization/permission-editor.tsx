import { useState, type ReactElement } from 'react';
import { CopyIcon } from 'lucide-react';
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
  type PermissionMenuNode,
  type PermissionObject,
  type PermissionSettingsPage,
  type PermissionScopeOption,
  type PermissionValue,
} from '#components/permission-editor';

// Example data only: an application builds its objects from its implemented operations and its menus from its routes.
const RECORDS: readonly PermissionScopeOption[] = [
  { value: 'all', label: 'All' },
  { value: 'team', label: 'Their team' },
  { value: 'own', label: 'Their own' },
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

const OBJECTS: readonly PermissionObject[] = [
  {
    id: 'customers',
    label: 'Customers',
    group: 'Sales',
    actions: [
      view(
        'customers.view',
        'View customers',
        'Open the customer list and details.',
      ),
      follows('customers.create', 'Create customers', {
        description: 'Create customers they own.',
      }),
      follows('customers.update', 'Edit customers', {
        description: 'Change the name, industry and tier.',
      }),
      follows('customers.destroy', 'Delete customers'),
      follows('customers.export', 'Export customers', {
        description: 'Download the customer list.',
        risk: 'sensitive',
      }),
      follows('customers.assign', 'Assign owner', {
        business: true,
        description: 'Hand a customer to another rep.',
      }),
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts',
    group: 'Sales',
    actions: [
      view('contacts.view', 'View contacts'),
      follows('contacts.create', 'Create contacts'),
      follows('contacts.update', 'Edit contacts'),
      follows('contacts.destroy', 'Delete contacts'),
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    group: 'Sales',
    actions: [
      view('activities.view', 'View activities'),
      follows('activities.create', 'Log activities'),
      follows('activities.update', 'Edit activities'),
      follows('activities.destroy', 'Delete activities'),
    ],
  },
  {
    id: 'deals',
    label: 'Deals',
    group: 'Sales',
    actions: [
      view('deals.view', 'View deals'),
      follows('deals.create', 'Create deals'),
      follows('deals.update', 'Edit deals', {
        description: 'Change the amount, stage and close date.',
      }),
      follows('deals.destroy', 'Delete deals'),
      follows('deals.move-stage', 'Move stage', { business: true }),
      follows('deals.mark-lost', 'Mark as lost', {
        business: true,
        description: 'Requires a reason.',
      }),
    ],
  },
  {
    id: 'contracts',
    label: 'Contracts',
    group: 'Sales',
    actions: [
      view(
        'contracts.view',
        'View contracts',
        'Open contracts and their amounts.',
      ),
      follows('contracts.create', 'Draft contracts', {
        description: 'Draft a contract for a customer.',
      }),
      follows('contracts.update', 'Change amount', {
        description: 'Change the contract amount.',
      }),
      follows('contracts.export', 'Export contracts', {
        description: 'Download the contract list.',
      }),
      follows('contracts.submit', 'Submit for approval', {
        business: true,
        description: 'Submit a draft for approval.',
      }),
      {
        id: 'contracts.approve',
        label: 'Approve',
        business: true,
        description: 'Approve contracts awaiting approval.',
        scopes: [
          { id: 'records', label: 'Contracts', followsView: true },
          // Approving also reads the customer: an extra scope titled with that object's registered title. It follows
          // Customers' View, so the customer scope is set once, on the Customers object.
          {
            id: 'customers',
            label: 'Customers',
            options: RECORDS,
            defaultValue: 'team',
            followsView: 'customers.view',
          },
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
        ],
      },
      follows('contracts.void', 'Void', {
        business: true,
        description: 'Void a contract.',
      }),
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    group: 'Sales',
    actions: [
      view('payments.view', 'View payments'),
      follows('payments.create', 'Record payments'),
      follows('payments.refund', 'Refund', {
        business: true,
        risk: 'high',
        description: 'Return money to the customer.',
      }),
    ],
  },
  {
    id: 'products',
    label: 'Products',
    group: 'Sales',
    actions: [
      view('products.view', 'View products'),
      follows('products.create', 'Create products'),
      follows('products.update', 'Edit products'),
      follows('products.destroy', 'Delete products'),
      follows('products.export', 'Export products'),
      follows('products.price', 'Change prices', { business: true }),
    ],
  },
];

// System settings: each page lists the settings objects it uses, without data scopes. A page shows in the sidebar
// while the action that opens it is on.
const SETTINGS_OBJECTS: readonly PermissionObject[] = [
  {
    id: 'users',
    label: 'Users',
    actions: [
      { id: 'users.view', label: 'View users', view: true },
      { id: 'users.create', label: 'Invite users' },
      { id: 'users.disable', label: 'Disable users' },
      {
        id: 'users.assign-role',
        label: 'Assign roles',
        risk: 'high',
        description: 'Gives users everything those roles allow.',
      },
    ],
  },
  {
    id: 'roles',
    label: 'Roles',
    actions: [
      { id: 'roles.view', label: 'View roles and permissions', view: true },
      {
        id: 'roles.update',
        label: 'Create and edit roles',
        risk: 'high',
        description: 'Can grant anything to anyone.',
      },
    ],
    notice:
      'Anyone who can create and edit roles or assign them can give any role any permission, including Administrator. Grant these only to people trusted with full access.',
  },
];

const SETTINGS: readonly PermissionSettingsPage[] = [
  {
    id: 'user-management',
    label: 'User management',
    group: 'Account and permissions',
    objects: SETTINGS_OBJECTS.filter((object) => object.id === 'users'),
  },
  {
    id: 'permission-management',
    label: 'Permission management',
    group: 'Account and permissions',
    objects: SETTINGS_OBJECTS.filter((object) => object.id === 'roles'),
  },
];

const MENUS: readonly PermissionMenuNode[] = [
  // Top-level pages are listed as they are, without a group around them.
  { id: 'home', label: 'Home', public: true },
  {
    id: 'sales-dashboard',
    label: 'Sales dashboard',
    uses: { primary: ['deals'], related: ['contracts', 'payments'] },
  },
  { id: 'products', label: 'Products', uses: { primary: ['products'] } },
  {
    id: 'customer-management',
    label: 'Customer management',
    children: [
      { id: 'customers', label: 'Customers', uses: { primary: ['customers'] } },
      {
        id: 'contacts',
        label: 'Contacts',
        uses: { primary: ['contacts'], related: ['customers'] },
      },
      {
        id: 'activities',
        label: 'Activities',
        uses: { primary: ['activities'], related: ['customers'] },
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    children: [
      {
        id: 'deals',
        label: 'Deals',
        uses: { primary: ['deals'], related: ['customers'] },
      },
      {
        id: 'contracts',
        label: 'Contracts',
        uses: { primary: ['contracts'], related: ['customers'] },
      },
      {
        id: 'payments',
        label: 'Payments',
        uses: { primary: ['payments'], related: ['contracts', 'customers'] },
      },
    ],
  },
];

const ROLES: Readonly<
  Record<
    string,
    {
      readonly title: string;
      readonly value: PermissionValue;
      readonly unrestricted?: boolean;
    }
  >
> = {
  'sales-manager': {
    title: 'Sales Manager',
    value: {
      menus: [
        'sales-dashboard',
        'products',
        'customers',
        'contacts',
        'activities',
        'deals',
        'contracts',
        'payments',
      ],
      grants: {
        'customers.view': { scopes: { records: 'team' } },
        'customers.create': {},
        'customers.update': {},
        'customers.export': { scopes: { records: 'own' } },
        'customers.assign': {},
        'contacts.view': { scopes: { records: 'team' } },
        'contacts.create': {},
        'contacts.update': {},
        'contacts.destroy': {},
        'activities.view': { scopes: { records: 'team' } },
        'activities.create': {},
        'activities.update': {},
        'deals.view': { scopes: { records: 'team' } },
        'deals.create': {},
        'deals.update': {},
        'deals.move-stage': {},
        'deals.mark-lost': {},
        'contracts.view': { scopes: { records: 'team' } },
        'contracts.create': {},
        'contracts.update': {},
        'contracts.submit': {},
        'contracts.approve': { scopes: { customers: 'team', amount: '500k' } },
        'products.view': { scopes: { records: 'all' } },
      },
    },
  },
  'it-admin': {
    title: 'IT Administrator',
    value: {
      menus: [],
      grants: {
        'users.view': {},
        'users.create': {},
        'users.disable': {},
        'roles.view': {},
      },
    },
  },
  admin: {
    title: 'Administrator',
    value: { menus: [], grants: {} },
    unrestricted: true,
  },
};

const ROLE_ITEMS = Object.entries(ROLES).map(([value, role]) => ({
  value,
  label: role.title,
}));

export function PermissionEditorDemo(): ReactElement {
  const [roleKey, setRoleKey] = useState('sales-manager');
  const [saved, setSaved] = useState<Readonly<Record<string, PermissionValue>>>(
    () =>
      Object.fromEntries(
        Object.entries(ROLES).map(([key, role]) => [key, role.value]),
      ),
  );
  const [draft, setDraft] = useState<PermissionValue>(saved[roleKey]);
  const [message, setMessage] = useState('');
  const role = ROLES[roleKey];
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved[roleKey]);
  return (
    <div className='min-h-svh bg-background p-4 text-foreground sm:p-6'>
      <div className='mx-auto grid max-w-6xl gap-3'>
        <PermissionEditor
          key={roleKey}
          menus={MENUS}
          objects={OBJECTS}
          settings={SETTINGS}
          value={draft}
          onChange={setDraft}
          unrestricted={role.unrestricted}
          dirty={dirty}
          defaultObjectId='customers'
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
              {!role.unrestricted && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='ml-auto'
                  onClick={() =>
                    setMessage(
                      `Creates a new role with ${role.title}’s permissions.`,
                    )
                  }
                >
                  <CopyIcon aria-hidden />
                  Duplicate as new role
                </Button>
              )}
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
