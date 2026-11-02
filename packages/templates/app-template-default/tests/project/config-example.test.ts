import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';

import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppConfig } from '@nocobase/app-server/config';
import { describe, expect, it } from 'vitest';

// `pnpm nocobase config init` writes config.yml from this file: it replaces the instruction on the first line with
// its own header and fills the placeholder key of the live `secrets` section, keeping everything else verbatim. These
// are the parts of the example it relies on.
describe('config.example.yml', () => {
  const read = () =>
    readFile(new URL('../../config.example.yml', import.meta.url), 'utf8');

  it('opens with the instruction config init replaces', async () => {
    expect((await read()).split('\n')[0]).toMatch(
      /^# Copy this file to config\.yml\b/u,
    );
  });

  it('carries a live secrets section whose first key is a placeholder', async () => {
    expect(await read()).toContain(
      [
        'secrets:',
        '  keys:',
        '    - version: 1',
        '      key: replace-with-a-unique-secret',
      ].join('\n'),
    );
  });
  it('keeps Knowledge opt-in and ships a parseable SQLite and PostgreSQL instance example', async () => {
    const active = new AppConfig().loadFile(
      fileURLToPath(new URL('../../config.example.yml', import.meta.url)),
    );
    await active.loadAll();
    expect(active.get('knowledge')).toBeUndefined();
    const example = (await read()).match(
      /^# knowledge:\n(?:#(?: {2,}.*)?\n)*/m,
    )?.[0];
    expect(example).toBeDefined();
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'knowledge-config-example-'),
    );
    try {
      const file = path.join(directory, 'config.yml');
      await writeFile(file, example!.replace(/^# ?/gm, ''));
      const config = new AppConfig().loadFile(file);
      await config.loadAll();
      expect(config.get('knowledge.indexing.local')).toEqual({
        name: 'Local semantic index',
        type: 'sqlite-vec',
        file: 'knowledge/vectors.sqlite',
      });
      expect(config.get('knowledge.indexing.shared')).toEqual({
        name: 'Shared PostgreSQL index',
        type: 'pgvector',
        url: 'postgresql://kb_user:replace-with-the-password@127.0.0.1:5432/knowledge',
        schema: 'knowledge_index',
        table: 'knowledge',
      });
      expect(config.get('knowledge.jobs')).toBeUndefined();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
