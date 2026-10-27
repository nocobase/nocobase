import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  stat,
  chmod,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { deduplicateStaging } from '../fixtures/list-recovery/preview/deduplicate.mjs';
import { DriveArtifactResolver } from '../../packages/app/app-host/src/artifact-resolver.ts';
import { DeploymentCatalog } from '../../packages/app/app-host/src/deployment/catalog.ts';
import { inspectArtifact } from '../../packages/plugins/app-plugin-releases/server/services/artifact.ts';
const require = createRequire(
  new URL('../../packages/app/app-host/package.json', import.meta.url),
);
const tar = require('tar');

test('internal hard links survive the actual release inspector and safe host extraction', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'preview-hardlinks-'));
  try {
    await mkdir(path.join(root, 'dist/server'), { recursive: true });
    await mkdir(path.join(root, 'dist/client'), { recursive: true });
    await writeFile(
      path.join(root, 'dist/package.json'),
      JSON.stringify({
        name: 'hardlink-probe',
        version: '1.0.0',
        type: 'module',
      }),
    );
    await writeFile(
      path.join(root, 'dist/server/embedded.js'),
      'export const createServer = () => ({});',
    );
    for (const name of ['a.js', 'b.js', 'executable.js'])
      await writeFile(path.join(root, 'dist', name), 'export default 42;');
    await chmod(path.join(root, 'dist/a.js'), 0o644);
    await chmod(path.join(root, 'dist/b.js'), 0o644);
    await chmod(path.join(root, 'dist/executable.js'), 0o755);
    const result = await deduplicateStaging(root);
    assert.equal(result.links, 1);
    const archive = path.join(root, 'probe.tgz');
    tar.c({ cwd: root, file: archive, gzip: true, sync: true }, ['dist']);
    assert.equal((await inspectArtifact(archive)).version, '1.0.0');
    const catalog = new DeploymentCatalog({
      deploymentsDir: path.join(root, 'revisions'),
      volumesDir: path.join(root, 'volumes'),
    });
    const resolver = new DriveArtifactResolver({}, catalog, {
      localArtifactDir: root,
    });
    const reference = {
      key: 'probe.tgz',
      appId: 'hardlink-probe',
      version: '1.0.0',
      checksum: createHash('sha256')
        .update(await readFile(archive))
        .digest('hex'),
    };
    const resolved = await resolver.resolve(reference);
    const expanded = path.join(
      root,
      'revisions',
      reference.appId,
      reference.checksum,
      'dist',
    );
    const a = await stat(path.join(expanded, 'a.js')),
      b = await stat(path.join(expanded, 'b.js'));
    assert.equal(a.ino, b.ino);
    assert.equal(a.mode & 0o777, 0o644);
    assert.equal(
      (await stat(path.join(expanded, 'executable.js'))).mode & 0o777,
      0o755,
    );
    assert.equal(
      await readFile(path.join(expanded, 'b.js'), 'utf8'),
      'export default 42;',
    );
    assert.notEqual(
      await import(pathToFileURL(path.join(expanded, 'a.js')).href),
      await import(pathToFileURL(path.join(expanded, 'b.js')).href),
    );
    await resolved.rollback();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
