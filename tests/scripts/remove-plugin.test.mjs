import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import {
  parseRemovePluginArgs,
  removePlugin,
} from '../../scripts/remove-plugin.mjs';

const run = promisify(execFile);
const removeScriptUrl = new URL(
  '../../scripts/remove-plugin.mjs',
  import.meta.url,
).href;

test('parses removal options', () => {
  assert.deepEqual(
    parseRemovePluginArgs([
      '@nocobase/app-plugin-audit-log',
      '--dry-run',
      '--no-install',
    ]),
    {
      dryRun: true,
      help: false,
      install: false,
      json: false,
      name: '@nocobase/app-plugin-audit-log',
    },
  );
});

test('parses JSON removal output mode', () => {
  assert.deepEqual(parseRemovePluginArgs(['audit-log', '--json']), {
    dryRun: false,
    help: false,
    install: true,
    json: true,
    name: 'audit-log',
  });
});

test('prints one JSON success document to stdout for a dry run', async (t) => {
  const repoRoot = await createTestRepo(t);
  await createPluginPackage(repoRoot, 'audit-log');
  const source = `import { main } from ${JSON.stringify(removeScriptUrl)}; await main(['audit-log', '--dry-run', '--json'], ${JSON.stringify(repoRoot)});`;

  const result = await run(process.execPath, [
    '--input-type=module',
    '--eval',
    source,
  ]);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    schemaVersion: 1,
    ok: true,
    operation: 'plugin:remove',
    status: 'success',
    result: {
      mode: 'dry-run',
      directoryName: 'app-plugin-audit-log',
      packageName: '@nocobase/app-plugin-audit-log',
      shortName: 'audit-log',
      targetDirectory: path.join(
        repoRoot,
        'packages/plugins/app-plugin-audit-log',
      ),
      commands: ['CI=true pnpm install --no-frozen-lockfile'],
    },
  });
});

test('prints one structured reference error to stderr and exits non-zero', async (t) => {
  const repoRoot = await createTestRepo(t);
  await createPluginPackage(repoRoot, 'audit-log');
  const appDirectory = path.join(repoRoot, 'packages/templates/app');
  await mkdir(appDirectory);
  await writeJson(path.join(appDirectory, 'package.json'), {
    name: '@nocobase/app',
    dependencies: { '@nocobase/app-plugin-audit-log': 'workspace:^' },
  });
  const source = `import { main } from ${JSON.stringify(removeScriptUrl)}; await main(['audit-log', '--dry-run', '--json'], ${JSON.stringify(repoRoot)});`;

  await assert.rejects(
    run(process.execPath, ['--input-type=module', '--eval', source]),
    (error) => {
      assert.equal(error.stdout, '');
      const response = JSON.parse(error.stderr);
      assert.equal(response.error.code, 'PLUGIN_STILL_REFERENCED');
      assert.equal(response.error.details.references.length, 1);
      assert.deepEqual(response.error.suggestions, [
        {
          command: 'pnpm',
          args: ['plugin:remove', 'audit-log', '--app', 'app'],
        },
      ]);
      return true;
    },
  );
});

test('removes an unreferenced plugin without changing the lockfile', async (t) => {
  const repoRoot = await createTestRepo(t);
  const targetDirectory = await createPluginPackage(repoRoot, 'audit-log');
  const lockfilePath = path.join(repoRoot, 'pnpm-lock.yaml');
  await writeFile(lockfilePath, 'lockfileVersion: 9.0\n');

  const result = await removePlugin({
    install: false,
    name: 'audit-log',
    repoRoot,
  });

  assert.equal(result.packageName, '@nocobase/app-plugin-audit-log');
  await assert.rejects(access(targetDirectory), { code: 'ENOENT' });
  assert.equal(await readFile(lockfilePath, 'utf8'), 'lockfileVersion: 9.0\n');
});

test('dry-run validates but preserves the plugin', async (t) => {
  const repoRoot = await createTestRepo(t);
  const targetDirectory = await createPluginPackage(repoRoot, 'audit-log');

  await removePlugin({
    dryRun: true,
    install: false,
    name: 'app-plugin-audit-log',
    repoRoot,
  });

  await access(targetDirectory);
});

test('refuses removal while a workspace package references the plugin', async (t) => {
  const repoRoot = await createTestRepo(t);
  const targetDirectory = await createPluginPackage(repoRoot, 'audit-log');
  const appDirectory = path.join(repoRoot, 'packages/templates/app');
  await mkdir(appDirectory);
  await writeJson(path.join(appDirectory, 'package.json'), {
    name: '@nocobase/app',
    dependencies: {
      '@nocobase/app-plugin-audit-log': 'workspace:^',
    },
    nocobase: {
      plugins: {
        '@nocobase/app-plugin-audit-log': { enabled: true },
      },
    },
  });

  await assert.rejects(
    removePlugin({ install: false, name: 'audit-log', repoRoot }),
    (error) => {
      assert.match(error.message, /packages\/templates\/app\/package\.json/u);
      assert.match(error.message, /dependencies/u);
      assert.match(error.message, /nocobase\.plugins/u);
      assert.match(
        error.message,
        /pnpm nocobase plugin remove audit-log --workspace-root . --app app/u,
      );
      return true;
    },
  );
  await access(targetDirectory);
});

test('refuses a directory whose package name does not match', async (t) => {
  const repoRoot = await createTestRepo(t);
  const targetDirectory = path.join(
    repoRoot,
    'packages/plugins/app-plugin-audit-log',
  );
  await mkdir(targetDirectory, { recursive: true });
  await writeJson(path.join(targetDirectory, 'package.json'), {
    name: '@nocobase/app-plugin-something-else',
  });

  await assert.rejects(
    removePlugin({ install: false, name: 'audit-log', repoRoot }),
    /expected package name/u,
  );
  await access(targetDirectory);
});

