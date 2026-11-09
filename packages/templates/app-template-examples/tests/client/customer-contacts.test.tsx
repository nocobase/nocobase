import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { answerApi, type ApiCall } from '@nocobase/app-testing/client';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useOutletContext } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderSettingsClient } from '../helpers/settings-client.js';
import CustomerContactsPage, {
  type CustomerListContext,
} from '../../client/pages/customer-contacts/index.js';
import CustomerDetailPage from '../../client/pages/customer-contacts/detail.js';
import CustomerEditorPage from '../../client/pages/customer-contacts/edit.js';
import CustomerBatchPage from '../../client/pages/customer-contacts/batch.js';
import { RelationPicker } from '../../client/pages/customer-contacts/relation-picker.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = 'customer-contacts-test';
const customer = {
  id: 'customer-01',
  name: 'Acorn 01',
  status: 'active',
  ownerId: 'crm-rep',
  notes: '',
};
const contact = {
  id: 'contact-01',
  customerId: customer.id,
  name: 'Original buyer',
  email: '',
  phone: '',
  title: '',
};
const list = (data: unknown[], page = 1, total = data.length) => ({
  data,
  meta: { total, page, pageSize: 10 },
});
const failure = (status: number) =>
  Response.json(
    {
      error: {
        status: status === 403 ? 'PERMISSION_DENIED' : 'INTERNAL',
        reason: 'FORBIDDEN',
        message: 'Unavailable',
      },
    },
    { status },
  );
function fixture(handler: (call: ApiCall) => unknown) {
  return answerApi((call) => {
    if (call.path === 'authorization/permissions')
      return { data: { unrestricted: true, permissions: [] } };
    if (call.path === 'customerContacts/salesReps/crm-rep')
      return { data: { id: 'crm-rep', name: 'Alex Rivera', active: true } };
    return handler(call);
  });
}
function mount(
  handler: (call: ApiCall) => unknown,
  route = '/customer-contacts',
  locale = 'en-US',
  ui?: React.ReactElement,
) {
  return renderSettingsClient(
    ui ?? (
      <Routes>
        <Route path='/customer-contacts' element={<CustomerContactsPage />}>
          <Route path='batch' element={<CustomerBatchPage />} />
          <Route path=':customerId' element={<CustomerDetailPage />}>
            <Route path='edit' element={<CustomerEditorPage />} />
            <Route path='contacts/new' element={<CustomerEditorPage />} />
            <Route
              path='contacts/:contactId/edit'
              element={<CustomerEditorPage />}
            />
          </Route>
        </Route>
      </Routes>
    ),
    {
      route,
      locale,
      namespace,
      namespaces: {
        [namespace]: {
          'en-US': async () => ({ default: enUS }),
          'zh-CN': async () => ({ default: zhCN }),
        },
      },
      fetch: fixture(handler),
      services: (app) =>
        app.container.instance(
          authorizationClientToken,
          new AuthorizationClient(app.container.resolve(apiClientToken)),
        ),
    },
  );
}

/** Lets a test decide when the end of the picker list becomes visible. */
const observers = new Set<TestIntersectionObserver>();
class TestIntersectionObserver {
  readonly targets: Element[] = [];
  constructor(readonly callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.targets.push(target);
    observers.add(this);
  }
  unobserve() {}
  disconnect() {
    observers.delete(this);
  }
  takeRecords() {
    return [];
  }
}
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
});
afterEach(() => {
  observers.clear();
  vi.unstubAllGlobals();
});
function scrollToEnd() {
  act(() => {
    for (const observer of [...observers])
      observer.callback(
        observer.targets.map(
          (target) => ({ isIntersecting: true, target }) as never,
        ),
        observer as never,
      );
  });
}

