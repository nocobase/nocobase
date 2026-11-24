import {
  ClientApplicationContext,
  type AppClientBadge,
  type AppClientRegisteredHeaderAction,
  type ClientApplication,
} from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { MemoryRouter } from 'react-router';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  HeaderActionBar,
  HeaderActions,
} from '../../client/layouts/components/header-actions.js';
import enUS from '../../client/locales/en-US.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { routeKey } from '../../client/routing/route-navigation.js';

const authentication = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
}));

vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: authentication.session }),
}));

vi.mock('../../client/layouts/components/user-menu.js', () => ({
  UserMenu: () => <button type='button'>Account</button>,
}));

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/header-actions-test', resources: enUS },
  strict: false,
});

function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

/** A badge store a test changes while the bar is mounted, as a hook with its own data would. */
function badgeStore(initial: AppClientBadge | undefined) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    set(next: AppClientBadge | undefined) {
      value = next;
      for (const listener of listeners) listener();
    },
    useBadge: () =>
      useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => value,
      ),
  };
}

function action(
  name: string,
  badge?: () => AppClientBadge | undefined,
  component: ComponentType = () => <button type='button'>{name}</button>,
): AppClientRegisteredHeaderAction {
  return {
    name,
    order: 0,
    auth: 'required',
    packageName: '@example/plugin',
    source: 'plugin',
    component,
    ...(badge ? { badge } : {}),
  };
}

/** An action whose component renders nothing, as one the viewer cannot use does. */
const nothing = (name: string, badge?: () => AppClientBadge | undefined) =>
  action(name, badge, () => null);

