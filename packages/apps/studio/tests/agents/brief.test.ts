// @vitest-environment node
/**
 * The task and context layers of an issue's brief, and its working directories, rendered from a fixed issue: any change
 * to the wording shows here. The agents plugin's own test renders the whole brief from exactly these layers.
 */
import type { RunInput } from '@nocobase/agent-protocol';
import type { IssueContext } from '@nocobase/app-plugin-projects/server/tokens';
import { describe, expect, it } from 'vitest';

import {
  dirsOf,
  mayInitializeEmptyRepository,
  EMPTY_REPOSITORY_NOTE,
  issueGuidance,
  renderIssueContext,
  renderTask,
} from '../../server/agents/issue-subject.js';

const context: IssueContext = {
  id: 'i-1',
  identifier: 'PM-12',
  title: 'Fix login on Safari',
  description: 'Signing in fails on Safari 17.\n\nSee the attached HAR.',
  status: { key: 'in_progress', name: 'In progress', category: 'started' },
  statuses: [
    { key: 'backlog', name: 'Backlog', category: 'unstarted' },
    { key: 'todo', name: 'Todo', category: 'unstarted' },
    { key: 'in_progress', name: 'In progress', category: 'started' },
    { key: 'in_review', name: 'In review', category: 'started' },
    { key: 'done', name: 'Done', category: 'done' },
  ],
  allowedTransitions: ['in_progress', 'in_review'],
  priority: 'high',
  labels: ['bug', 'frontend'],
  owner: { id: 'alice', name: 'Alice' },
  executor: { type: 'agent', id: 'a-1', name: 'Coder' },
  project: {
    id: 'p-1',
    name: 'Web',
    description: null,
    repos: [
      {
        id: 'res-1',
        type: 'gitRepo',
        url: 'https://example.com/acme/web.git',
        defaultRef: 'develop',
        runnerId: null,
        path: null,
        label: 'web',
        initPrompt: 'Run pnpm install, then copy .env.example to .env.',
      },
      {
        id: 'res-2',
        type: 'directory',
        url: null,
        defaultRef: null,
        runnerId: 'runner-1',
        path: '/srv/data',
        label: 'data',
        initPrompt: null,
      },
    ],
  },
  parent: {
    id: 'i-0',
    identifier: 'PM-10',
    title: 'Login reliability',
    status: 'in_progress',
  },
  children: [
    { id: 'i-2', identifier: 'PM-13', title: 'Add a test', status: 'todo' },
  ],
  checklist: {
    statusKey: 'in_progress',
    complete: false,
    items: [
      { key: 'repro', label: 'Reproduce', required: true, checked: true },
      { key: 'test', label: 'Add a test', required: false, checked: false },
    ],
  },
  pendingApproval: null,
  attachments: [
    {
      id: '0b9a3c52-7d1e-4f3a-9c55-2f1d8e6a4b10',
      filename: 'safari.har',
      mimeType: 'application/json',
      size: 48213,
    },
  ],
  comments: [
    {
      id: 'c-1',
      parentId: null,
      author: { type: 'user', id: 'bob', name: 'Bob' },
      content: '登录按钮点了没反应。',
      createdAt: '2026-10-01T08:00:00.000Z',
      attachments: [
        {
          id: '5c1f0e2a-3b4d-4e6f-8a9b-0c1d2e3f4a5b',
          filename: '截图.png',
          mimeType: 'image/png',
          size: 20480,
        },
      ],
    },
  ],
  dueDate: '2026-10-15',
  url: '/issues/PM-12',
};

const inputs: RunInput[] = [
  {
    id: 'in-1',
    type: 'signal',
    at: '2026-10-01T09:00:00.000Z',
    actor: { kind: 'user', id: 'alice', name: 'Alice' },
    text: 'Alice gave you PM-12 (Fix login on Safari) to work on.',
    payload: { trigger: 'assigned' },
  },
  {
    id: 'in-2',
    type: 'comment',
    at: '2026-10-01T09:05:00.000Z',
    actor: { kind: 'user', id: 'bob', name: 'Bob' },
    text: 'Use the v2 session API.',
    payload: { trigger: 'comment', commentId: 'c-2' },
  },
];

