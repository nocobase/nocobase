/**
 * Issues as the subject of runs: what a claim hands the agent about its issue (`ContextProvider`), and how the end of a
 * run reaches the issue (`WorkSink`). The context is the projects plugin's `IssueContext`, read in the claim's
 * transaction; the brief's task and context layers, and the issue's own lines of its rules (`guidance`: report in
 * comments, move the status only as the workflow allows), are written from it here. The binding also names issues and
 * the triggers of their runs for the agents plugin's pages, and offers a made-up issue for "Preview full prompt"
 * (`sampleIssue`), rendered by the same code as a real one.
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

import { ANALYSIS_STATUS } from '../../shared/design.js';
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
import { issueResponsible } from './work-source.js';

const SUBJECT_NOUN = 'issue';

/**
 * An issue's own lines of the brief's rules: report in comments, move the status as the workflow allows, and use the
 * files people attached; with `attach` (the agent holds `pm.attachments/upload`), attach files to comments too.
 *
 * With `design` (the issue is in Analysis, see `isDesignStage`), the design proposal is the report: an agent told to
 * report in comments as well restated its proposal in a comment right below the proposal card, so these lines keep
 * comments for answering questions and saying what blocks it.
 */
export function issueGuidance(
  key: string,
  cli: string,
  options: { readonly attach?: boolean; readonly design?: boolean } = {},
): NonNullable<SubjectAssembly['guidance']> {
  const comment = `\`${cli} issue comment add ${key} --content-file <path>\``;
  return {
    rules: [
      options.design
        ? `Your design proposal (\`${cli} issue design-proposal ${key}\`) is your report on ${SUBJECT_NOUN} ${key}: never restate or summarise it in a comment. Comment (${comment}) only to answer questions in their thread or to say what you need when blocked. People read the issue page, not your terminal.`
        : `Report progress and results as comments on ${SUBJECT_NOUN} ${key} (${comment}). People read the comments, not your terminal.`,
      options.attach
        ? `Files on ${SUBJECT_NOUN} ${key} and its comments are listed in the context with their ids: save one with \`${cli} issue attachment download <file-id>\`. To show a screenshot, a log or another file, add \`--attach <path>\` (repeatable) to the comment and name the file in its text; never attach secrets or personal data.`
        : `Files on ${SUBJECT_NOUN} ${key} and its comments are listed in the context with their ids: save one with \`${cli} issue attachment download <file-id>\`.`,
      'Move the status only to the statuses the task says you may move it to; a move may wait for a person to approve it.',
      options.design
        ? 'When you have submitted the proposal, end your turn. If you are blocked and need a person, say so in a comment and end your turn. Do not wait for an answer: new comments reach you as new input.'
        : 'When you are done, or blocked and need a person, say so in a comment and end your turn. Do not wait for an answer: new comments reach you as new input.',
    ],
    whenBlocked: `If you cannot get the environment working, say exactly what is missing in a comment on ${SUBJECT_NOUN} ${key} (${comment}) and end your turn instead of guessing.`,
  };
}

