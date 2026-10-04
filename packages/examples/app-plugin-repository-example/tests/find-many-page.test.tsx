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
import locales from '../client/locales/index.js';
import { createFixture } from './helpers.js';

const state = vi.hoisted(() => ({ api: undefined as ApiClient | undefined }));

vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => state.api,
}));

import FindManyPage from '../client/pages/find-many-page.js';

let fixture: Awaited<ReturnType<typeof createFixture>>;

beforeEach(async () => {
  fixture = await createFixture();
  state.api = fixture.api;
  await fixture.database
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
      <FindManyPage />
    </I18nProvider>,
  );
});

afterEach(async () => {
  cleanup();
  await fixture.database.destroy();
});

it('runs the same findMany query as an array and as an async iterable', async () => {
  const user = userEvent.setup();
  const arrayPanel = screen.getByRole('region', { name: 'Await an array' });
  const streamPanel = screen.getByRole('region', {
    name: 'Iterate a stream',
  });

  await user.click(
    within(arrayPanel).getByRole('button', { name: 'Run array query' }),
  );
  await waitFor(() =>
    expect(
      within(arrayPanel).getByLabelText('Await an array — Records received'),
    ).toHaveTextContent('24 records received'),
  );
  const arrayRows = within(arrayPanel).getAllByRole('row');
  expect(arrayRows).toHaveLength(25);
  expect(arrayRows[1]).toHaveTextContent('FindMany record 01');
  expect(arrayRows.at(-1)).toHaveTextContent('FindMany record 24');

  await user.click(
    within(streamPanel).getByRole('button', { name: 'Run stream query' }),
  );
  await waitFor(() =>
    expect(
      within(streamPanel).getByLabelText('Iterate a stream — Records received'),
    ).toHaveTextContent('24 records received'),
  );
  const streamRows = within(streamPanel).getAllByRole('row');
  expect(streamRows).toHaveLength(25);
  expect(streamRows[1]).toHaveTextContent('FindMany record 01');
  expect(streamRows.at(-1)).toHaveTextContent('FindMany record 24');

  const requests = fixture.requests.filter((request) =>
    request.path.endsWith('repositoryExampleFindManyRecords/findMany'),
  );
  expect(requests).toHaveLength(2);
  expect(requests.map((request) => request.accept)).toEqual([
    'application/json',
    'application/x-ndjson',
  ]);
  expect(requests[0]?.body).toEqual(requests[1]?.body);
});
