import { createHash } from 'node:crypto';
import { readdir, lstat, readFile, readlink } from 'node:fs/promises';
import path from 'node:path';

// Compare deployment contents and permissions before packing and after native extraction.
export async function deploymentTree(root) {
  const files = {};
  async function visit(relative) {
    const file = path.join(root, relative),
      info = await lstat(file);
    if (info.isSymbolicLink()) files[relative] = { link: await readlink(file) };
    else if (info.isDirectory()) {
      for (const name of (await readdir(file)).sort()) {
        if (name !== '.bin') await visit(path.join(relative, name));
      }
    } else if (info.isFile())
      files[relative] = {
        mode: info.mode & 0o777,
        sha256: createHash('sha256')
          .update(await readFile(file))
          .digest('hex'),
      };
  }
  await visit('dist');
  await visit('config.example.yml');
  return files;
}
