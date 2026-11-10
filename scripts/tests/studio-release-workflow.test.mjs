import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../../.github/workflows/v3-studio-release.yml', import.meta.url),
  'utf8',
);
function step(name) {
  const start = workflow.indexOf(`      - name: ${name}\n`);
  assert.notEqual(start, -1);
  const end = workflow.indexOf('\n      - name:', start + 1);
  return workflow.slice(start, end < 0 ? undefined : end);
}

test('source overrides require a dry run and an immutable commit', () => {
  const source = step('Validate source override')
    .split('        run: |\n')[1]
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');
  for (const [ref, dry, expected] of [
    ['', 'false', 0],
    ['a'.repeat(40), 'true', 0],
    ['a'.repeat(40), 'false', 1],
    ['dev', 'true', 1],
    ['abcd', 'true', 1],
  ]) {
    const result = spawnSync('bash', ['-e', '-c', source], {
      encoding: 'utf8',
      env: { ...process.env, SOURCE_REF: ref, DRY_RUN: dry },
    });
    assert.equal(result.status, expected, result.stderr || result.stdout);
  }
  assert.match(
    step('Resolve the source'),
    /inputs\.source_ref \|\| steps\.channel\.outputs\.branch/,
  );
  assert.match(
    step("Check studio's tag and bump branch are free"),
    /inputs\.source_ref == ''/,
  );
  assert.match(
    step('Check the registry and name the tags'),
    /inputs\.source_ref == '' && secrets\.DOCKER_PUBLISH_TOKEN \|\| ''/,
  );
});

test('both editions build at one source and dry runs cannot publish', () => {
  assert.match(workflow, /edition: \[studio, studio-ee\]/);
  assert.match(
    step('Build edition dist'),
    /pnpm build:image --edition "\$EDITION"/,
  );
  assert.match(step('Build edition dist'), /--source-ref "\$COMMIT"/);
  assert.match(step('Build and push'), /inputs\.dry_run && 'type=cacheonly'/);
  for (const job of ['manifest', 'release']) {
    const block = workflow
      .slice(workflow.indexOf(`\n  ${job}:`))
      .split('\n    steps:')[0];
    assert.match(block, /if: \$\{\{ !inputs\.dry_run \}\}/);
  }
});
