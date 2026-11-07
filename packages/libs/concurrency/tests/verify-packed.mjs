import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const artifacts = resolve(
  process.argv[2] ?? mkdtempSync(join(tmpdir(), 'concurrency-artifacts-')),
);
mkdirSync(artifacts, { recursive: true });
const tarball = join(artifacts, `nocobase-concurrency-${metadata.version}.tgz`);
execFileSync('pnpm', ['pack', '--out', tarball], {
  cwd: root,
  stdio: 'inherit',
});
const consumer = mkdtempSync(join(tmpdir(), 'concurrency-consumer-'));
const tsVersion = JSON.parse(
  readFileSync(join(root, 'node_modules/typescript/package.json'), 'utf8'),
).version;
writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify({
    name: 'concurrency-packed-consumer',
    private: true,
    type: 'module',
  }),
);
execFileSync(
  'npm',
  [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    tarball,
    `typescript@${tsVersion}`,
  ],
  { cwd: consumer, stdio: 'inherit' },
);
writeFileSync(
  join(consumer, 'consumer.ts'),
  readFileSync(join(root, 'tests/consumer.ts'), 'utf8').replaceAll(
    '../src/index.ts',
    '@nocobase/concurrency',
  ),
);
writeFileSync(
  join(consumer, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      strict: true,
      target: 'ES2022',
      module: 'NodeNext',
      noEmit: true,
      skipLibCheck: false,
    },
    include: ['consumer.ts'],
  }),
);
execFileSync(
  process.execPath,
  [join(consumer, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'],
  { cwd: consumer, stdio: 'inherit' },
);
writeFileSync(
  join(consumer, 'run.mjs'),
  `
import assert from 'node:assert/strict';
import * as core from '@nocobase/concurrency';
assert.match(import.meta.resolve('@nocobase/concurrency'), /node_modules.*concurrency.*dist/);
assert.deepEqual(Object.keys(core).sort(), ['ConcurrentAbortError','ConcurrentAcquireError','ConcurrentCloseError','ConcurrentConfigurationError','ConcurrentReleaseError'].sort());
for (const ErrorClass of Object.values(core)) {
  const cause = new Error('original');
  const error = new ErrorClass('operation', { cause });
  assert.equal(error.cause, cause);
  assert.ok(error instanceof Error);
}
for (const path of ['backend','testing']) {
  assert.throws(() => import.meta.resolve('@nocobase/concurrency/' + path), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
}
console.log(JSON.stringify({ resolved: import.meta.resolve('@nocobase/concurrency'), exports: Object.keys(core) }));
`,
);
execFileSync(process.execPath, ['run.mjs'], {
  cwd: consumer,
  stdio: 'inherit',
});
const evidence = {
  tarball,
  consumer,
  sha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'),
};
writeFileSync(
  join(artifacts, 'concurrency-evidence.json'),
  JSON.stringify(evidence, null, 2),
);
console.log(JSON.stringify(evidence));
