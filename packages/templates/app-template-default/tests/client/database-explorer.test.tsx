import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import DatabaseExplorerPage from '../../client/pages/settings/database-explorer/index.js';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };

const table = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  tableName: name,
  schema: 'main',
  kind: 'table',
  ...extra,
});
const detail = (
  name: string,
  fields: readonly Record<string, unknown>[] = [
    { name: `${name}_name`, type: 'string', nullable: true },
  ],
  extra: Record<string, unknown> = {},
) => ({
  data: {
    collection: {
      formatVersion: 1,
      name,
      collection: { kind: 'table', name, fields, ...extra },
      warnings: [],
    },
    metadata: null,
  },
});
const main = {
  name: 'main',
  isDefault: true,
  dialect: 'sqlite',
  schemaManagement: 'managed',
};
const external = {
  name: 'external',
  isDefault: false,
  dialect: 'postgres',
  schemaManagement: 'external',
};
const apiError = (status: number, reason: string) =>
  Response.json(
    {
      error: {
        code: status,
        reason,
        domain: 'databaseExplorer',
        message: reason,
      },
    },
    { status },
  );

/** Drives the memory router the page renders under, as the browser's Back button and address bar would. */
function RouterProbe() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <button type='button' onClick={() => void navigate(-1)}>
        history back
      </button>
      <output data-testid='location'>{location.search}</output>
    </>
  );
}

function mount(
  api: (call: ApiCall) => unknown,
  route = '/settings/database-explorer',
) {
  return renderWithApp(
    <>
      <DatabaseExplorerPage />
      <RouterProbe />
    </>,
    {
      route,
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: enUS },
      fetch: answerApi(api),
    },
  );
}

const search = () =>
  new URLSearchParams(screen.getByTestId('location').textContent ?? '');
const tableList = () => screen.getByRole('list', { name: /^Tables in / });

afterEach(() => {
  vi.unstubAllGlobals();
});

