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
  rmSync,
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
import { launch, writeRunConfig } from '../src/agent/npm-launcher.ts';
import {
  NPM_DIR_ENV,
  PRIVATE_REGISTRY_ENV,
} from '../src/agent/npm-registry.ts';
import {
  bundledPnpmEntry,
  npmLauncherEntry,
  PINNED_PNPM_ENV,
  writeRunnerTools,
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
function install(
  target: Project,
  server: CredentialServer,
  env: Record<string, string> = {},
  args: string[] = ['install'],
  registry = privateRegistry.url,
  tool: 'pnpm' | 'npm' = 'pnpm',
  executable: 'npm' | 'npx' = 'npm',
): Promise<Result> {
  const pnpm = bundledPnpmEntry();
  if (pnpm === undefined) throw new Error('The runner has no bundled pnpm.');
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        ...npmLauncherEntry(),
        tool,
        ...(tool === 'pnpm' ? [process.execPath, pnpm] : [executable]),
        '--',
        ...args,
      ],
      {
        cwd: target.dir,
        env: {
          PATH: process.env.PATH,
          HOME: target.home,
          // pnpm's global configuration directory under HOME on every platform (macOS's default is elsewhere).
          XDG_CONFIG_HOME: path.join(target.home, '.config'),
          ...PINNED_PNPM_ENV,
          pnpm_config_store_dir: path.join(scratch, 'store'),
          [NPM_DIR_ENV]: target.npmDir,
          [PRIVATE_REGISTRY_ENV]: registry,
          NOCOBASE_RUNNER_GIT_CREDENTIAL_SOCKET: server.socket,
          NOCOBASE_RUNNER_GIT_CREDENTIAL_NONCE: server.nonce,
          ...env,
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
  it.each(['npm pack', 'npx'])(
    'retries a Bearer challenge for %s without a visible request URL',
    async (mode) => {
      const registry = new Registry(
        scratch,
        ['@nocobase/fx-private'],
        TOKEN,
        401,
      );
      await registry.start();
      const target = project({});
      const { server, asked } = await worker(TOKEN);
      try {
        const result = await install(
          target,
          server,
          {},
          mode === 'npm pack'
            ? [
                'pack',
                '@nocobase/fx-private',
                '--loglevel=error',
                `--@nocobase:registry=${registry.url}`,
              ]
            : [
                '--yes',
                '--package=@nocobase/fx-private',
                `--@nocobase:registry=${registry.url}`,
                '--',
                'node',
                '-e',
                'process.exit(0)',
              ],
          registry.url,
          'npm',
          mode === 'npx' ? 'npx' : 'npm',
        );
        expect(result.code).toBe(0);
        expect(asked).toEqual([{ reason: 'unauthorized', pkg: undefined }]);
        expect(
          registry.seen.filter((request) => request.auth === undefined),
        ).toHaveLength(1);
        expect(result.output).not.toContain(TOKEN);
        expect(result.output).toContain('Unable to authenticate');
        expect(result.output).not.toMatch(/401 Unauthorized - GET/u);
        expect(
          leftovers(target).every((name) => name.startsWith('nocobase-scope-')),
        ).toBe(true);
      } finally {
        await server.close();
        await registry.stop();
      }
    },
  );

  it.each(['valid', 'invalid'])(
    'does not retry an outer create after its nested npm handled a %s token',
    async (mode) => {
      const registry = new Registry(
        scratch,
        ['@nocobase/fx-private'],
        TOKEN,
        401,
      );
      await registry.start();
      const target = project({});
      const bin = path.join(target.dir, 'bin');
      await writeRunnerTools(
        bin,
        undefined,
        process.execPath,
        process.env.PATH,
      );
      const script = path.join(target.dir, 'create.cjs');
      writeFileSync(
        script,
        `const fs=require('node:fs'); const {spawnSync}=require('node:child_process');
process.chdir(${JSON.stringify(target.dir)});
fs.appendFileSync('outer-attempts', '1');
const result=spawnSync('npm', ['pack', '@nocobase/fx-private', '--loglevel=error', '--@nocobase:registry=${registry.url}'], {stdio:'inherit',env:process.env});
process.exit(result.status ?? 1);`,
      );
      const { server, asked } = await worker(
        mode === 'valid' ? TOKEN : 'invalid-token',
      );
      try {
        const code = await launch({
          tool: 'pnpm',
          command: [process.execPath, script],
          args: [],
          cwd: target.dir,
          env: {
            PATH: `${bin}${path.delimiter}${process.env.PATH}`,
            HOME: target.home,
            NPM_CONFIG_USERCONFIG: path.join(target.home, '.npmrc'),
            XDG_CONFIG_HOME: path.join(target.home, '.config'),
            [NPM_DIR_ENV]: target.npmDir,
            [PRIVATE_REGISTRY_ENV]: registry.url,
            NOCOBASE_RUNNER_GIT_CREDENTIAL_SOCKET: server.socket,
            NOCOBASE_RUNNER_GIT_CREDENTIAL_NONCE: server.nonce,
          },
        });
        expect(code === 0).toBe(mode === 'valid');
        expect(
          readFileSync(path.join(target.dir, 'outer-attempts'), 'utf8'),
        ).toBe('1');
        expect(asked).toHaveLength(1);
        expect(
          registry.seen.filter((request) => request.auth === undefined),
        ).toHaveLength(1);
        if (mode === 'invalid') expect(registry.seen).toHaveLength(2);
        expect(
          leftovers(target).every((name) => name.startsWith('nocobase-scope-')),
        ).toBe(true);
      } finally {
        await server.close();
        await registry.stop();
      }
    },
  );

  it.each(['reported path', 'symlink'])(
    'ignores stale and unrelated npm logs reached through a %s',
    async (mode) => {
      const target = project({});
      const stale = path.join(target.dir, 'stale-debug-0.log');
      writeFileSync(
        stale,
        `1 http fetch GET 401 ${privateRegistry.url}@nocobase/x secret-value\n`,
      );
      const script = path.join(target.dir, 'error.cjs');
      writeFileSync(
        script,
        `const fs=require('node:fs'); const path=require('node:path');
if (${JSON.stringify(mode)} === 'symlink') fs.symlinkSync(${JSON.stringify(stale)},path.join(process.env.NPM_CONFIG_LOGS_DIR,'fake-debug-0.log'));
console.error('npm error code E401'); console.error('A complete log of this run can be found in: '+${JSON.stringify(stale)}); process.exit(8);`,
      );
      const { server, asked } = await worker(TOKEN);
      try {
        const code = await launch({
          tool: 'npm',
          command: [process.execPath, script],
          args: [],
          cwd: target.dir,
          env: {
            NPM_CONFIG_USERCONFIG: path.join(target.home, '.npmrc'),
            [NPM_DIR_ENV]: target.npmDir,
            [PRIVATE_REGISTRY_ENV]: privateRegistry.url,
            NOCOBASE_RUNNER_GIT_CREDENTIAL_SOCKET: server.socket,
            NOCOBASE_RUNNER_GIT_CREDENTIAL_NONCE: server.nonce,
          },
        });
        expect(code).toBe(8);
        expect(asked).toEqual([]);
        expect(leftovers(target)).toEqual([]);
      } finally {
        await server.close();
      }
    },
  );
  it('keeps credentials only in private temporary config files, never the child environment', () => {
    const target = project({});
    const config = writeRunConfig({
      tool: 'pnpm',
      dir: target.npmDir,
      registry: privateRegistry.url,
      token: TOKEN,
      scope: true,
      env: {
        HOME: target.home,
        NPM_CONFIG_USERCONFIG: path.join(target.home, '.npmrc'),
        XDG_CONFIG_HOME: path.join(target.home, '.config'),
      },
    });
    try {
      expect(JSON.stringify(config.env)).not.toContain(TOKEN);
      expect(
        config.files.every((file) =>
          file.startsWith(`${target.npmDir}${path.sep}`),
        ),
      ).toBe(true);
      const file = config.env.NPM_CONFIG_USERCONFIG!;
      expect(statSync(file).mode & 0o777).toBe(0o600);
      expect(readFileSync(file, 'utf8')).toContain(`:_authToken=${TOKEN}`);
    } finally {
      for (const file of config.files)
        rmSync(file, { recursive: true, force: true });
    }
    expect(leftovers(target)).toEqual([]);
  });

  it('returns the second exit code without putting the token on its command line or environment', async () => {
    const target = project({});
    const script = path.join(target.dir, 'command.cjs');
    writeFileSync(
      script,
      `const fs = require('node:fs');
const config = fs.readFileSync(process.env.NPM_CONFIG_USERCONFIG, 'utf8');
if (JSON.stringify({argv:process.argv,env:process.env}).includes(${JSON.stringify(TOKEN)})) process.exit(99);
if (!config.includes(':_authToken=')) { console.error('ERR_PNPM_FETCH_401 GET ${privateRegistry.url}@nocobase/x: Unauthorized - 401'); process.exit(8); }
if (!config.includes('@nocobase:registry=${privateRegistry.url}')) process.exit(98);
process.exit(23);
`,
    );
    const { server, asked } = await worker(TOKEN);
    try {
      const code = await launch({
        tool: 'pnpm',
        command: [process.execPath, script],
        args: [],
        cwd: target.dir,
        env: {
          PATH: process.env.PATH,
          NPM_CONFIG_USERCONFIG: path.join(target.home, '.npmrc'),
          XDG_CONFIG_HOME: path.join(target.home, '.config'),
          [NPM_DIR_ENV]: target.npmDir,
          [PRIVATE_REGISTRY_ENV]: privateRegistry.url,
          NOCOBASE_RUNNER_GIT_CREDENTIAL_SOCKET: server.socket,
          NOCOBASE_RUNNER_GIT_CREDENTIAL_NONCE: server.nonce,
        },
      });
      expect(code).toBe(23);
      expect(asked).toEqual([{ reason: 'unauthorized', pkg: undefined }]);
      expect(
        leftovers(target).filter((file) => !file.startsWith('nocobase-scope-')),
      ).toEqual([]);
    } finally {
      await server.close();
    }
  });

  beforeAll(async () => {
    await mirror.start();
    await privateRegistry.start();
    return async () => {
      await mirror.stop();
      await privateRegistry.stop();
    };
  });

  it.each([401, 403])(
    'retries a private HTTP %i once without a project npmrc, for npm and pnpm',
    async (status) => {
      const registry = new Registry(
        scratch,
        ['@nocobase/fx-private'],
        TOKEN,
        status,
      );
      await registry.start();
      try {
        for (const tool of ['npm', 'pnpm'] as const) {
          const target = project({ '@nocobase/fx-private': '1.0.0' });
          const { server, asked } = await worker(TOKEN);
          try {
            const result = await install(
              target,
              server,
              {},
              ['install', `--@nocobase:registry=${registry.url}`],
              registry.url,
              tool,
            );
            expect(result).toMatchObject({ code: 0 });
            expect(asked).toEqual([{ reason: 'unauthorized', pkg: undefined }]);
            expect(
              registry.seen.some((request) => request.auth === undefined),
            ).toBe(true);
            expect(
              registry.seen.some(
                (request) => request.auth === `Bearer ${TOKEN}`,
              ),
            ).toBe(true);
            expect(result.output).not.toContain(TOKEN);
            expect(leftovers(target)).toHaveLength(1);
          } finally {
            await server.close();
          }
        }
      } finally {
        await registry.stop();
      }
    },
  );

  it.each([401, 403])(
    'does not request a token for another registry returning HTTP %i',
    async (status) => {
      const registry = new Registry(scratch, [], TOKEN, status);
      await registry.start();
      const target = project({ '@nocobase/fx-private': '1.0.0' });
      const { server, asked } = await worker(TOKEN);
      try {
        for (const tool of ['pnpm', 'npm'] as const) {
          const result = await install(
            target,
            server,
            {},
            ['install', `--@nocobase:registry=${registry.url}`],
            privateRegistry.url,
            tool,
          );
          expect(result.code).not.toBe(0);
          expect(asked).toEqual([]);
          expect(
            registry.seen.every((request) => request.auth === undefined),
          ).toBe(true);
          expect(leftovers(target)).toEqual([]);
        }
      } finally {
        await server.close();
        await registry.stop();
      }
    },
  );

  it('never requests credentials for another registry behind an npx Bearer challenge', async () => {
    const registry = new Registry(scratch, [], TOKEN, 401);
    await registry.start();
    const target = project({});
    const { server, asked } = await worker(TOKEN);
    try {
      const result = await install(
        target,
        server,
        {},
        [
          '--yes',
          '--package=@nocobase/fx-private',
          `--@nocobase:registry=${registry.url}`,
          '--',
          'node',
          '-e',
          'process.exit(0)',
        ],
        privateRegistry.url,
        'npm',
        'npx',
      );
      expect(result.code).not.toBe(0);
      expect(asked).toEqual([]);
      expect(registry.seen.every((request) => request.auth === undefined)).toBe(
        true,
      );
      expect(leftovers(target)).toEqual([]);
    } finally {
      await server.close();
      await registry.stop();
    }
  });

  it.each([null, 'invalid-token'])(
    'stops after an unauthorized request with token %s',
    async (token) => {
      const registry = new Registry(scratch, [], TOKEN, 401);
      await registry.start();
      const target = project({ '@nocobase/fx-private': '1.0.0' });
      const { server, asked } = await worker(token);
      try {
        for (const tool of ['pnpm', 'npm'] as const) {
          registry.seen.splice(0);
          for (const name of leftovers(target))
            rmSync(path.join(target.npmDir, name), {
              recursive: true,
              force: true,
            });
          const result = await install(
            target,
            server,
            {},
            ['install', `--@nocobase:registry=${registry.url}`],
            registry.url,
            tool,
          );
          expect(result.code).not.toBe(0);
          expect(asked).toEqual([{ reason: 'unauthorized', pkg: undefined }]);
          expect(registry.seen).toHaveLength(token === null ? 1 : 2);
          expect(result.output).toContain('Settings › License');
          expect(result.output).toContain(
            token === null ? 'no token is configured' : 'refused the token',
          );
          expect(result.output).not.toContain('invalid-token');
          expect(
            leftovers(target).filter(
              (file) => !file.startsWith('nocobase-scope-'),
            ),
          ).toEqual([]);
          asked.splice(0);
        }
      } finally {
        await server.close();
        await registry.stop();
      }
    },
  );

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

  it('keeps out private registry settings written with environment variables, in ~/.npmrc and pnpm’s auth.ini', async () => {
    const port = new URL(privateRegistry.url).port;
    const target = project(
      { '@nocobase/fx-public': '1.0.0', 'left-pad-fx': '1.0.0' },
      {
        userNpmrc: `registry=\${MIRROR}\n@nocobase:registry=\${PRIVATE_REGISTRY}\n`,
        authIni: `@nocobase:registry=\${PRIVATE_HOST}/\n//\${PRIVATE_HOST_ONLY}/:_authToken=stale\n`,
      },
    );
    const { server, asked } = await worker(TOKEN);
    try {
      const result = await install(target, server, {
        MIRROR: mirror.url,
        PRIVATE_REGISTRY: privateRegistry.url.replace(/\/$/u, ''),
        PRIVATE_HOST: `HTTP://127.0.0.1:${port}`,
        PRIVATE_HOST_ONLY: `127.0.0.1:${port}`,
      });
      expect({ code: result.code, output: result.output }).toMatchObject({
        code: 0,
      });
      expect(asked).toEqual([]);
      expect(privateRequests()).toEqual([]);
      expect(mirrorRequests().map((seen) => seen.url)).toContain(
        '/@nocobase/fx-public',
      );
      expect(leftovers(target)).toEqual([]);
    } finally {
      await server.close();
    }
  });

  it('keeps out private registry settings with quoted keys, in ~/.npmrc and pnpm’s auth.ini', async () => {
    const port = new URL(privateRegistry.url).port;
    const target = project(
      { '@nocobase/fx-public': '1.0.0', 'left-pad-fx': '1.0.0' },
      {
        userNpmrc: `registry=${mirror.url}\n"@nocobase:registry"=${privateRegistry.url}\n`,
        authIni: `'@nocobase:registry' = "${privateRegistry.url}"\n"//127.0.0.1:${port}/:_authToken"=stale\n`,
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
      expect(leftovers(target)).toEqual([]);
    } finally {
      await server.close();
    }
  });

  it('keeps out private registry settings on lines ended by a lone CR, in ~/.npmrc and pnpm’s auth.ini', async () => {
    const port = new URL(privateRegistry.url).port;
    const target = project(
      { '@nocobase/fx-public': '1.0.0', 'left-pad-fx': '1.0.0' },
      {
        userNpmrc: `registry=${mirror.url}\r@nocobase:registry=${privateRegistry.url}\r`,
        authIni: `strict-ssl=false\r\n@acme:registry=${privateRegistry.url}\r//127.0.0.1:${port}/:_authToken=stale\n`,
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
      expect(leftovers(target)).toEqual([]);
    } finally {
      await server.close();
    }
  });

  it('uses the private registry after a 404 only for the repository that needed it', async () => {
    const needing = project({ '@nocobase/fx-private': '1.0.0' });
    const other = {
      ...project({ '@nocobase/fx-public': '1.0.0', 'left-pad-fx': '1.0.0' }),
      npmDir: needing.npmDir,
    };
    const { server, asked } = await worker(TOKEN);
    try {
      const first = await install(needing, server);
      expect({ code: first.code, output: first.output }).toMatchObject({
        code: 0,
      });
      expect(asked).toEqual([
        { reason: 'notFound', pkg: '@nocobase/fx-private' },
      ]);
      privateRequests();
      mirrorRequests();

      // Another repository of the same run starts from the default registry again.
      const second = await install(other, server);
      expect({ code: second.code, output: second.output }).toMatchObject({
        code: 0,
      });
      expect(asked).toHaveLength(1);
      expect(privateRequests()).toEqual([]);
      expect(mirrorRequests().map((seen) => seen.url)).toContain(
        '/@nocobase/fx-public',
      );

      // The repository that needed it goes to the private registry at once.
      rmSync(path.join(needing.dir, 'node_modules'), {
        recursive: true,
        force: true,
      });
      const again = await install(needing, server);
      expect({ code: again.code, output: again.output }).toMatchObject({
        code: 0,
      });
      expect(again.output).not.toContain('retrying');
      expect(asked).toEqual([
        { reason: 'notFound', pkg: '@nocobase/fx-private' },
        { reason: 'notFound', pkg: undefined },
      ]);
      expect(leftovers(needing)).toHaveLength(1);
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
      expect(leftovers(target)).toEqual([
        expect.stringMatching(/^nocobase-scope-[0-9a-f]{16}$/u),
      ]);
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

  it('reads a declaration with a quoted key in the repository’s .npmrc', async () => {
    const target = project(
      { '@nocobase/fx-private': '1.0.0' },
      { npmrc: `"@nocobase:registry"="${privateRegistry.url}"\n` },
    );
    const { server, asked } = await worker(TOKEN);
    try {
      const result = await install(target, server);
      expect({ code: result.code, output: result.output }).toMatchObject({
        code: 0,
      });
      expect(asked).toEqual([{ reason: 'declared', pkg: undefined }]);
      expect(result.output).not.toContain('retrying');
      expect(privateRequests().length).toBeGreaterThan(0);
    } finally {
      await server.close();
    }
  });

  it('reads a declaration on a line ended by a lone CR in the repository’s .npmrc', async () => {
    const target = project(
      { '@nocobase/fx-private': '1.0.0' },
      {
        npmrc: `auto-install-peers=true\r@nocobase:registry=${privateRegistry.url}\r`,
      },
    );
    const { server, asked } = await worker(TOKEN);
    try {
      const result = await install(target, server);
      expect({ code: result.code, output: result.output }).toMatchObject({
        code: 0,
      });
      expect(asked).toEqual([{ reason: 'declared', pkg: undefined }]);
      expect(result.output).not.toContain('retrying');
      expect(privateRequests().length).toBeGreaterThan(0);
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
