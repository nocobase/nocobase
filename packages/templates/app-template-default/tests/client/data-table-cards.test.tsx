import { renderWithApp } from '@nocobase/app-testing/client';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSortMenu,
} from '../../client/components/data-table/index.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = '@nocobase/datatable-cards-test';
const namespaces = {
  [namespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};
type Item = { id: string; amount: number };
const rows: Item[] = Array.from({ length: 12 }, (_, amount) => ({
  id: `row-${amount}`,
  amount,
}));
const columns: ColumnDef<Item>[] = [
  { accessorKey: 'id', header: 'ID', enableSorting: false },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
  },
];

function stubViewport(phone: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: phone,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function List(): React.ReactElement {
  const [sorting, setSorting] = useState<SortingState>([]);
  return (
    <>
      <output aria-label='sorting'>{JSON.stringify(sorting)}</output>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        showSelectedCount={false}
        sortingState={sorting}
        onSortingChange={setSorting}
        toolbar={(table) => (
          <DataTableSortMenu
            table={table}
            getColumnLabel={(column) =>
              column.id === 'amount' ? 'Amount' : column.id
            }
          />
        )}
        renderCard={(row) => (
          <article aria-label={row.original.id}>{row.original.amount}</article>
        )}
      />
    </>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DataTable cards on phones', () => {
  it('renders cards with pagination on a phone and sorts from the sort menu', async () => {
    stubViewport(true);
    const user = userEvent.setup();
    await renderWithApp(<List />, { namespace, namespaces });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(10);
    expect(screen.getByText('Page 1 of 2')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Sort' }));
    await user.click(
      await screen.findByRole('menuitemradio', { name: 'Amount · Desc' }),
    );
    expect(screen.getByLabelText('sorting')).toHaveTextContent(
      JSON.stringify([{ id: 'amount', desc: true }]),
    );
    expect(
      within(screen.getByRole('list')).getAllByRole('article')[0],
    ).toHaveAccessibleName('row-11');
  });

  it('keeps the table on wider screens', async () => {
    stubViewport(false);
    await renderWithApp(<List />, { namespace, namespaces });

    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows the shared empty state in card mode', async () => {
    stubViewport(true);
    await renderWithApp(
      <DataTable
        columns={columns}
        data={[]}
        listState='empty'
        renderCard={(row) => <span>{row.id}</span>}
      />,
      { namespace, namespaces },
    );

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('No data yet')).toBeVisible();
  });
});
