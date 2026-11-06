import { createHash } from 'node:crypto';
import { readdir, lstat, readFile, unlink, link } from 'node:fs/promises';
import path from 'node:path';

// Only call on a copied deployment staging tree. Never change an installed dependency store.
// Hard links retain distinct paths and module identities; runtime data lives outside this tree.
export async function deduplicateStaging(root) {
  const seen = new Map();
  let links = 0,
    bytes = 0;
  async function walk(directory) {
    for (const name of (await readdir(directory)).sort()) {
      const file = path.join(directory, name),
        info = await lstat(file);
      if (info.isSymbolicLink()) continue;
      if (info.isDirectory()) {
        await walk(file);
        continue;
      }
      if (!info.isFile()) continue;
      // Keep every application's metadata and embedded entry regular and independently stored.
      if (
        [
          'package.json',
          'embedded.js',
          'carrier-embedded.js',
          'manifest.json',
        ].includes(name) ||
        !/\.(?:js|mjs|cjs|json|map|css|html|svg|png|woff2?|ttf|node|ts|md|txt|yml|yaml)$/.test(
          name,
        )
      )
        continue;
      const key = `${info.mode & 0o777}:${info.size}:${createHash('sha256')
        .update(await readFile(file))
        .digest('hex')}`;
      const previous = seen.get(key);
      if (previous) {
        await unlink(file);
        await link(previous, file);
        links++;
        bytes += info.size;
      } else seen.set(key, file);
    }
  }
  await walk(path.join(root, 'dist'));
  return { links, duplicateBytes: bytes };
}
