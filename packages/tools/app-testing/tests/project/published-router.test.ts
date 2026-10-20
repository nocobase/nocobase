import { execFile } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  realpath,
  readFile,
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
import { transpileModule, ScriptTarget, ModuleKind, JsxEmit } from 'typescript';

const execute = promisify(execFile);
const packageRoot = fileURLToPath(new URL('../..', import.meta.url));
const require = createRequire(import.meta.url);

it.each(['shared', 'app-template-default', 'app-template-examples'] as const)(
  'shares installed client contexts with the %s configuration',
  async (configuration) => {
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
      const client = path.join(root, 'node_modules/@nocobase/app-client');
      await mkdir(path.join(client, 'dist'), { recursive: true });
      await writeFile(
        path.join(client, 'package.json'),
        JSON.stringify({
          name: '@nocobase/app-client',
          type: 'module',
          exports: { '.': './dist/index.js' },
        }),
      );
      // Transpile the actual runtime boundary, including the navigation provider's direct context reads.
      for (const file of [
        'navigation-guard-provider.tsx',
        'navigation-guard.ts',
        'application-context.ts',
      ]) {
        const source = await readFile(
          path.resolve(packageRoot, '../../app/app-client/src', file),
          'utf8',
        );
        const output = transpileModule(source, {
          compilerOptions: {
            target: ScriptTarget.ESNext,
            module: ModuleKind.ESNext,
            jsx: JsxEmit.ReactJSX,
          },
          fileName: file,
        });
        await writeFile(
          path.join(client, 'dist', file.replace(/\.tsx?$/u, '.js')),
          output.outputText,
        );
      }
      await writeFile(
        path.join(client, 'dist/index.js'),
        "export { NavigationGuardProvider } from './navigation-guard-provider.js';\nexport { ClientApplicationContext } from './application-context.js';\nexport const fixtureToken = Symbol('fixture-service');\n",
      );
      const pluginNames =
        configuration === 'shared'
          ? ['installed-client-plugin']
          : ['@nocobase/app-plugin-example', '@acme/app-plugin-example'];
      for (const name of pluginNames) {
        const plugin = path.join(root, 'node_modules', name);
        await mkdir(path.join(plugin, 'dist/client'), { recursive: true });
        await writeFile(
          path.join(plugin, 'package.json'),
          JSON.stringify({
            name,
            type: 'module',
            exports: { './client': './dist/client/index.js' },
          }),
        );
        await writeFile(
          path.join(plugin, 'dist/client/index.js'),
          "import { useContext } from 'react';\nimport { ClientApplicationContext } from '@nocobase/app-client';\nexport { fixtureToken as pluginToken } from '@nocobase/app-client';\nexport const useFixtureApplication = () => useContext(ClientApplicationContext);\n",
        );
      }
      await writeFile(path.join(root, 'package.json'), '{"type":"module"}');
      if (configuration === 'shared') {
        await writeFile(
          path.join(root, 'consumer.config.ts'),
          "import {createReactVitestConfig} from '@nocobase/dev-config/vitest/react'; export default createReactVitestConfig();",
        );
      } else {
        const templateRoot = path.resolve(
          packageRoot,
          '../../templates',
          configuration,
        );
        // Exercise the configuration shipped to generated applications, including its local inline rules and setup.
        for (const file of [
          'vitest.config.ts',
          'tests/setup/client-config.ts',
        ]) {
          const target = path.join(
            root,
            file === 'vitest.config.ts' ? 'consumer.config.ts' : file,
          );
          await mkdir(path.dirname(target), { recursive: true });
          await writeFile(
            target,
            await readFile(path.join(templateRoot, file), 'utf8'),
          );
        }
      }
      await writeFile(
        path.join(root, 'vitest.config.ts'),
        `import config from './consumer.config.ts'; export default {...config,cacheDir:'./cache',server:{fs:{allow:${JSON.stringify([root, path.resolve(packageRoot, '../../..')])}}},test:{...config.test,include:['router.test.ts'],fileParallelism:false}};`,
      );
      await writeFile(
        path.join(root, 'router.test.ts'),
        `
      import {createElement} from 'react';
      import {render, screen} from '@testing-library/react';
      import {TestRouter} from '@nocobase/app-testing/client';
      import {NavigationGuardProvider, ClientApplicationContext, fixtureToken} from '@nocobase/app-client';
      ${pluginNames.map((name, index) => `import {useFixtureApplication as useApplication${index}, pluginToken as token${index}} from '${name}/client';`).join('\n')}
      import {useLocation} from 'react-router';
      import {expect, it} from 'vitest';
      it('reads the same router', () => {
        const Probe = () => createElement('span', null, useLocation().pathname);
        render(createElement(TestRouter, {initialEntries:['/settings/users']}, createElement(NavigationGuardProvider, null, createElement(Probe))));
        expect(screen.getByText('/settings/users')).toBeTruthy();
      });
      ${pluginNames
        .map(
          (name, index) => `
        it('shares application context and service tokens with ${name}', () => {
          expect(token${index}).toBe(fixtureToken);
          const Probe = () => createElement('span', null, useApplication${index}().label);
          render(createElement(ClientApplicationContext.Provider, {value:{label:'Shared application'}}, createElement(Probe)));
          expect(screen.getByText('Shared application')).toBeTruthy();
        });
      `,
        )
        .join('\n')}
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
      expect(output.stdout).toContain(`${pluginNames.length + 1} passed`);
    } catch (error) {
      const failure = error as Error & { stdout?: string; stderr?: string };
      throw new Error(
        `${failure.message}\n${failure.stdout ?? ''}\n${failure.stderr ?? ''}`,
        { cause: error },
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  90_000,
);
