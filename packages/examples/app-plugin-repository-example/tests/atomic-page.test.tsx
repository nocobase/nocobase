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
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createFixture } from './helpers.js';
import locales from '../client/locales/index.js';
const state = vi.hoisted(() => ({ api: undefined as ApiClient | undefined }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => state.api,
}));
import AtomicPage from '../client/pages/atomic-page.js';
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
      <AtomicPage />
    </I18nProvider>,
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled(),
  );
}
it('runs stock, points, and concurrent examples and shows rejected deductions', async () => {
  await show();
  const user = userEvent.setup();
  const stock = screen.getByRole('region', { name: 'Warehouse stock' });
  await user.click(
    within(stock).getByRole('button', { name: 'Increase', exact: true }),
  );
  await waitFor(() =>
    expect(
      screen.getByLabelText('Warehouse stock', { selector: 'output' }),
    ).toHaveTextContent('130'),
  );
  const amount = within(stock).getByRole('spinbutton');
  await user.clear(amount);
  await user.type(amount, '1000');
  await user.click(
    within(stock).getByRole('button', { name: 'Decrease (guarded)' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('insufficient');
  expect(
    screen.getByLabelText('Warehouse stock', { selector: 'output' }),
  ).toHaveTextContent('130');
  await user.click(screen.getByRole('button', { name: 'Double ×2' }));
  await waitFor(() =>
    expect(
      screen.getByLabelText('Reward points', { selector: 'output' }),
    ).toHaveTextContent('200'),
  );
  await user.click(screen.getByRole('button', { name: '10 concurrent +1' }));
  await waitFor(() =>
    expect(
      screen.getByLabelText('Visit counter', { selector: 'output' }),
    ).toHaveTextContent('10'),
  );
  expect(
    f.requests
      .filter((entry) => entry.path.endsWith('/updateOne'))
      .slice(-10)
      .every((entry) => JSON.stringify(entry.body).includes('"increment":1')),
  ).toBe(true);
});
it('explains missing seed data and disables the mutation controls', async () => {
  await show(false);
  expect(
    screen.getAllByText(
      'Run the application migrations and seeds to create this example counter.',
    ),
  ).toHaveLength(4);
  expect(
    screen.getByRole('button', { name: '10 concurrent +1' }),
  ).toBeDisabled();
});
