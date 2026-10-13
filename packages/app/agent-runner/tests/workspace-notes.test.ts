import { describe, expect, it } from 'vitest';

import { workspaceNotes } from '../src/agent/worker.ts';

describe('workspaceNotes', () => {
  const base = {
    workDir: '/work/PM-1',
    cwd: '/work/PM-1',
    dirs: [],
    cli: 'acme',
    skillsDir: '/work/PM-1/.nocobase-runner/plugin/skills',
  };

  it('tells Claude Code the plugin prefix its Skill tool needs', () => {
    expect(workspaceNotes({ ...base, tool: 'claude' })).toContain(
      '`nocobase-runner:<skill name>`',
    );
  });

  it('names no prefix for other tools, or without skills', () => {
    expect(workspaceNotes({ ...base, tool: 'codex' })).not.toContain(
      'nocobase-runner:',
    );
    const { skillsDir: _skillsDir, ...noSkills } = base;
    expect(workspaceNotes({ ...noSkills, tool: 'claude' })).not.toContain(
      'nocobase-runner:',
    );
  });
  it('explains first delivery only when the runner verified empty initialization', () => {
    const repo = {
      url: 'https://example.com/app.git',
      branch: 'main',
      defaultBranch: 'main',
      primary: true,
      dir: '/work/PM-1/app',
      cache: '/cache/app.git',
      gitDir: '/work/PM-1/app/.git',
      submodules: [],
    };
    const dir = {
      kind: 'repo' as const,
      dir: repo.dir,
      primary: true,
      fresh: true,
      key: 'repo',
      repo,
    };
    expect(workspaceNotes({ ...base, dirs: [dir] })).not.toContain(
      'has no refs',
    );
    const notes = workspaceNotes({
      ...base,
      dirs: [{ ...dir, repo: { ...repo, initializing: true } }],
    });
    expect(notes).toContain('has no refs');
    expect(notes).toContain('first delivery needs no pull request');
    expect(notes).toContain('not overwrite a branch created by someone else');
    expect(notes).toContain('Preserve existing files and commits on a retry');
  });
});
