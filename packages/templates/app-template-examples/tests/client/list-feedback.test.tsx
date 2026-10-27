import { useState } from 'react';
import { renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListFeedback } from '../../client/components/list-feedback.js';
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
    view.rerender(
      <ListFeedback state='ready'>
        <RetainedEditor />
      </ListFeedback>,
    );
    expect(screen.getByRole('button', { name: 'Edited 1' })).toBeVisible();
  });
  it('clears local column filters on a successful remote snapshot, including its input', async () => {
    const user = userEvent.setup();
    await renderWithApp(
      <DataTable
        data={[{ id: 'Camera' }]}
        columns={[{ accessorKey: 'id' }]}
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
    expect(screen.getByText('No matching results.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByLabelText('Camera filter')).toHaveValue('');
    expect(screen.getByRole('cell', { name: 'Camera' })).toBeVisible();
  });
  it('never shows business emptiness before loading finishes or when access is refused', async () => {
    const view = await renderWithApp(
      <DataTable
        data={[]}
        columns={[{ accessorKey: 'id' }]}
        loading
        emptyMessage='Business empty'
        emptyAction={<button>Create record</button>}
      />,
      options,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByText('Business empty')).not.toBeInTheDocument();
    expect(screen.queryByText('Create record')).not.toBeInTheDocument();
    view.rerender(
      <DataTable
        data={[{ id: 'Private row' }]}
        columns={[{ accessorKey: 'id' }]}
        listState='forbidden'
        emptyMessage='Business empty'
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('permission');
    expect(screen.queryByText('Private row')).not.toBeInTheDocument();
  });

  it('preserves custom empty content only for successful unfiltered emptiness', async () => {
    await renderWithApp(
      <ListFeedback
        state='empty'
        empty='Business empty'
        emptyAction={<button>Create record</button>}
      />,
      options,
    );
    expect(screen.getByText('Business empty')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create record' })).toBeVisible();
  });

  it('clears filtered results with a keyboard accessible localized action', async () => {
    const clear = vi.fn();
    await renderWithApp(
      <ListFeedback
        state='no-results'
        empty='Business empty'
        onClear={clear}
      />,
      { ...options, locale: 'zh-CN' },
    );
    expect(screen.getByText(zhCN.listFeedback.noResults)).toBeVisible();
    expect(screen.queryByText('Business empty')).not.toBeInTheDocument();
    const button = screen.getByRole('button', {
      name: zhCN.listFeedback.clear,
    });
    button.focus();
    await userEvent.setup().keyboard('{Enter}');
    expect(clear).toHaveBeenCalledOnce();
  });

  it('keeps old content with a refresh warning and offers retry', async () => {
    const retry = vi.fn();
    await renderWithApp(
      <ListFeedback state='refresh-failed' onRetry={retry}>
        <p>Retained equipment record</p>
      </ListFeedback>,
      options,
    );
    expect(screen.getByText('Retained equipment record')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('previously loaded');
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('offers the existing login route after session expiry and hides cached content', async () => {
    await renderWithApp(
      <ListFeedback state='unauthenticated'>
        <p>Private record</p>
      </ListFeedback>,
      options,
    );
    expect(screen.queryByText('Private record')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sign in again' }),
    ).toHaveAttribute('href', '/login');
  });
});
