import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptsDir, '..');
const distDir = path.join(packageRoot, 'dist');
const srcLocaleDir = path.join(packageRoot, 'src', 'locale');
const distLocaleDir = path.join(distDir, 'locale');
const tscBin = require.resolve('typescript/bin/tsc');

rmSync(distDir, { recursive: true, force: true });

const compile = spawnSync(process.execPath, [tscBin, '-p', path.join(packageRoot, 'tsconfig.json')], {
  cwd: packageRoot,
  stdio: 'inherit',
});

if (compile.status !== 0) {
  process.exit(compile.status ?? 1);
}

mkdirSync(distLocaleDir, { recursive: true });

for (const entry of readdirSync(srcLocaleDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.json')) {
    continue;
  }

  copyFileSync(path.join(srcLocaleDir, entry.name), path.join(distLocaleDir, entry.name));
}
