import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const collector = path.join(scriptDirectory, 'collect.mjs');
const compare = path.join(scriptDirectory, 'compare.mjs');

function run(script, args, options = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
  });
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function prepareCollection(directory, sha, duration, withProcessEvidence = false) {
  const report = 'raw/probe/recorded-01/vitest.json';
  const measurement = 'raw/probe/recorded-01/measurement.json';
  const sample = {
    index: 1,
    measurement,
    metrics: { durationMs: duration },
    phase: 'recorded',
    report,
    ...(withProcessEvidence
      ? {
          tests: {
            files: [
              {
                durationMs: duration,
                evidence: 'owning-process',
                failedTests: 0,
                file: `focused-${duration}.test.ts`,
                process: { peakRssBytes: 1024, wallTimeMs: duration + 10 },
                report,
                retries: 0,
                status: 'passed',
              },
            ],
          },
        }
      : {}),
  };
  await writeJson(path.join(directory, 'summary.json'), {
    schemaVersion: 1,
    measuredSha: sha,
    measuredTree: sha,
    probes: { probe: { aggregates: { durationMs: { median: duration } }, samples: [sample] } },
  });
  await writeJson(path.join(directory, 'raw-samples.json'), [sample]);
  await writeJson(path.join(directory, measurement), {
    schemaVersion: 1,
    probe: 'probe',
    phase: 'recorded',
    metrics: sample.metrics,
  });
  await writeJson(path.join(directory, report), {
    testResults: [{ endTime: duration, name: `focused-${duration}.test.ts`, startTime: 0 }],
  });
  const result = run(collector, ['--output', directory, '--finalize-only']);
  assert.equal(result.status, 0, result.stderr);
}

