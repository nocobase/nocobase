import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const require = createRequire(import.meta.url);

test('published fixtures and plugin clients share application and router contexts', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vitest-published-client-'));
  try {
    const fixture = path.join(root, 'node_modules/@nocobase/app-testing');
    await mkdir(path.join(fixture, 'dist/src/client'), { recursive: true });
    for (const name of [
      'react',
      'react-dom',
      'react-router',
      '@testing-library/react',
      'vitest',
    ]) {
      const destination = path.join(root, 'node_modules', name);
      await mkdir(path.dirname(destination), { recursive: true });
      await symlink(
        path.dirname(require.resolve(`${name}/package.json`)),
        destination,
        'junction',
      );
    }
    await writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    await writeFile(
      path.join(fixture, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-testing',
        type: 'module',
        exports: { './client': './dist/src/client/index.js' },
      }),
    );
    // Reproduce the published helper's module boundary, without depending on the application runtime.
    await writeFile(
      path.join(fixture, 'dist/src/client/index.js'),
      `import { createElement } from 'react';
import { MemoryRouter } from 'react-router';
import { render } from '@testing-library/react';
import { AppClientProviders } from '@nocobase/app-client';
export function renderWithApp(ui) {
  return render(createElement(MemoryRouter, { initialEntries: ['/orders'] }, createElement(AppClientProviders, null, ui)));
}
`,
    );
    // AppClientProviders reaches router bindings through app-client. Inlining only the fixture leaves this
    // transitive import under Node, where it still reads a different router context.
    for (const [name, source] of [
      [
        '@nocobase/app-client',
        `import { createContext, createElement, useContext } from 'react';
import { parse } from '@refinedev/react-router';
const ApplicationContext = createContext(null);
export const useClientApplication = () => useContext(ApplicationContext);
export function AppClientProviders({ children }) {
  parse();
  return createElement(ApplicationContext.Provider, { value: 'test-app' }, children);
}`,
      ],
      [
        '@refinedev/react-router',
        "export { useLocation as parse } from 'react-router';",
      ],
    ] as const) {
      const directory = path.join(root, 'node_modules', name);
      await mkdir(directory, { recursive: true });
      await writeFile(
        path.join(directory, 'package.json'),
        JSON.stringify({ name, type: 'module', exports: './index.js' }),
      );
      await writeFile(path.join(directory, 'index.js'), source);
    }
    const plugin = path.join(root, 'node_modules/@nocobase/app-plugin-example');
    await mkdir(path.join(plugin, 'dist/client'), { recursive: true });
    await writeFile(
      path.join(plugin, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-plugin-example',
        type: 'module',
        exports: { './client': './dist/client/index.js' },
      }),
    );
    // A plugin left under Node reads another app-client context even after the helper is inlined.
    await writeFile(
      path.join(plugin, 'dist/client/index.js'),
      "export { useClientApplication as usePluginApplication } from '@nocobase/app-client';",
    );
    const preset = fileURLToPath(
      new URL('../vitest/react.ts', import.meta.url),
    );
    await writeFile(
      path.join(root, 'vitest.config.ts'),
      `import { createReactVitestConfig } from ${JSON.stringify(preset)};
const config = createReactVitestConfig({ test: { include: ['page.test.tsx'] } });
// The source preset's setup file is compiled only at build time; this test needs no DOM matchers or cleanup.
config.test.setupFiles = [];
export default config;
`,
    );
    await writeFile(
      path.join(root, 'page.test.tsx'),
      `import { renderWithApp } from '@nocobase/app-testing/client';
import { usePluginApplication } from '@nocobase/app-plugin-example/client';
import { screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { expect, test } from 'vitest';
function Page() { return <h1>{usePluginApplication()}:{useLocation().pathname}</h1>; }
test('reads the route supplied by the published helper', () => {
  renderWithApp(<Page />);
  expect(screen.getByRole('heading').textContent).toBe('test-app:/orders');
});
`,
    );
    const result = spawnSync(
      process.execPath,
      [
        path.join(
          path.dirname(require.resolve('vitest/package.json')),
          'vitest.mjs',
        ),
        'run',
      ],
      { cwd: root, encoding: 'utf8', timeout: 20_000 },
    );
    expect(result.error).toBeUndefined();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    expect(result.stdout).toMatch(/1 passed/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
