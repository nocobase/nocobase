import { existsSync } from 'node:fs';
import { expect, it } from 'vitest';
import manifest from '../../package.json' with { type: 'json' };

it('owns an independent App without a nested installation workspace', () => {
  expect(manifest.private).toBe(true);
  expect(manifest.nocobase.templateKind).toBe('app');
  expect(manifest.name).toBeTruthy();
  for (const file of ['pnpm-workspace.yaml', 'pnpm-lock.yaml']) {
    expect(existsSync(new URL('../../' + file, import.meta.url))).toBe(false);
  }
});
