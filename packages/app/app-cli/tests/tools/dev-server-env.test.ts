// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';

const source = readFileSync(
  new URL('../../src/tools/scripts/dev/index.mjs', import.meta.url),
  'utf8',
);

function serverEnv(env: Record<string, string>): Record<string, unknown> {
  const assembly = source.slice(
    source.indexOf('  const serverEnv = {'),
    source.indexOf("\n  progress('Starting application server');"),
  );
  return runInNewContext(`(() => {${assembly}\nreturn serverEnv;})()`, {
    nextEnv: env,
    resolveDevShutdownEnv: () => ({}),
    resolveDevTrustedOrigins: () => '',
    toUrlHost: (host: string) => host,
    viteDevHost: '127.0.0.1',
    vitePort: 5173,
    strictStartup: false,
    appServerHost: '127.0.0.1',
    backendPort: 13000,
    appServerPort: 13000,
    rootDir: '/app',
  }) as Record<string, unknown>;
}

it('runs the server as development unless told otherwise', () => {
  expect(serverEnv({}).NODE_ENV).toBe('development');
  expect(serverEnv({ NODE_ENV: 'production' }).NODE_ENV).toBe('production');
});
