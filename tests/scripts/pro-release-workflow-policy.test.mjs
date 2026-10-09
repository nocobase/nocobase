import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const proWorkflows = [
  'pro-release-beta.yml',
  'pro-release-stable.yml',
  'pro-promote-to-stable.yml',
];

async function workflow(name) {
  return readFile(path.join(root, '.github/workflows', name), 'utf8');
}

test('Pro workflows do not export commercial artifacts or caches', async () => {
  for (const name of proWorkflows) {
    const source = await workflow(name);
    assert.doesNotMatch(source, /actions\/(?:upload|download)-artifact/u, name);
    assert.doesNotMatch(source, /^\s+cache:\s*pnpm\s*$/mu, name);
  }
});

test('every step that can write outside the runner is disabled for dry runs', async () => {
  const remoteMutation =
    /git push|gh pr (?:create|merge)|gh release (?:create|edit)|publish-commercial-packages|npm dist-tag add|permission-contents: write|feishu-notify\.sh/u;

  for (const name of proWorkflows) {
    const source = await workflow(name);
    const steps = source.split(/\n(?=      - name: )/u);
    for (const step of steps.filter((candidate) =>
      remoteMutation.test(candidate),
    )) {
      assert.match(step, /^\s*if: .*!inputs\.dry_run/mu, `${name}:\n${step}`);
    }
  }
});
