import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const proWorkflows = [
  'v3-pro-release-beta.yml',
  'v3-pro-release-stable.yml',
  'v3-pro-promote-to-stable.yml',
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

test('the Pro registry serves only the @nocobase scope and the install can authenticate to it', async () => {
  for (const name of proWorkflows) {
    const source = await workflow(name);
    const steps = source.split(/\n(?=      - name: )/u);
    const registrySteps = steps.filter((step) =>
      /^\s+registry-url: \$\{\{ secrets\.PRO_NPM_REGISTRY \}\}\s*$/mu.test(
        step,
      ),
    );
    for (const step of registrySteps) {
      assert.match(step, /^\s+scope: '@nocobase'\s*$/mu, `${name}:\n${step}`);
    }
    if (registrySteps.length > 0) {
      const install = steps.find((step) =>
        step.includes('node ./scripts/sync-release-oss.mjs'),
      );
      assert.ok(install, name);
      assert.match(
        install,
        /^\s+NODE_AUTH_TOKEN: \$\{\{ secrets\.PRO_NPM_TOKEN \}\}\s*$/mu,
        `${name}:\n${install}`,
      );
    }
  }
});
