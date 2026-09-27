import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

rmSync(path.join(packageRoot, 'dist'), { force: true, recursive: true });

const compile = spawnSync(
  process.execPath,
  [require.resolve('typescript/bin/tsc'), '-p', packageRoot],
  {
    cwd: packageRoot,
    stdio: 'inherit',
  },
);

process.exit(compile.status ?? 1);
