import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };

it('checks every internal package without selecting the root application and propagates a failed check', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'app-internal-checks-'));
  try {
    cpSync(
      path.resolve(import.meta.dirname, '../../scripts'),
      path.join(root, 'scripts'),
      { recursive: true },
    );
    writeFileSync(
      path.join(root, 'pnpm-workspace.yaml'),
      "packages: ['packages/*']\nverifyDepsBeforeRun: false\n",
    );
    writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'fixture-app',
        private: true,
        scripts: {
          'check:packages': packageMetadata.scripts['check:packages'],
          check: 'node -e "process.exit(99)"',
        },
      }),
    );
    for (const name of ['first', 'second']) {
      const directory = path.join(root, 'packages', name);
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        path.join(directory, 'package.json'),
        JSON.stringify({
          name: `fixture-${name}`,
          private: true,
          scripts: { check: 'node check.cjs' },
        }),
      );
      writeFileSync(
        path.join(directory, 'check.cjs'),
        "require('node:fs').writeFileSync('checked', 'yes');\n",
      );
    }
    const run = () =>
      spawnSync('pnpm', ['check:packages'], {
        cwd: root,
        encoding: 'utf8',
        timeout: 30_000,
      });
    expect(run().status).toBe(0);
    for (const name of ['first', 'second']) {
      expect(
        readFileSync(path.join(root, 'packages', name, 'checked'), 'utf8'),
      ).toBe('yes');
    }
    writeFileSync(
      path.join(root, 'packages/second/check.cjs'),
      'process.exit(7);\n',
    );
    expect(run().status).not.toBe(0);
    rmSync(path.join(root, 'packages/first/checked'));
    writeFileSync(
      path.join(root, 'packages/second/package.json'),
      JSON.stringify({ name: 'fixture-second', scripts: { check: '  ' } }),
    );
    const missing = run();
    expect(missing.status).not.toBe(0);
    expect(missing.stderr).toContain('packages/second');
    expect(existsSync(path.join(root, 'packages/first/checked'))).toBe(false);
    writeFileSync(
      path.join(root, 'packages/second/package.json'),
      JSON.stringify({ name: 'fixture-second' }),
    );
    expect(run().status).not.toBe(0);
    // pnpm workspace exclusions apply to both the preflight and the script run.
    writeFileSync(
      path.join(root, 'pnpm-workspace.yaml'),
      "packages: ['packages/*', '!packages/second']\nverifyDepsBeforeRun: false\n",
    );
    expect(run().status).toBe(0);
    rmSync(path.join(root, 'packages'), { recursive: true });
    expect(run().status).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 60_000);
