import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { expect, it } from 'vitest';

import { DataTable } from '../client/components/data-table.js';

interface Item {
  readonly id: string;
}

function Toggle(): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <button type='button' onClick={() => setOpen(true)}>
      {open ? 'Open' : 'Closed'}
    </button>
  );
}

function List({ tick }: { readonly tick: number }): ReactElement {
  return (
    <DataTable<Item>
      // Defined inline, as the plugin's lists do: a new cell function on every render.
      columns={[{ id: 'toggle', cell: () => <Toggle /> }]}
      data={[{ id: 'a' }]}
      getRowId={(item) => item.id}
      emptyMessage={String(tick)}
    />
  );
}

it('keeps a cell’s state when the list renders again', () => {
  const { rerender } = render(<List tick={0} />);
  fireEvent.click(screen.getByRole('button', { name: 'Closed' }));
  rerender(<List tick={1} />);
  expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
});
