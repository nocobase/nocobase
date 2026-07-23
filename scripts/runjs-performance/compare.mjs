import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    const value = argv[index + 1];
    if (name === '--base') (options.base = path.resolve(value)), (index += 1);
    else if (name === '--candidate') (options.candidate = path.resolve(value)), (index += 1);
    else if (name === '--output') (options.output = path.resolve(value)), (index += 1);
    else throw new Error(`Unknown or incomplete argument: ${name}`);
  }
  if (!options.base || !options.candidate || !options.output)
    throw new Error('--base, --candidate, and --output are required');
  return options;
}

function metrics(summary) {
  const output = {};
  for (const [probe, result] of Object.entries(summary.probes || {})) {
    for (const [name, stats] of Object.entries(result.aggregates || {})) output[`${probe}.${name}`] = stats.median;
  }
  return output;
}

function noiseThreshold(name) {
  if (metricKind(name) === 'bytes') return 1024 * 1024;
  if (metricKind(name) === 'time') return 10;
  return 1;
}

function format(value, name) {
  if (value === undefined) return 'n/a';
  if (metricKind(name) === 'bytes') return `${(value / 1024 / 1024).toFixed(2)} MiB`;
  if (metricKind(name) === 'time') return `${value.toFixed(2)} ms`;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function metricKind(name) {
  const segment = name.split('.').at(-1) || '';
  if (/bytes|rss|heap/iu.test(segment)) return 'bytes';
  if (/ms$|time|duration/iu.test(segment)) return 'time';
  return 'count';
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

async function sha256(file) {
  return createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
}

function referencedFile(directory, reference) {
  if (!reference || typeof reference.file !== 'string' || path.isAbsolute(reference.file)) {
    throw new Error(`${directory} contains an invalid collection reference`);
  }
  const file = path.resolve(directory, reference.file);
  if (!file.startsWith(`${directory}${path.sep}`))
    throw new Error(`${directory} contains a parent-traversing reference`);
  return file;
}

async function loadCollection(directory) {
  const manifest = JSON.parse(await readFile(path.join(directory, 'collection.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.finalized !== true || !Array.isArray(manifest.reports)) {
    throw new Error(`${directory} is not a finalized RunJS performance collection`);
  }
  for (const reference of [manifest.summary, manifest.rawSamples, ...manifest.reports, manifest.focusedTests].filter(
    Boolean,
  )) {
    const file = referencedFile(directory, reference);
    if ((await sha256(file)) !== reference.sha256) throw new Error(`${file} does not match its finalized SHA-256`);
  }
  const summary = JSON.parse(await readFile(referencedFile(directory, manifest.summary), 'utf8'));
  if (summary.measuredSha !== manifest.measuredSha || summary.measuredTree !== manifest.measuredTree) {
    throw new Error(`${directory} summary identity does not match its finalized collection`);
  }
  if (manifest.focusedTests) {
    const focused = JSON.parse(await readFile(referencedFile(directory, manifest.focusedTests), 'utf8'));
    if (
      focused.schemaVersion !== 1 ||
      focused.measuredSha !== summary.measuredSha ||
      focused.measuredTree !== summary.measuredTree
    ) {
      throw new Error(`${directory} focused test identity does not match its finalized collection`);
    }
  }
  return { directory, manifest, summary };
}

function aggregateFileEvidence(collection) {
  const values = new Map();
  for (const evidence of collection.manifest.fileEvidence || []) {
    if (typeof evidence.file !== 'string' || !Number.isFinite(evidence.durationMs)) continue;
    if (!values.has(evidence.file)) values.set(evidence.file, []);
    values.get(evidence.file).push(evidence);
  }
  const optionalMedian = (items) => (items.length ? median(items) : null);
  return Object.fromEntries(
    [...values].map(([file, evidence]) => [
      file,
      {
        bootstrapCount: optionalMedian(evidence.map((item) => item.bootstrapCount).filter(Number.isFinite)),
        bootstrapWallTimeMs: optionalMedian(evidence.map((item) => item.bootstrapWallTimeMs).filter(Number.isFinite)),
        durationMs: median(evidence.map((item) => item.durationMs)),
        evidence: evidence.some((item) => item.evidence === 'owning-process') ? 'owning-process' : 'report-only',
        failedTests: Math.max(...evidence.map((item) => item.failedTests ?? 0)),
        peakRssBytes: optionalMedian(evidence.map((item) => item.process?.peakRssBytes).filter(Number.isFinite)),
        processWallTimeMs: optionalMedian(evidence.map((item) => item.process?.wallTimeMs).filter(Number.isFinite)),
        retries: Math.max(...evidence.map((item) => item.retries ?? 0)),
        sessionCount: optionalMedian(evidence.map((item) => item.sessionCount).filter(Number.isFinite)),
      },
    ]),
  );
}

function top30(files) {
  return Object.entries(files)
    .sort((left, right) => right[1].durationMs - left[1].durationMs)
    .slice(0, 30);
}

function top30Section(title, files) {
  const rows = top30(files);
  return [
    `## ${title} Top 30 slowest files`,
    '',
    '| File | Median duration | Process wall | Peak RSS | Bootstraps | Bootstrap wall | Sessions | Failures | Retries | Evidence |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
    ...(rows.length
      ? rows.map(
          ([file, metrics]) =>
            `| ${file} | ${metrics.durationMs.toFixed(2)} ms | ${
              metrics.processWallTimeMs === null ? 'unavailable' : `${metrics.processWallTimeMs.toFixed(2)} ms`
            } | ${
              metrics.peakRssBytes === null ? 'unavailable' : `${(metrics.peakRssBytes / 1024 / 1024).toFixed(2)} MiB`
            } | ${metrics.bootstrapCount ?? 'n/a'} | ${
              metrics.bootstrapWallTimeMs === null ? 'n/a' : `${metrics.bootstrapWallTimeMs.toFixed(2)} ms`
            } | ${metrics.sessionCount ?? 'n/a'} | ${metrics.failedTests} | ${metrics.retries} | ${metrics.evidence} |`,
        )
      : ['| No finalized Vitest reports | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |']),
    '',
  ];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const baseCollection = await loadCollection(options.base);
  const candidateCollection = await loadCollection(options.candidate);
  const baseSummary = baseCollection.summary;
  const candidateSummary = candidateCollection.summary;
  const base = metrics(baseSummary);
  const candidate = metrics(candidateSummary);
  const names = [...new Set([...Object.keys(base), ...Object.keys(candidate)])].sort();
  const rows = names.map((name) => {
    const before = base[name];
    const after = candidate[name];
    const absolute = before === undefined || after === undefined ? undefined : after - before;
    const percent = absolute === undefined || before === 0 ? undefined : (absolute / before) * 100;
    const meaningful =
      absolute !== undefined &&
      percent !== undefined &&
      Math.abs(percent) > 10 &&
      Math.abs(absolute) > noiseThreshold(name);
    return { absolute, after, before, meaningful, name, percent };
  });
  const files = { base: aggregateFileEvidence(baseCollection), candidate: aggregateFileEvidence(candidateCollection) };
  const markdown = [
    '# RunJS performance comparison',
    '',
    `- Base: \`${baseSummary.measuredSha}\` (tree \`${baseSummary.measuredTree}\`)`,
    `- Candidate: \`${candidateSummary.measuredSha}\` (tree \`${candidateSummary.measuredTree}\`)`,
    '- Meaningful changes must exceed both 10% and the metric absolute noise threshold.',
    '',
    '| Metric | Base | Candidate | Absolute | Percent | Meaningful |',
    '| --- | ---: | ---: | ---: | ---: | :---: |',
    ...rows.map(
      (row) =>
        `| ${row.name} | ${format(row.before, row.name)} | ${format(row.after, row.name)} | ${
          row.absolute === undefined ? 'n/a' : format(row.absolute, row.name)
        } | ${row.percent === undefined ? 'n/a' : `${row.percent.toFixed(2)}%`} | ${row.meaningful ? 'yes' : 'no'} |`,
    ),
    '',
    ...top30Section('Base', files.base),
    ...top30Section('Candidate', files.candidate),
  ].join('\n');
  await writeFile(options.output, markdown, 'utf8');
  await writeFile(
    `${options.output}.json`,
    `${JSON.stringify(
      {
        base: baseSummary.measuredSha,
        candidate: candidateSummary.measuredSha,
        files,
        metrics: rows,
        top30: { base: top30(files.base), candidate: top30(files.candidate) },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
