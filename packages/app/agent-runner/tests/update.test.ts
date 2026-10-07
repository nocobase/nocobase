// Installing standalone tarballs the application serves: the runner updating itself (by hand and between runs), the
// installation layout it relies on, and the application CLI of kind `archive`.
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

import {
  readConnections,
  readSettings,
  runnerClient,
} from '../src/lib/config.ts';
import { runnerPaths } from '../src/lib/home.ts';
import {
  activateVersion,
  ChecksumError,
  detectInstallation,
  pruneVersions,
  unpackTarball,
} from '../src/lib/install.ts';
import { CliUnavailableError, resolveCli } from '../src/agent/cli.ts';
import { RunnerDaemon, runnerVersion } from '../src/core/loop.ts';
import { servicePlan } from '../src/core/service.ts';
import { isNewer } from '../src/core/update.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import { cliEnv, registerRunner, removeDir, tempDir } from './helpers.ts';

const scratch = tempDir('nocobase-runner-update-');
afterAll(() => removeDir(scratch));

/** A standalone tarball like `oclif pack tarballs` makes: one top directory with `bin/<name>`. */
function tarball(name: string, version: string): Uint8Array {
  const staging = path.join(scratch, `staging-${name}-${version}`);
  mkdirSync(path.join(staging, name, 'bin'), { recursive: true });
  const bin = path.join(staging, name, 'bin', name);
  writeFileSync(bin, `#!/bin/sh\necho ${name} ${version}\n`);
  chmodSync(bin, 0o755);
  const file = path.join(staging, 'out.tar.gz');
  execFileSync('tar', ['-czf', file, '-C', staging, name]);
  return new Uint8Array(readFileSync(file));
}

const sha256 = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

/** An installation as the install script leaves it, with `version` current. */
function installation(prefix: string, version: string): void {
  const dir = path.join(prefix, 'versions', version);
  mkdirSync(path.join(dir, 'bin'), { recursive: true });
  writeFileSync(path.join(dir, 'bin', 'nocobase-runner'), '#!/bin/sh\n');
  symlinkSync(path.join('versions', version), path.join(prefix, 'current'));
}

describe('installation layout', () => {
  it('unpacks only a tarball that matches its checksum', async () => {
    const bytes = tarball('acme', '9.0.0');
    const dest = path.join(scratch, 'unpack', 'versions', '9.0.0');
    await expect(
      unpackTarball(bytes, '0'.repeat(64), dest),
    ).rejects.toBeInstanceOf(ChecksumError);
    expect(existsSync(dest)).toBe(false);
    await unpackTarball(bytes, sha256(bytes), dest);
    expect(readFileSync(path.join(dest, 'bin', 'acme'), 'utf8')).toContain(
      'acme 9.0.0',
    );
    expect(existsSync(`${dest}.partial`)).toBe(false);
  });

  it('finds the installation a version runs from, switches and prunes versions', async () => {
    const prefix = path.join(scratch, 'layout');
    installation(prefix, '1.0.0');
    mkdirSync(path.join(prefix, 'versions', '0.9.0'));
    mkdirSync(path.join(prefix, 'versions', '1.1.0'));
    writeFileSync(
      path.join(prefix, 'install.json'),
      JSON.stringify({ binLink: '/somewhere/acme' }),
    );
    expect(detectInstallation(path.join(prefix, 'versions', '1.0.0'))).toEqual({
      prefix,
      versionDir: path.join(prefix, 'versions', '1.0.0'),
      version: '1.0.0',
      current: path.join(prefix, 'current'),
      binLink: '/somewhere/acme',
      mode: 'runner',
    });
    expect(detectInstallation(path.join(scratch, 'not', 'installed'))).toBe(
      undefined,
    );
    // The repository's own runner is not an installation.
    expect(detectInstallation()).toBe(undefined);

    await activateVersion(
      { prefix, current: path.join(prefix, 'current') },
      '1.1.0',
    );
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/1.1.0');
    expect(await pruneVersions({ prefix }, ['1.1.0', '1.0.0'])).toEqual([
      '0.9.0',
    ]);
  });

  it('orders versions when deciding whether to update', () => {
    expect(isNewer('0.1.1', '0.1.0')).toBe(true);
    expect(isNewer('0.1.0', '0.1.0-alpha.3')).toBe(true);
    expect(isNewer('0.1.0-alpha.3', '0.1.0')).toBe(false);
    expect(isNewer('0.1.0', '0.1.0')).toBe(false);
  });

  it('runs the service from the current launcher under its own label', () => {
    const plan = servicePlan({
      paths: runnerPaths(
        '/Users/u/.nocobase-runner',
        '/Users/u/.nocobase-runner-work',
      ),
      command: ['/Users/u/.local/share/acme/current/bin/acme'],
      platform: 'darwin',
      home: '/Users/u',
      uid: 501,
      env: { PATH: '/usr/bin' },
      label: 'com.example.test-runner',
    });
    expect(plan.file).toBe(
      '/Users/u/Library/LaunchAgents/com.example.test-runner.plist',
    );
    expect(plan.content).toContain('<string>com.example.test-runner</string>');
    expect(plan.content).toContain(
      '<string>/Users/u/.local/share/acme/current/bin/acme</string>',
    );
    expect(plan.content).toContain('<key>NOCOBASE_RUNNER_SERVICE</key>');
    expect(plan.uninstall).toEqual([
      ['launchctl', 'bootout', 'gui/501/com.example.test-runner'],
    ]);
    const linux = servicePlan({
      paths: runnerPaths(
        '/home/u/.nocobase-runner',
        '/home/u/.nocobase-runner-work',
      ),
      command: ['/x/acme', 'runner'],
      platform: 'linux',
      home: '/home/u',
      env: { PATH: '/usr/bin' },
      label: 'com.example.test-runner',
    });
    expect(linux.file).toBe(
      '/home/u/.config/systemd/user/com.example.test-runner.service',
    );
    expect(() =>
      servicePlan({
        paths: runnerPaths('/h', '/w'),
        command: ['/x'],
        platform: 'linux',
        label: '../escape',
      }),
    ).toThrow('Not a service label');
  });
});

