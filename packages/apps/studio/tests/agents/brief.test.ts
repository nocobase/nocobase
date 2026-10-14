// @vitest-environment node
/**
 * The task and context layers of an issue's brief, and its working directories, rendered from a fixed issue for the
 * project manager and for an agent doing a step: any change to the wording shows here. The agents plugin's own test
 * renders the whole brief from exactly these layers.
 */
import type { RunInput } from '@nocobase/agent-protocol';
import type { IssueContext } from '@nocobase/app-plugin-projects/server/tokens';
import { FIXED_STATUSES } from '@nocobase/app-plugin-projects/shared/statuses';
import { describe, expect, it } from 'vitest';

import {
  dirsOf,
  EMPTY_REPOSITORY_NOTE,
  isReadOnlyStep,
  issueClaimRejection,
  issueGuidance,
  managerWorkspaceKey,
  mayInitializeEmptyRepository,
  renderIssueContext,
  renderTask,
} from '../../server/agents/issue-subject.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';

const statuses = FIXED_STATUSES.map(({ key, name, category }) => ({
  key,
  name,
  category,
}));
const statusOf = (key: string) =>
  statuses.find((status) => status.key === key)!;

const context: IssueContext = {
  id: 'i-1',
  identifier: 'PM-12',
  title: 'Fix login on Safari',
  description: 'Signing in fails on Safari 17.\n\nSee the attached HAR.',
  status: statusOf('in_progress'),
  statuses,
  allowedTransitions: ['in_progress', 'blocked', 'in_review'],
  priority: 'high',
  labels: ['bug', 'frontend'],
  owner: { id: 'alice', name: 'Alice' },
  executor: { type: 'agent', id: PROJECT_MANAGER_ID, name: 'Project manager' },
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
        binding: null,
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
        binding: null,
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
    { id: 'i-2', identifier: 'PM-13', title: 'Add a test', status: 'backlog' },
  ],
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

const input = (
  id: string,
  text: string,
  payload: Record<string, unknown>,
  type: RunInput['type'] = 'comment',
): RunInput => ({
  id,
  type,
  at: '2026-10-01T09:00:00.000Z',
  actor: { kind: 'user', id: 'alice', name: 'Alice' },
  text,
  payload,
});

/** What wakes the project manager: it was given the issue, then someone commented. */
const managerInputs: RunInput[] = [
  input(
    'in-1',
    'Alice gave you PM-12 (Fix login on Safari) to work on.',
    { trigger: 'assigned' },
    'signal',
  ),
  input('in-2', 'Use the v2 session API.', {
    trigger: 'comment',
    commentId: 'c-2',
  }),
];

