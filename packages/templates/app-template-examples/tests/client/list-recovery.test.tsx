import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { useApiClient } from '@nocobase/app-client';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Link,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import { useListData } from '../../client/hooks/use-list-data.js';
import { useListLocation } from '../../client/hooks/use-list-location.js';
import { useTableUrlState } from '../../client/hooks/use-table-url-state.js';
import enUS from '../../client/locales/en-US.js';

interface Page {
  data: string[];
  meta: { total: number };
}
function List() {
  const api = useApiClient();
  const { params, active } = useListLocation();
  const request = useListData<Page>(`items?${params}`, {
    active,
    keepPreviousData: true,
  });
  const state = useTableUrlState({
    sortColumns: ['name'],
    active,
    revision: request.revision,
    rowCount:
      !request.loading && !request.error ? request.data?.meta.total : undefined,
  });
  const [failed, setFailed] = useState(0);
  const remove = async (ids: string[]) => {
    const results = await Promise.allSettled(
      ids.map((id) => api.request({ path: `items/${id}`, method: 'DELETE' })),
    );
    setFailed(results.filter((result) => result.status === 'rejected').length);
    if (results.some((result) => result.status === 'fulfilled'))
      request.reload();
  };
  return (
    <>
      <output data-testid='rows'>{request.data?.data.join(',')}</output>
      <output data-testid='total'>{request.data?.meta.total}</output>
      <output data-testid='failed'>{failed}</output>
      <output data-testid='error'>
        {state.error?.message ?? (request.error ? 'Read failed' : '')}
      </output>
      <button onClick={request.reload}>Refresh</button>
      <button onClick={() => void remove(['last'])}>Delete one</button>
      <button onClick={() => void remove(['last', 'protected'])}>
        Delete batch
      </button>
      <Link to={{ pathname: 'last', search: `?${params}` }}>Detail</Link>
      <Link to='?page=2&pageSize=10&q=new'>Change query</Link>
      <Outlet context={{ reload: request.reload }} />
    </>
  );
}
function Detail() {
  const api = useApiClient();
  const { reload } = useOutletContext<{ reload: () => void }>();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <button
      onClick={() =>
        void api.request({ path: 'items/last', method: 'DELETE' }).then(() => {
          reload();
          navigate({ pathname: '..', search: location.search });
        })
      }
    >
      Delete in detail
    </button>
  );
}
function Location() {
  const location = useLocation();
  return (
    <output data-testid='url'>
      {location.pathname}
      {location.search}
    </output>
  );
}
async function mount(
  answer: (call: ApiCall) => unknown,
  route = '/items?page=3&pageSize=10&q=loan&status=open&sort=name&order=desc&tab=active',
) {
  return renderWithApp(
    <>
      <Routes>
        <Route path='/items' element={<List />}>
          <Route path=':id' element={<Detail />} />
        </Route>
      </Routes>
      <Location />
    </>,
    {
      route,
      namespace: 'list-test',
      namespaces: { 'list-test': { 'en-US': async () => ({ default: enUS }) } },
      fetch: answerApi(answer),
    },
  );
}
it.each([
  { total: 20, target: 2 },
  { total: 0, target: 1 },
  { total: 21, target: 3 },
])(
  'uses the latest matching total $total after deletion',
  async ({ total, target }) => {
    let deleted = false;
    const calls = vi.fn(({ method }: ApiCall) => {
      if (method === 'DELETE') {
        deleted = true;
        return { data: null };
      }
      return {
        data: deleted ? (total ? ['remaining'] : []) : ['last'],
        meta: { total: deleted ? total : 21 },
      };
    });
    await mount(calls);
    await screen.findByText('last');
    await userEvent.click(screen.getByText('Delete one'));
    await waitFor(() =>
      expect(screen.getByTestId('url')).toHaveTextContent(
        `page=${target}&pageSize=10&q=loan&status=open&sort=name&order=desc&tab=active`,
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId('total')).toHaveTextContent(String(total)),
    );
    expect(
      calls.mock.calls.filter(([call]) => call.method === 'GET'),
    ).toHaveLength(target === 3 ? 2 : 3);
  },
);
it('refills a still valid first page and retains failed batch records', async () => {
  let deleted = false;
  await mount(({ method, path }) => {
    if (method === 'DELETE') {
      if (path.endsWith('protected'))
        return Response.json(
          { error: { code: 'FORBIDDEN', message: 'Protected' } },
          { status: 403 },
        );
      deleted = true;
      return { data: null };
    }
    return {
      data: deleted ? ['protected', 'next'] : ['last', 'protected'],
      meta: { total: deleted ? 20 : 21 },
    };
  }, '/items?page=1&pageSize=10&q=loan');
  await screen.findByText('last,protected');
  await userEvent.click(screen.getByText('Delete batch'));
  await waitFor(() =>
    expect(screen.getByTestId('rows')).toHaveTextContent('protected,next'),
  );
  expect(screen.getByTestId('failed')).toHaveTextContent('1');
  expect(screen.getByTestId('url')).toHaveTextContent(
    'page=1&pageSize=10&q=loan',
  );
});
it('keeps rows, count and URL on a failed deletion', async () => {
  const calls = vi.fn(({ method }: ApiCall) =>
    method === 'DELETE'
      ? Response.json(
          { error: { code: 'FORBIDDEN', message: 'Protected' } },
          { status: 403 },
        )
      : { data: ['last'], meta: { total: 21 } },
  );
  await mount(calls);
  await screen.findByText('last');
  await userEvent.click(screen.getByText('Delete one'));
  await waitFor(() =>
    expect(screen.getByTestId('failed')).toHaveTextContent('1'),
  );
  expect(screen.getByTestId('rows')).toHaveTextContent('last');
  expect(screen.getByTestId('total')).toHaveTextContent('21');
  expect(screen.getByTestId('url')).toHaveTextContent('page=3');
  expect(
    calls.mock.calls.filter(([call]) => call.method === 'GET'),
  ).toHaveLength(1);
});
it('defers detail refresh until returning, then replaces the invalid source page', async () => {
  let deleted = false;
  const calls = vi.fn(({ method }: ApiCall) => {
    if (method === 'DELETE') {
      deleted = true;
      return { data: null };
    }
    return {
      data: deleted ? ['remaining'] : ['last'],
      meta: { total: deleted ? 20 : 21 },
    };
  });
  await mount(calls);
  await screen.findByText('last');
  await userEvent.click(screen.getByText('Detail'));
  expect(screen.getByTestId('url')).toHaveTextContent('/items/last?page=3');
  expect(
    calls.mock.calls.filter(([call]) => call.method === 'GET'),
  ).toHaveLength(1);
  await userEvent.click(screen.getByText('Delete in detail'));
  await waitFor(() =>
    expect(screen.getByTestId('url')).toHaveTextContent('/items?page=2'),
  );
  expect(screen.getByTestId('url')).toHaveTextContent(
    'q=loan&status=open&sort=name&order=desc&tab=active',
  );
  await waitFor(() =>
    expect(screen.getByTestId('rows')).toHaveTextContent('remaining'),
  );
  expect(
    calls.mock.calls.filter(([call]) => call.method === 'GET'),
  ).toHaveLength(3);
});
it('stops after two corrective reads and allows an explicit retry', async () => {
  let stable = false;
  const calls = vi.fn(({ query }: ApiCall) => ({
    data: stable ? ['valid'] : [],
    meta: { total: stable ? 1000 : (Number(query.page) - 2) * 10 },
  }));
  await mount(calls, '/items?page=100&pageSize=10');
  await screen.findByText(enUS.settings.listChanged);
  expect(calls).toHaveBeenCalledTimes(3);
  expect(screen.getByTestId('url')).toHaveTextContent('page=96');
  stable = true;
  await userEvent.click(screen.getByText('Refresh'));
  await waitFor(() =>
    expect(screen.getByTestId('rows')).toHaveTextContent('valid'),
  );
  expect(screen.getByTestId('error')).toBeEmptyDOMElement();
});
it('ignores a pre-delete response even when its transport finishes after reload', async () => {
  let finish!: (value: unknown) => void;
  let reads = 0;
  await mount(({ method }) => {
    if (method === 'DELETE') return { data: null };
    reads++;
    if (reads === 1)
      return new Promise((resolve) => {
        finish = resolve;
      });
    return { data: ['remaining'], meta: { total: 20 } };
  });
  await waitFor(() => expect(reads).toBe(1));
  await userEvent.click(screen.getByText('Delete one'));
  await waitFor(() =>
    expect(screen.getByTestId('url')).toHaveTextContent('page=2'),
  );
  await act(async () => {
    finish({ data: ['deleted-old'], meta: { total: 21 } });
  });
  expect(screen.getByTestId('rows')).toHaveTextContent('remaining');
  expect(screen.getByTestId('rows')).not.toHaveTextContent('deleted-old');
  expect(screen.getByTestId('url')).toHaveTextContent('page=2');
});

