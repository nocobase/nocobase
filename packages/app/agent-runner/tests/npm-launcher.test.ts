// The npm launcher (src/agent/npm-launcher.ts) driving the runner's real pnpm against two local registries: a
// "default" one (the machine's mirror) with the public packages, and a "private" one standing in for NocoBase's,
// which, like it, answers 404 without the token and also serves the public `@nocobase/*` packages. The worker's side is
// the run's credential socket (`serveGitCredentials`) with a token source that counts its requests.
import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  serveGitCredentials,
  type CredentialServer,
} from '../src/agent/git-credentials.ts';
import type { NpmTokenSource } from '../src/agent/npm-credentials.ts';
import {
  NPM_DIR_ENV,
  PRIVATE_REGISTRY_ENV,
} from '../src/agent/npm-registry.ts';
import {
  bundledPnpmEntry,
  npmLauncherEntry,
  PINNED_PNPM_ENV,
} from '../src/agent/runner-tools.ts';
import { git, removeDir, tempDir } from './helpers.ts';
import { Registry } from './npm-registry-server.ts';

const TOKEN = 'synthetic-private-registry-token-0001';
const scratch = tempDir('nocobase-runner-npm-launcher-');
afterAll(() => removeDir(scratch));

const PUBLIC = ['@nocobase/fx-public', 'left-pad-fx'];
const mirror = new Registry(scratch, PUBLIC);
const privateRegistry = new Registry(
  scratch,
  [
    ...PUBLIC.filter((name) => name.startsWith('@nocobase/')),
    '@nocobase/fx-private',
  ],
  TOKEN,
);

interface Asked {
  readonly reason: string;
  readonly pkg: string | undefined;
}

/** The worker's side: a socket answering the launcher with `token`, counting what it was asked. */
async function worker(token: string | null): Promise<{
  server: CredentialServer;
  asked: Asked[];
}> {
  const asked: Asked[] = [];
  const source = {
    get: async (reason: string, pkg?: string) => {
      asked.push({ reason, pkg });
      return token;
    },
  } as unknown as NpmTokenSource;
  const server = await serveGitCredentials(
    undefined,
    path.join(scratch, 'home'),
    source,
  );
  return { server, asked };
}

interface Project {
  readonly dir: string;
  readonly home: string;
  readonly npmDir: string;
}

let count = 0;
/** A repository with `dependencies`, an optional committed `.npmrc`, and a machine HOME whose `~/.npmrc` is `userNpmrc`. */
function project(
  dependencies: Record<string, string>,
  options: { npmrc?: string; userNpmrc?: string; authIni?: string } = {},
): Project {
  count += 1;
  const root = path.join(scratch, `case-${count}`);
  const dir = path.join(root, 'repo');
  const home = path.join(root, 'home');
  mkdirSync(dir, { recursive: true });
  mkdirSync(home, { recursive: true });
  writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'fx-app', version: '0.0.0', dependencies }),
  );
  if (options.npmrc !== undefined)
    writeFileSync(path.join(dir, '.npmrc'), options.npmrc);
  git(['init', '-q', '-b', 'main'], dir);
  git(['add', '.'], dir);
  git(['commit', '-q', '-m', 'init'], dir);
  writeFileSync(
    path.join(home, '.npmrc'),
    options.userNpmrc ?? `registry=${mirror.url}\n`,
  );
  if (options.authIni !== undefined) {
    mkdirSync(path.join(home, '.config', 'pnpm'), { recursive: true });
    writeFileSync(
      path.join(home, '.config', 'pnpm', 'auth.ini'),
      options.authIni,
    );
  }
  return { dir, home, npmDir: path.join(root, 'npm') };
}

interface Result {
  readonly code: number;
  readonly output: string;
}

/** `pnpm install` through the launcher, as the run's wrapper starts it. */
function install(target: Project, server: CredentialServer): Promise<Result> {
  const pnpm = bundledPnpmEntry();
  if (pnpm === undefined) throw new Error('The runner has no bundled pnpm.');
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [...npmLauncherEntry(), 'pnpm', process.execPath, pnpm, '--', 'install'],
      {
        cwd: target.dir,
        env: {
          PATH: process.env.PATH,
          HOME: target.home,
          ...PINNED_PNPM_ENV,
          pnpm_config_store_dir: path.join(scratch, 'store'),
          [NPM_DIR_ENV]: target.npmDir,
          [PRIVATE_REGISTRY_ENV]: privateRegistry.url,
          NOCOBASE_RUNNER_GIT_CREDENTIAL_SOCKET: server.socket,
          NOCOBASE_RUNNER_GIT_CREDENTIAL_NONCE: server.nonce,
        },
      },
    );
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.on('close', (code) => resolve({ code: code ?? 1, output }));
  });
}

const privateRequests = () => privateRegistry.seen.splice(0);
const mirrorRequests = () => mirror.seen.splice(0);

/** What the launcher left behind in the run's npm directory: nothing but the marker of a fallback. */
const leftovers = (target: Project) =>
  existsSync(target.npmDir) ? readdirSync(target.npmDir) : [];

