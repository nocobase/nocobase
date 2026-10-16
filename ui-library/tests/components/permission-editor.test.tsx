import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PermissionEditor } from '../../registry/authorization/permission-editor.js';
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
      screen.queryByRole('switch', { name: 'Manage users' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /System settings/ }));
    expect(
      screen.getByRole('switch', { name: 'Manage users' }),
    ).not.toBeChecked();
    await user.type(screen.getByRole('textbox'), 'owner');
    expect(
      screen.getByRole('switch', { name: /Edit orders/ }),
    ).not.toBeChecked();
    expect(enabled).not.toHaveBeenCalled();
    await user.click(screen.getByRole('switch', { name: /Edit orders/ }));
    expect(enabled).toHaveBeenCalledExactlyOnceWith('edit-orders', true);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(
      screen.getByRole('switch', { name: 'Manage users' }),
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
    expect(screen.getByRole('switch', { name: 'Read orders' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('switch', { name: 'Read orders' }));
    expect(enabled).not.toHaveBeenCalled();
  });
});
