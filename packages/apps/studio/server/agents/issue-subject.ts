/**
 * Issues as the subject of runs: what a claim hands the agent about its issue (`ContextProvider`), and how the end of a
 * run reaches the issue (`WorkSink`). The context is the projects plugin's `IssueContext`, read in the claim's
 * transaction; the brief's task and context layers, and the issue's own lines of its rules (`guidance`), are written
 * from it here, for one of two roles:
 *
 * - The project manager (`PROJECT_MANAGER_ID`), the issue's executor, arranges the work: it comments, hands steps over
 *   and moves the status, and runs in a work directory of its own that checks nothing out (`workspaceKey`
 *   `<issue>.manager`), so it never waits for the lock of the directory an agent writes code in. It works only while
 *   the issue is open: a run of it queued before the issue went to backlog or finished is not claimed (`dormant`).
 * - Any other agent does the one step it was handed (or asked for, mentioned by a person) in the project's working
 *   directories, on the issue's branch, and answers in that comment's thread. A step whose hand-over says
 *   `Mode: read-only` (`isReadOnlyStep`), such as a review, gets a read-only checkout of its own, which pushes nothing
 *   and runs alongside the step that changes code.
 *
 * The binding also names issues and the triggers of their runs for the agents plugin's pages, and offers a made-up
 * issue for "Preview full prompt" (`sampleIssue`), rendered by the same code as a real one.
 */
import type { RunInput } from '@nocobase/agent-protocol';
import type {
  IssueContext,
  IssueContextFile,
  Projects,
} from '@nocobase/app-plugin-projects/server/tokens';

import type {
  Agents,
  ContextProvider,
  SubjectAssembly,
  SubjectBinding,
  SubjectDir,
  SubjectSample,
} from '@nocobase/app-plugin-agents/server/tokens';
import { sampleValue } from '@nocobase/app-plugin-agents/shared/briefs';

import { commentDelta, deltaNotes } from './comment-delta.js';
import type { Agent } from '@nocobase/app-plugin-agents/shared/agents';
import { statusCategory } from '@nocobase/app-plugin-projects/shared/statuses';

import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { runBranches } from '../git/run-git.js';
import { initialDirOf } from '../projects-init/store.js';
import { ATTACH_ACTION } from './capabilities.js';
import { PROJECT_SCOPE } from './catalog/scopes.js';
import {
  ISSUE_SUBJECT,
  ISSUE_TITLE,
  ISSUE_TRIGGER_TITLES,
  PROJECT_TITLE,
} from './catalog/triggers.js';
import { AGENT_KIND } from './tx.js';
import { issueExecutionIdentity } from './execution-identity.js';

const SUBJECT_NOUN = 'issue';

/** Whether `agentId` is the project manager, which arranges the work rather than doing a step of it. */
export function isManager(agentId: string): boolean {
  return agentId === PROJECT_MANAGER_ID;
}

/** The project manager's work directory on a runner: its own, with nothing checked out. */
/** The line a hand-over carries for a step that changes no code. */
export const READ_ONLY_LINE: RegExp = /^\s*Mode:\s*read-only\s*$/imu;

/** Whether the run's inputs are hand-overs of a step that changes no code: each says `Mode: read-only`. */
export function isReadOnlyStep(inputs: readonly RunInput[]): boolean {
  return (
    inputs.length > 0 &&
    inputs.every((input) => READ_ONLY_LINE.test(input.text))
  );
}

export function managerWorkspaceKey(identifier: string): string {
  return `${identifier}.manager`;
}

/**
 * An issue's own lines of the brief's rules, for the project manager (`manager`: it reports and hands work over in
 * comments) or an agent doing a step (it answers once, in the thread of the comment that handed it the step), and the
 * files people attached; with `attach` (the agent holds `pm.attachments/upload`), attaching files to comments too.
 */