it('reads every page of tables, searches the whole list and shows key and reference information', async () => {
  const user = userEvent.setup();
  const tokens: (string | undefined)[] = [];
  await mount(({ path, query }) => {
    if (path.endsWith('/connections')) return { data: [main] };
    if (path.endsWith('/collections')) {
      const token = query.pageToken as string | undefined;
      tokens.push(token);
      return token === undefined
        ? { data: [table('orders')], meta: { nextPageToken: 'next' } }
        : { data: [table('customers', { title: 'Customers' })] };
    }
    if (path.endsWith('/collections/orders'))
      return detail(
        'orders',
        [
          { name: 'id', type: 'integer', nullable: false },
          { name: 'customerId', type: 'integer', nullable: false },
          { name: 'note', type: 'text' },
        ],
        {
          constraints: [
            { type: 'primary', fields: ['id'] },
            {
              type: 'foreignKey',
              fields: ['customerId'],
              references: { collection: 'customers', fields: ['id'] },
            },
          ],
        },
      );
    if (path.endsWith('/collections/customers')) return detail('customers');
    throw new Error(`Unexpected request: ${path}`);
  });

  expect(await screen.findByText('2 tables')).toBeInTheDocument();
  expect(tokens).toEqual([undefined, 'next']);
  await user.type(
    screen.getByRole('searchbox', { name: 'Search by table name or title' }),
    'cust',
  );
  expect(screen.getByText('1 of 2 tables matches')).toBeInTheDocument();
  expect(
    within(tableList()).queryByRole('link', { name: /orders/ }),
  ).not.toBeInTheDocument();
  expect(search().get('q')).toBe('cust');

  await user.clear(screen.getByRole('searchbox', { name: /Search by table/ }));
  await user.click(within(tableList()).getByRole('link', { name: 'orders' }));
  const fields = await screen.findByRole('table', { name: 'Fields of orders' });
  const id = within(fields).getByRole('row', { name: /^id/ });
  expect(within(id).getByText('Primary key')).toBeInTheDocument();
  expect(within(id).getByText('No')).toBeInTheDocument();
  expect(
    within(within(fields).getByRole('row', { name: /^note/ })).getByText(
      'Not reported',
    ),
  ).toBeInTheDocument();
  expect(
    within(
      within(fields).getByRole('row', { name: /^customerId/ }),
    ).queryByText('Primary key'),
  ).not.toBeInTheDocument();

  // A reference opens the referenced table in the same connection.
  await user.click(within(fields).getByRole('link', { name: 'customers' }));
  expect(
    await screen.findByRole('table', { name: 'Fields of customers' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Customers' }),
  ).toBeInTheDocument();
  expect(search().get('table')).toBe('customers');

  await user.type(
    screen.getByRole('searchbox', { name: /Search by field/ }),
    'missing',
  );
  expect(screen.getByText('No results')).toBeInTheDocument();
  expect(search().get('fieldQ')).toBe('missing');
});

it('restores the browsing context from the URL and follows Back', async () => {
  const user = userEvent.setup();
  await mount(({ path }) => {
    if (path.endsWith('/connections')) return { data: [main, external] };
    if (path.endsWith('external/collections'))
      return { data: [table('contacts'), table('accounts')] };
    if (path.endsWith('/contacts')) return detail('contacts');
    if (path.endsWith('/accounts')) return detail('accounts');
    throw new Error(`Unexpected request: ${path}`);
  }, '/settings/database-explorer?connection=external&table=contacts&q=c&fieldQ=name');

  expect(
    await screen.findByRole('table', { name: 'Fields of contacts' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('combobox', { name: 'Connection' }),
  ).toHaveTextContent('external');
  expect(
    screen.getByRole('searchbox', { name: /Search by table/ }),
  ).toHaveValue('c');
  expect(
    screen.getByRole('searchbox', { name: /Search by field/ }),
  ).toHaveValue('name');
  expect(
    within(tableList()).getByRole('link', { name: 'contacts' }),
  ).toHaveAttribute('aria-current', 'page');

  await user.click(within(tableList()).getByRole('link', { name: 'accounts' }));
  expect(
    await screen.findByRole('table', { name: 'Fields of accounts' }),
  ).toBeInTheDocument();
  // Opening another table starts its own field search.
  expect(search().get('fieldQ')).toBeNull();

  await user.click(screen.getByRole('button', { name: 'history back' }));
  expect(
    await screen.findByRole('table', { name: 'Fields of contacts' }),
  ).toBeInTheDocument();
  expect(search().get('table')).toBe('contacts');
});

it('never shows a late response for a table that is no longer selected', async () => {
  const user = userEvent.setup();
  const slow = Promise.withResolvers<unknown>();
  await mount(({ path }) => {
    if (path.endsWith('/connections')) return { data: [main] };
    if (path.endsWith('/collections'))
      return { data: [table('orders'), table('customers')] };
    if (path.endsWith('/orders')) return slow.promise;
    if (path.endsWith('/customers')) return detail('customers');
    throw new Error(`Unexpected request: ${path}`);
  });
  await user.click(
    await within(
      await screen.findByRole('list', { name: /^Tables in / }),
    ).findByRole('link', { name: 'orders' }),
  );
  await user.click(
    within(tableList()).getByRole('link', { name: 'customers' }),
  );
  await screen.findByRole('table', { name: 'Fields of customers' });
  await act(async () => slow.resolve(detail('orders')));
  expect(screen.queryByText('orders_name')).not.toBeInTheDocument();
  expect(screen.getByText('customers_name')).toBeInTheDocument();
});

it('clears the table selection when switching connections and ignores the old connection’s late list', async () => {
  const user = userEvent.setup();
  const slowMain = Promise.withResolvers<unknown>();
  let mainReads = 0;
  await mount(({ path }) => {
    if (path.endsWith('/connections')) return { data: [main, external] };
    if (path.endsWith('main/collections'))
      return ++mainReads === 1 ? { data: [table('orders')] } : slowMain.promise;
    if (path.endsWith('external/collections'))
      return { data: [table('contacts')] };
    if (path.endsWith('/orders')) return detail('orders');
    throw new Error(`Unexpected request: ${path}`);
  });
  await user.click(
    await within(
      await screen.findByRole('list', { name: 'Tables in main' }),
    ).findByRole('link', { name: 'orders' }),
  );
  await screen.findByRole('table', { name: 'Fields of orders' });

  await user.click(screen.getByRole('combobox', { name: 'Connection' }));
  await user.click(await screen.findByRole('option', { name: /external/ }));
  expect(
    await screen.findByRole('list', { name: 'Tables in external' }),
  ).toBeInTheDocument();
  expect(search().get('table')).toBeNull();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(
    screen.getByText('Select a table to view its fields.'),
  ).toBeInTheDocument();

  // Back to main starts a new read; switching away before it settles must not let it replace the newer list.
  await user.click(screen.getByRole('button', { name: 'history back' }));
  await user.click(screen.getByRole('button', { name: 'history back' }));
  await screen.findByText('Loading');
  await user.click(screen.getByRole('combobox', { name: 'Connection' }));
  await user.click(await screen.findByRole('option', { name: /external/ }));
  await screen.findByRole('list', { name: 'Tables in external' });
  await act(async () => slowMain.resolve({ data: [table('late_table')] }));
  expect(screen.queryByText('late_table')).not.toBeInTheDocument();
});

it('keeps the tables read before a failed page and offers to load them again', async () => {
  const user = userEvent.setup();
  let failing = true;
  await mount(({ path, query }) => {
    if (path.endsWith('/connections')) return { data: [main] };
    if (path.endsWith('/collections')) {
      if (query.pageToken === undefined)
        return { data: [table('orders')], meta: { nextPageToken: 'next' } };
      return failing
        ? new Response(null, { status: 500 })
        : { data: [table('customers')] };
    }
    throw new Error(`Unexpected request: ${path}`);
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Loading stopped after 1 table; search covers these tables only.',
  );
  expect(
    within(tableList()).getByRole('link', { name: 'orders' }),
  ).toBeInTheDocument();
  failing = false;
  await user.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('2 tables')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('explains connections, tables and searches that have nothing to show', async () => {
  const user = userEvent.setup();
  await mount(({ path }) => {
    if (path.endsWith('/connections')) return { data: [main, external] };
    if (path.endsWith('main/collections')) return { data: [table('orders')] };
    if (path.endsWith('external/collections')) return { data: [] };
    if (path.endsWith('/orders')) return detail('orders', []);
    if (path.endsWith('/gone')) return apiError(404, 'COLLECTION_NOT_FOUND');
    throw new Error(`Unexpected request: ${path}`);
  }, '/settings/database-explorer?table=gone');
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'This table does not exist on the connection',
  );
  expect(
    screen.queryByRole('button', { name: 'Retry' }),
  ).not.toBeInTheDocument();

  await user.click(within(tableList()).getByRole('link', { name: 'orders' }));
  expect(
    await screen.findByText('This table has no fields'),
  ).toBeInTheDocument();

  await user.type(
    screen.getByRole('searchbox', { name: /Search by table/ }),
    'zzz',
  );
  expect(screen.getByText('No results')).toBeInTheDocument();

  await user.click(screen.getByRole('combobox', { name: 'Connection' }));
  await user.click(await screen.findByRole('option', { name: /external/ }));
  expect(
    await screen.findByText('This connection has no tables'),
  ).toBeInTheDocument();
});

it('reports a connection named in the URL that does not exist', async () => {
  await mount(({ path }) => {
    if (path.endsWith('/connections')) return { data: [main] };
    throw new Error(`Unexpected request: ${path}`);
  }, '/settings/database-explorer?connection=removed&table=orders');
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'This connection does not exist',
  );
  expect(
    screen.getByRole('combobox', { name: 'Connection' }),
  ).toHaveTextContent('Choose a connection');
});

it('offers retry for a failed or unavailable read and handles an empty connection list', async () => {
  let attempts = 0;
  const user = userEvent.setup();
  await mount(() =>
    ++attempts === 1 ? apiError(503, 'CONNECTION_UNAVAILABLE') : { data: [] },
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'The database is unavailable right now',
  );
  await user.click(screen.getByRole('button', { name: 'Retry' }));
  expect(
    await screen.findByText('No database connections are configured'),
  ).toBeInTheDocument();
});

it('explains forbidden access without offering a retry', async () => {
  await mount(() => new Response(null, { status: 403 }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'You do not have permission to browse databases',
  );
  expect(
    screen.queryByRole('button', { name: 'Retry' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});

it('asks to sign in again when the session has expired', async () => {
  await mount(({ path }) => {
    if (path.endsWith('/connections')) return { data: [main] };
    return new Response(null, { status: 401 });
  });
  expect(await screen.findByRole('alert')).toHaveTextContent('Session expired');
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
    'href',
    expect.stringMatching(/\/login$/u),
  );
});

it('moves through the table list with the keyboard', async () => {
  const user = userEvent.setup();
  await mount(({ path }) => {
    if (path.endsWith('/connections')) return { data: [main] };
    if (path.endsWith('/collections'))
      return { data: [table('alpha'), table('beta'), table('gamma')] };
    if (path.endsWith('/beta')) return detail('beta');
    throw new Error(`Unexpected request: ${path}`);
  });
  await screen.findByText('3 tables');
  await user.click(screen.getByRole('searchbox', { name: /Search by table/ }));
  await user.keyboard('{ArrowDown}');
  expect(
    within(tableList()).getByRole('link', { name: 'alpha' }),
  ).toHaveFocus();
  await user.keyboard('{ArrowDown}');
  expect(within(tableList()).getByRole('link', { name: 'beta' })).toHaveFocus();
  await user.keyboard('{End}');
  expect(
    within(tableList()).getByRole('link', { name: 'gamma' }),
  ).toHaveFocus();
  await user.keyboard('{ArrowUp}{Enter}');
  expect(
    await screen.findByRole('table', { name: 'Fields of beta' }),
  ).toBeInTheDocument();
});

it('shows one level at a time on a narrow screen and returns to the table it came from', async () => {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
  const user = userEvent.setup();
  await mount(({ path }) => {
    if (path.endsWith('/connections')) return { data: [main] };
    if (path.endsWith('/collections'))
      return { data: [table('orders'), table('customers')] };
    if (path.endsWith('/orders')) return detail('orders');
    throw new Error(`Unexpected request: ${path}`);
  });
  await user.click(
    await within(
      await screen.findByRole('list', { name: /^Tables in / }),
    ).findByRole('link', { name: 'orders' }),
  );
  // Fields stack as labelled blocks instead of a wide table.
  const fields = await screen.findByRole('list', { name: 'Fields of orders' });
  expect(within(fields).getByText('orders_name')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'orders' })).toHaveFocus();

  await user.click(screen.getByRole('link', { name: 'All tables' }));
  expect(search().get('table')).toBeNull();
  expect(
    within(tableList()).getByRole('link', { name: 'orders' }),
  ).toHaveFocus();
});
