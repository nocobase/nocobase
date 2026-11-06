import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { parse } from 'yaml';

it('publishes a Skill with discoverable YAML metadata', async () => {
  const name = 'nocobase-app-plugin-demo-mode';
  const source = await readFile(
    new URL(`../../skills/${name}/SKILL.md`, import.meta.url),
    'utf8',
  );
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(source);
  expect(frontmatter).not.toBeNull();
  const metadata = parse(frontmatter![1]);
  expect(metadata).toMatchObject({ name, description: expect.any(String) });
  expect(metadata.description.trim()).not.toBe('');
});
