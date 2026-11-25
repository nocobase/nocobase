import { render, renderHook, screen } from '@testing-library/react';
import { createElement, useMemo, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { ClientApplicationContext } from '../src/application-context.js';
import type { ClientApplication } from '../src/application.js';
import { createAppClientConfig } from '../src/config.js';
import { useHasRoute, useHeaderActions } from '../src/hooks.js';
import {
  badgeCount,
  defineAppRoutes,
  defineClientPlugin,
  defineClientPlugins,
  defineHeaderActionOverrides,
  defineHeaderActions,
  resolveAppClientContributions,
  type AppClientBadge,
} from '../src/plugins.js';
import { defineAppRuntime, resolveAppRuntime } from '../src/runtime/index.js';

const Inbox = (): ReactElement => createElement('button', null, 'Inbox');
const Assistant = (): ReactElement =>
  createElement('button', null, 'Assistant');
const OtherInbox = (): ReactElement =>
  createElement('button', null, 'Other inbox');
const useUnread = (): AppClientBadge =>
  useMemo(() => ({ count: 3, tone: 'attention' }), []);

const inboxPlugin = defineClientPlugin({
  packageName: '@example/inbox',
  headerActions: [
    { name: 'inbox', order: 20, component: Inbox, badge: useUnread },
  ],
});

async function runtimeWith(
  options: Partial<Parameters<typeof defineAppRuntime>[0]> = {},
) {
  return resolveAppRuntime(
    defineAppRuntime({
      packageName: '@example/app',
      createAppConfig: createAppClientConfig,
      plugins: defineClientPlugins([inboxPlugin()]),
      ...options,
    }),
    { rawConfig: {} },
  );
}

describe('header actions', () => {
  it('uses the same trimmed name for registering and overriding an action', async () => {
    const runtime = await runtimeWith({
      headerActions: [
        { name: '  assistant  ', order: 10, component: Assistant },
      ],
      headerActionOverrides: [{ name: ' assistant ', order: 90 }],
    });
    expect(
      runtime.headerActions?.map(({ name, order }) => [name, order]),
    ).toEqual([
      ['inbox', 20],
      ['assistant', 90],
    ]);
  });

  it('orders the application and plugin actions by order, ties in registration order', async () => {
    const runtime = await runtimeWith({
      headerActions: [
        { name: 'assistant', order: 10, component: Assistant },
        { name: 'help', order: 20, component: Assistant, auth: 'optional' },
      ],
    });
    expect(
      runtime.headerActions?.map(({ name, order, auth, packageName }) => ({
        name,
        order,
        auth,
        packageName,
      })),
    ).toEqual([
      {
        name: 'assistant',
        order: 10,
        auth: 'required',
        packageName: '@example/app',
      },
      {
        name: 'help',
        order: 20,
        auth: 'optional',
        packageName: '@example/app',
      },
      {
        name: 'inbox',
        order: 20,
        auth: 'required',
        packageName: '@example/inbox',
      },
    ]);
    expect(runtime.headerActions?.[2]?.badge).toBe(useUnread);
  });

  it('lets the application hide or replace an action by name', async () => {
    const hidden = await runtimeWith({
      headerActionOverrides: [{ name: 'inbox', hidden: true }],
    });
    expect(hidden.headerActions).toEqual([]);

    const replaced = await runtimeWith({
      headerActions: [{ name: 'assistant', order: 10, component: Assistant }],
      headerActionOverrides: [
        {
          name: 'inbox',
          component: OtherInbox,
          order: 0,
          placement: 'beforeAccount',
        },
      ],
    });
    expect(replaced.headerActions?.map((action) => action.name)).toEqual([
      'inbox',
      'assistant',
    ]);
    expect(replaced.headerActions?.[0]).toMatchObject({
      component: OtherInbox,
      placement: 'beforeAccount',
      badge: useUnread,
      packageName: '@example/inbox',
    });
  });

  it('rejects duplicate names, overrides of missing actions and invalid declarations', async () => {
    await expect(
      runtimeWith({ headerActions: [{ name: 'inbox', component: Inbox }] }),
    ).rejects.toThrow(
      'Header action "inbox" from "@example/inbox" is already registered by "@example/app".',
    );
    await expect(
      runtimeWith({ headerActionOverrides: [{ name: 'mail', hidden: true }] }),
    ).rejects.toThrow(
      'Header action override references missing header action "mail".',
    );
    await expect(
      runtimeWith({
        headerActionOverrides: [
          { name: 'inbox', hidden: true },
          { name: 'inbox', order: 1 },
        ],
      }),
    ).rejects.toThrow('Header action "inbox" is overridden more than once.');
    expect(() =>
      defineHeaderActionOverrides([
        { name: 'inbox', hidden: true, component: Inbox } as never,
      ]),
    ).toThrow('cannot both hide the action and replace it');
    expect(() =>
      defineHeaderActions([{ name: 'bad name', component: Inbox }]),
    ).toThrow('contains unsupported characters');
    expect(() =>
      defineHeaderActions([{ name: 'inbox', component: undefined as never }]),
    ).toThrow('Header action "inbox" must define a component.');
    expect(() =>
      defineHeaderActions([
        { name: 'inbox', component: Inbox, badge: 3 as never },
      ]),
    ).toThrow('Header action "inbox" badge must be a hook function.');
  });

  it('gives a layout the runtime actions, only optional ones without badges to a signed-out visitor, and none outside an application', async () => {
    const runtime = await runtimeWith({
      headerActions: [
        {
          name: 'help',
          order: 5,
          component: Assistant,
          auth: 'optional',
          badge: useUnread,
        },
      ],
    });
    const Names = ({ signedIn }: { signedIn: boolean }): ReactElement =>
      createElement(
        'output',
        null,
        useHeaderActions({ signedIn })
          // `*` marks an action that keeps its badge.
          .map((action) => `${action.name}${action.badge ? '*' : ''}`)
          .join(',') || 'none',
      );
    const { unmount } = render(createElement(Names, { signedIn: true }));
    expect(screen.getByRole('status').textContent).toBe('none');
    unmount();
    const inApplication = (signedIn: boolean) =>
      createElement(
        ClientApplicationContext,
        { value: { runtime } as unknown as ClientApplication },
        createElement(Names, { signedIn }),
      );
    const { rerender } = render(inApplication(true));
    expect(screen.getByRole('status').textContent).toBe('help*,inbox*');
    rerender(inApplication(false));
    expect(screen.getByRole('status').textContent).toBe('help');
  });
});

describe('navigation badges', () => {
  it('keeps the badge hook a route declares and rejects one that is not a function', () => {
    const { routes } = resolveAppClientContributions([
      {
        packageName: '@example/app',
        source: 'application',
        routes: defineAppRoutes([
          {
            name: 'inbox',
            path: '/inbox',
            navigation: { title: 'Inbox', badge: useUnread },
            componentLoader: () => Promise.resolve({ default: Inbox }),
          },
        ]),
      },
    ]);
    expect(routes[0]?.navigation?.badge).toBe(useUnread);
    expect(() =>
      resolveAppClientContributions([
        {
          packageName: '@example/app',
          source: 'application',
          routes: defineAppRoutes([
            {
              name: 'inbox',
              path: '/inbox',
              navigation: { title: 'Inbox', badge: 5 as never },
              componentLoader: () => Promise.resolve({ default: Inbox }),
            },
          ]),
        },
      ]),
    ).toThrow('navigation badge must be a hook function');
  });

  it('shows a positive whole count and nothing for zero or none', () => {
    expect(badgeCount({ count: 4 })).toBe(4);
    expect(badgeCount({ count: 2.6, tone: 'attention' })).toBe(2);
    expect(badgeCount({ count: 0 })).toBe(0);
    expect(badgeCount({ count: -1 })).toBe(0);
    expect(badgeCount({ count: Number.NaN })).toBe(0);
    expect(badgeCount(undefined)).toBe(0);
  });
});

it('checks for a retained page by ID while ignoring excluded and group routes', async () => {
  const componentLoader = async () => ({ default: Assistant });
  const runtime = await runtimeWith({
    routes: defineAppRoutes([
      {
        name: 'group',
        navigation: { title: 'Group' },
        children: [
          {
            name: 'included',
            path: '/included',
            authz: 'skip',
            componentLoader,
          },
          { name: 'removed', path: '/removed', authz: 'skip', componentLoader },
        ],
      },
    ]),
    excludedRouteIds: ['@example/app:removed'],
  });
  const app = { runtime } as unknown as ClientApplication;
  const { result } = renderHook(
    () => [
      useHasRoute('@example/app:included'),
      useHasRoute('@example/app:removed'),
      useHasRoute('@example/app:group'),
      useHasRoute('@example/app:missing'),
    ],
    {
      wrapper: ({ children }) => (
        <ClientApplicationContext value={app}>
          {children}
        </ClientApplicationContext>
      ),
    },
  );
  expect(result.current).toEqual([true, false, false, false]);
});
