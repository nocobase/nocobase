import {
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
} from '../../client/layouts/use-sidebar-preference.js';
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
import {
  NavigationMenu,
  type NavigationBadges,
} from '../../client/layouts/components/navigation-menu.js';

// Navigation titles are route data, not keys any namespace owns: the menu translates each through its package's
// namespace with the title itself as `defaultValue`, so the runtime is not strict.
const runtime = await createTestI18nRuntime({ strict: false });

function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

const sidebarPreference = createAppSidebarPreferenceStore('/main');

const preferenceKey = 'nocobase:sidebar:collapsed:app:/main';

function setCollapsed(collapsed: boolean) {
  localStorage.setItem(preferenceKey, String(collapsed));
  window.dispatchEvent(
    new Event('nocobase:sidebar-preference-change:app:/main'),
  );
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

function shell(
  items: readonly RouteNavigationItem[],
  selectedKey?: string,
  sections = true,
  badges?: NavigationBadges,
) {
  return (
    <MemoryRouter>
      <SidebarPreferenceProvider value={sidebarPreference}>
        <AppSidebarProvider>
          <AppSidebar label='Navigation'>
            <NavigationMenu
              items={items}
              label='Menu'
              selectedKey={selectedKey}
              sections={sections}
              badges={badges}
            />
          </AppSidebar>
          <AppSidebarToggle />
        </AppSidebarProvider>
      </SidebarPreferenceProvider>
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
  // The collapsible form: a clickable parent always, and a group without a page when sections are off or it is
  // nested. A top-level group without a page is a section, covered below.
  const tree = (selectedKey: string | undefined) =>
    shell([item], selectedKey, false);
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

describe('sections', () => {
  const group: RouteNavigationItem = {
    route: { ...page('Group'), componentLoader: undefined },
    children: [
      { route: child, children: [] },
      { route: sibling, children: [] },
    ],
  };

  it('draws a top-level group without a page as a heading over entries always shown', () => {
    render(shell([{ route: page('Home'), children: [] }, group], 'elsewhere'), {
      wrapper: I18n,
    });
    expect(screen.getByText('Group')).toHaveAttribute(
      'data-sidebar',
      'group-label',
    );
    expect(
      screen.queryByRole('button', { name: 'Group' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'child' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'sibling' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible();
  });

  it('keeps a group divided into sections as one collapsible entry', () => {
    const divided: RouteNavigationItem = {
      route: { ...page('Flows'), componentLoader: undefined },
      children: [
        {
          section: true,
          route: { ...page('Business'), componentLoader: undefined },
          children: [{ route: child, children: [] }],
        },
      ],
    };
    render(shell([divided], routeKey(child)), { wrapper: I18n });
    expect(screen.getByRole('button', { name: 'Flows' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('group', { name: 'Business' })).toBeVisible();
  });

  it('shows a section entries as icons, not a popup, in the collapsed sidebar', () => {
    setCollapsed(true);
    render(shell([group], routeKey(child)), { wrapper: I18n });
    const link = screen.getByRole('link', { name: 'child' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(
      screen.queryByRole('button', { name: 'Group' }),
    ).not.toBeInTheDocument();
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

describe('entry counts', () => {
  const entries: RouteNavigationItem[] = [
    { route: page('inbox'), children: [] },
    { route: page('approvals'), children: [] },
    { route: page('runs'), children: [] },
    { route: page('archive'), children: [] },
  ];
  const badges: NavigationBadges = {
    inbox: 5,
    approvals: 120,
    runs: { count: 2, live: true, hint: '2 running' },
    archive: 0,
  };

  it('shows a count beside its entry, in the entry name, and nothing at zero', () => {
    render(shell(entries, undefined, true, badges), { wrapper: I18n });
    const inbox = screen.getByRole('link', { name: 'inbox · 5' });
    const badge = inbox.parentElement?.querySelector(
      '[data-slot="sidebar-menu-badge"]',
    );
    expect(badge).toHaveTextContent('5');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('link', { name: 'approvals · 120' })).toBeVisible();
    expect(
      screen
        .getByRole('link', { name: 'approvals · 120' })
        .parentElement?.querySelector('[data-slot="sidebar-menu-badge"]'),
    ).toHaveTextContent('99+');
    const archive = screen.getByRole('link', { name: 'archive' });
    expect(
      archive.parentElement?.querySelector('[data-slot="sidebar-menu-badge"]'),
    ).toBeNull();
  });

  it('names work under way by its hint', () => {
    render(shell(entries, undefined, true, badges), { wrapper: I18n });
    const runs = screen.getByRole('link', { name: 'runs · 2 running' });
    expect(
      runs.parentElement?.querySelector('[data-slot="sidebar-menu-badge"]'),
    ).toHaveAttribute('title', '2 running');
  });

  it('marks a counted entry with a dot and its count in the tooltip when collapsed', async () => {
    setCollapsed(true);
    const user = userEvent.setup();
    render(shell(entries, undefined, true, badges), { wrapper: I18n });
    const inbox = screen.getByRole('link', { name: 'inbox · 5' });
    expect(
      inbox.parentElement?.querySelector('[data-slot="navigation-badge-dot"]'),
    ).not.toBeNull();
    expect(
      screen
        .getByRole('link', { name: 'archive' })
        .parentElement?.querySelector('[data-slot="navigation-badge-dot"]'),
    ).toBeNull();
    await user.hover(inbox);
    expect(screen.getByRole('tooltip')).toHaveTextContent('inbox · 5');
  });
});

describe('collapsed navigation', () => {
  beforeEach(() => setCollapsed(true));

  // A group's popup belongs to the collapsible form, so these render without sections.
  function show(item: RouteNavigationItem, selectedKey = routeKey(child)) {
    return render(shell([item], selectedKey, false), { wrapper: I18n });
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
