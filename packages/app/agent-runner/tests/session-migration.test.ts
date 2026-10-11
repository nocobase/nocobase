import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { migrateLegacySessions } from '../src/agent/session-migration.ts';

async function fixture(tool = 'codex') {
  const root = await mkdtemp(path.join(tmpdir(), 'session-migration-'));
  const runner = path.join(root, '.nocobase-runner');
  const home = path.join(root, 'current-home');
  const source = path.join(
    runner,
    'home',
    tool === 'codex' ? '.codex/sessions' : '.claude/projects',
  );
  const target =
    tool === 'codex'
      ? path.join(runner, 'codex-home/sessions')
      : path.join(home, '.claude/projects');
  await mkdir(source, { recursive: true });
  return { root, runner, home, source, target };
}

it.each(['codex', 'claude'])(
  'copies %s history and subdirectories once, preserving source and credentials',
  async (tool) => {
    const f = await fixture(tool);
    await mkdir(path.join(f.source, 'project/subagents'), { recursive: true });
    await writeFile(
      path.join(f.source, 'project/subagents/history.jsonl'),
      'history',
    );
    await writeFile(path.join(f.source, '../credentials.json'), 'do not copy');
    expect(await migrateLegacySessions(f.runner, tool, f.home)).toMatchObject({
      copied: 1,
      failures: 0,
    });
    expect(
      await readFile(
        path.join(f.target, 'project/subagents/history.jsonl'),
        'utf8',
      ),
    ).toBe('history');
    expect(
      await readFile(
        path.join(f.source, 'project/subagents/history.jsonl'),
        'utf8',
      ),
    ).toBe('history');
    await expect(
      readFile(path.join(f.target, '../credentials.json')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await rm(f.target, { recursive: true });
    expect(await migrateLegacySessions(f.runner, tool, f.home)).toMatchObject({
      alreadyAttempted: true,
    });
    await expect(
      readFile(path.join(f.target, 'project/subagents/history.jsonl')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  },
);

it('preserves target conflicts and refuses source and target links', async () => {
  const f = await fixture();
  await mkdir(f.target, { recursive: true });
  await writeFile(path.join(f.source, 'same.jsonl'), 'old');
  await writeFile(path.join(f.target, 'same.jsonl'), 'current');
  await writeFile(path.join(f.root, 'external'), 'outside');
  await symlink(
    path.join(f.root, 'external'),
    path.join(f.source, 'link.jsonl'),
  );
  await mkdir(path.join(f.source, 'linked-dir'));
  await writeFile(path.join(f.source, 'linked-dir/history.jsonl'), 'old');
  await symlink(f.root, path.join(f.target, 'linked-dir'));
  expect(await migrateLegacySessions(f.runner, 'codex', f.home)).toMatchObject({
    conflicts: 1,
    skipped: 1,
    failures: 1,
  });
  expect(await readFile(path.join(f.target, 'same.jsonl'), 'utf8')).toBe(
    'current',
  );
  await expect(
    readFile(path.join(f.root, 'history.jsonl')),
  ).rejects.toMatchObject({ code: 'ENOENT' });
});

it('serializes concurrent attempts and publishes complete files', async () => {
  const f = await fixture();
  await writeFile(
    path.join(f.source, 'history.jsonl'),
    'history'.repeat(10000),
  );
  const results = await Promise.all([
    migrateLegacySessions(f.runner, 'codex', f.home),
    migrateLegacySessions(f.runner, 'codex', f.home),
  ]);
  expect(results.filter((r) => r?.alreadyAttempted)).toHaveLength(1);
  expect(await readFile(path.join(f.target, 'history.jsonl'), 'utf8')).toBe(
    'history'.repeat(10000),
  );
});

it.skipIf(process.getuid?.() === 0)(
  'continues after permission failures and does not repeat a failed migration',
  async () => {
    const f = await fixture();
    await mkdir(f.target, { recursive: true });
    await writeFile(path.join(f.source, 'history.jsonl'), 'history');
    await chmod(f.target, 0o500);
    try {
      expect(
        await migrateLegacySessions(f.runner, 'codex', f.home),
      ).toMatchObject({ failures: 1, reason: 'EACCES' });
    } finally {
      await chmod(f.target, 0o700);
    }
    expect(
      await migrateLegacySessions(f.runner, 'codex', f.home),
    ).toMatchObject({ alreadyAttempted: true });
    await expect(
      readFile(path.join(f.target, 'history.jsonl')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  },
);

it('records empty sources and failed attempts without throwing', async () => {
  const f = await fixture();
  expect(await migrateLegacySessions(f.runner, 'codex', f.home)).toMatchObject({
    copied: 0,
    failures: 0,
  });
  await symlink(f.root, path.join(f.runner, 'home/.claude'));
  expect(await migrateLegacySessions(f.runner, 'claude', f.home)).toMatchObject(
    { failures: 1 },
  );
  expect(await migrateLegacySessions(f.runner, 'claude', f.home)).toMatchObject(
    { alreadyAttempted: true },
  );
  expect(await migrateLegacySessions(f.runner, 'pi', f.home)).toBeUndefined();
});
