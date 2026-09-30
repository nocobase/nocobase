import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
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
import { NavigationTree } from '../../client/layouts/components/navigation-tree.js';

// Navigation titles are route data, not keys any namespace owns: the tree translates each through its package's
// namespace with the title itself as `defaultValue`, so the runtime is not strict.
const runtime = await createTestI18nRuntime({ strict: false });

function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
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
  function tree(selectedKey: string | undefined) {
    return (
      <MemoryRouter>
        <NavigationTree
          item={item}
          collapsed={false}
          selectedKey={selectedKey}
          onNavigate={() => {}}
        />
      </MemoryRouter>
    );
  }
  function toggle() {
    return clickable
      ? screen.getByRole('button', { name: 'Group' })
      : screen
          .getByText('Group', { selector: 'summary span.truncate' })
          .closest('summary')!;
  }
  function expectExpanded(expanded: boolean) {
    if (clickable)
      expect(toggle()).toHaveAttribute('aria-expanded', String(expanded));
    else expect(toggle().closest('details')!.open).toBe(expanded);
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

describe('collapsed navigation', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  function show(item: RouteNavigationItem, collapsed = true) {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <NavigationTree
          item={item}
          collapsed={collapsed}
          selectedKey={routeKey(child)}
          onNavigate={onNavigate}
        />
      </MemoryRouter>,
      { wrapper: I18n },
    );
    return onNavigate;
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
      const onNavigate = show({
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
      expect(onNavigate).toHaveBeenCalledOnce();
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
    const onNavigate = show({
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
    expect(onNavigate).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('does not reopen an old popup after expanding and collapsing the sidebar', async () => {
    const user = userEvent.setup();
    const item = {
      route: { ...page('Group'), componentLoader: undefined },
      children: [{ route: child, children: [] }],
    };
    const tree = (collapsed: boolean) => (
      <MemoryRouter>
        <NavigationTree
          item={item}
          collapsed={collapsed}
          selectedKey={undefined}
          onNavigate={() => {}}
        />
      </MemoryRouter>
    );
    const { rerender } = render(tree(true), { wrapper: I18n });
    await user.hover(screen.getByRole('button', { name: 'Group' }));
    expect(await screen.findByRole('dialog')).toBeVisible();
    rerender(tree(false));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(tree(true));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each(['expanded', 'mobile'])(
    'does not add hover overlays when %s',
    async (mode) => {
      if (mode === 'mobile')
        vi.stubGlobal('matchMedia', () => ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }));
      const user = userEvent.setup();
      show({ route: page('Home'), children: [] }, mode !== 'expanded');
      await user.hover(screen.getByRole('link', { name: 'Home' }));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    },
  );
});
