import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RowActions } from '#components/row-actions';

describe('RowActions', () => {
  it('renders nothing when the viewer has no action on the record', () => {
    const { container } = render(
      <RowActions label='Actions for Alpha' actions={[false, null]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps a single action in the menu behind the named trigger', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    render(
      <RowActions
        label='Actions for Alpha'
        actions={[{ key: 'open', label: 'Open', onClick: open }]}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Open' }),
    ).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Actions for Alpha' });
    await user.click(trigger);
    await user.click(await screen.findByRole('menuitem', { name: 'Open' }));
    expect(open).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('puts destructive actions last after a separator, in the given order otherwise', async () => {
    const user = userEvent.setup();
    render(
      <RowActions
        label='Actions for Alpha'
        actions={[
          { key: 'delete', label: 'Delete', destructive: true },
          { key: 'disable', label: 'Disable' },
          false,
          { key: 'revoke', label: 'Revoke sessions' },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Actions for Alpha' }));
    const menu = await screen.findByRole('menu');
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Disable',
      'Revoke sessions',
      'Delete',
    ]);
    expect(items[2]).toHaveAttribute('data-variant', 'destructive');
    expect(menu.querySelector('[role="separator"]')).not.toBeNull();
  });

  it('shows only the exposed actions outside the menu', async () => {
    const user = userEvent.setup();
    render(
      <RowActions
        label='Actions for Alpha'
        exposed={['start']}
        actions={[
          { key: 'start', label: 'Start' },
          { key: 'manage', label: 'Manage' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Start' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Actions for Alpha' }));
    expect(
      (await screen.findAllByRole('menuitem')).map((item) => item.textContent),
    ).toEqual(['Manage']);
  });

  it('does not run the row click handler when its menu is used', async () => {
    const user = userEvent.setup();
    const rowClick = vi.fn();
    const edit = vi.fn();
    render(
      <table>
        <tbody>
          <tr onClick={rowClick}>
            <td>
              <RowActions
                label='Actions for Alpha'
                actions={[{ key: 'edit', label: 'Edit', onClick: edit }]}
              />
            </td>
          </tr>
        </tbody>
      </table>,
    );
    await user.click(screen.getByRole('button', { name: 'Actions for Alpha' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(edit).toHaveBeenCalledTimes(1);
    expect(rowClick).not.toHaveBeenCalled();
  });
});