test('finalizes referenced reports and compare ignores unreferenced stale JSON', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'runjs-collection-'));
  try {
    const base = path.join(directory, 'base');
    const candidate = path.join(directory, 'candidate');
    await prepareCollection(base, 'a'.repeat(40), 100);
    await prepareCollection(candidate, 'b'.repeat(40), 50);
    await writeJson(path.join(candidate, 'stale.json'), {
      testResults: [{ endTime: 99_999, name: 'stale.test.ts', startTime: 0 }],
    });
    const output = path.join(directory, 'comparison.md');
    const result = run(compare, ['--base', base, '--candidate', candidate, '--output', output]);
    assert.equal(result.status, 0, result.stderr);
    const comparison = JSON.parse(await readFile(`${output}.json`, 'utf8'));
    assert.equal(comparison.top30.base[0][0], 'focused-100.test.ts');
    assert.equal(comparison.top30.base[0][1].durationMs, 100);
    assert.equal(comparison.top30.base[0][1].evidence, 'report-only');
    assert.equal(comparison.top30.candidate[0][0], 'focused-50.test.ts');
    assert.equal(comparison.top30.candidate[0][1].durationMs, 50);
    assert.equal(comparison.top30.candidate[0][1].peakRssBytes, null);
    assert.equal(comparison.files.candidate['stale.test.ts'], undefined);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('collects the three focused files as measured subprocess evidence', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'runjs-focused-'));
  try {
    const collectionDirectory = path.join(directory, 'collection');
    const cwd = path.join(directory, 'checkout');
    const bin = path.join(directory, 'bin');
    await prepareCollection(collectionDirectory, 'a'.repeat(40), 100);
    await mkdir(cwd, { recursive: true });
    await mkdir(bin, { recursive: true });
    const yarn = path.join(bin, 'yarn');
    const git = path.join(bin, 'git');
    await writeFile(git, `#!/usr/bin/env node\nconsole.log(process.env.RUNJS_FAKE_SHA || '${'a'.repeat(40)}');\n`);
    await chmod(git, 0o755);
    await writeFile(
      yarn,
      `#!/usr/bin/env node
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const output = args.find((arg) => arg.startsWith('--outputFile='))?.slice('--outputFile='.length);
const lane = process.env.RUNJS_PERF_ADAPTER_LANE;
const files = {
  flow: 'packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/runjs-sources.adapters.test.ts',
  workflow: 'packages/plugins/@nocobase/plugin-workflow-javascript/src/server/__tests__/runjs-source-adapter.test.ts',
};
const file = files[lane] || 'packages/core/client-v2/src/flow/components/code-editor/__tests__/EditorCore.test.tsx';
const duration = lane === 'flow' ? 200 : lane === 'workflow' ? 300 : 100;
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify({
  success: true,
  testResults: [{
    assertionResults: [{ retryCount: lane === 'flow' ? 1 : 0, status: 'passed' }],
    endTime: duration,
    name: file,
    startTime: 0,
    status: 'passed',
  }],
}));
if (lane) {
  const measurement = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
  mkdirSync(path.dirname(measurement), { recursive: true });
  writeFileSync(measurement, JSON.stringify({
    metrics: {
      bootstrapCount: lane === 'flow' ? 3 : 2,
      bootstrapMs: lane === 'flow' ? [10, 20, 30] : [40, 50],
      file,
      lane,
      sessionCount: lane === 'flow' ? 4 : 0,
    },
    phase: process.env.RUNJS_PERF_PHASE,
    probe: 'adapter-tests',
    schemaVersion: 1,
  }));
}
setTimeout(() => {}, 150);
`,
    );
    await chmod(yarn, 0o755);

    const result = run(
      collector,
      ['--cwd', cwd, '--output', collectionDirectory, '--finalize-only', '--focused-tests'],
      { env: { DB_DIALECT: 'postgres', PATH: `${bin}:${process.env.PATH}` } },
    );
    assert.equal(result.status, 0, result.stderr);
    const collection = JSON.parse(await readFile(path.join(collectionDirectory, 'collection.json'), 'utf8'));
    const focusedManifest = JSON.parse(await readFile(path.join(collectionDirectory, 'focused-tests.json'), 'utf8'));
    assert.equal(focusedManifest.measuredSha, 'a'.repeat(40));
    assert.equal(focusedManifest.measuredTree, 'a'.repeat(40));
    assert.equal(collection.reports.length, 4);
    assert.equal(collection.fileEvidence.filter((item) => item.evidence === 'owning-process').length, 3);
    const flow = collection.fileEvidence.find((item) => item.file === focusedFiles.flow);
    assert.equal(flow.bootstrapCount, 3);
    assert.equal(flow.bootstrapWallTimeMs, 60);
    assert.equal(flow.sessionCount, 4);
    assert.equal(flow.retries, 1);
    assert.ok(flow.process.peakRssBytes > 0);
    assert.ok(flow.process.wallTimeMs >= 100);

    const output = path.join(directory, 'comparison.md');
    const compared = run(compare, [
      '--base',
      collectionDirectory,
      '--candidate',
      collectionDirectory,
      '--output',
      output,
    ]);
    assert.equal(compared.status, 0, compared.stderr);
    const comparison = JSON.parse(await readFile(`${output}.json`, 'utf8'));
    assert.equal(comparison.files.base[focusedFiles.flow].evidence, 'owning-process');
    assert.equal(comparison.files.base[focusedFiles.flow].bootstrapCount, 3);
    assert.match(await readFile(output, 'utf8'), /Failures \| Retries \| Evidence/u);

    const mismatch = run(
      collector,
      ['--cwd', cwd, '--output', collectionDirectory, '--finalize-only', '--focused-tests'],
      {
        env: {
          DB_DIALECT: 'postgres',
          PATH: `${bin}:${process.env.PATH}`,
          RUNJS_FAKE_SHA: 'b'.repeat(40),
        },
      },
    );
    assert.notEqual(mismatch.status, 0);
    assert.match(mismatch.stderr, /--cwd identity does not match/u);

    focusedManifest.measuredSha = 'b'.repeat(40);
    const focusedFile = path.join(collectionDirectory, 'focused-tests.json');
    await writeJson(focusedFile, focusedManifest);
    collection.focusedTests.sha256 = createHash('sha256')
      .update(await readFile(focusedFile))
      .digest('hex');
    await writeJson(path.join(collectionDirectory, 'collection.json'), collection);
    const wrongIdentity = run(compare, [
      '--base',
      collectionDirectory,
      '--candidate',
      collectionDirectory,
      '--output',
      output,
    ]);
    assert.notEqual(wrongIdentity.status, 0);
    assert.match(wrongIdentity.stderr, /focused test identity/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

const focusedFiles = {
  flow: 'packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/runjs-sources.adapters.test.ts',
};

test('rejects mixed collector outputs and tampered finalized reports', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'runjs-collection-'));
  try {
    await writeFile(path.join(directory, 'stale.txt'), 'stale\n');
    const mixed = run(collector, ['--output', directory]);
    assert.notEqual(mixed.status, 0);
    assert.match(mixed.stderr, /must be empty/u);

    await rm(directory, { recursive: true, force: true });
    await prepareCollection(directory, 'a'.repeat(40), 100);
    await writeFile(path.join(directory, 'raw/probe/recorded-01/vitest.json'), '{}\n');
    const output = path.join(path.dirname(directory), 'comparison.md');
    const tampered = run(compare, ['--base', directory, '--candidate', directory, '--output', output]);
    assert.notEqual(tampered.status, 0);
    assert.match(tampered.stderr, /finalized SHA-256/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('finalizes owning-process file evidence separately from report-only evidence', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'runjs-collection-'));
  try {
    await prepareCollection(directory, 'a'.repeat(40), 100, true);
    const collection = JSON.parse(await readFile(path.join(directory, 'collection.json'), 'utf8'));
    assert.deepEqual(collection.fileEvidence, [
      {
        durationMs: 100,
        evidence: 'owning-process',
        failedTests: 0,
        file: 'focused-100.test.ts',
        process: { peakRssBytes: 1024, wallTimeMs: 110 },
        report: 'raw/probe/recorded-01/vitest.json',
        retries: 0,
        status: 'passed',
      },
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('regenerates a single-probe gate while finalizing existing evidence', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'runjs-collection-'));
  try {
    const samples = Array.from({ length: 5 }, (_, index) => ({
      index: index + 1,
      measurement: `raw/code-editor/recorded-${index + 1}/measurement.json`,
      metrics: {
        activeWorkerCount: 2,
        overlapDurationMs: 5_100,
        overlapRssBytes: 80 * 1024 ** 2,
        secondWorkerStartupCpuMs: 75,
      },
      phase: 'recorded',
    }));
    await writeJson(path.join(directory, 'summary.json'), {
      schemaVersion: 1,
      measuredSha: 'a'.repeat(40),
      measuredTree: 'b'.repeat(40),
      probes: { 'code-editor': { samples } },
    });
    await writeJson(path.join(directory, 'raw-samples.json'), samples);
    for (const sample of samples) {
      const sampleDirectory = path.dirname(path.join(directory, sample.measurement));
      await writeJson(path.join(directory, sample.measurement), {
        schemaVersion: 1,
        probe: 'code-editor',
        phase: sample.phase,
        metrics: sample.metrics,
      });
      await writeJson(path.join(sampleDirectory, 'vitest.json'), { testResults: [] });
    }
    const gate = path.join(directory, 'task05-shared-worker.json');
    const result = run(collector, ['--output', directory, '--finalize-only', '--gate-output', gate]);
    assert.equal(result.status, 0, result.stderr);
    const generated = JSON.parse(await readFile(gate, 'utf8'));
    assert.equal(generated.sampleCount, 5);
    assert.equal(generated.measurementRoot, directory);
    assert.match(generated.measurementRefs[0].summarySha256, /^[0-9a-f]{64}$/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('supports probe exclusions and skips adapter lanes absent from the measured checkout', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'runjs-collection-'));
  try {
    const checkout = path.join(directory, 'checkout');
    const output = path.join(directory, 'output');
    const gate = path.join(directory, 'task12-adapter-tests.json');
    const bin = path.join(directory, 'bin');
    const flowTest = path.join(
      checkout,
      'packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/runjs-sources.adapters.test.ts',
    );
    await mkdir(path.dirname(flowTest), { recursive: true });
    await mkdir(bin, { recursive: true });
    await writeFile(flowTest, '');

    const git = path.join(bin, 'git');
    await writeFile(git, `#!/usr/bin/env node\nconsole.log('${'a'.repeat(40)}');\n`);
    await chmod(git, 0o755);

    const yarn = path.join(bin, 'yarn');
    await writeFile(
      yarn,
      `#!/usr/bin/env node
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
if (args[0] === '--version') {
  console.log('1.22.0');
  process.exit(0);
}
const report = args.find((arg) => arg.startsWith('--outputFile=')).slice('--outputFile='.length);
const measurement = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
mkdirSync(path.dirname(report), { recursive: true });
writeFileSync(report, JSON.stringify({
  success: true,
  numTotalTests: 1,
  testResults: [{ assertionResults: [{ status: 'passed' }], endTime: 1, name: 'flow', startTime: 0 }],
}));
writeFileSync(measurement, JSON.stringify({
  metrics: { bootstrapCount: 1, bootstrapMs: [1], file: 'flow', lane: 'flow', sessionCount: 1 },
  phase: process.env.RUNJS_PERF_PHASE,
  probe: 'adapter-tests',
  schemaVersion: 1,
}));
`,
    );
    await chmod(yarn, 0o755);

    const result = run(
      collector,
      ['--cwd', checkout, '--suite', 'feature', '--runs', '1', '--output', output, '--gate-output', gate],
      {
        env: {
          DB_DIALECT: 'postgres',
          PATH: `${bin}:${process.env.PATH}`,
          RUNJS_PERF_EXCLUDE_PROBES:
            'code-editor,runtime-resolve,runtime-cache-retention,light-extension-server,compile-worker-idle,source-refresh',
          RUNJS_PERF_SKIP_INSTALL: '1',
        },
      },
    );
    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(await readFile(path.join(output, 'summary.json'), 'utf8'));
    assert.deepEqual(Object.keys(summary.probes), ['adapter-tests']);
    assert.equal(summary.install.action, 'skipped');
    assert.deepEqual(Object.keys(summary.probes['adapter-tests'].samples[0].metrics), ['flow']);
    const generatedGate = JSON.parse(await readFile(gate, 'utf8'));
    assert.equal(generatedGate.decision, 'Pass');
    assert.equal(generatedGate.sampleCount, 1);
    assert.equal(generatedGate.observed.flow.bootstrapCount, 1);
    assert.equal(generatedGate.observed.workflow, undefined);
    assert.equal(generatedGate.thresholds.workflowBootstrapCount, undefined);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
