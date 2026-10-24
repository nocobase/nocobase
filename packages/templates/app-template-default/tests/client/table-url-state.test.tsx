import { renderWithApp } from '@nocobase/app-testing/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { expect, it } from 'vitest';
import { useTableUrlState } from '../../client/hooks/use-table-url-state.js';

function Probe() {
  const [count, setCount] = useState<number>();
  const state = useTableUrlState({ sortColumns: ['name'], rowCount: count });
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => void navigate(-1)}>Back in history</button>
      <output data-testid='state'>
        {JSON.stringify(state.paginationState)}|
        {JSON.stringify(state.sortingState)}
      </output>
      <output data-testid='url'>{location.search}</output>
      <button onClick={() => setCount(25)}>Loaded</button>
      <button onClick={() => setCount(10)}>Removed</button>
      <button
        onClick={() => state.onSortingChange([{ id: 'name', desc: true }])}
      >
        Sort
      </button>
      <button
        onClick={() =>
          state.onPaginationChange((old) => ({ ...old, pageIndex: 1 }))
        }
      >
        Next
      </button>
      <button
        onClick={() =>
          void navigate('?page=2&pageSize=20&sort=name&order=asc&q=historic')
        }
      >
        History
      </button>
    </>
  );
}
it('clamps only a successfully loaded count and retains unrelated query context', async () => {
  await renderWithApp(<Probe />, {
    route: '/?page=5&pageSize=10&q=kept&returnTo=%2Fworkflows',
  });
  expect(screen.getByTestId('state')).toHaveTextContent('"pageIndex":4');
  await userEvent.click(screen.getByRole('button', { name: 'Loaded' }));
  await waitFor(() =>
    expect(screen.getByTestId('state')).toHaveTextContent('"pageIndex":2'),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Removed' }));
  await waitFor(() =>
    expect(screen.getByTestId('state')).toHaveTextContent('"pageIndex":0'),
  );
  expect(screen.getByTestId('url')).toHaveTextContent('q=kept');
  expect(screen.getByTestId('url')).toHaveTextContent('returnTo=%2Fworkflows');
});
it('restores external URL changes, resets the page on sort and retains sorting when paging', async () => {
  await renderWithApp(<Probe />, { route: '/?page=3&pageSize=10' });
  await userEvent.click(screen.getByRole('button', { name: 'History' }));
  expect(screen.getByTestId('state')).toHaveTextContent(
    '"pageIndex":1,"pageSize":20',
  );
  expect(screen.getByTestId('state')).toHaveTextContent('"desc":false');
  await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
  expect(screen.getByTestId('url')).not.toHaveTextContent('page=2');
  expect(screen.getByTestId('url')).toHaveTextContent('q=historic');
  expect(screen.getByTestId('state')).toHaveTextContent('"desc":true');
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByTestId('state')).toHaveTextContent('"pageIndex":1');
  expect(screen.getByTestId('url')).toHaveTextContent('order=desc');
});
it('normalizes invalid pagination and ignores unsupported sort columns', async () => {
  await renderWithApp(<Probe />, {
    route: '/?page=1.5&pageSize=3&sort=unknown&order=desc',
  });
  expect(screen.getByTestId('state')).toHaveTextContent(
    '{"pageIndex":0,"pageSize":10}|[]',
  );
});

it('allows browser Back to restore the preceding page', async () => {
  await renderWithApp(<Probe />, { route: '/?page=3&pageSize=10&q=kept' });
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByTestId('state')).toHaveTextContent('"pageIndex":1');
  await userEvent.click(
    screen.getByRole('button', { name: 'Back in history' }),
  );
  expect(screen.getByTestId('state')).toHaveTextContent('"pageIndex":2');
  expect(screen.getByTestId('url')).toHaveTextContent('q=kept');
});