export function issueGuidance(
  key: string,
  cli: string,
  options: { readonly attach?: boolean; readonly manager?: boolean } = {},
): NonNullable<SubjectAssembly['guidance']> {
  const comment = `\`${cli} issue comment add ${key} --content-file <path>\``;
  const reply = `\`${cli} issue comment add ${key} --parent <comment-id> --content-file <path>\``;
  return {
    rules: [
      options.manager
        ? `Arrange ${SUBJECT_NOUN} ${key} in comments (${comment}): hand steps over, answer, and say what happens next. People and agents read the comments, not your terminal.`
        : `Answer the step you were handed once, when you finish, in the thread of the comment that handed it to you (${reply}). People and the project manager read the comments, not your terminal.`,
      options.attach
        ? `Files on ${SUBJECT_NOUN} ${key} and its comments are listed in the context with their ids: save one with \`${cli} issue attachment download <file-id>\`. To show a screenshot, a log or another file, add \`--attach <path>\` (repeatable) to the comment and name the file in its text; never attach secrets or personal data.`
        : `Files on ${SUBJECT_NOUN} ${key} and its comments are listed in the context with their ids: save one with \`${cli} issue attachment download <file-id>\`.`,
      options.manager
        ? 'Move the status only to the statuses the task says you may move it to.'
        : "Do not change the issue's status.",
      'When you are done, or need a person, say so in a comment and end your turn. Do not wait for an answer: new comments reach you as new input.',
    ],
    whenBlocked: options.manager
      ? `If something essential is missing, say exactly what in a comment on ${SUBJECT_NOUN} ${key} (${comment}) and end your turn instead of guessing.`
      : `If you cannot get the environment working, say exactly what is missing in a reply on ${SUBJECT_NOUN} ${key} (${reply}) and end your turn instead of guessing.`,
  };
}

/** What starts the run, in the words of the task layer. */
const TRIGGER_TASKS: Readonly<Record<string, string>> = {
  assigned:
    'You have been given this issue to arrange. Decide its first step and hand it over.',
  started: 'Someone started this issue. Decide its next step and hand it over.',
  mention: 'You were mentioned in a comment. Do what it asks.',
  reply: 'Someone answered one of your comments. Continue from their answer.',
  comment:
    'Someone commented on the issue you are working on. Take it into account.',
  statusChange: "Someone moved the issue's status. Take it into account.",
  ownerChanged: 'The issue has a new owner. Continue the work for them.',
  projectChanged:
    'The issue moved to another project, whose working directories you work in now. Continue the work there.',
  unblocked: 'The issue is no longer blocked. Continue the work.',
  subtasksFinished: 'Sub-issues of this issue are finished. Continue the work.',
  retry:
    'An earlier attempt did not finish. Start again from where the issue is now.',
  prChecksFailed:
    'The checks of a pull request of this issue failed. Decide who reads the failure or fixes it.',
  prChecksPassed:
    'The checks of a pull request of this issue passed. Decide whether the change is ready for acceptance.',
  prConflict:
    'A pull request of this issue conflicts with its base branch. Decide who resolves it.',
};

function triggersOf(inputs: readonly RunInput[]): string[] {
  const seen: string[] = [];
  for (const input of inputs) {
    const payload = input.payload as { trigger?: unknown } | undefined;
    const trigger =
      input.type === 'retry'
        ? 'retry'
        : typeof payload?.trigger === 'string'
          ? payload.trigger
          : input.type;
    if (!seen.includes(trigger)) seen.push(trigger);
  }
  return seen;
}

/**
 * The task layer: why the agent runs now, and how to finish, for the project manager (`manager`) or an agent doing a
 * step. Where to work is the system layer's.
 */
export function renderTask(
  context: IssueContext,
  inputs: readonly RunInput[],
  options: { readonly manager?: boolean } = {},
): string {
  const reasons = triggersOf(inputs)
    .map((trigger) =>
      options.manager || !MANAGER_ONLY_TRIGGERS.has(trigger)
        ? TRIGGER_TASKS[trigger]
        : undefined,
    )
    .filter((text): text is string => Boolean(text));
  const moves = context.allowedTransitions.filter(
    (key) => key !== context.status.key,
  );
  const finish = options.manager
    ? [
        `- Act: hand the next step over, answer, or move the status, in a comment on ${context.identifier} that starts with its "Next" line. Then end your turn.`,
        moves.length > 0
          ? `- You may move the issue to: ${moves.join(', ')} (\`nb-studio issue update ${context.identifier} --status <status>\`).`
          : '- Leave the status as it is.',
      ]
    : [
        `- Reply once on ${context.identifier}, in the thread of the comment that handed you the step: what you did, the result, links to branches or pull requests, and what is left.`,
      ];
  return [
    `Issue ${context.identifier}: ${context.title}`,
    '',
    ...(reasons.length > 0 ? reasons : ['Continue the work on this issue.']),
    '',
    'When you finish:',
    ...finish,
  ].join('\n');
}

