import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function restoreInputs(destination) {
  const archive = new URL('./recovery-inputs.tgz', import.meta.url);
  const expected = (
    await readFile(new URL('./recovery-inputs.sha256', import.meta.url), 'utf8')
  ).trim();
  if (
    createHash('sha256')
      .update(await readFile(archive))
      .digest('hex') !== expected
  )
    throw Error('Recovery archive integrity mismatch');
  await mkdir(destination, { recursive: true });
  if ((await readdir(destination)).length)
    throw Error('Recovery requires an empty directory');
  const result = spawnSync(
    'tar',
    [
      '-xzf',
      fileURLToPath(archive),
      '-C',
      destination,
      '--strip-components=1',
      '--same-permissions',
      '--no-same-owner',
    ],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) throw Error('Recovery extraction failed');
  const manifest = JSON.parse(
    await readFile(path.join(destination, 'manifest.json'), 'utf8'),
  );
  for (const [name, expected] of Object.entries(manifest.files)) {
    const file = path.resolve(destination, name);
    if (!file.startsWith(`${path.resolve(destination)}/`))
      throw Error('Unsafe recovery path');
    const actual = await stat(file);
    if (
      !actual.isFile() ||
      (actual.mode & 0o777) !== expected.mode ||
      createHash('sha256')
        .update(await readFile(file))
        .digest('hex') !== expected.sha256
    )
      throw Error(`Recovery mismatch: ${name}`);
  }
  for (const [id, sample] of Object.entries(manifest.samples)) {
    const pkg = JSON.parse(
      await readFile(
        path.join(destination, sample.sourceDir, 'package.json'),
        'utf8',
      ),
    );
    if (
      sample.status !== 'verified' ||
      pkg.nocobase.defaultTemplateVersion !== sample.target ||
      pkg.nocobase.templatePackage !== sample.template
    )
      throw Error(`Incomplete sample: ${id}`);
  }
  return manifest;
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  await restoreInputs(path.resolve(process.argv[2]));
