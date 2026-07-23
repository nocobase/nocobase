import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const scriptDirectory = path.dirname(testDirectory);
const validator = path.join(scriptDirectory, 'validate-gates.mjs');
const worktreePreparer = path.join(scriptDirectory, 'prepare-comparison-worktrees.mjs');
const gateManifest = path.join(scriptDirectory, 'gate-manifest.json');

function runNode(script, args, cwd = process.cwd()) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

async function withTempDirectory(callback) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'runjs-gates-'));
  try {
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function hash(value) {
  return createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex');
}

function gateContract(taskId) {
  const cleanup = {
    measuredSha: 'cccccccccccccccccccccccccccccccccccccccc',
    measuredTree: 'dddddddddddddddddddddddddddddddddddddddd',
  };
  const contracts = {
    task05: {
      file: 'task05-shared-worker.json',
      gateType: 'conditional',
      probe: 'code-editor',
      decision: 'No-Go',
      sampleCount: 5,
      observed: { qualifyingRuns: 1, overlapRssBytes: 0, secondWorkerStartupCpuMedianMs: 0 },
      thresholds: { qualifyingRuns: 3, overlapRssBytes: 80 * 1024 ** 2, secondWorkerStartupCpuMedianMs: 75 },
      measuredSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      measuredTree: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    },
    task06: {
      ...cleanup,
      file: 'task06-runtime-lru.json',
      gateType: 'conditional',
      probe: 'runtime-cache-retention',
      decision: 'No-Go',
      sampleCount: 30,
      observed: {
        artifactCount: 500,
        artifactEntriesAfterIdle: 499,
        artifactEntriesBeforeIdle: 500,
        descriptorScopes: 100,
        didNotShrink: false,
        durationMinutes: 30,
        heapBytes: { retained: 0 },
        idleMinutes: 5,
      },
      thresholds: { retainedBytes: 64 * 1024 ** 2, artifactEntries: 500, sessionMinutes: 30, idleMinutes: 5 },
    },
    task08: {
      ...cleanup,
      file: 'task08-idle-worker.json',
      gateType: 'conditional',
      probe: 'compile-worker-idle',
      decision: 'No-Go',
      sampleCount: 30,
      observed: {
        accepted: true,
        idleMinutes: 10,
        recreateP95Ms: 100,
        retainedRssBytes: 0,
        submitMs: 100,
        workerCount: 1,
      },
      thresholds: { retainedRssBytes: 64 * 1024 ** 2, recreateP95Ms: 300, idleMinutes: 10 },
    },
    task09: {
      ...cleanup,
      file: 'task09-binding-index.json',
      gateType: 'conditional',
      probe: 'source-refresh',
      decision: 'No-Go',
      sampleCount: 30,
      observed: { loadedModels: 500, matchingModels: 10, saveSamplesPerRun: 30, scanP95Ms: 50, scanSharePercent: 10 },
      thresholds: { scanP95Ms: 100, scanSharePercent: 20 },
    },
    task12: {
      ...cleanup,
      file: 'task12-adapter-tests.json',
      gateType: 'mandatory',
      probe: 'adapter-tests',
      decision: 'Pass',
      sampleCount: 3,
      observed: {
        flow: { bootstrapCount: 6, bootstrapWallTimeMs: 60, sessionCount: 3 },
        peakRssBytes: 200,
        wallTimeMs: 1_000,
        workflow: { bootstrapCount: 2, bootstrapWallTimeMs: 20, sessionCount: 1 },
      },
      thresholds: { flowBootstrapCount: 6, workflowBootstrapCount: 2 },
    },
  };
  return contracts[taskId];
}

async function prepareGateDirectory(directory) {
  for (const taskId of ['task05', 'task06', 'task08', 'task09', 'task12']) {
    const contract = gateContract(taskId);
    const measurementRoot = path.join(directory, 'measurements', taskId);
    const phases = Array.from({ length: contract.sampleCount }, (_, index) => ({
      index: index + 1,
      measurement: `raw/${index + 1}/measurement.json`,
      metrics:
        taskId === 'task05'
          ? {
              activeWorkerCount: index === 0 ? 2 : 1,
              overlapDurationMs: index === 0 ? 5_100 : 0,
              overlapRssBytes: 0,
              secondWorkerStartupCpuMs: 0,
            }
          : taskId === 'task06'
            ? {
                artifactCount: 500,
                artifactEntriesAfterIdle: 499,
                artifactEntriesBeforeIdle: 500,
                descriptorScopes: 100,
                durationMinutes: 30,
                heapBytes: { retained: 0 },
                idleMinutes: 5,
              }
            : taskId === 'task08'
              ? { accepted: true, idleMinutes: 10, retainedRssBytes: 0, submitMs: 100, workerCount: 1 }
              : taskId === 'task09'
                ? {
                    loadedModels: 500,
                    matchingModels: 10,
                    postSaveRefreshSamplesMs: Array.from({ length: 30 }, () => 500),
                    scanP95Ms: 999,
                    scanSamplesMs: Array.from({ length: 30 }, () => 50),
                    scanSharePercent: 10,
                  }
                : taskId === 'task12'
                  ? {
                      flow: { bootstrapCount: 6, bootstrapMs: [20, 40], sessionCount: 3 },
                      workflow: { bootstrapCount: 2, bootstrapMs: [20], sessionCount: 1 },
                    }
                  : contract.observed,
      phase: taskId === 'task06' || taskId === 'task08' ? 'restart' : 'recorded',
      process: { peakRssBytes: 200, wallTimeMs: 1_000 },
    }));
    if (taskId === 'task06' || taskId === 'task08') {
      phases.unshift({ ...phases[0], index: 0, measurement: 'raw/soak/measurement.json', phase: 'soak' });
    }
    const summary = {
      schemaVersion: 1,
      measuredSha: contract.measuredSha,
      measuredTree: contract.measuredTree,
      probes: { [contract.probe]: { samples: [{ ...phases[0], phase: 'warmup' }, ...phases] } },
    };
    const gate = {
      schemaVersion: 1,
      generatedAt: '2026-07-21T00:00:00.000Z',
      taskId,
      gateType: contract.gateType,
      decision: contract.decision,
      probe: contract.probe,
      measuredSha: contract.measuredSha,
      measuredTree: contract.measuredTree,
      measurementRoot,
      measurementRefs: [
        {
          summary: 'summary.json',
          summarySha256: hash(summary),
          rawSamples: 'raw-samples.json',
          rawSamplesSha256: hash(phases),
        },
      ],
      sampleCount: contract.sampleCount,
      thresholds: contract.thresholds,
      observed: contract.observed,
    };
    await writeJson(path.join(measurementRoot, 'summary.json'), summary);
    await writeJson(path.join(measurementRoot, 'raw-samples.json'), phases);
    for (const sample of phases) {
      await writeJson(path.join(measurementRoot, sample.measurement), {
        schemaVersion: 1,
        probe: contract.probe,
        phase: sample.phase,
        metrics: sample.metrics,
      });
    }
    await writeJson(path.join(directory, contract.file), gate);
  }
}

function integrationManifest() {
  return {
    schemaVersion: 1,
    task05DecisionInputSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    task05DecisionInputTree: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    cleanupAfterCodeSha: 'cccccccccccccccccccccccccccccccccccccccc',
    cleanupAfterCodeTree: 'dddddddddddddddddddddddddddddddddddddddd',
  };
}

test('validates a single conditional gate', async () => {
  await withTempDirectory(async (directory) => {
    await prepareGateDirectory(directory);
    const result = runNode(validator, [path.join(directory, 'task05-shared-worker.json')]);
    assert.equal(result.status, 0, result.stderr);
  });
});

test('rejects invalid schema, decision type, and measurement references', async () => {
  await withTempDirectory(async (directory) => {
    const gates = path.join(directory, 'gates');
    await prepareGateDirectory(gates);
    const gate = await readJson(path.join(gates, 'task05-shared-worker.json'));
    for (const [name, mutate, expected] of [
      ['schema.json', (value) => (value.schemaVersion = 2), 'schemaVersion'],
      ['decision.json', (value) => (value.decision = 'Pass'), 'decision'],
      ['refs.json', (value) => (value.measurementRefs = []), 'measurementRefs'],
      [
        'traversal.json',
        (value) => (value.measurementRefs[0].summary = '../summary.json'),
        'relative JSON path',
      ],
    ]) {
      const value = structuredClone(gate);
      mutate(value);
      const file = path.join(directory, name);
      await writeJson(file, value);
      const result = runNode(validator, [file]);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, new RegExp(expected, 'u'));
    }
  });
});

