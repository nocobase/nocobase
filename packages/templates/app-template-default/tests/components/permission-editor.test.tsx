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
    ).toHaveTextContent('1/2');
    await user.clear(screen.getByRole('textbox'));
    expect(
      screen.getByRole('checkbox', { name: 'Read orders' }),
    ).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('checkbox', { name: 'Read orders' }));
    expect(enabled).not.toHaveBeenCalled();
  });
});

describe('compact resource actions', () => {
  it('batches only visible editable changes and shows a mixed group checkbox', async () => {
    const user = userEvent.setup();
    const batch = vi.fn();
    render(
      <PermissionEditor
        sections={[
          {
            ...sections[0]!,
            groups: [
              {
                id: 'orders',
                title: 'Orders',
                rows: [
                  ...sections[0]!.groups[0]!.rows,
                  {
                    id: 'locked',
                    label: 'Protected',
                    enabled: false,
                    toggleable: false,
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
    const group = screen.getByRole('checkbox', {
      name: 'Select visible permissions in Orders',
    });
    expect(group).toHaveAttribute('aria-checked', 'mixed');
    await user.click(group);
    expect(batch).toHaveBeenLastCalledWith([
      { id: 'edit-orders', enabled: true },
    ]);
    await user.type(screen.getByRole('textbox'), 'owner');
    await user.click(
      screen.getByRole('checkbox', {
        name: 'Select visible permissions in Orders',
      }),
    );
    expect(batch).toHaveBeenLastCalledWith([
      { id: 'edit-orders', enabled: true },
    ]);
    expect(
      screen.queryByRole('checkbox', { name: 'Protected' }),
    ).not.toBeInTheDocument();
  });
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
    const view = render(<Draft />);
    await user.click(screen.getByRole('switch', { name: 'Enabled only' }));
    await user.click(screen.getByRole('checkbox', { name: 'Action' }));
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(
      'No matching permissions',
    );
    view.unmount();
    render(<Draft />);
    await user.click(screen.getByRole('switch', { name: 'Enabled only' }));
    screen
      .getByRole('checkbox', { name: 'Select visible permissions in Group' })
      .focus();
    await user.keyboard('[Space]');
    expect(screen.getByRole('textbox')).toHaveFocus();
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

it('keeps multiple inline scopes independently named and editable', async () => {
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

it('keeps the category heading consistent for a single resource and labels bulk selection explicitly', async () => {
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
    screen.getByRole('heading', { level: 2, name: 'Users' }),
  ).toBeInTheDocument();
  expect(screen.getAllByText('1/2')).toHaveLength(1);
  expect(
    screen.getByRole('checkbox', {
      name: 'Select visible permissions in Users',
    }),
  ).toHaveAttribute('aria-checked', 'mixed');
  await userEvent.click(screen.getByText('All', { selector: 'span' }));
  expect(batch).toHaveBeenCalledExactlyOnceWith([
    { id: 'edit', enabled: true },
  ]);
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
