import { useState, type ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  PermissionEditor,
  type PermissionMenuNode,
  type PermissionObject,
  type PermissionSettingsPage,
  type PermissionValue,
} from '../../registry/authorization/permission-editor.js';

const RECORDS = [
  { value: 'all', label: 'All records' },
  { value: 'department', label: 'Their department' },
  { value: 'own', label: 'Their own records' },
];

const objects: readonly PermissionObject[] = [
  {
    id: 'contracts',
    label: 'Contracts',
    group: 'Sales',
    actions: [
      {
        id: 'contracts.view',
        label: 'View contracts',
        view: true,
        scopes: [{ id: 'records', options: RECORDS }],
      },
      {
        id: 'contracts.update',
        label: 'Edit contracts',
        scopes: [{ id: 'records', followsView: true }],
      },
      { id: 'contracts.export', label: 'Export contracts', risk: 'sensitive' },
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
              { value: '100k', label: '$100,000' },
            ],
          },
          { id: 'customers', label: 'Customers', options: RECORDS },
        ],
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    group: 'Sales',
    actions: [
      { id: 'payments.view', label: 'View payments', view: true },
      { id: 'payments.sync', label: 'Sync payments', managed: true },
      {
        id: 'payments.export',
        label: 'Export payments',
        requires: ['payments.sync'],
      },
    ],
  },
  {
    id: 'roles',
    label: 'Roles',
    group: 'System',
    notice: 'Anyone who can edit roles can grant any permission.',
    actions: [
      { id: 'roles.view', label: 'View roles', view: true },
      { id: 'roles.update', label: 'Edit roles', risk: 'high' },
    ],
  },
];

