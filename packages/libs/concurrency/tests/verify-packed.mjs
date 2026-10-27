import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const artifactDir = resolve(
  process.argv[2] ?? mkdtempSync(join(tmpdir(), 'concurrency-artifacts-')),
);
mkdirSync(artifactDir, { recursive: true });
const tarball = join(
  artifactDir,
  `nocobase-concurrency-${metadata.version}.tgz`,
);
execFileSync('pnpm', ['pack', '--out', tarball], {
  cwd: root,
  stdio: 'inherit',
});
const consumer = mkdtempSync(join(tmpdir(), 'concurrency-consumer-'));
writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify({
    name: 'concurrency-packed-consumer',
    private: true,
    type: 'module',
  }),
);
const tsVersion = JSON.parse(
  readFileSync(join(root, 'node_modules/typescript/package.json'), 'utf8'),
).version;
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
  readFileSync(join(root, 'tests/consumer.ts'), 'utf8')
    .replaceAll('../src/index.ts', '@nocobase/concurrency')
    .replaceAll('../src/backend/index.ts', '@nocobase/concurrency/backend')
    .replaceAll('../src/testing/index.ts', '@nocobase/concurrency/testing'),
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
import * as port from '@nocobase/concurrency/backend';
import * as testing from '@nocobase/concurrency/testing';
for (const entry of ['@nocobase/concurrency', '@nocobase/concurrency/backend', '@nocobase/concurrency/testing']) {
  assert.match(import.meta.resolve(entry), /node_modules.*concurrency.*dist/);
}
for (const name of ['ConcurrentConfigurationError','ConcurrentAcquireError','ConcurrentAbortError','ConcurrentLeaseLostError','ConcurrentReleaseError','ConcurrentCloseError']) {
  assert.equal(core[name], port[name]); assert.equal(core[name], testing[name]);
}
const held = new Map();
const result = await testing.runBackendContract({ createBackend: () => new testing.ControlledBackend({
  acquire: async (request, context) => {
    const key = JSON.stringify([request.resource.namespace,request.resource.kind,request.resource.name]);
    if (held.has(key)) return undefined;
    held.set(key, request.token);
    return { notAfter: context.clock.now() + request.resource.ttl, release: async () => { if (held.get(key) === request.token) held.delete(key); } };
  },
}) });
assert.equal(held.size, 0);
const backend = new testing.ControlledBackend({ acquire: async (request, context) => ({ notAfter: context.clock.now()+request.resource.ttl, release: async () => {} }) });
const runtime = await core.createConcurrentRuntime({ backend, namespace: 'example' });
assert.equal(await (await runtime.manager.createSynchronous('report')).run(({signal}) => { signal.throwIfAborted(); return 42; }), 42);
await runtime.close(); await backend.close();
console.log(JSON.stringify({ backend: result, faults: await testing.runCoreFaultContract() }));
`,
);
execFileSync(process.execPath, ['run.mjs'], {
  cwd: consumer,
  stdio: 'inherit',
});
const evidence = {
  tarball,
  sha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'),
  consumer,
  version: metadata.version,
  status: 'passed',
};
writeFileSync(
  join(artifactDir, 'evidence.json'),
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(JSON.stringify(evidence));
