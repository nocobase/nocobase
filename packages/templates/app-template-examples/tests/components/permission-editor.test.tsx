import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PermissionEditor } from '../../client/components/permission-editor.js';
const sections = [
  {
    id: 'business',
    title: 'Business actions',
    groups: [
      {
        id: 'orders',
        title: 'Orders',
        rows: [
          { id: 'read-orders', label: 'Read orders', enabled: true },
          {
            id: 'edit-orders',
            label: 'Edit orders',
            hint: 'Change the owner',
            enabled: false,
          },
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'System settings',
    groups: [
      {
        id: 'users',
        title: 'Users',
        rows: [{ id: 'manage-users', label: 'Manage users', enabled: false }],
      },
    ],
  },
];
describe('permission workspace', () => {
  it('filters across categories without changing hidden permissions and reports only explicit edits', async () => {
    const user = userEvent.setup();
    const enabled = vi.fn();
    render(
      <PermissionEditor
        sections={sections}
        onEnabledChange={enabled}
        onLevelChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('checkbox', { name: 'Manage users' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /System settings/ }));
    expect(
      screen.getByRole('checkbox', { name: 'Manage users' }),
    ).not.toBeChecked();
    await user.type(screen.getByRole('textbox'), 'owner');
    expect(
      screen.getByRole('checkbox', { name: /Edit orders/ }),
    ).not.toBeChecked();
    expect(enabled).not.toHaveBeenCalled();
    await user.click(screen.getByRole('checkbox', { name: /Edit orders/ }));
    expect(enabled).toHaveBeenCalledExactlyOnceWith('edit-orders', true);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(
      screen.getByRole('checkbox', { name: 'Manage users' }),
    ).not.toBeChecked();
  });
  it('keeps counts stable, distinguishes no results, and permits searching a readonly workspace', async () => {
    const user = userEvent.setup();
    const enabled = vi.fn();
    render(
      <PermissionEditor
        sections={sections}
        readOnly
        onEnabledChange={enabled}
        onLevelChange={vi.fn()}
      />,
    );
    await user.type(screen.getByRole('textbox'), 'not found');
    expect(screen.getByRole('status')).toHaveTextContent(
      'No matching permissions',
    );
    expect(
      screen.getByRole('button', { name: /Business actions/ }),
    ).toHaveTextContent('Business actions');
    expect(screen.queryByText('1/2')).not.toBeInTheDocument();
    await user.clear(screen.getByRole('textbox'));
    expect(
      screen.getByRole('checkbox', { name: 'Read orders' }),
    ).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('checkbox', { name: 'Read orders' }));
    expect(enabled).not.toHaveBeenCalled();
  });
});

describe('compact resource actions', () => {
  it('restores stable focus when enabled filtering removes the action or group', async () => {
    const user = userEvent.setup();
    function Draft() {
      const [enabled, setEnabled] = useState(true);
      return (
        <PermissionEditor
          sections={[
            {
              id: 's',
              title: 'Section',
              groups: [
                {
                  id: 'g',
                  title: 'Group',
                  rows: [
                    { id: 'a', label: 'Action', enabled },
                    {
                      id: 'hidden',
                      label: 'Hidden',
                      enabled: false,
                      toggleable: false,
                    },
                  ],
                },
              ],
            },
          ]}
          onEnabledChange={(_, on) => setEnabled(on)}
          onEnabledBatchChange={(changes) => setEnabled(changes[0]!.enabled)}
          onLevelChange={vi.fn()}
        />
      );
    }
    render(<Draft />);
    await user.click(screen.getByRole('switch', { name: 'Enabled only' }));
    await user.click(screen.getByRole('checkbox', { name: 'Action' }));
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(
      'No matching permissions',
    );
  });
  it('keeps scopes attached to actions, readonly scopes disabled and control ids instance-local', async () => {
    const scoped = [
      {
        id: 's',
        title: 'Section',
        groups: [
          {
            id: 'g',
            title: 'Orders',
            rows: [
              {
                id: 'edit',
                label: 'Edit',
                enabled: true,
                scopes: [
                  {
                    id: 'edit-records',
                    label: 'Records',
                    level: 'mine',
                    levels: [
                      { value: 'mine', label: 'Mine' },
                      { value: 'all', label: 'All' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const change = vi.fn();
    const view = render(
      <PermissionEditor
        sections={scoped}
        onEnabledChange={vi.fn()}
        onLevelChange={change}
      />,
    );
    expect(
      view.container.querySelectorAll('[data-slot=permission-row]'),
    ).toHaveLength(1);
    await userEvent.click(
      screen.getByRole('combobox', { name: 'How far Edit · Records reaches' }),
    );
    await userEvent.click(await screen.findByRole('option', { name: 'All' }));
    expect(change).toHaveBeenCalledWith('edit-records', 'all');
    view.unmount();
    render(
      <>
        <PermissionEditor
          sections={scoped}
          readOnly
          onEnabledChange={vi.fn()}
          onLevelChange={vi.fn()}
        />
        <PermissionEditor
          sections={scoped}
          readOnly
          onEnabledChange={vi.fn()}
          onLevelChange={vi.fn()}
        />
      </>,
    );
    const boxes = screen.getAllByRole('checkbox', { name: 'Edit' });
    expect(boxes[0]!.id).not.toBe(boxes[1]!.id);
    expect(screen.getAllByRole('combobox')[0]).toBeDisabled();
    expect(
      screen.queryByRole('checkbox', { name: /Select visible/ }),
    ).not.toBeInTheDocument();
  });
  it('does not submit an enclosing role form while searching or switching categories', async () => {
    const submit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <PermissionEditor
          sections={sections}
          onEnabledChange={vi.fn()}
          onLevelChange={vi.fn()}
        />
      </form>,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /System settings/ }),
    );
    await userEvent.type(screen.getByRole('textbox'), 'no match');
    await userEvent.click(
      screen.getByRole('button', { name: 'Clear filters' }),
    );
    expect(submit).not.toHaveBeenCalled();
  });
});

it('shows a single page access checkbox without a duplicate access action or resource counter', async () => {
  const onEnabledChange = vi.fn();
  const onEnabledBatchChange = vi.fn();
  render(
    <PermissionEditor
      sections={[
        {
          id: 'pages',
          title: 'Page access',
          groups: [
            {
              id: 'expenses',
              title: 'Expense registration',
              accessOnly: true,
              rows: [
                { id: 'page-expenses-access', label: 'Access', enabled: true },
              ],
            },
          ],
        },
      ]}
      onEnabledChange={onEnabledChange}
      onEnabledBatchChange={onEnabledBatchChange}
      onLevelChange={vi.fn()}
    />,
  );
  expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  expect(screen.queryByText('Access')).not.toBeInTheDocument();
  expect(screen.queryByText('1 of 1 enabled')).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Expense registration' }),
  );
  expect(onEnabledChange).toHaveBeenCalledExactlyOnceWith(
    'page-expenses-access',
    false,
  );
  expect(onEnabledBatchChange).not.toHaveBeenCalled();
});

it('reveals multiple scopes without changing their independent saved selections', async () => {
  const change = vi.fn();
  render(
    <PermissionEditor
      sections={[
        {
          id: 's',
          title: 'Business',
          groups: [
            {
              id: 'g',
              title: 'Expenses',
              rows: [
                {
                  id: 'view',
                  label: 'View',
                  enabled: true,
                  scopes: ['Records', 'Attachments'].map((label) => ({
                    id: label.toLowerCase(),
                    label,
                    level: 'own',
                    levels: [
                      { value: 'own', label: 'Own' },
                      { value: 'all', label: 'All' },
                    ],
                  })),
                },
              ],
            },
          ],
        },
      ]}
      onEnabledChange={vi.fn()}
      onLevelChange={change}
    />,
  );
  expect(screen.getByText('Records')).not.toBeVisible();
  await userEvent.click(screen.getByText('Data ranges (2)'));
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByText('Records')).toBeVisible();
  expect(screen.getByText('Attachments')).toBeVisible();
  await userEvent.click(
    screen.getByRole('combobox', {
      name: 'How far View · Attachments reaches',
    }),
  );
  await userEvent.click(await screen.findByRole('option', { name: 'All' }));
  expect(change).toHaveBeenCalledExactlyOnceWith('attachments', 'all');
});

it('uses the category navigation without a duplicate heading and identifies filtered results', async () => {
  const batch = vi.fn();
  render(
    <PermissionEditor
      sections={[
        {
          id: 'users',
          title: 'Users',
          groups: [
            {
              id: 'users',
              title: 'Users',
              rows: [
                {
                  id: 'read',
                  label: 'View users',
                  actionKey: 'read',
                  enabled: true,
                },
                {
                  id: 'edit',
                  label: 'Edit users',
                  actionKey: 'update',
                  enabled: false,
                },
              ],
            },
          ],
        },
      ]}
      onEnabledChange={vi.fn()}
      onEnabledBatchChange={batch}
      onLevelChange={vi.fn()}
    />,
  );
  expect(
    screen.queryByRole('heading', { level: 2, name: 'Users' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Users' })).toBeInTheDocument();
  await userEvent.type(screen.getByRole('textbox'), 'users');
  expect(
    screen.getByRole('heading', { level: 2, name: 'Users' }),
  ).toBeVisible();
  expect(batch).not.toHaveBeenCalled();
  expect(screen.queryByText('1/2')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('checkbox', { name: /Select visible/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText('All', { selector: 'span' }),
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('checkbox', { name: 'Edit users' }));
  expect(batch).not.toHaveBeenCalled();
});

it('aligns semantic actions across resources without dropping special or filtered actions', async () => {
  const groups = [
    {
      id: 'one',
      title: 'One',
      rows: [
        {
          id: 'edit-one',
          actionKey: 'update',
          label: 'Edit one',
          enabled: true,
        },
        { id: 'read-one', actionKey: 'read', label: 'View one', enabled: true },
      ],
    },
    {
      id: 'two',
      title: 'Two',
      rows: [
        { id: 'read-two', actionKey: 'read', label: 'View two', enabled: true },
        {
          id: 'special',
          actionKey: 'export',
          label: 'Export two',
          enabled: false,
        },
      ],
    },
  ];
  const view = render(
    <PermissionEditor
      sections={[{ id: 'business', title: 'Business', groups }]}
      onEnabledChange={vi.fn()}
      onLevelChange={vi.fn()}
    />,
  );
  const column = (name: string) =>
    screen
      .getByRole('checkbox', { name })
      .closest('[data-slot=permission-row]')!
      .parentElement!.style.getPropertyValue('--permission-column');
  expect(column('View one')).toBe(column('View two'));
  expect(column('Edit one')).not.toBe(column('Export two'));
  expect(screen.getAllByRole('checkbox')).toHaveLength(4);
  await userEvent.type(screen.getByRole('textbox'), 'Export');
  expect(
    screen.getByRole('checkbox', { name: 'Export two' }),
  ).toBeInTheDocument();
  expect(column('Export two')).toBe('3');
  expect(
    view.container.querySelectorAll('[data-slot=permission-row]'),
  ).toHaveLength(1);
});

it('keeps scope captions consistent in a category with multiple data ranges, including when filtered', async () => {
  const level = [{ value: 'all', label: 'All records' }];
  render(
    <PermissionEditor
      sections={[
        {
          id: 'business',
          title: 'Business',
          groups: [
            {
              id: 'quotes',
              title: 'Quotes',
              rows: [
                {
                  id: 'view',
                  label: 'View quotes',
                  enabled: true,
                  scopes: [
                    {
                      id: 'view-records',
                      label: 'Visible quotes',
                      level: 'all',
                      levels: level,
                    },
                  ],
                },
                {
                  id: 'submit',
                  label: 'Submit quote',
                  enabled: true,
                  scopes: [
                    {
                      id: 'submit-projects',
                      label: 'Linked projects',
                      level: 'all',
                      levels: level,
                    },
                    {
                      id: 'submit-quotes',
                      label: 'Allowed quotes',
                      level: 'all',
                      levels: level,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]}
      onEnabledChange={vi.fn()}
      onLevelChange={vi.fn()}
    />,
  );
  expect(screen.getByText('Visible quotes')).toBeVisible();
  expect(
    screen.getByText(
      'Linked projects: All records; Allowed quotes: All records',
    ),
  ).toBeVisible();
  await userEvent.click(screen.getByText('Data ranges (2)'));
  expect(screen.getByText('Linked projects')).toBeVisible();
  expect(screen.getByText('Allowed quotes')).toBeVisible();
  await userEvent.type(screen.getByRole('textbox'), 'View quotes');
  expect(screen.queryByText('Linked projects')).not.toBeInTheDocument();
  expect(screen.getByText('Visible quotes')).toBeVisible();
});

it('keeps administration actions ordered and independently editable with unrelated special actions', async () => {
  const enabled = vi.fn();
  render(
    <PermissionEditor
      sections={[
        {
          id: 'admin',
          title: 'Administration',
          groups: [
            {
              id: 'roles',
              title: 'Roles',
              rows: [
                {
                  id: 'grants',
                  actionKey: 'grants',
                  label: 'Manage grants',
                  enabled: false,
                },
                {
                  id: 'delete',
                  actionKey: 'delete',
                  label: 'Delete',
                  enabled: false,
                },
                { id: 'read', actionKey: 'read', label: 'View', enabled: true },
                {
                  id: 'update',
                  actionKey: 'update',
                  label: 'Edit',
                  enabled: false,
                },
                {
                  id: 'create',
                  actionKey: 'create',
                  label: 'Create',
                  enabled: false,
                },
              ],
            },
            {
              id: 'checker',
              title: 'Checker',
              rows: [
                {
                  id: 'check',
                  actionKey: 'check',
                  label: 'Check permissions',
                  enabled: false,
                },
              ],
            },
            {
              id: 'scheduler',
              title: 'Scheduler',
              rows: [
                {
                  id: 'run',
                  actionKey: 'run',
                  label: 'Start and stop rules',
                  enabled: false,
                },
              ],
            },
          ],
        },
      ]}
      onEnabledChange={enabled}
      onLevelChange={vi.fn()}
    />,
  );
  const controls = screen.getAllByRole('checkbox');
  for (const [index, name] of [
    'View',
    'Create',
    'Edit',
    'Delete',
    'Manage grants',
    'Check permissions',
    'Start and stop rules',
  ].entries()) {
    expect(controls[index]).toHaveAccessibleName(name);
  }
  expect(
    screen.getByRole('checkbox', { name: 'View', exact: true }),
  ).toBeChecked();
  expect(enabled).not.toHaveBeenCalled();
  await userEvent.type(screen.getByRole('textbox'), 'Manage grants');
  expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Manage grants' }),
  );
  expect(enabled).toHaveBeenCalledExactlyOnceWith('grants', true);
});

it('explains categories and allows individual review without bulk selection', async () => {
  const change = vi.fn();
  const batch = vi.fn();
  render(
    <PermissionEditor
      sections={[
        {
          id: 'accounts',
          title: 'Users and accounts',
          description: 'Review account permissions individually.',
          groups: [
            {
              id: 'security',
              title: 'Account security',
              rows: [
                {
                  id: 'disable',
                  label: 'Disable account',
                  enabled: false,
                  hint: 'Prevent further sign-in.',
                },
                { id: 'reset', label: 'Reset password', enabled: false },
              ],
            },
          ],
        },
      ]}
      onEnabledChange={change}
      onEnabledBatchChange={batch}
      onLevelChange={vi.fn()}
    />,
  );
  expect(
    screen.getByText('Review account permissions individually.'),
  ).toBeVisible();
  expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  expect(
    screen.queryByText('All', { selector: 'span' }),
  ).not.toBeInTheDocument();
  expect(screen.getByText('Prevent further sign-in.')).toBeVisible();
  expect(change).not.toHaveBeenCalled();
  expect(batch).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Disable account' }),
  );
  expect(change).toHaveBeenCalledExactlyOnceWith('disable', true);
});

it('shows scope explanations on focus or tap without changing the permission draft', async () => {
  const user = userEvent.setup();
  const enabled = vi.fn();
  const changed = vi.fn();
  render(
    <PermissionEditor
      sections={[
        {
          id: 'orders',
          title: 'Orders',
          groups: [
            {
              id: 'orders',
              title: 'Orders',
              rows: [
                {
                  id: 'view',
                  label: 'View orders',
                  enabled: true,
                  scopes: [
                    {
                      id: 'scope',
                      label: 'Orders',
                      level: '',
                      hint: 'Default access and sharing still apply.',
                      levels: [
                        { value: '', label: 'No additional record access' },
                        { value: 'all', label: 'All records' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]}
      onEnabledChange={enabled}
      onLevelChange={changed}
    />,
  );
  const help = screen.getByRole('button', {
    name: 'About the data range for View orders · Orders',
  });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  await user.click(help);
  expect(await screen.findByRole('tooltip')).toHaveTextContent(
    'Default access and sharing still apply.',
  );
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  await user.tab({ shift: true });
  await user.tab();
  expect(help).toHaveFocus();
  expect(await screen.findByRole('tooltip')).toHaveTextContent(
    'Default access and sharing still apply.',
  );
  expect(enabled).not.toHaveBeenCalled();
  expect(changed).not.toHaveBeenCalled();
});