/** What starts the run, in the words of the task layer. */
const TRIGGER_TASKS: Readonly<Record<string, string>> = {
  assigned:
    'You have been given this issue to work on. Do the work it asks for.',
  mention: 'Someone mentioned you in a comment. Answer what they ask.',
  reply: 'Someone answered one of your comments. Continue from their answer.',
  comment:
    'Someone commented on the issue you are working on. Take it into account.',
  statusChange: "Someone moved the issue's status. Take it into account.",
  ownerChanged: 'The issue has a new owner. Continue the work for them.',
  projectChanged:
    'The issue moved to another project, whose working directories you work in now. Continue the work there.',
  unblocked: 'The issue is no longer blocked. Continue the work.',
  subtasksFinished: 'Sub-issues of this issue are finished. Continue the work.',
  stageEntered:
    'The issue entered a new stage and its workflow asked you to work on this stage.',
  retry:
    'An earlier attempt did not finish. Start again from where the issue is now.',
  prChecksFailed:
    'The checks of a pull request of this issue failed. Fix them on its branch.',
  prConflict:
    'A pull request of this issue conflicts with its base branch. Resolve the conflicts on its branch.',
  retrospective:
    'This issue is finished. Look back on it: check the user manual first, then propose what else is worth keeping (see Retrospective below).',
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

/** The stages the run was started for, newest last: where the issue went, and the workflow's instruction there. */
interface Stage {
  readonly from: string | null;
  readonly to: string;
  readonly instruction: string | null;
}

function stagesOf(inputs: readonly RunInput[]): Stage[] {
  return inputs.flatMap((input): Stage[] => {
    const payload = input.payload as Record<string, unknown> | undefined;
    const text = (value: unknown) =>
      typeof value === 'string' && value.trim() ? value.trim() : null;
    if (payload?.trigger !== 'stageEntered') {
      // Woken in a stage without its rule firing (given the issue there, released, out of backlog): that stage's
      // instruction (`work.ts`).
      if (!text(payload?.instruction)) return [];
      return [
        {
          from: text(payload?.from),
          to: text(payload?.to) ?? text(payload?.status) ?? '?',
          instruction: text(payload?.instruction),
        },
      ];
    }
    return [
      {
        from: text(payload.from) ?? '?',
        to: text(payload.to) ?? '?',
        instruction: text(payload.instruction),
      },
    ];
  });
}

/**
 * The task layer: why the agent runs now, and how to finish. Where to work is the system layer's. A run a workflow
 * stage started carries the stage and its instruction ("Workflow stage instruction").
 */
export function renderTask(
  context: IssueContext,
  inputs: readonly RunInput[],
): string {
  const reasons = triggersOf(inputs)
    .map((trigger) => TRIGGER_TASKS[trigger])
    .filter((text): text is string => Boolean(text));
  const stages = stagesOf(inputs).flatMap((stage) => [
    '',
    stage.from === null
      ? `The issue is in \`${stage.to}\`.`
      : `The issue entered \`${stage.to}\` (from \`${stage.from}\`).`,
    ...(stage.instruction
      ? [
          '',
          '## Workflow stage instruction',
          '',
          ...stage.instruction.split('\n').map((line) => `> ${line}`.trimEnd()),
        ]
      : []),
  ]);
  const moves = context.allowedTransitions.filter(
    (key) => key !== context.status.key,
  );
  // In Analysis the proposal is the report and submitting it moves the issue on, so asking for a closing comment and
  // a move as well only had the agent restate its proposal below the proposal card.
  const finish = isDesignStage(context)
    ? [
        `- If you wrote or revised the proposal, submit it with \`nb-studio issue design-proposal ${context.identifier} --content-file proposal.md\`: it is your report, and submitting moves the issue to proposal_review. End your turn without a comment restating or summarising it.`,
        '- If you only answered comments, end your turn.',
      ]
    : [
        `- Post a comment on ${context.identifier} that says what you did and what is left, with links to branches or pull requests.`,
        moves.length > 0
          ? `- Move the issue to the status that fits (\`nb-studio issue update ${context.identifier} --status <status>\`); you may move it to: ${moves.join(', ')}.`
          : '- Leave the status as it is: the workflow does not let you move it from here.',
      ];
  return [
    `Issue ${context.identifier}: ${context.title}`,
    '',
    ...(reasons.length > 0 ? reasons : ['Continue the work on this issue.']),
    ...stages,
    '',
    'When you finish:',
    ...finish,
  ].join('\n');
}

/** Whether the issue is in Analysis, where its agent submits a design proposal (`design.ts`) as its report. */
export function isDesignStage(context: Pick<IssueContext, 'status'>): boolean {
  return context.status.key === ANALYSIS_STATUS;
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
    ...(context.pendingApproval
      ? [
          `- Waiting for approval to move to ${context.pendingApproval.toStatus}`,
        ]
      : []),
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
  if (context.checklist)
    lines.push(
      '',
      `## Checklist (${context.checklist.complete ? 'complete' : 'incomplete'})`,
      '',
      ...context.checklist.items.map(
        (item) =>
          `- [${item.checked ? 'x' : ' '}] ${item.label}${item.required ? ' (required)' : ''}`,
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

/** What the init issue's agent is told: its run makes the empty repository's first commit, on the default branch. */
export function initialNote(defaultBranch: string): string {
  return [
    '## Initializing the repository',
    '',
    `This issue initializes the project: its repository is empty, and your checkout is on its default branch, \`${defaultBranch}\`, with no commit yet. Make the first commit there and push it with \`git push origin ${defaultBranch}\`; this run alone may push the default branch. Do not open a pull request, whatever other instructions say. Once the push reached the host and your run ends successfully, Studio moves this issue to done and the project's other issues start.`,
  ].join('\n');
}

export function createIssueContextProvider(
  agents: Pick<Agents, 'runs' | 'briefs'>,
  projects: () => Pick<Projects, 'issueContext'>,
): ContextProvider {
  return {
    async assemble(conn, claim) {
      const context = await projects().issueContext.contextFor(
        conn,
        claim.run.subject.id,
        { kind: AGENT_KIND },
      );
      if (!context) throw new Error('The issue is gone.');
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
      const initial = await initialDirOf(
        conn,
        context.id,
        context.project?.id ?? null,
      );
      return {
        subject: {
          key: context.identifier,
          title: context.title,
          url: context.url,
          noun: SUBJECT_NOUN,
        },
        guidance: issueGuidance(context.identifier, claim.cli, {
          attach: claim.agent.actions.includes(ATTACH_ACTION),
          design: isDesignStage(context),
        }),
        task: renderTask(context, claim.inputs),
        context: initial
          ? [
              renderIssueContext(context),
              initialNote(initial.defaultBranch),
            ].join('\n\n')
          : renderIssueContext(context),
        turn: {
          prompt: agents.briefs.turnPrompt(claim.inputs, { subject }),
          ...(previousSummary ? { previousSummary } : {}),
        },
        data: { kind: ISSUE_SUBJECT, issue: context },
        dirs: dirsOf(
          context,
          await runBranches(
            conn,
            context.project?.repos ?? [],
            context.identifier,
          ),
          initial,
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
    { key: 'todo', name: sampleValue('To do'), category: 'unstarted' },
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
    checklist: null,
    pendingApproval: null,
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
          attach: claim.agent.actions.includes(ATTACH_ACTION),
          design: isDesignStage(context),
        }),
        task: renderTask(context, claim.inputs),
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
  agents: Pick<Agents, 'runs' | 'briefs'>,
  projects: () => Pick<Projects, 'issueContext'>,
  sink: SubjectBinding['sink'],
  queuedExpiryMs = 0,
): SubjectBinding {
  return {
    kind: ISSUE_SUBJECT,
    // The issue's owner answers for its work: a run request is confirmed or rejected by its owner at that moment.
    responsibleUserId: issueResponsible,
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
