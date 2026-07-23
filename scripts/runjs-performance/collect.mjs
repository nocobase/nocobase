import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const implementationRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const clientConfig = path.join(implementationRoot, 'scripts/runjs-performance/vitest.client.config.mts');
const serverConfig = path.join(implementationRoot, 'scripts/runjs-performance/vitest.server.config.mts');
const focusedTestFiles = {
  editor: 'packages/core/client-v2/src/flow/components/code-editor/__tests__/EditorCore.test.tsx',
  flow: 'packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/runjs-sources.adapters.test.ts',
  workflow: 'packages/plugins/@nocobase/plugin-workflow-javascript/src/server/__tests__/runjs-source-adapter.test.ts',
};
const definitions = {
  'client-bundle': { environment: 'client', suites: ['common'], build: true },
  'application-startup': { environment: 'server', suites: ['common'] },
  'code-editor': { environment: 'client', suites: ['feature'] },
  'runtime-resolve': { environment: 'client', suites: ['feature'] },
  'runtime-cache-retention': { environment: 'client', suites: ['feature'], long: 'duration' },
  'light-extension-server': { environment: 'server', suites: ['feature'] },
  'compile-worker-idle': { environment: 'server', suites: ['feature'], long: 'idle' },
  'source-refresh': { environment: 'client', suites: ['feature'] },
  'adapter-tests': { environment: 'server', suites: ['feature'] },
};

function parseArgs(argv) {
  const options = { cwd: process.cwd(), runs: 3, suite: ['common', 'feature'], probes: [], reports: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    const value = argv[index + 1];
    if (name === '--cwd') (options.cwd = path.resolve(value)), (index += 1);
    else if (name === '--suite') (options.suite = value.split(',').filter(Boolean)), (index += 1);
    else if (name === '--runs') (options.runs = positiveInteger(value, '--runs')), (index += 1);
    else if (name === '--output') (options.output = path.resolve(value)), (index += 1);
    else if (name === '--probe') options.probes.push(value), (index += 1);
    else if (name === '--gate-output') (options.gateOutput = path.resolve(value)), (index += 1);
    else if (name === '--report') options.reports.push(path.resolve(value)), (index += 1);
    else if (name === '--finalize-only') options.finalizeOnly = true;
    else if (name === '--focused-tests') options.focusedTests = true;
    else if (name === '--duration-minutes') (options.durationMinutes = positiveNumber(value, name)), (index += 1);
    else if (name === '--idle-minutes') (options.idleMinutes = positiveNumber(value, name)), (index += 1);
    else throw new Error(`Unknown or incomplete argument: ${name}`);
  }
  if (!options.output) throw new Error('--output is required');
  if (options.finalizeOnly && options.probes.length) throw new Error('--finalize-only cannot be combined with --probe');
  if (options.probes.length > 1) throw new Error('--probe may be provided at most once');
  for (const suite of options.suite)
    if (!['common', 'feature'].includes(suite)) throw new Error(`Unknown suite: ${suite}`);
  if (options.probes[0] && !definitions[options.probes[0]]) throw new Error(`Unknown probe: ${options.probes[0]}`);
  return options;
}

function positiveInteger(value, name) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(`${name} must be a positive integer`);
  return number;
}

function positiveNumber(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${name} must be positive`);
  return number;
}

async function run(command, args, options = {}) {
  const started = performance.now();
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  let peakRssBytes = 0;
  child.stdout.on('data', (chunk) => (stdout += chunk));
  child.stderr.on('data', (chunk) => (stderr += chunk));
  const poll = setInterval(async () => {
    peakRssBytes = Math.max(peakRssBytes, await processTreeRss(child.pid));
  }, 100);
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => resolve(code ?? 1));
  });
  clearInterval(poll);
  peakRssBytes = Math.max(peakRssBytes, await processTreeRss(child.pid));
  const result = {
    command: [command, ...args],
    exitCode,
    peakRssBytes,
    stderr,
    stdout,
    wallTimeMs: performance.now() - started,
  };
  if (options.log) await writeFile(options.log, `${stdout}${stderr}`, 'utf8');
  if (exitCode !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${args.join(' ')} failed with ${exitCode}\n${stderr || stdout}`);
  }
  return result;
}

