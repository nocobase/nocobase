import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  normalizePluginCapabilities,
  type PluginCapability,
} from '../src/lib/capabilities.ts';
import {
  DEFAULT_TEMPLATE_DIRECTORY,
  listTemplateFiles,
} from '../src/lib/template.ts';

const foundation = [
  '.gitignore',
  '.prettierignore',
  'AGENTS.md',
  'CHANGELOG.md',
  'CLAUDE.md',
  'eslint.config.js',
  'package.json',
  'package.ts',
  'README.md',
  'tsconfig.json',
] as const;

const clientUiFiles = ['client/styles.css', 'components.json'] as const;

const capabilityFiles: Readonly<Record<PluginCapability, readonly string[]>> = {
  database: [
    'database/README.md',
    'database/migrations/__NOCOBASE_MIGRATION_NAME__.ts.example',
    'database/seeds/__NOCOBASE_SEED_NAME__.ts.example',
    'server/index.ts',
    'server/plugin.ts',
    'tests/database/migrations.test.ts',
    'tests/server/plugin.test.ts',
    'vitest.config.ts',
  ],
  'server.service-providers': [
    'server/index.ts',
    'server/plugin.ts',
    'server/providers/__NOCOBASE_SHORT_NAME__.ts',
    'server/providers/index.ts',
    'server/services/__NOCOBASE_SHORT_NAME__.ts',
    'server/tokens.ts',
    'tests/server/plugin.test.ts',
    'tests/server/service-provider.test.ts',
    'vitest.config.ts',
  ],
  'server.routes': [
    'server/index.ts',
    'server/plugin.ts',
    'server/routes/index.ts',
    'tests/server/plugin.test.ts',
    'tests/server/routes.test.ts',
    'vitest.config.ts',
  ],
  'server.jobs': [
    'server/index.ts',
    'server/jobs/__NOCOBASE_SHORT_NAME__.ts',
    'server/jobs/provider.ts',
    'server/plugin.ts',
    'tests/server/jobs.test.ts',
    'tests/server/plugin.test.ts',
    'vitest.config.ts',
  ],
  'server.locales': [
    'server/index.ts',
    'server/locales/en-US.ts',
    'server/locales/index.ts',
    'server/locales/zh-CN.ts',
    'server/plugin.ts',
    'tests/server/plugin.test.ts',
    'vitest.config.ts',
  ],
  'client.routes': [
    ...clientUiFiles,
    'client/index.ts',
    'client/plugin.ts',
    'client/routes.ts',
    'tests/client/routes.test.ts',
    'vitest.config.ts',
  ],
  'client.components': [
    ...clientUiFiles,
    'client/components/plugin-component.tsx',
    'tests/client/component.test.tsx',
    'vitest.config.ts',
  ],
  'client.react-providers': [
    ...clientUiFiles,
    'client/components/provider.tsx',
    'client/contexts.ts',
    'client/index.ts',
    'client/plugin.ts',
    'client/react-providers/index.ts',
    'tests/client/react-provider.test.tsx',
    'vitest.config.ts',
  ],
  'client.service-providers': [
    ...clientUiFiles,
    'client/providers/__NOCOBASE_SHORT_NAME__.ts',
    'client/providers/index.ts',
    'client/index.ts',
    'client/plugin.ts',
    'tests/client/service-provider.test.ts',
    'vitest.config.ts',
  ],
  'client.locales': [
    ...clientUiFiles,
    'client/index.ts',
    'client/locales/en-US.ts',
    'client/locales/index.ts',
    'client/locales/zh-CN.ts',
    'client/plugin.ts',
    'vitest.config.ts',
  ],
  registry: [
    'client/styles.css',
    'components.json',
    'registry/component-ui/README.md',
    'registry/component-ui/index.ts',
    'registry/component-ui/plugin-feature-card.tsx',
    'registry.config.json',
  ],
  cli: [
    'cli/index.ts',
    'cli/info.ts',
    'tests/cli/info.test.ts',
    'vitest.config.ts',
  ],
  skills: ['skills/nocobase-app-plugin-__NOCOBASE_SHORT_NAME__/SKILL.md'],
};