test('rejects a mandatory Fail decision', async () => {
  await withTempDirectory(async (directory) => {
    const gates = path.join(directory, 'gates');
    await prepareGateDirectory(gates);
    const file = path.join(gates, 'task12-adapter-tests.json');
    const gate = await readJson(file);
    gate.decision = 'Fail';
    gate.observed.flow.bootstrapCount = 7;
    const rawFile = path.join(gate.measurementRoot, 'raw-samples.json');
    const raw = await readJson(rawFile);
    for (const sample of raw) sample.metrics.flow.bootstrapCount = 7;
    await writeJson(rawFile, raw);
    const summaryFile = path.join(gate.measurementRoot, 'summary.json');
    const summary = await readJson(summaryFile);
    for (const sample of summary.probes[gate.probe].samples.filter((sample) => sample.phase === 'recorded')) {
      sample.metrics.flow.bootstrapCount = 7;
    }
    await writeJson(summaryFile, summary);
    for (const sample of raw) {
      const measurementFile = path.join(gate.measurementRoot, sample.measurement);
      const measurement = await readJson(measurementFile);
      measurement.metrics.flow.bootstrapCount = 7;
      await writeJson(measurementFile, measurement);
    }
    gate.measurementRefs[0].rawSamplesSha256 = hash(raw);
    gate.measurementRefs[0].summarySha256 = hash(summary);
    await writeJson(file, gate);
    const result = runNode(validator, [file]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /mandatory gate failed/u);
  });
});