function setWidth(width: number) {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('matchMedia', () => ({
    matches: width < 768,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

afterEach(() => vi.unstubAllGlobals());

const slotOf = (name: string) =>
  screen.getByRole('button', { name }).closest('[data-header-action]')!;

describe('header actions', () => {
  it('renders the actions in the given order before the account menu, with their badges', async () => {
    setWidth(1440);
    const inbox = badgeStore({ count: 4, tone: 'attention' });
    render(
      <HeaderActionBar
        actions={[
          action('assistant'),
          action('inbox', inbox.useBadge),
          action('hidden', () => undefined),
        ]}
      >
        <button type='button'>Account</button>
      </HeaderActionBar>,
      { wrapper: I18n },
    );
    const bar = screen.getByTestId('header-actions');
    expect(
      within(bar)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['assistant', 'inbox', 'hidden', 'Account']);
    const badge = slotOf('inbox').querySelector(
      '[data-slot="header-action-badge"]',
    );
    expect(badge).toHaveTextContent('4');
    expect(badge).toHaveAttribute('data-tone', 'attention');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(
      slotOf('hidden').querySelector('[data-slot="header-action-badge"]'),
    ).toBeNull();

    act(() => inbox.set({ count: 0 }));
    expect(
      slotOf('inbox').querySelector('[data-slot="header-action-badge"]'),
    ).toBeNull();
    act(() => inbox.set({ count: 120 }));
    expect(
      slotOf('inbox').querySelector('[data-slot="header-action-badge"]'),
    ).toHaveTextContent('99+');
  });

  it('keeps the first action on a phone and moves the rest into More, which carries their counts', async () => {
    setWidth(390);
    const user = userEvent.setup();
    const mail = badgeStore({ count: 2 });
    render(
      <HeaderActionBar
        actions={[
          action('assistant'),
          action('inbox', () => ({ count: 3, tone: 'attention' })),
          action('mail', mail.useBadge),
        ]}
      />,
      { wrapper: I18n },
    );
    expect(screen.getByRole('button', { name: 'assistant' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^inbox/ })).toBeNull();
    const more = screen.getByRole('button', { name: 'More actions' });
    const moreBadge = more.querySelector('[data-slot="header-action-badge"]');
    expect(moreBadge).toHaveTextContent('5');
    expect(moreBadge).toHaveAttribute('data-tone', 'attention');

    await user.click(more);
    const popup = await screen.findByRole('dialog', { name: 'More actions' });
    expect(
      within(popup)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['inbox', 'mail']);
    act(() => mail.set(undefined));
    expect(moreBadge).toHaveTextContent('3');
  });

  it('folds by the actions that render something, never showing an empty More or the badge of a hidden action', () => {
    setWidth(390);
    const { unmount } = render(
      <HeaderActionBar
        actions={[
          action('assistant'),
          nothing('inbox', () => ({ count: 3 })),
          nothing('mail', () => ({ count: 2, tone: 'attention' })),
        ]}
      >
        <button type='button'>Account</button>
      </HeaderActionBar>,
      { wrapper: I18n },
    );
    const bar = screen.getByTestId('header-actions');
    expect(
      within(bar)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['assistant', 'Account']);
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
    expect(bar.querySelector('[data-slot="header-action-badge"]')).toBeNull();
    expect(bar.querySelector('[data-header-action="inbox"]')).toBeNull();
    unmount();

    render(
      <HeaderActionBar
        actions={[
          nothing('assistant'),
          action('inbox', () => ({ count: 3 })),
          action('mail'),
        ]}
      />,
      { wrapper: I18n },
    );
    expect(screen.getByRole('button', { name: 'inbox' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'mail' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
    expect(
      slotOf('inbox').querySelector('[data-slot="header-action-badge"]'),
    ).toHaveTextContent('3');
  });

  it('places an action once it renders, without mounting it again as it moves into More', async () => {
    setWidth(390);
    const user = userEvent.setup();
    let mounts = 0;
    let reveal = () => {};
    function Later() {
      const [ready, setReady] = useState(false);
      useEffect(() => {
        mounts += 1;
        reveal = () => setReady(true);
      }, []);
      return ready ? <button type='button'>later</button> : null;
    }
    render(
      <HeaderActionBar
        actions={[
          action('assistant'),
          action('inbox'),
          action('later', undefined, Later),
        ]}
      />,
      { wrapper: I18n },
    );
    expect(screen.getByRole('button', { name: 'inbox' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
    act(() => reveal());
    await user.click(
      await screen.findByRole('button', { name: 'More actions' }),
    );
    const popup = await screen.findByRole('dialog', { name: 'More actions' });
    expect(
      within(popup)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['inbox', 'later']);
    expect(mounts).toBe(1);
  });

  it('hands focus to More when the focused action moves into it', async () => {
    setWidth(390);
    let reveal = () => {};
    function Later() {
      const [ready, setReady] = useState(false);
      useEffect(() => {
        reveal = () => setReady(true);
      }, []);
      return ready ? <button type='button'>later</button> : null;
    }
    render(
      <HeaderActionBar
        actions={[
          action('assistant'),
          action('inbox'),
          action('later', undefined, Later),
        ]}
      />,
      { wrapper: I18n },
    );
    screen.getByRole('button', { name: 'inbox' }).focus();
    expect(screen.getByRole('button', { name: 'inbox' })).toHaveFocus();
    act(() => reveal());
    // The bar learns that the action renders from a mutation observer, so the move lands after the reveal.
    const more = await screen.findByRole('button', { name: 'More actions' });
    expect(more).toHaveFocus();
  });

  it('leaves focus alone when an action that does not hold it moves into More', async () => {
    setWidth(390);
    let reveal = () => {};
    function Later() {
      const [ready, setReady] = useState(false);
      useEffect(() => {
        reveal = () => setReady(true);
      }, []);
      return ready ? <button type='button'>later</button> : null;
    }
    render(
      <HeaderActionBar
        actions={[
          action('assistant'),
          action('inbox'),
          action('later', undefined, Later),
        ]}
      />,
      { wrapper: I18n },
    );
    screen.getByRole('button', { name: 'assistant' }).focus();
    act(() => reveal());
    await screen.findByRole('button', { name: 'More actions' });
    expect(screen.getByRole('button', { name: 'assistant' })).toHaveFocus();
  });

  it('shows two actions on a phone without a More button', () => {
    setWidth(390);
    render(
      <HeaderActionBar actions={[action('assistant'), action('inbox')]} />,
      {
        wrapper: I18n,
      },
    );
    expect(screen.getByRole('button', { name: 'inbox' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
  });
});

describe('signed-in state', () => {
  afterEach(() => {
    authentication.session = null;
  });

  function renderHeader() {
    const requiredBadge = vi.fn(() => ({ count: 4 }));
    const optionalBadge = vi.fn(() => ({ count: 1 }));
    const app = {
      runtime: {
        headerActions: [
          action('inbox', requiredBadge),
          { ...action('help', optionalBadge), auth: 'optional' as const },
        ],
      },
    } as unknown as ClientApplication;
    render(
      <ClientApplicationContext value={app}>
        <HeaderActions />
      </ClientApplicationContext>,
      { wrapper: I18n },
    );
    return { requiredBadge, optionalBadge };
  }

  it('shows a signed-out visitor only the optional actions, calling no badge hook', () => {
    setWidth(1440);
    const { requiredBadge, optionalBadge } = renderHeader();
    expect(screen.getByRole('button', { name: 'help' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'inbox' })).toBeNull();
    expect(requiredBadge).not.toHaveBeenCalled();
    expect(optionalBadge).not.toHaveBeenCalled();
    expect(
      screen
        .getByTestId('header-actions')
        .querySelector('[data-slot="header-action-badge"]'),
    ).toBeNull();
    expect(screen.getByRole('button', { name: 'Account' })).toBeVisible();
  });

  it('keeps route shortcuts and their badge hooks hidden while permissions are pending or denied', () => {
    setWidth(1440);
    authentication.session = { user: { id: '1' } };
    const componentLoader = async () => ({ default: () => null });
    const child: AppClientRegisteredRoute = {
      id: '@example/plugin:child',
      name: 'child',
      packageName: '@example/plugin',
      source: 'plugin',
      path: '/parent/child',
      auth: 'required',
      authz: 'skip',
      componentLoader,
    };
    const parent: AppClientRegisteredRoute = {
      ...child,
      id: '@example/plugin:parent',
      name: 'parent',
      path: '/parent',
      authz: 'unrestricted',
      children: [child],
    };
    const routes = [parent];
    const badge = vi.fn(() => ({ count: 4 }));
    const app = {
      runtime: {
        headerActions: [
          { ...action('shortcut', badge), routeId: child.id },
          action('help'),
        ],
      },
    } as unknown as ClientApplication;
    const header = (loading: boolean, denied: ReadonlySet<string>) => (
      <MemoryRouter>
        <ClientApplicationContext value={app}>
          <RouteTreeProvider routes={routes} access={{ loading, denied }}>
            <HeaderActions />
          </RouteTreeProvider>
        </ClientApplicationContext>
      </MemoryRouter>
    );
    const { rerender } = render(header(true, new Set()), { wrapper: I18n });
    expect(screen.getByRole('button', { name: 'help' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'shortcut' })).toBeNull();
    expect(badge).not.toHaveBeenCalled();

    rerender(header(false, new Set([routeKey(parent)])));
    expect(screen.queryByRole('button', { name: 'shortcut' })).toBeNull();
    expect(badge).not.toHaveBeenCalled();

    rerender(header(false, new Set()));
    expect(screen.getByRole('button', { name: 'shortcut' })).toBeVisible();
    expect(
      slotOf('shortcut').querySelector('[data-slot="header-action-badge"]'),
    ).toHaveTextContent('4');

    rerender(header(false, new Set([routeKey(child)])));
    expect(screen.queryByRole('button', { name: 'shortcut' })).toBeNull();
  });

  it('shows a signed-in person every action with its badge', () => {
    setWidth(1440);
    authentication.session = { user: { id: '1' } };
    const { requiredBadge, optionalBadge } = renderHeader();
    expect(
      within(screen.getByTestId('header-actions'))
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['inbox', 'help', 'Account']);
    expect(requiredBadge).toHaveBeenCalled();
    expect(optionalBadge).toHaveBeenCalled();
    expect(
      slotOf('inbox').querySelector('[data-slot="header-action-badge"]'),
    ).toHaveTextContent('4');
  });
});

it('registers no header action of its own, so the header shows only the account menu', async () => {
  const { headerActions, headerActionOverrides } =
    await import('../../client/header-actions.js');
  expect(headerActions).toEqual([]);
  expect(headerActionOverrides).toEqual([]);
});