describe('the npm launcher', () => {
  beforeAll(async () => {
    await mirror.start();
    await privateRegistry.start();
    return async () => {
      await mirror.stop();
      await privateRegistry.stop();
    };
  });

  it('installs public packages from the machine’s registry and asks for no token', async () => {
    const target = project({
      '@nocobase/fx-public': '1.0.0',
      'left-pad-fx': '1.0.0',
    });
    const { server, asked } = await worker(TOKEN);
    try {
      const result = await install(target, server);
      expect({ code: result.code, output: result.output }).toMatchObject({
        code: 0,
      });
      expect(asked).toEqual([]);
      expect(privateRequests()).toEqual([]);
      expect(mirrorRequests().length).toBeGreaterThan(0);
      expect(leftovers(target)).toEqual([]);
    } finally {
      await server.close();
    }
  });

  it('keeps the machine’s mirror but not its private registry settings, in ~/.npmrc and pnpm’s auth.ini', async () => {
    const target = project(
      { '@nocobase/fx-public': '1.0.0', 'left-pad-fx': '1.0.0' },
      {
        userNpmrc: `registry=${mirror.url}\n@nocobase:registry=${privateRegistry.url}\n`,
        authIni: `@nocobase:registry=${privateRegistry.url}\n//127.0.0.1:${new URL(privateRegistry.url).port}/:_authToken=stale\n`,
      },
    );
    const { server, asked } = await worker(TOKEN);
    try {
      const result = await install(target, server);
      expect({ code: result.code, output: result.output }).toMatchObject({
        code: 0,
      });
      expect(asked).toEqual([]);
      expect(privateRequests()).toEqual([]);
      expect(mirrorRequests().map((seen) => seen.url)).toContain(
        '/@nocobase/fx-public',
      );
      // The machine's own files are as they were.
      expect(readFileSync(path.join(target.home, '.npmrc'), 'utf8')).toContain(
        '@nocobase:registry=',
      );
      expect(leftovers(target)).toEqual([]);
    } finally {
      await server.close();
    }
  });

  it('asks for the token once after an @nocobase package is not found, and retries once with the private registry', async () => {
    const target = project({
      '@nocobase/fx-private': '1.0.0',
      'left-pad-fx': '1.0.0',
    });
    const { server, asked } = await worker(TOKEN);
    try {
      const result = await install(target, server);
      expect({ code: result.code, output: result.output }).toMatchObject({
        code: 0,
      });
      expect(asked).toEqual([
        { reason: 'notFound', pkg: '@nocobase/fx-private' },
      ]);
      expect(result.output).toContain(
        '@nocobase/fx-private was not found on the default registry; retrying once with the NocoBase private registry',
      );
      const seen = privateRequests();
      expect(seen.map((request) => request.url)).toContain(
        '/@nocobase/fx-private',
      );
      expect(seen.every((request) => request.auth === `Bearer ${TOKEN}`)).toBe(
        true,
      );
      expect(
        existsSync(
          path.join(target.dir, 'node_modules', '@nocobase', 'fx-private'),
        ),
      ).toBe(true);
      // The repository's own configuration is untouched, and the token is in no file left behind.
      expect(existsSync(path.join(target.dir, '.npmrc'))).toBe(false);
      expect(git(['status', '--porcelain', '--', '.npmrc'], target.dir)).toBe(
        '',
      );
      expect(
        readFileSync(path.join(target.dir, 'pnpm-lock.yaml'), 'utf8'),
      ).not.toContain(TOKEN);
      expect(leftovers(target)).toEqual(['nocobase-scope']);
      expect(statSync(target.npmDir).mode & 0o777).toBe(0o700);
    } finally {
      await server.close();
    }
  });

  it('asks for the token before installing when the repository declares the private registry', async () => {
    const target = project(
      { '@nocobase/fx-private': '1.0.0' },
      { npmrc: `@nocobase:registry=${privateRegistry.url}\n` },
    );
    const { server, asked } = await worker(TOKEN);
    try {
      const result = await install(target, server);
      expect({ code: result.code, output: result.output }).toMatchObject({
        code: 0,
      });
      expect(asked).toEqual([{ reason: 'declared', pkg: undefined }]);
      expect(result.output).not.toContain('retrying');
      const seen = privateRequests();
      expect(seen.length).toBeGreaterThan(0);
      expect(seen.every((request) => request.auth === `Bearer ${TOKEN}`)).toBe(
        true,
      );
      expect(readFileSync(path.join(target.dir, '.npmrc'), 'utf8')).toBe(
        `@nocobase:registry=${privateRegistry.url}\n`,
      );
      expect(leftovers(target)).toEqual([]);
    } finally {
      await server.close();
    }
  });

  it('says where to set the token when the application has none, without retrying', async () => {
    const target = project({ '@nocobase/fx-private': '1.0.0' });
    const { server, asked } = await worker(null);
    try {
      const result = await install(target, server);
      expect(result.code).not.toBe(0);
      expect(asked).toEqual([
        { reason: 'notFound', pkg: '@nocobase/fx-private' },
      ]);
      expect(result.output).toContain(
        '@nocobase/fx-private was not found on the default registry (404) and needs the NocoBase private registry',
      );
      expect(result.output).toContain(
        'ask an administrator to set the NocoBase private registry token in Settings › License',
      );
      expect(privateRequests()).toEqual([]);
    } finally {
      await server.close();
    }
  });

  it('retries only once when the private registry fails too', async () => {
    const target = project({ '@nocobase/fx-missing': '1.0.0' });
    const { server, asked } = await worker(TOKEN);
    try {
      const result = await install(target, server);
      expect(result.code).not.toBe(0);
      expect(asked).toHaveLength(1);
      expect(result.output.match(/retrying once/gu)).toHaveLength(1);
      expect(
        privateRequests().filter(
          (request) => request.url === '/@nocobase/fx-missing',
        ),
      ).toHaveLength(1);
    } finally {
      await server.close();
    }
  });
});
