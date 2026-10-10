// @vitest-environment node
/**
 * The install script when the application serves no tarball of a product and names its npm package instead
 * (`agents.dist.npm`): it checks the machine's Node.js and npm, runs `npm install` of the exact version into the
 * version directory, writes the launcher beside `node_modules`, and leaves the same `current`, command link and
 * `<prefix>/node` as for a universal tarball. Run for real against the distribution routes, on a PATH that holds only
 * the tools the script needs, a stand-in `node` of the version a test chooses and, when a test wants one, a stand-in
 * `npm` that records how it was called and lays out what npm would.
 */
import { execFile, execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer, type Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { RUNNER_PRODUCT } from '@nocobase/agent-protocol';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createInstallRoutes,
  installScript,
} from '../../server/routes/runners/install.js';
import { createHarness, type Harness } from './harness.js';

const execFileAsync = promisify(execFile);
const root = mkdtempSync(path.join(os.tmpdir(), 'agents-install-npm-'));

const TOOLS = [
  'curl',
  'tar',
  'gzip',
  'sha256sum',
  'shasum',
  'perl',
  'mktemp',
  'sed',
  'head',
  'cut',
  'rm',
  'mkdir',
  'mv',
  'ln',
  'grep',
  'cat',
  'chmod',
  'uname',
  'id',
  'sleep',
  'dirname',
  'basename',
  'readlink',
  'pwd',
  'env',
  'sh',
];

function toolsDir(): string {
  const dir = path.join(root, 'tools');
  mkdirSync(dir, { recursive: true });
  for (const tool of TOOLS) {
    const found = spawnSync('sh', ['-c', `command -v ${tool}`], {
      encoding: 'utf8',
    }).stdout.trim();
    if (found.startsWith('/')) symlinkSync(found, path.join(dir, tool));
  }
  return dir;
}

/** The command a stand-in package provides: logs its arguments and answers `status --json` as running. */
const STAND_IN_COMMAND = [
  '#!/bin/sh',
  'name="$(basename "$0")"',
  'echo "$name $*" >> "$STAND_IN_LOG"',
  'case "${1:-} ${2:-}" in',
  '  "status --json") printf \'{\\n  "running": true,\\n  "apps": [{ "server": "%s" }]\\n}\\n\' "$STAND_IN_SERVER" ;;',
  'esac',
  '',
].join('\n');

/**
 * A directory with a stand-in `node` of `version`: `-p` prints the version, `-e` passes only from 24 on (the
 * launcher's check), and anything else runs the script it is given, as node runs a package's bin.
 */
function nodeDir(version: string): string {
  const dir = path.join(root, `node-${version}`);
  mkdirSync(dir, { recursive: true });
  const major = Number(version.split('.')[0]);
  writeFileSync(
    path.join(dir, 'node'),
    [
      '#!/bin/sh',
      'case "${1:-}" in',
      `  -p) echo ${version} ;;`,
      `  -e) exit ${major >= 24 ? 0 : 1} ;;`,
      '  *) script="$1"; shift; exec sh "$script" "$@" ;;',
      'esac',
      '',
    ].join('\n'),
  );
  chmodSync(path.join(dir, 'node'), 0o755);
  return dir;
}

/**
 * A directory with a stand-in `npm`: it logs its arguments and, for `install --prefix <dir> … <package>@<version>`,
 * lays out `<dir>/node_modules/<package>` with that version and the command it provides linked from
 * `node_modules/.bin`, as npm does. `@acme/cli` provides `acme`, `@nocobase/agent-runner` provides `nocobase-runner`.
 */
function npmDir(): string {
  const dir = path.join(root, 'npm');
  mkdirSync(dir, { recursive: true });
  const command = path.join(root, 'stand-in-command.sh');
  writeFileSync(command, STAND_IN_COMMAND);
  writeFileSync(
    path.join(dir, 'npm'),
    [
      '#!/bin/sh',
      'echo "npm $*" >> "$STAND_IN_LOG"',
      'prefix=""',
      'for arg in "$@"; do',
      '  if [ "$prefix" = next ]; then prefix="$arg"; fi',
      '  if [ "$arg" = --prefix ]; then prefix=next; fi',
      '  spec="$arg"',
      'done',
      'package="${spec%@*}"',
      'version="${spec##*@}"',
      'case "$package" in',
      '  @nocobase/agent-runner) bin=nocobase-runner ;;',
      '  *) bin=acme ;;',
      'esac',
      'mkdir -p "$prefix/node_modules/$package/bin" "$prefix/node_modules/.bin"',
      'printf \'{ "name": "%s", "version": "%s" }\\n\' "$package" "$version" > "$prefix/node_modules/$package/package.json"',
      `cat "${command}" > "$prefix/node_modules/$package/bin/run.js"`,
      'ln -s "../$package/bin/run.js" "$prefix/node_modules/.bin/$bin"',
      '',
    ].join('\n'),
  );
  chmodSync(path.join(dir, 'npm'), 0o755);
  return dir;
}

