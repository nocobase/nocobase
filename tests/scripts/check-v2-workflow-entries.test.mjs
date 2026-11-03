import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  checkEntries,
  EXCLUDED,
} from '../../scripts/check-v2-workflow-entries.mjs';

const script = path.resolve(
  import.meta.dirname,
  '../../scripts/check-v2-workflow-entries.mjs',
);
const realEntries = path.resolve(
  import.meta.dirname,
  '../../.github/workflows',
);

function mainWorkflow({
  name = 'Release',
  inputs = { version: { type: 'string' } },
  dispatch = true,
} = {}) {
  const on = dispatch
    ? `  workflow_dispatch:\n${inputs ? `    inputs:\n      version:\n        type: ${inputs.version?.type ?? 'string'}\n` : ''}`
    : '  push:\n    branches: [main]\n';
  return `name: ${name}\non:\n${on}jobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n`;
}

function entryWorkflow(
  file,
  {
    name = 'Release',
    type = 'string',
    extra = '',
    guard = true,
    workflowFile = file,
    ref = 'main',
  } = {},
) {
  return `name: ${name}
on:
  workflow_dispatch:
    inputs:
      version:
        type: ${type}
${extra}jobs:
  dispatch:
${guard ? "    if: ${{ github.ref == 'refs/heads/v3-develop' }}\n" : ''}    runs-on: ubuntu-latest
    steps:
      - env:
          WORKFLOW_FILE: ${workflowFile}
        run: >
          jq '{ref: "${ref}", inputs: {}}'
`;
}

function fixture(main, entries) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'check-v2-entries-'));
  for (const [dir, files] of [
    ['main', main],
    ['entries', entries],
  ]) {
    mkdirSync(path.join(root, dir));
    for (const [file, content] of Object.entries(files))
      writeFileSync(path.join(root, dir, file), content);
  }
  return root;
}