/** The context layer: the issue as it is now, in Markdown. */
export function renderIssueContext(context: IssueContext): string {
  const lines = [
    `# ${context.identifier} ${context.title}`,
    '',
    `- Status: ${context.status.name} (${context.status.key}, ${context.status.category})`,
    `- Priority: ${context.priority}`,
    `- Owner: ${context.owner.name || context.owner.id}`,
    ...(context.labels.length > 0
      ? [`- Labels: ${context.labels.join(', ')}`]
      : []),
    ...(context.dueDate ? [`- Due: ${context.dueDate}`] : []),
    ...(context.project ? [`- Project: ${context.project.name}`] : []),
    ...(context.parent
      ? [`- Parent: ${context.parent.identifier} ${context.parent.title}`]
      : []),
    `- Statuses: ${context.statuses.map((status) => status.key).join(', ')}`,
    '',
    '## Description',
    '',
    context.description.trim() || '(empty)',
  ];
  if (context.project && context.project.repos.length > 0)
    lines.push(
      '',
      '## Working directories',
      '',
      ...context.project.repos.map(
        (repo, index) =>
          `- ${repo.type === 'directory' && repo.label ? `${repo.label}: ` : ''}${
            repo.type === 'gitRepo'
              ? `${repo.url ?? ''}${repo.defaultRef ? ` (${repo.defaultRef})` : ''}`
              : `${repo.path ?? ''} (a directory on one machine)`
          }${index === 0 ? ' [primary]' : ''}`,
      ),
    );
  if (context.attachments.length > 0)
    lines.push(
      '',
      '## Attachments',
      '',
      ...context.attachments.map((file) => `- ${fileLine(file)}`),
    );
  if (context.children.length > 0)
    lines.push(
      '',
      '## Sub-issues',
      '',
      ...context.children.map(
        (child) => `- ${child.identifier} ${child.title} (${child.status})`,
      ),
    );
  if (context.comments.length > 0)
    lines.push(
      '',
      '## Recent comments',
      '',
      ...context.comments.flatMap((comment) => [
        `### ${comment.author.name ?? comment.author.type} at ${comment.createdAt}${comment.parentId ? ' (reply)' : ''}`,
        '',
        comment.content.trim(),
        ...(comment.attachments.length > 0
          ? ['', `Attached: ${comment.attachments.map(fileLine).join('; ')}`]
          : []),
        '',
      ]),
    );
  return lines.join('\n').trim();
}

/** A file as the brief names it: its name, type, size and the id to download it by. */
function fileLine(file: IssueContextFile): string {
  return `${file.filename} (${file.mimeType}, ${file.size} bytes) [${file.id}]`;
}

/**
 * The project's working directories as a run's, in order: repositories on the issue's branch (`branches`, by working
 * directory id: its repository's first branch rule; `agent/<key>` without one), directories as they are.
 */
