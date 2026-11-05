import { renderWithApp } from '@nocobase/app-testing/client';
import type { ColumnDef } from '@tanstack/react-table';
import { act, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTable } from '../../client/components/data-table/index.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = '@nocobase/list-loading-test';
const options = {
  namespace,
  namespaces: {
    [namespace]: {
      'en-US': async () => ({ default: enUS }),
      'zh-CN': async () => ({ default: zhCN }),
    },
  },
};
const columns: ColumnDef<{ id: string }>[] = [
  { accessorKey: 'id', header: 'ID' },
];
const refreshing = enUS['status.refreshing'];

function Table({
  rows,
  loading,
  listState,
  total = rows.length,
  label,
  query,
}: {
  readonly query?: string;
  readonly rows: readonly { id: string }[];
  readonly loading: boolean;
  readonly listState: 'loading' | 'ready';
  readonly total?: number;
  readonly label?: string;
}) {
  const table = (
    <DataTable
      columns={columns}
      data={rows}
      manualPagination
      rowCount={total}
      paginationState={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => undefined}
      showSelectedCount={false}
      loading={loading}
      loadingIdentity={query}
      listState={listState}
    />
  );
  return label ? <section aria-label={label}>{table}</section> : table;
}

async function advance(ms: number): Promise<void> {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}

