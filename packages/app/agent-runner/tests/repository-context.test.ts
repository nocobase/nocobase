import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { repositoryContext } from '../src/agent/repository-context.ts';

it('loads current repository instructions and discovers current repository skills after changing worktree paths', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'repository-context-'));
  try {
    for (const name of ['a', 'b']) {
      const dir = path.join(root, name);
      await mkdir(path.join(dir, '.agents/skills/local'), { recursive: true });
      await writeFile(
        path.join(dir, 'AGENTS.md'),
        `${name}: agents instructions`,
      );
      await writeFile(
        path.join(dir, 'CLAUDE.md'),
        `${name}: Claude instructions`,
      );
      await writeFile(
        path.join(dir, '.agents/skills/local/SKILL.md'),
        'Read this when relevant',
      );
    }
    const context = await repositoryContext([path.join(root, 'b')]);
    expect(context).toContain('b: agents instructions');
    expect(context).toContain('b: Claude instructions');
    expect(context).toContain(
      path.join(root, 'b/.agents/skills/local/SKILL.md'),
    );
    expect(context).not.toContain('a:');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