test('validates exactly five manifest gates against integration SHA and tree refs', async () => {
  await withTempDirectory(async (directory) => {
    const gates = path.join(directory, 'gates');
    await prepareGateDirectory(gates);
    const integration = path.join(directory, 'integration.json');
    await writeJson(integration, integrationManifest());
    const result = runNode(validator, [
      '--manifest',
      gateManifest,
      '--directory',
      gates,
      '--integration-manifest',
      integration,
    ]);
    assert.equal(result.status, 0, result.stderr);
  });
});

test('manifest mode rejects missing, extra, duplicate, mismatched, and stale evidence', async () => {
  await withTempDirectory(async (directory) => {
    const baseManifest = await readJson(gateManifest);
    const integration = path.join(directory, 'integration.json');
    await writeJson(integration, integrationManifest());

    const cases = [
      {
        name: 'missing',
        setup: async (gates) => rm(path.join(gates, 'task09-binding-index.json')),
        args: () => gateManifest,
        expected: /missing/u,
      },
      {
        name: 'extra',
        setup: async (gates) => writeJson(path.join(gates, 'task99-fake.json'), {}),
        args: () => gateManifest,
        expected: /unexpected JSON/u,
      },
      {
        name: 'duplicate',
        setup: async () => undefined,
        args: async (caseDirectory) => {
          const manifest = structuredClone(baseManifest);
          manifest.gates[4] = structuredClone(manifest.gates[0]);
          const file = path.join(caseDirectory, 'manifest.json');
          await writeJson(file, manifest);
          return file;
        },
        expected: /duplicate|missing/u,
      },
      {
        name: 'probe',
        setup: async (gates) => {
          const file = path.join(gates, 'task06-runtime-lru.json');
          const gate = await readJson(file);
          gate.probe = 'code-editor';
          await writeJson(file, gate);
        },
        args: () => gateManifest,
        expected: /probe/u,
      },
      {
        name: 'stale',
        setup: async (gates) => {
          const file = path.join(gates, 'task08-idle-worker.json');
          const gate = await readJson(file);
          gate.measuredSha = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
          await writeJson(file, gate);
        },
        args: () => gateManifest,
        expected: /does not match/u,
      },
    ];

    for (const testCase of cases) {
      const caseDirectory = path.join(directory, testCase.name);
      const gates = path.join(caseDirectory, 'gates');
      await prepareGateDirectory(gates);
      await testCase.setup(gates);
      const manifest = await testCase.args(caseDirectory);
      const result = runNode(validator, [
        '--manifest',
        manifest,
        '--directory',
        gates,
        '--integration-manifest',
        integration,
      ]);
      assert.notEqual(result.status, 0, testCase.name);
      assert.match(result.stderr, testCase.expected, testCase.name);
    }
  });
});

