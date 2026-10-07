// @vitest-environment node
/**
 * The brief and turn prompt an agent runs with: any change to the wording shows here. The task and context layers, and
 * the subject's own rules, are what the application writes (Acme's are checked in `acme/tests/agents/brief.test.ts`);
 * here they are a document's.
 */
import type { RunInput } from '@nocobase/agent-protocol';
import { describe, expect, it } from 'vitest';

import {
  WORKSPACE_INIT_PLACEHOLDER,
  WORKSPACE_NOTES_PLACEHOLDER,
} from '@nocobase/agent-protocol';

import {
  AGENT_LAYER_PREFIX,
  annotatePlaceholders,
  joinBrief,
  renderBrief,
  renderTurnPrompt,
} from '../server/core/brief/index.js';
import { payloadDirs, type SubjectDir } from '../server/core/runs/index.js';

const TASK = [
  'Document DOC-12: Release notes for 3.2',
  '',
  'You have been given this document to write. Do the work it asks for.',
  '',
  'When you finish, say what you wrote and what is left.',
].join('\n');

const CONTEXT = [
  '# DOC-12 Release notes for 3.2',
  '',
  '- Owner: Alice',
  '- Due: 2026-10-15',
  '',
  '## Notes',
  '',
  'Cover the new export formats.',
  '',
  '## Recent remarks',
  '',
  '### Bob at 2026-10-01T08:00:00.000Z',
  '',
  '导出按钮的说明要写清楚。',
].join('\n');

/** A subject domain's own rules: how it wants progress reported. */
const GUIDANCE = {
  rules: [
    'Report progress as remarks on document DOC-12 (`acme document remark add DOC-12 --content-file <path>`).',
    'When you are done, say so in a remark and end your turn.',
  ],
  whenBlocked:
    'If you cannot get the environment working, say what is missing in a remark on DOC-12 and end your turn.',
};

/** The working directories of the subject: a git repository, then a directory on one runner. */
const DIRS: SubjectDir[] = [
  {
    kind: 'repo',
    url: 'https://example.com/acme/web.git',
    defaultBranch: 'develop',
    branch: 'agent/DOC-12',
    path: 'web',
    scopeId: 'res-1',
    name: 'web',
    initPrompt: 'Run pnpm install, then copy .env.example to .env.',
  },
  {
    kind: 'directory',
    path: '/srv/data',
    runnerId: 'runner-1',
    scopeId: 'res-2',
    name: 'data',
  },
];

const inputs: RunInput[] = [
  {
    id: 'in-1',
    type: 'signal',
    at: '2026-10-01T09:00:00.000Z',
    actor: { kind: 'user', id: 'alice', name: 'Alice' },
    text: 'Alice gave you DOC-12 (Release notes for 3.2) to work on.',
    payload: { trigger: 'assigned' },
  },
  {
    id: 'in-2',
    type: 'comment',
    at: '2026-10-01T09:05:00.000Z',
    actor: { kind: 'user', id: 'bob', name: 'Bob' },
    text: 'Mention the CSV changes.',
    payload: { trigger: 'remark' },
  },
];

describe('brief', () => {
  it('renders the four layers', () => {
    const brief = renderBrief({
      cli: 'acme',
      appName: 'Acme',
      agentName: 'Coder',
      subject: { noun: 'document', key: 'DOC-12' },
      task: TASK,
      context: CONTEXT,
      instructions: 'Prefer short sentences.\nLink every ticket you mention.',
      dirs: payloadDirs(DIRS),
      guidance: GUIDANCE,
      skills: [
        {
          slug: 'pr-etiquette',
          name: 'PR etiquette',
          description:
            'How this team titles branches, commits and pull requests.',
        },
      ],
    });
    expect(brief.agent.startsWith(AGENT_LAYER_PREFIX)).toBe(true);
    expect(brief).toMatchSnapshot();
  });

  it('leaves the agent layer empty without instructions', () => {
    expect(
      renderBrief({
        cli: 'acme',
        appName: 'Acme',
        agentName: 'Coder',
        subject: { noun: 'document', key: 'DOC-12' },
        task: 'Task',
        context: 'Context',
        instructions: '   ',
      }).agent,
    ).toBe('');
  });

  it('tells an agent to check the environment the way each directory says', () => {
    const { system } = renderBrief({
      cli: 'acme',
      appName: 'Acme',
      agentName: 'Coder',
      subject: { noun: 'document', key: 'DOC-12' },
      task: 'Task',
      context: 'Context',
      instructions: null,
    });
    expect(system).toContain('AGENTS.md, CLAUDE.md or README');
    // Without the subject's own rules, the agent reports in its last message.
    expect(system).toContain(
      '- If you cannot get the environment working, say exactly what is missing and end your turn instead of guessing.',
    );
    expect(system).toContain(
      '- Report what you did and what is left in your last message',
    );
    expect(system).toContain('You start in an empty working directory');
    // The runner fills these in: its notes, then the init prompts of the directories it prepared fresh.
    expect(system.indexOf(WORKSPACE_NOTES_PLACEHOLDER)).toBeGreaterThan(0);
    expect(system.indexOf(WORKSPACE_INIT_PLACEHOLDER)).toBeGreaterThan(
      system.indexOf('Before you start:'),
    );
    expect(system).not.toContain('<available_skills>');
    expect(
      annotatePlaceholders(
        joinBrief(
          renderBrief({
            cli: 'acme',
            appName: 'Acme',
            agentName: 'Coder',
            subject: { noun: 'document', key: 'DOC-12' },
            task: 'Task',
            context: 'Context',
            instructions: null,
          }),
        ),
      ),
    ).not.toContain('{{runner.');
  });

  it('keeps what only the server uses on the server', () => {
    expect(payloadDirs(DIRS)[1]).toEqual({
      kind: 'directory',
      path: '/srv/data',
      name: 'data',
    });
  });

  it('renders the turn prompt from the input, oldest first', () => {
    const subject = { noun: 'document', key: 'DOC-12' };
    expect(renderTurnPrompt(inputs, { subject })).toMatchSnapshot();
    expect(renderTurnPrompt([], { subject, cli: 'acme' })).toBe(
      'Continue the work on document DOC-12. Read the context first (`acme run context`).',
    );
  });
});