it('keeps the selected label while scrolling and searching and discards a late picker response', async () => {
  const calls: ApiCall[] = [];
  let finish!: (value: unknown) => void;
  const slow = new Promise((resolve) => {
    finish = resolve;
  });
  await mount(
    (call) => {
      calls.push(call);
      if (call.path === 'customerContacts/customers/customer-01')
        return { data: customer };
      if (call.path === 'customerContacts/customers/options') {
        if (call.query?.search === 'old') return slow;
        if (call.query?.search === 'new')
          return list([{ id: 'new', name: 'New result' }]);
        return list(
          [
            {
              id: String(call.query?.page),
              name: `Page ${call.query?.page} option`,
            },
          ],
          Number(call.query?.page),
          12,
        );
      }
      throw new Error(`Unexpected ${call.path}`);
    },
    '/picker',
    'en-US',
    <RelationPicker
      kind='customers'
      value={customer.id}
      onChange={() => undefined}
      label='Customer'
    />,
  );
  await screen.findByRole('button', { name: 'Customer' });
  await screen.findByText('Acorn 01');
  await userEvent.click(screen.getByRole('button', { name: 'Customer' }));
  await screen.findByText('Page 1 option');
  expect(
    screen.queryByRole('button', { name: 'Next' }),
  ).not.toBeInTheDocument();
  scrollToEnd();
  await screen.findByText('Page 2 option');
  expect(screen.getByText('Page 1 option')).toBeInTheDocument();
  expect(screen.getByText('Acorn 01')).toBeInTheDocument();
  await waitFor(() => expect(observers.size).toBe(0));
  scrollToEnd();
  expect(calls.filter((call) => call.query?.page === '3')).toEqual([]);
  const search = screen.getByRole('textbox', { name: 'Search by name' });
  fireEvent.change(search, { target: { value: 'old' } });
  await waitFor(() =>
    expect(calls.some((call) => call.query?.search === 'old')).toBe(true),
  );
  fireEvent.change(search, { target: { value: 'new' } });
  await screen.findByText('New result');
  expect(screen.queryByText('Page 2 option')).not.toBeInTheDocument();
  await act(async () => {
    finish(list([{ id: 'old', name: 'Old result' }]));
  });
  expect(screen.queryByText('Old result')).not.toBeInTheDocument();
  expect(calls.find((call) => call.query?.search === 'new')?.query?.page).toBe(
    '1',
  );
});

it('retries a failed next page and restarts a status filter from the first page', async () => {
  const calls: ApiCall[] = [];
  let failNext = true;
  await mount(
    (call) => {
      if (call.path !== 'customerContacts/customers/options')
        throw new Error(`Unexpected ${call.path}`);
      calls.push(call);
      if (call.query?.status === 'closed') return list([]);
      const page = Number(call.query?.page);
      if (page === 2 && failNext) {
        failNext = false;
        return failure(500);
      }
      return list([{ id: `c-${page}`, name: `Customer ${page}` }], page, 12);
    },
    '/picker',
    'en-US',
    <RelationPicker
      kind='customers'
      value=''
      onChange={() => undefined}
      label='Customer'
    />,
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Customer' }),
  );
  await screen.findByText('Customer 1');
  scrollToEnd();
  await screen.findByText('Unable to load data');
  expect(screen.getByText('Customer 1')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByText('Customer 2');
  expect(screen.queryByText('Unable to load data')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Closed' }));
  await screen.findByText('No results');
  expect(calls.at(-1)?.query).toMatchObject({ status: 'closed', page: '1' });
  expect(screen.queryByText('Customer 2')).not.toBeInTheDocument();
});

it.each(['en-US', 'zh-CN'])(
  'shows no hidden selected label in %s',
  async (locale) => {
    await mount(
      () => failure(403),
      '/picker',
      locale,
      <RelationPicker
        kind='customers'
        value='hidden'
        onChange={() => undefined}
        label='Customer'
      />,
    );
    await screen.findByText(
      locale === 'en-US' ? 'Record unavailable' : '记录不可用',
    );
    expect(screen.queryByText('Hidden customer')).not.toBeInTheDocument();
  },
);

it('clears current-page selection on pagination and sends only the new page selection', async () => {
  const writes: unknown[] = [];
  await mount(({ path, query, json }) => {
    if (path === 'customerContacts/customers')
      return Number(query?.page) === 2
        ? list([{ ...customer, id: 'customer-11', name: 'Birch 11' }], 2, 20)
        : list([customer], 1, 20);
    if (path.endsWith('batchUpdate')) {
      writes.push(json);
      return {
        data: {
          items: [{ id: 'customer-11', outcome: 'updated' }],
          updated: 1,
          failed: 0,
        },
      };
    }
    throw new Error(`Unexpected ${path}`);
  });
  await userEvent.click(
    await screen.findByRole('checkbox', { name: 'Select Acorn 01' }),
  );
  await screen.findByText('1 selected on this page');
  const next = screen.getByRole('button', { name: /next page/i });
  await userEvent.click(next);
  await screen.findByRole('checkbox', { name: 'Select Birch 11' });
  expect(screen.queryByText('1 selected on this page')).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Select Birch 11' }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Edit selected customers' }),
  );
  await screen.findByText('This assignment will change 1 selected customers.');
  await userEvent.click(
    screen.getByRole('button', { name: 'Apply', exact: true }),
  );
  await screen.findByText('1 updated, 0 failed');
  expect(screen.getByText('Birch 11: Done')).toBeInTheDocument();
  expect(writes).toEqual([
    { ids: ['customer-11'], values: { status: 'active' } },
  ]);
});

