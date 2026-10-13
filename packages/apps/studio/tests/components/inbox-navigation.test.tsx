import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { InboxIcon } from 'lucide-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import { SidebarProvider } from '../../client/components/ui/sidebar.js';
import { NavigationMenu } from '../../client/layouts/components/navigation-menu.js';
import { useInboxNavigation } from '../../client/inbox/navigation.js';
import {
  routeKey,
  type RouteNavigationItem,
} from '../../client/routing/route-navigation.js';

const state = {
  decision: 0 as number | undefined,
  unread: 0,
  plans: 0,
  chime: true,
};
const play = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock('../../client/inbox/hooks.js', () => ({
  useInboxRefresh: () => refresh(),
  usePendingDecisions: () => ({ data: { decision: state.decision } }),
  useUnreadCount: () => ({ data: state.unread }),
}));
vi.mock('../../client/inbox/use-registry.js', () => ({
  usePendingFeeds: () => [{ items: Array.from({ length: state.plans }) }],
}));
vi.mock('../../client/inbox/chime.js', () => ({
  armInboxChime: () => undefined,
  playInboxChime: play,
  useInboxChime: () => ({ enabled: state.chime }),
}));

const item: RouteNavigationItem = {
  route: {
    id: 'inbox',
    name: 'inbox',
    path: '/inbox',
    auth: 'required',
    authz: 'skip',
    packageName: 'studio',
    source: 'application',
    navigation: { title: 'navigation.inbox', icon: InboxIcon },
    componentLoader: async () => ({ default: () => null }),
  },
  children: [],
};

function Shell({
  collapsed = false,
  settings = false,
}: {
  collapsed?: boolean;
  settings?: boolean;
}) {
  const inbox = useInboxNavigation();
  return (
    <SidebarProvider open={!collapsed} onOpenChange={() => {}}>
      {settings ? (
        <h1>Settings</h1>
      ) : (
        <NavigationMenu
          items={[item]}
          label='Navigation'
          selectedKey={routeKey(item.route)}
          decorations={{ inbox }}
        />
      )}
    </SidebarProvider>
  );
}

async function setup(props = {}, locale = 'en-US') {
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'studio', resources: locales },
    locale,
  });
  const tree = (options: { collapsed?: boolean; settings?: boolean }) => (
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <MemoryRouter>
        <Shell {...options} />
      </MemoryRouter>
    </TestI18nProvider>
  );
  const view = render(tree(props));
  return {
    ...view,
    update: (options: { collapsed?: boolean; settings?: boolean }) =>
      view.rerender(tree(options)),
    runtime,
  };
}

describe('inbox navigation', () => {
  beforeEach(() => {
    Object.assign(state, { decision: 0, unread: 0, plans: 0, chime: true });
    play.mockClear();
    refresh.mockClear();
    document.title = 'Studio';
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('links to the inbox, marks it current and hides zero counts', async () => {
    await setup();
    const link = screen.getByRole('link', { name: 'Inbox' });
    expect(link).toHaveAttribute('href', '/inbox');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByTestId('studio-inbox-badge')).toBeNull();
    expect(document.title).toBe('Studio');
  });

  it.each([
    [3, 5, 2, '5', 'decisions', 'Inbox, 5 waiting'],
    [120, 5, 0, '99+', 'decisions', 'Inbox, 120 waiting'],
    [0, 2, 0, '2', 'unread', 'Inbox, 2 unread'],
    [0, 250, 0, '99+', 'unread', 'Inbox, 250 unread'],
  ])(
    'counts decisions %s, unread %s and plans %s',
    async (decision, unread, plans, text, kind, label) => {
      Object.assign(state, { decision, unread, plans });
      await setup();
      expect(screen.getByRole('link', { name: label })).toBeVisible();
      expect(screen.getByTestId('studio-inbox-badge')).toHaveTextContent(text);
      expect(screen.getByTestId('studio-inbox-badge')).toHaveAttribute(
        'data-kind',
        kind,
      );
      expect(document.title).toBe(`(${text}) Studio`);
      expect(play).not.toHaveBeenCalled();
    },
  );

  it('keeps reminders alive across collapse and settings, ringing only for increases', async () => {
    state.decision = 1;
    const view = await setup();
    view.update({ collapsed: true });
    expect(screen.getByTestId('studio-inbox-badge')).toHaveTextContent('1');
    expect(play).not.toHaveBeenCalled();
    state.decision = 2;
    view.update({ settings: true });
    expect(document.title).toBe('(2) Studio');
    expect(play).toHaveBeenCalledTimes(1);
    view.update({});
    expect(play).toHaveBeenCalledTimes(1);
    state.plans = 1;
    view.update({ settings: true });
    expect(document.title).toBe('(3) Studio');
    expect(play).toHaveBeenCalledTimes(2);
    view.update({ collapsed: true });
    expect(play).toHaveBeenCalledTimes(2);
    state.plans = 0;
    state.decision = 0;
    state.unread = 4;
    view.update({});
    expect(document.title).toBe('(4) Studio');
    state.unread = 0;
    view.update({});
    expect(screen.queryByTestId('studio-inbox-badge')).toBeNull();
    state.chime = false;
    state.decision = 3;
    view.update({});
    expect(play).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(document.title).toBe('Studio');
  });

  it('does not chime on initial loading and translates the full count without remounting', async () => {
    state.decision = undefined;
    const view = await setup();
    state.decision = 120;
    view.update({ collapsed: true });
    expect(play).not.toHaveBeenCalled();
    await act(() => view.runtime.changeLanguage('zh-CN'));
    expect(
      screen.getByRole('link', { name: '收件箱，120 项待处理' }),
    ).toBeVisible();
    expect(screen.getByTestId('studio-inbox-badge')).toHaveTextContent('99+');
  });
});
