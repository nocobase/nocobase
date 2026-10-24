import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  PermissionEditor,
  type PermissionEditorSection,
} from '../../client/components/permission-editor.js';

const sections = [
  {
    id: 'business',
    title: 'Business actions',
    description: 'Choose what staff can do.',
    groups: [
      {
        id: 'orders',
        title: 'Orders',
        hint: 'Order processing.',
        rows: [
          {
            id: 'approve',
            label: 'Approve order',
            actionKey: 'approve',
            hint: 'Confirm the order and reserve stock.',
            enabled: true,
          },
          {
            id: 'withdraw',
            label: 'Withdraw order',
            actionKey: 'withdraw',
            hint: 'Withdraw an unprocessed order.',
            enabled: false,
          },
        ],
      },
    ],
  },
  {
    id: 'configuration',
    title: 'Application configuration',
    groups: [
      {
        id: 'numbering',
        title: 'Order numbering',
        rows: [
          { id: 'configure', label: 'Configure numbering', enabled: false },
        ],
      },
    ],
  },
];

describe('application-owned permission workspace', () => {
  it('renders caller order and custom actions without a built-in catalog or CRUD controls', () => {
    render(
      <PermissionEditor
        sections={sections}
        onEnabledChange={vi.fn()}
        onLevelChange={vi.fn()}
      />,
    );
    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter(
        (item) =>
          item.getAttribute('aria-label') !== 'Enabled only' &&
          item.id !== screen.getByRole('checkbox', { name: 'Enabled only' }).id,
      );
    expect(checkboxes.map((item) => item.textContent)).toHaveLength(2);
    expect(checkboxes[0]).toHaveAccessibleName('Approve order');
    expect(checkboxes[1]).toHaveAccessibleName('Withdraw order');
    expect(
      screen.queryByRole('checkbox', { name: 'Configure numbering' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Permission categories' }),
    ).toBeVisible();
    expect(
      screen.getByText('Confirm the order and reserve stock.'),
    ).toBeVisible();
    expect(screen.getByText('Order processing.')).toBeVisible();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByText('System and tools')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders a meaningful empty state without adding permissions', () => {
    render(
      <PermissionEditor
        sections={[]}
        onEnabledChange={vi.fn()}
        onLevelChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'No permissions to configure',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Ask the application developer',
    );
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('filters globally by descriptions and parent names without changing the draft', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <PermissionEditor
        sections={sections}
        onEnabledChange={change}
        onLevelChange={vi.fn()}
      />,
    );
    await user.type(screen.getByRole('textbox'), 'reserve stock');
    expect(
      screen.getByRole('checkbox', { name: 'Approve order' }),
    ).toBeChecked();
    expect(
      screen.queryByRole('checkbox', { name: 'Withdraw order' }),
    ).not.toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'Order processing');
    expect(
      screen.getByRole('checkbox', { name: 'Withdraw order' }),
    ).toBeVisible();
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'missing');
    expect(screen.getByRole('status')).toHaveTextContent(
      'No matching permissions',
    );
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(
      screen.getByRole('checkbox', { name: 'Withdraw order' }),
    ).not.toBeChecked();
    expect(change).not.toHaveBeenCalled();
  });

  it('keeps the original category navigation and restores the selected category after global search', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <PermissionEditor
        sections={sections}
        onEnabledChange={change}
        onLevelChange={vi.fn()}
      />,
    );
    const category = screen.getByRole('button', {
      name: 'Application configuration',
    });
    await user.click(category);
    expect(category).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('checkbox', { name: 'Configure numbering' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('checkbox', { name: 'Approve order' }),
    ).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), 'reserve stock');
    expect(
      screen.getByRole('checkbox', { name: 'Approve order' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(
      screen.getByRole('checkbox', { name: 'Configure numbering' }),
    ).toBeVisible();
    expect(category).toHaveAttribute('aria-current', 'page');
    await user.type(screen.getByRole('textbox'), 'missing');
    await user.click(screen.getByRole('button', { name: 'Business actions' }));
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(
      screen.getByRole('checkbox', { name: 'Approve order' }),
    ).toBeVisible();
    expect(change).not.toHaveBeenCalled();
  });

  it('supports normal typing, middle edits and Chinese composition', async () => {
    const user = userEvent.setup();
    render(
      <PermissionEditor
        sections={[
          {
            id: 'cn',
            title: '审批',
            groups: [
              {
                id: 'g',
                rows: [{ id: 'a', label: '审批借用', enabled: true }],
              },
            ],
          },
        ]}
        onEnabledChange={vi.fn()}
        onLevelChange={vi.fn()}
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '审批' } });
    fireEvent.compositionEnd(input, { data: '审批' });
    expect(input).toHaveValue('审批');
    expect(screen.getByRole('checkbox', { name: '审批借用' })).toBeVisible();
    await user.clear(input);
    await user.type(input, '借用');
    await user.keyboard('{Home}审批');
    expect(input).toHaveValue('审批借用');
  });

  it('emits only explicit changes and restores focus when an enabled-only result disappears', async () => {
    const user = userEvent.setup();
    const batch = vi.fn();
    function Draft() {
      const [enabled, setEnabled] = useState(true);
      return (
        <PermissionEditor
          sections={[
            {
              id: 's',
              title: 'Section',
              groups: [
                { id: 'g', rows: [{ id: 'a', label: 'Approve', enabled }] },
              ],
            },
          ]}
          onEnabledChange={(_, value) => setEnabled(value)}
          onEnabledBatchChange={batch}
          onLevelChange={vi.fn()}
        />
      );
    }
    render(<Draft />);
    await user.click(screen.getByRole('checkbox', { name: 'Enabled only' }));
    await user.click(screen.getByRole('checkbox', { name: 'Approve' }));
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(
      'No matching permissions',
    );
    expect(batch).not.toHaveBeenCalled();
  });

  it('keeps readonly and application-managed checkboxes disabled with visible explanations', async () => {
    const change = vi.fn();
    const view = render(
      <PermissionEditor
        sections={sections}
        readOnly
        onEnabledChange={change}
        onLevelChange={vi.fn()}
      />,
    );
    const action = screen.getByRole('checkbox', { name: 'Approve order' });
    expect(action).toHaveAttribute('aria-disabled', 'true');
    expect(action).toHaveAccessibleDescription(
      /These permissions are read-only/,
    );
    await userEvent.click(action);
    expect(change).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole('textbox'), 'numbering');
    expect(
      screen.getByRole('checkbox', { name: 'Configure numbering' }),
    ).toBeVisible();
    view.unmount();
    render(
      <PermissionEditor
        sections={[
          {
            id: 's',
            title: 'Section',
            groups: [
              {
                id: 'g',
                rows: [
                  {
                    id: 'fixed',
                    label: 'Fixed action',
                    enabled: true,
                    toggleable: false,
                  },
                ],
              },
            ],
          },
        ]}
        onEnabledChange={change}
        onLevelChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('checkbox', { name: 'Fixed action' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByText('This permission is managed by the application.'),
    ).toBeVisible();
  });

  it('uses instance-local control ids and does not submit the enclosing form', async () => {
    const user = userEvent.setup();
    const submit = vi.fn((event) => event.preventDefault());
    const change = vi.fn();
    render(
      <form onSubmit={submit}>
        {[1, 2].map((key) => (
          <PermissionEditor
            key={key}
            sections={sections}
            onEnabledChange={change}
            onLevelChange={vi.fn()}
          />
        ))}
      </form>,
    );
    const actions = screen.getAllByRole('checkbox', { name: 'Withdraw order' });
    expect(actions[0]!.id).not.toBe(actions[1]!.id);
    await user.click(actions[0]!);
    expect(change).toHaveBeenCalledExactlyOnceWith('withdraw', true);
    actions[1]!.focus();
    await user.keyboard(' ');
    expect(change).toHaveBeenCalledTimes(2);
    expect(change).toHaveBeenLastCalledWith('withdraw', true);
    screen.getAllByRole('checkbox', { name: 'Enabled only' })[0]!.focus();
    await user.keyboard(' ');
    expect(change).toHaveBeenCalledTimes(2);
    await user.type(screen.getAllByRole('textbox')[0]!, 'missing');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await user.click(
      screen.getAllByRole('button', { name: 'Application configuration' })[0]!,
    );
    screen.getByRole('checkbox', { name: 'Configure numbering' }).focus();
    await user.keyboard(' ');
    expect(change).toHaveBeenLastCalledWith('configure', true);
    expect(submit).not.toHaveBeenCalled();
  });

  it('uses a page title once for a single access action', () => {
    render(
      <PermissionEditor
        sections={[
          {
            id: 'pages',
            title: 'Pages',
            groups: [
              {
                id: 'p',
                title: 'Borrowing',
                accessOnly: true,
                rows: [{ id: 'page-access', label: 'Access', enabled: true }],
              },
            ],
          },
        ]}
        onEnabledChange={vi.fn()}
        onLevelChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('checkbox', { name: 'Borrowing' })).toBeChecked();
    expect(screen.queryByText('Access')).not.toBeInTheDocument();
  });
});

