// Changed files (`changed` on a manifest parameter): the files of a mount the agent changed, found from any directory
// below it, compared with the mount's manifest by SHA-256.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { changedFiles, type ChangedFilesSpec } from '../src/dynamic/files.ts';
import { removeDir, tempDir } from './helpers.ts';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');

const spec: ChangedFilesSpec = {
  dir: '.nocobase-runner/knowledge',
  manifest: '.manifest.json',
  maxBytes: 1000,
  maxFiles: 2,
  accept: ['.md'],
};

const changed = (cwd: string) => changedFiles(spec, 'changed', cwd);

describe('changed files', () => {
  let work: string;
  afterEach(() => removeDir(work));

  function mount(
    files: Record<string, string>,
    listed: Record<string, string>,
  ) {
    work = tempDir('acme-changed-');
    const root = path.join(work, '.nocobase-runner', 'knowledge');
    for (const [name, content] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
      writeFileSync(path.join(root, name), content);
    }
    writeFileSync(
      path.join(root, '.manifest.json'),
      JSON.stringify(
        Object.entries(listed).map(([name, content]) => ({
          path: name,
          hash: sha(content),
          docId: name,
          version: 1,
        })),
      ),
    );
    const repo = path.join(work, 'repo', 'src');
    mkdirSync(repo, { recursive: true });
    return repo;
  }

  it('sends the changed and new files by their paths, from a directory below the mount', async () => {
    const cwd = mount(
      {
        'INDEX.md': '# Index',
        'project/setup.md': '# Setup, edited',
        'project/new.md': '# New',
        'system/rules.md': '# Rules',
        'project/notes.txt': 'not markdown',
      },
      {
        'INDEX.md': '# Index',
        'project/setup.md': '# Setup',
        'system/rules.md': '# Rules',
      },
    );
    expect((await changed(cwd)).map((file) => file.name)).toEqual([
      'project/new.md',
      'project/setup.md',
    ]);
  });

  it('refuses when nothing changed, too much changed, or there is no mount', async () => {
    const same = mount({ 'a.md': 'A' }, { 'a.md': 'A' });
    await expect(changed(same)).rejects.toThrow(/nothing changed/u);
    removeDir(work);
    const many = mount({ 'a.md': '1', 'b.md': '2', 'c.md': '3' }, {});
    await expect(changed(many)).rejects.toThrow(/3 files changed/u);
    removeDir(work);
    work = tempDir('acme-changed-none-');
    await expect(changed(work)).rejects.toThrow(
      /no \.nocobase-runner\/knowledge directory/u,
    );
  });
});