test('rejects tampered hashes, identities, observed values, phases, sample counts, and measurement files', async () => {
  await withTempDirectory(async (directory) => {
    const cases = [
      {
        name: 'hash',
        task: 'task05-shared-worker.json',
        mutate: async (gate) => {
          gate.measurementRefs[0].summarySha256 = '0'.repeat(64);
        },
        expected: /SHA-256 mismatch/u,
      },
      {
        name: 'identity',
        task: 'task05-shared-worker.json',
        mutate: async (gate) => {
          const summaryFile = path.join(gate.measurementRoot, 'summary.json');
          const summary = await readJson(summaryFile);
          summary.measuredTree = 'e'.repeat(40);
          await writeJson(summaryFile, summary);
          gate.measurementRefs[0].summarySha256 = hash(summary);
        },
        expected: /summary identity/u,
      },
      {
        name: 'observed',
        task: 'task05-shared-worker.json',
        mutate: async (gate) => {
          gate.observed.qualifyingRuns = 0;
        },
        expected: /observed metrics/u,
      },
      {
        name: 'phase',
        task: 'task08-idle-worker.json',
        mutate: async (gate) => {
          const rawFile = path.join(gate.measurementRoot, 'raw-samples.json');
          const raw = await readJson(rawFile);
          raw[0].phase = 'restart';
          await writeJson(rawFile, raw);
          const summaryFile = path.join(gate.measurementRoot, 'summary.json');
          const summary = await readJson(summaryFile);
          summary.probes[gate.probe].samples[1].phase = 'restart';
          await writeJson(summaryFile, summary);
          gate.measurementRefs[0].rawSamplesSha256 = hash(raw);
          gate.measurementRefs[0].summarySha256 = hash(summary);
        },
        expected: /phases do not match/u,
      },
      {
        name: 'count',
        task: 'task09-binding-index.json',
        mutate: async (gate) => {
          gate.sampleCount = 29;
        },
        expected: /sampleCount must be 30/u,
      },
      {
        name: 'measurement',
        task: 'task12-adapter-tests.json',
        mutate: async (gate) => {
          const rawFile = path.join(gate.measurementRoot, 'raw-samples.json');
          const raw = await readJson(rawFile);
          const measurementFile = path.join(gate.measurementRoot, raw[0].measurement);
          const measurement = await readJson(measurementFile);
          measurement.metrics.flow.bootstrapCount = 5;
          await writeJson(measurementFile, measurement);
        },
        expected: /measurement file/u,
      },
      {
        name: 'task06-scope-count',
        task: 'task06-runtime-lru.json',
        mutate: async (gate) => {
          const rawFile = path.join(gate.measurementRoot, 'raw-samples.json');
          const raw = await readJson(rawFile);
          raw[0].metrics.descriptorScopes = 99;
          await writeJson(rawFile, raw);
          const summaryFile = path.join(gate.measurementRoot, 'summary.json');
          const summary = await readJson(summaryFile);
          summary.probes[gate.probe].samples[1].metrics.descriptorScopes = 99;
          await writeJson(summaryFile, summary);
          const measurementFile = path.join(gate.measurementRoot, raw[0].measurement);
          const measurement = await readJson(measurementFile);
          measurement.metrics.descriptorScopes = 99;
          await writeJson(measurementFile, measurement);
          gate.measurementRefs[0].rawSamplesSha256 = hash(raw);
          gate.measurementRefs[0].summarySha256 = hash(summary);
        },
        expected: /500 artifacts across 100 descriptor scopes/u,
      },
      {
        name: 'task08-compile-result',
        task: 'task08-idle-worker.json',
        mutate: async (gate) => {
          const rawFile = path.join(gate.measurementRoot, 'raw-samples.json');
          const raw = await readJson(rawFile);
          raw[0].metrics.accepted = false;
          await writeJson(rawFile, raw);
          const summaryFile = path.join(gate.measurementRoot, 'summary.json');
          const summary = await readJson(summaryFile);
          summary.probes[gate.probe].samples[1].metrics.accepted = false;
          await writeJson(summaryFile, summary);
          const measurementFile = path.join(gate.measurementRoot, raw[0].measurement);
          const measurement = await readJson(measurementFile);
          measurement.metrics.accepted = false;
          await writeJson(measurementFile, measurement);
          gate.measurementRefs[0].rawSamplesSha256 = hash(raw);
          gate.measurementRefs[0].summarySha256 = hash(summary);
        },
        expected: /successful accepted compile/u,
      },
      {
        name: 'task12-median-rss',
        task: 'task12-adapter-tests.json',
        mutate: async (gate) => {
          gate.observed.peakRssBytes = 201;
        },
        expected: /observed metrics/u,
      },
    ];

    for (const testCase of cases) {
      const gates = path.join(directory, testCase.name);
      await prepareGateDirectory(gates);
      const file = path.join(gates, testCase.task);
      const gate = await readJson(file);
      await testCase.mutate(gate);
      await writeJson(file, gate);
      const result = runNode(validator, [file]);
      assert.notEqual(result.status, 0, testCase.name);
      assert.match(result.stderr, testCase.expected, testCase.name);
    }
  });
});

