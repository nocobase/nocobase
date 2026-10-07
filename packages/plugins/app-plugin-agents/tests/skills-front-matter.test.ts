import { afterEach, describe, expect, it } from 'vitest';

import {
  composeSkillMarkdown,
  parseSkillMarkdown,
  skillFilePathProblem,
} from '../shared/skills.js';
import { createHarness, skillMd, type Harness } from './harness.js';

const ADMIN = ['agents.agents/manage'];

const reasons = (markdown: string) =>
  parseSkillMarkdown(markdown).problems.map(
    (item) => `${item.field}:${item.reason}`,
  );

describe('SKILL.md front matter', () => {
  it('reads the fields the specification names and keeps the body', () => {
    const parsed = parseSkillMarkdown(
      [
        '---',
        'name: pdf-tools',
        'description: >',
        '  Extract text from PDFs.',
        'license: Apache-2.0',
        'compatibility: Needs network access',
        'metadata:',
        '  author: team',
        'allowed-tools: Bash(git:*) Read',
        'x-custom: kept',
        '---',
        '# PDF tools',
      ].join('\n'),
    );
    expect(parsed.problems).toEqual([]);
    expect(parsed.frontMatter).toEqual({
      name: 'pdf-tools',
      description: 'Extract text from PDFs.',
      license: 'Apache-2.0',
      compatibility: 'Needs network access',
      metadata: { author: 'team' },
      allowedTools: 'Bash(git:*) Read',
    });
    expect(parsed.body).toBe('# PDF tools');
  });

  it('names each problem by its field and reason', () => {
    expect(reasons('# No front matter')).toEqual(['frontMatter:missing']);
    expect(reasons('---\nname: [unclosed\n---\n')).toEqual([
      'frontMatter:yaml',
    ]);
    expect(reasons('---\n- a\n---\n')).toEqual(['frontMatter:notMapping']);
    expect(reasons('---\n---\n')).toEqual([
      'name:required',
      'description:required',
    ]);
    for (const name of ['PDF', '-pdf', 'pdf-', 'pdf--tools', 'pdf_tools'])
      expect(reasons(`---\nname: ${name}\ndescription: x\n---\n`)).toEqual([
        'name:pattern',
      ]);
    expect(
      reasons(`---\nname: ${'a'.repeat(65)}\ndescription: x\n---\n`),
    ).toEqual(['name:tooLong']);
    expect(reasons('---\nname: 12\ndescription: x\n---\n')).toEqual([
      'name:type',
    ]);
    expect(
      reasons(`---\nname: a\ndescription: ${'d'.repeat(1025)}\n---\n`),
    ).toEqual(['description:tooLong']);
    expect(
      reasons(
        `---\nname: a\ndescription: x\ncompatibility: ${'c'.repeat(501)}\nmetadata: [1]\nlicense: ''\n---\n`,
      ),
    ).toEqual(['license:empty', 'compatibility:tooLong', 'metadata:type']);
  });

  it('composes front matter that parses back', () => {
    const markdown = composeSkillMarkdown(
      { name: 'a', description: 'Uses: colons and "quotes".' },
      '\n# A\n',
    );
    expect(parseSkillMarkdown(markdown).frontMatter).toEqual({
      name: 'a',
      description: 'Uses: colons and "quotes".',
    });
    expect(parseSkillMarkdown(markdown).body).toBe('\n# A\n');
  });

  it('refuses a path that is a folder of another file, or under one', () => {
    expect(skillFilePathProblem('scripts', ['scripts/run.sh'])).toBe(
      'conflict',
    );
    expect(skillFilePathProblem('notes.md/x', ['notes.md'])).toBe('conflict');
    expect(skillFilePathProblem('a/ b.md')).toBe('invalid');
    expect(skillFilePathProblem('references/guide.md')).toBeNull();
  });
});

describe('skills named by their front matter', () => {
  let h: Harness | undefined;
  afterEach(async () => {
    await h?.close();
    h = undefined;
  });

  it('refuses an invalid front matter with each problem, and a name another skill has', async () => {
    h = await createHarness();
    const create = (content: string) =>
      h!.request('POST', '/agents/skills', {
        user: 'alice',
        can: ADMIN,
        body: { content },
      });
    const invalid = await create('---\nname: Bad Name\n---\n');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.metadata).toMatchObject({
      field: 'name',
      reason: 'pattern',
      problems: [
        expect.objectContaining({ field: 'name', reason: 'pattern' }),
        expect.objectContaining({ field: 'description', reason: 'required' }),
      ],
    });
    expect((await create(skillMd('review', 'How we review.'))).status).toBe(
      201,
    );
    const taken = await create(skillMd('review', 'Again.'));
    expect(taken.status).toBe(400);
    expect(taken.body.error.metadata).toMatchObject({
      field: 'name',
      reason: 'taken',
    });
  });

  it('renames the skill with its front matter, and a run given it still reads its version', async () => {
    h = await createHarness();
    const skill = await h.services.skills.create('alice', {
      content: skillMd('review', 'How we review.'),
    });
    await h.services.skills.create('alice', {
      content: skillMd('deploy', 'How we deploy.'),
    });
    const given = await h.services.skills.get(skill.id);
    const save = (name: string, expectedRevision: number) =>
      h!.request('PATCH', `/agents/skills/${skill.id}`, {
        user: 'alice',
        can: ADMIN,
        body: {
          content: skillMd(name, 'How we review code.'),
          files: [],
          expectedRevision,
        },
      });
    expect((await save('deploy', 1)).body.error.metadata).toMatchObject({
      reason: 'taken',
    });
    const renamed = await save('code-review', 1);
    expect(renamed.body.data).toMatchObject({
      slug: 'code-review',
      name: 'code-review',
      description: 'How we review code.',
      version: 2,
    });
    // An online run given version 1 under its old name reads it by hash.
    const versions = await h.services.skills.versions(skill.id);
    expect(versions.map((item) => item.name)).toEqual([
      'code-review',
      'review',
    ]);
    const hash = await h.services.tx.run(async ({ conn }) => {
      const rows = await conn
        .repository<{
          version: number;
          contentHash: string;
        }>('agSkillVersions')
        .findMany({ filter: { skillId: skill.id } });
      return rows.find((row) => Number(row.version) === 1)!.contentHash;
    });
    const snapshot = await h.services.skills.snapshot('review', hash);
    expect(snapshot.markdown).toBe(given.content);
  });
});
