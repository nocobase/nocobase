import { afterEach, describe, expect, it } from 'vitest';

import { FoundationPluginCatalog } from '../../server/plugins.js';
import { createApplicationFixture } from '../helpers/application.js';

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

const AGENTS = '@nocobase/app-plugin-agents';
const KNOWLEDGE = '@nocobase/app-plugin-knowledge';
const MAIL = '@nocobase/app-plugin-mail';
const PUSH = '@nocobase/app-plugin-notification-web-push';
const PRINT = '@nocobase/app-plugin-template-print';
const EXPLORER = '@nocobase/app-plugin-database-explorer';

async function catalog(
  fixture: Parameters<typeof createApplicationFixture>[0],
  serverPlugins: readonly string[],
) {
  const app = await createApplicationFixture(fixture);
  cleanups.push(app.cleanup);
  return new FoundationPluginCatalog({
    rootDir: app.rootDir,
    serverPlugins: () =>
      serverPlugins.map((packageName) => ({ packageName, version: '0.0.0' })),
  });
}

describe('FoundationPluginCatalog', () => {
  it('classifies each plugin as plugin inspect does', async () => {
    const plugins = await catalog(
      {
        dependencies: [MAIL, AGENTS, KNOWLEDGE, PRINT],
        devDependencies: [PUSH],
        installed: [
          {
            name: MAIL,
            version: '1.0.0-beta.26',
            nocobase: {
              title: { 'en-US': 'Mail', 'zh-CN': '邮件' },
              description: { 'en-US': 'Team mail', 'zh-CN': '团队邮件' },
            },
          },
          { name: AGENTS },
          { name: KNOWLEDGE, peers: [AGENTS, '@nocobase/app-server'] },
          { name: PUSH },
          { name: PRINT, entries: [] },
        ],
      },
      [MAIL],
    );

    const { data, meta } = await plugins.list([MAIL]);

    expect(meta).toEqual({ deployed: false });
    const byName = Object.fromEntries(data.map((item) => [item.name, item]));
    expect(byName.mail).toMatchObject({
      packageName: MAIL,
      version: '1.0.0-beta.26',
      title: { 'en-US': 'Mail', 'zh-CN': '邮件' },
      description: { 'en-US': 'Team mail', 'zh-CN': '团队邮件' },
      enabled: true,
      state: 'registered',
      issues: [],
    });
    expect(byName.agents).toMatchObject({
      state: 'unregistered',
      enabled: false,
    });
    expect(byName.knowledge).toMatchObject({
      state: 'unregistered',
      requires: [AGENTS],
      missingRequires: [AGENTS],
    });
    expect(byName['notification-web-push']).toMatchObject({
      state: 'preinstalled',
      dependencyField: 'devDependencies',
    });
    expect(byName['template-print']).toMatchObject({
      state: 'registered',
      skillsOnly: true,
      enabled: true,
    });
    // Registered plugins come first, in registration order.
    expect(data[0].packageName).toBe(MAIL);
  });

  it('reports the three situations that need attention', async () => {
    const plugins = await catalog(
      {
        dependencies: [EXPLORER, KNOWLEDGE, AGENTS],
        devDependencies: [PUSH],
        installed: [
          { name: EXPLORER },
          { name: PUSH },
          { name: KNOWLEDGE, peers: [AGENTS] },
          { name: AGENTS },
        ],
      },
      [EXPLORER, PUSH, KNOWLEDGE],
    );

    const { data } = await plugins.list([PUSH, KNOWLEDGE]);
    const byName = Object.fromEntries(data.map((item) => [item.name, item]));

    // Registered on the server only.
    expect(byName['database-explorer']).toMatchObject({
      state: 'inconsistent',
      enabled: true,
      issues: ['PARTIALLY_REGISTERED'],
    });
    expect(byName['notification-web-push']).toMatchObject({
      state: 'inconsistent',
      issues: ['REGISTERED_DEV_DEPENDENCY'],
    });
    expect(byName.knowledge).toMatchObject({
      state: 'registered',
      enabled: true,
      missingRequires: [AGENTS],
    });
  });

  it('asks to enable an optional requirement first, but does not flag an enabled plugin without it', async () => {
    const USERS = '@nocobase/app-plugin-users';
    const NOTIFICATION = '@nocobase/app-plugin-notification';
    const plugins = await catalog(
      {
        dependencies: [KNOWLEDGE, AGENTS, USERS, NOTIFICATION],
        installed: [
          { name: KNOWLEDGE, optionalPeers: [AGENTS] },
          { name: AGENTS },
          { name: USERS, optionalPeers: [NOTIFICATION] },
          { name: NOTIFICATION },
        ],
      },
      [USERS],
    );

    const { data } = await plugins.list([USERS]);
    const byName = Object.fromEntries(data.map((item) => [item.name, item]));

    expect(byName.knowledge).toMatchObject({
      enabled: false,
      requires: [AGENTS],
      missingRequires: [AGENTS],
    });
    expect(byName.users).toMatchObject({
      enabled: true,
      requires: [NOTIFICATION],
      missingRequires: [],
    });
  });

  it('takes the server registration for the browser when it is not told', async () => {
    const plugins = await catalog(
      {
        dependencies: [MAIL, EXPLORER],
        installed: [{ name: MAIL }, { name: EXPLORER, entries: ['server'] }],
      },
      [MAIL, EXPLORER],
    );

    const { data } = await plugins.list();

    expect(data).toMatchObject([
      { packageName: MAIL, state: 'registered' },
      { packageName: EXPLORER, state: 'registered', issues: [] },
    ]);
  });

  it('marks a deployed application, which lists only its dependencies', async () => {
    const plugins = await catalog(
      {
        dependencies: [MAIL],
        installed: [{ name: MAIL }],
        builtAt: '2026-11-22T00:00:00.000Z',
      },
      [MAIL],
    );

    const { data, meta } = await plugins.list([MAIL]);

    expect(meta).toEqual({ deployed: true });
    expect(data.map(({ packageName }) => packageName)).toEqual([MAIL]);
  });

  it('only answers for the plugins the application declares or registers, whatever the browser names', async () => {
    const stray = '@acme/app-plugin-stray';
    const plugins = await catalog(
      {
        dependencies: [MAIL],
        // Installed but not declared: only a request names it.
        installed: [{ name: MAIL }, { name: stray }],
      },
      [MAIL],
    );
    const installed = Reflect.get(plugins, 'installed') as Map<string, unknown>;

    const { data } = await plugins.list([
      MAIL,
      stray,
      '@acme/app-plugin-never-installed',
      '../../etc/app-plugin-x',
      'not a package',
    ]);

    expect(data.map(({ packageName }) => packageName)).toEqual([MAIL]);
    // Nothing the request named beyond the application's own plugins was looked up or cached.
    expect([...installed.keys()]).toEqual([MAIL]);
    await plugins.list(
      Array.from({ length: 50 }, (_, index) => `@acme/app-plugin-p${index}`),
    );
    expect([...installed.keys()]).toEqual([MAIL]);
  });

  it.each(['plugins.ts', 'plugins.js'] as const)(
    'takes a plugin with only a CLI entry as registered exactly when cli/%s registers it',
    async (file) => {
      const cliOnly = '@acme/app-plugin-tools';
      const fixture = {
        dependencies: [cliOnly],
        installed: [{ name: cliOnly, entries: ['cli'] as const }],
      };

      const registered = await catalog(
        { ...fixture, cli: { file, plugins: [cliOnly] } },
        [],
      );
      expect((await registered.list([])).data).toMatchObject([
        {
          packageName: cliOnly,
          state: 'registered',
          enabled: true,
          issues: [],
        },
      ]);

      const unregistered = await catalog(
        { ...fixture, cli: { file, plugins: [] } },
        [],
      );
      expect((await unregistered.list([])).data).toMatchObject([
        { packageName: cliOnly, state: 'unregistered', enabled: false },
      ]);
    },
  );

  describe.each([
    {
      file: 'plugins.ts' as const,
      header:
        "import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';",
      define: (members: string) =>
        `const cliPlugins: AppCliPlugins = defineCliPlugins([${members}]);\nexport default cliPlugins;\n`,
    },
    {
      // What `pnpm build` compiles the same file to.
      file: 'plugins.js' as const,
      header: "import { defineCliPlugins } from '@nocobase/app-cli';",
      define: (members: string) =>
        `const cliPlugins = defineCliPlugins([${members}]);\nexport default cliPlugins;\n//${'#'} sourceMappingURL=plugins.js.map\n`,
    },
  ])('a CLI-only plugin and cli/$file', ({ file, header, define }) => {
    const cliOnly = '@acme/app-plugin-tools';
    const classify = async (source: string) => {
      const plugins = await catalog(
        {
          dependencies: [cliOnly],
          installed: [{ name: cliOnly, entries: ['cli'] }],
          cli: { file, source },
        },
        [],
      );
      return (await plugins.list([])).data;
    };

    it('is enabled when the array passes it', async () => {
      expect(
        await classify(
          `${header}\nimport tools from '${cliOnly}/cli';\n${define('tools')}`,
        ),
      ).toMatchObject([{ state: 'registered', enabled: true }]);
    });

    it('is not enabled when its import stays but the array no longer passes it', async () => {
      expect(
        await classify(
          `${header}\nimport tools from '${cliOnly}/cli';\n${define('')}`,
        ),
      ).toMatchObject([{ state: 'unregistered', enabled: false }]);
    });

    it('is not enabled when its import and its entry are commented out', async () => {
      expect(
        await classify(
          `${header}\n// import tools from '${cliOnly}/cli';\n/* import more from '${cliOnly}/cli'; */\n${define('/* tools */')}`,
        ),
      ).toMatchObject([{ state: 'unregistered', enabled: false }]);
    });
  });

  it('lists a third-party plugin with the name and description it declares', async () => {
    const plugin = '@acme/app-plugin-orders';
    const plugins = await catalog(
      {
        dependencies: [plugin],
        installed: [
          {
            name: plugin,
            nocobase: {
              title: 'Orders',
              description: { 'en-US': 'Sales orders' },
            },
          },
        ],
      },
      [plugin],
    );

    const { data } = await plugins.list([plugin]);

    expect(data).toMatchObject([
      {
        packageName: plugin,
        name: plugin,
        title: 'Orders',
        description: { 'en-US': 'Sales orders' },
        state: 'registered',
      },
    ]);
  });
});
