import {
  cp,
  glob,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { create } from 'tar';
import { InstallerError } from './errors.ts';

interface Manifest {
  name: string;
  files?: string[];
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  publishConfig?: { exports?: unknown };
  exports?: unknown;
}

/** Copies the installed runtime dependency graph, never resolving versions or contacting a registry. */
export async function createOfflineBundle(
  out: string,
  root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
): Promise<void> {
  const temp = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-installer-bundle-'),
  );
  const installer = path.join(temp, 'installer');
  const copied = new Map<string, string>();
  try {
    await mkdir(installer);
    for (const file of ['bin', 'dist', 'package.json']) {
      await cp(path.join(root, file), path.join(installer, file), {
        recursive: true,
      });
    }
    await visit(root, installer);
    await create({ cwd: temp, file: out, gzip: true, portable: true }, [
      'installer',
    ]);
  } catch (cause) {
    throw new InstallerError(
      'BUNDLE_FAILED',
      'Could not package the installed installer and its runtime dependencies. In a source checkout, build app-installer and its dependencies first.',
      { cause },
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }

  async function visit(source: string, destination: string): Promise<void> {
    const manifest = JSON.parse(
      await readFile(path.join(source, 'package.json'), 'utf8'),
    ) as Manifest;
    // Workspace packages resolve source exports locally; the copied tree executes their compiled public exports.
    if (manifest.publishConfig?.exports) {
      manifest.exports = manifest.publishConfig.exports;
      await writeFile(
        path.join(destination, 'package.json'),
        JSON.stringify(manifest),
      );
    }
    const dependencies = {
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
    };
    const require = createRequire(path.join(source, 'package.json'));
    for (const name of Object.keys(dependencies)) {
      let resolved: string | undefined;
      for (const search of require.resolve.paths(name) ?? []) {
        try {
          resolved = await realpath(path.join(search, name));
          break;
        } catch {
          /* Try the next Node resolution path. */
        }
      }
      if (!resolved) {
        if (name in (manifest.optionalDependencies ?? {})) continue;
        throw new Error(`Missing dependency ${name}`);
      }
      let target = copied.get(resolved);
      if (!target) {
        target = path.join(
          installer,
          'node_modules',
          '.offline',
          String(copied.size),
        );
        copied.set(resolved, target);
        const dependencyManifest = JSON.parse(
          await readFile(path.join(resolved, 'package.json'), 'utf8'),
        ) as Manifest;
        if (
          dependencyManifest.publishConfig?.exports &&
          dependencyManifest.files
        ) {
          // A linked workspace dependency may hold private development files; include only its published files.
          await mkdir(target, { recursive: true });
          await cp(
            path.join(resolved, 'package.json'),
            path.join(target, 'package.json'),
          );
          for await (const file of glob(dependencyManifest.files, {
            cwd: resolved,
          })) {
            await cp(path.join(resolved, file), path.join(target, file), {
              recursive: true,
            });
          }
        } else {
          await cp(resolved, target, {
            recursive: true,
            filter: (file) => path.basename(file) !== 'node_modules',
          });
        }
        await visit(resolved, target);
      }
      const link = path.join(destination, 'node_modules', name);
      await mkdir(path.dirname(link), { recursive: true });
      await symlink(path.relative(path.dirname(link), target), link);
    }
  }
}
