// @vitest-environment node
/**
 * The install script with the universal tarballs, which carry no Node: it checks the machine's `node` before
 * downloading, links the installation's `node` to it for the service, and with `--runner` warns about a missing `pnpm`.
 * Run for real against the distribution routes, on a PATH that holds only the tools the script needs and a stand-in
 * `node` of the version a test chooses.
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
const root = mkdtempSync(path.join(os.tmpdir(), 'agents-install-universal-'));

/** The commands the script runs, linked into a directory of their own so that no `node` or `pnpm` comes along. */
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
  'uname',
  'id',
  'sleep',
  'dirname',
  'basename',
  'readlink',
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

/** A directory with a stand-in `node` that says it is `version`. */
function nodeDir(version: string): string {
  const dir = path.join(root, `node-${version}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'node'), `#!/bin/sh\necho ${version}\n`);
  chmodSync(path.join(dir, 'node'), 0o755);
  return dir;
}

/** The universal tarball of `product`, whose command logs its arguments and answers `status --json` as running. */
function buildUniversal(
  product: string,
  version: string,
): { file: string; sha256: string } {
  const staging = path.join(root, `stand-in-${product}`, product);
  mkdirSync(path.join(staging, 'bin'), { recursive: true });
  const bin = path.join(staging, 'bin', product);
  writeFileSync(
    bin,
    [
      '#!/bin/sh',
      `echo "${product} $*" >> "$STAND_IN_LOG"`,
      'case "${1:-} ${2:-}" in',
      '  "status --json") printf \'{\\n  "running": true,\\n  "apps": [{ "server": "%s" }]\\n}\\n\' "$STAND_IN_SERVER" ;;',
      'esac',
      '',
    ].join('\n'),
  );
  chmodSync(bin, 0o755);
  const name = `${product}-v${version}-universal.tar.gz`;
  const dir = path.join(root, 'dist', 'stable', product, version);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  execFileSync('tar', ['-czf', file, '-C', path.dirname(staging), product]);
  const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
  writeFileSync(
    path.join(root, 'dist', 'stable', product, 'manifest.json'),
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
  return { file, sha256 };
}

let harness: Harness;
let server: Server;
let base = '';
let tools = '';

beforeAll(async () => {
  buildUniversal('acme', '0.8.0');
  buildUniversal(RUNNER_PRODUCT, '0.3.0');
  tools = toolsDir();
  harness = await createHarness({ dist: { dir: path.join(root, 'dist') } });
  const app = new Hono();
  app.route('/api', harness.app);
  app.route('/api/agents/dist', createInstallRoutes({ cli: () => 'acme' }));
  server = createServer((request, response) => {
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
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await harness.close();
  rmSync(root, { recursive: true, force: true });
});

/** Runs the script with `nodeVersion` as the `node` on PATH, or none. */
async function install(
  args: readonly string[],
  nodeVersion: string | null,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const script = path.join(root, 'install.sh');
  writeFileSync(script, installScript({ cli: 'acme' }));
  const searchPath = [
    ...(nodeVersion === null ? [] : [nodeDir(nodeVersion)]),
    tools,
  ].join(':');
  try {
    const { stdout, stderr } = await execFileAsync(
      path.join(tools, 'sh'),
      [script, '--server', base, ...args],
      {
        env: {
          PATH: searchPath,
          HOME: path.join(root, 'home'),
          STAND_IN_LOG: path.join(root, 'calls.log'),
          STAND_IN_SERVER: base,
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

const downloadToken = async () =>
  (await harness.services.downloadTokens.create('someone')).token;

describe('install script with a universal package', () => {
  it('stops before downloading when node is missing, saying how to install it', async () => {
    const prefix = path.join(root, 'no-node');
    const result = await install(
      ['--token', await downloadToken(), '--prefix', prefix],
      null,
    );
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      'acme needs Node.js 24 or newer, and node is not on PATH.',
    );
    expect(result.stderr).toContain('https://nodejs.org/en/download');
    expect(result.stdout).not.toContain('Downloading');
    expect(existsSync(prefix)).toBe(false);
  });

  it('stops before downloading when node is older than 24', async () => {
    const prefix = path.join(root, 'old-node');
    const result = await install(
      ['--token', await downloadToken(), '--prefix', prefix],
      '22.11.0',
    );
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('acme needs Node.js 24 or newer;');
    expect(result.stderr).toContain('is 22.11.0.');
    expect(existsSync(prefix)).toBe(false);
  });

  it("installs on the machine's Node.js 24 and links the installation's node to it", async () => {
    const prefix = path.join(root, 'cli');
    const binDir = path.join(root, 'cli-bin');
    const result = await install(
      [
        '--token',
        await downloadToken(),
        '--prefix',
        prefix,
        '--bin-dir',
        binDir,
      ],
      '24.3.0',
    );
    expect(result.stderr).not.toContain('acme install:');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      `acme 0.8.0 runs on this machine's Node.js 24.3.0 (${path.join(root, 'node-24.3.0', 'node')}).`,
    );
    expect(result.stdout).toContain('Checksum verified.');
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/0.8.0');
    expect(readlinkSync(path.join(prefix, 'node'))).toBe(
      path.join(root, 'node-24.3.0', 'node'),
    );
  });

  it('warns with --runner when pnpm is missing, and installs the runtime anyway', async () => {
    const token = (
      await harness.services.runners.createRegistrationToken('owner', {})
    ).token;
    const runnerPrefix = path.join(root, 'runner');
    const result = await install(
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
      '25.0.0',
    );
    expect(result.code).toBe(0);
    expect(result.stderr).toContain(
      'Note: pnpm is not on PATH. Runs that install a project\'s dependencies use it; run "corepack enable"',
    );
    expect(readlinkSync(path.join(runnerPrefix, 'node'))).toBe(
      path.join(root, 'node-25.0.0', 'node'),
    );
    expect(readFileSync(path.join(root, 'calls.log'), 'utf8')).toContain(
      `${RUNNER_PRODUCT} register --server ${base} --token ${token} --force`,
    );
  });
});
