import path from 'node:path';
import type { ApiClient } from '@nocobase/app-client';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createFixture } from './helpers.js';
import locales from '../client/locales/index.js';
const state = vi.hoisted(() => ({ api: undefined as ApiClient | undefined }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => state.api,
}));
import AggregatePage from '../client/pages/aggregate-page.js';
let f: Awaited<ReturnType<typeof createFixture>>;
beforeEach(async () => {
  f = await createFixture();
  state.api = f.api;
});
afterEach(async () => {
  cleanup();
  await f.database.destroy();
});
async function show(seed = true) {
  if (seed)
    await f.database
      .createSeeder({
        directory: path.resolve(import.meta.dirname, '../database/seeds'),
        packageName: '@nocobase/app-plugin-repository-example',
      })
      .run();
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US'],
    applicationNamespace: 'test',
  });
  runtime.registerNamespace('@nocobase/app-plugin-repository-example', locales);
  await runtime.init('en-US');
  render(
    <I18nProvider runtime={runtime}>
      <MemoryRouter>
        <AggregatePage />
      </MemoryRouter>
    </I18nProvider>,
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled(),
  );
}
it('renders database results and applies status and HAVING using the Select and form', async () => {
  await show();
  expect(screen.getByLabelText('COUNT · item rows')).toHaveTextContent('8');
  expect(screen.getByLabelText('SUM · quantity')).toHaveTextContent('14');
  const user = userEvent.setup();
  await user.click(screen.getByRole('combobox', { name: 'Status' }));
  await user.click(
    await screen.findByRole('option', { name: 'Paid', exact: true }),
  );
  const minimum = screen.getByRole('spinbutton', {
    name: 'Minimum grouped quantity (HAVING)',
  });
  await user.clear(minimum);
  await user.type(minimum, '2');
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() =>
    expect(screen.getByLabelText('COUNT · item rows')).toHaveTextContent('3'),
  );
  expect(screen.getByLabelText('SUM · quantity')).toHaveTextContent('5');
  const products = screen.getByRole('table', {
    name: 'Items grouped by product',
  });
  expect(within(products).getAllByRole('row')).toHaveLength(3);
  expect(
    within(products).getByRole('link', { name: 'Mechanical Keyboard' }),
  ).toHaveAttribute(
    'href',
    '/repository-example/orders/products/details/demo-product-1',
  );
  expect(within(products).queryByText('USB-C Dock')).not.toBeInTheDocument();
  const request = f.requests.findLast(
    (entry) =>
      entry.path.endsWith('/groupBy') &&
      JSON.stringify(entry.body).includes('"by":["productId"]'),
  );
  expect(request?.body).toMatchObject({
    by: ['productId'],
    filter: { root: { items: [{ value: 'paid' }] } },
    having: { root: { items: [{ value: 2 }] } },
  });
});
it('renders count zero and nullable aggregates for an empty database', async () => {
  await show(false);
  expect(screen.getByLabelText('COUNT · item rows')).toHaveTextContent('0');
  expect(screen.getByLabelText('SUM · quantity')).toHaveTextContent('NULL');
  expect(screen.getByLabelText('AVG · unit price (cents)')).toHaveTextContent(
    'NULL',
  );
});
it('clears stale results on query failure and recovers on retry', async () => {
  await show();
  const repository = f.api.repository<Record<string, unknown>>(
    'repositoryExampleOrderItems',
  );
  const request = vi.spyOn(f.api, 'repository').mockReturnValueOnce({
    ...repository,
    aggregate: vi.fn().mockRejectedValueOnce(new Error('Temporary failure')),
  });
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Temporary failure',
  );
  expect(screen.queryByLabelText('COUNT · item rows')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() =>
    expect(screen.getByLabelText('COUNT · item rows')).toHaveTextContent('8'),
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  request.mockRestore();
});
it('filters the additional groupBy panels and exposes their composite request ASTs', async () => {
  await show();
  const user = userEvent.setup();
  const minimum = screen.getByRole('spinbutton', {
    name: 'Minimum rows per group (new examples)',
  });
  await user.clear(minimum);
  await user.type(minimum, '2');
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled(),
  );
  const ranking = screen.getByRole('table', { name: 'Customer order ranking' });
  expect(within(ranking).getAllByRole('row')).toHaveLength(2);
  expect(
    within(ranking).getByRole('link', { name: 'Ada Chen' }),
  ).toHaveAttribute('href', '/repository-example/crm/details/demo-customer-1');
  const statuses = screen.getByRole('table', {
    name: 'Customer × order status',
  });
  expect(
    within(statuses).getByText(
      'No groups match these filters. Reduce the minimum count or change the status.',
    ),
  ).toBeInTheDocument();
  const prices = screen.getByRole('table', {
    name: 'Product × item unit price',
  });
  expect(
    within(prices).getByRole('link', { name: 'USB-C Dock' }),
  ).toBeInTheDocument();
  expect(
    within(prices).queryByText('Mechanical Keyboard'),
  ).not.toBeInTheDocument();
  const request = f.requests.findLast((entry) =>
    entry.path.endsWith('/groupBy'),
  );
  expect(request?.body).toMatchObject({
    by: ['productId', 'unitPriceCents'],
    having: { root: { items: [{ path: ['count'], value: 2 }] } },
  });
  expect(screen.getByLabelText('COUNT · item rows')).toHaveTextContent('8');
});
