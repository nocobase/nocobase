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
});
