import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { servicePlan } from '../src/core/service.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { removeDir, tempDir } from './helpers.ts';

const root = tempDir('service-environment-');
afterAll(() => removeDir(root));
const hasSystemd =
  process.platform === 'linux' &&
  spawnSync('systemd-analyze', ['--version']).status === 0;
const planFor = (value: string) =>
  servicePlan({
    paths: runnerPaths(root, root),
    home: root,
    platform: 'linux',
    command: [process.execPath],
    env: { SYNTHETIC_VALUE: value },
    passEnv: ['SYNTHETIC_VALUE'],
  });

describe('systemd environment serialization', () => {
  it('quotes apostrophes and escapes physical line breaks, backslashes, double quotes and specifiers', () => {
    const plan = planFor('http://user:pa\'ss@proxy:3128\nsecond\rthird\t\\"%$');
    expect(plan.content).toContain(
      'Environment="SYNTHETIC_VALUE=http://user:pa\'ss@proxy:3128\\x0asecond\\x0dthird\\x09\\\\\\"%%$"',
    );
    expect(plan.content).not.toContain('\nsecond');
    expect(plan.captured).toEqual(['SYNTHETIC_VALUE']);
  });

  it('rejects NUL instead of installing a value no process can receive', () => {
    expect(() => planFor('before\0after')).toThrow(
      'environment values cannot contain NUL',
    );
  });

  it
    .skipIf(!hasSystemd)
    .each([
      "http://user:pa'ss@proxy:3128",
      'line1\nline2\rline3\tend',
      ' leading and trailing ',
      'backslash\\ and "double" and \'single\' quotes %40 $VAR',
      'control\x01\x07\b\f\v\x1b\x7f unicode 证书',
      'unicode controls\u0085\u009f',
    ])('preserves %j through the actual systemd parser', (value) => {
    const plan = planFor(value);
    const file = path.join(root, 'escaped.service');
    writeFileSync(file, plan.content, { mode: 0o600 });
    // verify can exit zero while ignoring a malformed Environment=. Check the diagnostics and decoded dump too.
    const result = spawnSync('systemd-analyze', ['verify', '--man=no', file], {
      encoding: 'utf8',
      env: { ...process.env, SYSTEMD_LOG_LEVEL: 'debug' },
    });
    const diagnostics = result.stderr
      .split('\n')
      .filter((line) => line.startsWith(file))
      .join('\n');
    expect(diagnostics).not.toMatch(/Invalid|ignoring|Missing|Unknown escape/u);
    expect(result.stdout).toContain(`Environment: SYNTHETIC_VALUE=${value}\n`);
    expect(result.status).toBe(0);
  });
});
