import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectRepository, fileKind, inventoryDelta, parseNumstat, safeRemote, testDeclarations } from '../runner/collector.js';

describe('deterministic collector', () => {
  it('preserves unusual names, renames and binary counts', () => {
    expect(parseNumstat('2\t1\tsrc/a\tb.ts\0-\t-\timage.png\00\t0\t\0old.test.ts\0new.test.ts\0')).toEqual([
      { path: 'src/a\tb.ts', previousPath: null, kind: 'source', additions: 2, deletions: 1 },
      { path: 'image.png', previousPath: null, kind: 'configuration', additions: null, deletions: null },
      { path: 'new.test.ts', previousPath: 'old.test.ts', kind: 'test', additions: 0, deletions: 0 },
    ]);
  });
  it('excludes generated files from source figures', () => {
    expect(fileKind('pnpm-lock.yaml')).toBe('generated');
    expect(fileKind('src/a.test.ts')).toBe('test');
    expect(fileKind('docs/architecture.md')).toBe('documentation');
    expect(fileKind('src/a.ts')).toBe('source');
  });
  it('does not count commented examples or strings as tests', () => {
    expect(testDeclarations(`// it('not a test', () => {});\nconst text = "test('also not a test')";\nit('one', () => {}); test.skip('two', () => {}); /* test('no') */`)).toEqual(['one', 'two']);
    expect(testDeclarations(`test.each([1,2])('dynamic', () => {});`)).toEqual([]);
  });
  it('counts additions and removals separately, including duplicate titles', () => {
    expect(inventoryDelta(['a', 'a', 'b'], ['a', 'c', 'd'])).toEqual({ added: 2, removed: 2 });
  });
  it('accepts runner-configured SSH/HTTPS without accepting embedded secrets or executable Git protocols', () => {
    expect(safeRemote('git@github.com:nocobase/nocobase.git')).toBe(true);
    expect(safeRemote('ssh://git@example.com/repository.git')).toBe(true);
    expect(safeRemote('https://github.com/nocobase/nocobase.git')).toBe(true);
    for (const remote of ['ext::sh -c whoami', 'file:///private/repo', '--upload-pack=evil', 'https://user:secret@example.com/repo']) expect(safeRemote(remote)).toBe(false);
  });
  it('collects a real Git history without executing project code', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'project-report-'));
    const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_DATE: '2026-10-14T12:00:00Z', GIT_COMMITTER_DATE: '2026-10-14T12:00:00Z' } }).trim();
    try {
      git('init', '-b', 'main'); git('config', 'user.name', 'Report test'); git('config', 'user.email', 'report@example.test');
      await writeFile(join(cwd, 'a.ts'), 'export const value = 1;\n');
      await writeFile(join(cwd, 'a.test.ts'), "test('works', () => {});\n");
      git('add', '.'); git('commit', '-m', 'feat: introduce a value');
      const { result } = await collectRepository(cwd, { resourceId: 'repo', url: 'https://example.test/repo.git', ref: 'main' }, { start: '2026-10-14T00:00:00Z', end: '2026-10-15T00:00:00Z' });
      expect(result.state).toBe('complete');
      expect(result.files.find((file) => file.path === 'a.ts')?.additions).toBe(1);
      expect(result.tests).toMatchObject({ quality: 'estimated', added: 1, removed: 0 });
      const unchanged = await collectRepository(cwd, { resourceId: 'repo', url: 'https://example.test/repo.git', ref: 'main' }, { start: '2026-10-15T00:00:00Z', end: '2026-10-16T00:00:00Z' });
      expect(unchanged.result.files).toEqual([]);
      expect(unchanged.result.baseSha).toBe(unchanged.result.headSha);
    } finally { await rm(cwd, { recursive: true, force: true }); }
  });
});