describe('action-owned data ranges', () => {
  const scoped = [
    {
      id: 's',
      title: 'Business',
      groups: [
        {
          id: 'g',
          title: 'Borrowing',
          rows: [
            {
              id: 'approve',
              label: 'Approve request',
              enabled: true,
              scopes: ['Requests', 'Devices'].map((label) => ({
                id: label.toLowerCase(),
                label,
                level: 'own',
                hint: 'This role adds no records; other roles and rules also apply.',
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
  ];

  it('shows every named range directly and changes only its independently keyed value', async () => {
    const change = vi.fn();
    const enabled = vi.fn();
    const view = render(
      <PermissionEditor
        sections={scoped}
        onEnabledChange={enabled}
        onLevelChange={change}
      />,
    );
    expect(screen.getByText('Requests')).toBeVisible();
    expect(screen.getByText('Devices')).toBeVisible();
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(
      screen.getByText(
        'This role adds no records; other roles and rules also apply.',
      ),
    ).toBeVisible();
    const row = view.container.querySelector('[data-slot=permission-row]')!;
    expect(
      within(row as HTMLElement).getByRole('checkbox'),
    ).toHaveAccessibleName('Approve request');
    await userEvent.click(
      screen.getByRole('combobox', {
        name: 'How far Approve request · Devices reaches',
      }),
    );
    await userEvent.click(await screen.findByRole('option', { name: 'All' }));
    expect(change).toHaveBeenCalledExactlyOnceWith('devices', 'all');
    expect(enabled).not.toHaveBeenCalled();
  });

  it('disables range controls in readonly mode and hides them only when the action is disabled', () => {
    const view = render(
      <PermissionEditor
        sections={scoped}
        readOnly
        onEnabledChange={vi.fn()}
        onLevelChange={vi.fn()}
      />,
    );
    expect(
      screen
        .getAllByRole('combobox')
        .every((node) => node.hasAttribute('disabled')),
    ).toBe(true);
    view.rerender(
      <PermissionEditor
        sections={[
          {
            ...scoped[0]!,
            groups: [
              {
                ...scoped[0]!.groups[0]!,
                rows: [{ ...scoped[0]!.groups[0]!.rows[0]!, enabled: false }],
              },
            ],
          },
        ]}
        onEnabledChange={vi.fn()}
        onLevelChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('keeps help and parameter configuration separate from authorization toggles', async () => {
    const enabled = vi.fn();
    const changed = vi.fn();
    const view = render(
      <PermissionEditor
        sections={[
          {
            id: 's',
            title: 'Business',
            groups: [
              {
                id: 'g',
                rows: [
                  {
                    id: 'view',
                    label: 'View requests',
                    enabled: true,
                    scopes: [
                      {
                        id: 'records',
                        label: 'Requests',
                        level: '',
                        hint: 'Default access and sharing still apply.',
                        levels: [
                          { value: '', label: 'No additional record access' },
                          { value: 'all', label: 'All records' },
                        ],
                        configuration: (
                          <button type='button'>Configure filter</button>
                        ),
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
      name: 'About the data range for View requests · Requests',
    });
    await userEvent.click(help);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Default access and sharing still apply.',
    );
    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      screen.getByRole('button', { name: 'Configure filter' }),
    );
    expect(enabled).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
    expect(
      view.container.querySelectorAll('[data-slot=permission-row]'),
    ).toHaveLength(1);
  });
});

const treeSection: PermissionEditorSection = {
  id: 'pages',
  title: 'Page access',
  groups: [
    {
      id: 'page-rows',
      rows: [
        { id: 'catalog', label: 'Catalog', enabled: true },
        { id: 'books', label: 'Books', enabled: true },
        { id: 'review', label: 'Review loans', enabled: false },
        { id: 'outside', label: 'Independent page', enabled: false },
      ],
    },
  ],
  navigation: [
    {
      id: 'library-group',
      label: 'Library',
      children: [
        {
          id: 'catalog-node',
          label: 'Catalog',
          rowId: 'catalog',
          children: [
            { id: 'books-node', label: 'Books', rowId: 'books' },
            {
              id: 'review-group',
              label: 'Approvals',
              children: [
                { id: 'review-node', label: 'Review loans', rowId: 'review' },
              ],
            },
          ],
        },
      ],
    },
    { id: 'empty', label: 'Unused group', children: [] },
    { id: 'missing', label: 'Unknown page', rowId: 'unknown' },
    { id: 'alias', label: 'Duplicate books', rowId: 'books' },
  ],
};

describe('application-owned page navigation', () => {
  it('renders nested groups and independent parent/page grants without duplicates or invented checkboxes', () => {
    const change = vi.fn();
    render(
      <PermissionEditor
        sections={[treeSection]}
        onEnabledChange={change}
        onLevelChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Collapse Library' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('checkbox', { name: 'Catalog' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Books' })).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Review loans' }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Independent page' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('checkbox', { name: 'Library' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Unused group')).not.toBeInTheDocument();
    expect(screen.queryByText('Unknown page')).not.toBeInTheDocument();
    expect(screen.queryByText('Duplicate books')).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: 'Books' })).toHaveLength(1);
    expect(change).not.toHaveBeenCalled();
  });

  it('separates keyboard disclosure, individual grants and the host form submit', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <PermissionEditor
          sections={[treeSection]}
          onEnabledChange={change}
          onLevelChange={vi.fn()}
        />
      </form>,
    );
    const collapse = screen.getByRole('button', { name: 'Collapse Catalog' });
    collapse.focus();
    await user.keyboard('{Enter}');
    expect(
      screen.queryByRole('checkbox', { name: 'Books' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Catalog' })).toBeChecked();
    expect(change).not.toHaveBeenCalled();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Books' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Catalog' }));
    expect(change).toHaveBeenCalledExactlyOnceWith('catalog', false);
    expect(screen.getByRole('checkbox', { name: 'Books' })).toBeChecked();
    expect(submit).not.toHaveBeenCalled();
  });

  it('searches ancestor names, preserves paths and restores collapse state after Clear', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <PermissionEditor
        sections={[treeSection]}
        onEnabledChange={change}
        onLevelChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Collapse Catalog' }));
    await user.type(screen.getByRole('textbox'), 'Library');
    expect(screen.getByRole('checkbox', { name: 'Books' })).toBeVisible();
    expect(
      screen.getByRole('checkbox', { name: 'Review loans' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('checkbox', { name: 'Independent page' }),
    ).not.toBeInTheDocument();
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'Review loans');
    expect(screen.getByText('Library')).toBeVisible();
    expect(screen.getByText('Approvals')).toBeVisible();
    expect(
      screen.queryByRole('checkbox', { name: 'Books' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: 'Catalog' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(
      screen.queryByRole('checkbox', { name: 'Review loans' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand Catalog' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(change).not.toHaveBeenCalled();
  });

  it('retains enabled-only ancestor context and moves focus before a disabled row disappears', async () => {
    const user = userEvent.setup();
    function ControlledTree() {
      const [enabled, setEnabled] = useState(true);
      return (
        <PermissionEditor
          sections={[
            {
              ...treeSection,
              groups: [
                {
                  id: 'books',
                  rows: [{ id: 'books', label: 'Books', enabled }],
                },
              ],
            },
          ]}
          onEnabledChange={(_, value) => setEnabled(value)}
          onLevelChange={vi.fn()}
        />
      );
    }
    render(<ControlledTree />);
    await user.click(screen.getByRole('checkbox', { name: 'Enabled only' }));
    expect(screen.getByText('Library')).toBeVisible();
    expect(screen.getByText('Catalog')).toBeVisible();
    expect(screen.queryByText('Approvals')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Books' }));
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(
      'No matching permissions',
    );
  });

  it('keeps a single-level menu flat and allows read-only disclosure without editing grants', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { rerender } = render(
      <PermissionEditor
        sections={[
          {
            ...treeSection,
            navigation: [{ id: 'books', label: 'Books', rowId: 'books' }],
          },
        ]}
        onEnabledChange={change}
        onLevelChange={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('list')).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: /Collapse|Expand/ }),
    ).not.toBeInTheDocument();
    rerender(
      <PermissionEditor
        sections={[treeSection]}
        readOnly
        onEnabledChange={change}
        onLevelChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('checkbox', { name: 'Books' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('checkbox', { name: 'Books' }));
    expect(change).not.toHaveBeenCalled();
    expect(
      screen.getByRole('checkbox', { name: 'Books' }),
    ).toHaveAccessibleDescription('These permissions are read-only.');
    await user.click(screen.getByRole('button', { name: 'Collapse Library' }));
    expect(
      screen.getByRole('button', { name: 'Expand Library' }),
    ).toBeEnabled();
    expect(change).not.toHaveBeenCalled();
  });
});