/** What wakes an agent doing a step: the project manager's hand-over mentioning it. */
const stepInputs: RunInput[] = [
  input(
    'in-3',
    'Next: once the fix is in, hand it to review.\n\n[@Coder](mention://agent/a-1) Fix the Safari sign-in; reply with the branch.',
    { trigger: 'mention', commentId: 'c-3' },
  ),
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

  it('renders the project manager’s task and the issue context', () => {
    expect(
      renderTask(context, managerInputs, { manager: true }),
    ).toMatchSnapshot();
    expect(renderIssueContext(context)).toMatchSnapshot();
  });

  it('tells the project manager the statuses it may move the issue to, and the "Next" line', () => {
    const task = renderTask(context, managerInputs, { manager: true });
    expect(task).toContain(
      'You have been given this issue to arrange. Decide its first step and hand it over.',
    );
    expect(task).toContain(
      '- At this read, the current status is in_progress; available next transitions are: blocked, in_review (`nb-studio issue update PM-12 --status <status>`).',
    );
    expect(task).toContain('starts with its "Next" line');
    expect(
      renderTask({ ...context, allowedTransitions: ['in_progress'] }, [], {
        manager: true,
      }),
    ).toContain('- Leave the status as it is.');
  });

  it('renders an agent’s step: one reply in its thread, no reason that only the project manager has', () => {
    const task = renderTask(context, stepInputs);
    expect(task).toMatchSnapshot();
    expect(task).toContain('You were mentioned in a comment. Do what it asks.');
    expect(task).not.toContain('available next transitions');
    // Triggers only the project manager is woken by say nothing to an agent doing a step.
    expect(renderTask(context, managerInputs)).not.toContain(
      'You have been given this issue to arrange',
    );
  });

  it('gives the project manager and an agent doing a step their own rules', () => {
    const manager = issueGuidance('PM-12', 'nb-studio', { manager: true });
    expect(manager.rules[0]).toContain('Arrange issue PM-12 in comments');
    expect(manager.rules).toContain(
      'Move the status only to the statuses the task says you may move it to.',
    );
    const step = issueGuidance('PM-12', 'nb-studio');
    expect(step.rules[0]).toContain(
      'Answer the step you were handed once, when you finish, in the thread of the comment that handed it to you (`nb-studio issue comment add PM-12 --parent <comment-id> --content-file <path>`)',
    );
    expect(step.rules).toContain("Do not change the issue's status.");
    expect(step.whenBlocked).toContain('in a reply on issue PM-12');
  });

  it('tells an agent how to download files, and to attach them when it may', () => {
    const plain = issueGuidance('PM-12', 'nb-studio').rules.join('\n');
    expect(plain).toContain('nb-studio issue attachment download <file-id>');
    expect(plain).not.toContain('--attach');
    expect(
      issueGuidance('PM-12', 'nb-studio', { attach: true }).rules.join('\n'),
    ).toContain('add `--attach <path>` (repeatable) to the comment');
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

  it('names the project manager’s own work directory by the issue key', () => {
    expect(managerWorkspaceKey('PM-12')).toBe('PM-12.manager');
  });

  it('permits empty initialization only to an agent doing a step that may open pull requests, on an open issue', () => {
    const coding = { id: 'a-1', actions: ['studio.git/open-pr'] };
    expect(mayInitializeEmptyRepository(context, coding, true)).toBe(true);
    expect(
      mayInitializeEmptyRepository(
        { ...context, status: statusOf('blocked') },
        coding,
        true,
      ),
    ).toBe(true);
    expect(
      mayInitializeEmptyRepository(context, { ...coding, actions: [] }),
    ).toBe(false);
    expect(
      mayInitializeEmptyRepository(context, {
        ...coding,
        id: PROJECT_MANAGER_ID,
      }),
    ).toBe(false);
    for (const key of ['backlog', 'in_review', 'done'])
      expect(
        mayInitializeEmptyRepository(
          { ...context, status: statusOf(key) },
          coding,
          true,
        ),
      ).toBe(false);
    expect(dirsOf(context, new Map(), null, true)[0]).toMatchObject({
      branch: 'agent/PM-12',
      initializeIfEmpty: true,
    });
    expect(dirsOf(context)[0]).not.toHaveProperty('initializeIfEmpty');
    expect(dirsOf(context, new Map(), null, true)[1]).not.toHaveProperty(
      'initializeIfEmpty',
    );
    expect(EMPTY_REPOSITORY_NOTE).toContain(
      'NocoBase 3 via `pnpm create @nocobase/app`',
    );
    expect(EMPTY_REPOSITORY_NOTE).toContain(
      'continue partially generated work on retry',
    );
  });

  it('claims the project manager’s runs only while the issue is open, and every agent’s step', () => {
    const manager = { id: PROJECT_MANAGER_ID };
    for (const key of ['in_progress', 'blocked', 'in_review'])
      expect(
        issueClaimRejection({ ...context, status: statusOf(key) }, manager),
      ).toBeNull();
    for (const key of ['backlog', 'done', 'cancelled'])
      expect(
        issueClaimRejection({ ...context, status: statusOf(key) }, manager),
      ).toMatchObject({ reason: 'dormant' });
    expect(
      issueClaimRejection(
        { ...context, status: statusOf('done') },
        { id: 'a-1' },
      ),
    ).toBeNull();
  });
});

describe('a read-only step', () => {
  const handOver = (text: string) => input('x', text, { trigger: 'mention' });

  it('is one whose every input says `Mode: read-only` on a line of its own', () => {
    expect(
      isReadOnlyStep([handOver('Review the pull request.\nMode: read-only')]),
    ).toBe(true);
    expect(
      isReadOnlyStep([
        handOver('  mode:  READ-ONLY  \nRead the CI failure.'),
        handOver('Also check the logs.\n\nMode: read-only'),
      ]),
    ).toBe(true);
  });

  it('is not one when any input lacks the line, mentions it in passing, or there is none', () => {
    expect(isReadOnlyStep([])).toBe(false);
    expect(
      isReadOnlyStep([
        handOver('Review it.\nMode: read-only'),
        handOver('Now fix what you found.'),
      ]),
    ).toBe(false);
    expect(
      isReadOnlyStep([handOver('Do not use Mode: read-only here; fix it.')]),
    ).toBe(false);
    expect(isReadOnlyStep([handOver('Mode: read-only please')])).toBe(false);
  });
});
