import authorization from '@nocobase/app-plugin-authorization/client';
import { resolveLocalesContribution } from '@nocobase/i18n';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';

import demoMode from '../../client/index.js';
import { useDemoAccounts } from '../../client/accounts.js';
import { DemoModeMenu } from '../../client/menu.js';
import locales from '../../client/locales/index.js';
import type { DemoSignInAccount } from '../../shared/accounts.js';
import { renderDemo } from '../helpers/render-demo.js';

const authorizationLocales = await resolveLocalesContribution(
  authorization().locales!,
);
const namespaces = {
  '@nocobase/app-plugin-authorization': authorizationLocales,
};
const admin: DemoSignInAccount = {
  username: 'admin',
  name: 'Admin',
  current: true,
  role: 'root',
  roleTitles: [
    {
      key: 'permissionSets.builtIn.root',
      ns: '@nocobase/app-plugin-authorization',
      defaultValue: 'root',
    },
  ],
};

it('translates menu roles on language switches without fetching accounts again', async () => {
  let reads = 0;
  const rendered = await renderDemo(<DemoModeMenu />, {
    plugins: [demoMode()],
    namespaces,
    route: '/projects',
    fetch: async () => {
      reads++;
      return Response.json({ data: [admin] });
    },
  });
  await waitFor(() => expect(reads).toBe(1));
  fireEvent.click(screen.getByRole('button', { name: /Demo mode/u }));
  expect(await screen.findByText('System administrator')).toBeVisible();
  for (const [locale, label] of [
    ['zh-CN', '系统管理员'],
    ['ja-JP', 'システム管理者'],
    ['en-US', 'System administrator'],
  ]) {
    await act(() => rendered.app.runtime.i18n.changeLanguage(locale!));
    expect(await screen.findByText(label!)).toBeVisible();
  }
  expect(reads).toBe(1);
});

it('renders a pending account response in the current language after switching', async () => {
  const pending = Promise.withResolvers<Response>();
  let reads = 0;
  const rendered = await renderDemo(<DemoModeMenu />, {
    plugins: [demoMode()],
    namespaces,
    route: '/projects',
    fetch: async () => {
      reads++;
      return pending.promise;
    },
  });
  await waitFor(() => expect(reads).toBe(1));
  await act(() => rendered.app.runtime.i18n.changeLanguage('zh-CN'));
  fireEvent.click(screen.getByRole('button', { name: /演示模式/u }));
  await act(async () => pending.resolve(Response.json({ data: [admin] })));
  expect(await screen.findByText('系统管理员')).toBeVisible();
  expect(screen.queryByText('System administrator')).not.toBeInTheDocument();
  expect(reads).toBe(1);
});

it('shares raw accounts across standalone consumers and preserves dataset labels', async () => {
  function Roles() {
    const { accounts } = useDemoAccounts();
    return (
      <>
        {accounts?.map((account) => (
          <output key={account.username}>{account.role}</output>
        ))}
      </>
    );
  }
  let reads = 0;
  const rendered = await renderDemo(
    <>
      <Roles />
      <Roles />
    </>,
    {
      route: '/projects',
      namespaces: { ...namespaces, '@nocobase/app-plugin-demo-mode': locales },
      fetch: async () => {
        reads++;
        return Response.json({
          data: [
            {
              ...admin,
              roleTitles: [
                ...admin.roleTitles!,
                ...admin.roleTitles!,
                'Auditor',
              ],
            },
            {
              username: 'sales',
              name: 'Sales',
              current: false,
              role: 'Dataset role',
            },
          ],
        });
      },
    },
  );
  await waitFor(() =>
    expect(screen.getAllByText('System administrator, Auditor')).toHaveLength(
      2,
    ),
  );
  await act(() => rendered.app.runtime.i18n.changeLanguage('zh-CN'));
  expect(screen.getAllByText('系统管理员, Auditor')).toHaveLength(2);
  expect(screen.getAllByText('Dataset role')).toHaveLength(2);
  expect(reads).toBe(1);
});

it('uses the Permission Set key when its client translation is unavailable', async () => {
  function Role() {
    const { accounts } = useDemoAccounts();
    return <output>{accounts?.[0]?.role}</output>;
  }
  await renderDemo(<Role />, {
    route: '/projects',
    strictTranslations: false,
    fetch: async () => Response.json({ data: [admin] }),
  });
  expect(await screen.findByText('root')).toBeVisible();
});
