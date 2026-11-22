import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import plugin from '../../client/plugin.js';
import PluginsPage from '../../client/pages/plugins-page.js';
import { FOUNDATION_PACKAGE } from '../../shared/access.js';
import { FoundationPluginCatalog } from '../../server/plugins.js';
import type { FoundationPluginView } from '../../shared/plugins.js';
import { createApplicationFixture } from '../helpers/application.js';

function view(
  name: string,
  overrides: Partial<FoundationPluginView> = {},
): FoundationPluginView {
  return {
    packageName: `@nocobase/app-plugin-${name}`,
    name,
    version: '1.0.0',
    dependencyField: 'dependencies',
    enabled: true,
    state: 'registered',
    skillsOnly: false,
    registrationUnknown: false,
    issues: [],
    requires: [],
    optionalRequires: [],
    missingRequires: [],
    ...overrides,
  };
}

const PLUGINS: FoundationPluginView[] = [
  view('mail', {
    title: { 'en-US': 'Mail', 'zh-CN': '邮件' },
    description: { 'en-US': 'Team mail', 'zh-CN': '团队邮件' },
    requires: ['@nocobase/app-plugin-authentication'],
  }),
  view('authentication', {
    title: { 'en-US': 'Sign-in', 'zh-CN': '登录与认证' },
  }),
  view('database-explorer', {
    title: { 'en-US': 'Database' },
    state: 'inconsistent',
    issues: ['PARTIALLY_REGISTERED'],
  }),
  view('agents', {
    title: 'Agents',
    enabled: false,
    state: 'unregistered',
  }),
  view('knowledge', {
    title: { 'en-US': 'Knowledge', 'zh-CN': '知识库' },
    enabled: false,
    state: 'unregistered',
    requires: ['@nocobase/app-plugin-agents'],
    missingRequires: ['@nocobase/app-plugin-agents'],
  }),
  view('template-print', {
    enabled: false,
    state: 'preinstalled',
    dependencyField: 'devDependencies',
  }),
];

async function renderPage(
  options: {
    readonly plugins?: readonly FoundationPluginView[];
    readonly deployed?: boolean;
    readonly locale?: string;
  } = {},
) {
  const calls: { path: string; query?: unknown }[] = [];
  const rendered = await renderWithApp(
    <QueryClientProvider client={new QueryClient()}>
      <PluginsPage />
    </QueryClientProvider>,
    {
      plugins: [plugin()],
      namespace: FOUNDATION_PACKAGE,
      locale: options.locale,
      fetch: answerApi((call) => {
        calls.push(call);
        return {
          data: options.plugins ?? PLUGINS,
          meta: { deployed: options.deployed ?? false },
        };
      }),
    },
  );
  await screen.findByRole('heading', { level: 1 });
  await waitFor(() =>
    expect(screen.queryByText(/Loading plugins|正在读取插件/)).toBeNull(),
  );
  return { ...rendered, calls };
}

function group(name: RegExp): HTMLElement {
  return screen.getByRole('region', { name });
}

function rowOf(title: string): HTMLElement {
  return screen.getByText(title, { selector: 'div' }).closest('li')!;
}

