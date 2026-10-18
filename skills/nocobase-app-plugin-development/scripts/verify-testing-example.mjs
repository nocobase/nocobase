#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, rm, symlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dependencyRoot = process.argv[2];
if (!dependencyRoot || process.argv.length !== 3) {
  console.error(
    'Usage: node verify-testing-example.mjs <installed-app-directory>',
  );
  process.exitCode = 1;
} else {
  const root = path.resolve(dependencyRoot);
  const require = createRequire(path.join(root, 'package.json'));
  const scratch = await mkdtemp(
    path.join(tmpdir(), 'nocobase-plugin-example-'),
  );
  try {
    const source = fileURLToPath(
      new URL('../assets/testing-example/', import.meta.url),
    );
    await cp(source, scratch, {
      recursive: true,
      filter: (entry) =>
        !['node_modules', 'storage'].includes(path.basename(entry)),
    });
    await symlink(
      path.join(root, 'node_modules'),
      path.join(scratch, 'node_modules'),
      'dir',
    );
    const commands = [
      [
        'lint',
        path.join(
          path.dirname(require.resolve('eslint/package.json')),
          'bin/eslint.js',
        ),
        '.',
      ],
      [
        'typecheck',
        path.join(
          path.dirname(require.resolve('typescript/package.json')),
          'bin/tsc',
        ),
        '--noEmit',
      ],
      [
        'node tests',
        path.join(
          path.dirname(require.resolve('vitest/package.json')),
          'vitest.mjs',
        ),
        'run',
        '--project',
        'node',
      ],
      [
        'client tests',
        path.join(
          path.dirname(require.resolve('vitest/package.json')),
          'vitest.mjs',
        ),
        'run',
        '--project',
        'client',
      ],
    ];
    for (const [label, executable, ...args] of commands) {
      console.log(`\nChecking plugin example: ${label}`);
      const result = spawnSync(process.execPath, [executable, ...args], {
        cwd: scratch,
        stdio: 'inherit',
        env: process.env,
      });
      if (result.error) throw result.error;
      if (result.status !== 0)
        throw new Error(`${label} failed (${result.signal ?? result.status}).`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
