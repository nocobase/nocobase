import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { actionInput, checkUI, createdRecords } from './observations.mjs';
import { checkSyncedSkills, verifyRuntime } from './runtime.mjs';

const directory = fileURLToPath(new URL('.', import.meta.url));
export const scenarios = ['procurement', 'customers', 'onboarding', 'expenses'];
export const digest = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');

export function assertSubset(actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(actual?.[key], value, `Unexpected observation: ${key}`);
  }
}

export function testURL(scenario, value) {
  assert(scenarios.includes(scenario), 'Unknown scenario');
  const url = new URL(value);
  assert.equal(url.protocol, 'http:');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.pathname, `/baseline-${scenario}/`);
  assert(url.port && Number(url.port) >= 1024, 'Explicit test port required');
  assert(!url.username && !url.password && !url.search && !url.hash);
  return url.href;
}

async function checkEvidence(files, evidenceDir) {
  assert(Array.isArray(files) && files.length > 0, 'Raw evidence required');
  const root = await realpath(evidenceDir);
  for (const file of files) {
    assert.equal(typeof file, 'string');
    assert(!path.isAbsolute(file), 'Evidence path must be relative');
    const target = await realpath(path.resolve(root, file));
    assert(
      target.startsWith(root + path.sep),
      'Evidence escapes run directory',
    );
    const info = await stat(target);
    assert(info.isFile() && info.size > 0, 'Empty evidence');
  }
}

