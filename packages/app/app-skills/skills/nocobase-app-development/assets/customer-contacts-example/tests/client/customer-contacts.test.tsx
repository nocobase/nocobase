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
import { Route, Routes } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderSettingsClient } from '../helpers/settings-client.js';
import CustomerContactsPage from '../../client/pages/customer-contacts/index.js';
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
