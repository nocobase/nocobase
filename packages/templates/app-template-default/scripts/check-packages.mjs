import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Ask pnpm for exactly the packages the following check selects, respecting workspace exclusions.
const root = path.resolve(import.meta.dirname, '..');
const filter = './packages/**';
const listed = spawnSync(
  'pnpm',
  ['--filter', filter, 'list', '--depth', '-1', '--json'],
  {
    cwd: root,
    encoding: 'utf8',
  },
);
if (listed.error) throw listed.error;
if (listed.status !== 0) {
  process.stderr.write(listed.stderr);
  process.exit(listed.status ?? 1);
}
const packages = JSON.parse(listed.stdout || '[]');
const missing = packages.filter(({ path: directory }) => {
  const manifest = JSON.parse(
    readFileSync(path.join(directory, 'package.json'), 'utf8'),
  );
  return (
    typeof manifest.scripts?.check !== 'string' ||
    !manifest.scripts.check.trim()
  );
});
if (missing.length > 0) {
  console.error(
    'Every internal package must provide a non-empty check script:',
  );
  for (const entry of missing)
    console.error(`  ${path.relative(root, entry.path)}`);
  process.exit(1);
}
if (packages.length > 0) {
  const result = spawnSync('pnpm', ['--filter', filter, 'check'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
