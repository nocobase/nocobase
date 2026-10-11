// `<bin> update` against a server that serves no tarball of the CLI and names its npm package instead
// (`DistNpmPackage`, answered to `accept=npm`), and the npm side of the installation layout: the version directory an
// npm install leaves, its launcher, and moving between tarball and npm versions.
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
import { afterAll, describe, expect, it } from 'vitest';

import { HEADERS } from '@nocobase/agent-protocol';

import {
  detectInstallation,
  installNpmVersion,
  NpmUnavailableError,
} from '../src/install.ts';
import {
  updateCli,
  updateHint,
  type UpdateEnvironment,
} from '../src/update.ts';
import { fakeNpm, removeDir, tempDir } from './helpers.ts';

const scratch = tempDir('app-cli-client-npm-update-');
afterAll(() => removeDir(scratch));

const target = 'linux-x64';
const bin = 'acme';
const session = {
  server: 'https://acme.example.com/app',
  headers: { [HEADERS.apiKey]: 'key-1' },
};
const npm = fakeNpm(path.join(scratch, 'npm'), { '@acme/cli': 'acme' });
const npmLog = path.join(scratch, 'npm', 'npm.log');
/** What npm runs in: the stand-in npm, and this Node on PATH for its scripts. */
const env = {
  NOCOBASE_NPM: npm,
  PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`,
};

function tarball(version: string): Uint8Array {
  const staging = path.join(scratch, `staging-${version}`);
  mkdirSync(path.join(staging, 'acme', 'bin'), { recursive: true });
  const file = path.join(staging, 'acme', 'bin', 'acme');
  writeFileSync(file, `#!/bin/sh\necho acme ${version} tarball\n`);
  chmodSync(file, 0o755);
  const out = path.join(staging, 'out.tar.gz');
  execFileSync('tar', ['-czf', out, '-C', staging, 'acme']);
  return new Uint8Array(readFileSync(out));
}

/**
 * A server whose answer for acme is `npm` (the package at `version`) to a caller that sends `accept=npm`, and the
 * tarball of `version` otherwise (`tarball: true` answers the tarball to everyone, as a server with one does).
 */
