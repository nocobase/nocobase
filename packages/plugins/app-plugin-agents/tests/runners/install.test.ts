// @vitest-environment node
/**
 * The install script, run for real against the distribution routes: a stand-in acme tarball is resolved, downloaded,
 * checked and unpacked into a temporary prefix, and the stand-in records what the script asked it to do. By default it
 * installs the CLI alone with a download token; `--runner` ("Add runtime") also registers and starts the runner.
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
  writeFileSync,
} from 'node:fs';
import { createServer, type Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { PROTOCOL_VERSION, RUNNER_PRODUCT } from '@nocobase/agent-protocol';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createInstallRoutes,
  installScript,
} from '../../server/routes/runners/install.js';
import { createHarness, type Harness } from './harness.js';

const execFileAsync = promisify(execFile);
const root = mkdtempSync(path.join(os.tmpdir(), 'agents-install-'));
const target = 'linux-x64';

/**
 * A tarball of `product` whose command logs its arguments (prefixed with its name), answers `status --json` as running
 * and registered with `STAND_IN_SERVER`, and fails `register` when `STAND_IN_REGISTER_FAILS` is set. Its file is
 * relative to the product's directory.
 */
function buildStandIn(
  product: string,
  version: string,
): { file: string; sha256: string } {
  const staging = path.join(root, `stand-in-${product}-${version}`, product);
  mkdirSync(path.join(staging, 'bin'), { recursive: true });
  const bin = path.join(staging, 'bin', product);
  writeFileSync(
    bin,
    [
      '#!/bin/sh',
      `echo "${product} $*" >> "$STAND_IN_LOG"`,
      'case "${1:-} ${2:-}" in',
      '  "status --json") printf \'{\\n  "running": true,\\n  "apps": [{ "server": "%s" }]\\n}\\n\' "$STAND_IN_SERVER" ;;',
      '  "register --server") [ -z "${STAND_IN_REGISTER_FAILS:-}" ] || exit 3 ;;',
      'esac',
      '',
    ].join('\n'),
  );
  chmodSync(bin, 0o755);
  const name = `${product}-v${version}-${target}.tar.gz`;
  const dir = path.join(root, 'dist', 'stable', product, version);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  execFileSync('tar', ['-czf', file, '-C', path.dirname(staging), product]);
  return {
    file: `${version}/${name}`,
    sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
  };
}

let harness: Harness;
let server: Server;
let base = '';

