#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';

const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const REF_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*\.json$/u;
const CANONICAL_GATES = new Map(
  [
    ['task05', 'task05-shared-worker.json', 'conditional', 'code-editor', 'task05DecisionInput'],
    ['task06', 'task06-runtime-lru.json', 'conditional', 'runtime-cache-retention', 'cleanupAfterCode'],
    ['task08', 'task08-idle-worker.json', 'conditional', 'compile-worker-idle', 'cleanupAfterCode'],
    ['task09', 'task09-binding-index.json', 'conditional', 'source-refresh', 'cleanupAfterCode'],
    ['task12', 'task12-adapter-tests.json', 'mandatory', 'adapter-tests', 'cleanupAfterCode'],
  ].map(([taskId, file, gateType, probe, integrationRef]) => [
    taskId,
    { file, gateType, integrationRef, probe, taskId },
  ]),
);

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function readJson(file) {
  let content;
  try {
    content = await readFile(file, 'utf8');
  } catch (error) {
    fail(`Cannot read ${file}: ${error.message}`);
  }
  try {
    return JSON.parse(content);
  } catch (error) {
    fail(`Invalid JSON in ${file}: ${error.message}`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} must be a non-empty string`);
  return value;
}

function requireSha(value, label) {
  const sha = requireString(value, label);
  if (!SHA_PATTERN.test(sha)) fail(`${label} must be a lowercase 40-character Git object id`);
  return sha;
}

function validateMeasurementPath(value, label) {
  const ref = requireString(value, label);
  if (path.isAbsolute(ref) || ref.split('/').includes('..') || !REF_PATTERN.test(ref)) {
    fail(`${label} must be a relative JSON path without parent traversal`);
  }
  return ref;
}

function requireNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(`${label} must be a finite number`);
  return value;
}

function requireInteger(value, label) {
  const number = requireNumber(value, label);
  if (!Number.isInteger(number) || number < 0) fail(`${label} must be a non-negative integer`);
  return number;
}

function requireExactNumber(value, expected, label) {
  if (requireNumber(value, label) !== expected) fail(`${label} must be ${expected}`);
}

function stats(samples) {
  const sorted = [...samples].sort((left, right) => left - right);
  return {
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)],
  };
}

function adapterMetrics(samples, label) {
  const lane = (name) => {
    for (const [index, sample] of samples.entries()) {
      if (!isObject(sample.metrics[name]) || !Array.isArray(sample.metrics[name].bootstrapMs)) {
        fail(`${label} sample ${index + 1} is missing ${name} adapter metrics`);
      }
    }
    return {
      bootstrapCount: stats(samples.map((sample) => sample.metrics[name].bootstrapCount)).median,
      bootstrapWallTimeMs: stats(
        samples.map((sample) => sample.metrics[name].bootstrapMs.reduce((sum, value) => sum + value, 0)),
      ).median,
      sessionCount: stats(samples.map((sample) => sample.metrics[name].sessionCount)).median,
    };
  };
  for (const [index, sample] of samples.entries()) {
    requireNumber(sample.process?.peakRssBytes, `${label} sample ${index + 1} process.peakRssBytes`);
    requireNumber(sample.process?.wallTimeMs, `${label} sample ${index + 1} process.wallTimeMs`);
  }
  return {
    flow: lane('flow'),
    peakRssBytes: stats(samples.map((sample) => sample.process.peakRssBytes)).median,
    wallTimeMs: stats(samples.map((sample) => sample.process.wallTimeMs)).median,
    workflow: lane('workflow'),
  };
}

function evidenceObserved(taskId, samples, label) {
  const recorded = samples.filter((sample) => sample.phase === 'recorded' || sample.phase === 'restart');
  const soak = samples.find((sample) => sample.phase === 'soak');
  switch (taskId) {
    case 'task05': {
      const qualifyingRuns = recorded.filter(
        (sample) => sample.metrics.activeWorkerCount >= 2 && sample.metrics.overlapDurationMs >= 5_000,
      ).length;
      return {
        qualifyingRuns,
        overlapRssBytes: stats(recorded.map((sample) => sample.metrics.overlapRssBytes)).median,
        secondWorkerStartupCpuMedianMs: stats(recorded.map((sample) => sample.metrics.secondWorkerStartupCpuMs)).median,
      };
    }
    case 'task06': {
      const metrics = soak?.metrics;
      if (!isObject(metrics)) fail(`${label} is missing its soak metrics`);
      for (const sample of samples) {
        if (
          (sample.metrics.artifactCount ?? sample.metrics.artifactEntriesAfterIdle) !== 500 ||
          sample.metrics.descriptorScopes !== 100
        ) {
          fail(`${label} must measure exactly 500 artifacts across 100 descriptor scopes in every sample`);
        }
      }
      return {
        ...metrics,
        didNotShrink: metrics.artifactEntriesAfterIdle >= metrics.artifactEntriesBeforeIdle,
      };
    }
    case 'task08': {
      const metrics = soak?.metrics;
      if (!isObject(metrics)) fail(`${label} is missing its soak metrics`);
      for (const sample of samples) {
        if (
          sample.metrics.accepted !== true ||
          requireInteger(sample.metrics.workerCount, `${label}.workerCount`) < 1
        ) {
          fail(`${label} must persist a successful accepted compile with an existing Worker in every sample`);
        }
      }
      return {
        ...metrics,
        recreateP95Ms: stats(recorded.map((sample) => sample.metrics.submitMs)).p95,
      };
    }
    case 'task09': {
      for (const sample of recorded) {
        if (sample.metrics.loadedModels !== 500 || sample.metrics.matchingModels !== 10) {
          fail(`${label} must measure 500 loaded models and 10 matching models in every sample`);
        }
        if (!Array.isArray(sample.metrics.scanSamplesMs) || sample.metrics.scanSamplesMs.length !== 30) {
          fail(`${label} must contain 30 save samples per recorded run`);
        }
        if (
          !Array.isArray(sample.metrics.postSaveRefreshSamplesMs) ||
          sample.metrics.postSaveRefreshSamplesMs.length !== 30
        ) {
          fail(`${label} must contain 30 post-save refresh samples per recorded run`);
        }
      }
      const scanSamples = recorded.flatMap((sample, sampleIndex) =>
        sample.metrics.scanSamplesMs.map((value, index) =>
          requireNumber(value, `${label} sample ${sampleIndex + 1} scanSamplesMs[${index}]`),
        ),
      );
      const refreshSamples = recorded.flatMap((sample, sampleIndex) =>
        sample.metrics.postSaveRefreshSamplesMs.map((value, index) => {
          const duration = requireNumber(
            value,
            `${label} sample ${sampleIndex + 1} postSaveRefreshSamplesMs[${index}]`,
          );
          if (duration <= 0) fail(`${label} post-save refresh samples must be positive`);
          return duration;
        }),
      );
      return {
        loadedModels: 500,
        matchingModels: 10,
        saveSamplesPerRun: 30,
        scanP95Ms: stats(scanSamples).p95,
        scanSharePercent:
          (scanSamples.reduce((sum, sample) => sum + sample, 0) /
            refreshSamples.reduce((sum, sample) => sum + sample, 0)) *
          100,
      };
    }
    case 'task12': {
      return adapterMetrics(recorded, label);
    }
    default:
      fail(`${label} has an unsupported taskId`);
  }
}

function derivedDecision(gate, label) {
  const observed = gate.observed;
  const thresholds = gate.thresholds;
  switch (gate.taskId) {
    case 'task05':
      if (gate.sampleCount !== 5) fail(`${label}.sampleCount must be 5`);
      requireExactNumber(thresholds.qualifyingRuns, 3, `${label}.thresholds.qualifyingRuns`);
      requireExactNumber(thresholds.overlapRssBytes, 80 * 1024 ** 2, `${label}.thresholds.overlapRssBytes`);
      requireExactNumber(
        thresholds.secondWorkerStartupCpuMedianMs,
        75,
        `${label}.thresholds.secondWorkerStartupCpuMedianMs`,
      );
      return requireInteger(observed.qualifyingRuns, `${label}.observed.qualifyingRuns`) >= 3 &&
        (requireNumber(observed.overlapRssBytes, `${label}.observed.overlapRssBytes`) >= 80 * 1024 ** 2 ||
          requireNumber(observed.secondWorkerStartupCpuMedianMs, `${label}.observed.secondWorkerStartupCpuMedianMs`) >=
            75)
        ? 'Go'
        : 'No-Go';
    case 'task06':
      if (gate.sampleCount !== 30) fail(`${label}.sampleCount must be 30`);
      requireExactNumber(thresholds.retainedBytes, 64 * 1024 ** 2, `${label}.thresholds.retainedBytes`);
      requireExactNumber(thresholds.artifactEntries, 500, `${label}.thresholds.artifactEntries`);
      requireExactNumber(thresholds.sessionMinutes, 30, `${label}.thresholds.sessionMinutes`);
      requireExactNumber(thresholds.idleMinutes, 5, `${label}.thresholds.idleMinutes`);
      if (
        requireInteger(
          observed.artifactCount ?? observed.artifactEntriesAfterIdle,
          `${label}.observed.artifactCount`,
        ) !== 500
      )
        fail(`${label}.observed.artifactCount must be 500`);
      if (requireInteger(observed.descriptorScopes, `${label}.observed.descriptorScopes`) !== 100)
        fail(`${label}.observed.descriptorScopes must be 100`);
      return requireNumber(observed.durationMinutes, `${label}.observed.durationMinutes`) >= 30 &&
        requireNumber(observed.idleMinutes, `${label}.observed.idleMinutes`) >= 5 &&
        observed.didNotShrink === true &&
        (requireNumber(observed.heapBytes?.retained, `${label}.observed.heapBytes.retained`) >= 64 * 1024 ** 2 ||
          requireInteger(observed.artifactEntriesAfterIdle, `${label}.observed.artifactEntriesAfterIdle`) >= 500)
        ? 'Go'
        : 'No-Go';
    case 'task08':
      if (gate.sampleCount !== 30) fail(`${label}.sampleCount must be 30`);
      requireExactNumber(thresholds.retainedRssBytes, 64 * 1024 ** 2, `${label}.thresholds.retainedRssBytes`);
      requireExactNumber(thresholds.recreateP95Ms, 300, `${label}.thresholds.recreateP95Ms`);
      requireExactNumber(thresholds.idleMinutes, 10, `${label}.thresholds.idleMinutes`);
      if (observed.accepted !== true) fail(`${label}.observed.accepted must be true`);
      if (requireInteger(observed.workerCount, `${label}.observed.workerCount`) < 1)
        fail(`${label}.observed.workerCount must be at least 1`);
      return requireNumber(observed.idleMinutes, `${label}.observed.idleMinutes`) >= 10 &&
        requireNumber(observed.retainedRssBytes, `${label}.observed.retainedRssBytes`) >= 64 * 1024 ** 2 &&
        requireNumber(observed.recreateP95Ms, `${label}.observed.recreateP95Ms`) <= 300
        ? 'Go'
        : 'No-Go';
    case 'task09':
      if (gate.sampleCount !== 30) fail(`${label}.sampleCount must be 30`);
      requireExactNumber(thresholds.scanP95Ms, 100, `${label}.thresholds.scanP95Ms`);
      requireExactNumber(thresholds.scanSharePercent, 20, `${label}.thresholds.scanSharePercent`);
      if (requireInteger(observed.loadedModels, `${label}.observed.loadedModels`) !== 500)
        fail(`${label}.observed.loadedModels must be 500`);
      if (requireInteger(observed.matchingModels, `${label}.observed.matchingModels`) !== 10)
        fail(`${label}.observed.matchingModels must be 10`);
      if (requireInteger(observed.saveSamplesPerRun, `${label}.observed.saveSamplesPerRun`) !== 30)
        fail(`${label}.observed.saveSamplesPerRun must be 30`);
      return requireNumber(observed.scanP95Ms, `${label}.observed.scanP95Ms`) > 100 &&
        requireNumber(observed.scanSharePercent, `${label}.observed.scanSharePercent`) > 20
        ? 'Go'
        : 'No-Go';
    case 'task12':
      if (gate.sampleCount !== 3) fail(`${label}.sampleCount must be 3`);
      requireExactNumber(thresholds.flowBootstrapCount, 6, `${label}.thresholds.flowBootstrapCount`);
      requireExactNumber(thresholds.workflowBootstrapCount, 2, `${label}.thresholds.workflowBootstrapCount`);
      return requireInteger(observed.flow?.bootstrapCount, `${label}.observed.flow.bootstrapCount`) <= 6 &&
        requireInteger(observed.workflow?.bootstrapCount, `${label}.observed.workflow.bootstrapCount`) <= 2
        ? 'Pass'
        : 'Fail';
    default:
      fail(`${label}.taskId is unsupported`);
  }
}

function validateGate(gate, expected, label) {
  if (!isObject(gate)) fail(`${label} must contain a JSON object`);
  if (gate.schemaVersion !== 1) fail(`${label}.schemaVersion must be 1`);

  const taskId = requireString(gate.taskId, `${label}.taskId`);
  const canonical = CANONICAL_GATES.get(taskId);
  if (!canonical) fail(`${label}.taskId is not one of the five supported gates`);
  const contract = expected || canonical;
  for (const key of ['taskId', 'gateType', 'probe']) {
    if (gate[key] !== contract[key]) fail(`${label}.${key} must be ${JSON.stringify(contract[key])}`);
  }

  const allowedDecisions = gate.gateType === 'conditional' ? ['Go', 'No-Go'] : ['Pass', 'Fail'];
  if (!allowedDecisions.includes(gate.decision)) {
    fail(`${label}.decision must be ${allowedDecisions.join(' or ')}`);
  }
  requireSha(gate.measuredSha, `${label}.measuredSha`);
  requireSha(gate.measuredTree, `${label}.measuredTree`);
  requireString(gate.measurementRoot, `${label}.measurementRoot`);
  if (!Array.isArray(gate.measurementRefs) || gate.measurementRefs.length !== 1) {
    fail(`${label}.measurementRefs must contain exactly one summary/raw pair`);
  }
  gate.measurementRefs.forEach((measurementRef, index) => {
    if (!isObject(measurementRef)) fail(`${label}.measurementRefs[${index}] must be an object`);
    const summary = validateMeasurementPath(measurementRef.summary, `${label}.measurementRefs[${index}].summary`);
    const rawSamples = validateMeasurementPath(
      measurementRef.rawSamples,
      `${label}.measurementRefs[${index}].rawSamples`,
    );
    if (summary === rawSamples) fail(`${label}.measurementRefs[${index}] must reference distinct files`);
    for (const key of ['summarySha256', 'rawSamplesSha256']) {
      if (typeof measurementRef[key] !== 'string' || !SHA256_PATTERN.test(measurementRef[key])) {
        fail(`${label}.measurementRefs[${index}].${key} must be a lowercase SHA-256 digest`);
      }
    }
  });
  if (!isObject(gate.thresholds) || Object.keys(gate.thresholds).length === 0) {
    fail(`${label}.thresholds must be a non-empty object`);
  }
  if (!isObject(gate.observed) || Object.keys(gate.observed).length === 0) {
    fail(`${label}.observed must be a non-empty object`);
  }
  if (Number.isNaN(Date.parse(requireString(gate.generatedAt, `${label}.generatedAt`)))) {
    fail(`${label}.generatedAt must be an ISO date`);
  }
  requireInteger(gate.sampleCount, `${label}.sampleCount`);
  const expectedDecision = derivedDecision(gate, label);
  if (gate.decision !== expectedDecision) fail(`${label}.decision does not match observed metrics`);
  return gate;
}

async function sha256(file) {
  return createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
}

async function validateEvidence(gate, gateFile) {
  const root = path.resolve(path.dirname(gateFile), gate.measurementRoot);
  const reference = gate.measurementRefs[0];
  const summaryFile = path.join(root, reference.summary);
  const rawSamplesFile = path.join(root, reference.rawSamples);
  if ((await sha256(summaryFile)) !== reference.summarySha256) fail(`${gateFile} summary SHA-256 mismatch`);
  if ((await sha256(rawSamplesFile)) !== reference.rawSamplesSha256) fail(`${gateFile} raw samples SHA-256 mismatch`);

  const summary = await readJson(summaryFile);
  const rawSamples = await readJson(rawSamplesFile);
  if (
    summary.schemaVersion !== 1 ||
    summary.measuredSha !== gate.measuredSha ||
    summary.measuredTree !== gate.measuredTree
  ) {
    fail(`${gateFile} summary identity does not match the gate`);
  }
  const probe = summary.probes?.[gate.probe];
  if (!isObject(probe) || !Array.isArray(probe.samples)) fail(`${gateFile} summary is missing probe ${gate.probe}`);
  if (!Array.isArray(rawSamples)) fail(`${gateFile} raw samples must be an array`);
  const expectedRaw = probe.samples
    .filter((sample) => sample.phase !== 'warmup')
    .map(({ index, measurement, metrics, phase, process }) => ({ index, measurement, metrics, phase, process }));
  if (JSON.stringify(rawSamples) !== JSON.stringify(expectedRaw)) {
    fail(`${gateFile} raw samples do not match the summary`);
  }
  const expectedPhases =
    gate.taskId === 'task06' || gate.taskId === 'task08'
      ? { restart: gate.sampleCount, soak: 1 }
      : { recorded: gate.sampleCount };
  const actualPhases = Object.groupBy(rawSamples, (sample) => sample.phase);
  if (
    Object.keys(actualPhases).length !== Object.keys(expectedPhases).length ||
    Object.entries(expectedPhases).some(([phase, count]) => actualPhases[phase]?.length !== count)
  ) {
    fail(`${gateFile} evidence phases do not match ${JSON.stringify(expectedPhases)}`);
  }
  for (const [index, sample] of rawSamples.entries()) {
    if (!isObject(sample) || !isObject(sample.metrics)) fail(`${gateFile} rawSamples[${index}] must contain metrics`);
    const measurement = validateMeasurementPath(sample.measurement, `${gateFile} rawSamples[${index}].measurement`);
    const measured = await readJson(path.join(root, measurement));
    if (
      measured.schemaVersion !== 1 ||
      measured.probe !== gate.probe ||
      measured.phase !== sample.phase ||
      JSON.stringify(measured.metrics) !== JSON.stringify(sample.metrics)
    ) {
      fail(`${gateFile} rawSamples[${index}] does not match its measurement file`);
    }
  }
  const observed = evidenceObserved(gate.taskId, rawSamples, gateFile);
  if (!isDeepStrictEqual(observed, gate.observed)) {
    fail(`${gateFile} observed metrics do not match measurement evidence`);
  }
}

function validateManifest(manifest, label) {
  if (!isObject(manifest) || manifest.schemaVersion !== 1 || !Array.isArray(manifest.gates)) {
    fail(`${label} must have schemaVersion 1 and a gates array`);
  }
  if (manifest.gates.length !== CANONICAL_GATES.size) {
    fail(`${label} must list exactly five gates`);
  }
  const seenTasks = new Set();
  const seenFiles = new Set();
  const seenProbes = new Set();
  for (const [index, entry] of manifest.gates.entries()) {
    if (!isObject(entry)) fail(`${label}.gates[${index}] must be an object`);
    const taskId = requireString(entry.taskId, `${label}.gates[${index}].taskId`);
    const canonical = CANONICAL_GATES.get(taskId);
    if (!canonical) fail(`${label}.gates[${index}] contains unsupported task ${JSON.stringify(taskId)}`);
    for (const key of ['file', 'gateType', 'probe', 'integrationRef']) {
      if (entry[key] !== canonical[key]) {
        fail(`${label}.gates[${index}].${key} must be ${JSON.stringify(canonical[key])}`);
      }
    }
    for (const [set, value, name] of [
      [seenTasks, taskId, 'taskId'],
      [seenFiles, entry.file, 'file'],
      [seenProbes, entry.probe, 'probe'],
    ]) {
      if (set.has(value)) fail(`${label} contains duplicate ${name} ${JSON.stringify(value)}`);
      set.add(value);
    }
  }
  for (const taskId of CANONICAL_GATES.keys()) {
    if (!seenTasks.has(taskId)) fail(`${label} is missing ${taskId}`);
  }
  return manifest.gates;
}

function integrationIdentity(integrationManifest, ref, label) {
  if (!isObject(integrationManifest) || integrationManifest.schemaVersion !== 1) {
    fail(`${label} must be a schemaVersion 1 object`);
  }
  return {
    sha: requireSha(integrationManifest[`${ref}Sha`], `${label}.${ref}Sha`),
    tree: requireSha(integrationManifest[`${ref}Tree`], `${label}.${ref}Tree`),
  };
}

function validateGateIntegration(gate, entry, integrationManifest, label) {
  const expected = integrationIdentity(integrationManifest, entry.integrationRef, label);
  if (gate.measuredSha !== expected.sha || gate.measuredTree !== expected.tree) {
    fail(`${entry.taskId} measurement does not match ${entry.integrationRef} SHA/tree`);
  }
  const aliases =
    entry.integrationRef === 'task05DecisionInput'
      ? [
          ['decisionInputSha', expected.sha],
          ['decisionInputTree', expected.tree],
        ]
      : [
          ['integrationSha', expected.sha],
          ['integrationTree', expected.tree],
          ['cleanupAfterCodeSha', expected.sha],
          ['cleanupAfterCodeTree', expected.tree],
        ];
  for (const [field, expectedValue] of aliases) {
    if (field in gate && gate[field] !== expectedValue)
      fail(`${entry.taskId}.${field} does not match integration manifest`);
  }
}

function parseArguments(argv) {
  const options = { files: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--manifest' || argument === '--directory' || argument === '--integration-manifest') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) fail(`${argument} requires a value`);
      options[argument.slice(2).replace('-manifest', 'Manifest')] = value;
      index += 1;
    } else if (argument.startsWith('--')) {
      fail(`Unknown option ${argument}`);
    } else {
      options.files.push(argument);
    }
  }
  return options;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.manifest || options.directory || options.integrationManifest) {
    if (!options.manifest || !options.directory || options.files.length) {
      fail('Manifest mode requires --manifest and --directory, with no positional gate files');
    }
    const manifest = await readJson(options.manifest);
    const entries = validateManifest(manifest, options.manifest);
    const directoryEntries = (await readdir(options.directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name)
      .sort();
    const expectedFiles = entries.map((entry) => entry.file).sort();
    const missing = expectedFiles.filter((file) => !directoryEntries.includes(file));
    const extra = directoryEntries.filter((file) => !expectedFiles.includes(file));
    if (missing.length) fail(`Gate directory is missing: ${missing.join(', ')}`);
    if (extra.length) fail(`Gate directory contains unexpected JSON: ${extra.join(', ')}`);

    const integrationManifest = options.integrationManifest ? await readJson(options.integrationManifest) : null;
    for (const entry of entries) {
      const gateFile = path.join(options.directory, entry.file);
      const gate = validateGate(await readJson(gateFile), entry, entry.file);
      await validateEvidence(gate, gateFile);
      if (integrationManifest) validateGateIntegration(gate, entry, integrationManifest, options.integrationManifest);
      if (gate.gateType === 'mandatory' && gate.decision !== 'Pass') fail(`${entry.taskId} mandatory gate failed`);
    }
    return;
  }

  if (options.files.length !== 1) fail('Usage: validate-gates.mjs <gate.json> or --manifest <file> --directory <dir>');
  const gate = validateGate(await readJson(options.files[0]), undefined, options.files[0]);
  await validateEvidence(gate, options.files[0]);
  if (gate.gateType === 'mandatory' && gate.decision !== 'Pass') fail(`${gate.taskId} mandatory gate failed`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