/** The universal tarball of `product`, so a test can show a product with a tarball is still answered with it. */
function buildUniversal(dist: string, product: string, version: string): void {
  const staging = path.join(root, `stand-in-${product}`, product);
  mkdirSync(path.join(staging, 'bin'), { recursive: true });
  const bin = path.join(staging, 'bin', product);
  writeFileSync(bin, STAND_IN_COMMAND);
  chmodSync(bin, 0o755);
  const name = `${product}-v${version}-universal.tar.gz`;
  const dir = path.join(dist, 'stable', product, version);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  execFileSync('tar', ['-czf', file, '-C', path.dirname(staging), product]);
  const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
  writeFileSync(
    path.join(dist, 'stable', product, 'manifest.json'),
    JSON.stringify({
      schema: 1,
      product,
      versions: {
        [version]: {
          targets: {
            universal: { file: `${version}/${name}`, sha256, size: 1 },
          },
        },
      },
    }),
  );
}

const NPM = {
  acme: { package: '@acme/cli', version: '1.2.3' },
  [RUNNER_PRODUCT]: { package: '@nocobase/agent-runner', version: '0.4.0' },
};

interface Served {
  harness: Harness;
  server: Server;
  base: string;
}

/** An application serving the install routes, with `dist` as its distribution directory and `NPM` as its packages. */
async function serve(dist: string): Promise<Served> {
  mkdirSync(dist, { recursive: true });
  const harness = await createHarness({ dist: { dir: dist, npm: NPM } });
  const app = new Hono();
  app.route('/api', harness.app);
  app.route('/api/agents/dist', createInstallRoutes({ cli: () => 'acme' }));
  const server = createServer((request, response) => {
    void (async () => {
      const answer = await app.fetch(
        new Request(`http://localhost${request.url ?? '/'}`, {
          method: request.method ?? 'GET',
          headers: Object.entries(request.headers).flatMap(([key, value]) =>
            typeof value === 'string' ? [[key, value] as [string, string]] : [],
          ),
        }),
      );
      response.writeHead(answer.status, Object.fromEntries(answer.headers));
      response.end(Buffer.from(await answer.arrayBuffer()));
    })();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    harness,
    server,
    base: `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`,
  };
}

let npmOnly: Served;
let runnerTarball: Served;
let tools = '';
let npm = '';
const log = path.join(root, 'calls.log');

beforeAll(async () => {
  tools = toolsDir();
  npm = npmDir();
  npmOnly = await serve(path.join(root, 'dist-empty'));
  const dist = path.join(root, 'dist-runner');
  buildUniversal(dist, RUNNER_PRODUCT, '0.3.0');
  runnerTarball = await serve(dist);
});

afterAll(async () => {
  for (const served of [npmOnly, runnerTarball]) {
    await new Promise((resolve) => served.server.close(resolve));
    await served.harness.close();
  }
  rmSync(root, { recursive: true, force: true });
});

/** Runs the script against `served` with `nodeVersion` as the `node` on PATH (or none), and the stand-in npm or none. */
async function install(
  served: Served,
  args: readonly string[],
  options: { node: string | null; npm: boolean },
): Promise<{ code: number; stdout: string; stderr: string }> {
  const script = path.join(root, 'install.sh');
  writeFileSync(script, installScript({ cli: 'acme' }));
  const searchPath = [
    ...(options.node === null ? [] : [nodeDir(options.node)]),
    ...(options.npm ? [npm] : []),
    tools,
  ].join(':');
  try {
    const { stdout, stderr } = await execFileAsync(
      path.join(tools, 'sh'),
      [script, '--server', served.base, ...args],
      {
        env: {
          PATH: searchPath,
          HOME: path.join(root, 'home'),
          STAND_IN_LOG: log,
          STAND_IN_SERVER: served.base,
          NOCOBASE_CLI_TARGET: 'linux-arm64',
        },
      },
    );
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failed = error as { code: number; stdout: string; stderr: string };
    return { code: failed.code, stdout: failed.stdout, stderr: failed.stderr };
  }
}

const downloadToken = async (served: Served) =>
  (await served.harness.services.downloadTokens.create('someone')).token;

describe('install script with an npm package', () => {
  it('stops before installing when node is missing or older than 24', async () => {
    const prefix = path.join(root, 'no-node');
    const missing = await install(
      npmOnly,
      ['--token', await downloadToken(npmOnly), '--prefix', prefix],
      { node: null, npm: true },
    );
    expect(missing.code).toBe(1);
    expect(missing.stderr).toContain(
      'acme needs Node.js 24 or newer, and node is not on PATH.',
    );
    const old = await install(
      npmOnly,
      ['--token', await downloadToken(npmOnly), '--prefix', prefix],
      { node: '22.11.0', npm: true },
    );
    expect(old.code).toBe(1);
    expect(old.stderr).toContain('is 22.11.0.');
    expect(existsSync(prefix)).toBe(false);
  });

  it('stops before installing when npm is missing, saying where it comes from', async () => {
    const prefix = path.join(root, 'no-npm');
    const result = await install(
      npmOnly,
      ['--token', await downloadToken(npmOnly), '--prefix', prefix],
      { node: '24.3.0', npm: false },
    );
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      'acme is installed from npm, and npm is not on PATH. npm comes with Node.js',
    );
    expect(existsSync(prefix)).toBe(false);
  });

  it('installs the exact version with npm into the version directory, leaving the layout of a tarball', async () => {
    const prefix = path.join(root, 'cli');
    const binDir = path.join(root, 'cli-bin');
    const result = await install(
      npmOnly,
      [
        '--token',
        await downloadToken(npmOnly),
        '--prefix',
        prefix,
        '--bin-dir',
        binDir,
      ],
      { node: '24.3.0', npm: true },
    );
    expect(result.stderr).not.toContain('acme install:');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      `acme 1.2.3 comes from npm (@acme/cli@1.2.3) and runs on this machine's Node.js 24.3.0`,
    );
    const version = path.join(prefix, 'versions', '1.2.3');
    expect(readFileSync(log, 'utf8')).toContain(
      `npm install --prefix ${version}.partial --no-save --no-audit --no-fund --omit=optional @acme/cli@1.2.3`,
    );
    expect(existsSync(`${version}.partial`)).toBe(false);
    expect(
      JSON.parse(
        readFileSync(
          path.join(version, 'node_modules', '@acme/cli', 'package.json'),
          'utf8',
        ),
      ),
    ).toMatchObject({ version: '1.2.3' });
    expect(readFileSync(path.join(version, 'bin', 'acme'), 'utf8')).toContain(
      'node_modules/.bin/$bin',
    );
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/1.2.3');
    expect(readlinkSync(path.join(prefix, 'node'))).toBe(
      path.join(root, 'node-24.3.0', 'node'),
    );
    expect(readlinkSync(path.join(binDir, 'acme'))).toBe(
      path.join(prefix, 'current', 'bin', 'acme'),
    );
    expect(
      JSON.parse(readFileSync(path.join(prefix, 'install.json'), 'utf8')),
    ).toMatchObject({ mode: 'cli' });

    // The linked command starts the package's bin through the launcher, on the installation's node, with no PATH.
    execFileSync(path.join(binDir, 'acme'), ['whoami'], {
      env: { PATH: tools, STAND_IN_LOG: log },
    });
    expect(readFileSync(log, 'utf8')).toContain('acme whoami');

    // Running it again reuses the installed version.
    const again = await install(
      npmOnly,
      [
        '--token',
        await downloadToken(npmOnly),
        '--prefix',
        prefix,
        '--bin-dir',
        binDir,
      ],
      { node: '24.3.0', npm: true },
    );
    expect(again.code).toBe(0);
    expect(again.stdout).toContain(
      `acme 1.2.3 for linux-arm64 is already installed in ${version}.`,
    );
  });

  it('installs and registers the runner from npm with --runner', async () => {
    const token = (
      await npmOnly.harness.services.runners.createRegistrationToken(
        'owner',
        {},
      )
    ).token;
    const runnerPrefix = path.join(root, 'runner');
    const result = await install(
      npmOnly,
      [
        '--runner',
        '--token',
        token,
        '--prefix',
        path.join(root, 'runner-cli'),
        '--runner-prefix',
        runnerPrefix,
        '--bin-dir',
        path.join(root, 'runner-bin'),
        '--no-service',
      ],
      { node: '24.3.0', npm: true },
    );
    expect(result.stderr).not.toContain('acme install:');
    expect(result.code).toBe(0);
    const calls = readFileSync(log, 'utf8');
    expect(calls).toContain(
      `npm install --prefix ${path.join(runnerPrefix, 'versions', '0.4.0')}.partial --no-save --no-audit --no-fund --omit=optional @nocobase/agent-runner@0.4.0`,
    );
    expect(calls).toContain(
      `${RUNNER_PRODUCT} register --server ${npmOnly.base} --token ${token} --force`,
    );
    expect(readlinkSync(path.join(runnerPrefix, 'current'))).toBe(
      'versions/0.4.0',
    );
    expect(readlinkSync(path.join(runnerPrefix, 'node'))).toBe(
      path.join(root, 'node-24.3.0', 'node'),
    );
  });

  it('still installs the tarball of a product the application serves one of', async () => {
    const token = (
      await runnerTarball.harness.services.runners.createRegistrationToken(
        'owner',
        {},
      )
    ).token;
    const runnerPrefix = path.join(root, 'runner-tarball');
    const result = await install(
      runnerTarball,
      [
        '--runner',
        '--token',
        token,
        '--prefix',
        path.join(root, 'runner-tarball-cli'),
        '--runner-prefix',
        runnerPrefix,
        '--bin-dir',
        path.join(root, 'runner-tarball-bin'),
        '--no-service',
      ],
      { node: '24.3.0', npm: true },
    );
    expect(result.code).toBe(0);
    // The CLI has no tarball there, so it comes from npm; the runner has one, so it is downloaded.
    expect(result.stdout).toContain('acme 1.2.3 comes from npm');
    expect(result.stdout).toContain(
      `Downloading ${RUNNER_PRODUCT} 0.3.0 for linux-arm64`,
    );
    expect(
      existsSync(path.join(runnerPrefix, 'versions', '0.3.0', 'node_modules')),
    ).toBe(false);
  });
});
