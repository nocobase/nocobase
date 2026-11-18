import { useState, type ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  PermissionEditor,
  type PermissionGrants,
  type PermissionModule,
} from '../../registry/authorization/permission-editor.js';

const RECORDS = [
  { value: 'all', label: 'All records' },
  { value: 'department', label: 'Their department' },
  { value: 'own', label: 'Their own records' },
];

const modules: readonly PermissionModule[] = [
  {
    id: 'home',
    label: 'Home',
    menus: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        public: 'Everyone can open it.',
        actions: [],
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    menus: [
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
            id: 'contracts.update',
            label: 'Edit contracts',
            scopes: [{ id: 'records', followsView: true }],
          },
          {
            id: 'contracts.export',
            label: 'Export contracts',
            risk: 'sensitive',
          },
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
              { id: 'department', label: 'Contracts of', options: RECORDS },
            ],
          },
        ],
      },
      {
        id: 'orders',
        label: 'Orders',
        actions: [
          { id: 'orders.view', label: 'View orders', view: true },
          { id: 'orders.sync', label: 'Sync orders', managed: true },
          {
            id: 'orders.export',
            label: 'Export orders',
            requires: ['orders.sync'],
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
        id: 'roles',
        label: 'Roles & permissions',
        group: 'Access control',
        notice: 'Anyone who can edit roles can grant any permission.',
        actions: [
          { id: 'roles.view', label: 'View roles', view: true },
          { id: 'roles.update', label: 'Create and edit roles', risk: 'high' },
        ],
      },
    ],
  },
];

