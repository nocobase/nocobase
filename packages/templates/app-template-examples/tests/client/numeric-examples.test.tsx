import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider, NamespaceScope, APP_NS } from '@nocobase/i18n/client';
import { beforeEach, expect, it, vi } from 'vitest';
import NumericExamplesPage from '../../client/pages/numeric-examples.tsx';
import enUS from '../../client/locales/en-US.ts';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => ({ request }),
}));

const data = {
  dialect: 'sqlite',
  rows: [
    {
      sample: 'small',
      id: 1,
      integerValue: 42,
      bigintValue: '9007199254740993',
      decimalValue: '42.000000',
      floatValue: 42,
      doubleValue: 42,
    },
  ],
  aggregates: [
    {
      field: 'bigintValue',
      count: 1,
      sum: '9007199254740993',
      avg: '9007199254740993',
      min: '9007199254740993',
      max: '9007199254740993',
    },
  ],
};
beforeEach(() => request.mockReset().mockResolvedValue({ data }));
async function mount() {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US'],
    applicationNamespace: '@nocobase/app-template-examples',
  });
  runtime.registerApplicationNamespace('@nocobase/app-template-examples', {
    'en-US': () => Promise.resolve({ default: enUS }),
  });
  await runtime.init('en-US');
  render(
    <I18nProvider runtime={runtime}>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <NamespaceScope ns={APP_NS}>
          <NumericExamplesPage />
        </NamespaceScope>
      </QueryClientProvider>
    </I18nProvider>,
  );
}

it('preserves string notation and switches Query / Repository and input ranges', async () => {
  await mount();
  const values = within(
    await screen.findByRole('region', { name: 'Stored values' }),
  );
  expect(values.getByText('"9007199254740993"')).toBeVisible();
  expect(values.getByText('"42.000000"')).toBeVisible();
  expect(values.getAllByText('number')).toHaveLength(4);
  expect(values.getAllByText('string')).toHaveLength(2);
  fireEvent.click(
    screen.getByRole('button', { name: 'Repository', exact: true }),
  );
  await waitFor(() =>
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        path: 'numericExamples',
        query: {
          source: 'repository',
          sample: 'all',
          orderBy: 'id',
        },
      }),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Null sample' }));
  await waitFor(() =>
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: {
          source: 'repository',
          sample: 'null',
          orderBy: 'id',
        },
      }),
    ),
  );
  request.mockResolvedValue({ data: { ...data, rows: [] } });
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

it('shows loading, failure and retry states', async () => {
  request.mockImplementationOnce(() => new Promise(() => {}));
  await mount();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Loading numeric examples',
  );
  request.mockRejectedValueOnce(new Error('Offline'));
  fireEvent.click(
    screen.getByRole('button', { name: 'Repository', exact: true }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load numeric examples',
  );
  request.mockResolvedValue({ data });
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(
    await screen.findByRole('region', { name: 'Stored values' }),
  ).toBeVisible();
});
