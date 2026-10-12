import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { extract, create } from 'tar';
import { describe, expect, it } from 'vitest';
import { createOfflineBundle } from '../src/lib/offline-bundle.ts';
import { runCommand } from '../src/lib/run-command.ts';
import { inspectArchive } from '../src/lib/remote.ts';

describe('offline packaging', () => {
  it('executes without the source tree and preserves nested dependency resolution', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'offline-package-test-'));
    const source = path.join(temp, 'source');
    try {
      for (const dir of [
        'bin',
        'dist',
        'node_modules/parent/node_modules/child',
        'node_modules/child',
      ])
        await mkdir(path.join(source, dir), { recursive: true });
      await writeFile(
        path.join(source, 'package.json'),
        JSON.stringify({
          name: 'fixture',
          type: 'module',
          dependencies: { parent: '1', child: '2' },
        }),
      );
      await writeFile(
        path.join(source, 'bin/run.js'),
        "import parent from 'parent'; import child from 'child'; console.log(parent + ':' + child);",
      );
      for (const [dir, name, value, dependencies] of [
        ['parent', 'parent', "require('child')", { child: '1' }],
        ['parent/node_modules/child', 'child', "'nested'", {}],
        ['child', 'child', "'root'", {}],
      ] as const) {
        await writeFile(
          path.join(source, 'node_modules', dir, 'package.json'),
          JSON.stringify({ name, main: 'index.js', dependencies }),
        );
        await writeFile(
          path.join(source, 'node_modules', dir, 'index.js'),
          'module.exports=' + value,
        );
      }
      const archive = path.join(temp, 'installer.tar.gz');
      await createOfflineBundle(archive, source);
      await rm(source, { recursive: true });
      await extract({ file: archive, cwd: temp });
      const result = await runCommand(
        process.execPath,
        [path.join(temp, 'installer/bin/run.js')],
        { cwd: temp },
      );
      expect(result.stdout.trim()).toBe('nested:root');
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });
  it('reads the application target and expanded size without unpacking the archive', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'archive-inspect-test-'));
    try {
      await mkdir(path.join(temp, 'dist'));
      const manifest = {
        nocobase: {
          buildTarget: { platform: 'linux', arch: 'arm64', nodeMajor: 24 },
        },
      };
      await writeFile(
        path.join(temp, 'dist/package.json'),
        JSON.stringify(manifest),
      );
      const file = path.join(temp, 'app.tar.gz');
      await create({ file, cwd: temp, gzip: true }, ['dist']);
      expect(await inspectArchive(file)).toMatchObject({
        manifest,
        bytes: JSON.stringify(manifest).length,
      });
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });
});