it('shows every partial result without looking up hidden record names and locks duplicate submits', async () => {
  let finish!: (value: unknown) => void;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  let writes = 0;
  await mount(({ path }) => {
    if (path === 'customerContacts/customers')
      return list([
        customer,
        { ...customer, id: 'customer-02', name: 'Birch 02' },
      ]);
    if (path.endsWith('batchUpdate')) {
      writes++;
      return pending;
    }
    throw new Error(`Unexpected ${path}`);
  });
  await userEvent.click(
    await screen.findByRole('checkbox', { name: 'Select Acorn 01' }),
  );
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Select Birch 02' }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Edit selected customers' }),
  );
  const apply = await screen.findByRole('button', {
    name: 'Apply',
    exact: true,
  });
  fireEvent.click(apply);
  fireEvent.click(apply);
  await waitFor(() => expect(writes).toBe(1));
  expect(
    screen.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeDisabled();
  await act(async () => {
    finish({
      data: {
        items: [
          { id: 'customer-01', outcome: 'updated' },
          { id: 'customer-02', outcome: 'failed', reason: 'FORBIDDEN' },
        ],
        updated: 1,
        failed: 1,
      },
    });
  });
  await screen.findByText('1 updated, 1 failed');
  expect(
    screen.getByText('Birch 02: Record or operation unavailable'),
  ).toBeInTheDocument();
});

it('keeps a contact draft after a rejected association save and sends the selected target', async () => {
  const writes: unknown[] = [];
  await mount(({ path, method, json }) => {
    if (path === 'customerContacts/customers') return list([customer]);
    if (path === 'customerContacts/customers/customer-01')
      return { data: customer };
    if (path.endsWith('/contacts') && method === 'GET') return list([contact]);
    if (path === 'customerContacts/contacts/contact-01') {
      if (method === 'PATCH') {
        writes.push(json);
        return failure(403);
      }
      return { data: contact };
    }
    throw new Error(`Unexpected ${path}`);
  }, '/customer-contacts/customer-01/contacts/contact-01/edit');
  const dialog = await screen.findByRole('dialog', { name: 'Edit contact' });
  const name = await within(dialog).findByRole('textbox', { name: 'Name *' });
  await userEvent.clear(name);
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save', exact: true }),
  );
  await within(dialog).findByText('Enter a name of up to 100 characters.');
  expect(writes).toHaveLength(0);
  await userEvent.type(name, 'Revised buyer');
  await waitFor(() =>
    expect(
      within(dialog).queryByText('Enter a name of up to 100 characters.'),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(
      within(dialog).getByRole('button', { name: 'Customer' }),
    ).toHaveTextContent('Acorn 01'),
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save', exact: true }),
  );
  await within(dialog).findByText(
    'Nothing was changed. Check your permissions and the selected values.',
  );
  expect(name).toHaveValue('Revised buyer');
  expect(writes).toEqual([
    {
      customerId: customer.id,
      name: 'Revised buyer',
      email: '',
      phone: '',
      title: '',
    },
  ]);
});

