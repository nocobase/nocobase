import { MemoryRouter, Route, Routes } from 'react-router';
import { ApiClientError, type ApiClient } from '@nocobase/app-client';
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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFixture } from './helpers.js';
import locales from '../client/locales/index.js';
import { repository, type ExampleRecord } from '../client/model.js';

const state = vi.hoisted(() => ({ api: undefined as ApiClient | undefined }));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => state.api,
}));
import CrmPage from '../client/pages/crm-page.js';
import OrdersPage from '../client/pages/orders-page.js';
import ItemsPage from '../client/pages/items-page.js';
import ContactsPage from '../client/pages/contacts-page.js';

describe('Repository pages with real HTTP and SQLite', () => {
  let f: Awaited<ReturnType<typeof createFixture>>;
  beforeEach(async () => {
    f = await createFixture();
    state.api = f.api;
  });
  afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    await f?.database.destroy();
  });
  async function show(
    page: 'crm' | 'orders' | 'items' | 'contacts',
    locale: 'en-US' | 'zh-CN' = 'en-US',
    recordId?: string,
    waitForEmpty = true,
  ) {
    const runtime = new I18nRuntime({
      defaultLocale: 'en-US',
      locales: ['en-US', 'zh-CN'],
      applicationNamespace: 'test',
    });
    runtime.registerNamespace(
      '@nocobase/app-plugin-repository-example',
      locales,
    );
    await runtime.init(locale);
    const base =
      page === 'crm'
        ? '/repository-example/crm'
        : page === 'contacts'
          ? '/repository-example/crm/contacts'
          : page === 'items'
            ? '/repository-example/orders/items'
            : '/repository-example/orders';
    const element =
      page === 'crm' ? (
        <CrmPage />
      ) : page === 'contacts' ? (
        <ContactsPage />
      ) : page === 'items' ? (
        <ItemsPage />
      ) : (
        <OrdersPage />
      );
    render(
      <I18nProvider runtime={runtime}>
        <MemoryRouter
          initialEntries={[recordId ? `${base}/details/${recordId}` : base]}
        >
          <Routes>
            {page !== 'crm' && (
              <Route
                path='/repository-example/crm/details/:recordId'
                element={<CrmPage />}
              />
            )}
            <Route path={base} element={element} />
            <Route path={`${base}/details/:recordId`} element={element} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );
    if (recordId || !waitForEmpty) return;
    await screen.findByText(
      locale === 'zh-CN'
        ? '暂无记录，新增第一条记录开始体验。'
        : 'No records yet. Create the first record to get started.',
    );
  }
  it('creates, searches, reads, edits, checks existence and deletes a customer', async () => {
    await show('crm');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'New record' }));
    expect(await screen.findByRole('dialog')).toHaveAccessibleName(
      'Create Customers',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Name', exact: true }),
      'Ada',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Company', exact: true }),
      'Acme',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Email', exact: true }),
      'ada@example.test',
    );
    await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
    await screen.findByText('Record saved.');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Edit', exact: true }),
      ).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Edit', exact: true }));
    expect(await screen.findByRole('dialog')).toHaveAccessibleName(
      'Edit Customers',
    );
    const name = await screen.findByRole('textbox', {
      name: 'Name',
      exact: true,
    });
    await user.clear(name);
    await user.type(name, 'Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
    await waitFor(() =>
      expect(
        within(screen.getByRole('table')).getByText('Ada Lovelace'),
      ).toBeInTheDocument(),
    );
    const records = await repository(f.api, 'customers').findMany();
    await user.type(
      screen.getByRole('textbox', { name: 'Search by name / number / ID' }),
      'Lovelace',
    );
    await user.click(
      screen.getByRole('button', { name: 'Search', exact: true }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Refresh', exact: true }),
      ).toBeEnabled(),
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Look up by ID' }),
      records[0]!.id,
    );
    await user.click(screen.getByRole('button', { name: 'Check and open' }));
    await screen.findByText('Record details');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to list' }));
    await screen.findByRole('table');
    await user.click(
      screen.getByRole('button', { name: 'Delete', exact: true }),
    );
    await user.click(screen.getByRole('button', { name: 'Confirm deletion' }));
    await screen.findByText('Record deleted.');
    await waitFor(() =>
      expect(repository(f.api, 'customers').count()).resolves.toBe(0),
    );
    const actions = new Set(
      f.requests.map((request) => request.path.split('/').at(-1)),
    );
    expect(actions).toEqual(
      new Set([
        'findMany',
        'findOne',
        'count',
        'exists',
        'createOne',
        'updateOne',
        'deleteOne',
      ]),
    );
  });
  it('keeps table headings visible and separates loading from an empty result', async () => {
    let resolveRows!: (rows: ExampleRecord[]) => void;
    const rowsPending = new Promise<ExampleRecord[]>((resolve) => {
      resolveRows = resolve;
    });
    const customerRepository = repository(f.api, 'customers');
    const findMany = vi.fn(() => rowsPending);
    vi.spyOn(f.api, 'repository').mockReturnValue({
      ...customerRepository,
      findMany,
    });

    await show('crm', 'en-US', undefined, false);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(await screen.findByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByText('No data yet')).not.toBeInTheDocument();

    resolveRows([]);
    expect(await screen.findByText('No data yet')).toBeVisible();
    expect(
      screen.getByText(
        'No records yet. Create the first record to get started.',
      ),
    ).toBeVisible();
  });
  it('commits search, clears it with page reset, and reloads the real unfiltered rows', async () => {
    const customers = repository(f.api, 'customers');
    for (let index = 0; index < 12; index += 1) {
      await customers.createOne({
        values: {
          id: `customer-${String(index).padStart(2, '0')}`,
          name: `Customer ${String(index).padStart(2, '0')}`,
          company: 'Example Co',
          email: `customer-${index}@example.test`,
          status: 'active',
        },
      });
    }
    await show('crm', 'en-US', undefined, false);
    expect(await screen.findByText('Customer 00')).toBeVisible();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Customer 10')).toBeVisible();
    const search = screen.getByRole('textbox', {
      name: 'Search by name / number / ID',
    });
    await user.type(search, 'does-not-match');
    await user.click(
      screen.getByRole('button', { name: 'Search', exact: true }),
    );
    expect(await screen.findByText('No results')).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(screen.getByText('Page 1')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(search).toHaveValue(''));
    expect(await screen.findByText('Customer 00')).toBeVisible();
    expect(screen.getByText('Page 1')).toBeVisible();
    expect(
      f.requests.some(
        (request) =>
          request.path.endsWith('repositoryExampleCustomers/findMany') &&
          (request.body as { offset?: number; filter?: unknown }).offset ===
            0 &&
          !(request.body as { filter?: unknown }).filter,
      ),
    ).toBe(true);
  });
  it('shows explicit denial and sends expired sessions through sign-in', async () => {
    const customerRepository = repository(f.api, 'customers');
    const forbidden = vi.spyOn(f.api, 'repository').mockReturnValueOnce({
      ...customerRepository,
      findMany: () =>
        Promise.reject(
          new ApiClientError('Forbidden', {
            status: 403,
            method: 'POST',
            url: '/repositoryExampleCustomers/findMany',
          }),
        ),
    });
    await show('crm', 'en-US', undefined, false);
    expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(screen.queryByText('No data yet')).not.toBeInTheDocument();

    cleanup();
    forbidden.mockRestore();
    vi.spyOn(f.api, 'repository').mockReturnValue({
      ...customerRepository,
      findMany: () =>
        Promise.reject(
          new ApiClientError('Expired', {
            status: 401,
            method: 'POST',
            url: '/repositoryExampleCustomers/findMany',
          }),
        ),
    });
    await show('crm', 'en-US', undefined, false);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Session expired',
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
  it('retries the same filtered page and preserves old rows after a refresh failure', async () => {
    const customers = repository(f.api, 'customers');
    for (let index = 0; index < 12; index += 1) {
      await customers.createOne({
        values: {
          id: `customer-${String(index).padStart(2, '0')}`,
          name: `Customer ${String(index).padStart(2, '0')}`,
          company: 'Example Co',
          email: `customer-${index}@example.test`,
          status: 'active',
        },
      });
    }
    const customerRepository = repository(f.api, 'customers');
    const findMany = vi
      .fn(customerRepository.findMany.bind(customerRepository))
      .mockRejectedValueOnce(new Error('Connection failed'));
    vi.spyOn(f.api, 'repository').mockReturnValue({
      ...customerRepository,
      findMany,
    });

    await show('crm', 'en-US', undefined, false);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load list',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Customer 00')).toBeVisible();

    const user = userEvent.setup();
    const search = screen.getByRole('textbox', {
      name: 'Search by name / number / ID',
    });
    await user.type(search, 'Customer');
    await user.click(
      screen.getByRole('button', { name: 'Search', exact: true }),
    );
    expect(await screen.findByText('Customer 00')).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled(),
    );
    findMany.mockRejectedValueOnce(new Error('Page load failed'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load list',
    );
    expect(screen.getByText('Page 2')).toBeVisible();
    expect(search).toHaveValue('Customer');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Customer 10')).toBeVisible();
    expect(
      findMany.mock.calls.some(
        ([options]) =>
          (
            options as {
              offset?: number;
              filter?: { root?: { items?: { value?: string }[] } };
            }
          ).offset === 10 &&
          (options as { filter?: { root?: { items?: { value?: string }[] } } })
            .filter?.root?.items?.[0]?.value === 'Customer',
      ),
    ).toBe(true);

    findMany.mockRejectedValueOnce(new Error('Refresh timed out'));
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(
      await screen.findByText('Refresh failed; showing previous data'),
    ).toBeVisible();
    expect(screen.getByText('Customer 10')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(
        screen.queryByText('Refresh failed; showing previous data'),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Customer 10')).toBeVisible();
  });
  it('creates an order and a product-linked item through relation selectors', async () => {
    await repository(f.api, 'customers').createOne({
      values: {
        id: 'customer',
        name: 'Ada',
        company: 'Acme',
        email: 'ada@example.test',
        status: 'active',
      },
    });
    await repository(f.api, 'products').createOne({
      values: {
        id: 'product',
        sku: 'KEY',
        name: 'Keyboard',
        unitPriceCents: 12500,
      },
    });
    await show('orders');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'New record' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Order number' }),
      'SO-001',
    );
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Customer', exact: true }),
      ).toBeEnabled(),
    );
    await user.click(
      screen.getByRole('combobox', { name: 'Customer', exact: true }),
    );
    await user.click(
      await screen.findByRole('option', { name: 'Ada', exact: true }),
    );
    expect(
      screen.getByRole('combobox', { name: 'Customer', exact: true }),
    ).toHaveTextContent('Ada');
    await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
    await screen.findByText('Record saved.');
    cleanup();
    await show('items');
    await user.click(screen.getByRole('button', { name: 'New record' }));
    const orders = await repository(f.api, 'orders').findMany();
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Order', exact: true }),
      ).toBeEnabled(),
    );
    await user.click(
      screen.getByRole('combobox', { name: 'Order', exact: true }),
    );
    await user.click(
      await screen.findByRole('option', { name: 'SO-001', exact: true }),
    );
    expect(
      screen.getByRole('combobox', { name: 'Order', exact: true }),
    ).toHaveTextContent('SO-001');
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Product', exact: true }),
      ).toBeEnabled(),
    );
    await user.click(
      screen.getByRole('combobox', { name: 'Product', exact: true }),
    );
    await user.click(
      await screen.findByRole('option', { name: 'Keyboard', exact: true }),
    );
    expect(
      screen.getByRole('combobox', { name: 'Product', exact: true }),
    ).toHaveTextContent('Keyboard');
    const quantity = screen.getByRole('spinbutton', { name: 'Quantity' });
    await user.clear(quantity);
    await user.type(quantity, '2');
    const price = screen.getByRole('spinbutton', {
      name: 'Unit price (cents)',
    });
    await user.clear(price);
    await user.type(price, '12500');
    await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
    await screen.findByText('Record saved.');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await user.click(
      await screen.findByRole('button', { name: 'View details' }),
    );
    await screen.findByText('Line total (cents): 25000');
    expect(await repository(f.api, 'items').findMany()).toMatchObject([
      {
        orderId: orders[0]!.id,
        productId: 'product',
        quantity: 2,
        unitPriceCents: 12500,
      },
    ]);
    const mutation = f.requests.find((request) =>
      request.path.endsWith('repositoryExampleOrderItems/createOne'),
    );
    expect(mutation?.body).toMatchObject({
      values: {
        order: { connect: { id: orders[0]!.id } },
        product: { connect: { id: 'product' } },
      },
    });
  });
  it('renders Chinese navigation and empty state', async () => {
    await show('crm', 'zh-CN');
    expect(screen.getByRole('heading', { name: '客户' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新增记录' })).toBeEnabled();
  });
  it('preserves a concurrent order update and explains the version conflict', async () => {
    await repository(f.api, 'customers').createOne({
      values: {
        id: 'customer',
        name: 'Ada',
        company: 'Acme',
        email: 'ada@example.test',
      },
    });
    await show('orders');
    const orders = repository(f.api, 'orders');
    const created = await orders.createOne({
      values: {
        id: 'order',
        number: 'SO-001',
        customer: { connect: { id: 'customer' } },
      },
    });
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: 'Refresh', exact: true }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Edit', exact: true }),
    );
    await screen.findByRole('textbox', { name: 'Order number' });
    await orders.updateOne({
      filter: { id: 'order' },
      values: { status: 'paid' },
      ifVersion: created.version,
    });
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Status', exact: true }),
      ).toBeEnabled(),
    );
    await user.click(
      screen.getByRole('combobox', { name: 'Status', exact: true }),
    );
    await user.click(
      await screen.findByRole('option', { name: 'Confirmed', exact: true }),
    );
    expect(
      screen.getByRole('combobox', { name: 'Status', exact: true }),
    ).toHaveTextContent('Confirmed');
    await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
    expect(await screen.findByRole('alert')).toHaveTextContent('changed');
    expect(await orders.findOne({ filter: { id: 'order' } })).toMatchObject({
      status: 'paid',
    });
  });
  it('opens details directly by URL and handles a missing record', async () => {
    await repository(f.api, 'customers').createOne({
      values: {
        id: 'direct-id',
        name: 'Direct customer',
        company: 'Acme',
        email: 'direct@example.test',
      },
    });
    await show('crm', 'en-US', 'direct-id');
    expect(await screen.findByText('Direct customer')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Edit', exact: true }));
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByRole('textbox', {
      name: 'Name',
      exact: true,
    });
    await user.clear(input);
    await user.type(input, 'Updated detail');
    await user.click(
      within(dialog).getByRole('button', { name: 'Save', exact: true }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(await screen.findByText('Updated detail')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    cleanup();
    await show('crm', 'en-US', 'missing-id');
    expect(
      await screen.findByText('No record with this ID.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to list' })).toBeEnabled();
  });
  it('cancels a new-record drawer without creating data', async () => {
    await show('crm');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'New record' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'New record' }));
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(await repository(f.api, 'customers').count()).toBe(0);
  });
  it('shows a singular Customer with readable context and links to its detail page', async () => {
    await repository(f.api, 'customers').createOne({
      values: {
        id: 'customer-1',
        name: 'Ada Chen',
        company: 'Northstar Studio',
        email: 'ada@northstar.example',
      },
    });
    await repository(f.api, 'contacts').createOne({
      values: {
        id: 'contact-1',
        name: 'Eva Park',
        email: 'eva@northstar.example',
        phone: '123',
        customer: { connect: { id: 'customer-1' } },
      },
    });
    await show('contacts', 'en-US', 'contact-1');
    const region = await screen.findByRole('region', { name: 'Customer' });
    expect(
      within(region).getByRole('heading', { name: 'Customer', exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Customers', exact: true }),
    ).not.toBeInTheDocument();
    expect(within(region).getByText('Northstar Studio')).toBeInTheDocument();
    expect(
      within(region).getByText('ada@northstar.example'),
    ).toBeInTheDocument();
    expect(region).not.toHaveTextContent('customer-1');
    const fieldLink = screen.getByRole('link', {
      name: 'Ada Chen',
      exact: true,
    });
    expect(fieldLink).toHaveAttribute(
      'href',
      '/repository-example/crm/details/customer-1',
    );
    await userEvent.setup().click(within(region).getByRole('link'));
    expect(
      await screen.findByRole('heading', { name: 'Contacts', exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Customers', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ada Chen')).toBeInTheDocument();
  });
  it('creates an order with editable product rows and displays product details', async () => {
    await repository(f.api, 'customers').createOne({
      values: {
        id: 'c',
        name: 'Ada',
        company: 'Acme',
        email: 'ada@example.test',
      },
    });
    await repository(f.api, 'products').createOne({
      values: { id: 'p', name: 'Keyboard', sku: 'KEY', unitPriceCents: 12500 },
    });
    await show('orders');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'New record' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Order number' }),
      'SO-NESTED',
    );
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Customer', exact: true }),
      ).toBeEnabled(),
    );
    await user.click(
      screen.getByRole('combobox', { name: 'Customer', exact: true }),
    );
    await user.click(
      await screen.findByRole('option', { name: 'Ada', exact: true }),
    );
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    let row = screen.getByRole('row', { name: 'Item 1' });
    await user.click(within(row).getByRole('combobox', { name: 'Product' }));
    await user.click(
      await screen.findByRole('option', { name: 'Keyboard · KEY' }),
    );
    expect(
      within(row).getByRole('spinbutton', { name: 'Unit price (cents)' }),
    ).toHaveValue(12500);
    const quantity = within(row).getByRole('spinbutton', { name: 'Quantity' });
    await user.clear(quantity);
    await user.type(quantity, '2');
    const price = within(row).getByRole('spinbutton', {
      name: 'Unit price (cents)',
    });
    await user.clear(price);
    await user.type(price, '12000');
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    row = screen.getByRole('row', { name: 'Item 2' });
    await user.click(within(row).getByRole('combobox', { name: 'Product' }));
    await user.click(
      await screen.findByRole('option', { name: 'Keyboard · KEY' }),
    );
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    await user.click(
      within(screen.getByRole('row', { name: 'Item 3' })).getByRole('button', {
        name: 'Remove item',
      }),
    );
    expect(
      within(screen.getByRole('table', { name: 'Order items' })).getByText(
        '36500',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
    await screen.findByText('Record saved.');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    const requests = f.requests.filter((request) =>
      request.path.endsWith('repositoryExampleOrders/createOne'),
    );
    expect(requests).toHaveLength(1);
    expect(requests[0]?.body).toMatchObject({
      values: {
        items: {
          create: [
            {
              product: { connect: { id: 'p' } },
              quantity: 2,
              unitPriceCents: 12000,
            },
            {
              product: { connect: { id: 'p' } },
              quantity: 1,
              unitPriceCents: 12500,
            },
          ],
        },
      },
    });
    await user.click(
      await screen.findByRole('button', { name: 'View details' }),
    );
    const table = await screen.findByRole('table', { name: 'Order items' });
    await waitFor(() =>
      expect(
        within(table).getAllByRole('link', { name: 'Keyboard' }),
      ).toHaveLength(2),
    );
    expect(within(table).getAllByText('KEY')).toHaveLength(2);
    expect(within(table).getByText('36500')).toBeInTheDocument();
    expect(
      within(table).getAllByRole('link', { name: 'Keyboard' })[0],
    ).toHaveAttribute('href', '/repository-example/orders/products/details/p');
  });
});
