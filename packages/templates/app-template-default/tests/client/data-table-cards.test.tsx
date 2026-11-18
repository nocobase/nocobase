import { renderWithApp } from '@nocobase/app-testing/client';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { act } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableFilter,
  DataTableSearch,
  DataTableSortMenu,
} from '../../client/components/data-table/index.js';
import { Checkbox } from '../../client/components/ui/checkbox.js';
import { useTableUrlState } from '../../client/hooks/use-table-url-state.js';
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
            compact
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

/** A viewport whose width the test switches across the phone breakpoint. */
function switchableViewport(): (phone: boolean) => void {
  let phone = false;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return phone;
    },
    media: query,
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  }));
  return (next) => {
    phone = next;
    act(() => {
      for (const listener of listeners) listener();
    });
  };
}

const selectableColumns: ColumnDef<Item>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type='checkbox'
        aria-label='Select all'
        checked={table.getIsAllPageRowsSelected()}
        ref={(input) => {
          if (input)
            input.indeterminate =
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected();
        }}
        onChange={(event) =>
          table.toggleAllPageRowsSelected(event.target.checked)
        }
      />
    ),
    cell: ({ row }) => (
      <input
        type='checkbox'
        aria-label={`Select ${row.original.id}`}
        checked={row.getIsSelected()}
        onChange={(event) => row.toggleSelected(event.target.checked)}
      />
    ),
  },
  ...columns,
];

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

  it('keeps selection, page and sort when the width crosses the phone breakpoint', async () => {
    const setPhone = switchableViewport();
    const user = userEvent.setup();
    function Selectable(): React.ReactElement {
      const [sorting, setSorting] = useState<SortingState>([]);
      return (
        <DataTable
          columns={selectableColumns}
          data={rows}
          getRowId={(row) => row.id}
          showSelectedCount={false}
          sortingState={sorting}
          onSortingChange={setSorting}
          renderCard={(row) => (
            <article aria-label={row.original.id}>
              {row.getIsSelected() ? 'selected' : 'not selected'}
            </article>
          )}
        />
      );
    }
    await renderWithApp(<Selectable />, { namespace, namespaces });

    // Desktop: sort descending from the header, go to page 2, select a row there.
    await user.click(
      screen.getByRole('button', { name: 'Amount', exact: true }),
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Desc' }));
    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select row-0' }));

    setPhone(true);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeVisible();
    const cards = within(screen.getByRole('list')).getAllByRole('article');
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual([
      'row-1',
      'row-0',
    ]);
    expect(cards[1]).toHaveTextContent(/^selected$/);

    setPhone(false);
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByText('Page 2 of 2')).toBeVisible();
    expect(
      screen.getByRole('checkbox', { name: 'Select row-0' }),
    ).toBeChecked();
  });

  it('keeps select all on this page above the cards, with partial selection', async () => {
    stubViewport(true);
    const user = userEvent.setup();
    await renderWithApp(
      <DataTable
        columns={selectableColumns}
        data={rows}
        getRowId={(row) => row.id}
        renderCard={(row) => (
          <article aria-label={row.original.id}>
            <input
              type='checkbox'
              aria-label={`Select card ${row.original.id}`}
              checked={row.getIsSelected()}
              onChange={(event) => row.toggleSelected(event.target.checked)}
            />
          </article>
        )}
      />,
      { namespace, namespaces },
    );
    const all = screen.getByRole('checkbox', { name: 'Select all' });
    expect(screen.getByText('Select all on this page')).toBeVisible();

    await user.click(
      screen.getByRole('checkbox', { name: 'Select card row-0' }),
    );
    expect(all).not.toBeChecked();
    expect(all).toHaveProperty('indeterminate', true);

    // The visible label is part of the control, a larger target for a finger.
    await user.click(screen.getByText('Select all on this page'));
    expect(all).toBeChecked();
    expect(screen.getByText('10 of 12 row(s) selected.')).toBeVisible();

    // Select all covers the current page only.
    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(all).not.toBeChecked();
    await user.click(
      screen.getByRole('button', { name: 'Go to previous page' }),
    );
    await user.click(all);
    expect(screen.queryByText(/row\(s\) selected/u)).toHaveTextContent(
      '0 of 12 row(s) selected.',
    );
  });

  it.each([
    ['en-US', ['Amount · Asc', 'Amount · Desc'], 'Amount · Desc'],
    ['zh-CN', ['金额 · 升序', '金额 · 降序'], '金额 · 降序'],
  ] as const)(
    'offers only the sorts the URL accepts, with translated labels, in %s',
    async (locale, items, choice) => {
      stubViewport(true);
      const user = userEvent.setup();
      type Repair = { id: string; amount: number; status: string };
      const repairs: Repair[] = rows.map((row) => ({
        ...row,
        status: row.amount % 2 ? 'open' : 'done',
      }));
      // Every accessor column is sortable by default; the URL accepts only amount.
      const repairColumns: ColumnDef<Repair>[] = [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'status', header: 'Status' },
      ];
      function Repairs(): React.ReactElement {
        const { i18n } = useTranslation();
        const location = useLocation();
        const tableState = useTableUrlState({ sortColumns: ['amount'] });
        const labels: Record<string, string> =
          i18n.language === 'zh-CN'
            ? { amount: '金额', status: '状态', id: '编号' }
            : { amount: 'Amount', status: 'Status', id: 'ID' };
        return (
          <>
            <output aria-label='search'>{location.search}</output>
            <DataTable
              columns={repairColumns}
              data={repairs}
              getRowId={(row) => row.id}
              {...tableState}
              toolbar={(table) => (
                <DataTableSortMenu
                  table={table}
                  compact
                  getColumnLabel={(column) => labels[column.id]}
                />
              )}
              renderCard={(row) => (
                <article aria-label={row.original.id}>
                  {row.original.id}
                </article>
              )}
            />
          </>
        );
      }
      await renderWithApp(<Repairs />, {
        namespace,
        namespaces,
        locale,
        route: '/repairs?page=1&pageSize=10',
      });
      await user.click(
        screen.getByRole('button', {
          name: locale === 'zh-CN' ? '排序' : 'Sort',
        }),
      );
      const options = await screen.findAllByRole('menuitemradio');
      expect(options.map((option) => option.textContent)).toEqual(items);
      await user.click(screen.getByRole('menuitemradio', { name: choice }));
      expect(screen.getByLabelText('search')).toHaveTextContent(
        '?pageSize=10&sort=amount&order=desc',
      );
    },
  );

  it('offers no header sort for a column the URL does not accept', async () => {
    stubViewport(false);
    function Desktop(): React.ReactElement {
      const tableState = useTableUrlState({ sortColumns: ['id'] });
      return (
        <DataTable
          columns={[
            {
              accessorKey: 'id',
              header: ({ column }) => (
                <DataTableColumnHeader column={column} title='ID' />
              ),
            },
            ...columns.slice(1),
          ]}
          data={rows}
          {...tableState}
        />
      );
    }
    await renderWithApp(<Desktop />, { namespace, namespaces });
    expect(screen.getByRole('button', { name: /^ID/u })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /^Amount/u }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
  });

  it('names the phone select-all checkbox once, also when partly selected', async () => {
    stubViewport(true);
    const user = userEvent.setup();
    const baseColumns: ColumnDef<Item>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            aria-label='Select all on this page'
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.id}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(value)}
          />
        ),
      },
      ...columns,
    ];
    await renderWithApp(
      <DataTable
        columns={baseColumns}
        data={rows}
        getRowId={(row) => row.id}
        renderCard={(row) => (
          <article aria-label={row.original.id}>
            <Checkbox
              aria-label={`Select card ${row.original.id}`}
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(value)}
            />
          </article>
        )}
      />,
      { namespace, namespaces },
    );
    const all = screen.getByRole('checkbox', {
      name: 'Select all on this page',
    });
    expect(all).toHaveAccessibleName('Select all on this page');
    await user.click(
      screen.getByRole('checkbox', { name: 'Select card row-0' }),
    );
    expect(all).toHaveAttribute('aria-checked', 'mixed');
    expect(all).toHaveAccessibleName('Select all on this page');
    // The visible text stays a tap target.
    await user.click(screen.getByText('Select all on this page'));
    expect(all).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps Clear filters beside the controls while filtered results show', async () => {
    stubViewport(true);
    const user = userEvent.setup();
    const clear = vi.fn();
    const view = await renderWithApp(
      <DataTable
        columns={columns}
        data={rows.slice(0, 3)}
        listState='ready'
        filtered
        onClearFilters={clear}
        toolbar={() => <input aria-label='Search' />}
        renderCard={(row) => <article aria-label={row.original.id} />}
      />,
      { namespace, namespaces },
    );
    expect(screen.getAllByRole('article')).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(clear).toHaveBeenCalledOnce();
    view.rerender(
      <DataTable
        columns={columns}
        data={rows.slice(0, 3)}
        listState='ready'
        filtered={false}
        onClearFilters={clear}
        toolbar={() => <input aria-label='Search' />}
        renderCard={(row) => <article aria-label={row.original.id} />}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument();
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

describe('DataTable search, filters and sort on one row', () => {
  function Toolbar({ count = 2 }: { readonly count?: number }) {
    return (
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        search={<input aria-label='Search' />}
        filters={
          <>
            <DataTableFilter label='Status'>
              <select aria-label='Status' />
            </DataTableFilter>
            <DataTableFilter label='Priority'>
              <select aria-label='Priority' />
            </DataTableFilter>
          </>
        }
        filterCount={count}
        getColumnLabel={(column) =>
          column.id === 'amount' ? 'Amount' : column.id
        }
        renderCard={(row) => <article aria-label={row.original.id} />}
      />
    );
  }

  it('puts search, an applied-count Filters button and Sort on the phone row, with the filters in a sheet', async () => {
    stubViewport(true);
    const user = userEvent.setup();
    const { container } = await renderWithApp(<Toolbar />, {
      namespace,
      namespaces,
    });
    const row = container.querySelector('[data-slot="data-table-toolbar"]');
    expect(row).not.toBeNull();
    const toolbar = within(row as HTMLElement);
    expect(toolbar.getByRole('textbox', { name: 'Search' })).toBeVisible();
    expect(toolbar.getByRole('button', { name: 'Sort' })).toBeVisible();
    const filters = toolbar.getByRole('button', { name: 'Filters · 2' });
    // The filters are not on the row: they open in the bottom sheet, under visible labels.
    expect(
      screen.queryByRole('combobox', { name: 'Status' }),
    ).not.toBeInTheDocument();

    await user.click(filters);
    const sheet = await screen.findByRole('dialog', { name: 'Filters' });
    expect(within(sheet).getByText('Status')).toBeVisible();
    expect(
      within(sheet).getByRole('combobox', { name: 'Priority' }),
    ).toBeVisible();
  });

  it('names the phone Filters button without a count when nothing is applied', async () => {
    stubViewport(true);
    await renderWithApp(<Toolbar count={0} />, { namespace, namespaces });
    expect(
      screen.getByRole('button', { name: 'Filters', exact: true }),
    ).toBeVisible();
  });

  it('keeps the filters inline and sorts from headers on wider screens', async () => {
    stubViewport(false);
    await renderWithApp(<Toolbar />, { namespace, namespaces });
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Priority' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /^Filters/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Sort' }),
    ).not.toBeInTheDocument();
  });
});

