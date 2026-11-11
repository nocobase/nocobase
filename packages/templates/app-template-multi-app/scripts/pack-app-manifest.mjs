import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Resolve a staged App's manifest with pnpm, without installing its commercial dependencies. */
export async function packAppManifest(directory, workspacePackages, archive) {
  const filename = path.join(directory, 'package.json');
  const manifest = JSON.parse(await readFile(filename, 'utf8'));
  const modules = path.join(directory, 'node_modules');
  // pnpm pack resolves workspace protocols through installed links. Only the disposable
  // staging directory receives these links; no package source or link enters the payload.
  await mkdir(modules);
  try {
    const dependencies = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
      ...manifest.optionalDependencies,
    };
    for (const [name, range] of Object.entries(dependencies)) {
      if (!range.startsWith('workspace:')) continue;
      const target = workspacePackages.get(name);
      if (!target) throw new Error(`No workspace package found for ${name}.`);
      const link = path.join(modules, name);
      await mkdir(path.dirname(link), { recursive: true });
      await symlink(target, link, 'junction');
    }
    execFileSync(
      'pnpm',
      [
        '--config.ignore-scripts=true',
        'pack',
        '--skip-manifest-obfuscation',
        '--out',
        archive,
      ],
      {
        cwd: directory,
        stdio: 'pipe',
        timeout: 60000,
      },
    );
    const packed = execFileSync(
      'tar',
      ['-xOzf', archive, 'package/package.json'],
      { encoding: 'utf8' },
    );
    await writeFile(filename, packed);
  } finally {
    await rm(modules, { recursive: true, force: true });
  }
}