async function processTreeRss(rootPid) {
  if (!rootPid || process.platform === 'win32') return 0;
  try {
    const result = await new Promise((resolve) => {
      const child = spawn('ps', ['-e', '-o', 'pid=,ppid=,rss='], { stdio: ['ignore', 'pipe', 'ignore'] });
      let output = '';
      child.stdout.on('data', (chunk) => (output += chunk));
      child.once('close', () => resolve(output));
      child.once('error', () => resolve(''));
    });
    const rows = String(result)
      .trim()
      .split('\n')
      .map((line) => line.trim().split(/\s+/u).map(Number))
      .filter(([pid, ppid, rss]) => pid && Number.isFinite(ppid) && Number.isFinite(rss));
    const descendants = new Set([rootPid]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const [pid, ppid] of rows) {
        if (descendants.has(ppid) && !descendants.has(pid)) descendants.add(pid), (changed = true);
      }
    }
    return rows.reduce((sum, [pid, , rss]) => sum + (descendants.has(pid) ? rss * 1024 : 0), 0);
  } catch {
    return 0;
  }
}

async function git(cwd, args) {
  return (await run('git', args, { cwd })).stdout.trim();
}

async function ensureInstall(cwd, output) {
  if (process.env.RUNJS_PERF_SKIP_INSTALL === '1') return { action: 'skipped', command: [] };
  const check = await run('yarn', ['check', '--integrity'], {
    cwd,
    allowFailure: true,
    log: path.join(output, 'yarn-check.log'),
  });
  if (check.exitCode === 0) return { action: 'validated', command: check.command };
  const install = await run('yarn', ['install', '--frozen-lockfile'], {
    cwd,
    log: path.join(output, 'yarn-install.log'),
  });
  return { action: 'installed', command: install.command, wallTimeMs: install.wallTimeMs };
}

