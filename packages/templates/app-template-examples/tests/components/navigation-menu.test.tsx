import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  routeKey,
  type RouteNavigationItem,
} from '../../client/routing/route-navigation.js';
import {
  AppSidebar,
  AppSidebarProvider,
  AppSidebarToggle,
} from '../../client/layouts/components/app-sidebar.js';
import { NavigationMenu } from '../../client/layouts/components/navigation-menu.js';

// Navigation titles are route data, not keys any namespace owns: the menu translates each through its package's
// namespace with the title itself as `defaultValue`, so the runtime is not strict.
const runtime = await createTestI18nRuntime({ strict: false });

function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

const preferenceKey = 'nocobase:sidebar:collapsed';

function setCollapsed(collapsed: boolean) {
  localStorage.setItem(preferenceKey, String(collapsed));
  window.dispatchEvent(new Event('nocobase:sidebar-preference-change'));
}

function page(name: string): AppClientRegisteredRoute {
  return {
    name,
    id: name,
    path: `/${name}`,
    auth: 'required',
    packageName: 'test',
    source: 'application',
    navigation: { title: name },
    componentLoader: async () => ({ default: () => null }),
  };
}

const child = page('child');
const sibling = page('sibling');

function shell(items: readonly RouteNavigationItem[], selectedKey?: string) {
  return (
    <MemoryRouter>
      <AppSidebarProvider>
        <AppSidebar label='Navigation'>
          <NavigationMenu
            items={items}
            label='Menu'
            selectedKey={selectedKey}
          />
        </AppSidebar>
        <AppSidebarToggle />
      </AppSidebarProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe.each([
  { title: 'navigation group', clickable: false },
  { title: 'clickable parent', clickable: true },
])('$title', ({ clickable }) => {
  const item: RouteNavigationItem = {
    route: {
      ...page('Group'),
      componentLoader: clickable ? page('Group').componentLoader : undefined,
    },
    children: [
      { route: child, children: [] },
      { route: sibling, children: [] },
    ],
  };
  const tree = (selectedKey: string | undefined) => shell([item], selectedKey);
  function toggle() {
    return screen.getByRole('button', { name: 'Group' });
  }
  function expectExpanded(expanded: boolean) {
    expect(toggle()).toHaveAttribute('aria-expanded', String(expanded));
  }

  it('keeps an active group open when navigating to another group', () => {
    const { rerender } = render(tree(routeKey(child)), { wrapper: I18n });
    expectExpanded(true);
    rerender(tree('elsewhere'));
    expectExpanded(true);
  });

  it('preserves a manually expanded group across navigation', async () => {
    const user = userEvent.setup();
    const { rerender } = render(tree('elsewhere'), { wrapper: I18n });
    await user.click(toggle());
    expectExpanded(true);
    rerender(tree('another-page'));
    expectExpanded(true);
    rerender(tree(routeKey(child)));
    rerender(tree('elsewhere'));
    expectExpanded(true);
  });

  it('preserves manual collapse until navigating into the group', async () => {
    const user = userEvent.setup();
    const { rerender } = render(tree(routeKey(child)), { wrapper: I18n });
    await user.click(toggle());
    expectExpanded(false);
    rerender(tree(routeKey(child)));
    expectExpanded(false);
    rerender(tree('elsewhere'));
    expectExpanded(false);
    rerender(tree(routeKey(sibling)));
    expectExpanded(true);
  });
});

it('marks the selected page with the selected navigation colors', () => {
  render(
    shell([{ route: page('Home'), children: [] }], routeKey(page('Home'))),
    {
      wrapper: I18n,
    },
  );
  const link = screen.getByRole('link', { name: 'Home' });
  expect(link).toHaveAttribute('aria-current', 'page');
  expect(link).toHaveAttribute('data-active');
  expect(link).toHaveClass(
    'data-active:bg-sidebar-primary',
    'data-active:text-sidebar-primary-foreground',
  );
});

describe('collapsed navigation', () => {
  beforeEach(() => setCollapsed(true));

  function show(item: RouteNavigationItem, selectedKey = routeKey(child)) {
    return render(shell([item], selectedKey), { wrapper: I18n });
  }

  it('shows a leaf label immediately on hover and dismisses it on leave', async () => {
    const user = userEvent.setup();
    show({ route: page('Home'), children: [] });
    const link = screen.getByRole('link', { name: 'Home' });
    await user.hover(link);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Home');
    expect(link).not.toHaveAttribute('title');
    await user.unhover(link);
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    );
  });

  it.each([false, true])(
    'opens a group list immediately on hover (clickable parent: %s)',
    async (clickable) => {
      const user = userEvent.setup();
      show({
        route: {
          ...page('Group'),
          componentLoader: clickable
            ? page('Group').componentLoader
            : undefined,
        },
        children: [{ route: child, children: [] }],
      });
      const trigger = screen.getByRole(clickable ? 'link' : 'button', {
        name: 'Group',
      });
      // The group holding the selected page is highlighted.
      expect(trigger).toHaveAttribute('data-active');
      fireEvent.mouseEnter(trigger);
      const popup = screen.getByRole('dialog', { name: 'Group' });
      const link = within(popup).getByRole('link', { name: 'child' });
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(link).toHaveAttribute('href', '/child');
      // user-event omits mouseleave.relatedTarget; with zero close delay and
      // JSDOM's empty rectangles, safePolygon would close before pointer entry.
      fireEvent.mouseLeave(trigger, { relatedTarget: popup });
      await user.hover(popup);
      await user.click(link);
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    },
  );

  it('opens on keyboard focus and closes with Escape', async () => {
    const user = userEvent.setup();
    show({
      route: { ...page('Group'), componentLoader: undefined },
      children: [{ route: child, children: [] }],
    });
    // The brand link comes first in the sidebar.
    await user.tab();
    await user.tab();
    expect(await screen.findByRole('dialog', { name: 'Group' })).toBeVisible();
    await user.tab();
    expect(screen.getByRole('link', { name: 'child' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('keeps a parent link navigable and expands nested groups inside the popup', async () => {
    const user = userEvent.setup();
    show({
      route: page('Parent'),
      children: [
        {
          route: { ...page('Nested'), componentLoader: undefined },
          children: [{ route: sibling, children: [] }],
        },
      ],
    });
    const parent = screen.getByRole('link', { name: 'Parent' });
    expect(parent).toHaveAttribute('href', '/Parent');
    fireEvent.mouseEnter(parent);
    const popup = screen.getByRole('dialog', { name: 'Parent' });
    fireEvent.mouseLeave(parent, { relatedTarget: popup });
    await user.hover(popup);
    await user.click(within(popup).getByText('Nested'));
    expect(within(popup).getByRole('link', { name: 'sibling' })).toBeVisible();
    await user.click(parent);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('does not reopen an old popup after expanding and collapsing the sidebar', async () => {
    const user = userEvent.setup();
    show(
      {
        route: { ...page('Group'), componentLoader: undefined },
        children: [{ route: child, children: [] }],
      },
      'elsewhere',
    );
    await user.hover(screen.getByRole('button', { name: 'Group' }));
    expect(await screen.findByRole('dialog')).toBeVisible();
    act(() => setCollapsed(false));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => setCollapsed(true));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each(['expanded', 'mobile'])(
    'does not add hover overlays when %s',
    async (mode) => {
      if (mode === 'expanded') setCollapsed(false);
      else vi.stubGlobal('innerWidth', 390);
      const user = userEvent.setup();
      show({ route: page('Home'), children: [] });
      if (mode === 'mobile')
        await user.click(
          screen.getByRole('button', { name: 'Open navigation' }),
        );
      await user.hover(screen.getByRole('link', { name: 'Home' }));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('dialog', { name: 'Home' }),
      ).not.toBeInTheDocument();
    },
  );
});

describe('sidebar shell', () => {
  it('collapses from the header toggle into the shared preference', async () => {
    const user = userEvent.setup();
    render(shell([{ route: page('Home'), children: [] }]), { wrapper: I18n });
    const sidebar = screen.getByRole('complementary', { name: 'Navigation' });
    await user.click(
      screen.getByRole('button', { name: 'Collapse navigation' }),
    );
    expect(localStorage.getItem(preferenceKey)).toBe('true');
    expect(sidebar.closest('[data-state]')).toHaveAttribute(
      'data-state',
      'collapsed',
    );
    expect(
      screen.getByRole('button', { name: 'Expand navigation' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('ignores Ctrl/Cmd+B, leaving the key to whatever is focused', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn<(key: string) => void>();
    render(
      <>
        {shell([{ route: page('Home'), children: [] }])}
        <textarea
          aria-label='Editor'
          onKeyDown={(event) => onKeyDown(event.key)}
        />
      </>,
      { wrapper: I18n },
    );
    await user.click(screen.getByRole('textbox', { name: 'Editor' }));
    await user.keyboard('{Control>}b{/Control}');
    await user.keyboard('{Meta>}b{/Meta}');
    expect(onKeyDown.mock.calls.filter(([key]) => key === 'b')).toHaveLength(2);
    expect(localStorage.getItem(preferenceKey)).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Collapse navigation' }),
    ).toBeInTheDocument();
  });

  it('opens the phone sheet with a translated title and closes it on navigation', async () => {
    vi.stubGlobal('innerWidth', 390);
    const user = userEvent.setup();
    render(shell([{ route: page('Home'), children: [] }]), { wrapper: I18n });
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    const sheet = await screen.findByRole('dialog', { name: 'Navigation' });
    expect(sheet).toHaveAttribute('data-sidebar', 'sidebar');
    await user.click(within(sheet).getByRole('link', { name: 'Home' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Close navigation',
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });
});
