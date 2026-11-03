import { useState, type ReactElement } from 'react';
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { realtimeClientToken } from '@nocobase/app-client';
import plugin from '../../client/index.js';
import InboxPage from '../../client/pages/business/inbox.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('never carries cached inbox messages into a new authenticated route identity', async () => {
  let account = 'alice';
  let switchAccount: (value: string) => void = () => {};
  let release: () => void = () => {};
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  function Accounts(): ReactElement {
    const [identity, setIdentity] = useState('alice');
    switchAccount = (value) => {
      account = value;
      setIdentity(value);
    };
    return <InboxPage key={identity} />;
  }
  await renderWithApp(<Accounts />, {
    plugins: [plugin()],
    namespace: '@nocobase/app-plugin-realtime-example',
    services(app) {
      vi.spyOn(
        app.container.resolve(realtimeClientToken),
        'watch',
      ).mockImplementation(() => ({ state: 'ready', retry() {}, close() {} }));
    },
    fetch: answerApi(async () => {
      const owner = account;
      if (owner === 'bob') await waiting;
      return {
        data: [
          {
            id: owner,
            title: `${owner} private task`,
            body: 'Private notification',
            createdAt: '2026-10-18T12:00:00Z',
          },
        ],
        meta: {},
      };
    }),
  });
  await screen.findByText('alice private task');
  await act(async () => {
    switchAccount('bob');
  });
  expect(screen.queryByText('alice private task')).not.toBeInTheDocument();
  expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  await act(async () => {
    release();
  });
  await screen.findByText('bob private task');
  expect(screen.queryByText('alice private task')).not.toBeInTheDocument();
});