const menus: readonly PermissionMenuNode[] = [
  { id: 'home', label: 'Home', public: true },
  {
    id: 'sales',
    label: 'Sales',
    children: [
      {
        id: 'contracts-page',
        label: 'Contracts',
        uses: { primary: ['contracts'], related: ['payments'] },
      },
      {
        id: 'dashboard',
        label: 'Sales dashboard',
        uses: { related: ['contracts'] },
      },
      {
        id: 'payments-page',
        label: 'Payments',
        uses: { primary: ['payments'] },
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    children: [
      { id: 'roles-page', label: 'Permissions', opensWith: 'roles.view' },
    ],
  },
];

function Host({
  initial,
  onChange,
  tab,
  items = objects,
}: {
  readonly initial: PermissionValue;
  readonly onChange?: (next: PermissionValue) => void;
  readonly tab?: 'menus' | 'objects';
  readonly items?: readonly PermissionObject[];
}): ReactElement {
  const [value, setValue] = useState(initial);
  return (
    <PermissionEditor
      menus={menus}
      objects={items}
      value={value}
      defaultTab={tab}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const trigger = (name: string): HTMLElement =>
  screen.getByRole('combobox', { name });

describe('permission editor tabs', () => {
  it('checks menus independently of object permissions and warns about empty pages', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Host
        initial={{ menus: [], grants: { 'contracts.view': {} } }}
        onChange={onChange}
      />,
    );
    expect(
      screen.getByRole('tab', { name: /Menus\s*1 \/ 5/ }),
    ).toBeInTheDocument();
    // No intro or column headings above the menu tree.
    expect(screen.queryByText(/Business objects the page uses/)).toBeNull();
    // Public menus are checked for everyone and cannot be changed.
    expect(screen.getByRole('checkbox', { name: /Home/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Home/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('checkbox', { name: 'Payments' }));
    expect(onChange).toHaveBeenLastCalledWith({
      menus: ['payments-page'],
      grants: { 'contracts.view': {} },
    });
    expect(
      screen.getByText(
        '“Payments” is checked, but this role cannot view Payments yet, so the page opens empty.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('1 menu needs attention')).toBeInTheDocument();
    // The group is half-checked; checking it checks every child.
    const group = screen.getByRole('checkbox', { name: 'Sales' });
    expect(group).toHaveAttribute('aria-checked', 'mixed');
    await user.click(group);
    expect(onChange).toHaveBeenLastCalledWith({
      menus: ['payments-page', 'contracts-page', 'dashboard'],
      grants: { 'contracts.view': {} },
    });
    // Unchecking a menu leaves the object's permission alone.
    await user.click(screen.getByRole('checkbox', { name: 'Contracts' }));
    expect(onChange).toHaveBeenLastCalledWith({
      menus: ['payments-page', 'dashboard'],
      grants: { 'contracts.view': {} },
    });
  });

  it('jumps from a warning to the object that needs View', async () => {
    const user = userEvent.setup();
    render(<Host initial={{ menus: ['payments-page'], grants: {} }} />);
    await user.click(
      screen.getByRole('button', { name: 'Turn on “View payments”' }),
    );
    expect(
      screen.getByRole('tab', { name: /Business objects/ }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('heading', { name: 'Payments' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'View payments' }));
    await user.click(screen.getByRole('tab', { name: /Menus/ }));
    expect(screen.queryByText(/opens empty/)).toBeNull();
  });

  it('shows a menu opened by an action as read-only and points to its object', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host initial={{ menus: [], grants: {} }} onChange={onChange} />);
    const entry = screen.getByRole('checkbox', { name: 'Permissions' });
    expect(entry).toHaveAttribute('aria-disabled', 'true');
    await user.click(entry);
    expect(onChange).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Shown with “View roles”' }),
    );
    expect(
      screen.getByRole('tab', { name: /Business objects/ }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Roles' })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('business objects tab', () => {
  it('lists objects with counts and scopes and shows the menus that use the object', () => {
    render(
      <Host
        tab='objects'
        initial={{
          menus: [],
          grants: { 'contracts.view': { scopes: { records: 'department' } } },
        }}
      />,
    );
    const list = screen.getByRole('navigation', { name: 'Business objects' });
    expect(
      within(list).getByRole('button', {
        name: /^Contracts\s*1 of 4 on\s*,\s*Their department$/,
      }),
    ).toHaveAttribute('aria-current', 'true');
    expect(within(list).getByText('System')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Contracts' }),
    ).toBeInTheDocument();
    // No explanatory lines: no list of the menus using the object, no rule below the actions, no footer note.
    expect(screen.queryByText('Used by menus')).toBeNull();
    expect(screen.queryByText(/follow the view scope/)).toBeNull();
    expect(screen.queryByText(/Changes apply to every menu/)).toBeNull();
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toHaveAccessibleName('View contracts');
    expect(trigger('Data scope of Edit contracts')).toHaveTextContent(
      'Same as view (Their department)',
    );
    expect(trigger('Data scope of Edit contracts')).toBeDisabled();
    // No risk tags; the second scope slot shows its object's title.
    expect(screen.queryByText('Sensitive')).toBeNull();
    expect(screen.getByText('Customers')).toBeInTheDocument();
  });

  it('turns on View with an action', async () => {
    const user = userEvent.setup();
    render(<Host tab='objects' initial={{ menus: [], grants: {} }} />);
    await user.click(screen.getByRole('switch', { name: 'Edit contracts' }));
    expect(
      screen.getByRole('switch', { name: 'View contracts' }),
    ).toBeChecked();
    expect(
      screen.getByText('Also turned on View contracts, which this needs.'),
    ).toBeInTheDocument();
  });

  it('asks before turning off View that other actions need', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Host
        tab='objects'
        initial={{
          menus: ['contracts-page'],
          grants: { 'contracts.view': {}, 'contracts.update': {} },
        }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('switch', { name: 'View contracts' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Turning off View contracts also turns off Edit contracts, which needs it.',
    );
    await user.click(screen.getByRole('button', { name: 'Turn off' }));
    expect(onChange).toHaveBeenLastCalledWith({
      menus: ['contracts-page'],
      grants: {},
    });
  });

  it('cancels an open confirmation when the host turns read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value = {
      menus: [],
      grants: { 'contracts.view': {}, 'contracts.update': {} },
    };
    const props = {
      menus,
      objects,
      value,
      onChange,
      defaultTab: 'objects' as const,
    };
    const { rerender } = render(<PermissionEditor {...props} />);
    await user.click(screen.getByRole('switch', { name: 'View contracts' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<PermissionEditor {...props} readOnly />);
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<PermissionEditor {...props} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('says a managed requirement cannot be turned on here', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Host
        tab='objects'
        initial={{ menus: [], grants: {} }}
        onChange={onChange}
      />,
    );
    const list = screen.getByRole('navigation', { name: 'Business objects' });
    await user.click(within(list).getByRole('button', { name: /^Payments/ }));
    await user.click(screen.getByRole('switch', { name: 'Export payments' }));
    expect(
      screen.getByRole('switch', { name: 'Export payments' }),
    ).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        grants: expect.objectContaining({
          'payments.export': expect.anything(),
        }),
      }),
    );
    expect(
      screen.getByText(
        'Export payments stays off. It needs Sync payments, which is managed by the application and cannot be turned on here.',
      ),
    ).toBeInTheDocument();
  });

  it('narrows Edit and resets it when View becomes narrower', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Host
        tab='objects'
        initial={{
          menus: [],
          grants: {
            'contracts.view': { scopes: { records: 'all' } },
            'contracts.update': {},
          },
        }}
        onChange={onChange}
      />,
    );
    await user.click(trigger('Data scope of Edit contracts'));
    await user.click(
      await screen.findByRole('option', { name: 'Their department' }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      menus: [],
      grants: {
        'contracts.view': { scopes: { records: 'all' } },
        'contracts.update': { scopes: { records: 'department' } },
      },
    });
    await user.click(trigger('Data scope of View contracts'));
    await user.click(
      await screen.findByRole('option', { name: 'Their own records' }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      menus: [],
      grants: {
        'contracts.view': { scopes: { records: 'own' } },
        'contracts.update': { scopes: {} },
      },
    });
    expect(
      screen.getByText(
        'Edit contracts now follows the view scope (Their own records) again.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps the notice when a select only repeats the value it shows', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Host
        tab='objects'
        initial={{
          menus: [],
          grants: {
            'contracts.view': { scopes: { records: 'all' } },
            'contracts.update': { scopes: { records: 'department' } },
          },
        }}
        onChange={onChange}
      />,
    );
    await user.click(trigger('Data scope of View contracts'));
    await user.click(
      await screen.findByRole('option', { name: 'Their department' }),
    );
    const notice =
      'Edit contracts now follows the view scope (Their department) again.';
    expect(screen.getByText(notice)).toBeInTheDocument();
    const calls = onChange.mock.calls.length;
    await user.click(trigger('Data scope of Edit contracts'));
    await user.click(
      await screen.findByRole('option', {
        name: 'Same as view (Their department)',
      }),
    );
    expect(onChange).toHaveBeenCalledTimes(calls);
    expect(screen.getByText(notice)).toBeInTheDocument();
  });

  it('drops its notices when the host replaces the draft, such as discarding changes', async () => {
    const user = userEvent.setup();
    const saved: PermissionValue = {
      menus: [],
      grants: {
        'contracts.view': { scopes: { records: 'all' } },
        'contracts.update': { scopes: { records: 'department' } },
      },
    };
    function Discarding(): ReactElement {
      const [value, setValue] = useState(saved);
      return (
        <PermissionEditor
          menus={menus}
          objects={objects}
          value={value}
          onChange={setValue}
          defaultTab='objects'
          dirty={value !== saved}
          footer={
            <button type='button' onClick={() => setValue(saved)}>
              Discard
            </button>
          }
        />
      );
    }
    render(<Discarding />);
    await user.click(trigger('Data scope of View contracts'));
    await user.click(
      await screen.findByRole('option', { name: 'Their own records' }),
    );
    const notice =
      'Edit contracts now follows the view scope (Their own records) again.';
    expect(screen.getByText(notice)).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    expect(screen.queryByText(notice)).not.toBeInTheDocument();
    expect(trigger('Data scope of Edit contracts')).toHaveTextContent(
      'Their department',
    );
  });

  it('shows every scope of a multi-scope action and leaves risky actions off with Enable all', async () => {
    const user = userEvent.setup();
    render(<Host tab='objects' initial={{ menus: [], grants: {} }} />);
    await user.click(screen.getByRole('button', { name: 'Enable all' }));
    expect(
      screen.getByRole('switch', { name: 'Approve contracts' }),
    ).toBeChecked();
    expect(
      screen.getByRole('switch', { name: 'Export contracts' }),
    ).not.toBeChecked();
    expect(trigger('Approve contracts: Amount up to')).toHaveTextContent(
      'No limit',
    );
    expect(trigger('Approve contracts: Customers')).toHaveTextContent(
      'All records',
    );
    const list = screen.getByRole('navigation', { name: 'Business objects' });
    await user.click(screen.getByRole('button', { name: 'View only' }));
    expect(within(list).getByText('1 of 4 on')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disable all' }));
    expect(within(list).getAllByText('Off').length).toBeGreaterThan(0);
  });

  it('shows a slot reading another object as following that object’s View', async () => {
    const user = userEvent.setup();
    const items: readonly PermissionObject[] = [
      {
        id: 'contracts',
        label: 'Contracts',
        actions: [
          {
            id: 'contracts.view',
            label: 'View contracts',
            view: true,
            scopes: [{ id: 'records', options: RECORDS }],
          },
          {
            id: 'contracts.approve',
            label: 'Approve contracts',
            scopes: [
              { id: 'records', label: 'Contracts', followsView: true },
              {
                id: 'customers',
                label: 'Customers',
                options: RECORDS,
                followsView: 'customers.view',
              },
            ],
          },
        ],
      },
      {
        id: 'customers',
        label: 'Customers',
        actions: [
          {
            id: 'customers.view',
            label: 'View customers',
            view: true,
            scopes: [{ id: 'records', options: RECORDS }],
          },
        ],
      },
    ];
    render(
      <Host
        tab='objects'
        items={items}
        initial={{
          menus: [],
          grants: {
            'contracts.view': { scopes: { records: 'all' } },
            'contracts.approve': {},
            'customers.view': { scopes: { records: 'department' } },
          },
        }}
      />,
    );
    expect(trigger('Approve contracts: Customers')).toHaveTextContent(
      'Same as Customers view (Their department)',
    );
    await user.click(trigger('Approve contracts: Customers'));
    expect(
      (await screen.findAllByRole('option')).map((option) =>
        option.textContent?.trim(),
      ),
    ).toEqual([
      'Same as Customers view (Their department)',
      'Their own records',
    ]);
  });

  it('filters objects by action name', async () => {
    const user = userEvent.setup();
    render(<Host tab='objects' initial={{ menus: [], grants: {} }} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Search objects or actions' }),
      'edit roles',
    );
    const list = screen.getByRole('navigation', { name: 'Business objects' });
    expect(
      within(list).queryByRole('button', { name: /^Contracts/ }),
    ).toBeNull();
    await user.click(within(list).getByRole('button', { name: /^Roles/ }));
    expect(
      screen.getByText('Anyone who can edit roles can grant any permission.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('High risk')).toBeNull();
  });
});

describe('small screens and reference tags', () => {
  it('warns about an object only beside a checked menu', async () => {
    const user = userEvent.setup();
    render(<Host initial={{ menus: [], grants: {} }} />);
    const row = (name: string) =>
      screen
        .getByRole('checkbox', { name })
        .closest('[data-slot="permission-menu"]') as HTMLElement;
    const tag = () =>
      row('Payments').querySelector('[data-slot="permission-object-tag"]');
    // Unchecked, the tag is plain even though the role cannot view payments.
    expect(tag()).toHaveAttribute('data-viewable');
    await user.click(screen.getByRole('checkbox', { name: 'Payments' }));
    expect(tag()).not.toHaveAttribute('data-viewable');
  });

  it('shows each object’s count and view scope in the select used on phones', async () => {
    const user = userEvent.setup();
    render(
      <Host
        tab='objects'
        initial={{
          menus: [],
          grants: { 'contracts.view': { scopes: { records: 'department' } } },
        }}
      />,
    );
    await user.click(
      screen.getByRole('combobox', { name: 'Business objects' }),
    );
    const option = await screen.findByRole('option', { name: /^Contracts/ });
    expect(option).toHaveTextContent(/on · Their department/);
    // An object with nothing on still shows its count.
    expect(
      await screen.findByRole('option', { name: /^Payments/ }),
    ).toHaveTextContent(/0 of \d+ on/);
  });
});

describe('system settings tab', () => {
  const settings: readonly PermissionSettingsPage[] = [
    {
      id: 'user-management',
      label: 'User management',
      group: 'Account and permissions',
      objects: [
        {
          id: 'users',
          label: 'Users',
          actions: [
            {
              id: 'users.view',
              label: 'View users',
              view: true,
              // A scope on a settings action is never shown: settings have no data scope.
              scopes: [{ id: 'records', options: RECORDS }],
            },
            { id: 'users.create', label: 'Invite users' },
            {
              id: 'users.assign',
              label: 'Assign roles',
              risk: 'high',
            },
          ],
        },
      ],
    },
    {
      id: 'database',
      label: 'Database explorer',
      group: 'System',
      objects: [
        {
          id: 'page:database',
          label: 'Database explorer',
          actions: [{ id: 'database.open', label: 'Open page', view: true }],
        },
      ],
    },
  ];

  function SettingsHost({
    onChange,
  }: {
    readonly onChange: (next: PermissionValue) => void;
  }): ReactElement {
    const [value, setValue] = useState<PermissionValue>({
      menus: [],
      grants: {},
    });
    return (
      <PermissionEditor
        menus={menus}
        objects={objects}
        settings={settings}
        value={value}
        defaultTab='settings'
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    );
  }

  it('sets settings pages in their own tab, without scopes or menus', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SettingsHost onChange={onChange} />);
    expect(
      screen.getByRole('tab', { name: /System settings\s*0 \/ 2/ }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('heading', { name: 'User management' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Account and permissions')).toBeInTheDocument();
    expect(screen.queryAllByRole('combobox')).toEqual([]);
    expect(screen.queryByText('All records')).toBeNull();
    // Enable all for one page turns on its actions except risky ones; no menu is checked.
    await user.click(
      screen.getByRole('button', { name: 'Enable all · User management' }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      menus: [],
      grants: { 'users.view': {}, 'users.create': {} },
    });
    expect(
      screen.getByRole('tab', { name: /System settings\s*1 \/ 2/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Open page' }));
    await user.click(
      screen.getByRole('button', { name: 'Disable all · User management' }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      menus: [],
      grants: { 'database.open': {} },
    });
  });

  it('hides the tab when there are no settings pages', () => {
    render(<Host initial={{ menus: [], grants: {} }} />);
    expect(screen.queryByRole('tab', { name: /System settings/ })).toBeNull();
  });
});

describe('restricted modes', () => {
  it('explains unrestricted roles without controls', () => {
    render(
      <PermissionEditor
        menus={menus}
        objects={objects}
        value={{ menus: [], grants: {} }}
        onChange={vi.fn()}
        unrestricted
        header={<span>Administrator</span>}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'All permissions (unrestricted)' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('disables every control when read-only', async () => {
    const user = userEvent.setup();
    render(
      <PermissionEditor
        menus={menus}
        objects={objects}
        value={{ menus: ['contracts-page'], grants: { 'contracts.view': {} } }}
        onChange={vi.fn()}
        readOnly
      />,
    );
    for (const control of screen.getAllByRole('checkbox'))
      expect(control).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('tab', { name: /Business objects/ }));
    for (const control of screen.getAllByRole('switch'))
      expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('button', { name: 'Enable all' })).toBeNull();
    expect(
      screen.getByText('These permissions are read-only.'),
    ).toBeInTheDocument();
  });
});