it('keeps reset failure feedback inside its open confirmation', async () => {
  await mount(({ path, method }) => {
    if (path === 'customerContacts/customers') return list([customer]);
    if (path === 'customerContacts/reset' && method === 'POST')
      return failure(500);
    throw new Error(`Unexpected ${path}`);
  });
  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Reset example data',
      exact: true,
    }),
  );
  const dialog = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(dialog).getByRole('button', {
      name: 'Reset example data',
      exact: true,
    }),
  );
  await within(dialog).findByText(
    'The result is unknown. Refresh and inspect the data before submitting again.',
  );
  expect(dialog).toBeVisible();
});

it('keeps delete failure feedback inside its open confirmation', async () => {
  await mount(({ path, method }) => {
    if (path === 'customerContacts/customers') return list([customer]);
    if (path === 'customerContacts/customers/customer-01')
      return { data: customer };
    if (path.endsWith('/contacts')) return list([contact]);
    if (path === 'customerContacts/contacts/contact-01')
      return method === 'DELETE' ? failure(403) : { data: contact };
    throw new Error(`Unexpected ${path}`);
  }, '/customer-contacts/customer-01');
  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Actions for Original buyer',
      exact: true,
    }),
  );
  await userEvent.click(
    await screen.findByRole('menuitem', { name: 'Delete', exact: true }),
  );
  const dialog = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Delete', exact: true }),
  );
  await within(dialog).findByText(
    'Nothing was changed. Check your permissions and the selected values.',
  );
  expect(dialog).toBeVisible();
});

it('focuses an unavailable association and links its validation message', async () => {
  let writes = 0;
  await mount(({ path, method }) => {
    if (path === 'customerContacts/customers') return list([customer]);
    if (path === 'customerContacts/customers/customer-01') return failure(403);
    if (path === 'customerContacts/contacts/contact-01') {
      if (method === 'PATCH') writes++;
      return { data: contact };
    }
    throw new Error(`Unexpected ${path}`);
  }, '/customer-contacts/customer-01/contacts/contact-01/edit');
  const dialog = await screen.findByRole('dialog', { name: 'Edit contact' });
  await within(dialog).findByText('Record unavailable');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save', exact: true }),
  );
  const target = within(dialog).getByRole('button', {
    name: 'Customer',
    exact: true,
  });
  await waitFor(() => expect(target).toHaveFocus());
  expect(target).toHaveAttribute('aria-invalid', 'true');
  expect(
    document.getElementById(target.getAttribute('aria-describedby')!),
  ).toHaveTextContent('Select an available record.');
  expect(writes).toBe(0);
});

it('discards rows and selection when permissions change', async () => {
  let denied = false;
  const view = await mount(({ path }) => {
    if (path === 'customerContacts/customers')
      return denied ? failure(403) : list([customer]);
    throw new Error(`Unexpected ${path}`);
  });
  await userEvent.click(
    await screen.findByRole('checkbox', { name: 'Select Acorn 01' }),
  );
  await screen.findByText('1 selected on this page');
  denied = true;
  act(() => view.app.container.resolve(authorizationClientToken).invalidate());
  await screen.findByText('Access denied');
  expect(screen.queryByText('1 selected on this page')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Acorn 01' }),
  ).not.toBeInTheDocument();
});

