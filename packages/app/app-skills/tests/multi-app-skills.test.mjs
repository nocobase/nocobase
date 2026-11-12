import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const root = fileURLToPath(new URL('../skills/', import.meta.url));

it('leaves commercial multi-app guidance to its owning plugin', async () => {
  const names = await readdir(root);
  expect(
    names.filter((name) => name.startsWith('nocobase-multi-app-')),
  ).toEqual([]);
  const entry = await readFile(
    `${root}/nocobase-app-development/SKILL.md`,
    'utf8',
  );
  expect(entry).not.toMatch(/\.\.\/nocobase-multi-app-/u);
  expect(entry).toContain('nocobase-app-upgrade');
});