export function dirsOf(
  context: IssueContext,
  branches: ReadonlyMap<string, string> = new Map(),
  initial: {
    readonly resourceId: string;
    readonly defaultBranch: string;
  } | null = null,
  initializeIfEmpty = false,
): SubjectDir[] {
  const used = new Set<string>();
  const nameOf = (base: string, index: number): string => {
    const clean =
      base
        .replace(/\.git$/u, '')
        .replace(/[^A-Za-z0-9._-]+/gu, '-')
        .replace(/^[-.]+/u, '') || `repo-${index + 1}`;
    let path = clean;
    for (let n = 2; used.has(path); n += 1) path = `${clean}-${n}`;
    used.add(path);
    return path;
  };
  return (context.project?.repos ?? []).flatMap((repo, index): SubjectDir[] => {
    const initPrompt = repo.initPrompt?.trim()
      ? { initPrompt: repo.initPrompt.trim() }
      : {};
    // A repository is named by its URL; only a runner directory has a name of its own.
    const name =
      repo.type === 'directory' && repo.label ? { name: repo.label } : {};
    if (repo.type === 'directory') {
      if (!repo.path || !repo.runnerId) return [];
      return [
        {
          kind: 'directory',
          path: repo.path,
          runnerId: repo.runnerId,
          scopeId: repo.id,
          ...name,
          ...initPrompt,
        },
      ];
    }
    if (!repo.url) return [];
    // The project's init issue makes an empty repository's first commit, on its default branch.
    if (initial?.resourceId === repo.id)
      return [
        {
          kind: 'repo',
          url: repo.url,
          defaultBranch: initial.defaultBranch,
          branch: initial.defaultBranch,
          initial: true,
          path: nameOf(
            repo.url
              .replace(/\.git$/u, '')
              .split('/')
              .pop() ?? '',
            index,
          ),
          scopeId: repo.id,
          ...name,
          ...initPrompt,
        },
      ];
    return [
      {
        kind: 'repo',
        url: repo.url,
        // A project's repository may name no base: assume the common default.
        defaultBranch: repo.defaultRef ?? 'main',
        branch: branches.get(repo.id) ?? `agent/${context.identifier}`,
        ...(initializeIfEmpty ? { initializeIfEmpty: true as const } : {}),
        path: nameOf(
          repo.url
            .replace(/\.git$/u, '')
            .split('/')
            .pop() ?? '',
          index,
        ),
        scopeId: repo.id,
        ...name,
        ...initPrompt,
      },
    ];
  });
}

/**
 * An agent doing a step on an open issue may make an empty repository's first commit when it may open pull requests;
 * the project manager checks nothing out.
 */
export function mayInitializeEmptyRepository(
  context: IssueContext,
  agent: { readonly id: string; readonly actions?: readonly string[] },
  mayOpenPullRequest = false,
): boolean {
  return (
    !isManager(agent.id) &&
    ['in_progress', 'blocked'].includes(context.status.key) &&
    mayOpenPullRequest
  );
}

export const EMPTY_REPOSITORY_NOTE = [
  '## Empty repository initialization',
  '',
  'The runner may initialize a repository only after verifying that its remote has no refs. Follow its workspace notes for the actual branch and whether this is the first delivery. A missing base branch in a nonempty repository is a configuration error, not permission to replace its history.',
  'When the task requests a new NocoBase application, use NocoBase 3 via `pnpm create @nocobase/app`, honoring the project’s specified template, registry and directory. Do not substitute the legacy `create-nocobase-app` initializer. Check existing files before scaffolding; continue partially generated work on retry instead of overwriting it. Verify the generated `nocobase.templatePackage`, AGENTS.md and application-local skills, then follow those instructions to install, start and check the application. Report the application directory, startup instructions, accessible URL and actual verification results. A successful first push alone does not prove the application works.',
].join('\n');

/** What the init issue's agent is told: its run makes the empty repository's first commit, on the default branch. */
export function initialNote(defaultBranch: string): string {
  return [
    '## Initializing the repository',
    '',
    `This issue initializes the project: its repository is empty, and your checkout is on its default branch, \`${defaultBranch}\`, with no commit yet. Make the first commit there and push it with \`git push origin ${defaultBranch}\`; this run alone may push the default branch. Do not open a pull request, whatever other instructions say. Once the push reached the host and your run ends successfully, Studio moves this issue to done and the project's other issues start.`,
  ].join('\n');
}

/** What wakes the project manager only, which an agent doing a step is not told as its reason. */
const MANAGER_ONLY_TRIGGERS: ReadonlySet<string> = new Set([
  'assigned',
  'started',
  'unblocked',
  'subtasksFinished',
  'prChecksFailed',
  'prChecksPassed',
  'prConflict',
]);

