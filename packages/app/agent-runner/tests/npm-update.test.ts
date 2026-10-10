// The runner updating itself from the npm registry, when the application serves no tarball of it and names its npm
// package instead: `npmUpgrade` in heartbeat answers (only to a runner with the `npm` feature) between runs, and the
// npm answer of the resolve route for `nocobase-runner update`. npm is a stand-in that lays out what npm would.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { installNpmVersion } from '@nocobase/app-cli-client/install';

import { readConnections, readSettings } from '../src/lib/config.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { RunnerDaemon, runnerVersion } from '../src/core/loop.ts';
import { NPM_UPGRADE_FEATURE, RUNNER_PRODUCT } from '../src/protocol/index.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import { cli, cliEnv, registerRunner, removeDir, tempDir } from './helpers.ts';

const scratch = tempDir('nocobase-runner-npm-update-');
afterAll(() => removeDir(scratch));

const PACKAGE = '@nocobase/agent-runner';

/**
 * A stand-in `npm` that logs its arguments and, for `install --prefix <prefix> … <package>@<version>`, lays out
 * `<prefix>/node_modules/<package>` at that version with a bin printing `nocobase-runner <version> <arguments>`, linked
 * from `node_modules/.bin/nocobase-runner`. It fails for `@nocobase/missing-runner`, as for a package not published.
 */
function fakeNpm(): { npm: string; log: string } {
  const dir = path.join(scratch, 'npm');
  mkdirSync(dir, { recursive: true });
  const npm = path.join(dir, 'npm');
  const log = path.join(dir, 'npm.log');
  writeFileSync(
    npm,
    [
      '#!/bin/sh',
      `echo "$*" >> "${log}"`,
      'prefix=""',
      'for arg in "$@"; do',
      '  if [ "$prefix" = next ]; then prefix="$arg"; fi',
      '  if [ "$arg" = --prefix ]; then prefix=next; fi',
      '  spec="$arg"',
      'done',
      'package="${spec%@*}"',
      'version="${spec##*@}"',
      'case "$package" in @nocobase/missing-runner) echo "npm error 404 $spec" >&2; exit 1 ;; esac',
      'mkdir -p "$prefix/node_modules/$package/bin" "$prefix/node_modules/.bin"',
      'printf \'{ "name": "%s", "version": "%s" }\\n\' "$package" "$version" > "$prefix/node_modules/$package/package.json"',
      `printf '#!/usr/bin/env node\\nconsole.log(["${RUNNER_PRODUCT}", "%s", ...process.argv.slice(2)].join(" "));\\n' "$version" > "$prefix/node_modules/$package/bin/run.js"`,
      `ln -s "../$package/bin/run.js" "$prefix/node_modules/.bin/${RUNNER_PRODUCT}"`,
      '',
    ].join('\n'),
  );
  chmodSync(npm, 0o755);
  return { npm, log };
}

const { npm, log: npmLog } = fakeNpm();

/** A tarball like the install script unpacks: one top directory with `bin/nocobase-runner`. */
function tarball(version: string): Uint8Array {
  const staging = path.join(scratch, `staging-${version}`);
  mkdirSync(path.join(staging, RUNNER_PRODUCT, 'bin'), { recursive: true });
  const bin = path.join(staging, RUNNER_PRODUCT, 'bin', RUNNER_PRODUCT);
  writeFileSync(bin, `#!/bin/sh\necho ${RUNNER_PRODUCT} ${version} tarball\n`);
  chmodSync(bin, 0o755);
  const file = path.join(staging, 'out.tar.gz');
  execFileSync('tar', ['-czf', file, '-C', staging, RUNNER_PRODUCT]);
  return new Uint8Array(readFileSync(file));
}

const sha256 = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

/** An installation whose current version is the running one, unpacked from a tarball that bundles its Node. */
function archiveInstallation(name: string): string {
  const prefix = path.join(scratch, name);
  const dir = path.join(prefix, 'versions', runnerVersion());
  mkdirSync(path.join(dir, 'bin'), { recursive: true });
  writeFileSync(path.join(dir, 'bin', RUNNER_PRODUCT), '#!/bin/sh\n');
  writeFileSync(path.join(dir, 'bin', 'node'), '#!/bin/sh\n');
  chmodSync(path.join(dir, 'bin', 'node'), 0o755);
  symlinkSync(
    path.join('versions', runnerVersion()),
    path.join(prefix, 'current'),
  );
  return prefix;
}

