import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  clientPluginEntrySpecifier,
  clientPluginsPath,
  createClientPluginsEditor,
  formatClientPlugins,
  localNameFor,
  readClientPlugins,
} from '../src/lib/client-plugins.ts';
import type { ClientPluginsEditor } from '../src/lib/client-plugins.ts';

const created: string[] = [];

afterEach(async () => {
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const require = createRequire(import.meta.url);

/** Where a dependency this package already installs actually lives, so a temporary app can link to it. */
function moduleDirectory(packageName: string): string {
  return path.dirname(require.resolve(`${packageName}/package.json`));
}

/**
 * Builds a throwaway application. The editor resolves TypeScript from the application rather than from the CLI, so a
 * temporary directory only becomes editable once a compiler is reachable from it; linking the one this repository
 * already installs keeps the test honest about that lookup instead of stubbing it out.
 */
async function createApp({
  prettier = false,
  typescript = true,
}: { prettier?: boolean; typescript?: boolean } = {}): Promise<string> {
  const appRoot = await mkdtemp(path.join(os.tmpdir(), 'app-cli-client-'));
  created.push(appRoot);
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({ name: 'demo-app' }),
  );
  await mkdir(path.join(appRoot, 'node_modules'), { recursive: true });
  if (typescript) {
    await symlink(
      moduleDirectory('typescript'),
      path.join(appRoot, 'node_modules', 'typescript'),
      'junction',
    );
  }
  if (prettier) {
    await symlink(
      moduleDirectory('prettier'),
      path.join(appRoot, 'node_modules', 'prettier'),
      'junction',
    );
  }
  return appRoot;
}

async function createEditor(): Promise<ClientPluginsEditor> {
  return createClientPluginsEditor(await createApp());
}

const HEADER = `import {
  defineClientPlugins,
  type AppClientPlugins,
} from '@nocobase/app-client/plugins';`;

/** A `client/plugins.ts` written the way the default template writes one. */
function sourceWith(...shortNames: string[]): string {
  const imports = shortNames
    .map(
      (name) => `import ${name} from '@nocobase/app-plugin-${name}/client';\n`,
    )
    .join('');
  // An empty registration stays on one line, the way the template writes it, so the empty case is the shape the editor
  // actually meets rather than a blank line between the brackets.
  const array =
    shortNames.length === 0
      ? '[]'
      : `[\n${shortNames.map((name) => `  ${name}(),\n`).join('')}]`;
  return `${HEADER}\n${imports}\nconst clientPlugins: AppClientPlugins = defineClientPlugins(${array});\n\nexport default clientPlugins;\n`;
}

// Exercise Node's native ESM loader without Vitest's URL transforms or fallback module lookup paths.
function checkCompilerInNode(appRoot: string, assertion: string): void {
  const editorUrl = new URL('../src/lib/client-plugins.ts', import.meta.url);
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `import assert from 'node:assert/strict';
import { createClientPluginsEditor } from ${JSON.stringify(editorUrl.href)};
const appRoot = process.argv[1];
${assertion}`,
      appRoot,
    ],
    { env: { ...process.env, NODE_PATH: '' }, timeout: 30_000 },
  );
}

