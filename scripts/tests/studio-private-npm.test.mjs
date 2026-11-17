import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const files = ['../../.github/workflows/v3-studio-release.yml'];
for (const file of files) {
  const workflow = readFileSync(new URL(file, import.meta.url), 'utf8');
  const steps = workflow.split('      - name: ');
  const setups = steps.filter((s) =>
    s.startsWith('Configure private npm read access\n'),
  );
  const cleanups = steps.filter((s) =>
    s.startsWith('Remove private npm credentials\n'),
  );
  test(`${file}: private npm authentication fails closed and cleans up without logging credentials`, () => {
    assert.ok(setups.length > 0);
    assert.equal(setups.length, cleanups.length);
    for (const [i, setup] of setups.entries()) {
      const directory = mkdtempSync(path.join(tmpdir(), 'studio-npm-auth-'));
      const config = path.join(directory, 'studio-npmrc');
      const token = 'test-token-$literal;value';
      const script = setup
        .split('        run: |\n')[1]
        .split('\n')
        .filter((line) => line.startsWith('          '))
        .map((line) => line.slice(10))
        .join('\n');
      const run = (value) =>
        spawnSync('bash', ['-e', '-c', script], {
          encoding: 'utf8',
          env: { ...process.env, RUNNER_TEMP: directory, PRO_NPM_TOKEN: value },
        });
      try {
        assert.notEqual(run('').status, 0);
        assert.equal(existsSync(config), false);
        const result = run(token);
        assert.equal(result.status, 0, result.stderr);
        assert.ok(
          !result.stdout.includes(token) && !result.stderr.includes(token),
        );
        assert.equal(statSync(config).mode & 0o777, 0o600);
        assert.equal(
          readFileSync(config, 'utf8'),
          `@nocobase:registry=https://pkg-v3.nocobase.com/\n//pkg-v3.nocobase.com/:_authToken=${token}\n`,
        );
        assert.match(cleanups[i], /if: \$\{\{ always\(\) \}\}/u);
        const cleanup = cleanups[i].match(/^        run: (.+)$/mu)?.[1];
        assert.ok(cleanup);
        assert.equal(
          spawnSync('bash', ['-e', '-c', cleanup], {
            env: { ...process.env, RUNNER_TEMP: directory },
          }).status,
          0,
        );
        assert.equal(existsSync(config), false);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    }
  });
  test(`${file}: every Studio install and build receives the npm user config`, () => {
    const consumers = steps.filter((s) =>
      /^(Install dependencies|Build edition dist|Build the deployment archive|Build the nb-studio tarballs|Build the nocobase-runner tarballs|Build Studio|\$\{\{ matrix.name \}\})\n/u.test(
        s,
      ),
    );
    assert.ok(consumers.length > 0);
    for (const consumer of consumers) {
      assert.match(
        consumer,
        /NPM_CONFIG_USERCONFIG: \$\{\{ runner.temp \}\}\/studio-npmrc/u,
      );
      assert.doesNotMatch(consumer, /PRO_NPM_TOKEN:/u);
    }
  });
}