describe('DataTable card actions', () => {
  const withActions: ColumnDef<Item>[] = [
    ...columns,
    {
      id: 'actions',
      cell: ({ row }) => (
        <button aria-label={`Actions for ${row.original.id}`} />
      ),
    },
  ];

  it('adds the row menu to a card that does not place it', async () => {
    stubViewport(true);
    await renderWithApp(
      <DataTable
        columns={withActions}
        data={rows.slice(0, 2)}
        getRowId={(row) => row.id}
        renderCard={(row) => <article aria-label={row.original.id} />}
      />,
      { namespace, namespaces },
    );
    const [first] = screen.getAllByRole('listitem');
    expect(
      within(first!).getByRole('button', { name: 'Actions for row-0' }),
    ).toBeVisible();
  });

  it('shows the menu once where the card places it', async () => {
    stubViewport(true);
    await renderWithApp(
      <DataTable
        columns={withActions}
        data={rows.slice(0, 2)}
        getRowId={(row) => row.id}
        renderCard={(row, card) => (
          <article aria-label={row.original.id}>{card.actions}</article>
        )}
      />,
      { namespace, namespaces },
    );
    const card = screen.getByRole('article', { name: 'row-0' });
    expect(
      within(card).getByRole('button', { name: 'Actions for row-0' }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: 'Actions for row-0' }),
    ).toHaveLength(1);
  });

  it('leaves the cards without actions when the list opts out', async () => {
    stubViewport(true);
    await renderWithApp(
      <DataTable
        columns={withActions}
        data={rows.slice(0, 2)}
        getRowId={(row) => row.id}
        actionsColumnId={null}
        renderCard={(row) => <article aria-label={row.original.id} />}
      />,
      { namespace, namespaces },
    );
    expect(
      screen.queryByRole('button', { name: /^Actions for/ }),
    ).not.toBeInTheDocument();
  });
});

