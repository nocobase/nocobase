// @vitest-environment jsdom
import {
  defineSettingsRoutes,
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import {
  createMemoryRouter,
  Link,
  matchRoutes,
  Outlet,
  RouterProvider,
  useMatches,
  useParams,
  type RouteObject,
} from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { createAISettings } from '../client/ai-settings.js';
import { withAISettingsShell } from '../client/ai-settings-shell.js';
import settings from '../client/settings.js';

vi.mock('../client/locales/index.js', () => ({
  useT: () => (key: string) => (key === 'tools.title' ? 'Tools' : key),
}));
vi.mock('../client/pages/tools-settings-page.js', () => ({
  default: () => <PageProbe name='Tools content' />,
}));
vi.mock('../client/pages/skills-settings-page.js', () => ({
  default: () => <PageProbe name='Skills content' />,
}));
vi.mock('../client/pages/ai-employee-page.js', () => ({
  default: () => <PageProbe name='Employee content' />,
}));
vi.mock('../client/pages/llm-service-page.js', () => ({
  default: () => <PageProbe name='LLM content' />,
}));
vi.mock('../client/pages/mcp-page.js', () => ({
  default: () => <PageProbe name='MCP content' />,
}));
vi.mock('../client/pages/employees/profile.js', () => ({
  default: () => <PageProbe name='Employee profile' />,
}));
vi.mock('../client/pages/employees/role.js', () => ({
  default: () => <PageProbe name='Employee role' />,
}));
vi.mock('../client/pages/employees/models.js', () => ({
  default: () => <PageProbe name='Employee models' />,
}));
vi.mock('../client/pages/employees/skills.js', () => ({
  default: () => <PageProbe name='Employee skills' />,
}));
vi.mock('../client/pages/employees/tools.js', () => ({
  default: () => <PageProbe name='Employee tools' />,
}));
vi.mock('../client/pages/employees/knowledge.js', () => ({
  default: () => <PageProbe name='Employee knowledge' />,
}));
vi.mock('../client/pages/skills/detail.js', () => ({
  default: () => <PageProbe name='Skill detail' />,
}));
vi.mock('../client/pages/skills/instructions.js', () => ({
  default: () => <PageProbe name='Skill instructions' />,
}));
vi.mock('../client/pages/skills/tools.js', () => ({
  default: () => <PageProbe name='Skill tools' />,
}));
vi.mock('../client/pages/tools/detail.js', () => ({
  default: () => <PageProbe name='Tool detail' />,
}));
vi.mock('../client/pages/llm-services/models.js', () => ({
  default: () => <PageProbe name='LLM models' />,
}));
vi.mock('../client/pages/mcp-services/tools.js', () => ({
  default: () => <PageProbe name='MCP tools' />,
}));
vi.mock('../client/pages/conversations-settings-page.js', () => ({
  default: () => <PageProbe name='Conversations content' />,
}));
vi.mock('../client/pages/conversations/detail.js', () => ({
  default: () => <PageProbe name='Conversation detail' />,
}));

// These probes isolate page data; client-routes.test.ts loads every real module.
function PageProbe({ name }: { name: string }) {
  const params = useParams();
  return (
    <>
      <div data-params={JSON.stringify(params)}>{name}</div>
      <Outlet />
    </>
  );
}

const { settingsRouteTree } = resolveAppClientContributions([
  { packageName: '@nocobase/app-plugin-ai-employee', routes: settings },
]);

function SettingsNavigation({
  nodes,
}: {
  nodes: readonly AppClientRegisteredRoute[];
}) {
  const matches = useMatches();
  return nodes.map((node) => (
    <div key={node.id}>
      {node.navigation ? (
        node.componentLoader ? (
          <Link
            to={node.path}
            aria-current={
              matches.some((match) => match.id === node.id) ? 'page' : undefined
            }
          >
            {node.navigation.title === 'tools.title'
              ? 'Tools'
              : node.navigation.title}
          </Link>
        ) : (
          <span>{node.navigation.title}</span>
        )
      ) : null}
      {node.children ? <SettingsNavigation nodes={node.children} /> : null}
    </div>
  ));
}

function toRouterRoutes(
  nodes: readonly AppClientRegisteredRoute[],
): RouteObject[] {
  return nodes.map((node) => ({
    id: node.id,
    path: node.path,
    ...(node.componentLoader
      ? {
          lazy: async () => ({
            Component: (await node.componentLoader!()).default,
          }),
        }
      : { element: <Outlet /> }),
    children: node.children ? toRouterRoutes(node.children) : undefined,
  }));
}

function createRouter(
  initialEntries: (
    | string
    | { pathname: string; search?: string; hash?: string; state: unknown }
  )[],
  basename?: string,
  tree: readonly AppClientRegisteredRoute[] = settingsRouteTree,
) {
  return createMemoryRouter(
    [
      {
        element: (
          <>
            <nav aria-label='Settings menu'>
              <SettingsNavigation nodes={tree} />
            </nav>
            <Outlet />
          </>
        ),
        children: toRouterRoutes(tree),
      },
    ],
    { initialEntries, basename },
  );
}

function expectSkillsWithoutEmployeeShell() {
  expect(screen.getByText('Skills content')).toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: 'AI Employees' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('navigation', { name: 'AI settings' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'LLM services' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Employee content')).not.toBeInTheDocument();
  for (const sibling of ['AI Employees', 'Conversations']) {
    expect(screen.getByRole('link', { name: sibling })).not.toHaveAttribute(
      'aria-current',
    );
  }
}

function openMenuPage(title: string) {
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Settings menu' })).getByRole(
      'link',
      { name: title },
    ),
  );
}

async function travel(router: ReturnType<typeof createRouter>, delta: number) {
  await act(async () => {
    await router.navigate(delta);
  });
}

describe('AI settings page navigation', () => {
  it.each([
    ['/settings/ai/skills/profile', 'aiSkillDetails', { skillName: 'profile' }],
    ['/settings/ai/skills/tools', 'aiSkillDetails', { skillName: 'tools' }],
    ['/settings/ai/tools/profile', 'aiToolDetails', { toolName: 'profile' }],
    [
      '/settings/ai/conversations/0f8fad5b-d9cb-469f-a165-70867728950e',
      'aiConversationDetails',
      { sessionId: '0f8fad5b-d9cb-469f-a165-70867728950e' },
    ],
    [
      '/settings/ai/employees/conversations/profile',
      'aiEmployeeProfile',
      { username: 'conversations' },
    ],
    [
      '/settings/ai/employees/skills/profile',
      'aiEmployeeProfile',
      { username: 'skills' },
    ],
    [
      '/settings/ai/employees/tools/profile',
      'aiEmployeeProfile',
      { username: 'tools' },
    ],
    [
      '/settings/ai/employees/llm-services/profile',
      'aiEmployeeProfile',
      { username: 'llm-services' },
    ],
  ] as const)(
    'matches %s without confusing catalog names and employee usernames',
    (path, routeId, params) => {
      const matches = matchRoutes(
        toRouterRoutes(settingsRouteTree),
        `/main${path}`,
        '/main',
      );
      expect(matches?.at(-1)).toMatchObject({
        route: { id: routeId },
        params,
      });
    },
  );

  it.each([
    [
      '/settings/ai/employees/ada/profile',
      'Employee profile',
      'AI Employees',
      'Employee content',
      { username: 'ada' },
    ],
    [
      '/settings/ai/employees/ada/role',
      'Employee role',
      'AI Employees',
      'Employee content',
      { username: 'ada' },
    ],
    [
      '/settings/ai/employees/ada/models',
      'Employee models',
      'AI Employees',
      'Employee content',
      { username: 'ada' },
    ],
    [
      '/settings/ai/employees/ada/skills',
      'Employee skills',
      'AI Employees',
      'Employee content',
      { username: 'ada' },
    ],
    [
      '/settings/ai/employees/ada/tools',
      'Employee tools',
      'AI Employees',
      'Employee content',
      { username: 'ada' },
    ],
    [
      '/settings/ai/employees/ada/knowledge',
      'Employee knowledge',
      'AI Employees',
      'Employee content',
      { username: 'ada' },
    ],
    [
      '/settings/ai/skills/summarize/instructions',
      'Skill instructions',
      'Skills',
      'Skills content',
      { skillName: 'summarize' },
    ],
    [
      '/settings/ai/skills/summarize/tools',
      'Skill tools',
      'Skills',
      'Skills content',
      { skillName: 'summarize' },
    ],
    [
      '/settings/ai/tools/search',
      'Tool detail',
      'Tools',
      'Tools content',
      { toolName: 'search' },
    ],
    [
      '/settings/ai/llm-services/openai/models',
      'LLM models',
      'LLM services',
      'LLM content',
      { serviceName: 'openai' },
    ],
    [
      '/settings/ai/mcp-services/search/tools',
      'MCP tools',
      'MCP services',
      'MCP content',
      { serverName: 'search' },
    ],
    [
      '/settings/ai/conversations/0f8fad5b-d9cb-469f-a165-70867728950e',
      'Conversation detail',
      'Conversations',
      'Conversations content',
      { sessionId: '0f8fad5b-d9cb-469f-a165-70867728950e' },
    ],
  ] as const)(
    'restores %s with its parent menu selected and no child menu entries',
    async (path, content, label, parentContent, params) => {
      const entry = `/main${path}?tag=a&tag=b#section`;
      const router = createRouter([entry], '/main');
      const view = render(<RouterProvider router={router} />);
      const child = await screen.findByText(content);
      expect(child).toHaveAttribute('data-params', JSON.stringify(params));
      expect(screen.getByText(parentContent)).toBeInTheDocument();
      const menu = within(
        screen.getByRole('navigation', { name: 'Settings menu' }),
      );
      expect(menu.getAllByRole('link').map((link) => link.textContent)).toEqual(
        [
          'AI Employees',
          'Skills',
          'Tools',
          'LLM services',
          'MCP services',
          'Conversations',
        ],
      );
      expect(menu.getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(
        menu
          .getAllByRole('link')
          .filter((link) => link.getAttribute('aria-current') === 'page'),
      ).toHaveLength(1);
      expect(router.state.location).toMatchObject({
        pathname: `/main${path}`,
        search: '?tag=a&tag=b',
        hash: '#section',
      });
      expect(router.state.historyAction).toBe('POP');

      openMenuPage('Skills');
      expect(await screen.findByText('Skills content')).toBeInTheDocument();
      expect(screen.queryByText(content)).not.toBeInTheDocument();
      await travel(router, -1);
      expect(await screen.findByText(content)).toBeInTheDocument();
      expect(router.state.location).toMatchObject({
        pathname: `/main${path}`,
        search: '?tag=a&tag=b',
        hash: '#section',
      });
      expect(menu.getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await travel(router, 1);
      expect(await screen.findByText('Skills content')).toBeInTheDocument();
      expect(screen.queryByText(content)).not.toBeInTheDocument();
      view.unmount();
      router.dispose();

      const reloadedRouter = createRouter([entry], '/main');
      render(<RouterProvider router={reloadedRouter} />);
      expect(await screen.findByText(content)).toHaveAttribute(
        'data-params',
        JSON.stringify(params),
      );
      expect(screen.getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(reloadedRouter.state.location.pathname).toBe(`/main${path}`);
    },
  );

  it.each(['/settings/ai/tools', '/settings/ai/tools/'])(
    'opens Tools independently at %s and restores sibling navigation',
    async (path) => {
      const router = createRouter([`/main${path}`], '/main');
      render(<RouterProvider router={router} />);
      expect(await screen.findByText('Tools content')).toBeInTheDocument();
      expect(screen.queryByText('Employee content')).not.toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Tools' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      openMenuPage('Skills');
      expect(await screen.findByText('Skills content')).toBeInTheDocument();
      await travel(router, -1);
      expect(await screen.findByText('Tools content')).toBeInTheDocument();
      await travel(router, 1);
      expect(await screen.findByText('Skills content')).toBeInTheDocument();
      openMenuPage('Tools');
      expect(await screen.findByText('Tools content')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/main/settings/ai/tools');
    },
  );
  it.each(['/settings/ai/conversations', '/settings/ai/conversations/'])(
    'opens Conversations independently at %s and keeps its filters on back and forward',
    async (path) => {
      const router = createRouter(
        [`/main${path}?userId=member&aiEmployee=ada&title=plan&page=2`],
        '/main',
      );
      render(<RouterProvider router={router} />);
      expect(
        await screen.findByText('Conversations content'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Employee content')).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Conversations' }),
      ).toHaveAttribute('aria-current', 'page');
      openMenuPage('Skills');
      expect(await screen.findByText('Skills content')).toBeInTheDocument();
      await travel(router, -1);
      expect(
        await screen.findByText('Conversations content'),
      ).toBeInTheDocument();
      expect(router.state.location.search).toBe(
        '?userId=member&aiEmployee=ada&title=plan&page=2',
      );
      openMenuPage('Conversations');
      expect(router.state.location.pathname).toBe(
        '/main/settings/ai/conversations',
      );
    },
  );
  it.each(['/settings/ai/skills', '/settings/ai/skills/'])(
    'opens Skills independently at %s',
    async (path) => {
      const router = createRouter([`/main${path}`], '/main');
      render(<RouterProvider router={router} />);
      expect(await screen.findByText('Skills content')).toBeInTheDocument();
      expect(screen.queryByText('Employee content')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Skills' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(
        screen.getByRole('link', { name: 'AI Employees' }),
      ).not.toHaveAttribute('aria-current');
      openMenuPage('AI Employees');
      expect(await screen.findByText('Employee content')).toBeInTheDocument();
      await travel(router, -1);
      expect(await screen.findByText('Skills content')).toBeInTheDocument();
      await travel(router, 1);
      expect(await screen.findByText('Employee content')).toBeInTheDocument();
      openMenuPage('Skills');
      expect(await screen.findByText('Skills content')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/main/settings/ai/skills');
    },
  );
  function expectServiceNavigation(activeLabel: string) {
    expect(
      screen.getByRole('heading', { name: activeLabel }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'AI Settings' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'AI Settings' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'AI settings' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /LLM services|MCP services|MCP servers/,
      }),
    ).not.toBeInTheDocument();
    const menu = within(
      screen.getByRole('navigation', { name: 'Settings menu' }),
    );
    expect(menu.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'AI Employees',
      'Skills',
      'Tools',
      'LLM services',
      'MCP services',
      'Conversations',
    ]);
    expect(menu.getByRole('link', { name: activeLabel })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      menu.queryByRole('link', { name: 'AI Settings' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Employee content')).not.toBeInTheDocument();
  }

  it.each([
    ['/settings/ai/llm-services', 'LLM content', 'LLM services'],
    ['/settings/ai/llm-services/?tab=mcp', 'LLM content', 'LLM services'],
    ['/settings/ai/mcp-services', 'MCP content', 'MCP services'],
    [
      '/settings/ai/mcp-services/?tab=llm-service',
      'MCP content',
      'MCP services',
    ],
  ])(
    'loads a standalone service page directly at %s',
    async (path, content, label) => {
      const router = createRouter([path]);
      render(<RouterProvider router={router} />);
      expect(await screen.findByText(content)).toBeInTheDocument();
      expectServiceNavigation(label);
      expect(router.state.historyAction).toBe('POP');
    },
  );

  it('restores independent service pages with back/forward under a basename', async () => {
    const router = createRouter(
      ['/main/settings/ai/llm-services?filter=recent&tag=a&tag=b#section'],
      '/main',
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('LLM content')).toBeInTheDocument();
    expectServiceNavigation('LLM services');
    openMenuPage('MCP services');
    expect(await screen.findByText('MCP content')).toBeInTheDocument();
    expectServiceNavigation('MCP services');
    expect(router.state.location.pathname).toBe(
      '/main/settings/ai/mcp-services',
    );
    await travel(router, -1);
    expect(await screen.findByText('LLM content')).toBeInTheDocument();
    expectServiceNavigation('LLM services');
    expect(router.state.location.search).toBe('?filter=recent&tag=a&tag=b');
    expect(router.state.location.hash).toBe('#section');
    await travel(router, 1);
    expect(await screen.findByText('MCP content')).toBeInTheDocument();
    expectServiceNavigation('MCP services');
  });

  it.each([
    ['/main/settings/ai/', 'llm-service'],
    ['/main/settings/ai/', 'mcp'],
    ['/main/settings/ai/settings/', 'llm-service'],
    ['/main/settings/ai/settings/', 'mcp'],
  ])(
    'redirects legacy %s %s query and state links with replace',
    async (pathname, tab) => {
      for (const entry of [
        `${pathname}?tab=${tab}&filter=recent&tag=a&tag=b#section`,
        {
          pathname,
          search: '?filter=recent&tag=a&tag=b',
          hash: '#section',
          state: { aiSettingsTab: tab },
        },
      ]) {
        const router = createRouter(
          ['/main/settings/ai/skills', entry],
          '/main',
        );
        const view = render(<RouterProvider router={router} />);
        expect(
          await screen.findByText(
            tab === 'mcp' ? 'MCP content' : 'LLM content',
          ),
        ).toBeInTheDocument();
        expectServiceNavigation(
          tab === 'mcp' ? 'MCP services' : 'LLM services',
        );
        expect(router.state.location.pathname).toBe(
          `/main/settings/ai/${tab === 'mcp' ? 'mcp' : 'llm'}-services`,
        );
        expect(router.state.historyAction).toBe('REPLACE');
        const search = new URLSearchParams(router.state.location.search);
        expect(search.has('tab')).toBe(false);
        expect(search.get('filter')).toBe('recent');
        expect(search.getAll('tag')).toEqual(['a', 'b']);
        expect(router.state.location.hash).toBe('#section');
        await travel(router, -1);
        expect(await screen.findByText('Skills content')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/main/settings/ai/skills');
        await travel(router, 1);
        expect(
          await screen.findByText(
            tab === 'mcp' ? 'MCP content' : 'LLM content',
          ),
        ).toBeInTheDocument();
        expectServiceNavigation(
          tab === 'mcp' ? 'MCP services' : 'LLM services',
        );
        view.unmount();
        router.dispose();
      }
    },
  );

  it.each([
    ['', undefined],
    ['?tab=unknown', { aiSettingsTab: 'mcp' }],
    ['?tab=llm-service', { aiSettingsTab: 'mcp' }],
    ['?tab=', { aiSettingsTab: 'mcp' }],
    ['', { aiSettingsTab: 42 }],
    ['', 'mcp'],
  ])(
    'defaults old service URLs to LLM with query precedence: %s %j',
    async (search, state) => {
      const router = createRouter([
        { pathname: '/settings/ai/settings', search, state },
      ]);
      render(<RouterProvider router={router} />);
      expect(await screen.findByText('LLM content')).toBeInTheDocument();
      expectServiceNavigation('LLM services');
      expect(router.state.location.pathname).toBe('/settings/ai/llm-services');
      expect(router.state.location.search).toBe('');
      expect(router.state.historyAction).toBe('REPLACE');
    },
  );

  it.each(['LLM', 'MCP'] as const)(
    'exports an actual standalone %s page, independent of legacy tab state',
    async (service) => {
      const { LLMServiceSettingsPage, MCPServiceSettingsPage } =
        await import('../client/settings-pages.js');
      const router = createMemoryRouter(
        [
          {
            path: '*',
            Component:
              service === 'LLM'
                ? LLMServiceSettingsPage
                : MCPServiceSettingsPage,
          },
        ],
        { initialEntries: ['/settings/ai/settings?tab=mcp'] },
      );
      render(<RouterProvider router={router} />);
      expect(await screen.findByText(`${service} content`)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: `${service} services` }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
  );
  it('supports a deployment basename on direct links and sibling navigation', async () => {
    const router = createRouter(['/main/settings/ai/skills'], '/main');
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Skills content')).toBeInTheDocument();
    expectSkillsWithoutEmployeeShell();
    expect(
      within(
        screen.getByRole('navigation', { name: 'Settings menu' }),
      ).getByText('AI'),
    ).toBeInTheDocument();
    openMenuPage('AI Employees');
    expect(await screen.findByText('Employee content')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'LLM services' }),
    ).not.toBeInTheDocument();
    openMenuPage('LLM services');
    expect(await screen.findByText('LLM content')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      '/main/settings/ai/llm-services',
    );
    openMenuPage('MCP services');
    expect(await screen.findByText('MCP content')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      '/main/settings/ai/mcp-services',
    );
    await act(() => router.navigate('/settings/ai/skills'));
    expect(await screen.findByText('Skills content')).toBeInTheDocument();
    expectSkillsWithoutEmployeeShell();
    expect(router.state.location.pathname).toBe('/main/settings/ai/skills');
  });

  it.each(['/settings/ai', '/settings/ai/', '/settings/ai?tab=ai-employee'])(
    'renders only employee content at %s even when legacy tabs are registered',
    async (path) => {
      const router = createRouter([path]);
      render(<RouterProvider router={router} />);
      expect(await screen.findByText('Employee content')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'AI Employees' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('navigation', { name: 'AI settings' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: /Knowledge Base|Vector Database|AI Employee/,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      await act(() => router.navigate('/settings/ai/skills'));
      expect(await screen.findByText('Skills content')).toBeInTheDocument();
      await travel(router, -1);
      expect(await screen.findByText('Employee content')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(
        '/settings/ai' + (path.endsWith('/') ? '/' : ''),
      );
    },
  );

  it.each(['knowledge-base', 'vector-database'])(
    'redirects legacy query and state links to standalone %s with replace',
    async (tab) => {
      const { settingsRouteTree: tree } = resolveAppClientContributions([
        {
          packageName: '@nocobase/app-plugin-ai-employee',
          routes: defineSettingsRoutes([
            createAISettings(),
            {
              parent: 'aiGroup',
              name: tab,
              path: `/ai/${tab}`,
              authz: 'skip',
              componentLoader: async () => ({
                default: () => <div>Standalone content</div>,
              }),
            },
          ]),
        },
      ]);
      for (const entry of [
        `/main/settings/ai/?tab=${tab}&tag=a&tag=b#section`,
        {
          pathname: '/main/settings/ai/',
          search: '?tag=a&tag=b',
          hash: '#section',
          state: { aiSettingsTab: tab },
        },
      ]) {
        const router = createRouter(
          ['/main/settings/ai/skills', entry],
          '/main',
          tree,
        );
        const view = render(<RouterProvider router={router} />);
        expect(
          await screen.findByText('Standalone content'),
        ).toBeInTheDocument();
        expect(router.state.location.pathname).toBe(`/main/settings/ai/${tab}`);
        expect(router.state.location.search).toBe('?tag=a&tag=b');
        expect(router.state.location.hash).toBe('#section');
        expect(router.state.historyAction).toBe('REPLACE');
        expect(screen.queryByText('Employee content')).not.toBeInTheDocument();
        await travel(router, -1);
        expect(await screen.findByText('Skills content')).toBeInTheDocument();
        await travel(router, 1);
        expect(
          await screen.findByText('Standalone content'),
        ).toBeInTheDocument();
        view.unmount();
        router.dispose();
      }
    },
  );

  it('keeps explicit service tab queries ahead of legacy service state', async () => {
    render(
      <RouterProvider
        router={createRouter([
          {
            pathname: '/settings/ai',
            search: '?tab=mcp',
            state: { aiSettingsTab: 'llm-service' },
          },
        ])}
      />,
    );
    expect(await screen.findByText('MCP content')).toBeInTheDocument();
    expect(screen.queryByText('LLM content')).not.toBeInTheDocument();
  });

  it.each(['knowledge-base', 'vector-database'])(
    'keeps the public shell wrapper tab-free on a %s detail URL',
    async (tab) => {
      const { settingsRouteTree: tree } = resolveAppClientContributions([
        {
          packageName: '@nocobase/app-plugin-ai-employee',
          routes: defineSettingsRoutes([
            createAISettings(),
            {
              name: `${tab}-detail`,
              path: `/ai/${tab}/:id`,
              authz: 'skip',
              componentLoader: async () => ({
                default: withAISettingsShell(() => <div>Detail content</div>),
              }),
            },
          ]),
        },
      ]);
      const router = createRouter(
        [`/settings/ai/${tab}/42?tab=mcp`],
        undefined,
        tree,
      );
      render(<RouterProvider router={router} />);
      expect(await screen.findByText('Detail content')).toBeInTheDocument();
      expect(
        screen.queryByRole('navigation', { name: 'AI settings' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      openMenuPage('AI Employees');
      expect(await screen.findByText('Employee content')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/settings/ai');
      expect(router.state.location.search).toBe('');
      await travel(router, -1);
      expect(await screen.findByText('Detail content')).toBeInTheDocument();
    },
  );

  it('fills the employee scroll viewport without stretching contributed details', async () => {
    const { settingsRouteTree: tree } = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-plugin-ai-employee',
        routes: defineSettingsRoutes([
          createAISettings(),
          {
            name: 'knowledge-base-detail',
            path: '/ai/knowledge-base/:id',
            authz: 'skip',
            componentLoader: async () => ({
              default: withAISettingsShell(() => <div>Detail content</div>),
            }),
          },
        ]),
      },
    ]);
    const router = createRouter(['/settings/ai'], undefined, tree);
    render(<RouterProvider router={router} />);
    const employee = await screen.findByText('Employee content');
    // The page's own scroll regions only stay the sole scrollers while the
    // shell passes the viewport height down instead of growing past it.
    expect(employee.parentElement).toHaveClass(
      'lg:flex',
      'lg:min-h-0',
      'lg:flex-1',
    );
    expect(employee.parentElement?.parentElement).toHaveClass(
      'lg:flex',
      'lg:h-full',
      'lg:min-h-[36rem]',
      'lg:flex-col',
    );
    await act(() => router.navigate('/settings/ai/knowledge-base/42'));
    const detail = await screen.findByText('Detail content');
    expect(detail.parentElement).not.toHaveClass('lg:flex-1');
    expect(detail.parentElement?.parentElement).not.toHaveClass('lg:h-full');
  });

  it('falls back safely for an unknown legacy tab', async () => {
    render(
      <RouterProvider router={createRouter(['/settings/ai?tab=missing'])} />,
    );
    expect(await screen.findByText('Employee content')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'AI Employees' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'AI settings' }),
    ).not.toBeInTheDocument();
  });
});
