import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider, NamespaceScope, APP_NS } from '@nocobase/i18n/client';
import { beforeEach, expect, it, vi } from 'vitest';
import ExternalCrmPage from '../../client/pages/external-crm.tsx';
import enUS from '../../client/locales/en-US.ts';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => ({ request }),
}));

const orders = [
  {
    id: 3,
    orderNo: 'CRM-1003',
    status: 'paid',
    totalAmount: '999.99',
    placedAt: '2026-09-05T11:05:00.000',
    customer: {
      id: 2,
      displayName: 'Grace Hopper',
      email: 'grace@example.com',
    },
  },
  {
    id: 4,
    orderNo: 'CRM-1004',
    status: 'draft',
    totalAmount: 15.25,
    placedAt: '2026-09-08T16:30:00.000',
    customer: null,
  },
];

// Braces matter: a hook that returns the mock returns a function, which vitest
// treats as a cleanup callback and calls with no arguments.
beforeEach(() => {
  request.mockReset().mockImplementation(({ path, json }) => {
    if (path === 'crmCustomers/count') return Promise.resolve({ data: 3 });
    const status = (json as { filter?: { status?: string } }).filter?.status;
    return Promise.resolve({
      data: status ? orders.filter((order) => order.status === status) : orders,
    });
  });
});

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
          <ExternalCrmPage />
        </NamespaceScope>
      </QueryClientProvider>
    </I18nProvider>,
  );
}

it('lists CRM orders with their customers through the read-only repository routes', async () => {
  await mount();
  expect(await screen.findByText('CRM-1003')).toBeVisible();
  expect(screen.getByText('Grace Hopper')).toBeVisible();
  expect(screen.getByText('grace@example.com')).toBeVisible();
  expect(screen.getByText('999.99')).toBeVisible();
  expect(screen.getByText('3 customers')).toBeVisible();
  expect(screen.getByText('Read-only')).toBeVisible();

  // Everything is addressed by logical name and asks for the customer relation.
  const findMany = request.mock.calls.find(
    ([options]) => options.path === 'crmOrders/findMany',
  )?.[0];
  expect(findMany).toMatchObject({
    method: 'POST',
    json: {
      sort: { kind: 'sort', version: 1 },
      select: {
        kind: 'select',
        version: 1,
        root: { includes: [{ kind: 'include', relation: 'customer' }] },
      },
    },
  });
  expect(findMany?.json).not.toHaveProperty('filter');
  expect(JSON.stringify(findMany?.json)).not.toContain('crm_');
});

it('filters by status and shows a placeholder for an order without a customer', async () => {
  await mount();
  await screen.findByText('CRM-1003');
  expect(screen.getByText('CRM-1004')).toBeVisible();
  expect(screen.getByText('—')).toBeVisible();

  fireEvent.click(screen.getByRole('button', { name: 'Paid' }));
  await waitFor(() =>
    expect(
      request.mock.calls.some(
        ([options]) =>
          options.path === 'crmOrders/findMany' &&
          (options.json as { filter?: unknown }).filter !== undefined,
      ),
    ).toBe(true),
  );
  await waitFor(() => expect(screen.queryByText('CRM-1004')).toBeNull());
  expect(screen.getByText('CRM-1003')).toBeVisible();
});

it('reports a failed load and offers a retry', async () => {
  request
    .mockReset()
    .mockImplementation(({ path }) =>
      path === 'crmCustomers/count'
        ? Promise.resolve({ data: 3 })
        : Promise.reject(new Error('boom')),
    );
  await mount();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load orders',
  );
  expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
});