function Host({
  initial,
  onChange,
}: {
  readonly initial: PermissionGrants;
  readonly onChange?: (next: PermissionGrants) => void;
}): ReactElement {
  const [value, setValue] = useState(initial);
  return (
    <PermissionEditor
      modules={modules}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const trigger = (name: string): HTMLElement =>
  screen.getByRole('combobox', { name });

describe('two-column permission editor', () => {
  it('shows the menu tree with counts and the first configurable menu', () => {
    render(
      <Host
        initial={{ 'contracts.view': { scopes: { records: 'department' } } }}
      />,
    );
    const tree = screen.getByRole('navigation', { name: 'Menus' });
    expect(within(tree).getByText('Administration')).toBeInTheDocument();
    expect(
      within(tree).getByRole('button', { name: /^Contracts,\s*1\/4$/ }),
    ).toHaveAttribute('aria-current', 'true');
    expect(
      screen.getByRole('heading', { name: 'Contracts' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Visible in menu')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 menus visible')).toBeInTheDocument();
    // View is first; Edit follows its scope.
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toHaveAccessibleName('View contracts');
    expect(trigger('Data scope of Edit contracts')).toHaveTextContent(
      'Same as view (Their department)',
    );
    expect(trigger('Data scope of Edit contracts')).toBeDisabled();
    expect(screen.getByText('Sensitive')).toBeInTheDocument();
  });

  it('turns on View with an action and updates counts and visibility', async () => {
    const user = userEvent.setup();
    render(<Host initial={{}} />);
    expect(screen.getByText('Hidden from menu')).toBeInTheDocument();
    expect(screen.getByText('0 of 3 menus visible')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Edit contracts' }));
    expect(
      screen.getByRole('switch', { name: 'View contracts' }),
    ).toBeChecked();
    expect(
      screen.getByText('Also turned on View contracts, which this needs.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Visible in menu')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 menus visible')).toBeInTheDocument();
  });

  it('asks before turning off View that other actions need', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Host
        initial={{ 'contracts.view': {}, 'contracts.update': {} }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('switch', { name: 'View contracts' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Turning off View contracts also turns off Edit contracts, which needs it.',
    );
    await user.click(screen.getByRole('button', { name: 'Turn off' }));
    expect(onChange).toHaveBeenLastCalledWith({});
    expect(screen.getByText('Hidden from menu')).toBeInTheDocument();
  });

  it('cancels an open confirmation when the host turns read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value = { 'contracts.view': {}, 'contracts.update': {} };
    const { rerender } = render(
      <PermissionEditor modules={modules} value={value} onChange={onChange} />,
    );
    await user.click(screen.getByRole('switch', { name: 'View contracts' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(
      <PermissionEditor
        modules={modules}
        value={value}
        onChange={onChange}
        readOnly
      />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Turn off' })).toBeNull();
    rerender(
      <PermissionEditor modules={modules} value={value} onChange={onChange} />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('says a managed requirement cannot be turned on here instead of asking the user to', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host initial={{}} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /^Orders/ }));
    await user.click(screen.getByRole('switch', { name: 'Export orders' }));
    expect(
      screen.getByRole('switch', { name: 'Export orders' }),
    ).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'orders.export': expect.anything() }),
    );
    expect(
      screen.getByText(
        'Export orders stays off. It needs Sync orders, which is managed by the application and cannot be turned on here.',
      ),
    ).toBeInTheDocument();
  });

  it('narrows Edit and resets it when View becomes narrower', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Host
        initial={{
          'contracts.view': { scopes: { records: 'all' } },
          'contracts.update': {},
        }}
        onChange={onChange}
      />,
    );
    await user.click(trigger('Data scope of Edit contracts'));
    await user.click(
      await screen.findByRole('option', { name: 'Their department' }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      'contracts.view': { scopes: { records: 'all' } },
      'contracts.update': { scopes: { records: 'department' } },
    });
    await user.click(trigger('Data scope of View contracts'));
    await user.click(
      await screen.findByRole('option', { name: 'Their own records' }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      'contracts.view': { scopes: { records: 'own' } },
      'contracts.update': { scopes: {} },
    });
    expect(
      screen.getByText(
        'Edit contracts now follows the view scope (Their own records) again, because it was wider.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Same as view (Their own records)'),
    ).toBeInTheDocument();
  });

  it('shows each scope of a multi-scope action and leaves risky actions off with Enable all', async () => {
    const user = userEvent.setup();
    render(<Host initial={{}} />);
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
    expect(trigger('Approve contracts: Contracts of')).toHaveTextContent(
      'All records',
    );
    await user.click(screen.getByRole('button', { name: 'View only' }));
    expect(screen.getByText('1 of 4 enabled')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disable all' }));
    expect(screen.getByText('0 of 4 enabled')).toBeInTheDocument();
  });

  it('filters menus by action name and moves to the next menu', async () => {
    const user = userEvent.setup();
    render(<Host initial={{}} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Search menus or permissions' }),
      'edit roles',
    );
    const tree = screen.getByRole('navigation', { name: 'Menus' });
    expect(
      within(tree).queryByRole('button', { name: /^Contracts/ }),
    ).toBeNull();
    await user.click(
      within(tree).getByRole('button', { name: /Roles & permissions/ }),
    );
    expect(
      screen.getByText('Anyone who can edit roles can grant any permission.'),
    ).toBeInTheDocument();
    expect(screen.getByText('High risk')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    await user.click(within(tree).getByRole('button', { name: /^Contracts/ }));
    await user.click(screen.getByRole('button', { name: 'Next: Orders' }));
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
  });

  it('explains public menus and unrestricted roles without controls', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Host initial={{}} />);
    await user.click(screen.getByRole('button', { name: /Dashboard/ }));
    expect(
      screen.getByText(
        'Everyone can open it. Every signed-in user can open it. No permission needed.',
      ),
    ).toBeInTheDocument();
    unmount();
    render(
      <PermissionEditor
        modules={modules}
        value={{}}
        onChange={vi.fn()}
        unrestricted
        header={<span>Administrator</span>}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'All permissions (unrestricted)' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('disables every control when read-only', () => {
    render(
      <PermissionEditor
        modules={modules}
        value={{ 'contracts.view': {} }}
        onChange={vi.fn()}
        readOnly
      />,
    );
    for (const control of screen.getAllByRole('switch'))
      expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('button', { name: 'Enable all' })).toBeNull();
    expect(
      screen.getByText('These permissions are read-only.'),
    ).toBeInTheDocument();
  });
});