async function ensureServerEnvironment(cwd) {
  if (process.env.DB_DIALECT) return {};

  const container = process.env.TEST_PG_CONTAINER_NAME || 'nocobase-test-postgres';
  const port = process.env.TEST_PG_PORT || '54320';
  const user = process.env.TEST_PG_USER || 'nocobase';
  const password = process.env.TEST_PG_PASSWORD || 'nocobase';
  const database = process.env.TEST_PG_DATABASE || 'nocobase';
  const inspect = await run('docker', ['inspect', container], { cwd, allowFailure: true });
  if (inspect.exitCode === 0) {
    if (!JSON.parse(inspect.stdout)[0]?.State?.Running) await run('docker', ['start', container], { cwd });
  } else {
    await run(
      'docker',
      [
        'run',
        '-d',
        '--name',
        container,
        '-e',
        `POSTGRES_USER=${user}`,
        '-e',
        `POSTGRES_PASSWORD=${password}`,
        '-e',
        `POSTGRES_DB=${database}`,
        '-p',
        `${port}:5432`,
        'postgres:16',
        '-c',
        'wal_level=logical',
      ],
      { cwd },
    );
  }
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ready = await run('docker', ['exec', container, 'pg_isready', '-U', user, '-d', database], {
      cwd,
      allowFailure: true,
    });
    if (ready.exitCode === 0) {
      return {
        APP_ENV_PATH: '.env.test',
        DB_DATABASE: database,
        DB_DIALECT: 'postgres',
        DB_HOST: '127.0.0.1',
        DB_PASSWORD: password,
        DB_PORT: port,
        DB_USER: user,
        DB_USERNAME: user,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Postgres container ${container} did not become ready`);
}

async function collectSample(probe, definition, phase, index, options) {
  if (probe === 'adapter-tests') return collectAdapterSample(phase, index, options);
  const sampleDirectory = path.join(options.output, 'raw', probe, `${phase}-${String(index).padStart(2, '0')}`);
  await mkdir(sampleDirectory, { recursive: true });
  const measurementPath = path.join(sampleDirectory, 'measurement.json');
  const commands = [];
  if (definition.build) {
    commands.push(
      await run('yarn', ['build'], {
        cwd: options.cwd,
        env: { BUILD_PROFILE: 'true' },
        log: path.join(sampleDirectory, 'build.log'),
      }),
    );
  }
  const config = definition.environment === 'server' ? serverConfig : clientConfig;
  const vitestPath = path.join(sampleDirectory, 'vitest.json');
  const probeCommand = await run(
    'yarn',
    ['vitest', 'run', '--config', config, '--reporter=json', `--outputFile=${vitestPath}`],
    {
      cwd: options.cwd,
      env: {
        ...options.serverEnv,
        RUNJS_PERF_DURATION_MINUTES: String(options.durationMinutes ?? 30),
        RUNJS_PERF_IDLE_MINUTES: String(options.idleMinutes ?? 10),
        RUNJS_PERF_PHASE: phase,
        RUNJS_PERF_PROBE: probe,
        RUNJS_PERF_SAMPLE_OUTPUT: measurementPath,
        TEST_ENV: definition.environment === 'server' ? 'server-side' : 'client-side',
      },
      log: path.join(sampleDirectory, 'probe.log'),
    },
  );
  commands.push(probeCommand);
  const measurement = JSON.parse(await readFile(measurementPath, 'utf8'));
  const vitestReport = JSON.parse(await readFile(vitestPath, 'utf8'));
  return {
    phase,
    index,
    measurement: path.relative(options.output, measurementPath).replaceAll(path.sep, '/'),
    report: path.relative(options.output, vitestPath).replaceAll(path.sep, '/'),
    metrics: measurement.metrics,
    process: { peakRssBytes: probeCommand.peakRssBytes, wallTimeMs: probeCommand.wallTimeMs },
    commands: commands.map(({ stderr, stdout, ...command }) => command),
    tests: {
      failedTests: vitestReport.numFailedTests ?? 0,
      files: (vitestReport.testResults || []).map((result) => ({
        assertions: result.assertionResults?.length ?? 0,
        durationMs: result.perfStats?.runtime ?? result.endTime - result.startTime,
        failedTests: (result.assertionResults || []).filter((assertion) => assertion.status === 'failed').length,
        file: result.name,
        retries: (result.assertionResults || []).reduce(
          (sum, assertion) => sum + (assertion.retryCount ?? assertion.retryReasons?.length ?? 0),
          0,
        ),
        status: result.status,
        evidence: 'owning-process',
        process: { peakRssBytes: probeCommand.peakRssBytes, wallTimeMs: probeCommand.wallTimeMs },
        report: path.relative(options.output, vitestPath).replaceAll(path.sep, '/'),
      })),
      success: vitestReport.success,
      totalTests: vitestReport.numTotalTests ?? 0,
    },
  };
}

async function collectAdapterSample(phase, index, options) {
  const sampleDirectory = path.join(
    options.output,
    'raw',
    'adapter-tests',
    `${phase}-${String(index).padStart(2, '0')}`,
  );
  await mkdir(sampleDirectory, { recursive: true });
  const lanes = {};
  for (const lane of ['flow', 'workflow']) {
    try {
      await access(path.join(options.cwd, focusedTestFiles[lane]));
    } catch {
      continue;
    }
    lanes[lane] = await collectAdapterLane(sampleDirectory, lane, phase, options);
  }
  if (!Object.keys(lanes).length) throw new Error('No adapter test lane exists in the measured checkout');
  const commands = Object.values(lanes).map(({ command }) => command);
  const files = Object.values(lanes).map(({ tests }) => tests);
  const metrics = Object.fromEntries(Object.entries(lanes).map(([lane, value]) => [lane, value.metrics]));
  const measurementPath = path.join(sampleDirectory, 'measurement.json');
  await writeFile(
    measurementPath,
    `${JSON.stringify({ schemaVersion: 1, probe: 'adapter-tests', phase, metrics }, null, 2)}\n`,
    'utf8',
  );
  return {
    phase,
    index,
    measurement: path.relative(options.output, measurementPath).replaceAll(path.sep, '/'),
    subMeasurements: Object.fromEntries(Object.entries(lanes).map(([lane, value]) => [lane, value.measurement])),
    reports: Object.values(lanes).map(({ report }) => report),
    metrics,
    process: {
      peakRssBytes: Math.max(...commands.map((command) => command.peakRssBytes)),
      wallTimeMs: commands.reduce((sum, command) => sum + command.wallTimeMs, 0),
    },
    commands: commands.map(({ stderr, stdout, ...command }) => command),
    tests: {
      failedTests: files.reduce((sum, file) => sum + file.failedTests, 0),
      files,
      success: Object.values(lanes).every(({ reportSummary }) => reportSummary.success !== false),
      totalTests: Object.values(lanes).reduce((sum, { reportSummary }) => sum + (reportSummary.numTotalTests ?? 0), 0),
    },
  };
}

async function collectAdapterLane(directory, lane, phase, options) {
  const measurementPath = path.join(directory, `measurement-${lane}.json`);
  const vitestPath = path.join(directory, `vitest-${lane}.json`);
  const command = await run(
    'yarn',
    ['vitest', 'run', '--config', serverConfig, '--reporter=json', `--outputFile=${vitestPath}`],
    {
      cwd: options.cwd,
      env: {
        ...options.serverEnv,
        RUNJS_PERF_ADAPTER_LANE: lane,
        RUNJS_PERF_PHASE: phase,
        RUNJS_PERF_PROBE: 'adapter-tests',
        RUNJS_PERF_SAMPLE_OUTPUT: measurementPath,
        TEST_ENV: 'server-side',
      },
      log: path.join(directory, `probe-${lane}.log`),
    },
  );
  const measurement = JSON.parse(await readFile(measurementPath, 'utf8'));
  const report = JSON.parse(await readFile(vitestPath, 'utf8'));
  const assertions = (report.testResults || []).flatMap((result) => result.assertionResults || []);
  const reportRef = path.relative(options.output, vitestPath).replaceAll(path.sep, '/');
  return {
    command,
    measurement: path.relative(options.output, measurementPath).replaceAll(path.sep, '/'),
    metrics: measurement.metrics,
    report: reportRef,
    reportSummary: report,
    tests: {
      assertions: assertions.length,
      bootstrapCount: measurement.metrics.bootstrapCount,
      bootstrapWallTimeMs: measurement.metrics.bootstrapMs.reduce((sum, value) => sum + value, 0),
      durationMs: (report.testResults || []).reduce(
        (sum, result) => sum + (result.perfStats?.runtime ?? result.endTime - result.startTime),
        0,
      ),
      evidence: 'owning-process',
      failedTests: assertions.filter((assertion) => assertion.status === 'failed').length,
      file: measurement.metrics.file,
      lane,
      process: { peakRssBytes: command.peakRssBytes, wallTimeMs: command.wallTimeMs },
      report: reportRef,
      retries: assertions.reduce(
        (sum, assertion) => sum + (assertion.retryCount ?? assertion.retryReasons?.length ?? 0),
        0,
      ),
      sessionCount: measurement.metrics.sessionCount,
      status: report.success === false ? 'failed' : 'passed',
    },
  };
}

async function collectFocusedTests(options) {
  const directory = path.join(options.output, 'focused-tests');
  await mkdir(directory, { recursive: true });
  const editorReportPath = path.join(directory, 'vitest-editor.json');
  const editorCommand = await run(
    'yarn',
    ['test:client', focusedTestFiles.editor, '--run', '--reporter=json', `--outputFile=${editorReportPath}`],
    { cwd: options.cwd, log: path.join(directory, 'editor.log') },
  );
  const editorReport = JSON.parse(await readFile(editorReportPath, 'utf8'));
  const editorAssertions = (editorReport.testResults || []).flatMap((result) => result.assertionResults || []);
  const editorReportRef = path.relative(options.output, editorReportPath).replaceAll(path.sep, '/');
  const files = [
    {
      assertions: editorAssertions.length,
      durationMs: (editorReport.testResults || []).reduce(
        (sum, result) => sum + (result.perfStats?.runtime ?? result.endTime - result.startTime),
        0,
      ),
      evidence: 'owning-process',
      failedTests: editorAssertions.filter((assertion) => assertion.status === 'failed').length,
      file: focusedTestFiles.editor,
      lane: 'client',
      process: { peakRssBytes: editorCommand.peakRssBytes, wallTimeMs: editorCommand.wallTimeMs },
      report: editorReportRef,
      retries: editorAssertions.reduce(
        (sum, assertion) => sum + (assertion.retryCount ?? assertion.retryReasons?.length ?? 0),
        0,
      ),
      status: editorReport.success === false ? 'failed' : 'passed',
    },
  ];
  const reports = [editorReportRef];
  const commands = [editorCommand];
  for (const lane of ['flow', 'workflow']) {
    const result = await collectAdapterLane(directory, lane, 'focused', options);
    files.push(result.tests);
    reports.push(result.report);
    commands.push(result.command);
  }
  const manifest = {
    schemaVersion: 1,
    measuredCwd: options.cwd,
    measuredSha: options.measuredSha,
    measuredTree: options.measuredTree,
    commands: commands.map(({ stderr, stdout, ...command }) => command),
    files,
    reports,
  };
  const manifestPath = path.join(options.output, 'focused-tests.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return {
    file: 'focused-tests.json',
    files,
    measuredSha: options.measuredSha,
    measuredTree: options.measuredTree,
    reports,
    sha256: await fileSha256(manifestPath),
  };
}

function numericMetrics(value, prefix = '', output = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return output;
  for (const [key, child] of Object.entries(value)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'number' && Number.isFinite(child)) output[name] = child;
    else numericMetrics(child, name, output);
  }
  return output;
}

function aggregate(samples) {
  const values = new Map();
  for (const sample of samples.filter((item) => item.phase !== 'warmup')) {
    for (const [key, value] of Object.entries(numericMetrics(sample.metrics))) {
      if (!values.has(key)) values.set(key, []);
      values.get(key).push(value);
    }
    for (const command of sample.commands) {
      for (const key of ['peakRssBytes', 'wallTimeMs']) {
        const normalizedCommand = command.command
          .map((argument) => (argument.startsWith('--outputFile=') ? '--outputFile=<report>' : argument))
          .join(' ');
        const name = `commands.${normalizedCommand}.${key}`;
        if (!values.has(name)) values.set(name, []);
        values.get(name).push(command[key]);
      }
    }
  }
  return Object.fromEntries([...values].map(([key, samples]) => [key, stats(samples)]));
}

function stats(samples) {
  const sorted = [...samples].sort((left, right) => left - right);
  return {
    max: sorted.at(-1),
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    p95: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)],
    samples,
  };
}

function median(values) {
  return stats(values).median;
}

function adapterMetrics(samples) {
  const lane = (name) => {
    const available = samples.filter((sample) => sample.metrics[name]);
    if (!available.length) return;
    return {
      bootstrapCount: median(available.map((sample) => sample.metrics[name].bootstrapCount)),
      bootstrapWallTimeMs: median(
        available.map((sample) => sample.metrics[name].bootstrapMs.reduce((sum, value) => sum + value, 0)),
      ),
      sessionCount: median(available.map((sample) => sample.metrics[name].sessionCount)),
    };
  };
  return {
    flow: lane('flow'),
    peakRssBytes: median(samples.map((sample) => sample.process.peakRssBytes)),
    wallTimeMs: median(samples.map((sample) => sample.process.wallTimeMs)),
    workflow: lane('workflow'),
  };
}

async function fileSha256(file) {
  return createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
}

async function gateFor(probe, summary, output) {
  const samples = summary.probes[probe].samples;
  const recorded = samples.filter((sample) => sample.phase === 'recorded' || sample.phase === 'restart');
  const soak = samples.find((sample) => sample.phase === 'soak');
  const common = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    measuredSha: summary.measuredSha,
    measuredTree: summary.measuredTree,
    measurementRoot: output,
    measurementRefs: [
      {
        summary: 'summary.json',
        summarySha256: await fileSha256(path.join(output, 'summary.json')),
        rawSamples: 'raw-samples.json',
        rawSamplesSha256: await fileSha256(path.join(output, 'raw-samples.json')),
      },
    ],
    probe,
  };
  if (probe === 'code-editor') {
    const qualifying = recorded.filter(
      (sample) => sample.metrics.activeWorkerCount >= 2 && sample.metrics.overlapDurationMs >= 5_000,
    ).length;
    const rss = median(recorded.map((sample) => sample.metrics.overlapRssBytes));
    const cpu = median(recorded.map((sample) => sample.metrics.secondWorkerStartupCpuMs));
    return {
      ...common,
      taskId: 'task05',
      gateType: 'conditional',
      decision: qualifying >= 3 && (rss >= 80 * 1024 ** 2 || cpu >= 75) ? 'Go' : 'No-Go',
      observed: { qualifyingRuns: qualifying, overlapRssBytes: rss, secondWorkerStartupCpuMedianMs: cpu },
      sampleCount: recorded.length,
      thresholds: { qualifyingRuns: 3, overlapRssBytes: 80 * 1024 ** 2, secondWorkerStartupCpuMedianMs: 75 },
    };
  }
  if (probe === 'runtime-cache-retention') {
    const metrics = soak?.metrics || recorded.at(-1)?.metrics;
    const didNotShrink = metrics.artifactEntriesAfterIdle >= metrics.artifactEntriesBeforeIdle;
    const go =
      metrics.durationMinutes >= 30 &&
      metrics.idleMinutes >= 5 &&
      didNotShrink &&
      (metrics.heapBytes.retained >= 64 * 1024 ** 2 || metrics.artifactEntriesAfterIdle >= 500);
    return {
      ...common,
      taskId: 'task06',
      gateType: 'conditional',
      decision: go ? 'Go' : 'No-Go',
      observed: { ...metrics, artifactCount: metrics.artifactCount ?? metrics.artifactEntriesAfterIdle, didNotShrink },
      sampleCount: recorded.length,
      thresholds: { retainedBytes: 64 * 1024 ** 2, artifactEntries: 500, sessionMinutes: 30, idleMinutes: 5 },
    };
  }
  if (probe === 'compile-worker-idle') {
    const metrics = soak?.metrics || recorded.at(-1)?.metrics;
    const recreateP95 = stats(recorded.map((sample) => sample.metrics.submitMs)).p95;
    return {
      ...common,
      taskId: 'task08',
      gateType: 'conditional',
      decision:
        metrics.idleMinutes >= 10 && metrics.retainedRssBytes >= 64 * 1024 ** 2 && recreateP95 <= 300 ? 'Go' : 'No-Go',
      observed: { ...metrics, recreateP95Ms: recreateP95 },
      sampleCount: recorded.length,
      thresholds: { retainedRssBytes: 64 * 1024 ** 2, recreateP95Ms: 300, idleMinutes: 10 },
    };
  }
  if (probe === 'source-refresh') {
    const scanSamples = recorded.flatMap((sample) => sample.metrics.scanSamplesMs);
    const refreshSamples = recorded.flatMap((sample) => sample.metrics.postSaveRefreshSamplesMs);
    const p95 = stats(scanSamples).p95;
    const share =
      (scanSamples.reduce((sum, sample) => sum + sample, 0) / refreshSamples.reduce((sum, sample) => sum + sample, 0)) *
      100;
    return {
      ...common,
      taskId: 'task09',
      gateType: 'conditional',
      decision: p95 > 100 && share > 20 ? 'Go' : 'No-Go',
      observed: {
        loadedModels: 500,
        matchingModels: 10,
        saveSamplesPerRun: recorded.at(-1)?.metrics.scanSamplesMs?.length || 0,
        scanP95Ms: p95,
        scanSharePercent: share,
      },
      sampleCount: recorded.length,
      thresholds: { scanP95Ms: 100, scanSharePercent: 20 },
    };
  }
  if (probe === 'adapter-tests') {
    const metrics = adapterMetrics(recorded);
    const pass = metrics.flow?.bootstrapCount <= 6 && (!metrics.workflow || metrics.workflow.bootstrapCount <= 2);
    return {
      ...common,
      taskId: 'task12',
      gateType: 'mandatory',
      decision: pass ? 'Pass' : 'Fail',
      observed: metrics,
      sampleCount: recorded.length,
      thresholds: {
        flowBootstrapCount: 6,
        ...(metrics.workflow ? { workflowBootstrapCount: 2 } : {}),
      },
    };
  }
  throw new Error(`Probe ${probe} does not produce a gate`);
}

async function finalize(output, extraReports, focusedTests) {
  const summaryFile = path.join(output, 'summary.json');
  const rawSamplesFile = path.join(output, 'raw-samples.json');
  const summary = JSON.parse(await readFile(summaryFile, 'utf8'));
  if (
    focusedTests &&
    (focusedTests.measuredSha !== summary.measuredSha || focusedTests.measuredTree !== summary.measuredTree)
  ) {
    throw new Error(`${focusedTests.file} identity does not match the collection summary`);
  }
  const reports = Object.values(summary.probes || {}).flatMap((probe) =>
    (probe.samples || [])
      .filter((sample) => sample.phase !== 'warmup')
      .flatMap((sample) => sample.reports || [sample.report || `${path.dirname(sample.measurement)}/vitest.json`]),
  );
  const fileEvidence = Object.values(summary.probes || {}).flatMap((probe) =>
    (probe.samples || []).filter((sample) => sample.phase !== 'warmup').flatMap((sample) => sample.tests?.files || []),
  );
  if (focusedTests) {
    reports.push(...focusedTests.reports);
    fileEvidence.push(...focusedTests.files);
  }
  if (extraReports.length) {
    const reportDirectory = path.join(output, 'reports');
    await mkdir(reportDirectory, { recursive: true });
    for (const source of extraReports) {
      const report = `reports/${path.basename(source)}`;
      const target = path.join(output, report);
      await copyFile(source, target);
      reports.push(report);
    }
  }
  const uniqueReports = [...new Set(reports)].sort();
  const reportRefs = [];
  for (const report of uniqueReports) {
    const file = path.join(output, report);
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    reportRefs.push({ file: report, sha256: await fileSha256(file) });
    if (!fileEvidence.some((entry) => entry.report === report)) {
      for (const result of parsed.testResults || []) {
        fileEvidence.push({
          assertions: result.assertionResults?.length ?? 0,
          durationMs: result.perfStats?.runtime ?? result.endTime - result.startTime,
          evidence: 'report-only',
          failedTests: (result.assertionResults || []).filter((assertion) => assertion.status === 'failed').length,
          file: result.name,
          process: null,
          report,
          retries: (result.assertionResults || []).reduce(
            (sum, assertion) => sum + (assertion.retryCount ?? assertion.retryReasons?.length ?? 0),
            0,
          ),
          status: result.status,
        });
      }
    }
  }
  await writeFile(
    path.join(output, 'collection.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        finalized: true,
        measuredSha: summary.measuredSha,
        measuredTree: summary.measuredTree,
        summary: { file: 'summary.json', sha256: await fileSha256(summaryFile) },
        rawSamples: { file: 'raw-samples.json', sha256: await fileSha256(rawSamplesFile) },
        reports: reportRefs,
        fileEvidence,
        ...(focusedTests ? { focusedTests: { file: focusedTests.file, sha256: focusedTests.sha256 } } : {}),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.finalizeOnly) {
    const summary = JSON.parse(await readFile(path.join(options.output, 'summary.json'), 'utf8'));
    if (options.focusedTests) {
      options.measuredSha = await git(options.cwd, ['rev-parse', 'HEAD']);
      options.measuredTree = await git(options.cwd, ['rev-parse', 'HEAD^{tree}']);
      if (options.measuredSha !== summary.measuredSha || options.measuredTree !== summary.measuredTree) {
        throw new Error(`--cwd identity does not match ${path.join(options.output, 'summary.json')}`);
      }
    }
    options.serverEnv = options.focusedTests ? await ensureServerEnvironment(options.cwd) : {};
    const focusedTests = options.focusedTests ? await collectFocusedTests(options) : null;
    await finalize(options.output, options.reports, focusedTests);
    if (options.gateOutput) {
      const selected = Object.keys(summary.probes || {});
      if (selected.length !== 1) throw new Error('--gate-output requires exactly one collected probe');
      await mkdir(path.dirname(options.gateOutput), { recursive: true });
      const gate = await gateFor(selected[0], summary, options.output);
      await writeFile(options.gateOutput, `${JSON.stringify(gate, null, 2)}\n`, 'utf8');
    }
    return;
  }
  if ((await readdir(options.output).catch(() => [])).length) {
    throw new Error(`--output must be empty to prevent mixed or stale samples: ${options.output}`);
  }
  await mkdir(options.output, { recursive: true });
  const measuredSha = await git(options.cwd, ['rev-parse', 'HEAD']);
  const measuredTree = await git(options.cwd, ['rev-parse', 'HEAD^{tree}']);
  options.measuredSha = measuredSha;
  options.measuredTree = measuredTree;
  const install = await ensureInstall(options.cwd, options.output);
  const selected = options.probes.length
    ? options.probes
    : Object.entries(definitions)
        .filter(([, definition]) => definition.suites.some((suite) => options.suite.includes(suite)))
        .map(([name]) => name);
  const excludedProbes = new Set((process.env.RUNJS_PERF_EXCLUDE_PROBES || '').split(',').filter(Boolean));
  for (let index = selected.length - 1; index >= 0; index -= 1) {
    if (excludedProbes.has(selected[index])) selected.splice(index, 1);
  }
  options.serverEnv =
    options.focusedTests || selected.some((probe) => definitions[probe].environment === 'server')
      ? await ensureServerEnvironment(options.cwd)
      : {};
  const summary = {
    schemaVersion: 1,
    measuredSha,
    measuredTree,
    cwd: options.cwd,
    command: process.argv,
    environment: {
      node: process.version,
      yarn: (await run('yarn', ['--version'], { cwd: options.cwd })).stdout.trim(),
      platform: process.platform,
      release: os.release(),
      arch: process.arch,
      cpus: os.cpus().map((cpu) => cpu.model),
      totalMemoryBytes: os.totalmem(),
      database: options.serverEnv.DB_DIALECT || process.env.DB_DIALECT || null,
    },
    install,
    probes: {},
  };
  for (const probe of selected) {
    const definition = definitions[probe];
    const samples = [];
    if (definition.long) {
      samples.push(await collectSample(probe, definition, 'soak', 1, options));
      for (let index = 1; index <= options.runs; index += 1)
        samples.push(await collectSample(probe, definition, 'restart', index, options));
    } else {
      samples.push(await collectSample(probe, definition, 'warmup', 0, options));
      for (let index = 1; index <= options.runs; index += 1)
        samples.push(await collectSample(probe, definition, 'recorded', index, options));
    }
    summary.probes[probe] = { aggregates: aggregate(samples), samples };
  }
  const rawSamples = Object.values(summary.probes)
    .flatMap((result) => result.samples)
    .filter((sample) => sample.phase !== 'warmup')
    .map(({ index, measurement, metrics, phase, process }) => ({ index, measurement, metrics, phase, process }));
  await writeFile(path.join(options.output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(path.join(options.output, 'raw-samples.json'), `${JSON.stringify(rawSamples, null, 2)}\n`, 'utf8');
  const focusedTests = options.focusedTests ? await collectFocusedTests(options) : null;
  await finalize(options.output, options.reports, focusedTests);
  if (options.gateOutput) {
    if (selected.length !== 1) throw new Error('--gate-output requires exactly one --probe');
    await mkdir(path.dirname(options.gateOutput), { recursive: true });
    const gate = await gateFor(selected[0], summary, options.output);
    await writeFile(options.gateOutput, `${JSON.stringify(gate, null, 2)}\n`, 'utf8');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