it('keeps the valid source on a failed refresh and corrects only after a successful retry', async () => {
  let reads = 0;
  await mount(() => {
    reads++;
    if (reads === 2)
      return Response.json(
        { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Read failed' } },
        { status: 500 },
      );
    return {
      data: [reads === 1 ? 'last' : 'remaining'],
      meta: { total: reads === 1 ? 21 : 20 },
    };
  });
  await screen.findByText('last');
  await userEvent.click(screen.getByText('Refresh'));
  await screen.findByText('Read failed');
  expect(screen.getByTestId('url')).toHaveTextContent('page=3');
  expect(screen.getByTestId('rows')).toHaveTextContent('last');
  await userEvent.click(screen.getByText('Refresh'));
  await waitFor(() =>
    expect(screen.getByTestId('url')).toHaveTextContent('page=2'),
  );
  await waitFor(() =>
    expect(screen.getByTestId('rows')).toHaveTextContent('remaining'),
  );
});

it('refreshes once after a wholly successful batch, then corrects the last page', async () => {
  let deleted = false;
  const calls = vi.fn(({ method }: ApiCall) => {
    if (method === 'DELETE') {
      deleted = true;
      return { data: null };
    }
    return {
      data: deleted ? ['remaining'] : ['last', 'protected'],
      meta: { total: deleted ? 19 : 22 },
    };
  });
  await mount(calls);
  await screen.findByText('last,protected');
  await userEvent.click(screen.getByText('Delete batch'));
  await waitFor(() =>
    expect(screen.getByTestId('url')).toHaveTextContent('page=2'),
  );
  await waitFor(() =>
    expect(screen.getByTestId('rows')).toHaveTextContent('remaining'),
  );
  expect(
    calls.mock.calls.filter(([call]) => call.method === 'GET'),
  ).toHaveLength(3);
  expect(screen.getByTestId('failed')).toHaveTextContent('0');
});

it('does not let an old filtered response correct a newer query', async () => {
  let finish!: (value: unknown) => void;
  await mount(({ query }) =>
    query.q === 'new'
      ? { data: ['fresh-query'], meta: { total: 21 } }
      : new Promise((resolve) => {
          finish = resolve;
        }),
  );
  await waitFor(() => expect(finish).toBeDefined());
  await userEvent.click(screen.getByText('Change query'));
  await screen.findByText('fresh-query');
  await act(async () => finish({ data: [], meta: { total: 0 } }));
  expect(screen.getByTestId('url')).toHaveTextContent(
    'page=2&pageSize=10&q=new',
  );
  expect(screen.getByTestId('rows')).toHaveTextContent('fresh-query');
});

it('suspends a root list while its child covers it', async () => {
  const calls = vi.fn(() => ({ data: ['last'], meta: { total: 21 } }));
  await renderWithApp(
    <>
      <Routes>
        <Route path='/' element={<List />}>
          <Route path='last' element={<Detail />} />
        </Route>
      </Routes>
      <Location />
    </>,
    {
      route: '/?page=3&pageSize=10',
      namespace: 'list-test',
      namespaces: { 'list-test': { 'en-US': async () => ({ default: enUS }) } },
      fetch: answerApi(calls),
    },
  );
  await screen.findByText('last');
  await userEvent.click(screen.getByText('Detail'));
  expect(screen.getByTestId('url')).toHaveTextContent('/last?page=3');
  expect(calls).toHaveBeenCalledTimes(1);
});