describe('issue brief', () => {
  it('includes project requirements without confusing proposal revisions with framework versions', () => {
    const requirements = renderIssueContext({
      ...context,
      project: {
        ...context.project!,
        description: 'NocoBase 3; internal support ticket entry.',
      },
    });
    expect(requirements).toContain('## Project requirements');
    expect(requirements).toContain(
      'NocoBase 3; internal support ticket entry.',
    );
    const guidance = issueGuidance('PM-12', 'nb-studio').rules.join('\n');
    expect(guidance).toContain(
      'A proposal revision (such as v3) is not a framework version',
    );
    expect(guidance).toContain('ask for that requirement before installing');
  });

  it('renders the task and the issue context', () => {
    expect(renderTask(context, inputs)).toMatchSnapshot();
    expect(renderIssueContext(context)).toMatchSnapshot();
  });

  it('tells an agent how to download files, and to attach them when it may', () => {
    const plain = issueGuidance('PM-12', 'nb-studio').rules.join('\n');
    expect(plain).toContain('nb-studio issue attachment download <file-id>');
    expect(plain).not.toContain('--attach');
    expect(
      issueGuidance('PM-12', 'nb-studio', { attach: true }).rules.join('\n'),
    ).toContain('add `--attach <path>` (repeatable) to the comment');
  });

  it('tells an agent the workflow does not let it move the status', () => {
    expect(
      renderTask({ ...context, allowedTransitions: ['in_progress'] }, []),
    ).toMatchSnapshot();
  });

  it('makes the design proposal the report of a run in Analysis', () => {
    const analysis: IssueContext = {
      ...context,
      status: { key: 'analysis', name: 'Analysis', category: 'started' },
      allowedTransitions: ['analysis', 'proposal_review', 'blocked'],
    };
    const task = renderTask(analysis, inputs);
    expect(task).toMatchSnapshot();
    expect(task).toContain(
      'nb-studio issue design-proposal PM-12 --content-file proposal.md',
    );
    expect(task).not.toContain('Post a comment');
    expect(task).not.toContain('Move the issue to the status that fits');

    const design = issueGuidance('PM-12', 'nb-studio', { design: true });
    const rules = design.rules.join('\n');
    expect(rules).toContain('never restate or summarise it in a comment');
    expect(rules).not.toContain('Report progress and results as comments');
    expect(rules).not.toContain('When you are done');
    // Elsewhere the rules stay as they were.
    expect(issueGuidance('PM-12', 'nb-studio').rules[0]).toContain(
      'Report progress and results as comments',
    );
    expect(renderTask(context, inputs)).toContain('Post a comment on PM-12');
  });

  it("gives a run the project's working directories in order", () => {
    expect(dirsOf(context)).toEqual([
      {
        kind: 'repo',
        url: 'https://example.com/acme/web.git',
        defaultBranch: 'develop',
        branch: 'agent/PM-12',
        path: 'web',
        scopeId: 'res-1',
        initPrompt: 'Run pnpm install, then copy .env.example to .env.',
      },
      {
        kind: 'directory',
        path: '/srv/data',
        runnerId: 'runner-1',
        scopeId: 'res-2',
        name: 'data',
      },
    ]);
  });
  it('permits empty initialization only for the assigned coding executor in development', () => {
    const coding = { id: 'a-1', actions: ['studio.git/open-pr'] };
    const assigned = { ...context, executor: { type: 'agent', id: coding.id } };
    expect(mayInitializeEmptyRepository(assigned, coding)).toBe(true);
    expect(
      mayInitializeEmptyRepository(
        { ...assigned, status: context.statuses[1]! },
        coding,
      ),
    ).toBe(true);
    expect(
      mayInitializeEmptyRepository({ ...context, executor: null }, coding),
    ).toBe(false);
    expect(
      mayInitializeEmptyRepository(assigned, { ...coding, actions: [] }),
    ).toBe(false);
    expect(
      mayInitializeEmptyRepository(assigned, { ...coding, id: 'reviewer' }),
    ).toBe(false);
    expect(
      mayInitializeEmptyRepository(
        { ...assigned, status: context.statuses[3]! },
        coding,
      ),
    ).toBe(false);
    expect(dirsOf(assigned, new Map(), null, true)[0]).toMatchObject({
      branch: 'agent/PM-12',
      initializeIfEmpty: true,
    });
    expect(dirsOf(assigned)[0]).not.toHaveProperty('initializeIfEmpty');
    expect(dirsOf(assigned, new Map(), null, true)[1]).not.toHaveProperty(
      'initializeIfEmpty',
    );
    expect(EMPTY_REPOSITORY_NOTE).toContain(
      'NocoBase 3 via `pnpm create @nocobase/app`',
    );
    expect(EMPTY_REPOSITORY_NOTE).toContain(
      'continue partially generated work on retry',
    );
  });
});