it('shows loading instead of the previous search options while a new search is pending', async () => {
  let finish!: (value: unknown) => void;
  const slow = new Promise((resolve) => {
    finish = resolve;
  });
  await mount(
    (call) => {
      if (call.path === 'customerContacts/customers/options')
        return call.query?.search === 'zed'
          ? slow
          : list([{ id: 'acorn', name: 'Acorn option' }]);
      throw new Error(`Unexpected ${call.path}`);
    },
    '/picker',
    'en-US',
    <RelationPicker
      kind='customers'
      value=''
      onChange={() => undefined}
      label='Customer'
    />,
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Customer' }),
  );
  await screen.findByText('Acorn option');
  fireEvent.change(screen.getByRole('textbox', { name: 'Search by name' }), {
    target: { value: 'zed' },
  });
  // The cache keeps the previous search as placeholder data; it is not a match.
  await waitFor(() =>
    expect(screen.queryByText('Acorn option')).not.toBeInTheDocument(),
  );
  expect(
    await screen.findByRole('status', {
      name: enUS.customerContacts.loading,
    }),
  ).toBeInTheDocument();
  await act(async () => {
    finish(list([{ id: 'zed', name: 'Zed option' }]));
  });
  expect(await screen.findByText('Zed option')).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('keeps customer rows during a refresh and shows only the table refresh indicator', async () => {
  let refresh = false;
  let finish!: (value: unknown) => void;
  const slow = new Promise((resolve) => {
    finish = resolve;
  });
  function ReloadList() {
    const { reload } = useOutletContext<CustomerListContext>();
    // Child writes use this callback; ordinary pages no longer expose a Refresh action.
    return <button onClick={reload}>Reload list after write</button>;
  }
  await mount(
    (call) => {
      if (call.path === 'customerContacts/customers')
        return refresh ? slow : list([customer]);
      throw new Error(`Unexpected ${call.path}`);
    },
    '/customer-contacts',
    'en-US',
    <Routes>
      <Route path='/customer-contacts' element={<CustomerContactsPage />}>
        <Route index element={<ReloadList />} />
      </Route>
    </Routes>,
  );
  expect(await screen.findByRole('link', { name: 'Acorn 01' })).toBeVisible();
  refresh = true;
  await userEvent.click(
    screen.getByRole('button', { name: 'Reload list after write' }),
  );
  expect(screen.getByRole('link', { name: 'Acorn 01' })).toBeVisible();
  expect(
    await screen.findByRole('status', { name: enUS['status.refreshing'] }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole('status')).toHaveLength(1);
  await act(async () => {
    finish(list([{ ...customer, name: 'Acorn refreshed' }]));
  });
  expect(
    await screen.findByRole('link', { name: 'Acorn refreshed' }),
  ).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('restarts the picker wait for each search and announces a slow next page outside its busy row', async () => {
  const pending = new Map<string, Promise<unknown>>();
  const hold = (key: string) => {
    if (!pending.has(key)) pending.set(key, new Promise(() => undefined));
    return pending.get(key);
  };
  await mount(
    (call) => {
      if (call.path !== 'customerContacts/customers/options')
        throw new Error(`Unexpected ${call.path}`);
      const search = String(call.query?.search ?? '');
      if (search) return hold(search);
      return Number(call.query?.page) === 1
        ? list([{ id: 'a', name: 'First option' }], 1, 12)
        : hold('page-2');
    },
    '/picker',
    'en-US',
    <RelationPicker
      kind='customers'
      value=''
      onChange={() => undefined}
      label='Customer'
    />,
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Customer' }),
  );
  await screen.findByText('First option');
  vi.useFakeTimers();
  try {
    // A slow next page: one polite status outside the busy row, then the long-wait note.
    scrollToEnd();
    await act(() => vi.advanceTimersByTimeAsync(300));
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(enUS.customerContacts.loading);
    expect(status.closest('[aria-busy="true"]')).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(9700));
    expect(status).toHaveTextContent(enUS.pendingFeedback.longWait);

    const search = screen.getByRole('textbox', { name: 'Search by name' });
    fireEvent.change(search, { target: { value: 'alpha' } });
    await act(() => vi.advanceTimersByTimeAsync(300));
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.pendingFeedback.longWait,
    );
    // A new search while the first is still pending starts its own wait.
    fireEvent.change(search, { target: { value: 'beta' } });
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(screen.queryByRole('status')).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(screen.queryByRole('status')).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.customerContacts.loading,
    );
  } finally {
    vi.useRealTimers();
  }
});

it('shows cards and a filter sheet with the applied count on a phone', async () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  const calls: ApiCall[] = [];
  await mount((call) => {
    if (call.path === 'customerContacts/customers') {
      calls.push(call);
      return list([customer]);
    }
    throw new Error(`Unexpected ${call.path}`);
  }, '/customer-contacts?ownerId=crm-rep');

  const card = within(await screen.findByRole('list'))
    .getAllByRole('listitem')
    .at(0)!;
  expect(within(card).getByRole('link', { name: 'Acorn 01' })).toBeVisible();
  expect(within(card).getByText('Active')).toBeVisible();
  expect(await within(card).findByText('Alex Rivera')).toBeVisible();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Filters · 1' }));
  const sheet = await screen.findByRole('dialog', { name: 'Filters' });
  await userEvent.click(
    within(sheet).getByRole('combobox', { name: 'Status' }),
  );
  await userEvent.click(await screen.findByRole('option', { name: 'Paused' }));
  await waitFor(() =>
    expect(calls.at(-1)?.query).toMatchObject({
      status: 'paused',
      ownerId: 'crm-rep',
      page: '1',
    }),
  );
  // The sheet is a temporary panel: closing it keeps the filters, which live in the URL.
  await userEvent.keyboard('{Escape}');
  expect(
    await screen.findByRole('button', { name: 'Filters · 2' }),
  ).toBeVisible();
});

it('selects and clears the whole page from the phone cards and keeps the batch target across widths', async () => {
  let phone = true;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return phone;
    },
    media: query,
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  }));
  const setPhone = (next: boolean) => {
    phone = next;
    act(() => {
      for (const listener of listeners) listener();
    });
  };
  const birch = { ...customer, id: 'customer-02', name: 'Birch 02' };
  const cedar = { ...customer, id: 'customer-11', name: 'Cedar 11' };
  await mount(({ path, query }) => {
    if (path === 'customerContacts/customers') {
      if (query?.status === 'paused') return list([]);
      return Number(query?.page) === 2
        ? list([cedar], 2, 12)
        : list([customer, birch], 1, 12);
    }
    throw new Error(`Unexpected ${path}`);
  });
  // On a phone the visible label names the page's select-all checkbox; the page re-renders it, so query it each time.
  const selectAll = () =>
    screen.getByRole('checkbox', { name: /Select all on this page/u });
  await screen.findByRole('checkbox', { name: /Select all on this page/u });
  expect(screen.queryByRole('table')).not.toBeInTheDocument();

  // One card selected: the page is partly selected.
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Select Acorn 01' }),
  );
  expect(selectAll()).toHaveAttribute('aria-checked', 'mixed');
  // One tap on the label selects the rest of the page.
  await userEvent.click(screen.getByText('Select all on this page'));
  await screen.findByText('2 selected on this page');
  expect(selectAll()).toHaveAttribute('aria-checked', 'true');

  // The selection survives a switch to the desktop table and back.
  setPhone(false);
  expect(await screen.findByRole('table')).toBeVisible();
  expect(screen.getByText('2 selected on this page')).toBeVisible();
  setPhone(true);
  await waitFor(() =>
    expect(screen.queryByRole('table')).not.toBeInTheDocument(),
  );
  expect(screen.getByText('2 selected on this page')).toBeVisible();

  // A second tap clears the page; a third selects it again, and the batch action targets exactly this page.
  await userEvent.click(selectAll());
  expect(screen.queryByText(/selected on this page/u)).not.toBeInTheDocument();
  await userEvent.click(selectAll());
  await screen.findByText('2 selected on this page');
  await userEvent.click(
    screen.getByRole('button', { name: 'Edit selected customers' }),
  );
  await screen.findByText('This assignment will change 2 selected customers.');
  await userEvent.keyboard('{Escape}');
  await waitFor(() =>
    expect(
      screen.queryByText('This assignment will change 2 selected customers.'),
    ).not.toBeInTheDocument(),
  );

  // Selection is scoped to the page and the query: paging and filtering clear it.
  // Closing the batch dialog without applying keeps the page's selection.
  expect(screen.getByText('2 selected on this page')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: /next page/i }));
  await screen.findByRole('checkbox', { name: 'Select Cedar 11' });
  expect(screen.queryByText(/selected on this page/u)).not.toBeInTheDocument();
  await userEvent.click(screen.getByText('Select all on this page'));
  await screen.findByText('1 selected on this page');
  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  const sheet = await screen.findByRole('dialog', { name: 'Filters' });
  await userEvent.click(
    within(sheet).getByRole('combobox', { name: 'Status' }),
  );
  await userEvent.click(await screen.findByRole('option', { name: 'Paused' }));
  await userEvent.keyboard('{Escape}');
  await screen.findByText('No results');
  expect(screen.queryByText(/selected on this page/u)).not.toBeInTheDocument();
});