describe('loading the application TypeScript compiler', () => {
  it('loads a compiler entry whose path contains URL characters', async () => {
    const appRoot = await createApp({ typescript: false });
    const compilerRoot = path.join(appRoot, 'node_modules', 'typescript');
    const entry = 'compiler #entry.cjs';
    await mkdir(compilerRoot);
    await writeFile(
      path.join(compilerRoot, 'package.json'),
      JSON.stringify({ name: 'typescript', main: entry }),
    );
    await writeFile(
      path.join(compilerRoot, entry),
      `module.exports = require(${JSON.stringify(require.resolve('typescript'))});\n`,
    );

    checkCompilerInNode(
      appRoot,
      `const editor = await createClientPluginsEditor(appRoot);
assert.deepEqual(editor.list(${JSON.stringify(sourceWith('alpha'))}), [
  { localName: 'alpha', packageName: '@nocobase/app-plugin-alpha' },
]);`,
    );
  });

  it('reports a missing compiler', async () => {
    const appRoot = await createApp({ typescript: false });

    checkCompilerInNode(
      appRoot,
      `await assert.rejects(createClientPluginsEditor(appRoot), {
  name: 'MissingTypeScriptError',
  message: /TypeScript is not installed/,
});`,
    );
  });

  it('preserves errors thrown by an installed compiler', async () => {
    const appRoot = await createApp({ typescript: false });
    const compilerRoot = path.join(appRoot, 'node_modules', 'typescript');
    await mkdir(compilerRoot);
    await writeFile(
      path.join(compilerRoot, 'package.json'),
      JSON.stringify({ name: 'typescript', main: 'index.cjs' }),
    );
    await writeFile(
      path.join(compilerRoot, 'index.cjs'),
      "throw Object.assign(new Error('Compiler dependency is missing'), { code: 'MODULE_NOT_FOUND' });\n",
    );

    checkCompilerInNode(
      appRoot,
      `await assert.rejects(createClientPluginsEditor(appRoot), {
  name: 'Error',
  code: 'MODULE_NOT_FOUND',
  message: 'Compiler dependency is missing',
});`,
    );
  });
});

describe('localNameFor', () => {
  it('converts a kebab-case package into a camelCase binding', () => {
    expect(localNameFor('@nocobase/app-plugin-audit-log')).toBe('auditLog');
    expect(localNameFor('@nocobase/app-plugin-notification-provider')).toBe(
      'notificationProvider',
    );
  });

  it('keeps a single-word package name as it is', () => {
    expect(localNameFor('@nocobase/app-plugin-notification-in-app')).toBe(
      'notificationInApp',
    );
  });

  it('rejects a package outside the plugin namespace', () => {
    expect(() => localNameFor('@nocobase/other')).toThrow(
      'must match @nocobase/app-plugin-<name>',
    );
    expect(() => localNameFor('scheduler')).toThrow(
      'must match @nocobase/app-plugin-<name>',
    );
  });
});

describe('clientPluginEntrySpecifier', () => {
  it('points at the plugin’s client entry subpath', () => {
    expect(clientPluginEntrySpecifier('@nocobase/app-plugin-audit-log')).toBe(
      '@nocobase/app-plugin-audit-log/client',
    );
  });
});

describe('listClientPlugins', () => {
  it('returns registered packages in registration order', async () => {
    const editor = await createEditor();

    expect(
      editor.list(sourceWith('alpha', 'beta', 'gamma')).map((entry) => entry),
    ).toEqual([
      { localName: 'alpha', packageName: '@nocobase/app-plugin-alpha' },
      { localName: 'beta', packageName: '@nocobase/app-plugin-beta' },
      { localName: 'gamma', packageName: '@nocobase/app-plugin-gamma' },
    ]);
  });

  it('returns nothing for an empty registration array', async () => {
    const editor = await createEditor();

    expect(editor.list(sourceWith())).toEqual([]);
  });

  it('ignores an entry that no import binds', async () => {
    const editor = await createEditor();
    const source = sourceWith('alpha').replace(
      '  alpha(),',
      '  alpha(),\n  strayThing(),',
    );

    expect(editor.list(source)).toEqual([
      { localName: 'alpha', packageName: '@nocobase/app-plugin-alpha' },
    ]);
  });

  it('recognises an app still wired to the pre-barrel entry', async () => {
    // Apps registered before the barrel gained its default export import `<package>/client/plugin`. Reading those as
    // unregistered would make `register` add a second, conflicting import for a plugin that is already wired.
    const editor = await createEditor();
    const legacy = sourceWith('alpha').replace(
      "'@nocobase/app-plugin-alpha/client'",
      "'@nocobase/app-plugin-alpha/client/plugin'",
    );

    expect(editor.list(legacy)).toEqual([
      { localName: 'alpha', packageName: '@nocobase/app-plugin-alpha' },
    ]);
  });

  it('leaves a pre-barrel registration alone rather than duplicating it', async () => {
    const editor = await createEditor();
    const legacy = sourceWith('alpha').replace(
      "'@nocobase/app-plugin-alpha/client'",
      "'@nocobase/app-plugin-alpha/client/plugin'",
    );

    const added = editor.add(legacy, '@nocobase/app-plugin-alpha');

    expect(added.changed).toBe(false);
    expect(added.sourceText).toBe(legacy);
  });

  it('rejects a file that never calls defineClientPlugins', async () => {
    const editor = await createEditor();

    expect(() => editor.list('export default 1;\n')).toThrow(
      'must call defineClientPlugins()',
    );
  });
});

