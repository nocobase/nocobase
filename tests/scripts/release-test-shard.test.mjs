import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const script = path.join(root, 'scripts/release-test-shard.sh');

// Runs a shard with a pnpm that records its arguments instead of testing anything.
function runShard(t, shard, includeTemplates = 'false') {
  const directory = mkdtempSync(path.join(tmpdir(), 'release-test-shard-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const calls = path.join(directory, 'calls.jsonl');
  writeFileSync(calls, '');
  writeFileSync(
    path.join(directory, 'pnpm'),
    `#!/usr/bin/env node
require('node:fs').appendFileSync(${JSON.stringify(calls)}, JSON.stringify(process.argv.slice(2)) + '\\n');
`,
  );
  chmodSync(path.join(directory, 'pnpm'), 0o755);
  const result = spawnSync('bash', [script, shard, includeTemplates], {
    cwd: root,
    env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    encoding: 'utf8',
  });
  return {
    ...result,
    calls: readFileSync(calls, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line)),
  };
}

const filtersOf = (call) =>
  call.flatMap((arg, index) => (call[index - 1] === '--filter' ? [arg] : []));

// The workspace directories a set of filters selects, resolved by pnpm itself.
function selected(filters) {
  const output = execFileSync(
    'pnpm',
    [
      'ls',
      '-r',
      '--depth',
      '-1',
      '--json',
      ...filters.flatMap((filter) => ['--filter', filter]),
    ],
    { cwd: root, encoding: 'utf8' },
  );
  return JSON.parse(output)
    .map((project) => path.relative(root, project.path))
    .sort();
}

test('the agents and plugins shards split the plugin suites between them without overlap', (t) => {
  const agents = runShard(t, 'agents');
  assert.equal(agents.status, 0, agents.stderr);
  const plugins = runShard(t, 'plugins');
  assert.equal(plugins.status, 0, plugins.stderr);
  for (const shard of [agents, plugins]) {
    assert.equal(shard.calls.length, 1);
    assert.deepEqual(shard.calls[0].slice(0, 3), [
      '-r',
      '--no-sort',
      '--if-present',
    ]);
    assert.equal(shard.calls[0].at(-1), 'test');
  }

  const agentsPackages = selected(filtersOf(agents.calls[0]));
  const pluginsPackages = selected(filtersOf(plugins.calls[0]));
  assert.deepEqual(agentsPackages, ['packages/plugins/app-plugin-agents']);
  assert.ok(!pluginsPackages.includes('packages/plugins/app-plugin-agents'));
  assert.deepEqual(
    [...agentsPackages, ...pluginsPackages].sort(),
    selected(['./packages/plugins/**']),
  );
});

test('the others shard keeps every non-plugin suite, and the templates only when asked', (t) => {
  for (const [includeTemplates, templates] of [
    ['false', false],
    ['true', true],
  ]) {
    const others = runShard(t, 'others', includeTemplates);
    assert.equal(others.status, 0, others.stderr);
    assert.deepEqual(others.calls[0], ['scripts:test']);
    assert.deepEqual(others.calls.at(-1), ['db:test']);
    const filters = filtersOf(others.calls[1]);
    assert.ok(filters.includes('!./packages/plugins/**'));
    assert.equal(filters.includes('!./packages/templates/**'), !templates);
  }
});

test('an unknown shard fails before running anything', (t) => {
  const unknown = runShard(t, 'everything');
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Unknown test shard: everything/u);
  assert.deepEqual(unknown.calls, []);
});