describe('DataTable filters and summary on wider screens and phones', () => {
  function List({ summary }: { readonly summary?: string }) {
    return (
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        search={<input aria-label='Search' />}
        filters={
          <DataTableFilter label='Status'>
            {/* A control written full width for a form or the sheet. */}
            <select aria-label='Status' className='w-full' />
          </DataTableFilter>
        }
        summary={summary}
        renderCard={(row) => <article aria-label={row.original.id} />}
      />
    );
  }

  it('gives an inline filter its own compact slot, so a full-width control does not take a row', async () => {
    stubViewport(false);
    await renderWithApp(<List />, { namespace, namespaces });
    const slot = screen.getByRole('combobox', {
      name: 'Status',
    }).parentElement!;
    expect(slot).toHaveAttribute('data-slot', 'data-table-filter');
    expect(slot).toHaveClass('min-w-44', 'max-w-xs', 'shrink-0');
  });

  it('ends the toolbar row with the summary on desktop and moves it below the cards on a phone', async () => {
    stubViewport(true);
    const { container } = await renderWithApp(<List summary='12 rows' />, {
      namespace,
      namespaces,
    });
    const toolbar = container.querySelector(
      '[data-slot="data-table-toolbar"]',
    )!;
    const inRow = toolbar.querySelector('[data-slot="data-table-summary"]');
    expect(inRow).toHaveClass('hidden', 'md:inline');
    const below = screen
      .getAllByText('12 rows')
      .find((element) => element !== inRow)!;
    expect(below).toHaveClass('md:hidden');
    expect(
      screen.getByRole('list').compareDocumentPosition(below) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe('DataTableSearch', () => {
  function Search({
    onSearch,
  }: {
    readonly onSearch: (value: string) => void;
  }) {
    const [value, setValue] = useState('');
    return (
      <DataTableSearch
        value={value}
        label='Search repairs'
        onSearch={(next) => {
          onSearch(next);
          setValue(next);
        }}
      />
    );
  }

  it('is one search field with no separate button, applied on Enter and after typing pauses', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    await renderWithApp(<Search onSearch={onSearch} />, {
      namespace,
      namespaces,
    });
    const box = screen.getByRole('searchbox', { name: 'Search repairs' });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    await user.type(box, 'pump{Enter}');
    expect(onSearch).toHaveBeenCalledWith('pump');
    onSearch.mockClear();
    await user.type(box, ' valve ');
    await vi.waitFor(() => expect(onSearch).toHaveBeenCalledWith('pump valve'));
    expect(box).toHaveValue('pump valve ');
  });

  it('waits for an IME composition to end', async () => {
    vi.useFakeTimers();
    try {
      const onSearch = vi.fn();
      await renderWithApp(<Search onSearch={onSearch} />, {
        namespace,
        namespaces,
      });
      const box = screen.getByRole('searchbox', { name: 'Search repairs' });
      fireEvent.compositionStart(box);
      fireEvent.change(box, { target: { value: 'weixiu' } });
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(onSearch).not.toHaveBeenCalled();
      fireEvent.change(box, { target: { value: '维修' } });
      fireEvent.compositionEnd(box);
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(onSearch).toHaveBeenCalledExactlyOnceWith('维修');
    } finally {
      vi.useRealTimers();
    }
  });
});