/**
 * The subject's only admission policy: the project manager works only while the issue is open, so a run of it queued
 * before the issue went to backlog or finished is cancelled when a runner would take it (`dormant`). An agent doing a
 * step is always admitted.
 */
export function issueClaimRejection(
  context: IssueContext,
  agent: Pick<Agent, 'id'>,
): { reason: string; detail: string } | null {
  if (!isManager(agent.id)) return null;
  const category = statusCategory(context.status.key);
  return context.status.key === 'backlog' ||
    category === 'done' ||
    category === 'closed'
    ? {
        reason: 'dormant',
        detail: `${context.identifier} is ${context.status.key}: the project manager works only on open issues.`,
      }
    : null;
}

export function createIssueContextProvider(
  agents: Pick<Agents, 'runs' | 'briefs' | 'gate'>,
  projects: () => Pick<Projects, 'issueContext' | 'commentQueries'>,
): ContextProvider {
  return {
    prepare: (run) =>
      agents.gate.allowed({
        kind: 'run',
        userId: run.actorUserId,
        displayName: '',
      }),
    async admit(conn, claim) {
      const context = await projects().issueContext.contextFor(
        conn,
        claim.run.subject.id,
        { kind: AGENT_KIND },
      );
      if (!context)
        return { reason: 'subjectMissing', detail: 'The issue is gone.' };
      return issueClaimRejection(context, claim.agent);
    },
    async assemble(conn, claim, prepared) {
      const context = await projects().issueContext.contextFor(
        conn,
        claim.run.subject.id,
        { kind: AGENT_KIND },
      );
      if (!context) throw new Error('The issue is gone.');
      const inputs = claim.inputs;
      const manager = isManager(claim.agent.id);
      const allowed =
        (prepared as ReadonlySet<string> | undefined) ?? new Set<string>();
      const subject = { noun: SUBJECT_NOUN, key: context.identifier };
      const previousSummary = await agents.runs.lastSummary(
        conn,
        {
          agentId: claim.agent.id,
          subjectKind: claim.run.subject.kind,
          subjectId: context.id,
        },
        claim.run.id,
      );
      const delta = await commentDelta(conn, projects(), {
        agentId: claim.agent.id,
        issueId: context.id,
        runId: claim.run.id,
        inputs,
      });
      const initial = await initialDirOf(
        conn,
        context.id,
        context.project?.id ?? null,
      );
      const initializeIfEmpty =
        !manager &&
        !claim.run.parentRunId &&
        mayInitializeEmptyRepository(
          context,
          claim.agent,
          allowed.has('studio.git/open-pr'),
        );
      return {
        subject: {
          key: context.identifier,
          title: context.title,
          url: context.url,
          noun: SUBJECT_NOUN,
        },
        guidance: issueGuidance(context.identifier, claim.cli, {
          attach: !claim.run.parentRunId && allowed.has(ATTACH_ACTION),
          manager,
        }),
        inputs,
        task: renderTask(context, inputs, { manager }),
        context:
          initial && !manager
            ? [
                renderIssueContext(context),
                initialNote(initial.defaultBranch),
              ].join('\n\n')
            : [
                renderIssueContext(context),
                ...(initializeIfEmpty ? [EMPTY_REPOSITORY_NOTE] : []),
              ].join('\n\n'),
        turn: {
          prompt: agents.briefs.turnPrompt(inputs, { subject }),
          ...(previousSummary ? { previousSummary } : {}),
          ...deltaNotes(delta, context.identifier, claim.cli),
        },
        data: { kind: ISSUE_SUBJECT, issue: context },
        // The project manager checks nothing out, in a work directory of its own.
        ...(manager
          ? { workspaceKey: managerWorkspaceKey(context.identifier) }
          : isReadOnlyStep(inputs)
            ? { readOnly: true }
            : {}),
        dirs: manager
          ? []
          : dirsOf(
              context,
              await runBranches(
                conn,
                context.project?.repos ?? [],
                context.identifier,
              ),
              initial,
              initializeIfEmpty,
            ),
        scopes: context.project
          ? [{ scope: PROJECT_SCOPE, scopeId: context.project.id }]
          : [],
      };
    },
  };
}