/** An installation whose current version is the running one, installed from npm, on this Node. */
async function npmInstallation(name: string): Promise<string> {
  const prefix = path.join(scratch, name);
  mkdirSync(prefix, { recursive: true });
  symlinkSync(process.execPath, path.join(prefix, 'node'));
  await installNpmVersion({
    installation: { prefix },
    bin: RUNNER_PRODUCT,
    package: PACKAGE,
    version: runnerVersion(),
    node: process.execPath,
    npm,
  });
  symlinkSync(
    path.join('versions', runnerVersion()),
    path.join(prefix, 'current'),
  );
  return prefix;
}

/** Runs the current version's command with no Node on PATH, as a service started without the shell's PATH would. */
const runCurrent = (prefix: string, ...args: string[]) =>
  execFileSync(path.join(prefix, 'current', 'bin', RUNNER_PRODUCT), args, {
    encoding: 'utf8',
    env: { PATH: '/usr/bin:/bin' },
  }).trim();

describe('updating from npm', () => {
  let server: FakeServer;
  let home: string;
  const previousNpm = process.env.NOCOBASE_NPM;

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-npm-update-home-');
    await registerRunner(server.url, cliEnv(home));
    process.env.NOCOBASE_NPM = npm;
  });
  afterEach(async () => {
    if (previousNpm === undefined) delete process.env.NOCOBASE_NPM;
    else process.env.NOCOBASE_NPM = previousNpm;
    await server.close();
    removeDir(home);
    removeDir(`${home}-work`);
  });

  const paths = () => runnerPaths(home, `${home}-work`);

  async function daemon(
    prefix: string | undefined,
    logs: string[],
  ): Promise<RunnerDaemon> {
    const [connection] = await readConnections(paths());
    if (connection === undefined) throw new Error('Not registered.');
    return new RunnerDaemon({
      paths: paths(),
      settings: await readSettings(paths()),
      connections: [connection],
      adapters: new Map(),
      timings: {
        heartbeatIntervalMs: 100,
        pollTimeoutMs: 200,
        pollFallbackMs: 200,
      },
      log: (message) => logs.push(message),
      ...(prefix === undefined
        ? {}
        : {
            selfUpdate: {
              installation: { prefix, current: path.join(prefix, 'current') },
            },
          }),
    });
  }

  it('moves from a tarball that bundles Node to the npm package between runs', async () => {
    const prefix = archiveInstallation('archive-to-npm');
    server.npmUpgrade = {
      latestVersion: '99.0.0',
      package: PACKAGE,
      reason: 'test',
    };
    const logs: string[] = [];
    const runner = await daemon(prefix, logs);
    await runner.start();
    await runner.wait();
    // The heartbeat declared the feature the server sends npm notices for.
    expect(
      [...server.runners.values()][0]?.heartbeats.at(-1)?.features,
    ).toContain(NPM_UPGRADE_FEATURE);
    expect(runner.updatedTo).toBe('99.0.0');
    const dir = path.join(prefix, 'versions', '99.0.0');
    expect(readFileSync(npmLog, 'utf8')).toContain(
      `install --prefix ${dir}.partial --no-save --no-audit --no-fund --omit=optional ${PACKAGE}@99.0.0`,
    );
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/99.0.0');
    // The npm version has no Node of its own: the one this runner ran on is kept for the service.
    expect(readlinkSync(path.join(prefix, 'node'))).toBe(process.execPath);
    expect(runCurrent(prefix, '--version')).toBe(
      `${RUNNER_PRODUCT} 99.0.0 --version`,
    );
    expect(existsSync(path.join(prefix, 'versions', runnerVersion()))).toBe(
      true,
    );
    expect(logs.join('\n')).toContain(
      `updating to ${RUNNER_PRODUCT} 99.0.0 (${PACKAGE} from npm) once no run is left`,
    );
  });

  it('moves from one npm version to the next', async () => {
    const prefix = await npmInstallation('npm-to-npm');
    server.npmUpgrade = {
      latestVersion: '99.0.1',
      package: PACKAGE,
      reason: 'test',
    };
    const runner = await daemon(prefix, []);
    await runner.start();
    await runner.wait();
    expect(runner.updatedTo).toBe('99.0.1');
    expect(runCurrent(prefix)).toBe(`${RUNNER_PRODUCT} 99.0.1`);
    expect(
      existsSync(
        path.join(prefix, 'versions', runnerVersion(), 'node_modules', PACKAGE),
      ),
    ).toBe(true);
  });

  it('moves from npm to a tarball the application serves again', async () => {
    const prefix = await npmInstallation('npm-to-archive');
    const bytes = tarball('99.0.2');
    server.distFiles.set(`${RUNNER_PRODUCT}/99.0.2/runner.tar.gz`, bytes);
    server.upgrade = {
      minVersion: '0.0.0',
      latestVersion: '99.0.2',
      downloadUrl: `/api/agents/dist/products/${RUNNER_PRODUCT}/versions/99.0.2/files/runner.tar.gz`,
      sha256: sha256(bytes),
      reason: 'test',
    };
    const runner = await daemon(prefix, []);
    await runner.start();
    await runner.wait();
    expect(runner.updatedTo).toBe('99.0.2');
    expect(runCurrent(prefix)).toBe(`${RUNNER_PRODUCT} 99.0.2 tarball`);
  });

  it('keeps running when npm fails, and only logs the notice without auto-update', async () => {
    const prefix = archiveInstallation('npm-fails');
    server.npmUpgrade = {
      latestVersion: '99.9.9',
      package: '@nocobase/missing-runner',
      reason: 'test',
    };
    const logs: string[] = [];
    const runner = await daemon(prefix, logs);
    await runner.start();
    await waitFor(() =>
      logs.some((line) =>
        line.includes(
          'update to 99.9.9 failed: npm could not install @nocobase/missing-runner@99.9.9',
        ),
      ),
    );
    await runner.stop();
    expect(runner.updatedTo).toBeUndefined();
    expect(readlinkSync(path.join(prefix, 'current'))).toBe(
      `versions/${runnerVersion()}`,
    );

    const manual: string[] = [];
    server.npmUpgrade = {
      latestVersion: '99.0.3',
      package: PACKAGE,
      reason: 'test',
    };
    const notifier = await daemon(undefined, manual);
    await notifier.start();
    await waitFor(() =>
      manual.some((line) =>
        line.includes(`${RUNNER_PRODUCT} 99.0.3 is available (test)`),
      ),
    );
    await notifier.stop();
    expect(notifier.updatedTo).toBeUndefined();
  });

  it('updates by hand to what the resolve route names: npm, or a tarball from an application without npm answers', async () => {
    const prefix = archiveInstallation('by-hand');
    server.resolution.npm = {
      kind: 'npm',
      product: RUNNER_PRODUCT,
      version: '99.0.4',
      package: PACKAGE,
      channel: 'stable',
    };
    const env = cliEnv(home, {
      NOCOBASE_RUNNER_INSTALLATION: path.join(
        prefix,
        'versions',
        runnerVersion(),
      ),
      NOCOBASE_NPM: npm,
    });
    const viaNpm = await cli(['update'], env);
    expect(viaNpm.stderr).toBe('');
    expect(viaNpm.code).toBe(0);
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/99.0.4');
    expect(runCurrent(prefix)).toBe(`${RUNNER_PRODUCT} 99.0.4`);

    // An application from before npm answers ignores accept=npm and answers with its tarball.
    const old = archiveInstallation('by-hand-old');
    const bytes = tarball('99.0.5');
    server.distFiles.set(`${RUNNER_PRODUCT}/99.0.5/runner.tar.gz`, bytes);
    server.resolution = {
      artifact: {
        product: RUNNER_PRODUCT,
        version: '99.0.5',
        target: 'linux-x64',
        url: `/api/agents/dist/products/${RUNNER_PRODUCT}/versions/99.0.5/files/runner.tar.gz`,
        sha256: sha256(bytes),
        size: bytes.length,
        channel: 'stable',
      },
    };
    const viaTarball = await cli(['update'], {
      ...env,
      NOCOBASE_RUNNER_INSTALLATION: path.join(old, 'versions', runnerVersion()),
    });
    expect(viaTarball.code).toBe(0);
    expect(runCurrent(old)).toBe(`${RUNNER_PRODUCT} 99.0.5 tarball`);
  });
});
