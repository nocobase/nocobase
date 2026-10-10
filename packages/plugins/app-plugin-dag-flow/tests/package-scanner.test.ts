import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertPackageRelativePath,
  scanWorkflowPackage,
} from '../build/package-scanner.js';

const roots: string[] = [];
async function fixture(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-scan-'));
  roots.push(root);
  await fs.writeFile(path.join(root, 'workflow.ts'), 'export default {};');
  return root;
}
afterEach(async () =>
  Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  ),
);

describe('workflow package scanner', () => {
  it.each(['/absolute', '../escape', 'a/../escape', 'nul\0file', 'C:\\escape'])(
    'rejects unsafe manifest path %s',
    (candidate) => {
      expect(() => assertPackageRelativePath(candidate)).toThrow();
    },
  );
  it('rejects case collisions', async ({ skip }) => {
    const root = await fixture();
    await fs.writeFile(path.join(root, 'A.ts'), 'a');
    await fs.writeFile(path.join(root, 'a.ts'), 'b');
    const caseVariants = (await fs.readdir(root)).filter(
      (name) => name.toLowerCase() === 'a.ts',
    );
    if (caseVariants.length < 2) {
      skip('The filesystem does not support case-conflicting file names');
    }
    await expect(scanWorkflowPackage(root)).rejects.toThrow(/case-conflicting/);
  });
  it('rejects a symlink escaping the package root', async () => {
    const root = await fixture();
    const outside = path.join(path.dirname(root), 'outside.txt');
    await fs.writeFile(outside, 'secret');
    await fs.symlink(outside, path.join(root, 'escape'));
    await expect(scanWorkflowPackage(root)).rejects.toThrow(
      /escapes package root/,
    );
    await fs.rm(outside, { force: true });
  });
  it('rejects file count and total size limits', async () => {
    const root = await fixture();
    await fs.writeFile(path.join(root, 'extra.ts'), 'large');
    await expect(scanWorkflowPackage(root, { maxFiles: 1 })).rejects.toThrow(
      /exceeds 1 files/,
    );
    await expect(scanWorkflowPackage(root, { maxBytes: 1 })).rejects.toThrow(
      /exceeds 1 bytes/,
    );
  });
  it('excludes repositories, dependencies, caches, temporary, socket and secret-shaped files', async () => {
    const root = await fixture();
    for (const directory of ['.git', 'node_modules', '.cache', 'dist']) {
      await fs.mkdir(path.join(root, directory));
      await fs.writeFile(path.join(root, directory, 'x'), 'x');
    }
    for (const file of [
      '.env',
      'token.secret',
      'private.pem',
      'scratch.tmp',
      'editor.swp',
      'service.sock',
    ])
      await fs.writeFile(path.join(root, file), 'x');
    await expect(scanWorkflowPackage(root)).resolves.toMatchObject({
      entries: [{ path: 'workflow.ts' }],
    });
  });
});