/**
 * A made-up issue for "Preview full prompt", every made-up value marked `[sample]`: a task in progress in a project with
 * one repository, under a parent, with a comment, as the projects plugin's context would describe a real one.
 */
export function sampleIssue(id: string): IssueContext {
  const statuses = [
    { key: 'backlog', name: sampleValue('Backlog'), category: 'unstarted' },
    {
      key: 'in_progress',
      name: sampleValue('In progress'),
      category: 'started',
    },
    { key: 'in_review', name: sampleValue('In review'), category: 'started' },
    { key: 'done', name: sampleValue('Done'), category: 'done' },
  ] as const;
  return {
    id,
    identifier: 'SAMPLE-1',
    title: sampleValue('Export the issue list as CSV'),
    description: sampleValue(
      'People want to take the issue list into a spreadsheet. Add an Export button to the list that downloads the issues it shows, with their key, title, status, owner and due date.',
    ),
    status: statuses[1],
    statuses,
    allowedTransitions: ['in_progress', 'in_review'],
    priority: 'medium',
    labels: [sampleValue('frontend')],
    owner: { id: 'sample-owner', name: sampleValue('Owner') },
    executor: null,
    project: {
      id: 'sample-project',
      name: sampleValue('Project'),
      description: null,
      repos: [
        {
          id: 'sample-repo',
          type: 'gitRepo',
          url: 'https://git.example.com/sample/app.git',
          defaultRef: 'main',
          binding: null,
          runnerId: null,
          path: null,
          label: null,
          initPrompt: null,
        },
      ],
    },
    parent: {
      id: 'sample-parent',
      identifier: 'SAMPLE-0',
      title: sampleValue('Reporting improvements'),
      status: 'in_progress',
    },
    children: [],
    attachments: [],
    comments: [
      {
        id: 'sample-comment',
        parentId: null,
        author: {
          type: 'user',
          id: 'sample-owner',
          name: sampleValue('Owner'),
        },
        content: sampleValue(
          'Keep the columns in the order the list shows them.',
        ),
        createdAt: '2026-01-01T00:00:00.000Z',
        attachments: [],
      },
    ],
    dueDate: null,
    url: '/issues/SAMPLE-1',
  };
}

/** "Preview full prompt" on a made-up issue: the assembly a run on `sampleIssue` would get. */
export function issueSample(agents: Pick<Agents, 'briefs'>): SubjectSample {
  return {
    assemble(_conn, claim) {
      const context = sampleIssue(claim.run.subject.id);
      return Promise.resolve({
        subject: {
          key: context.identifier,
          title: context.title,
          url: context.url,
          noun: SUBJECT_NOUN,
        },
        guidance: issueGuidance(context.identifier, claim.cli, {
          attach: true,
          manager: isManager(claim.agent.id),
        }),
        task: renderTask(context, claim.inputs, {
          manager: isManager(claim.agent.id),
        }),
        context: renderIssueContext(context),
        turn: {
          prompt: agents.briefs.turnPrompt(claim.inputs, {
            subject: { noun: SUBJECT_NOUN, key: context.identifier },
          }),
        },
        data: { kind: ISSUE_SUBJECT, issue: context },
        dirs: dirsOf(context),
        scopes: [],
      });
    },
  };
}

export function issueBinding(
  agents: Pick<Agents, 'runs' | 'briefs' | 'agents' | 'gate'>,
  projects: () => Pick<Projects, 'issueContext' | 'commentQueries'>,
  sink: SubjectBinding['sink'],
  queuedExpiryMs = 0,
): SubjectBinding {
  return {
    kind: ISSUE_SUBJECT,
    actsAs: issueExecutionIdentity(agents, projects),
    ...(queuedExpiryMs > 0 ? { queuedExpiryMs } : {}),
    title: ISSUE_TITLE,
    groupTitle: PROJECT_TITLE,
    path: '/issues/{id}',
    groupPath: '/projects/{id}',
    triggers: ISSUE_TRIGGER_TITLES,
    preview: issueSample(agents),
    context: createIssueContextProvider(agents, projects),
    ...(sink ? { sink } : {}),
  };
}
