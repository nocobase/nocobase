import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  assertSubset,
  evaluate,
  scenarios,
  testURL,
} from '../../dev/business-baseline/evaluate.mjs';
import {
  actionInput,
  buttonMatrix,
  checkUI,
  createdRecords,
  uiStages,
} from '../../dev/business-baseline/observations.mjs';
import {
  checkSyncedSkills,
  compareRuntime,
  treeHashes,
} from '../../dev/business-baseline/runtime.mjs';

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

test('same-operation create replay counts persisted differences, not successful responses', () => {
  const keys = actionInput('concurrent', {
    operation: 'create',
    sameOperationKey: true,
  }).operationKeys;
  assert.equal(keys[0], keys[1]);
  const independent = actionInput('concurrent', {
    to: 'approved',
  }).operationKeys;
  assert.notEqual(independent[0], independent[1]);
  const before = {
    parents: [{ id: 'seed' }],
    children: [{ id: 'seed-child', parentId: 'seed' }],
  };
  const after = {
    parents: [...before.parents, { id: 'new' }],
    children: [
      ...before.children,
      { id: 'one', parentId: 'new' },
      { id: 'two', parentId: 'new' },
    ],
  };
  assert.deepEqual(createdRecords(before, after), {
    createdParents: 1,
    createdChildren: 2,
  });
  after.parents.push({ id: 'duplicate-create' });
  assert.throws(() =>
    assertSubset(createdRecords(before, after), {
      createdParents: 1,
      createdChildren: 2,
    }),
  );
  after.children.push({ id: 'orphan', parentId: 'absent' });
  assert.throws(
    () => createdRecords(before, after),
    /without a newly created parent/,
  );
});

test('UI contract detects a skipped deletion and incorrect role/state buttons', () => {
  const stages = (flow) =>
    uiStages[flow].map((id) => ({
      id,
      url: '/test',
      selector: 'real-locator',
      observed: 'self-test',
      evidence: ['trace.json'],
    }));
  const ui = {
    stages: stages('edit-children'),
    thirdChildId: 'third',
    editedChildId: 'first',
  };
  const original = [
    { id: 'first', label: 'Original' },
    { id: 'second', label: 'Second' },
  ];
  const edited = [{ id: 'first', label: 'Baseline edited child' }, original[1]];
  ui.stages[1].children = [...original, { id: 'third', label: 'Third' }];
  ui.stages[2].children = [...edited, { id: 'third', label: 'Third' }];
  ui.stages[3].children = edited;
  ui.stages[5].children = edited;
  assert.equal(checkUI('edit-children', 'customers', ui).childCount, 2);
  ui.stages.splice(3, 1);
  assert.throws(
    () => checkUI('edit-children', 'customers', ui),
    /Missing or reordered/,
  );
  const cycle = {
    stages: stages('decision-cycle'),
    roleStates: buttonMatrix('procurement').map((row) => ({
      ...row,
      url: '/record',
      evidence: ['trace.json'],
      buttons: Object.fromEntries(
        Object.entries(row.actions).map(([action, allowed]) => [
          action,
          { visible: allowed, enabled: allowed },
        ]),
      ),
    })),
  };
  assert.equal(
    checkUI('decision-cycle', 'procurement', cycle).buttonsCorrect,
    true,
  );
  cycle.roleStates.find(
    ({ actor, state }) => actor === 'outsider' && state === 'submitted',
  ).buttons.approve = { visible: true, enabled: true };
  assert.throws(
    () => checkUI('decision-cycle', 'procurement', cycle),
    /outsider\/submitted\/approve/,
  );
});

test('runtime inventory detects changed installed bytes and redirected dependencies', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'baseline-runtime-'));
  try {
    const file = path.join(directory, 'runtime.js');
    await writeFile(file, 'export const value = 1;');
    const expected = {
      artifacts: await treeHashes(directory),
      resolutions: { plugin: '/fixed/plugin' },
    };
    compareRuntime(expected, structuredClone(expected));
    assert.throws(
      () =>
        compareRuntime(
          { ...expected, resolutions: { plugin: '/different/plugin' } },
          expected,
        ),
      /resolutions/,
    );
    await writeFile(file, 'export const value = 2;');
    const actual = { ...expected, artifacts: await treeHashes(directory) };
    assert.throws(() => compareRuntime(actual, expected), /artifacts/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('runner rejects a fabricated concurrent create count using persisted snapshots', async () => {
  const evidenceDir = await mkdtemp(
    path.join(os.tmpdir(), 'baseline-concurrent-'),
  );
  try {
    await writeFile(path.join(evidenceDir, 'db.json'), '{"selfTestOnly":true}');
    const suite = JSON.parse(
      await readFile(
        new URL(
          '../../dev/business-baseline/assertions/customers.json',
          import.meta.url,
        ),
      ),
    );
    const item = suite.cases.find(({ id }) => id === 'CUSTOMERS-019');
    const adapter = {
      reset: async () => {},
      execute: async (_action, input) => {
        assert.equal(input.operationKeys[0], input.operationKeys[1]);
        return {
          value: { createdParents: 1, createdChildren: 2 },
          evidence: ['db.json'],
          persisted: {
            before: { parents: [], children: [] },
            after: {
              parents: [{ id: 'one' }, { id: 'two' }],
              children: [
                { id: 'a', parentId: 'one' },
                { id: 'b', parentId: 'one' },
                { id: 'c', parentId: 'two' },
                { id: 'd', parentId: 'two' },
              ],
            },
          },
        };
      },
    };
    const result = await evaluate({
      suite: { ...suite, cases: [item] },
      seed: {},
      adapter,
      evidenceDir,
    });
    assert.equal(result.failed, 1);
    assert.equal(result.total, 1);
  } finally {
    await rm(evidenceDir, { recursive: true, force: true });
  }
});

test('synchronized Skill copies cannot drift from the resolved package', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'baseline-skill-'));
  try {
    const upstream = path.join(
      directory,
      'node_modules/@nocobase/fixture-package/skills/fixture',
    );
    const installed = path.join(directory, '.agents/skills/fixture');
    await mkdir(upstream, { recursive: true });
    await mkdir(installed, { recursive: true });
    await writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify({ dependencies: { '@nocobase/fixture-package': '*' } }),
    );
    await writeFile(
      path.join(
        directory,
        'node_modules/@nocobase/fixture-package/package.json',
      ),
      JSON.stringify({ name: '@nocobase/fixture-package' }),
    );
    await writeFile(
      path.join(directory, '.agents/.skills-sync.json'),
      JSON.stringify({ fixture: '@nocobase/fixture-package' }),
    );
    await writeFile(path.join(upstream, 'SKILL.md'), 'Frozen original');
    await writeFile(path.join(installed, 'SKILL.md'), 'Frozen original');
    assert.equal(Object.keys(await checkSyncedSkills(directory)).length, 1);
    await writeFile(path.join(installed, 'SKILL.md'), 'Different resource');
    await assert.rejects(
      checkSyncedSkills(directory),
      /Synchronized Skill drift/,
    );
    await rm(installed, { recursive: true });
    await writeFile(path.join(directory, '.agents/.skills-sync.json'), '{}');
    await assert.rejects(
      checkSyncedSkills(directory),
      /Installed Skill ownership drift/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