describe('plugins page', () => {
  it('lists enabled and not-enabled plugins, those needing attention first', async () => {
    const { calls } = await renderPage();

    expect(calls[0]).toMatchObject({
      path: 'foundation/plugins',
      query: { client: '@nocobase/app-plugin-foundation' },
    });
    const enabled = within(group(/^Enabled 3$/)).getAllByRole('listitem');
    expect(enabled.map((item) => item.dataset.package)).toEqual([
      '@nocobase/app-plugin-database-explorer',
      '@nocobase/app-plugin-mail',
      '@nocobase/app-plugin-authentication',
    ]);
    expect(enabled[0]).toHaveTextContent('Enabled · Needs attention');
    expect(enabled[0]).toHaveTextContent(
      'Only partly enabled: its pages open, but their data does not load.',
    );
    expect(enabled[0].textContent).not.toMatch(/server|client/i);
    expect(enabled[1]).toHaveTextContent('Team mail');
    expect(enabled[1]).toHaveTextContent('1.0.0');
    const disabled = within(group(/^Not enabled 3$/)).getAllByRole('listitem');
    expect(disabled.map((item) => item.dataset.package)).toEqual([
      '@nocobase/app-plugin-agents',
      '@nocobase/app-plugin-knowledge',
      '@nocobase/app-plugin-template-print',
    ]);
    // Without a title, the short name.
    expect(disabled[2]).toHaveTextContent('template-print');
    expect(disabled[2]).toHaveTextContent('Not enabled · Development only');
    expect(disabled[1]).toHaveTextContent(
      'Enable first: Agents (the enable command includes it)',
    );
    expect(
      screen.getByText('1 plugin needs attention and is listed first.'),
    ).toBeInTheDocument();
    // Names are not links: there is no detail page.
    expect(screen.queryAllByRole('link')).toEqual([]);
  });

  it('filters and searches by name or package', async () => {
    await renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Needs attention 1' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Not enabled 3' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'All 6' }));
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'app-plugin-mai' },
    });
    expect(
      screen.getAllByRole('listitem').map((item) => item.dataset.package),
    ).toEqual(['@nocobase/app-plugin-mail']);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'knowl' },
    });
    expect(
      screen.getAllByRole('listitem').map((item) => item.dataset.package),
    ).toEqual(['@nocobase/app-plugin-knowledge']);
  });

  it('gives the enable command with the plugins it needs first', async () => {
    await renderPage();

    fireEvent.click(
      within(rowOf('Knowledge')).getByRole('button', {
        name: 'How to enable Knowledge',
      }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Enable Knowledge');
    expect(
      within(dialog).getByText(
        'pnpm nocobase plugin register agents knowledge',
      ),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      'Knowledge depends on Agents, which is not enabled yet either',
    );
    expect(
      within(dialog).getByRole('button', { name: 'Copy command' }),
    ).toBeInTheDocument();
  });

  it('gives update and disable commands with the enabled plugins that depend on one', async () => {
    await renderPage();

    fireEvent.click(
      within(rowOf('Sign-in')).getByRole('button', {
        name: 'Commands for Sign-in',
      }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('pnpm nocobase plugin update authentication'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'pnpm nocobase plugin unregister authentication',
      ),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      'Enabled plugins that depend on it: Mail. Disable them together with it.',
    );
  });

  it('separates the plugins that only use one optionally from those that need it', async () => {
    await renderPage({
      plugins: [
        view('agents', { title: 'Agents' }),
        view('knowledge', {
          title: 'Knowledge',
          requires: ['@nocobase/app-plugin-agents'],
          optionalRequires: ['@nocobase/app-plugin-agents'],
        }),
        view('agent-sessions', {
          title: 'Sessions',
          requires: ['@nocobase/app-plugin-agents'],
        }),
      ],
    });

    fireEvent.click(
      within(rowOf('Agents')).getByRole('button', {
        name: 'Commands for Agents',
      }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(
      'Enabled plugins that depend on it: Sessions. Disable them together with it.',
    );
    expect(dialog).toHaveTextContent(
      'Enabled plugins that use it optionally: Knowledge. They keep working without it but lose the features that need it.',
    );
    expect(dialog).not.toHaveTextContent(/depend on it: [^.]*Knowledge/);
  });

  it('does not ask to disable a plugin that only uses one optionally', async () => {
    await renderPage({
      plugins: [
        view('agents', { title: 'Agents' }),
        view('knowledge', {
          title: 'Knowledge',
          requires: ['@nocobase/app-plugin-agents'],
          optionalRequires: ['@nocobase/app-plugin-agents'],
        }),
      ],
    });

    fireEvent.click(
      within(rowOf('Agents')).getByRole('button', {
        name: 'Commands for Agents',
      }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(
      'No enabled plugin depends on it, so it can be disabled on its own.',
    );
    expect(dialog).toHaveTextContent(
      'Enabled plugins that use it optionally: Knowledge.',
    );
  });

  it.each([
    [
      'cli/plugins.ts keeps its import but does not register it',
      {
        source: [
          "import { defineCliPlugins } from '@nocobase/app-cli';",
          "import tools from '@acme/app-plugin-tools/cli';",
          "// import older from '@acme/app-plugin-tools/cli';",
          'if (true) /[/*]/.test("a");',
          'export default defineCliPlugins([]);',
        ].join('\n'),
      },
    ],
    [
      "the deployment's cli/plugins.json does not list it",
      { deployed: true, plugins: [] },
    ],
  ])('offers to enable a CLI-only plugin when %s', async (_, cli) => {
    const cliOnly = '@acme/app-plugin-tools';
    const app = await createApplicationFixture({
      dependencies: [cliOnly],
      installed: [
        {
          name: cliOnly,
          entries: ['cli'],
          nocobase: { title: 'Tools' },
        },
      ],
      cli,
    });
    try {
      const { data } = await new FoundationPluginCatalog({
        rootDir: app.rootDir,
        serverPlugins: () => [],
      }).list([]);
      await renderPage({ plugins: data });

      expect(within(group(/^Not enabled/)).getByText('Tools')).toBeTruthy();
      fireEvent.click(
        within(rowOf('Tools')).getByRole('button', {
          name: 'How to enable Tools',
        }),
      );
      expect(
        within(await screen.findByRole('dialog')).getByText(
          `pnpm nocobase plugin register ${cliOnly}`,
        ),
      ).toBeInTheDocument();
    } finally {
      await app.cleanup();
    }
  });

  it('gives no enable command for a CLI-only plugin whose registration a deployment cannot tell', async () => {
    const cliOnly = '@acme/app-plugin-tools';
    const app = await createApplicationFixture({
      dependencies: [cliOnly],
      installed: [
        { name: cliOnly, entries: ['cli'], nocobase: { title: 'Tools' } },
      ],
      cli: { legacyBuild: true, plugins: [cliOnly] },
    });
    try {
      const { data } = await new FoundationPluginCatalog({
        rootDir: app.rootDir,
        serverPlugins: () => [],
      }).list([]);
      await renderPage({ plugins: data, deployed: true });

      const row = rowOf('Tools');
      expect(row).toHaveTextContent("Can't tell · Rebuild");
      expect(row).toHaveTextContent('Run pnpm build again and redeploy');
      expect(within(row).queryByRole('button')).toBeNull();
    } finally {
      await app.cleanup();
    }
  });

  it('offers the fixing command for a plugin that needs attention', async () => {
    await renderPage();

    fireEvent.click(
      within(rowOf('Database')).getByRole('button', {
        name: 'Commands for Database',
      }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        'pnpm nocobase plugin register database-explorer',
      ),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      'No enabled plugin depends on it, so it can be disabled on its own.',
    );
  });

  it('explains every situation that needs attention without naming sides', async () => {
    await renderPage({
      plugins: [
        view('notification-web-push', {
          title: 'Web push',
          state: 'inconsistent',
          dependencyField: 'devDependencies',
          issues: ['REGISTERED_DEV_DEPENDENCY'],
        }),
        view('knowledge', {
          title: 'Knowledge',
          requires: ['@nocobase/app-plugin-agents'],
          missingRequires: ['@nocobase/app-plugin-agents'],
        }),
        view('agents', {
          title: 'Agents',
          enabled: false,
          state: 'unregistered',
        }),
      ],
    });

    expect(rowOf('Web push')).toHaveTextContent(
      'Enabled, but not included when the application is deployed',
    );
    expect(rowOf('Knowledge')).toHaveTextContent(
      '“Knowledge” needs Agents, which is not enabled.',
    );
    for (const item of screen.getAllByRole('listitem'))
      expect(item.textContent).not.toMatch(/server|client/i);
  });

  it('tells a deployed application that development-only plugins are not listed', async () => {
    await renderPage({ deployed: true });

    expect(
      screen.getByText(/This is a deployed application/),
    ).toBeInTheDocument();
  });

  it('shows the names and descriptions in the current language', async () => {
    await renderPage({ locale: 'zh-CN' });

    expect(rowOf('邮件')).toHaveTextContent('团队邮件');
    expect(rowOf('知识库')).toHaveTextContent('需要先启用：Agents');
    // A plugin without Chinese text falls back to English.
    expect(rowOf('Database')).toHaveTextContent('已启用 · 需要注意');
  });
});
