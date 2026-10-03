import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { createDefaultCommandContext } from '../src/default-context.ts';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});
function fixture(extension: string, prefix = 'context-') {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, prefix));
  roots.push(root);
  mkdirSync(path.join(root, 'server'));
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'context-test', version: '1.0.0', type: 'module' }),
  );
  writeFileSync(
    path.join(root, 'server', `runtime.${extension}`),
    `
    import { AppConfig } from '@nocobase/app-server/config';
    export default { createAppConfig: () => new AppConfig(), plugins: { plugins: [] }, serviceProviders: [], routes: [] };
  `,
  );
  writeFileSync(
    path.join(root, 'server', `app.${extension}`),
    `
    import { createAppFromRuntime } from '@nocobase/app-server/runtime';
    export const createApp = (runtime) => createAppFromRuntime(runtime);
  `,
  );
  return root;
}

it.each(['ts', 'js'])(
  'loads the conventional %s runtime and application lazily',
  async (extension) => {
    const rootDir = fixture(extension);
    const context = createDefaultCommandContext({ rootDir });
    const runtime = await context.loadRuntime();
    try {
      const app = await context.createApp(runtime);
      expect(app.config).toBe(runtime.config);
      expect(app.paths.rootDir).toBe(rootDir);
      expect(runtime.app).toBe(app);
      await app.shutdown();
    } finally {
      await runtime.scope.destroy();
    }
  },
);

it('hands a configuration file to the application the way APP_CONFIG_FILE does', async () => {
  const rootDir = fixture('ts', 'config-path-');
  writeFileSync(
    path.join(rootDir, 'server', 'runtime.ts'),
    `
    import { AppConfig } from '@nocobase/app-server/config';
    export default {
      createAppConfig: (context) => {
        const config = new AppConfig();
        if (context.configPath) config.loadFile(context.paths.root(context.configPath));
        return config;
      },
      plugins: { plugins: [] }, serviceProviders: [], routes: [],
    };
  `,
  );
  writeFileSync(
    path.join(rootDir, 'test-config.json'),
    JSON.stringify({ fixture: { source: 'test-config' } }),
  );
  const runtime = await createDefaultCommandContext({
    rootDir,
    configPath: 'test-config.json',
  }).loadRuntime();
  try {
    expect(runtime.config.get('fixture.source')).toBe('test-config');
  } finally {
    await runtime.scope.destroy();
  }
});

it('prefers source and propagates import errors instead of falling back to JavaScript', async () => {
  const rootDir = fixture('js');
  writeFileSync(
    path.join(rootDir, 'server/runtime.ts'),
    "throw new Error('source module failed');",
  );
  const context = createDefaultCommandContext({ rootDir });
  await expect(context.loadRuntime()).rejects.toThrow('source module failed');
});

it('reports missing modules only when needed and supports explicit overrides', async () => {
  const loadRuntime = vi.fn();
  const createApp = vi.fn();
  const context = createDefaultCommandContext({
    rootDir: '/missing-app',
    loadRuntime,
    createApp,
  });
  expect(context.loadRuntime).toBe(loadRuntime);
  expect(context.createApp).toBe(createApp);
  expect(loadRuntime).not.toHaveBeenCalled();
  await expect(
    createDefaultCommandContext({ rootDir: '/missing-app' }).loadRuntime(),
  ).rejects.toThrow('Application module not found');
});

it('reports an invalid application export', async () => {
  const rootDir = fixture('js');
  writeFileSync(path.join(rootDir, 'server/app.js'), 'export default {};');
  const context = createDefaultCommandContext({ rootDir });
  const runtime = await context.loadRuntime();
  try {
    await expect(context.createApp(runtime)).rejects.toThrow(
      'must export createApp',
    );
  } finally {
    await runtime.scope.destroy();
  }
});

it('loads paths containing spaces and URL characters through native Node imports', () => {
  const rootDir = fixture('js', 'context space#');
  const moduleUrl = pathToFileURL(path.resolve('src/default-context.ts')).href;
  const script = `
    import { createDefaultCommandContext } from ${JSON.stringify(moduleUrl)};
    const context = createDefaultCommandContext({ rootDir: ${JSON.stringify(rootDir)} });
    const runtime = await context.loadRuntime();
    try { const app = await context.createApp(runtime); await app.shutdown(); }
    finally { await runtime.scope.destroy(); }
  `;
  expect(() =>
    execFileSync(
      process.execPath,
      ['--import', 'tsx', '--input-type=module', '-e', script],
      { timeout: 15000, stdio: 'pipe' },
    ),
  ).not.toThrow();
});
