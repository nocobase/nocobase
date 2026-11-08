import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import DatabaseExplorerPage from '../../client/pages/settings/database-explorer/index.js';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };

const table = (name: string) => ({
  name,
  tableName: name,
  schema: '',
  kind: 'table',
});
const detail = (name: string) => ({
  data: {
    collection: {
      name,
      collection: { fields: [{ name, type: 'string' }] },
      warnings: [],
    },
    metadata: null,
  },
});
const connections = {
  data: [{ name: 'main', isDefault: true, dialect: 'postgres' }],
};
function mount(api: (call: ApiCall) => unknown) {
  return renderWithApp(<DatabaseExplorerPage />, {
    route: '/settings/database-explorer',
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: enUS },
    fetch: answerApi(api),
  });
}

it('searches all pages of tables and displays the selected table fields', async () => {
  const user = userEvent.setup();
  let pages = 0;
  await mount(({ path }) => {
    if (path.endsWith('/connections')) return connections;
    if (path.endsWith('/collections'))
      return ++pages === 1
        ? { data: [table('orders')], meta: { nextPageToken: 'next' } }
        : { data: [table('customers')] };
    if (path.endsWith('/collections/customers')) return detail('customer_name');
    throw new Error(`Unexpected request: ${path}`);
  });
  await screen.findByRole('button', { name: 'customers' });
  await user.type(
    screen.getByRole('textbox', { name: 'Search tables' }),
    'customers',
  );
  expect(
    screen.queryByRole('button', { name: 'orders' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'customers' }));
  expect(
    await screen.findByRole('cell', { name: 'customer_name' }),
  ).toBeInTheDocument();
  await user.type(
    screen.getByRole('textbox', { name: 'Search fields' }),
    'missing',
  );
  expect(screen.getByText('No fields found.')).toBeInTheDocument();
  expect(pages).toBe(2);
});

it('does not display a late response for a previously selected table', async () => {
  const user = userEvent.setup();
  const slow = Promise.withResolvers<unknown>();
  await mount(({ path }) => {
    if (path.endsWith('/connections')) return connections;
    if (path.endsWith('/collections'))
      return { data: [table('orders'), table('customers')] };
    if (path.endsWith('/orders')) return slow.promise;
    if (path.endsWith('/customers')) return detail('customer_name');
    throw new Error(`Unexpected request: ${path}`);
  });
  await user.click(await screen.findByRole('button', { name: 'orders' }));
  expect(
    within(screen.getByRole('region', { name: 'Fields' })).getByRole('status'),
  ).toHaveTextContent('Loading');
  await user.click(screen.getByRole('button', { name: 'customers' }));
  await screen.findByRole('cell', { name: 'customer_name' });
  await act(async () => slow.resolve(detail('order_name')));
  expect(
    screen.queryByRole('cell', { name: 'order_name' }),
  ).not.toBeInTheDocument();
});

it('offers retry for a failed connection listing and handles an empty listing', async () => {
  let attempts = 0;
  const user = userEvent.setup();
  await mount(() =>
    ++attempts === 1 ? new Response(null, { status: 503 }) : { data: [] },
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load database information.',
  );
  await user.click(screen.getByRole('button', { name: 'Retry' }));
  expect(
    await screen.findByText('No database connections are configured.'),
  ).toBeInTheDocument();
});

it('explains forbidden access without offering a retry', async () => {
  await mount(() => new Response(null, { status: 403 }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'You do not have permission',
  );
  expect(
    screen.queryByRole('button', { name: 'Retry' }),
  ).not.toBeInTheDocument();
});

it('clears the selected table when switching connections', async () => {
  const user = userEvent.setup();
  await mount(({ path }) => {
    if (path.endsWith('/connections'))
      return {
        data: [
          ...connections.data,
          { name: 'external', isDefault: false, dialect: 'postgres' },
        ],
      };
    if (path.endsWith('main/collections')) return { data: [table('orders')] };
    if (path.endsWith('external/collections'))
      return { data: [table('contacts')] };
    if (path.endsWith('/orders')) return detail('order_name');
    throw new Error(`Unexpected request: ${path}`);
  });
  await user.click(await screen.findByRole('button', { name: 'orders' }));
  await screen.findByRole('cell', { name: 'order_name' });
  await user.click(
    screen.getByRole('combobox', { name: 'Database connection' }),
  );
  await user.click(await screen.findByRole('option', { name: /external/ }));
  expect(
    await screen.findByRole('button', { name: 'contacts' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('cell', { name: 'order_name' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText('Select a table to view its fields.'),
  ).toBeInTheDocument();
});
