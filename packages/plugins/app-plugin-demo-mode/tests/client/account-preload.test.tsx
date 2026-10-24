import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import demoMode from '../../client/index.js';
import { DemoAccountMenu } from '../../client/account-menu.js';
import { useDemoAccounts } from '../../client/accounts.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../client/components/ui/dropdown-menu.js';

const ann = { username: 'ann', name: 'Ann', role: 'Admin', current: true };
const bob = { username: 'bob', name: 'Bob', role: 'Reviewer', current: false };
const options = {
  accountSwitcher: 'menu',
  showFloatingAccountSwitcher: false,
} as const;

afterEach(() => vi.useRealTimers());

function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Open account menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DemoAccountMenu />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

it('preloads before the account menu opens and shows its submenu on hover without another request or delay', async () => {
  let reads = 0;
  let complete!: (value: unknown) => void;
  const pending = new Promise((resolve) => {
    complete = resolve;
  });
  await renderWithApp(<AccountMenu />, {
    plugins: [demoMode(options)],
    route: '/projects',
    fetch: answerApi((call) => {
      if (call.path === 'demoMode/status') return { data: { enabled: true } };
      if (call.path === 'demoMode/accounts') {
        reads++;
        return pending;
      }
      return new Response(null, { status: 404 });
    }),
  });
  await waitFor(() => expect(reads).toBe(1));
  expect(
    screen.queryByRole('menuitem', { name: 'Account: Ann' }),
  ).not.toBeInTheDocument();
  await act(async () => complete({ data: [ann, bob] }));
  fireEvent.click(screen.getByRole('button', { name: 'Open account menu' }));
  const trigger = screen.getByRole('menuitem', { name: 'Account: Ann' });
  vi.useFakeTimers();
  fireEvent.mouseEnter(trigger);
  fireEvent.mouseMove(trigger);
  await act(async () => vi.advanceTimersByTimeAsync(0));
  expect(screen.getByRole('menuitemradio', { name: /Bob/u })).toBeVisible();
  expect(reads).toBe(1);
});

function AccountList({ refreshable = false }: { refreshable?: boolean }) {
  const [revision, setRevision] = useState(0);
  const { accounts } = useDemoAccounts(revision);
  return (
    <>
      <p>
        {accounts?.map((account) => account.name).join(', ') ??
          'Loading accounts'}
      </p>
      {refreshable ? (
        <button onClick={() => setRevision((value) => value + 1)}>
          Data changed
        </button>
      ) : null}
    </>
  );
}

it('shares pending loads and refreshes every consumer after a data change during preloading', async () => {
  let reads = 0;
  let complete!: (value: unknown) => void;
  const pending = new Promise((resolve) => {
    complete = resolve;
  });
  await renderWithApp(
    <>
      <AccountList refreshable />
      <AccountList />
    </>,
    {
      plugins: [demoMode(options)],
      route: '/projects',
      fetch: answerApi((call) => {
        if (call.path === 'demoMode/status') return { data: { enabled: true } };
        if (call.path === 'demoMode/accounts')
          return ++reads === 1 ? pending : { data: [bob] };
        return new Response(null, { status: 404 });
      }),
    },
  );
  await waitFor(() => expect(reads).toBe(1));
  fireEvent.click(screen.getByRole('button', { name: 'Data changed' }));
  await act(async () => complete({ data: [ann] }));
  await waitFor(() => expect(screen.getAllByText('Bob')).toHaveLength(2));
  expect(screen.queryByText('Ann')).not.toBeInTheDocument();
  expect(reads).toBe(2);
});

it('keeps loaded accounts visible if a background refresh fails', async () => {
  let reads = 0;
  await renderWithApp(<AccountList refreshable />, {
    plugins: [demoMode(options)],
    route: '/projects',
    fetch: answerApi((call) => {
      if (call.path === 'demoMode/status') return { data: { enabled: true } };
      if (call.path === 'demoMode/accounts')
        return ++reads === 1
          ? { data: [ann] }
          : new Response(null, { status: 503 });
      return new Response(null, { status: 404 });
    }),
  });
  expect(await screen.findByText('Ann')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Data changed' }));
  await waitFor(() => expect(reads).toBe(2));
  expect(screen.getByText('Ann')).toBeVisible();
});
