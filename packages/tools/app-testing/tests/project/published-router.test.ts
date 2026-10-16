import { execFile } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

const execute = promisify(execFile);
const packageRoot = fileURLToPath(new URL('../..', import.meta.url));
const require = createRequire(import.meta.url);

it('shares router context with an installed app-testing client helper', async () => {
  const cache = path.join(tmpdir(), 'nocobase-vitest-regressions');
  await mkdir(cache, { recursive: true });
  const root = await mkdtemp(path.join(cache, 'published-router-'));
  try {
    for (const name of [
      'react',
      'react-dom',
      'react-router',
      '@testing-library/react',
      'vitest',
      'jsdom',
    ]) {
      const source = await realpath(
        path.join(packageRoot, 'node_modules', name),
      );
      const target = path.join(root, 'node_modules', name);
      await mkdir(path.dirname(target), { recursive: true });
      await symlink(source, target, 'junction');
    }
    const devConfig = path.join(root, 'node_modules/@nocobase/dev-config');
    await mkdir(path.dirname(devConfig), { recursive: true });
    await symlink(
      await realpath(
        path.join(packageRoot, 'node_modules/@nocobase/dev-config'),
      ),
      devConfig,
      'junction',
    );
    const helper = path.join(root, 'node_modules/@nocobase/app-testing');
    await mkdir(path.join(helper, 'dist/src/client'), { recursive: true });
    await writeFile(
      path.join(helper, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-testing',
        type: 'module',
        exports: { './client': './dist/src/client/index.js' },
      }),
    );
    // Published helpers are JavaScript under node_modules; workspace TypeScript alone cannot reproduce this boundary.
    await writeFile(
      path.join(helper, 'dist/src/client/index.js'),
      "export { MemoryRouter as TestRouter } from 'react-router';\n",
    );
    await writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    await writeFile(
      path.join(root, 'vitest.config.ts'),
      `import {createReactVitestConfig} from '@nocobase/dev-config/vitest/react'; export default createReactVitestConfig({server:{fs:{allow:${JSON.stringify([root, path.resolve(packageRoot, '../../..')])}}},test:{include:['router.test.ts'],fileParallelism:false}});`,
    );
    await writeFile(
      path.join(root, 'router.test.ts'),
      `
      import {createElement} from 'react';
      import {render, screen} from '@testing-library/react';
      import {TestRouter} from '@nocobase/app-testing/client';
      import {useLocation} from 'react-router';
      import {expect, it} from 'vitest';
      it('reads the same router', () => {
        const Probe = () => createElement('span', null, useLocation().pathname);
        render(createElement(TestRouter, {initialEntries:['/settings/users']}, createElement(Probe)));
        expect(screen.getByText('/settings/users')).toBeTruthy();
      });
    `,
    );
    const output = await execute(
      process.execPath,
      [
        path.join(
          path.dirname(require.resolve('vitest/package.json')),
          'vitest.mjs',
        ),
        'run',
      ],
      { cwd: root, timeout: 60_000, maxBuffer: 1024 * 1024 },
    );
    expect(output.stdout).toContain('1 passed');
  } catch (error) {
    const failure = error as Error & { stdout?: string; stderr?: string };
    throw new Error(
      `${failure.message}\n${failure.stdout ?? ''}\n${failure.stderr ?? ''}`,
      { cause: error },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 90_000);
