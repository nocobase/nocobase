import { spawn } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

interface PackageManifest {
  name: string;
  version: string;
}

const isPackageManifest = (value: unknown): value is PackageManifest =>
  typeof value === 'object' &&
  value !== null &&
  'name' in value &&
  typeof value.name === 'string' &&
  'version' in value &&
  typeof value.version === 'string';

const packageRoot: string = path.resolve(import.meta.dirname, '..');
const packDirectoryValue: string | undefined = process.env.PACK_DIR;

if (!packDirectoryValue) {
  throw new Error('PACK_DIR must be set before running pack:check.');
}

const packDirectory: string = path.resolve(packDirectoryValue);
const parsedPackageManifest: unknown = JSON.parse(
  await readFile(path.join(packageRoot, 'package.json'), 'utf8'),
);

if (!isPackageManifest(parsedPackageManifest)) {
  throw new TypeError(
    'package.json must contain string name and version fields.',
  );
}

const packageManifest: PackageManifest = parsedPackageManifest;
const generatedArchiveName: string = `${packageManifest.name
  .replace(/^@/, '')
  .replaceAll('/', '-')}-${packageManifest.version}.tgz`;
const generatedArchive: string = path.join(packDirectory, generatedArchiveName);
const checkedArchive: string = path.join(
  packDirectory,
  'nocobase-dev-config.tgz',
);

const run = (
  command: string,
  args: string[],
  cwd: string = packageRoot,
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(' ')} failed with ${
            signal ? `signal ${signal}` : `exit code ${code}`
          }.`,
        ),
      );
    });
  });

await mkdir(packDirectory, { recursive: true });
await run('pnpm', ['pack', '--pack-destination', packDirectory]);
await copyFile(generatedArchive, checkedArchive);
await unlink(generatedArchive);

const smokeDirectory: string = await mkdtemp(
  path.join(packageRoot, '.pack-check-'),
);

try {
  await run('tar', ['-xzf', checkedArchive, '-C', smokeDirectory]);

  const runtimeEntries: string[] = [
    'eslint/index.js',
    'prettier/index.js',
    'vitest/node.js',
    'vitest/react.js',
    'vite/app.js',
    'database/database-manifests.js',
  ];

  for (const runtimeEntry of runtimeEntries) {
    const entryUrl = pathToFileURL(
      path.join(smokeDirectory, 'package', 'dist', runtimeEntry),
    );
    await import(entryUrl.href);
  }
} finally {
  await rm(smokeDirectory, { force: true, recursive: true });
}

await run('pnpm', ['exec', 'publint', '.']);
await run('pnpm', [
  'exec',
  'attw',
  checkedArchive,
  '--profile',
  'esm-only',
  '--entrypoints',
  'eslint',
  'prettier',
  'vitest/node',
  'vitest/react',
  'vitest/react-setup',
  'vite/app',
  'build/database-manifests',
]);
