import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { expect, it } from 'vitest';
import manifest from '../../package.json' with { type: 'json' };

it('declares licensed registry plugins without embedding their source', async () => {
  for (const name of ['multi-app', 'identity-provider', 'platform-sso']) {
    const packageName = '@nocobase/app-plugin-' + name;
    expect(
      manifest.dependencies[packageName as keyof typeof manifest.dependencies],
    ).not.toMatch(/^(?:workspace:|catalog:|file:|link:)/u);
    const plugin = JSON.parse(
      await readFile(require.resolve(packageName + '/package.json'), 'utf8'),
    );
    expect(plugin.name).toBe(packageName);
    expect(plugin.private).not.toBe(true);
    expect(plugin.files).toContain('skills');
  }
  expect('build:templates' in manifest.scripts).toBe(false);
  const registration = await readFile(
    new URL('../../cli/plugins.ts', import.meta.url),
    'utf8',
  );
  expect(registration).not.toContain('afterBuild');
});