describe('standard list loading feedback', () => {
  beforeEach(() => {
    // jsdom has no layout; report stable heights so the table can keep geometry.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly callback: () => void) {}
        observe(): void {
          this.callback();
        }
        disconnect(): void {}
      },
    );
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        if (this.tagName === 'TBODY') return 420;
        if (this.dataset.slot === 'data-table-footer') return 32;
        return 0;
      },
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('marks a first load busy at once and shows one status only after 300ms', async () => {
    const view = await renderWithApp(
      <Table rows={[]} loading={false} listState='ready' />,
      options,
    );
    vi.useFakeTimers();
    view.rerender(<Table rows={[]} loading listState='loading' />);
    // The loading body is the busy region; its status sits outside it so it is announced.
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy', 'true');
    expect(document.querySelector('[data-slot="loading"]')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeVisible();
    await advance(299);
    expect(screen.queryByRole('status')).toBeNull();
    await advance(1);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.listFeedback.loading,
    );
    expect(screen.getByRole('status').closest('[aria-busy="true"]')).toBeNull();
    await advance(9700);
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.pendingFeedback.longWait,
    );
    view.rerender(
      <Table rows={[{ id: 'Camera' }]} loading={false} listState='ready' />,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('cell', { name: 'Camera' })).toBeVisible();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps a paused unresolved query silent without showing cached rows or empty results', async () => {
    const view = await renderWithApp(
      <Table
        rows={[{ id: 'Previous query' }]}
        loading={false}
        listState='ready'
        total={45}
      />,
      options,
    );
    const table = screen.getByRole('table');
    vi.useFakeTimers();
    view.rerender(
      <Table rows={[]} loading listState='loading' query='interrupted' />,
    );
    await advance(10_000);
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.pendingFeedback.longWait,
    );
    view.rerender(
      <Table
        rows={[{ id: 'Previous query' }]}
        loading={false}
        listState='loading'
        total={45}
      />,
    );
    await advance(10_000);
    expect(screen.queryByRole('status')).toBeNull();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    expect(screen.queryByText('Previous query')).toBeNull();
    expect(screen.queryByText(enUS.listFeedback.empty)).toBeNull();
    expect(screen.getByRole('table')).toBe(table);
    expect(screen.getAllByRole('cell')[0]).toHaveStyle({ height: '420px' });
    view.rerender(
      <Table rows={[]} loading listState='loading' query='resumed' />,
    );
    await advance(299);
    expect(screen.queryByRole('status')).toBeNull();
    await advance(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.listFeedback.loading,
    );
    expect(screen.getByRole('table')).toBe(table);
  });

  it('shows nothing for a fast read', async () => {
    const view = await renderWithApp(
      <Table rows={[]} loading listState='loading' />,
      options,
    );
    vi.useFakeTimers();
    view.rerender(<Table rows={[]} loading listState='loading' />);
    await advance(200);
    view.rerender(
      <Table rows={[{ id: 'Camera' }]} loading={false} listState='ready' />,
    );
    await advance(1000);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('cell', { name: 'Camera' })).toBeVisible();
  });

  it('keeps rows and pagination during a same-query refresh and indicates it after 300ms', async () => {
    const rows = [{ id: 'Camera' }, { id: 'Lens' }];
    const view = await renderWithApp(
      <Table rows={rows} loading={false} listState='ready' total={25} />,
      options,
    );
    vi.useFakeTimers();
    view.rerender(<Table rows={rows} loading listState='ready' total={25} />);
    expect(screen.getByRole('cell', { name: 'Camera' })).toBeVisible();
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    await advance(299);
    expect(screen.queryByRole('status', { name: refreshing })).toBeNull();
    await advance(1);
    expect(screen.getByRole('status', { name: refreshing })).toBeVisible();
    // The indicator sits outside the busy table so it can be announced.
    expect(
      screen.getByRole('status', { name: refreshing }).closest('table'),
    ).toBeNull();
    expect(screen.getByRole('cell', { name: 'Lens' })).toBeVisible();
    expect(screen.getByText('Page 1 of 3')).toBeVisible();
    await advance(9700);
    expect(
      screen.getByRole('status', { name: enUS.pendingFeedback.longWait }),
    ).toBeVisible();
    view.rerender(
      <Table
        rows={[{ id: 'Camera v2' }]}
        loading={false}
        listState='ready'
        total={25}
      />,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('cell', { name: 'Camera v2' })).toBeVisible();
  });

  it('hides a previous query at once but keeps its body and pagination height without its page count', async () => {
    const previous = [{ id: 'Previous match' }];
    const view = await renderWithApp(
      <Table rows={previous} loading={false} listState='ready' total={45} />,
      options,
    );
    expect(screen.getByText('Page 1 of 5')).toBeVisible();
    vi.useFakeTimers();
    // A new search: the host still holds the previous response as placeholder data.
    view.rerender(
      <Table rows={previous} loading listState='loading' total={45} />,
    );
    expect(screen.queryByText('Previous match')).toBeNull();
    const cell = screen.getAllByRole('cell')[0]!;
    expect(cell).toHaveStyle({ height: '420px' });
    const footer = document.querySelector('[data-slot="data-table-footer"]')!;
    expect(footer).not.toBeNull();
    const count = within(footer as HTMLElement).getByText('Page 1 of 5');
    expect(count).toHaveClass('invisible');
    expect(count).toHaveAttribute('aria-hidden', 'true');
    for (const button of within(footer as HTMLElement).getAllByRole('button'))
      expect(button).toBeDisabled();
    await advance(300);
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.listFeedback.loading,
    );
    view.rerender(
      <Table
        rows={[{ id: 'New match' }]}
        loading={false}
        listState='ready'
        total={1}
      />,
    );
    expect(screen.getByRole('cell', { name: 'New match' })).toBeVisible();
    expect(screen.getByText('Page 1 of 1')).toBeVisible();
  });

  it('restarts the display delay for each new query without remounting the table', async () => {
    const view = await renderWithApp(
      <Table rows={[{ id: 'Old' }]} loading={false} listState='ready' />,
      options,
    );
    vi.useFakeTimers();
    const tableNode = screen.getByRole('table');
    // Query A has waited past the long-wait threshold.
    view.rerender(<Table rows={[]} loading listState='loading' query='a' />);
    await advance(10_000);
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.pendingFeedback.longWait,
    );
    // Query B replaces it: nothing until its own 300ms, no inherited long wait.
    view.rerender(<Table rows={[]} loading listState='loading' query='b' />);
    expect(screen.queryByRole('status')).toBeNull();
    await advance(299);
    expect(screen.queryByRole('status')).toBeNull();
    await advance(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.listFeedback.loading,
    );
    await advance(9699);
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.listFeedback.loading,
    );
    await advance(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.pendingFeedback.longWait,
    );
    // Query C answers within 200ms: it never flashes feedback.
    view.rerender(<Table rows={[]} loading listState='loading' query='c' />);
    await advance(200);
    expect(screen.queryByRole('status')).toBeNull();
    view.rerender(
      <Table
        rows={[{ id: 'C' }]}
        loading={false}
        listState='ready'
        query='c'
      />,
    );
    await advance(1000);
    expect(screen.queryByRole('status')).toBeNull();
    // The same table stayed mounted and kept the earlier rows' height while loading.
    expect(screen.getByRole('table')).toBe(tableNode);
    expect(screen.getByRole('cell', { name: 'C' })).toBeVisible();
  });

  it("keeps the previous rows' geometry across consecutive query changes", async () => {
    const view = await renderWithApp(
      <Table rows={[{ id: 'Old' }]} loading={false} listState='ready' />,
      options,
    );
    view.rerender(<Table rows={[]} loading listState='loading' query='a' />);
    expect(screen.getAllByRole('cell')[0]).toHaveStyle({ height: '420px' });
    view.rerender(<Table rows={[]} loading listState='loading' query='b' />);
    expect(screen.getAllByRole('cell')[0]).toHaveStyle({ height: '420px' });
  });

  it('keeps feedback of concurrent regions independent', async () => {
    const view = await renderWithApp(
      <>
        <Table
          label='Summary'
          rows={[{ id: 'A' }]}
          loading={false}
          listState='ready'
        />
        <Table
          label='Contacts'
          rows={[{ id: 'B' }]}
          loading={false}
          listState='ready'
        />
      </>,
      options,
    );
    vi.useFakeTimers();
    view.rerender(
      <>
        <Table label='Summary' rows={[{ id: 'A' }]} loading listState='ready' />
        <Table
          label='Contacts'
          rows={[{ id: 'B' }]}
          loading
          listState='ready'
        />
      </>,
    );
    await advance(300);
    const region = (name: string) =>
      within(screen.getByRole('region', { name }));
    expect(region('Summary').getByRole('status')).toBeVisible();
    expect(region('Contacts').getByRole('status')).toBeVisible();
    view.rerender(
      <>
        <Table
          label='Summary'
          rows={[{ id: 'A' }]}
          loading={false}
          listState='ready'
        />
        <Table
          label='Contacts'
          rows={[{ id: 'B' }]}
          loading
          listState='ready'
        />
      </>,
    );
    expect(region('Summary').queryByRole('status')).toBeNull();
    expect(region('Contacts').getByRole('status')).toBeVisible();
  });
});

describe('retry after a refresh failure', () => {
  afterEach(() => vi.useRealTimers());

  it('announces the wait once, from the retry button', async () => {
    const rows = [{ id: 'Camera' }];
    const table = (loading: boolean) => (
      <DataTable
        columns={columns}
        data={rows}
        listState='refresh-failed'
        loading={loading}
        onRetry={() => undefined}
      />
    );
    const view = await renderWithApp(table(false), options);
    vi.useFakeTimers();
    view.rerender(table(true));
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: enUS.listFeedback.retrying }),
    ).toBeDisabled();
    expect(screen.getByRole('cell', { name: 'Camera' })).toBeVisible();
  });
});