describe('served tarballs', () => {
  let server: FakeServer;
  let home: string;

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-update-home-');
    await registerRunner(server.url, cliEnv(home));
  });
  afterEach(async () => {
    await server.close();
    removeDir(home);
    removeDir(`${home}-work`);
  });

  const connection = async () => {
    const [found] = await readConnections(runnerPaths(home, `${home}-work`));
    if (found === undefined) throw new Error('Not registered.');
    return found;
  };

  it('installs an archive CLI once, with the runner key, checking its checksum', async () => {
    const bytes = tarball('appcli', '2.0.0');
    server.distFiles.set('appcli/2.0.0/appcli.tar.gz', bytes);
    const paths = runnerPaths(home, `${home}-work`);
    const client = runnerClient(await connection());
    const cli = (sha: string) => ({
      name: 'appcli',
      package: {
        kind: 'archive' as const,
        version: '2.0.0',
        url: '/api/agents/dist/products/appcli/versions/2.0.0/files/appcli.tar.gz',
        sha256: sha,
      },
      credential: { file: '.app/run.json', content: {} },
    });
    await expect(
      resolveCli({ paths, cli: cli('0'.repeat(64)), client }),
    ).rejects.toBeInstanceOf(CliUnavailableError);
    const entry = await resolveCli({ paths, cli: cli(sha256(bytes)), client });
    expect(entry).toMatch(
      /cli\/appcli\/archive-2\.0\.0-[0-9a-f]{12}\/bin\/appcli$/u,
    );
    expect(execFileSync(entry, { encoding: 'utf8' })).toBe('appcli 2.0.0\n');
    server.distFiles.clear();
    expect(await resolveCli({ paths, cli: cli(sha256(bytes)), client })).toBe(
      entry,
    );
    await expect(
      resolveCli({ paths, cli: cli(sha256(bytes)) }).then(() => 'reused'),
    ).resolves.toBe('reused');
  });

  it('refuses to download from another origin', async () => {
    const client = runnerClient(await connection());
    await expect(
      client.download('https://elsewhere.example.com/x.tar.gz'),
    ).rejects.toThrow('another origin');
  });

  it('updates itself between runs when the application serves a newer runner, then stops for its service', async () => {
    const prefix = path.join(scratch, 'self-update');
    installation(prefix, runnerVersion());
    const next = '99.0.0';
    const bytes = tarball('nocobase-runner', next);
    server.distFiles.set(
      `nocobase-runner/${next}/nocobase-runner.tar.gz`,
      bytes,
    );
    server.upgrade = {
      minVersion: '0.0.0',
      latestVersion: next,
      downloadUrl: `/api/agents/dist/products/nocobase-runner/versions/${next}/files/nocobase-runner.tar.gz`,
      sha256: sha256(bytes),
      reason: 'test',
    };
    const paths = runnerPaths(home, `${home}-work`);
    const logs: string[] = [];
    const daemon = new RunnerDaemon({
      paths,
      settings: await readSettings(paths),
      connections: [await connection()],
      adapters: new Map(),
      timings: {
        heartbeatIntervalMs: 100,
        pollTimeoutMs: 200,
        pollFallbackMs: 200,
      },
      log: (message) => logs.push(message),
      selfUpdate: {
        installation: { prefix, current: path.join(prefix, 'current') },
      },
    });
    await daemon.start();
    await daemon.wait();
    expect(daemon.updatedTo).toBe(next);
    expect(readlinkSync(path.join(prefix, 'current'))).toBe(`versions/${next}`);
    expect(
      readFileSync(
        path.join(prefix, 'versions', next, 'bin', 'nocobase-runner'),
        'utf8',
      ),
    ).toContain(`nocobase-runner ${next}`);
    // The version it ran stays, to switch back to by hand.
    expect(existsSync(path.join(prefix, 'versions', runnerVersion()))).toBe(
      true,
    );
    expect(logs.join('\n')).toContain(`updated to nocobase-runner ${next}`);
  });

  it('only logs an update when it is not an installation its service supervises', async () => {
    server.upgrade = {
      minVersion: '0.0.0',
      latestVersion: '99.0.0',
      downloadUrl:
        '/api/agents/dist/products/nocobase-runner/versions/99.0.0/files/x.tar.gz',
      sha256: '0'.repeat(64),
      reason: 'test',
    };
    const paths = runnerPaths(home, `${home}-work`);
    const logs: string[] = [];
    const daemon = new RunnerDaemon({
      paths,
      settings: await readSettings(paths),
      connections: [await connection()],
      adapters: new Map(),
      timings: {
        heartbeatIntervalMs: 100,
        pollTimeoutMs: 200,
        pollFallbackMs: 200,
      },
      log: (message) => logs.push(message),
    });
    await daemon.start();
    await waitFor(() =>
      logs.some((line) => line.includes('nocobase-runner 99.0.0 is available')),
    );
    await daemon.stop();
    expect(daemon.updatedTo).toBeUndefined();
  });

  it('keeps a failed update from stopping the runner', async () => {
    const prefix = path.join(scratch, 'failed-update');
    installation(prefix, runnerVersion());
    server.upgrade = {
      minVersion: '0.0.0',
      latestVersion: '99.0.0',
      downloadUrl:
        '/api/agents/dist/products/nocobase-runner/versions/99.0.0/files/missing.tar.gz',
      sha256: '0'.repeat(64),
      reason: 'test',
    };
    const paths = runnerPaths(home, `${home}-work`);
    const logs: string[] = [];
    const daemon = new RunnerDaemon({
      paths,
      settings: await readSettings(paths),
      connections: [await connection()],
      adapters: new Map(),
      timings: {
        heartbeatIntervalMs: 100,
        pollTimeoutMs: 200,
        pollFallbackMs: 200,
      },
      log: (message) => logs.push(message),
      selfUpdate: {
        installation: { prefix, current: path.join(prefix, 'current') },
      },
    });
    await daemon.start();
    await waitFor(() =>
      logs.some((line) => line.includes('update to 99.0.0 failed')),
    );
    await daemon.stop();
    expect(daemon.updatedTo).toBeUndefined();
    expect(readlinkSync(path.join(prefix, 'current'))).toBe(
      `versions/${runnerVersion()}`,
    );
  });
});
