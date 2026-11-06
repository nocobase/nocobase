import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { Header } from 'tar';
import { afterEach, expect, it } from 'vitest';
import { artifactWorker } from '../src/artifact-worker-client.js';
const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
async function archive(name: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'artifact-worker-'));
  directories.push(dir);
  const header = new Header({ path: name, size: 4, type: 'File', mode: 0o600 });
  header.encode();
  const bytes = gzipSync(
    Buffer.concat([
      header.block!,
      Buffer.from('test'),
      Buffer.alloc(508 + 1024),
    ]),
  );
  const file = path.join(dir, 'archive.tar.gz');
  await writeFile(file, bytes);
  const destination = path.join(dir, 'staging');
  await mkdir(destination);
  return { dir, file, bytes, destination };
}
it('hashes and extracts in a child and waits for its completed output', async () => {
  const fixture = await archive('file.txt');
  expect(await artifactWorker('hash', fixture.file)).toBe(
    createHash('sha256').update(fixture.bytes).digest('hex'),
  );
  await artifactWorker('extract', fixture.file, fixture.destination);
  expect(
    await readFile(path.join(fixture.destination, 'file.txt'), 'utf8'),
  ).toBe('test');
});
it.each(['../escape', '/absolute', '.nocobase-artifact.json'])(
  'rejects unsafe or reserved path %s without an uncaught stream error',
  async (name) => {
    const fixture = await archive(name);
    await expect(
      artifactWorker('extract', fixture.file, fixture.destination),
    ).rejects.toThrow(/unsafe|reserved/);
    await expect(
      readFile(path.join(fixture.dir, 'escape')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  },
);
it('returns corruption and child failures to the caller', async () => {
  const fixture = await archive('file.txt');
  await writeFile(fixture.file, 'not gzip');
  await expect(
    artifactWorker('extract', fixture.file, fixture.destination),
  ).rejects.toThrow();
  await expect(
    artifactWorker('hash', fixture.file + '.missing'),
  ).rejects.toThrow(/ENOENT/);
});
