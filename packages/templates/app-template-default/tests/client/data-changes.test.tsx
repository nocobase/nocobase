import { ApiClientError } from '@nocobase/app-client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { act, screen, waitFor } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { expect, it } from 'vitest';
import {
  announceDataChange,
  scopesOverlap,
  type DataChange,
} from '../../client/hooks/use-data-changes.js';
import { useListData } from '../../client/hooks/use-list-data.js';

interface Rows {
  data: { id: string; name: string }[];
}
interface Item {
  data: { id: string; name: string };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const label = (data: Rows | Item) =>
  Array.isArray(data.data)
    ? data.data.map((row) => row.name).join(',')
    : data.data.name;

function View({
  path,
  scopes,
  active = true,
  merge,
  id,
}: {
  path: string;
  scopes: string[];
  active?: boolean;
  merge?: (current: Rows, change: DataChange) => Rows | undefined;
  id: string;
}) {
  const request = useListData<Rows | Item>(path, {
    active,
    keepPreviousData: true,
    scopes,
    merge: merge as never,
  });
  const data = request.data;
  const status =
    request.error instanceof ApiClientError ? request.error.status : 0;
  const text = request.error
    ? `${status === 404 ? 'missing' : 'error'} ${status}${data ? ` ${label(data)}` : ''}`
    : data
      ? label(data)
      : '';
  return <output data-testid={id}>{text}</output>;
}

function Covered({
  children,
}: {
  children: (active: boolean) => ReactElement;
}) {
  const [active, setActive] = useState(false);
  return (
    <>
      <button onClick={() => setActive((value) => !value)}>Toggle</button>
      {children(active)}
    </>
  );
}

const rows = (...names: string[]): Rows => ({
  data: names.map((name, index) => ({ id: String(index + 1), name })),
});

it('matches scopes by whole leading segments in either direction', () => {
  expect(scopesOverlap('projects', 'projects/42')).toBe(true);
  expect(scopesOverlap('projects/42', 'projects')).toBe(true);
  expect(scopesOverlap('projects/42', 'projects/42')).toBe(true);
  expect(scopesOverlap('projects/42', 'projects/43')).toBe(false);
  expect(scopesOverlap('projects', 'projectsArchive')).toBe(false);
  expect(scopesOverlap('customers/7/contacts', 'customers/8/contacts')).toBe(
    false,
  );
  expect(scopesOverlap('', 'projects')).toBe(false);
});

it('reads an affected visible view again and leaves unaffected views alone', async () => {
  const reads: string[] = [];
  let version = 1;
  await renderWithApp(
    <>
      <View id='projects' path='projects' scopes={['projects']} />
      <View id='orders' path='orders' scopes={['orders']} />
    </>,
    {
      fetch: answerApi(({ path }) => {
        reads.push(path);
        return rows(`${path} v${version}`);
      }),
    },
  );
  await waitFor(() =>
    expect(screen.getByTestId('projects')).toHaveTextContent('projects v1'),
  );
  expect(screen.getByTestId('orders')).toHaveTextContent('orders v1');
  version = 2;
  await act(async () => {
    announceDataChange({ scopes: ['projects/1'] });
  });
  await waitFor(() =>
    expect(screen.getByTestId('projects')).toHaveTextContent('projects v2'),
  );
  expect(reads.filter((path) => path === 'projects')).toHaveLength(2);
  expect(reads.filter((path) => path === 'orders')).toHaveLength(1);
});

it('marks a covered view without reading and reads once when it is shown again', async () => {
  const reads: string[] = [];
  let version = 1;
  await renderWithApp(
    <Covered>
      {(active) => (
        <View id='list' path='projects' scopes={['projects']} active={active} />
      )}
    </Covered>,
    {
      fetch: answerApi(({ path }) => {
        reads.push(path);
        return rows(`v${version}`);
      }),
    },
  );
  await act(async () => {
    announceDataChange({ scopes: ['projects/1'] });
    announceDataChange({ scopes: ['projects/2'] });
  });
  expect(reads).toHaveLength(0);
  version = 2;
  await act(async () => {
    screen.getByRole('button', { name: 'Toggle' }).click();
  });
  await waitFor(() =>
    expect(screen.getByTestId('list')).toHaveTextContent('v2'),
  );
  expect(reads).toHaveLength(1);
});

it('shows a confirmed result at once and never lets an older slow read replace it', async () => {
  const slow = deferred<Item>();
  let reads = 0;
  await renderWithApp(
    <View id='detail' path='projects/1' scopes={['projects/1']} />,
    {
      fetch: answerApi(() => {
        reads += 1;
        return slow.promise;
      }),
    },
  );
  await act(async () => {
    announceDataChange({
      scopes: ['projects/1'],
      results: { 'projects/1': { data: { id: '1', name: 'First save' } } },
    });
  });
  expect(screen.getByTestId('detail')).toHaveTextContent('First save');
  await act(async () => {
    announceDataChange({
      scopes: ['projects/1'],
      results: { 'projects/1': { data: { id: '1', name: 'Second save' } } },
    });
  });
  await act(async () => {
    slow.resolve({ data: { id: '1', name: 'Stale read' } });
  });
  expect(screen.getByTestId('detail')).toHaveTextContent('Second save');
  expect(reads).toBe(1);
});

it('drops a verification read superseded by a later write', async () => {
  const first = deferred<Rows>();
  const second = deferred<Rows>();
  const queue = [
    Promise.resolve(rows('Initial')),
    first.promise,
    second.promise,
  ];
  await renderWithApp(
    <View id='list' path='projects' scopes={['projects']} />,
    {
      fetch: answerApi(() => queue.shift()!),
    },
  );
  await waitFor(() =>
    expect(screen.getByTestId('list')).toHaveTextContent('Initial'),
  );
  await act(async () => {
    announceDataChange({ scopes: ['projects/1'] });
  });
  await act(async () => {
    announceDataChange({ scopes: ['projects/2'] });
  });
  await act(async () => {
    second.resolve(rows('After both writes'));
  });
  await act(async () => {
    first.resolve(rows('After the first write'));
  });
  expect(screen.getByTestId('list')).toHaveTextContent('After both writes');
});

it('merges confirmed results before the verification read finishes', async () => {
  const verification = deferred<Rows>();
  let reads = 0;
  await renderWithApp(
    <View
      id='list'
      path='projects'
      scopes={['projects']}
      merge={(current, change) => {
        const value = change.results?.['projects/2'];
        return value === null
          ? { data: current.data.filter((row) => row.id !== '2') }
          : undefined;
      }}
    />,
    {
      fetch: answerApi(() =>
        ++reads === 1 ? rows('Alpha', 'Beta') : verification.promise,
      ),
    },
  );
  await waitFor(() =>
    expect(screen.getByTestId('list')).toHaveTextContent('Alpha,Beta'),
  );
  await act(async () => {
    announceDataChange({
      scopes: ['projects/2'],
      results: { 'projects/2': null },
    });
  });
  expect(screen.getByTestId('list')).toHaveTextContent(/^Alpha$/u);
  expect(reads).toBe(2);
  await act(async () => {
    verification.resolve(rows('Alpha', 'Gamma'));
  });
  expect(screen.getByTestId('list')).toHaveTextContent('Alpha,Gamma');
});

const removed = (id = '1'): DataChange => ({
  scopes: [`projects/${id}`],
  results: { [`projects/${id}`]: null },
});
const failure = (status: number) =>
  Response.json(
    { error: { status: 'TEST', reason: 'TEST', message: 'Failed' } },
    { status },
  );

it('drops a deleted record at once without reading it again', async () => {
  let reads = 0;
  await renderWithApp(
    <View id='detail' path='projects/1' scopes={['projects/1']} />,
    {
      fetch: answerApi(() => {
        reads += 1;
        return { data: { id: '1', name: 'Alpha' } };
      }),
    },
  );
  await waitFor(() =>
    expect(screen.getByTestId('detail')).toHaveTextContent('Alpha'),
  );
  await act(async () => {
    announceDataChange(removed());
  });
  expect(screen.getByTestId('detail')).toHaveTextContent('missing 404');
  expect(reads).toBe(1);
});

it('keeps a deleted record removed when a slower earlier read answers later', async () => {
  const slow = deferred<Item>();
  let reads = 0;
  await renderWithApp(
    <View id='detail' path='projects/1' scopes={['projects/1']} />,
    {
      fetch: answerApi(() =>
        ++reads === 1 ? { data: { id: '1', name: 'Alpha' } } : slow.promise,
      ),
    },
  );
  await waitFor(() =>
    expect(screen.getByTestId('detail')).toHaveTextContent('Alpha'),
  );
  // An unrelated broad change starts a read that is still running.
  await act(async () => {
    announceDataChange({ scopes: ['projects'] });
  });
  expect(reads).toBe(2);
  await act(async () => {
    announceDataChange(removed());
  });
  await act(async () => {
    slow.resolve({ data: { id: '1', name: 'Alpha before delete' } });
  });
  expect(screen.getByTestId('detail')).toHaveTextContent('missing 404');
  expect(screen.getByTestId('detail')).not.toHaveTextContent('Alpha');
});

it('replaces a failed refresh that kept old data with the removed state', async () => {
  let reads = 0;
  await renderWithApp(
    <View id='detail' path='projects/1' scopes={['projects/1']} />,
    {
      fetch: answerApi(() =>
        ++reads === 1 ? { data: { id: '1', name: 'Alpha' } } : failure(500),
      ),
    },
  );
  await waitFor(() =>
    expect(screen.getByTestId('detail')).toHaveTextContent('Alpha'),
  );
  await act(async () => {
    announceDataChange({ scopes: ['projects'] });
  });
  // A failed refresh keeps the previous data with its error.
  await waitFor(() =>
    expect(screen.getByTestId('detail')).toHaveTextContent('error 500'),
  );
  await act(async () => {
    announceDataChange(removed());
  });
  expect(screen.getByTestId('detail')).toHaveTextContent('missing 404');
  expect(screen.getByTestId('detail')).not.toHaveTextContent('Alpha');
  expect(reads).toBe(2);
});

it('drops a deleted record from a covered detail and confirms it once when shown', async () => {
  let deleted = false;
  let reads = 0;
  await renderWithApp(
    <Covered>
      {(active) => (
        <View
          id='detail'
          path='projects/1'
          scopes={['projects/1']}
          active={!active}
        />
      )}
    </Covered>,
    {
      fetch: answerApi(() => {
        reads += 1;
        return deleted ? failure(404) : { data: { id: '1', name: 'Alpha' } };
      }),
    },
  );
  await waitFor(() =>
    expect(screen.getByTestId('detail')).toHaveTextContent('Alpha'),
  );
  // Cover the detail, then delete its record.
  await act(async () => {
    screen.getByRole('button', { name: 'Toggle' }).click();
  });
  deleted = true;
  await act(async () => {
    announceDataChange(removed());
  });
  expect(screen.getByTestId('detail')).toHaveTextContent('missing 404');
  expect(reads).toBe(1);
  await act(async () => {
    screen.getByRole('button', { name: 'Toggle' }).click();
  });
  await waitFor(() => expect(reads).toBe(2));
  expect(screen.getByTestId('detail')).toHaveTextContent('missing 404');
});

it('accumulates merges announced together', async () => {
  const verification = deferred<Rows>();
  let reads = 0;
  await renderWithApp(
    <View
      id='list'
      path='projects'
      scopes={['projects']}
      merge={(current, change) => {
        const gone = Object.entries(change.results ?? {})
          .filter(([, value]) => value === null)
          .map(([scope]) => scope.split('/')[1]);
        return gone.length
          ? { data: current.data.filter((row) => !gone.includes(row.id)) }
          : undefined;
      }}
    />,
    {
      fetch: answerApi(() =>
        ++reads === 1 ? rows('Alpha', 'Beta', 'Gamma') : verification.promise,
      ),
    },
  );
  await waitFor(() =>
    expect(screen.getByTestId('list')).toHaveTextContent('Alpha,Beta,Gamma'),
  );
  await act(async () => {
    announceDataChange(removed('1'));
    announceDataChange(removed('2'));
  });
  expect(screen.getByTestId('list')).toHaveTextContent(/^Gamma$/u);
  expect(reads).toBe(2);
  await act(async () => {
    verification.resolve(rows('Gamma'));
  });
  expect(screen.getByTestId('list')).toHaveTextContent(/^Gamma$/u);
});

it('stops listening after unmounting', async () => {
  let reads = 0;
  const view = await renderWithApp(
    <View id='list' path='projects' scopes={['projects']} />,
    {
      fetch: answerApi(() => {
        reads += 1;
        return rows('Alpha');
      }),
    },
  );
  await waitFor(() => expect(reads).toBe(1));
  view.unmount();
  announceDataChange({ scopes: ['projects'] });
  expect(reads).toBe(1);
});