beforeAll(async () => {
  // Each product in a manifest of its own, as `nocobase cli build` writes it.
  const cli = buildStandIn('acme', '0.7.0');
  writeFileSync(
    path.join(root, 'dist', 'stable', 'acme', 'manifest.json'),
    JSON.stringify({
      schema: 1,
      product: 'acme',
      versions: {
        '0.7.0': {
          targets: {
            [target]: { file: cli.file, sha256: cli.sha256, size: 1 },
          },
        },
      },
    }),
  );
  const runner = buildStandIn(RUNNER_PRODUCT, '0.2.0');
  writeFileSync(
    path.join(root, 'dist', 'stable', RUNNER_PRODUCT, 'manifest.json'),
    JSON.stringify({
      schema: 1,
      product: RUNNER_PRODUCT,
      versions: {
        '0.2.0': {
          targets: {
            [target]: { file: runner.file, sha256: runner.sha256, size: 1 },
          },
        },
      },
    }),
  );
  harness = await createHarness({
    dist: { dir: path.join(root, 'dist') },
  });
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

async function install(
  args: readonly string[],
  env: Record<string, string> = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  const script = path.join(root, 'install.sh');
  writeFileSync(script, installScript({ cli: 'acme' }));
  try {
    const { stdout, stderr } = await execFileAsync('sh', [script, ...args], {
      env: {
        PATH: process.env.PATH ?? '/usr/bin:/bin',
        HOME: path.join(root, 'home'),
        STAND_IN_LOG: path.join(root, 'calls.log'),
        STAND_IN_SERVER: base,
        NOCOBASE_CLI_TARGET: target,
        ...env,
      },
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failed = error as { code: number; stdout: string; stderr: string };
    return { code: failed.code, stdout: failed.stdout, stderr: failed.stderr };
  }
}

const newToken = async () =>
  (await harness.services.runners.createRegistrationToken('owner', {})).token;

describe('install script', () => {
  it('is served as a POSIX shell script that passes shellcheck', async () => {
    const response = await createInstallRoutes({
      cli: () => 'acme',
    }).request('/installScript');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain(
      'text/x-shellscript',
    );
    const script = await response.text();
    execFileSync('sh', ['-n'], { input: script });
    // shellcheck runs where it is installed (CI images may lack it); `sh -n` always does.
    if (spawnSync('shellcheck', ['--version']).status === 0) {
      const checked = spawnSync('shellcheck', ['-s', 'sh', '-'], {
        input: script,
        encoding: 'utf8',
      });
      expect(checked.stdout).toBe('');
      expect(checked.status).toBe(0);
    }
  });

  it('refuses missing arguments and a bad token, installing nothing', async () => {
    expect((await install(['--server', base])).code).toBe(2);
    const prefix = path.join(root, 'refused');
    const refused = await install([
      '--runner',
      '--server',
      base,
      '--token',
      'not-a-token',
      '--prefix',
      prefix,
    ]);
    expect(refused.code).toBe(1);
    expect(refused.stderr).toContain('answered 401');
    expect(existsSync(prefix)).toBe(false);
  });

  it('prints what it would do in a dry run, and changes nothing', async () => {
    const token = await newToken();
    const prefix = path.join(root, 'dry');
    const runnerPrefix = path.join(root, 'dry-runner');
    const result = await install([
      '--runner',
      '--server',
      `${base}/`,
      '--token',
      token,
      '--prefix',
      prefix,
      '--runner-prefix',
      runnerPrefix,
      '--bin-dir',
      path.join(root, 'dry-bin'),
      '--dry-run',
    ]);
    expect(result.stderr).toBe('');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      `+ curl -fSL --progress-bar -H x-nocobase-registration-token: ${token}`,
    );
    expect(result.stdout).toContain(`Downloading acme 0.7.0 for ${target}`);
    expect(result.stdout).toContain(
      `Downloading ${RUNNER_PRODUCT} 0.2.0 for ${target}`,
    );
    expect(result.stdout).toContain(
      `+ ${runnerPrefix}/current/bin/${RUNNER_PRODUCT} register --server ${base} --token ${token} --force`,
    );
    expect(result.stdout).toContain(
      `+ ${runnerPrefix}/current/bin/${RUNNER_PRODUCT} service install`,
    );
    expect(existsSync(prefix)).toBe(false);
    expect(existsSync(runnerPrefix)).toBe(false);
    expect(existsSync(path.join(root, 'dry-bin'))).toBe(false);
  });

  it('names the platforms there are when this one has no build', async () => {
    const result = await install(
      [
        '--runner',
        '--server',
        base,
        '--token',
        await newToken(),
        '--prefix',
        path.join(root, 'other'),
      ],
      { NOCOBASE_CLI_TARGET: 'freebsd-x64' },
    );
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      'acme 0.7.0 is not built for freebsd-x64; it is for linux-x64.',
    );
  });

  it('installs, registers and starts the service, and is safe to run again', async () => {
    const token = await newToken();
    const prefix = path.join(root, 'prefix');
    const runnerPrefix = path.join(root, 'runner-prefix');
    const binDir = path.join(root, 'bin');
    const log = path.join(root, 'calls.log');
    rmSync(log, { force: true });
    const args = [
      '--runner',
      '--server',
      base,
      '--token',
      token,
      '--prefix',
      prefix,
      '--runner-prefix',
      runnerPrefix,
      '--bin-dir',
      binDir,
      '--label',
      'com.example.test-runner',
      '--name',
      'Studio Mac',
    ];
    const first = await install(args);
    expect(first.stderr).not.toContain('acme install:');
    expect(first.code).toBe(0);
    expect(first.stdout).toContain('Checksum verified.');
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/0.7.0');
    expect(readlinkSync(path.join(binDir, 'acme'))).toBe(
      `${prefix}/current/bin/acme`,
    );
    expect(
      JSON.parse(readFileSync(path.join(prefix, 'install.json'), 'utf8')),
    ).toEqual({ prefix, binLink: path.join(binDir, 'acme'), mode: 'cli' });
    expect(readlinkSync(path.join(runnerPrefix, 'current'))).toBe(
      'versions/0.2.0',
    );
    expect(readlinkSync(path.join(binDir, RUNNER_PRODUCT))).toBe(
      `${runnerPrefix}/current/bin/${RUNNER_PRODUCT}`,
    );
    expect(
      JSON.parse(readFileSync(path.join(runnerPrefix, 'install.json'), 'utf8')),
    ).toEqual({
      prefix: runnerPrefix,
      binLink: path.join(binDir, RUNNER_PRODUCT),
      mode: 'runner',
    });
    expect(readFileSync(log, 'utf8').split('\n')).toEqual(
      expect.arrayContaining([
        `${RUNNER_PRODUCT} register --server ${base} --token ${token} --force --name Studio Mac`,
        `${RUNNER_PRODUCT} service install --label com.example.test-runner`,
        `${RUNNER_PRODUCT} status --json`,
        `${RUNNER_PRODUCT} status`,
      ]),
    );

    // The same command again once the runner used the token: the installed runner and its registration are kept,
    // and the service is installed again.
    await harness.request('POST', '/agents/runners/register', {
      body: {
        registrationToken: token,
        name: 'Studio Mac',
        hostname: 'studio',
        os: 'linux',
        arch: 'x64',
        version: '0.7.0',
        protocolVersion: PROTOCOL_VERSION,
        features: [],
        tools: [],
      },
    });
    rmSync(log, { force: true });
    const again = await install(args);
    expect(again.stderr).not.toContain('acme install:');
    expect(again.code).toBe(0);
    expect(again.stdout).toContain('The token was used already');
    const calls = readFileSync(log, 'utf8');
    expect(calls).not.toContain(`${RUNNER_PRODUCT} register`);
    expect(calls).toContain(
      `${RUNNER_PRODUCT} service install --label com.example.test-runner`,
    );

    // A new token on a host already installed reuses the version and registers again.
    rmSync(log, { force: true });
    const fresh = await install([
      ...args.slice(0, 4),
      await newToken(),
      ...args.slice(5),
    ]);
    expect(fresh.code).toBe(0);
    expect(fresh.stdout).toContain(
      'acme 0.7.0 for linux-x64 is already installed',
    );
    expect(fresh.stdout).toContain(
      `${RUNNER_PRODUCT} 0.2.0 for linux-x64 is already installed`,
    );
    expect(readFileSync(log, 'utf8')).toContain(
      `${RUNNER_PRODUCT} register --server`,
    );
  });

  it('installs a runtime of an application that serves no CLI', async () => {
    const script = path.join(root, 'no-cli.sh');
    writeFileSync(script, installScript({ cli: 'other' }));
    const runnerPrefix = path.join(root, 'no-cli-runner');
    const { stdout } = await execFileAsync(
      'sh',
      [
        script,
        '--runner',
        '--server',
        base,
        '--token',
        await newToken(),
        '--prefix',
        path.join(root, 'no-cli'),
        '--runner-prefix',
        runnerPrefix,
        '--bin-dir',
        path.join(root, 'no-cli-bin'),
        '--no-service',
      ],
      {
        env: {
          PATH: process.env.PATH ?? '/usr/bin:/bin',
          HOME: path.join(root, 'home'),
          STAND_IN_LOG: path.join(root, 'calls.log'),
          STAND_IN_SERVER: base,
          NOCOBASE_CLI_TARGET: target,
        },
      },
    );
    expect(stdout).toContain(`${base} serves no other CLI`);
    expect(existsSync(path.join(root, 'no-cli'))).toBe(false);
    expect(readlinkSync(path.join(runnerPrefix, 'current'))).toBe(
      'versions/0.2.0',
    );
  });

  it('rejects a download that does not match its checksum', async () => {
    const manifestFile = path.join(
      root,
      'dist',
      'stable',
      'acme',
      'manifest.json',
    );
    const manifest = readFileSync(manifestFile, 'utf8');
    writeFileSync(
      manifestFile,
      manifest.replace(
        /"sha256":"[0-9a-f]{64}"/u,
        `"sha256":"${'0'.repeat(64)}"`,
      ),
    );
    try {
      const prefix = path.join(root, 'tampered');
      const result = await install([
        '--runner',
        '--server',
        base,
        '--token',
        await newToken(),
        '--prefix',
        prefix,
      ]);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('does not match its SHA-256');
      expect(existsSync(path.join(prefix, 'current'))).toBe(false);
    } finally {
      writeFileSync(manifestFile, manifest);
    }
  });
});

describe('install script, the CLI alone', () => {
  const downloadToken = async () =>
    (await harness.services.downloadTokens.create('owner')).token;

  it('installs the CLI with a download token, registers nothing and says how to sign in', async () => {
    const prefix = path.join(root, 'cli');
    const binDir = path.join(root, 'cli-bin');
    const log = path.join(root, 'calls.log');
    rmSync(log, { force: true });
    const result = await install([
      '--server',
      base,
      '--token',
      await downloadToken(),
      '--prefix',
      prefix,
      '--bin-dir',
      binDir,
    ]);
    expect(result.stderr).not.toContain('acme install:');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Checksum verified.');
    expect(result.stdout).toContain(`Next: acme login --server ${base}`);
    expect(result.stdout).toContain(`Add ${binDir} to your PATH`);
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/0.7.0');
    expect(readlinkSync(path.join(binDir, 'acme'))).toBe(
      `${prefix}/current/bin/acme`,
    );
    expect(
      JSON.parse(readFileSync(path.join(prefix, 'install.json'), 'utf8')),
    ).toEqual({ prefix, binLink: path.join(binDir, 'acme'), mode: 'cli' });
    expect(existsSync(log)).toBe(false);

    // Again with a token that is used up: what is installed is kept.
    const again = await install([
      '--server',
      base,
      '--token',
      'fgdl_spent_spent_spent_spent_spent',
      '--prefix',
      prefix,
      '--bin-dir',
      binDir,
    ]);
    expect(again.code).toBe(0);
    expect(again.stdout).toContain('acme is installed in');
  });

  it('defaults --server to the address it was served from', async () => {
    const mounted = new Hono().route(
      '/app/api/agents/dist',
      createInstallRoutes({ cli: () => 'acme' }),
    );
    const response = await mounted.request(
      'http://acme.example.com/app/api/agents/dist/installScript',
      { headers: { 'x-forwarded-proto': 'https' } },
    );
    expect(await response.text()).toContain(
      'server="https://acme.example.com/app"',
    );
    // Behind the host, the route sees the path without the base path; the application says what it is.
    const configured = await createInstallRoutes({
      cli: () => 'acme',
      publicBasePath: '/main',
      publicOrigin: () => 'https://acme.example.com',
    }).request('http://127.0.0.1:13000/installScript');
    expect(await configured.text()).toContain(
      'server="https://acme.example.com/main"',
    );
    expect(
      installScript({
        cli: 'acme',
        server: 'https://evil.example.com/"; rm -rf ~; "',
      }),
    ).toContain('server=""');
    expect(() => installScript({ cli: 'acme; rm -rf ~' })).toThrow();
    expect(() => installScript({ cli: RUNNER_PRODUCT })).toThrow();

    const prefix = path.join(root, 'served');
    const served = path.join(root, 'served.sh');
    writeFileSync(served, installScript({ cli: 'acme', server: base }));
    const { stdout } = await execFileAsync(
      'sh',
      [
        served,
        '--token',
        await downloadToken(),
        '--prefix',
        prefix,
        '--dry-run',
      ],
      {
        env: {
          PATH: process.env.PATH ?? '/usr/bin:/bin',
          HOME: path.join(root, 'home'),
          NOCOBASE_CLI_TARGET: target,
        },
      },
    );
    expect(stdout).toContain(
      `+ curl -fSL --progress-bar -H x-nocobase-download-token:`,
    );
    expect(stdout).toContain(`Next: acme login --server ${base}`);
    expect(existsSync(prefix)).toBe(false);
  });

  it('refuses a token of the other kind before installing anything', async () => {
    const prefix = path.join(root, 'mismatch');
    const withRunner = await install([
      '--runner',
      '--server',
      base,
      '--token',
      await downloadToken(),
      '--prefix',
      prefix,
    ]);
    expect(withRunner.code).toBe(1);
    expect(withRunner.stderr).toContain(
      'This is a download token: it installs the acme CLI only.',
    );
    const withoutRunner = await install([
      '--server',
      base,
      '--token',
      await newToken(),
      '--prefix',
      prefix,
    ]);
    expect(withoutRunner.code).toBe(1);
    expect(withoutRunner.stderr).toContain(
      'This is a runtime registration token: run the command with --runner',
    );
    const runnerFlag = await install([
      '--server',
      base,
      '--token',
      await downloadToken(),
      '--name',
      'x',
      '--prefix',
      prefix,
    ]);
    expect(runnerFlag.code).toBe(1);
    expect(runnerFlag.stderr).toContain('--name applies only with --runner.');
    expect(existsSync(prefix)).toBe(false);
  });
});
