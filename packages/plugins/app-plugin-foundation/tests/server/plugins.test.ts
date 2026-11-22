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

  it('takes the server registration for the browser when it is not told', async () => {
    const plugins = await catalog(
      { dependencies: [MAIL], installed: [{ name: MAIL }] },
      [MAIL],
    );

    const { data } = await plugins.list();

    expect(data).toMatchObject([{ packageName: MAIL, state: 'registered' }]);
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
