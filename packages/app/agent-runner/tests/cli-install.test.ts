// Finding the application CLI a run names: local override, preinstalled, npm and tarball.
import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { runnerPaths } from '../src/lib/home.ts';
import { CliUnavailableError, resolveCli } from '../src/agent/cli.ts';
import type { RunCli } from '../src/protocol/index.ts';
import { removeDir, tempDir } from './helpers.ts';

const root = tempDir('nocobase-runner-cli-install-');
const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
afterAll(() => removeDir(root));

const cli = (pkg: RunCli['package']): RunCli => ({
  name: 'appcli',
  package: pkg,
  credential: { file: '.app/run.json', content: {} },
});

/** An npm stand-in that "installs" by writing the bin, and counts its calls. */
function fakeNpm() {
  const calls: string[][] = [];
  return {
    calls,
    npm: (args: string[], cwd: string) => {
      calls.push(args);
      const bin = path.join(cwd, 'node_modules', '.bin');
      mkdirSync(bin, { recursive: true });
      writeFileSync(path.join(bin, 'appcli'), '#!/bin/sh\n');
      return Promise.resolve();
    },
  };
}

describe('application CLI', () => {
  it('prefers a local override, and refuses one that does not exist', async () => {
    const local = path.join(root, 'local-cli.js');
    writeFileSync(local, '');
    expect(
      await resolveCli({
        paths,
        cli: cli({ kind: 'npm', package: 'x', version: '1' }),
        overrides: { appcli: local },
      }),
    ).toBe(local);
    await expect(
      resolveCli({
        paths,
        cli: cli({ kind: 'preinstalled' }),
        overrides: { appcli: path.join(root, 'missing') },
      }),
    ).rejects.toBeInstanceOf(CliUnavailableError);
  });

  it('finds a preinstalled CLI on the PATH', async () => {
    const bin = path.join(root, 'bin');
    mkdirSync(bin);
    writeFileSync(path.join(bin, 'appcli'), '#!/bin/sh\n');
    chmodSync(path.join(bin, 'appcli'), 0o755);
    expect(
      await resolveCli({
        paths,
        cli: cli({ kind: 'preinstalled' }),
        searchPath: `/nowhere${path.delimiter}${bin}`,
      }),
    ).toBe(path.join(bin, 'appcli'));
    await expect(
      resolveCli({ paths, cli: cli({ kind: 'preinstalled' }), searchPath: '' }),
    ).rejects.toThrow(/not installed on this runner/);
  });

  it('installs an npm package once per version', async () => {
    const { npm, calls } = fakeNpm();
    const spec = cli({
      kind: 'npm',
      package: '@acme/app-cli',
      version: '1.2.3',
    });
    const first = await resolveCli({ paths, cli: spec, npm });
    expect(first).toBe(
      path.join(
        paths.cliDir,
        'appcli',
        '1.2.3',
        'node_modules',
        '.bin',
        'appcli',
      ),
    );
    expect(await resolveCli({ paths, cli: spec, npm })).toBe(first);
    expect(calls).toEqual([
      [
        'install',
        '--no-save',
        '--no-audit',
        '--no-fund',
        '--ignore-scripts',
        '@acme/app-cli@1.2.3',
      ],
    ]);
    await expect(
      resolveCli({
        paths,
        cli: {
          ...spec,
          package: { ...spec.package, version: '9' } as RunCli['package'],
        },
        npm: () => Promise.reject(new Error('E404')),
      }),
    ).rejects.toThrow(/Could not install @acme\/app-cli@9: E404/);
  });

  it('installs a tarball only when its SHA-256 matches', async () => {
    const bytes = Buffer.from('a tarball');
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const fetch = (() =>
      Promise.resolve(
        new Response(bytes),
      )) as unknown as typeof globalThis.fetch;
    const { npm } = fakeNpm();
    const found = await resolveCli({
      paths,
      cli: cli({ kind: 'tarball', url: 'https://x/t.tgz', sha256 }),
      npm,
      fetch,
    });
    expect(found).toContain(path.join('appcli', sha256));
    await expect(
      resolveCli({
        paths,
        cli: cli({
          kind: 'tarball',
          url: 'https://x/t.tgz',
          sha256: '0'.repeat(64),
        }),
        npm,
        fetch,
      }),
    ).rejects.toThrow(/does not match its SHA-256/);
  });
});
