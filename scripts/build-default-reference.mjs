// Build the workspace's runnable reference without changing the manifest that releases pack as a template.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
// pnpm's workspace bin shims address sibling packages relative to their directory.
const parent = path.resolve(
  import.meta.dirname,
  '../packages/.reference-builds',
);
fs.mkdirSync(parent, { recursive: true });
const stage = fs.mkdtempSync(path.join(parent, 'default-'));
try {
  const transient = new Set([
    'node_modules',
    'dist',
    'storage',
    'coverage',
    'test-results',
    'playwright-report',
    '.agents',
    '.claude',
    '.cursor',
  ]);
  fs.cpSync(root, stage, {
    recursive: true,
    filter: (file) =>
      !transient.has(path.relative(root, file).split(path.sep)[0]),
  });
  fs.symlinkSync(
    path.join(root, 'node_modules'),
    path.join(stage, 'node_modules'),
    'junction',
  );
  const file = path.join(stage, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  const sqlite = '@nocobase/db-sqlite';
  manifest.dependencies[sqlite] = manifest.devDependencies[sqlite];
  delete manifest.devDependencies[sqlite];
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
  const run = spawnSync(
    'pnpm',
    ['exec', 'nocobase', 'build', ...process.argv.slice(2)],
    { cwd: stage, stdio: 'inherit' },
  );
  if (run.error) throw run.error;
  if (run.status !== 0) process.exitCode = run.status ?? 1;
  else {
    fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
    fs.renameSync(path.join(stage, 'dist'), path.join(root, 'dist'));
    if (process.argv.includes('--tar')) {
      const archives = path.join(root, 'storage', 'exports');
      fs.mkdirSync(archives, { recursive: true });
      fs.renameSync(
        path.join(stage, 'storage/exports/dist.tar.gz'),
        path.join(archives, 'dist.tar.gz'),
      );
    }
  }
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}