export async function evaluate({
  suite,
  seed,
  adapter,
  evidenceDir,
  deadline = Date.now() + 15 * 60_000,
}) {
  const results = [];
  const withinDeadline = async (operation) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0)
      throw Object.assign(new Error('Acceptance deadline reached'), {
        code: 'BLOCKED',
      });
    let timer;
    try {
      return await Promise.race([
        operation(),
        new Promise((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                Object.assign(new Error('Acceptance deadline reached'), {
                  code: 'BLOCKED',
                }),
              ),
            remaining,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };
  for (const item of suite.cases) {
    const observations = [];
    const started = Date.now();
    let status = 'passed';
    let error;
    try {
      if (!adapter)
        throw Object.assign(new Error('Evaluator adapter unavailable'), {
          code: 'BLOCKED',
        });
      await withinDeadline(() => adapter.reset(structuredClone(seed)));
      for (const step of item.steps) {
        const result = await withinDeadline(() =>
          adapter.execute(step.action, actionInput(step.action, step.input)),
        );
        await checkEvidence(result?.evidence, evidenceDir);
        if (step.action === 'concurrent' && step.input.operation === 'create') {
          result.value = {
            ...result.value,
            ...createdRecords(
              result.persisted?.before,
              result.persisted?.after,
            ),
          };
        }
        if (step.action === 'ui') {
          result.value = {
            ...result.value,
            ...checkUI(step.input.flow, suite.scenario, result.ui),
          };
          for (const stage of [
            ...result.ui.stages,
            ...(result.ui.roleStates ?? []),
          ])
            await checkEvidence(stage.evidence, evidenceDir);
        }
        observations.push(result);
        assertSubset(result.value, step.expect);
      }
    } catch (cause) {
      status = cause.code === 'BLOCKED' ? 'blocked' : 'failed';
      // The adapter must sanitize errors before throwing; never export native request headers.
      error = {
        code: cause.code ?? 'ASSERTION_FAILED',
        message: cause.message,
      };
    }
    results.push({
      id: item.id,
      category: item.category,
      channel: item.channel,
      status,
      seconds: (Date.now() - started) / 1000,
      observations,
      ...(error ? { error } : {}),
    });
  }
  const count = (status) =>
    results.filter((result) => result.status === status).length;
  return {
    schemaVersion: 1,
    scenario: suite.scenario,
    total: results.length,
    passed: count('passed'),
    failed: count('failed'),
    blocked: count('blocked'),
    passRate: results.length ? count('passed') / results.length : 0,
    allPassed: results.length > 0 && count('passed') === results.length,
    results,
  };
}

async function main() {
  const [scenario, adapterFile, output] = process.argv.slice(2);
  assert(
    scenarios.includes(scenario) &&
      adapterFile &&
      output &&
      process.argv.length === 5,
    'Usage: node dev/business-baseline/evaluate.mjs <scenario> <adapter.mjs> <output-directory>',
  );
  const evidenceDir = path.resolve(output);
  const repo = path.resolve(directory, '../..');
  assert(
    evidenceDir.startsWith(path.join(repo, '.business-baseline') + path.sep),
    'Output must be inside .business-baseline',
  );
  await mkdir(evidenceDir, { recursive: true });
  // Do not silently overwrite a scored result.
  assert(
    !(await stat(path.join(evidenceDir, 'result.json')).catch(() => null)),
    'Result already exists; retain it and choose a new attempt directory',
  );
  const suiteBytes = await readFile(
    path.join(directory, 'assertions', `${scenario}.json`),
  );
  const seedBytes = await readFile(
    path.join(directory, 'seeds', `${scenario}.json`),
  );
  const manifestBytes = await readFile(path.join(directory, 'materials.json'));
  const manifest = JSON.parse(manifestBytes);
  for (const [file, hash] of Object.entries(manifest.files)) {
    assert.equal(
      digest(await readFile(path.join(directory, file))),
      hash,
      `Changed collection material: ${file}`,
    );
  }
  const baseURL = testURL(
    scenario,
    process.env.BASELINE_URL ??
      `http://127.0.0.1:${14752 + scenarios.indexOf(scenario)}/baseline-${scenario}/`,
  );
  const round = process.env.BASELINE_ROUND ?? 'before';
  assert(['before', 'after'].includes(round));
  const appRoot = path.join(
    repo,
    '.business-baseline',
    `private-${round}-${scenario}`,
    '.business-baseline',
    round === 'after' ? `after-${scenario}` : scenario,
  );
  const deadline = Date.now() + 15 * 60_000;
  const signal = AbortSignal.timeout(15 * 60_000);
  let runtime;
  let synchronizedSkills;
  let adapter;
  let adapterHash = 'unknown';
  let setupError;
  try {
    const identity = JSON.parse(
      await readFile(path.join(appRoot, '.baseline-instance.json')),
    );
    assert.equal(identity.runtime.round, round);
    runtime = await verifyRuntime(appRoot, round);
    assert.equal(
      runtime.profileSha256,
      identity.runtime.profileSha256,
      'Instance runtime profile changed',
    );
    synchronizedSkills = await checkSyncedSkills(appRoot);
    adapterHash = digest(await readFile(path.resolve(adapterFile)));
    const module = await import(pathToFileURL(path.resolve(adapterFile)).href);
    adapter = await module.createAdapter({
      scenario,
      baseURL,
      evidenceDir,
      signal,
    });
    assert(
      ['reset', 'execute', 'close'].every(
        (name) => typeof adapter[name] === 'function',
      ),
      'Incomplete adapter',
    );
  } catch (error) {
    setupError = {
      code: error.code ?? 'ADAPTER_SETUP_FAILED',
      message: error.message,
    };
    adapter = undefined;
  }
  const result = await evaluate({
    suite: JSON.parse(suiteBytes),
    seed: JSON.parse(seedBytes),
    adapter,
    evidenceDir,
    deadline,
  });
  await writeFile(
    path.join(evidenceDir, 'result.json'),
    JSON.stringify(
      {
        ...result,
        baseURL,
        runtime,
        synchronizedSkills,
        materialsSha256: digest(manifestBytes),
        adapterSha256: adapterHash,
        suiteSha256: digest(suiteBytes),
        seedSha256: digest(seedBytes),
        setupError,
      },
      null,
      2,
    ) + '\n',
  );
  // Persist the complete score before cleanup, including if an adapter cannot stop after the deadline.
  const cleanupTimer = setTimeout(() => process.exit(1), 5000);
  try {
    await adapter?.close();
  } finally {
    clearTimeout(cleanupTimer);
  }
  console.log(
    JSON.stringify({
      scenario,
      passed: result.passed,
      failed: result.failed,
      blocked: result.blocked,
      total: result.total,
      passRate: result.passRate,
    }),
  );
  process.exit(result.allPassed ? 0 : 1);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