function fakeServer(version: string, options: { tarball?: boolean } = {}) {
  const bytes = tarball(version);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const file = `/api/agents/dist/products/acme/versions/${version}/files/acme.tar.gz`;
  const requests: string[] = [];
  const fetcher = (async (input: URL | RequestInfo) => {
    const url = new URL(String(input));
    requests.push(`${url.pathname}${url.search}`);
    if (url.pathname === `/app/api/agents/dist/products/acme/targets/${target}`)
      return Response.json({
        data:
          url.searchParams.get('accept') === 'npm' && options.tarball !== true
            ? {
                kind: 'npm',
                product: 'acme',
                version,
                package: '@acme/cli',
                channel: 'stable',
              }
            : {
                product: 'acme',
                version,
                target,
                url: file,
                sha256,
                size: bytes.length,
                channel: 'stable',
              },
      });
    if (url.pathname === `/app${file}`) return new Response(bytes);
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
  return { fetch: fetcher, requests };
}

/** A CLI installed alone from a tarball at `version`, as the install script leaves it. */
function installCli(name: string, version: string) {
  const prefix = path.join(scratch, name);
  const dir = path.join(prefix, 'versions', version);
  mkdirSync(path.join(dir, 'bin'), { recursive: true });
  writeFileSync(path.join(dir, 'bin', 'acme'), '#!/bin/sh\n');
  symlinkSync(path.join('versions', version), path.join(prefix, 'current'));
  writeFileSync(
    path.join(prefix, 'install.json'),
    JSON.stringify({ prefix, binLink: '/x/acme', mode: 'cli' }),
  );
  return prefix;
}

const run = (prefix: string, ...args: string[]) =>
  execFileSync(path.join(prefix, 'current', 'bin', 'acme'), args, {
    encoding: 'utf8',
    // No node on PATH: the launcher finds the installation's own.
    env: { PATH: '/usr/bin:/bin' },
  }).trim();

describe('installing from npm', () => {
  it('installs the exact version without optional dependencies, beside a launcher of its bin', async () => {
    const prefix = path.join(scratch, 'direct');
    await installNpmVersion({
      installation: { prefix },
      bin,
      package: '@acme/cli',
      version: '1.0.0',
      node: process.execPath,
      env,
    });
    const dir = path.join(prefix, 'versions', '1.0.0');
    expect(readFileSync(npmLog, 'utf8')).toContain(
      `install --prefix ${dir}.partial --no-save --no-audit --no-fund --omit=optional @acme/cli@1.0.0`,
    );
    expect(existsSync(`${dir}.partial`)).toBe(false);
    expect(
      execFileSync(path.join(dir, 'bin', 'acme'), ['hi'], {
        encoding: 'utf8',
        env: { PATH: env.PATH },
      }).trim(),
    ).toBe('acme 1.0.0 hi');
    // The package's own root, inside node_modules, belongs to the version directory's installation.
    symlinkSync('versions/1.0.0', path.join(prefix, 'current'));
    expect(
      detectInstallation(path.join(dir, 'node_modules', '@acme', 'cli')),
    ).toMatchObject({ prefix, versionDir: dir, version: '1.0.0' });
  });

  it('names npm and leaves nothing behind when there is none or it fails', async () => {
    const prefix = path.join(scratch, 'no-npm');
    await expect(
      installNpmVersion({
        installation: { prefix },
        bin,
        package: '@acme/cli',
        version: '1.0.0',
        node: path.join(scratch, 'nowhere', 'node'),
        env: { PATH: path.join(scratch, 'empty') },
      }),
    ).rejects.toBeInstanceOf(NpmUnavailableError);
    writeFileSync(path.join(scratch, 'npm', 'fail'), '');
    try {
      await expect(
        installNpmVersion({
          installation: { prefix },
          bin,
          package: '@acme/cli',
          version: '1.0.0',
          node: process.execPath,
          env,
        }),
      ).rejects.toThrow('npm could not install @acme/cli@1.0.0: npm error 404');
    } finally {
      removeDir(path.join(scratch, 'npm', 'fail'));
    }
    expect(existsSync(path.join(prefix, 'versions', '1.0.0'))).toBe(false);
    expect(existsSync(path.join(prefix, 'versions', '1.0.0.partial'))).toBe(
      false,
    );
  });
});

describe('<bin> update with an npm answer', () => {
  it('moves a tarball installation to npm, then to a newer npm version, then back to a tarball', async () => {
    const prefix = installCli('cli', '0.1.0');
    const environment = (running: string): UpdateEnvironment => ({
      bin,
      running,
      installation: detectInstallation(path.join(prefix, 'versions', running)),
      target,
      env,
    });

    const first = fakeServer('0.2.0');
    expect(
      await updateCli(
        session,
        { ...environment('0.1.0'), fetch: first.fetch },
        {},
      ),
    ).toEqual({
      current: '0.1.0',
      latest: '0.2.0',
      updated: true,
      previous: '0.1.0',
    });
    expect(first.requests[0]).toBe(
      `/app/api/agents/dist/products/acme/targets/${target}?accept=npm`,
    );
    // Nothing was downloaded from the server: npm installed it.
    expect(first.requests).toHaveLength(1);
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/0.2.0');
    // The npm version has no Node of its own: the installation's runs it.
    expect(readlinkSync(path.join(prefix, 'node'))).toBe(process.execPath);
    expect(run(prefix, 'whoami')).toBe('acme 0.2.0 whoami');

    const second = fakeServer('0.3.0');
    await updateCli(
      session,
      { ...environment('0.2.0'), fetch: second.fetch },
      {},
    );
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/0.3.0');
    expect(run(prefix)).toBe('acme 0.3.0');
    // The previous version stays for a rollback; the one before it goes.
    expect(existsSync(path.join(prefix, 'versions', '0.2.0'))).toBe(true);
    expect(existsSync(path.join(prefix, 'versions', '0.1.0'))).toBe(false);

    const back = fakeServer('0.4.0', { tarball: true });
    await updateCli(
      session,
      { ...environment('0.3.0'), fetch: back.fetch },
      {},
    );
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/0.4.0');
    expect(run(prefix)).toBe('acme 0.4.0 tarball');
  });

  it('reads the version of an npm answer for the hint', async () => {
    const prefix = installCli('hint', '0.1.0');
    const server = fakeServer('0.2.0');
    expect(
      await updateHint(session, {
        bin,
        running: '0.1.0',
        installation: detectInstallation(
          path.join(prefix, 'versions', '0.1.0'),
        ),
        target,
        fetch: server.fetch,
        cacheFile: path.join(scratch, 'hint.json'),
      }),
    ).toBe('A newer acme (0.2.0) is available; run `acme update`.');
  });
});