describe('addClientPlugin', () => {
  it('adds both the import and the registration entry', async () => {
    const editor = await createEditor();

    const added = editor.add(
      sourceWith('alpha'),
      '@nocobase/app-plugin-audit-log',
    );

    expect(added.changed).toBe(true);
    expect(added.localName).toBe('auditLog');
    expect(added.sourceText).toContain(
      "import auditLog from '@nocobase/app-plugin-audit-log/client';",
    );
    expect(editor.list(added.sourceText).map((e) => e.packageName)).toEqual([
      '@nocobase/app-plugin-alpha',
      '@nocobase/app-plugin-audit-log',
    ]);
  });

  it('appends rather than sorting, so contribution order survives', async () => {
    const editor = await createEditor();

    const added = editor.add(
      sourceWith('zulu', 'alpha'),
      '@nocobase/app-plugin-mike',
    );

    expect(editor.list(added.sourceText).map((e) => e.packageName)).toEqual([
      '@nocobase/app-plugin-zulu',
      '@nocobase/app-plugin-alpha',
      '@nocobase/app-plugin-mike',
    ]);
  });

  it('is idempotent, so re-adding reports no change', async () => {
    const editor = await createEditor();
    const once = editor.add(sourceWith('alpha'), '@nocobase/app-plugin-beta');

    const twice = editor.add(once.sourceText, '@nocobase/app-plugin-beta');

    expect(twice.changed).toBe(false);
    expect(twice.sourceText).toBe(once.sourceText);
    expect(editor.list(twice.sourceText)).toHaveLength(2);
  });

  it('produces a usable file when the registration array is empty', async () => {
    const editor = await createEditor();

    const added = editor.add(sourceWith(), '@nocobase/app-plugin-audit-log');

    expect(added.changed).toBe(true);
    expect(editor.list(added.sourceText).map((e) => e.packageName)).toEqual([
      '@nocobase/app-plugin-audit-log',
    ]);
    // An empty array must not gain a leading comma, which would parse as an array hole rather than as one entry.
    expect(added.sourceText).not.toMatch(/\[\s*,/u);
  });

  it('refuses to shadow a binding the author already uses', async () => {
    const editor = await createEditor();
    const source = `import auditLog from './my-own-helper';\n${sourceWith()}`;

    expect(() => editor.add(source, '@nocobase/app-plugin-audit-log')).toThrow(
      'already binds "auditLog" to something else',
    );
  });
});

describe('removeClientPlugin', () => {
  it('removes both the import and the registration entry', async () => {
    const editor = await createEditor();

    const removed = editor.remove(
      sourceWith('alpha', 'beta'),
      '@nocobase/app-plugin-alpha',
    );

    expect(removed.changed).toBe(true);
    expect(removed.sourceText).not.toContain('alpha');
    expect(editor.list(removed.sourceText).map((e) => e.packageName)).toEqual([
      '@nocobase/app-plugin-beta',
    ]);
  });

  it('reports no change for a plugin that is not registered', async () => {
    const editor = await createEditor();
    const source = sourceWith('alpha');

    const removed = editor.remove(source, '@nocobase/app-plugin-missing');

    expect(removed.changed).toBe(false);
    expect(removed.sourceText).toBe(source);
  });

  it('leaves no doubled or dangling comma when the middle entry goes', async () => {
    const editor = await createEditor();

    const removed = editor.remove(
      sourceWith('alpha', 'beta', 'gamma'),
      '@nocobase/app-plugin-beta',
    );

    expect(removed.sourceText).toBe(sourceWith('alpha', 'gamma'));
    expect(removed.sourceText).not.toMatch(/,\s*,/u);
  });

  it('leaves no doubled or dangling comma when the last entry goes', async () => {
    const editor = await createEditor();

    const removed = editor.remove(
      sourceWith('alpha', 'beta', 'gamma'),
      '@nocobase/app-plugin-gamma',
    );

    expect(removed.sourceText).toBe(sourceWith('alpha', 'beta'));
    expect(removed.sourceText).not.toMatch(/,\s*,/u);
  });

  // Removing the sole entry has to take the comma it carried with it. Leaving it behind produces
  // `defineClientPlugins([,])`, an array hole rather than an empty array, which iterates one `undefined` and crashes
  // the application at boot. Reached by unregistering an app's last client plugin.
  it('leaves a valid empty array when the only entry goes', async () => {
    const editor = await createEditor();

    const removed = editor.remove(
      sourceWith('alpha'),
      '@nocobase/app-plugin-alpha',
    );

    expect(removed.changed).toBe(true);
    expect(removed.sourceText).not.toMatch(/\[\s*,/u);
    expect(editor.list(removed.sourceText)).toEqual([]);
    // The emptied file is the file the template starts from, so the next add lands on an empty array rather than on a
    // hole left by the removal.
    expect(removed.sourceText).toBe(sourceWith());
  });

  it('round-trips through an empty array, so the last add and remove cancel out', async () => {
    const editor = await createEditor();
    const original = sourceWith();

    const added = editor.add(original, '@nocobase/app-plugin-alpha');
    const removed = editor.remove(
      added.sourceText,
      '@nocobase/app-plugin-alpha',
    );

    expect(removed.sourceText).toBe(original);
  });

  it('round-trips, so add then remove restores the original byte for byte', async () => {
    const editor = await createEditor();
    const original = sourceWith('alpha', 'beta', 'gamma');

    const added = editor.add(original, '@nocobase/app-plugin-delta');
    const removed = editor.remove(
      added.sourceText,
      '@nocobase/app-plugin-delta',
    );

    expect(added.changed).toBe(true);
    expect(removed.sourceText).toBe(original);
  });
});

describe('readClientPlugins', () => {
  it('reads the file an application already has', async () => {
    const appRoot = await createApp();
    const source = sourceWith('alpha');
    await mkdir(path.join(appRoot, 'client'), { recursive: true });
    await writeFile(clientPluginsPath(appRoot), source);

    const file = await readClientPlugins(appRoot);

    expect(file.exists).toBe(true);
    expect(file.filePath).toBe(clientPluginsPath(appRoot));
    expect(file.sourceText).toBe(source);
  });

  it('falls back to an editable template when the file is absent', async () => {
    const appRoot = await createApp();

    const file = await readClientPlugins(appRoot);
    const editor = await createClientPluginsEditor(appRoot);
    const added = editor.add(file.sourceText, '@nocobase/app-plugin-audit-log');

    expect(file.exists).toBe(false);
    expect(file.filePath).toBe(clientPluginsPath(appRoot));
    expect(editor.list(file.sourceText)).toEqual([]);
    expect(added.changed).toBe(true);
    expect(editor.list(added.sourceText).map((e) => e.packageName)).toEqual([
      '@nocobase/app-plugin-audit-log',
    ]);
  });
});

describe('formatClientPlugins', () => {
  it('returns the source untouched when the app has no Prettier', async () => {
    const appRoot = await createApp();
    const unformatted = 'const   x   =    1\n';

    expect(
      await formatClientPlugins(
        appRoot,
        unformatted,
        clientPluginsPath(appRoot),
      ),
    ).toBe(unformatted);
  });

  it('formats with the Prettier the app itself installs', async () => {
    const appRoot = await createApp({ prettier: true });

    const formatted = await formatClientPlugins(
      appRoot,
      'const   x   =    1\n',
      clientPluginsPath(appRoot),
    );

    expect(formatted).toBe('const x = 1;\n');
  });
});
