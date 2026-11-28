import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);
const compiler = require.resolve('typescript/bin/tsc');
const clientConfig = path.join(
  repoRoot,
  'packages/templates/app-template-default/tsconfig.json',
);
const serverSource =
  /\/packages\/(?:libs\/db|app\/app-server|plugins\/app-plugin-(?:authentication|authorization)\/server)\//u;

for (const [plugin, entry] of [
  ['app-plugin-demo-mode', './client/settings'],
  ['app-plugin-authentication', './client'],
]) {
  test(`${plugin} ${entry} keeps server sources out of the browser type graph`, () => {
    const root = path.join(repoRoot, 'packages/plugins', plugin);
    const manifest = JSON.parse(
      readFileSync(path.join(root, 'package.json'), 'utf8'),
    );
    const directory = mkdtempSync(path.join(tmpdir(), 'browser-types-'));
    try {
      const config = path.join(directory, 'tsconfig.json');
      writeFileSync(
        config,
        JSON.stringify({
          extends: clientConfig,
          compilerOptions: { types: [] },
          include: [],
          files: [path.join(root, manifest.exports[entry].types)],
        }),
      );
      const files = execFileSync(
        process.execPath,
        [compiler, '-p', config, '--listFilesOnly'],
        { encoding: 'utf8' },
      )
        .replaceAll('\\', '/')
        .split(/\r?\n/u);
      const serverFiles = files.filter((file) => serverSource.test(file));
      assert.equal(
        serverFiles.length,
        0,
        `${serverFiles.length} server files loaded, including ${serverFiles[0]}`,
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