function expectExactFiles(
  actual: readonly string[],
  expected: readonly string[],
): void {
  expect(actual).toHaveLength(expected.length);
  expect(actual).toEqual(expect.arrayContaining(expected));
}

describe('bundled capability templates', () => {
  it('selects only the package foundation for an empty plugin', async () => {
    await expect(
      listTemplateFiles(
        DEFAULT_TEMPLATE_DIRECTORY,
        undefined,
        normalizePluginCapabilities([]),
      ),
    ).resolves.toEqual(foundation);
  });

  /**
   * The agent-facing documentation is part of the foundation rather than a capability, because the dependency rule it
   * carries applies to every plugin. A plugin generated without it reintroduces one of two mistakes: a client
   * package left in `devDependencies`, which npm does not publish, so the installing application cannot resolve
   * it — or one declared as a `dependency`, which installs a browser package into every server deployment.
   */
  it('emits a CLI entry and one command for the cli capability', async () => {
    const files = await listTemplateFiles(
      DEFAULT_TEMPLATE_DIRECTORY,
      undefined,
      normalizePluginCapabilities(['cli']),
    );

    expect(files).toContain('cli/index.ts');
    expect(files).toContain('cli/info.ts');
    expect(files).toContain('tests/cli/info.test.ts');
  });

  it('omits the CLI entry when the capability is not selected', async () => {
    const files = await listTemplateFiles(
      DEFAULT_TEMPLATE_DIRECTORY,
      undefined,
      normalizePluginCapabilities(['server.routes']),
    );

    expect(files.some((file) => file.startsWith('cli/'))).toBe(false);
    expect(files).not.toContain('tests/cli/info.test.ts');
  });

  it('always emits the agent documentation, with CLAUDE.md deferring to AGENTS.md', async () => {
    const files = await listTemplateFiles(
      DEFAULT_TEMPLATE_DIRECTORY,
      undefined,
      normalizePluginCapabilities([]),
    );

    expect(files).toContain('AGENTS.md');
    expect(files).toContain('CLAUDE.md');

    const claude = await readFile(
      path.join(DEFAULT_TEMPLATE_DIRECTORY, 'CLAUDE.md'),
      'utf8',
    );
    expect(claude.trim()).toBe('@AGENTS.md');

    const agents = await readFile(
      path.join(DEFAULT_TEMPLATE_DIRECTORY, 'AGENTS.md'),
      'utf8',
    );
    // The three destinations a dependency can go to, and the boundary that decides between them.
    expect(agents).toContain('dependencies');
    expect(agents).toContain('devDependencies');
    expect(agents).toContain('peerDependencies');
    // The client row is the one a generated plugin gets wrong by default, so assert the rule it carries rather
    // than any one destination's wording.
    expect(agents).toContain('Why the client row is different');
    expect(agents).toContain('autoInstallPeers');
  });

  it.each(
    Object.entries(capabilityFiles) as Array<
      [PluginCapability, readonly string[]]
    >,
  )('selects the exact %s file set', async (capability, selectedFiles) => {
    const files = await listTemplateFiles(
      DEFAULT_TEMPLATE_DIRECTORY,
      undefined,
      normalizePluginCapabilities([capability]),
    );

    expectExactFiles(files, [...foundation, ...selectedFiles]);
  });

  it.each([
    ['client-only', ['client.routes', 'client.components', 'client.locales']],
    [
      'server-only',
      ['server.service-providers', 'server.routes', 'server.locales'],
    ],
    [
      'full-stack',
      [
        'client.routes',
        'client.components',
        'client.locales',
        'server.service-providers',
        'server.routes',
        'server.locales',
      ],
    ],
    [
      'data-oriented',
      ['database', 'server.service-providers', 'server.routes'],
    ],
    ['App Agent integration', ['server.routes', 'skills']],
    ['editable UI distribution', ['client.components', 'registry']],
  ] as const)('composes the exact %s file set', async (_name, capabilities) => {
    const files = await listTemplateFiles(
      DEFAULT_TEMPLATE_DIRECTORY,
      undefined,
      normalizePluginCapabilities(capabilities),
    );
    const selectedFiles = capabilities.flatMap(
      (capability) => capabilityFiles[capability],
    );

    expectExactFiles(files, [...new Set([...foundation, ...selectedFiles])]);
  });
});
