import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { expect, it } from 'vitest';

import demoMode from '../../client/index.js';
import { DemoModeMenu } from '@nocobase/app-plugin-demo-mode/client/menu';

const ann = { username: 'ann', name: 'Ann', role: 'Admin', current: true };
const bob = { username: 'bob', name: 'Bob', role: 'Reviewer', current: false };

function Header() {
  return (
    <>
      <header>
        <DemoModeMenu />
        <button>Appearance</button>
        <button>Account</button>
      </header>
      <main>Application content</main>
    </>
  );
}

function api({
  enabled = true,
  accounts = [ann, bob],
  signIn = () => ({ data: bob }),
}: {
  enabled?: boolean;
  accounts?: object[];
  signIn?: (username: string) => unknown;
} = {}) {
  return answerApi((call) => {
    if (call.method === 'GET' && call.path === 'demoMode/status')
      return { data: { enabled } };
    if (call.method === 'GET' && call.path === 'demoMode/accounts')
      return { data: accounts };
    const match = /^demoMode\/accounts\/([^/]+)\/signIn$/u.exec(call.path);
    if (call.method === 'POST' && match)
      return signIn(decodeURIComponent(match[1]!));
    return new Response(null, { status: 404 });
  });
}

it('shows the demo notice and checked account together in a standalone header menu', async () => {
  const signIns: string[] = [];
  await renderWithApp(<Header />, {
    plugins: [demoMode()],
    route: '/projects?state=open#today',
    locale: 'zh-CN',
    fetch: api({
      signIn: (username) => {
        signIns.push(username);
        return { data: bob };
      },
    }),
  });
  const header = screen.getByRole('banner');
  const trigger = await within(header).findByRole('button', {
    name: '演示模式 · 切换账户',
  });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(3);
  fireEvent.click(trigger);
  const menu = await screen.findByRole('menu', { name: '演示模式 · 切换账户' });
  expect(within(menu).getByText('这是演示环境')).toBeVisible();
  expect(menu).toHaveAccessibleDescription(
    '数据每天自动重置，修改不会保存。 可以直接切换到下面的账户，看看不同角色看到的内容。',
  );
  const current = within(menu).getByRole('menuitemradio', { name: /Ann/u });
  expect(current).toHaveAttribute('aria-checked', 'true');
  expect(within(current).getByText('Admin')).toBeVisible();
  fireEvent.click(current);
  expect(signIns).toEqual([]);
  fireEvent.click(within(menu).getByRole('menuitemradio', { name: /Bob/u }));
  await waitFor(() => expect(signIns).toEqual(['bob']));
});

it('prevents repeated switches while pending and lets a failed switch be retried', async () => {
  const pending = Promise.withResolvers<Response>();
  const signIns: string[] = [];
  const rendered = await renderWithApp(<Header />, {
    plugins: [demoMode()],
    route: '/projects',
    fetch: api({
      signIn: (username) => {
        signIns.push(username);
        return pending.promise;
      },
    }),
  });
  fireEvent.click(
    await screen.findByRole('button', { name: /Switch account/u }),
  );
  const bobItem = await screen.findByRole('menuitemradio', { name: /Bob/u });
  fireEvent.click(bobItem);
  await waitFor(() => expect(signIns).toEqual(['bob']));
  expect(bobItem).toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('status')).toHaveTextContent('Entering…');
  fireEvent.click(bobItem);
  fireEvent.click(screen.getByRole('menuitemradio', { name: /Ann/u }));
  expect(signIns).toEqual(['bob']);
  await act(async () => pending.resolve(new Response(null, { status: 503 })));
  await waitFor(() =>
    expect(rendered.toasts()).toMatchObject([
      { type: 'error', title: 'Could not enter this account.' },
    ]),
  );
  expect(bobItem).not.toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('menuitemradio', { name: /Ann/u })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  fireEvent.click(bobItem);
  await waitFor(() => expect(signIns).toEqual(['bob', 'bob']));
});

it('keeps the environment notice available when quick sign-in offers no accounts', async () => {
  await renderWithApp(<Header />, {
    plugins: [demoMode()],
    route: '/projects',
    fetch: api({ accounts: [] }),
  });
  fireEvent.click(await screen.findByRole('button', { name: 'Demo mode' }));
  expect(
    await screen.findByText('No accounts can be entered right now.'),
  ).toBeVisible();
  expect(screen.getByText('This is a demo environment')).toBeVisible();
  expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument();
});

it('offers the same header entry to signed-out visitors', async () => {
  await renderWithApp(<Header />, {
    plugins: [demoMode()],
    route: '/sign-in',
    fetch: api({ accounts: [{ ...ann, current: false }, bob] }),
  });
  fireEvent.click(
    await screen.findByRole('button', { name: /Switch account/u }),
  );
  expect(
    await screen.findByRole('menuitemradio', { name: /Ann/u }),
  ).toHaveAttribute('aria-checked', 'false');
  expect(screen.getByRole('menuitemradio', { name: /Bob/u })).toHaveAttribute(
    'aria-checked',
    'false',
  );
});

it('hides the header entry outside Demo Mode', async () => {
  await renderWithApp(<Header />, {
    plugins: [demoMode()],
    route: '/projects',
    fetch: api({ enabled: false }),
  });
  expect(screen.getByText('Application content')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: /Demo mode/u }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(2);
});

it('leaves entry placement to the application when the plugin is registered', async () => {
  const paths: string[] = [];
  await renderWithApp(<p>Application content</p>, {
    plugins: [demoMode()],
    route: '/projects',
    fetch: answerApi((call) => {
      paths.push(call.path);
      if (call.path === 'demoMode/status') return { data: { enabled: true } };
      if (call.path === 'demoMode/accounts') return { data: [ann, bob] };
      return new Response(null, { status: 404 });
    }),
  });
  await waitFor(() => expect(paths).toContain('demoMode/accounts'));
  expect(screen.getByText('Application content')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
