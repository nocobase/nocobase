import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { House } from 'lucide-react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SidebarProvider } from '../../client/components/ui/sidebar.js';
import {
  routeKey,
  type RouteNavigationItem,
} from '../../client/routing/route-navigation.js';
import { NavigationMenu } from '../../client/layouts/components/navigation-menu.js';

vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

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

function group(
  name: string,
  children: RouteNavigationItem[],
): RouteNavigationItem {
  return { route: { ...page(name), componentLoader: undefined }, children };
}

const child = page('child');
const sibling = page('sibling');

function menu(
  items: RouteNavigationItem[],
  selectedKey: string | undefined,
  { collapsed = false, sections = false } = {},
): ReactElement {
  return (
    <MemoryRouter>
      <SidebarProvider open={!collapsed} onOpenChange={() => {}}>
        <NavigationMenu
          items={items}
          label='Navigation'
          sections={sections}
          selectedKey={selectedKey}
        />
      </SidebarProvider>
    </MemoryRouter>
  );
}

// `useIsMobile` reads the width and listens for changes; JSDOM has no matchMedia.
vi.stubGlobal('matchMedia', () => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));
afterEach(() => {
  window.innerWidth = 1024;
});

describe('sections', () => {
  it('labels page-less top-level groups and keeps loose entries in order', () => {
    const items = [
      {
        route: { ...page('Home'), navigation: { title: 'Home', icon: House } },
        children: [],
      },
      group('Development', [
        { route: child, children: [] },
        { route: sibling, children: [] },
      ]),
      { route: page('Settings'), children: [] },
    ];
    render(menu(items, routeKey(items[0].route), { sections: true }));
    const nav = screen.getByRole('navigation', { name: 'Navigation' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home', 'child', 'sibling', 'Settings']);
    const section = screen.getByRole('group', { name: 'Development' });
    expect(within(section).getAllByRole('link')).toHaveLength(2);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(home).toHaveAttribute('data-active');
    // The active entry keeps its icon.
    expect(home.querySelector('svg')).not.toBeNull();
  });
});

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
  const tree = (selectedKey: string | undefined) => menu([item], selectedKey);
  const toggle = () => screen.getByRole('button', { name: 'Group' });
  const expectExpanded = (expanded: boolean) =>
    expect(toggle()).toHaveAttribute('aria-expanded', String(expanded));

  it('keeps an active group open when navigating to another group', () => {
    const { rerender } = render(tree(routeKey(child)));
    expectExpanded(true);
    expect(screen.getByRole('link', { name: 'child' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    rerender(tree('elsewhere'));
    expectExpanded(true);
  });

  it('preserves a manually expanded group across navigation', async () => {
    const user = userEvent.setup();
    const { rerender } = render(tree('elsewhere'));
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
    const { rerender } = render(tree(routeKey(child)));
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

describe('icon mode', () => {
  const show = (item: RouteNavigationItem, collapsed = true) =>
    render(menu([item], routeKey(child), { collapsed }));

  it('shows a leaf label on hover and dismisses it on leave', async () => {
    const user = userEvent.setup();
    show({ route: page('Home'), children: [] });
    const link = screen.getByRole('link', { name: 'Home' });
    await user.hover(link);
    const tooltip = () => document.querySelector('[data-slot=tooltip-content]');
    await waitFor(() => expect(tooltip()).toHaveTextContent('Home'));
    await user.unhover(link);
    await waitFor(() => expect(tooltip()).toBeNull());
  });

  it.each([false, true])(
    'opens a group list on hover (clickable parent: %s)',
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
    show(group('Group', [{ route: child, children: [] }]));
    await user.tab();
    expect(await screen.findByRole('dialog', { name: 'Group' })).toBeVisible();
    await user.tab();
    expect(screen.getByRole('link', { name: 'child' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('expands nested groups inside the popup', async () => {
    const user = userEvent.setup();
    show({
      route: page('Parent'),
      children: [group('Nested', [{ route: sibling, children: [] }])],
    });
    const parent = screen.getByRole('link', { name: 'Parent' });
    expect(parent).toHaveAttribute('href', '/Parent');
    fireEvent.mouseEnter(parent);
    const popup = screen.getByRole('dialog', { name: 'Parent' });
    fireEvent.mouseLeave(parent, { relatedTarget: popup });
    await user.hover(popup);
    await user.click(within(popup).getByRole('button', { name: 'Nested' }));
    expect(within(popup).getByRole('link', { name: 'sibling' })).toBeVisible();
  });

  it.each(['expanded', 'mobile'])(
    'adds no hover overlays when %s',
    async (mode) => {
      if (mode === 'mobile') window.innerWidth = 500;
      const user = userEvent.setup();
      show({ route: page('Home'), children: [] }, mode === 'mobile');
      await user.hover(screen.getByRole('link', { name: 'Home' }));
      expect(document.querySelector('[data-slot=tooltip-content]')).toBeNull();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    },
  );
});
