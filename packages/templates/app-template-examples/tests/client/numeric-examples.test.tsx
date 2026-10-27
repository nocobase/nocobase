import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { expect, it } from 'vitest';
import NumericExamplesPage from '../../client/pages/numeric-examples.tsx';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';

function mount(options: Parameters<typeof renderAuthenticatedClient>[1] = {}) {
  return renderAuthenticatedClient(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <NumericExamplesPage />
    </QueryClientProvider>,
    { member: true, ...options },
  );
}
it('preserves large integers from the database and switches Query / Repository and input ranges', async () => {
  const requests: URL[] = [];
  await mount({
    beforeRequest(request) {
      requests.push(new URL(request.url));
    },
  });
  const values = within(
    await screen.findByRole('region', { name: 'Stored values' }),
  );
  expect(values.getByText('"9007199254740993"')).toBeVisible();
  expect(values.getByText(/^"100000000000000\.250*"$/u)).toBeVisible();
  expect(values.getAllByText('number').length).toBeGreaterThan(0);
  expect(values.getAllByText('string').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Repository' }));
  await waitFor(() =>
    expect(
      requests.some((url) => url.searchParams.get('source') === 'repository'),
    ).toBe(true),
  );
  expect(
    await within(
      await screen.findByRole('region', { name: 'Stored values' }),
    ).findByText('"9007199254740993"'),
  ).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Null sample' }));
  await waitFor(() =>
    expect(
      within(
        screen.getByRole('region', { name: 'Stored values' }),
      ).getAllByRole('row'),
    ).toHaveLength(2),
  );
  expect(
    within(screen.getByRole('region', { name: 'Stored values' })).queryByText(
      '"9007199254740993"',
    ),
  ).not.toBeInTheDocument();
  expect(
    requests.some(
      (url) =>
        url.searchParams.get('source') === 'repository' &&
        url.searchParams.get('sample') === 'null',
    ),
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Empty result' }));
  expect(
    await screen.findByText(
      'No rows in this selection. Aggregate results are shown below.',
    ),
  ).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Aggregate results' }),
  ).toBeVisible();
});
it('shows loading, then a transport failure and a successful retry', async () => {
  const pending = Promise.withResolvers<void>();
  let offline = true;
  await mount({
    async beforeRequest(request) {
      if (!new URL(request.url).pathname.endsWith('/numericExamples')) return;
      // A real response cannot deterministically reproduce a connection that stalls and then fails.
      if (offline) {
        await pending.promise;
        throw new TypeError('Failed to fetch');
      }
    },
  });
  try {
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load list',
    );
    offline = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('region', { name: 'Stored values' }),
    ).toBeVisible();
  } finally {
    pending.resolve();
  }
});
