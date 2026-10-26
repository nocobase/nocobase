import { renderWithApp } from '@nocobase/app-testing/client';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableViewOptions,
} from '../../client/components/data-table/index.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
const namespace = '@nocobase/datatable-test';
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
  { accessorKey: 'id', header: 'ID', enableHiding: false },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
  },
];
describe('standard DataTable', () => {
  it('uses real TanStack sorting, pagination and column visibility with restoration', async () => {
    const user = userEvent.setup();
    await renderWithApp(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        showSelectedCount={false}
        toolbar={(table) => (
          <DataTableViewOptions table={table} getColumnLabel={() => 'Amount'} />
        )}
      />,
      { namespace, namespaces },
    );
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
    expect(screen.queryByText('row-10')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getByText('row-10')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Go to previous page' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Amount', exact: true }),
    );
    await user.click(
      await screen.findByRole('menuitem', { name: 'Desc', exact: true }),
    );
    expect(
      within(screen.getAllByRole('row')[1]!).getByText('row-11'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'View', exact: true }));
    await user.click(
      await screen.findByRole('menuitemcheckbox', {
        name: 'Amount',
        exact: true,
      }),
    );
    expect(screen.getAllByRole('columnheader', { hidden: true })).toHaveLength(
      1,
    );
    await user.click(
      await screen.findByRole('menuitemcheckbox', {
        name: 'Amount',
        exact: true,
      }),
    );
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
  });
  it('preserves the server page and sort instead of applying client paging or sorting again', async () => {
    const user = userEvent.setup();
    const pageRows = rows.slice(0, 2);
    function ServerPage() {
      const [page, setPage] = useState<PaginationState>({
        pageIndex: 2,
        pageSize: 2,
      });
      return (
        <DataTable
          columns={columns}
          data={pageRows}
          manualPagination
          rowCount={12}
          paginationState={page}
          onPaginationChange={setPage}
          manualSorting
          sortingState={[{ id: 'amount', desc: true }]}
          showSelectedCount={false}
          pageSizeOptions={[2]}
        />
      );
    }
    await renderWithApp(<ServerPage />, { namespace, namespaces });
    expect(screen.getByText('Page 3 of 6')).toBeVisible();
    expect(screen.getByText('row-0')).toBeVisible();
    expect(
      within(screen.getAllByRole('row')[1]!).getByText('row-0'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getByText('Page 4 of 6')).toBeVisible();
    expect(screen.getByText('row-0')).toBeVisible();
  });
  it('keeps empty-state and paging controls localized in Chinese', async () => {
    await renderWithApp(
      <DataTable columns={columns} data={[]} showSelectedCount={false} />,
      { namespace, namespaces, locale: 'zh-CN' },
    );
    expect(screen.getByText(zhCN.dataTable.noResults)).toBeVisible();
    expect(
      screen.getByRole('button', { name: zhCN.dataTable.nextPage }),
    ).toBeDisabled();
  });
});
