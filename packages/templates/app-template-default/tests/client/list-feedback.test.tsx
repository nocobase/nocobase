import { useState } from 'react';
import { renderWithApp } from '@nocobase/app-testing/client';
import type { ColumnDef } from '@tanstack/react-table';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ListFeedback,
  ListFeedbackActions,
} from '../../client/components/list-feedback.js';
import { DataTable } from '../../client/components/data-table/index.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = '@nocobase/list-feedback-test';
const namespaces = {
  [namespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};
const options = { namespace, namespaces };

function RetainedEditor() {
  const [value, setValue] = useState(0);
  return <button onClick={() => setValue(value + 1)}>Edited {value}</button>;
}

describe('shared table and card feedback', () => {
  it('keeps mounted business content and local edits through a refresh failure and recovery', async () => {
    const view = await renderWithApp(
      <ListFeedback state='ready'>
        <RetainedEditor />
      </ListFeedback>,
      options,
    );
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Edited 0' }));
    view.rerender(
      <ListFeedback state='refresh-failed'>
        <RetainedEditor />
      </ListFeedback>,
    );
    expect(screen.getByRole('button', { name: 'Edited 1' })).toBeVisible();
    expect(screen.getByRole('alert').textContent).toBe(
      enUS.listFeedback.refreshFailed,
    );
    view.rerender(
      <ListFeedback state='ready'>
        <RetainedEditor />
      </ListFeedback>,
    );
    expect(screen.getByRole('button', { name: 'Edited 1' })).toBeVisible();
  });

  it('clears local column filters through the table toolbar and resets its input', async () => {
    const user = userEvent.setup();
    await renderWithApp(
      <DataTable
        data={[{ id: 'Camera' }]}
        columns={[{ accessorKey: 'id', header: 'ID' }]}
        listState='ready'
        rowCount={1}
        toolbar={(table) => (
          <input
            aria-label='Camera filter'
            value={String(table.getColumn('id')?.getFilterValue() ?? '')}
            onChange={(event) =>
              table.getColumn('id')?.setFilterValue(event.target.value)
            }
          />
        )}
      />,
      options,
    );
    await user.type(screen.getByLabelText('Camera filter'), 'missing');
    const status = screen.getByRole('status');
    expect(status.textContent).toBe(enUS.listFeedback.noResults);
    expect(status.closest('td')).not.toBeNull();
    expect(within(status).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByLabelText('Camera filter')).toHaveValue('');
    expect(screen.getByRole('cell', { name: 'Camera' })).toBeVisible();
  });

  it('keeps loading and denied states distinct and hides cached rows on denial', async () => {
    const view = await renderWithApp(
      <DataTable
        data={[]}
        columns={[{ accessorKey: 'id', header: 'ID' }]}
        loading
        emptyMessage='Business empty'
        emptyAction={<button>Create record</button>}
      />,
      options,
    );
    expect(screen.getByRole('status').textContent).toBe(
      enUS.listFeedback.loading,
    );
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeVisible();
    expect(screen.queryByText('Business empty')).not.toBeInTheDocument();
    expect(screen.queryByText('Create record')).not.toBeInTheDocument();
    view.rerender(
      <DataTable
        data={[{ id: 'Private row' }]}
        columns={[{ accessorKey: 'id', header: 'ID' }]}
        listState='forbidden'
        emptyMessage='Business empty'
      />,
    );
    expect(screen.getByRole('alert').textContent).toBe(
      enUS.listFeedback.forbidden,
    );
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeVisible();
    expect(screen.queryByText('Private row')).not.toBeInTheDocument();
  });

  it('keeps table structure and places each non-ready state in its body', async () => {
    const user = userEvent.setup();
    const columns: ColumnDef<{ id: string }>[] = [
      { accessorKey: 'id', header: 'ID' },
    ];
    const toolbar = () => <button type='button'>Search tools</button>;
    const view = await renderWithApp(
      <DataTable
        columns={columns}
        data={[]}
        listState='loading'
        toolbar={toolbar}
        onClearFilters={() => undefined}
        onRetry={() => undefined}
      />,
      options,
    );
    const states = [
      ['loading', 'status'],
      ['empty', 'status'],
      ['no-results', 'status'],
      ['forbidden', 'alert'],
      ['unauthenticated', 'alert'],
      ['failed', 'alert'],
    ] as const;
    for (const [state, role] of states) {
      view.rerender(
        <DataTable
          columns={columns}
          data={[]}
          listState={state}
          toolbar={toolbar}
          onClearFilters={() => undefined}
          onRetry={() => undefined}
        />,
      );
      expect(screen.getByRole('table')).toBeVisible();
      expect(screen.getByRole('columnheader', { name: 'ID' })).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Search tools' }),
      ).toBeVisible();
      expect(screen.getByRole(role).closest('td')).not.toBeNull();
    }

    view.rerender(
      <DataTable
        columns={columns}
        data={[{ id: 'Previous result' }]}
        listState='refresh-failed'
        toolbar={toolbar}
        onRetry={() => undefined}
      />,
    );
    expect(screen.getByRole('alert').closest('td')).not.toBeNull();
    expect(screen.getByText('Previous result')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Search tools' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
  });

  it('renders each built-in state as one icon and one short line without inline actions', async () => {
    const view = await renderWithApp(<ListFeedback state='loading' />, options);
    const states = [
      ['loading', 'status'],
      ['empty', 'status'],
      ['no-results', 'status'],
      ['forbidden', 'alert'],
      ['unauthenticated', 'alert'],
      ['failed', 'alert'],
    ] as const;
    for (const [state, role] of states) {
      view.rerender(<ListFeedback state={state} />);
      const status = screen.getByRole(role);
      expect(status.textContent).toBe(
        enUS.listFeedback[state === 'no-results' ? 'noResults' : state],
      );
      expect(status.querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(within(status).queryByRole('button')).not.toBeInTheDocument();
    }
  });

  it('preserves custom empty content and its intentional business action', async () => {
    await renderWithApp(
      <ListFeedback
        state='empty'
        empty='Business empty'
        emptyAction={<button>Create record</button>}
      />,
      options,
    );
    expect(screen.getByText(enUS.listFeedback.empty)).toBeVisible();
    expect(screen.getByText('Business empty')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create record' })).toBeVisible();
  });

  it('clears filtered results from the host toolbar with keyboard access', async () => {
    const clear = vi.fn();
    await renderWithApp(
      <>
        <div>
          <ListFeedbackActions state='no-results' onClear={clear} />
        </div>
        <ListFeedback state='no-results' />
      </>,
      { ...options, locale: 'zh-CN' },
    );
    const status = screen.getByRole('status');
    expect(status.textContent).toBe(zhCN.listFeedback.noResults);
    expect(within(status).queryByRole('button')).not.toBeInTheDocument();
    const button = screen.getByRole('button', {
      name: zhCN.listFeedback.clear,
    });
    button.focus();
    await userEvent.setup().keyboard('{Enter}');
    expect(clear).toHaveBeenCalledOnce();
  });

  it('keeps one stale-data line while showing old content and places retry outside it', async () => {
    const retry = vi.fn();
    await renderWithApp(
      <>
        <div>
          <ListFeedbackActions state='refresh-failed' onRetry={retry} />
        </div>
        <ListFeedback state='refresh-failed'>
          <p>Retained equipment record</p>
        </ListFeedback>
      </>,
      options,
    );
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe(enUS.listFeedback.refreshFailed);
    expect(within(alert).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Retained equipment record')).toBeVisible();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('keeps retry busy feedback in the toolbar', async () => {
    await renderWithApp(
      <>
        <div>
          <ListFeedbackActions state='failed' onRetry={vi.fn()} busy />
        </div>
        <ListFeedback state='failed' />
      </>,
      options,
    );
    expect(screen.getByRole('alert').textContent).toBe(
      enUS.listFeedback.failed,
    );
    expect(
      screen.getByRole('button', { name: enUS.listFeedback.retrying }),
    ).toBeDisabled();
  });

  it('uses the existing login route outside the session status', async () => {
    await renderWithApp(
      <>
        <div>
          <ListFeedbackActions state='unauthenticated' />
        </div>
        <ListFeedback state='unauthenticated'>
          <p>Private record</p>
        </ListFeedback>
      </>,
      options,
    );
    expect(screen.getByRole('alert').textContent).toBe(
      enUS.listFeedback.unauthenticated,
    );
    expect(screen.queryByText('Private record')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: enUS.listFeedback.signIn }),
    ).toHaveAttribute('href', '/login');
  });
});
