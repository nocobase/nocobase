// @vitest-environment node
import {
  copyFile,
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'vite';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const appRoot = path.resolve(import.meta.dirname, '../..');
let root: string;

beforeAll(async () => {
  root = await realpath(await mkdtemp(path.join(tmpdir(), 'asset-url-build-')));
  for (const file of ['vite.config.ts', 'package.json']) {
    await copyFile(path.join(appRoot, file), path.join(root, file));
  }
  await symlink(
    path.join(appRoot, 'node_modules'),
    path.join(root, 'node_modules'),
    'junction',
  );
  await writeFile(
    path.join(root, 'entry.js'),
    `import { resolveAssetUrl, resolveAppUrl } from '@nocobase/app-client';
globalThis.resolvedUrls = {
  asset: resolveAssetUrl('/assets/logo.png?size=2#preview'),
  external: resolveAssetUrl('https://images.example.com/logo.png'),
  api: resolveAppUrl('/api'),
};`,
  );
});

afterEach(() => vi.unstubAllEnvs());
afterAll(async () => {
  if (root) await rm(root, { recursive: true, force: true });
});

describe('asset URLs in the application build', () => {
  it.each([undefined, 'https://cdn.example.com/releases/v1/'])(
    'uses the compiled asset base while keeping API URLs on the runtime mount (%s)',
    async (cdn) => {
      vi.stubEnv('CDN_BASE_URL', cdn);
      vi.stubEnv('AGENT_ANNOTATIONS_ENABLED', 'false');
      // The same build must work when the deployment chooses a different mount path.
      vi.stubEnv('APP_BASE_PATH', '/build-machine');
      const result = await build({
        root,
        configFile: path.join(root, 'vite.config.ts'),
        logLevel: 'silent',
        build: {
          write: false,
          lib: {
            entry: path.join(root, 'entry.js'),
            formats: ['iife'],
            name: 'AssetUrlFixture',
          },
        },
      });
      if ('on' in result) throw new Error('Expected a completed build');
      const bundles = Array.isArray(result) ? result : [result];
      const chunk = bundles
        .flatMap((bundle) => bundle.output)
        .find((item) => item.type === 'chunk');
      if (!chunk || chunk.type !== 'chunk')
        throw new Error('Expected an entry chunk');

      // Execute the emitted JavaScript: stubbing an environment variable in a unit test does not prove
      // that Vite replaced BASE_URL, or that the public library export survived the build.
      for (const mount of ['/crm', '']) {
        const config = {
          textContent: JSON.stringify({
            version: 1,
            config: { app: { basePath: mount } },
          }),
        };
        const browser = {
          URL,
          window: { location: { origin: 'https://app.example.com' } },
          document: { getElementById: () => config },
          resolvedUrls: { asset: '', external: '', api: '' },
        };
        runInNewContext(chunk.code, browser);
        expect(browser.resolvedUrls).toEqual({
          asset: `${cdn ?? `${mount}/`}assets/logo.png?size=2#preview`,
          external: 'https://images.example.com/logo.png',
          api: `${mount}/api`,
        });
      }
    },
  );
});
