import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

test('the carrier hook requires this repository, preview identity and explicit activation', async () => {
  const originalCwd = process.cwd();
  const original = { ...process.env };
  const app = fileURLToPath(
    new URL('../../packages/templates/app-template-examples', import.meta.url),
  );
  const module = new URL(
    '../../packages/templates/app-template-examples/cli/preview-acceptance.ts',
    import.meta.url,
  );
  const root = await mkdtemp(path.join(tmpdir(), 'hook-generated-'));
  try {
    const cases = [
      [{}, false],
      [{ ENVIRONMENT: 'preview', APP_ID: 'nocobase-v3-pr-11186' }, false],
      [
        {
          ENVIRONMENT: 'preview',
          APP_ID: 'other',
          NOCOBASE_ACCEPTANCE_BUILD: '1',
        },
        false,
      ],
      [
        {
          ENVIRONMENT: 'acceptance-child',
          APP_ID: 'nocobase-v3-pr-11186',
          NOCOBASE_ACCEPTANCE_BUILD: '1',
        },
        false,
      ],
      [
        {
          ENVIRONMENT: 'preview',
          APP_ID: 'nocobase-v3-pr-11186',
          NOCOBASE_ACCEPTANCE_BUILD: '1',
        },
        true,
      ],
    ];
    const { acceptancePlugins } = await import(module.href);
    for (const [env, expected] of cases) {
      const plugins = acceptancePlugins(app, env);
      assert.equal(
        Boolean(plugins[0]?.buildHooks.afterBuild?.length),
        expected,
      );
    }
    const generated = path.join(root, 'app-template-examples');
    await mkdir(generated);
    assert.equal(acceptancePlugins(generated, cases.at(-1)[0]).length, 0);
  } finally {
    process.chdir(originalCwd);
    for (const key of ['ENVIRONMENT', 'APP_ID', 'NOCOBASE_ACCEPTANCE_BUILD']) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
    await rm(root, { recursive: true, force: true });
  }
});
