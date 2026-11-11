import { existsSync } from 'node:fs';
import { expect, it } from 'vitest';
import manifest from '../../package.json' with { type: 'json' };

it('owns root Main and shares one installation workspace with its independent child', () => {
  expect(manifest.private).toBe(true);
  expect(manifest.nocobase.templateKind).toBe('app');
  expect(manifest.nocobase.appDirectories).toEqual(['.', 'apps/sub']);
  expect(manifest.name).toBeTruthy();
  expect(
    existsSync(new URL('../../pnpm-workspace.yaml', import.meta.url)),
  ).toBe(true);
  expect(
    existsSync(new URL('../../apps/sub/package.json', import.meta.url)),
  ).toBe(true);
  for (const file of ['pnpm-workspace.yaml', 'pnpm-lock.yaml']) {
    expect(existsSync(new URL('../../apps/sub/' + file, import.meta.url))).toBe(
      false,
    );
  }
});
