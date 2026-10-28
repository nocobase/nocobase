import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  assertSubset,
  evaluate,
  scenarios,
  testURL,
} from '../../dev/business-baseline/evaluate.mjs';

test('baseline URL refuses other instances and management hosts', () => {
  assert.equal(
    testURL('procurement', 'http://127.0.0.1:14752/baseline-procurement/'),
    'http://127.0.0.1:14752/baseline-procurement/',
  );
  for (const url of [
    'https://studio.v2.test.nocobase.com/main/',
    'http://127.0.0.1:14752/main/',
    'http://localhost:14752/baseline-procurement/',
    'http://user:password@127.0.0.1:14752/baseline-procurement/',
  ]) {
    assert.throws(() => testURL('procurement', url));
  }
});

test('baseline checks observations rather than an adapter verdict', () => {
  assertSubset({ accepted: false, rawStatus: 403 }, { accepted: false });
  assert.throws(() =>
    assertSubset({ passed: true, totalMinor: 0 }, { totalMinor: 3150 }),
  );
  assert.throws(() => assertSubset({ visible: ['foreign'] }, { visible: [] }));
});

const suite = {
  scenario: 'self-test',
  cases: [
    {
      id: 'ONE',
      category: 'business',
      channel: 'api',
      steps: [{ action: 'read', input: {}, expect: { accepted: true } }],
    },
    {
      id: 'TWO',
      category: 'permission',
      channel: 'api',
      steps: [{ action: 'read', input: {}, expect: { visible: [] } }],
    },
  ],
};

test('missing adapter preserves the complete denominator and never passes', async () => {
  const result = await evaluate({ suite, seed: {}, evidenceDir: '.' });
  assert.equal(result.total, 2);
  assert.equal(result.blocked, 2);
  assert.equal(result.passRate, 0);
  assert.equal(result.allPassed, false);
});

test('runner resets per case, rejects fabricated observations and requires raw evidence', async () => {
  const evidenceDir = await mkdtemp(path.join(os.tmpdir(), 'baseline-runner-'));
  try {
    await writeFile(
      path.join(evidenceDir, 'observation.json'),
      '{"selfTestOnly":true}\n',
    );
    let resets = 0;
    const adapter = {
      async reset(seed) {
        resets++;
        seed.mutated = true;
      },
      async execute() {
        return {
          value: { accepted: true, visible: ['foreign'] },
          evidence: ['observation.json'],
        };
      },
    };
    const seed = {};
    const result = await evaluate({ suite, seed, adapter, evidenceDir });
    assert.deepEqual(seed, {});
    assert.equal(resets, 2);
    assert.equal(result.passed, 1);
    assert.equal(result.failed, 1);
    assert.equal(result.passRate, 0.5);
    adapter.execute = async () => ({
      value: { accepted: true, visible: [] },
      evidence: [],
    });
    assert.equal(
      (await evaluate({ suite, seed, adapter, evidenceDir })).failed,
      2,
    );
    adapter.execute = async () => {
      throw Object.assign(new Error('Native route missing'), {
        code: 'UNIMPLEMENTED_FEATURE',
      });
    };
    assert.equal(
      (await evaluate({ suite, seed, adapter, evidenceDir })).failed,
      2,
    );
  } finally {
    await rm(evidenceDir, { recursive: true, force: true });
  }
});

test('frozen scenarios retain permission, transaction and browser checks', async () => {
  const ids = new Set();
  for (const scenario of scenarios) {
    const suite = JSON.parse(
      await readFile(
        new URL(
          `../../dev/business-baseline/assertions/${scenario}.json`,
          import.meta.url,
        ),
      ),
    );
    for (const item of suite.cases) {
      assert(!ids.has(item.id));
      ids.add(item.id);
    }
    assert(suite.cases.some((item) => item.category === 'permission'));
    assert(
      suite.cases.filter((item) =>
        item.steps.some((step) => step.action === 'failChildWrite'),
      ).length === 2,
    );
    assert(suite.cases.some((item) => item.channel === 'browser'));
  }
  assert.equal(ids.size, 122);
});

test('deadline blocks remaining assertions without starting more mutations', async () => {
  let calls = 0;
  const adapter = {
    reset: async () => {
      calls++;
    },
  };
  const result = await evaluate({
    suite,
    seed: {},
    adapter,
    evidenceDir: '.',
    deadline: Date.now() - 1,
  });
  assert.equal(result.blocked, 2);
  assert.equal(result.total, 2);
  assert.equal(calls, 0);
});