test('validates integration topology and trees before creating detached worktrees', async () => {
  await withTempDirectory(async (directory) => {
    const repository = path.join(directory, 'repo');
    run('git', ['init', '--quiet', repository], directory);
    run('git', ['config', 'user.name', 'RunJS Test'], repository);
    run('git', ['config', 'user.email', 'runjs@example.test'], repository);
    const commits = [];
    for (const content of ['next', 'before', 'task02', 'task04', 'after']) {
      await writeFile(path.join(repository, 'state.txt'), `${content}\n`);
      run('git', ['add', 'state.txt'], repository);
      run('git', ['commit', '--quiet', '-m', content], repository);
      commits.push(run('git', ['rev-parse', 'HEAD'], repository));
    }
    const trees = commits.map((commit) => run('git', ['rev-parse', `${commit}^{tree}`], repository));
    const manifest = {
      schemaVersion: 1,
      latestNextSha: commits[0],
      latestNextTree: trees[0],
      cleanupBeforeSha: commits[1],
      cleanupBeforeTree: trees[1],
      task05DecisionInputSha: commits[3],
      task05DecisionInputTree: trees[3],
      cleanupAfterCodeSha: commits[4],
      cleanupAfterCodeTree: trees[4],
      cleanupCommits: commits.slice(2).map((sha, index) => ({ sha, tree: trees[index + 2] })),
    };
    const manifestFile = path.join(repository, 'integration.json');
    await writeJson(manifestFile, manifest);
    const targets = {
      next: path.join(directory, 'next'),
      before: path.join(directory, 'before'),
      decision: path.join(directory, 'decision'),
      after: path.join(directory, 'after'),
    };
    const result = runNode(
      worktreePreparer,
      [
        '--manifest',
        manifestFile,
        '--before',
        targets.before,
        '--after',
        targets.after,
        '--next',
        targets.next,
        '--task05-decision',
        targets.decision,
      ],
      repository,
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(run('git', ['rev-parse', 'HEAD'], targets.next), commits[0]);
    assert.equal(run('git', ['rev-parse', 'HEAD'], targets.before), commits[1]);
    assert.equal(run('git', ['rev-parse', 'HEAD'], targets.decision), commits[3]);
    assert.equal(run('git', ['rev-parse', 'HEAD'], targets.after), commits[4]);
    for (const target of Object.values(targets)) run('git', ['worktree', 'remove', '--force', target], repository);

    manifest.cleanupBeforeTree = trees[0];
    await writeJson(manifestFile, manifest);
    const invalidTarget = path.join(directory, 'must-not-exist');
    const invalid = runNode(
      worktreePreparer,
      [
        '--manifest',
        manifestFile,
        '--before',
        invalidTarget,
        '--after',
        `${invalidTarget}-after`,
        '--next',
        `${invalidTarget}-next`,
        '--task05-decision',
        `${invalidTarget}-decision`,
      ],
      repository,
    );
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /tree mismatch/u);
  });
});
