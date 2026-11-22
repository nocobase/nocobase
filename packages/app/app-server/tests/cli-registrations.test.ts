// @vitest-environment node

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  CLI_PLUGIN_REGISTRATIONS_FILE,
  listCliPluginRegistrations,
  readCliPluginRegistrations,
} from '../src/plugins/index.js';

// This package depends on TypeScript, so it stands in for an application's source checkout.
const appRoot = path.resolve(import.meta.dirname, '..');
const list = (source: string) =>
  listCliPluginRegistrations(source, { appRoot });

describe('listCliPluginRegistrations', () => {
  it('lists the array members in registration order', async () => {
    expect(
      await list(`import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import foundation from '@nocobase/app-plugin-foundation/cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';

// Array order is command registration order.
const cliPlugins: AppCliPlugins = defineCliPlugins([
  scheduler,
  foundation,
]);

export default cliPlugins;
`),
    ).toEqual([
      '@nocobase/app-plugin-scheduler',
      '@nocobase/app-plugin-foundation',
    ]);
  });

  it('ignores an import the array does not pass', async () => {
    expect(
      await list(`import { defineCliPlugins } from '@nocobase/app-cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';
export default defineCliPlugins([]);
`),
    ).toEqual([]);
  });

  it('ignores imports and members inside comments, but not comment-like text in strings', async () => {
    expect(
      await list(`import { defineCliPlugins } from '@nocobase/app-cli';
// import scheduler from '@nocobase/app-plugin-scheduler/cli';
/* import mail from '@nocobase/app-plugin-mail/cli'; */
import agents from '@nocobase/app-plugin-agents/cli';
const note = 'http://example.com /* not a comment */';
export default defineCliPlugins([
  // scheduler,
  /* mail, */ agents,
]);
`),
    ).toEqual(['@nocobase/app-plugin-agents']);
  });

  it('registers nothing without a defineCliPlugins call or through a non-CLI import', async () => {
    expect(
      await list(
        `import scheduler from '@nocobase/app-plugin-scheduler/cli';\nexport default [scheduler];\n`,
      ),
    ).toEqual([]);
    expect(
      await list(
        `import { defineCliPlugins } from '@nocobase/app-cli';\nimport mail from '@nocobase/app-plugin-mail/server';\nexport default defineCliPlugins([mail]);\n`,
      ),
    ).toEqual([]);
  });

  const withTools = (body: string) =>
    list(`import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import tools from '@acme/app-plugin-tools/cli';
${body}
export default cliPlugins;
`);

  it('ignores a call written inside a string or a template literal', async () => {
    expect(
      await withTools(`const help = 'defineCliPlugins([tools])';
const example = \`Register it: defineCliPlugins([tools]) \${help}\`;
const cliPlugins: AppCliPlugins = defineCliPlugins([]);`),
    ).toEqual([]);
  });

  it.each([
    [
      'an assignment',
      'const commentStart = /[/*]/;\nconst ratio = 4 / 2 / 1;\nconst slashes = /\\/\\*/g;',
    ],
    ['an if condition', 'if (true) /[/*]/.test("a");'],
    [
      'a return inside a template interpolation',
      'const label = `${(() => { return /[/*]/.test("a"); })()}`;',
    ],
  ])(
    'keeps a real call after a regular expression holding comment characters in %s',
    async (_, before) => {
      expect(
        await withTools(
          `${before}\nconst cliPlugins: AppCliPlugins = defineCliPlugins([tools]);`,
        ),
      ).toEqual(['@acme/app-plugin-tools']);
    },
  );

  it('explains that an application without TypeScript cannot be parsed', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'cli-registrations-'));
    try {
      await writeFile(path.join(root, 'package.json'), '{}');
      await expect(
        listCliPluginRegistrations('export default [];', { appRoot: root }),
      ).rejects.toThrow(/TypeScript is not installed/u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('readCliPluginRegistrations in a deployment', () => {
  const roots: string[] = [];
  afterEach(async () => {
    await Promise.all(
      roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
    );
  });
  const deployment = async (manifest?: string) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'cli-registrations-'));
    roots.push(root);
    await writeFile(path.join(root, 'package.json'), '{}');
    await mkdir(path.join(root, 'cli'));
    // A compiled cli/plugins.js is never read: only the manifest the build wrote answers.
    await writeFile(
      path.join(root, 'cli', 'plugins.js'),
      "import tools from '@acme/app-plugin-other/cli';\nexport default defineCliPlugins([tools]);\n",
    );
    if (manifest !== undefined)
      await writeFile(path.join(root, CLI_PLUGIN_REGISTRATIONS_FILE), manifest);
    return root;
  };

  it('reads the list the build wrote, without TypeScript', async () => {
    expect(
      await readCliPluginRegistrations(
        await deployment(
          JSON.stringify({ plugins: ['@acme/app-plugin-tools'] }),
        ),
      ),
    ).toEqual(['@acme/app-plugin-tools']);
  });

  it('registers nothing without a list', async () => {
    expect(await readCliPluginRegistrations(await deployment())).toEqual([]);
  });

  it('rejects a list of the wrong shape', async () => {
    await expect(
      readCliPluginRegistrations(
        await deployment(JSON.stringify({ plugins: [1] })),
      ),
    ).rejects.toThrow(/must hold/u);
  });
});