function run(main, entries, mismatch) {
  const root = fixture(main, entries);
  try {
    return checkEntries({
      main: path.join(root, 'main'),
      entries: path.join(root, 'entries'),
      mismatch,
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// Fixtures hold no excluded workflow, so each run also warns that they are gone from main; drop those warnings.
const notGone = (list) =>
  list.filter((finding) => !/no longer exists on main/u.test(finding.message));
const messages = (list) => list.map((finding) => finding.message);

test('passes entries that mirror main and ignores v3 workflows and non-dispatch workflows', () => {
  const result = run(
    {
      'release.yml': mainWorkflow(),
      'test.yml': mainWorkflow({ dispatch: false }),
      'v3-x.yml': mainWorkflow(),
    },
    {
      'release.yml': entryWorkflow('release.yml'),
      'v3-y.yml': 'not: even: yaml: [',
    },
  );
  assert.deepEqual(result.errors, []);
  assert.deepEqual(notGone(result.warnings), []);
  assert.equal(result.checked, 1);
});

test('treats missing and null inputs as empty', () => {
  const entry = entryWorkflow('release.yml').replace(
    /    inputs:\n      version:\n        type: string\n/u,
    '    inputs:\n',
  );
  const result = run(
    { 'release.yml': mainWorkflow({ inputs: null }) },
    { 'release.yml': entry },
  );
  assert.deepEqual(result.errors, []);
});

test('reports a main dispatch workflow without an entry, as an error or a warning by mode', () => {
  assert.match(
    run({ 'a.yml': mainWorkflow() }, {}).errors[0].message,
    /no entry/u,
  );
  const warned = run({ 'a.yml': mainWorkflow() }, {}, 'warn');
  assert.deepEqual(warned.errors, []);
  assert.equal(notGone(warned.warnings).length, 1);
});

test('does not require entries for excluded workflows', () => {
  const result = run({ 'manual-e2e.yml': mainWorkflow() }, {});
  assert.deepEqual(result.errors, []);
});

test('reports an excluded workflow that has an entry, and one that is gone from main as a warning', () => {
  const withEntry = run(
    { 'manual-e2e.yml': mainWorkflow() },
    { 'manual-e2e.yml': entryWorkflow('manual-e2e.yml') },
  );
  assert.match(withEntry.errors[0].message, /EXCLUDED/u);
  const gone = run({}, {}, 'error');
  assert.equal(gone.errors.length, 0);
  assert.equal(gone.warnings.length, EXCLUDED.size);
});

test('reports an entry without a counterpart or whose counterpart lost workflow_dispatch', () => {
  const orphan = run({}, { 'release.yml': entryWorkflow('release.yml') });
  assert.match(orphan.errors[0].message, /no counterpart/u);
  const lost = run(
    { 'release.yml': mainWorkflow({ dispatch: false }) },
    { 'release.yml': entryWorkflow('release.yml') },
  );
  assert.match(lost.errors[0].message, /no longer has a workflow_dispatch/u);
});

test('reports a different name and different inputs with the update order', () => {
  const name = run(
    { 'release.yml': mainWorkflow() },
    { 'release.yml': entryWorkflow('release.yml', { name: 'Other' }) },
  );
  assert.equal(name.errors.length, 1);
  assert.match(
    name.errors[0].message,
    /update the entry on v3-develop first, then main/u,
  );
  const inputs = run(
    { 'release.yml': mainWorkflow() },
    { 'release.yml': entryWorkflow('release.yml', { type: 'boolean' }) },
  );
  assert.match(inputs.errors[0].message, /inputs/u);
  const warned = run(
    { 'release.yml': mainWorkflow() },
    { 'release.yml': entryWorkflow('release.yml', { type: 'boolean' }) },
    'warn',
  );
  assert.deepEqual(warned.errors, []);
  assert.equal(notGone(warned.warnings).length, 1);
});

test('structural findings stay errors in warn mode', () => {
  const main = { 'release.yml': mainWorkflow() };
  const cases = {
    trigger: [
      entryWorkflow('release.yml').replace(
        'on:\n',
        'on:\n  push:\n    branches: [main]\n',
      ),
      /only trigger/u,
    ],
    guard: [entryWorkflow('release.yml', { guard: false }), /guarded/u],
    file: [
      entryWorkflow('release.yml', { workflowFile: 'other.yml' }),
      /WORKFLOW_FILE/u,
    ],
    ref: [entryWorkflow('release.yml', { ref: 'v3-develop' }), /ref "main"/u],
  };
  for (const [label, [content, pattern]] of Object.entries(cases)) {
    const result = run(main, { 'release.yml': content }, 'warn');
    assert.ok(
      messages(result.errors).some((message) => pattern.test(message)),
      label,
    );
  }
});

test('reports an unparsable file', () => {
  const result = run(
    { 'release.yml': mainWorkflow() },
    { 'release.yml': 'a: [' },
  );
  assert.match(result.errors[0].message, /cannot be parsed/u);
});

test('the command line exits 0, 1 and 2 and prints annotations', () => {
  const root = fixture({ 'a.yml': mainWorkflow() }, {});
  try {
    const args = [
      script,
      '--main',
      path.join(root, 'main'),
      '--entries',
      path.join(root, 'entries'),
    ];
    const failed = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.equal(failed.status, 1);
    assert.match(failed.stdout, /^::error file=\.github\/workflows\/a\.yml::/u);
    assert.equal(
      spawnSync(process.execPath, [...args, '--mismatch', 'warn'], {
        encoding: 'utf8',
      }).status,
      0,
    );
    assert.equal(
      spawnSync(process.execPath, [script], { encoding: 'utf8' }).status,
      2,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('every real entry on v3-develop passes the structural checks', () => {
  // Main is not part of this checkout, so compare the entries with themselves: only the structural checks can fail.
  const files = readdirSync(realEntries).filter(
    (file) => /\.ya?ml$/u.test(file) && !file.startsWith('v3-'),
  );
  assert.ok(files.length >= 16);
  const root = fixture(
    Object.fromEntries(
      files.map((file) => [
        file,
        readFileSync(path.join(realEntries, file), 'utf8'),
      ]),
    ),
    {},
  );
  try {
    const result = checkEntries({
      main: path.join(root, 'main'),
      entries: realEntries,
      mismatch: 'warn',
    });
    assert.deepEqual(result.errors, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