test('refuses removal while server/plugins.ts imports the plugin', async (t) => {
  const repoRoot = await createTestRepo(t);
  const targetDirectory = await createPluginPackage(repoRoot, 'audit-log');
  const appDirectory = path.join(repoRoot, 'packages/templates/app');
  await mkdir(path.join(appDirectory, 'server'), { recursive: true });
  await writeJson(path.join(appDirectory, 'package.json'), {
    name: '@nocobase/app',
  });
  await writeFile(
    path.join(appDirectory, 'server/plugins.ts'),
    `import auditLog from '@nocobase/app-plugin-audit-log/server';
import { defineServerPlugins } from '@nocobase/app-server/plugins';

export default defineServerPlugins([auditLog]);
`,
  );

  await assert.rejects(
    removePlugin({ install: false, name: 'audit-log', repoRoot }),
    (error) => {
      assert.match(error.message, /server\/plugins\.ts/u);
      assert.match(
        error.message,
        /pnpm nocobase plugin remove audit-log --workspace-root . --app app/u,
      );
      return true;
    },
  );
  await access(targetDirectory);
});

test('refuses removal while client/plugins.ts imports the plugin', async (t) => {
  const repoRoot = await createTestRepo(t);
  const targetDirectory = await createPluginPackage(repoRoot, 'audit-log');
  const appDirectory = path.join(repoRoot, 'packages/templates/app');
  await mkdir(path.join(appDirectory, 'client'), { recursive: true });
  await writeJson(path.join(appDirectory, 'package.json'), {
    name: '@nocobase/app',
  });
  await writeFile(
    path.join(appDirectory, 'client/plugins.ts'),
    `import auditLog from '@nocobase/app-plugin-audit-log/client';
import { defineClientPlugins } from '@nocobase/app-client/plugins';

export default defineClientPlugins([auditLog()]);
`,
  );

  await assert.rejects(
    removePlugin({ install: false, name: 'audit-log', repoRoot }),
    (error) => {
      assert.match(error.message, /client\/plugins\.ts/u);
      assert.match(
        error.message,
        /pnpm nocobase plugin remove audit-log --workspace-root . --app app/u,
      );
      return true;
    },
  );
  await access(targetDirectory);
});

test('removes a plugin after every application reference is gone', async (t) => {
  const repoRoot = await createTestRepo(t);
  const targetDirectory = await createPluginPackage(repoRoot, 'audit-log');
  const appDirectory = path.join(repoRoot, 'packages/templates/app');
  await mkdir(path.join(appDirectory, 'client'), { recursive: true });
  await mkdir(path.join(appDirectory, 'server'), { recursive: true });
  await writeJson(path.join(appDirectory, 'package.json'), {
    name: '@nocobase/app',
    devDependencies: {},
    nocobase: { plugins: {} },
  });
  await writeFile(
    path.join(appDirectory, 'client/plugins.ts'),
    `import { defineClientPlugins } from '@nocobase/app-client/plugins';

export default defineClientPlugins([]);
`,
  );
  await writeFile(
    path.join(appDirectory, 'server/plugins.ts'),
    `import { defineServerPlugins } from '@nocobase/app-server/plugins';

export default defineServerPlugins([]);
`,
  );

  await removePlugin({ install: false, name: 'audit-log', repoRoot });

  await assert.rejects(access(targetDirectory), { code: 'ENOENT' });
});

test('restores the plugin and lockfile when synchronization fails', async (t) => {
  const repoRoot = await createTestRepo(t);
  const targetDirectory = await createPluginPackage(repoRoot, 'audit-log');
  const lockfilePath = path.join(repoRoot, 'pnpm-lock.yaml');
  await writeFile(lockfilePath, 'lockfileVersion: 9.0\noriginal: true\n');

  await assert.rejects(
    removePlugin({
      name: 'audit-log',
      repoRoot,
      synchronize() {
        writeFileSync(lockfilePath, 'lockfileVersion: 9.0\nmodified: true\n');
        throw new Error('simulated install failure');
      },
    }),
    /was restored: simulated install failure/u,
  );

  await access(targetDirectory);
  assert.equal(
    await readFile(lockfilePath, 'utf8'),
    'lockfileVersion: 9.0\noriginal: true\n',
  );
  assert.deepEqual(
    (await readdir(repoRoot)).filter((entry) =>
      entry.startsWith('.plugin-remove-'),
    ),
    [],
  );
});

async function createTestRepo(t) {
  const repoRoot = await mkdtemp(
    path.join(tmpdir(), 'nocobase-remove-plugin-'),
  );
  // Mirror the two-level layout: plugins live in packages/plugins/, and the application fixtures the reference walk
  // has to reach live in a different category.
  await mkdir(path.join(repoRoot, 'packages/plugins'), { recursive: true });
  await mkdir(path.join(repoRoot, 'packages/templates'), { recursive: true });
  await writeJson(path.join(repoRoot, 'package.json'), {
    name: 'test-workspace',
    private: true,
  });
  t.after(() => rm(repoRoot, { force: true, recursive: true }));
  return repoRoot;
}

async function createPluginPackage(repoRoot, shortName) {
  const targetDirectory = path.join(
    repoRoot,
    `packages/plugins/app-plugin-${shortName}`,
  );
  await mkdir(targetDirectory, { recursive: true });
  await writeJson(path.join(targetDirectory, 'package.json'), {
    name: `@nocobase/app-plugin-${shortName}`,
  });
  return targetDirectory;
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}
