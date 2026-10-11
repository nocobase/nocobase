// @vitest-environment node
/**
 * Workflow stages that wake agents: the `runAgent` and `suggestExecutor` status rules Studio contributes, and the
 * "Software development" template that uses them.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { RUNNER_ROUTES, type FailureReason } from '@nocobase/agent-protocol';
import {
  ANY_STATUS,
  type WorkflowListItem,
  type WorkflowStatusRule,
} from '@nocobase/app-plugin-projects/shared/workflows';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  ANALYSIS_INSTRUCTION,
  CODE_REVIEW_INSTRUCTION,
  IN_PROGRESS_INSTRUCTION,
  PROPOSAL_REVIEW_INSTRUCTION,
  SOFTWARE_TEMPLATE,
  UI_REVIEW_INSTRUCTION,
} from '../../server/agents/catalog/workflow-templates.js';
import {
  currentStage,
  EXECUTOR_SUGGESTED,
  renderInstruction,
  STAGE_ACTION_PROBLEM,
  STAGE_RUN_LIMIT,
  STATUS_RULE_PLAN_SOURCE,
  settleSuggestions,
} from '../../server/agents/stage-rules.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import {
  continueStageRun,
  pendingStageRun,
} from '../../server/agents/continue-stage-run.js';

let h: BridgeHarness;
let planned: any[];
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob', 'carol']) await h.addUser(id);
  planned = [];
  h.projects.events.on('notice.planned', (event) => {
    planned.push(event.notice);
  });
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');
/** A move another agent makes: the kind of entry the loop guard counts and stops. */
const byAgent = () => ({
  ...alice(),
  actor: { type: 'agent', id: 'a-mover' },
});

async function asAdmin<T>(run: () => Promise<T>): Promise<T> {
  const before = h.roles.get('alice');
  h.roles.set('alice', 'admin');
  try {
    return await run();
  } finally {
    if (before) h.roles.set('alice', before);
    else h.roles.delete('alice');
  }
}

/** Installs the template and makes it the default workflow. */
async function installSoftwareAsDefault(): Promise<WorkflowListItem> {
  expect(await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE)).toBe(
    true,
  );
  return asAdmin(async () => {
    const software = (await h.projects.workflows.list(alice())).find(
      (workflow) => workflow.builtInKey === 'software',
    )!;
    return h.projects.workflows.setDefault(alice(), software.id);
  });
}

/** The default workflow: the projects plugin ships none, so one is made of the built-in statuses the first time. */
async function defaultWorkflow(): Promise<WorkflowListItem> {
  return asAdmin(async () => {
    const found = (await h.projects.workflows.list(alice())).find(
      (workflow) => workflow.isDefault,
    );
    if (found) return found;
    const created = await h.projects.workflows.create(alice(), {
      name: 'Standard',
      copyFrom: null,
    });
    return h.projects.workflows.setDefault(alice(), created.id);
  });
}

/** Gives the default workflow's statuses these rules. */
async function setRules(
  rules: Readonly<Record<string, readonly WorkflowStatusRule[]>>,
  options: { readonly agentMoves?: boolean } = {},
): Promise<void> {
  const workflow = await defaultWorkflow();
  await asAdmin(async () => {
    await h.projects.workflows.update(alice(), workflow.id, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        // Lets agents move issues into the statuses that carry the rules, as a review loop does.
        ...(options.agentMoves
          ? {
              transitions: [
                ...workflow.definition.transitions.filter(
                  (transition) =>
                    !(
                      transition.actors.includes('agent') &&
                      transition.to in rules
                    ),
                ),
                ...Object.keys(rules).map((to) => ({
                  from: ANY_STATUS,
                  to,
                  actors: ['agent'],
                })),
              ],
            }
          : {}),
        states: workflow.definition.states.map((state) =>
          rules[state.key] ? { ...state, rules: rules[state.key] } : state,
        ),
      },
    });
  });
}

async function moveTo(issue: Issue, statusKey: string, viewer = alice()) {
  const current = await h.projects.issueQueries.detail(viewer, issue.id);
  return h.projects.issues.update(viewer, issue.id, {
    revision: current.revision,
    statusKey,
  });
}

async function runsOf(issueId: string) {
  return h.agents.runs.list({ subjectKind: 'issue', subjectId: issueId });
}

async function finishStage(reason?: FailureReason, start = true) {
  const payload = await h.claimOne();
  expect(payload).toBeDefined();
  if (start) {
    const started = await h.runner(RUNNER_ROUTES.start, payload.run.id, {
      workDir: '/tmp/stage-work',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
    expect(started.status).toBe(200);
  }
  const ended = await h.runner(
    reason ? RUNNER_ROUTES.fail : RUNNER_ROUTES.complete,
    payload.run.id,
    reason
      ? { reason, detail: 'Test execution failure.' }
      : {
          summary: 'Stage finished.',
          handledInputIds: payload.inputs.map(
            (input: { id: string }) => input.id,
          ),
        },
  );
  expect(ended.status).toBe(200);
  return payload.run.id as string;
}

async function openPlans(userId: string) {
  return (
    await h.projects.plans.list(h.viewer(userId), {
      status: 'open',
      sourceKind: STATUS_RULE_PLAN_SOURCE,
    })
  ).data;
}

async function activities(issueId: string) {
  const page = await asAdmin(() =>
    h.projects.issueQueries.activities(alice(), issueId, {}),
  );
  return page.data;
}

describe('the Software development template', () => {
  it('is installed as the default while there is none, with the agent moves and the stage rules', async () => {
    expect(await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE)).toBe(
      true,
    );
    const list = await h.projects.workflows.list(alice());
    expect(
      list.map((workflow) => [workflow.builtInKey, workflow.isDefault]),
    ).toEqual([['software', true]]);
    const software = list[0]!;
    expect(software).toMatchObject({
      name: 'Software development',
      title: {
        key: 'studioAgents.workflowTemplates.software',
        ns: '@nocobase/i18n/application',
      },
      description: expect.stringContaining(
        'The Solution designer analyses and proposes',
      ),
      descriptionTitle: {
        key: 'studioAgents.workflowTemplates.softwareDescription',
        ns: '@nocobase/i18n/application',
      },
    });
    expect(software.definition.transitions).toEqual(
      expect.arrayContaining([
        { from: 'todo', to: 'in_progress', actors: ['agent'] },
        { from: 'blocked', to: 'in_progress', actors: ['agent'] },
        { from: 'in_progress', to: 'in_review', actors: ['agent'] },
        { from: 'in_progress', to: 'blocked', actors: ['agent'] },
        { from: 'proposal_review', to: 'analysis', actors: ['agent', 'user'] },
      ]),
    );
    // The system moves an issue only on `studio.merged`: no failed-run reset, no system send-back.
    expect(
      software.definition.transitions.filter((transition) =>
        transition.actors.includes('system'),
      ),
    ).toEqual([
      expect.objectContaining({ to: 'done', on: 'studio.merged' }),
      expect.objectContaining({ to: 'done', on: 'studio.merged' }),
    ]);
    // Every move the stage instructions ask for names its command.
    expect(IN_PROGRESS_INSTRUCTION).toContain(
      'nb-studio issue update {{issue.identifier}} --status in_review',
    );
    expect(IN_PROGRESS_INSTRUCTION).toContain(
      'nb-studio issue update {{issue.identifier}} --status blocked',
    );
    expect(ANALYSIS_INSTRUCTION).toContain(
      'nb-studio issue design-proposal {{issue.identifier}} --content-file proposal.md',
    );
    expect(ANALYSIS_INSTRUCTION).toContain(
      'nb-studio issue update {{issue.identifier}} --status blocked',
    );
    const rulesOf = (key: string) =>
      software.definition.states.find((state) => state.key === key)?.rules;
    expect(rulesOf('in_progress')).toEqual([
      { type: 'runAgent', config: { instruction: IN_PROGRESS_INSTRUCTION } },
    ]);
    // Each review and design stage goes to its role agent, which never becomes the executor; In progress runs the
    // executor.
    expect(rulesOf('analysis')).toContainEqual({
      type: 'runAgent',
      config: {
        agentId: 'studio-solution-designer',
        assign: false,
        instruction: ANALYSIS_INSTRUCTION,
      },
    });
    expect(rulesOf('proposal_review')).toEqual([
      {
        type: 'runAgent',
        config: {
          agentId: 'studio-proposal-reviewer',
          assign: false,
          instruction: PROPOSAL_REVIEW_INSTRUCTION,
        },
      },
    ]);
    expect(rulesOf('in_review')).toEqual([
      expect.objectContaining({ type: 'notifyOwner' }),
      {
        type: 'runAgent',
        config: {
          agentId: 'studio-code-reviewer',
          assign: false,
          instruction: CODE_REVIEW_INSTRUCTION,
        },
      },
    ]);
    // UI review is the template's own started status, between Proposal review and In progress, run by the frontend
    // designer.
    const keys = software.definition.states.map((state) => state.key);
    expect(keys.indexOf('ui_review')).toBe(keys.indexOf('proposal_review') + 1);
    expect(keys.indexOf('in_progress')).toBeGreaterThan(
      keys.indexOf('ui_review'),
    );
    expect(
      software.definition.states.find((state) => state.key === 'ui_review'),
    ).toMatchObject({ category: 'started', name: '前端评审' });
    expect(rulesOf('ui_review')).toEqual([
      {
        type: 'runAgent',
        config: {
          agentId: 'studio-frontend-designer',
          assign: false,
          instruction: UI_REVIEW_INSTRUCTION,
        },
      },
    ]);
    // Every reviewer comments; the proposal reviewer passes an approved proposal on to UI review or development, the
    // frontend designer on to development or back to analysis, and the code reviewer moves nothing.
    for (const instruction of [
      PROPOSAL_REVIEW_INSTRUCTION,
      UI_REVIEW_INSTRUCTION,
      CODE_REVIEW_INSTRUCTION,
    ])
      expect(instruction).toContain(
        'nb-studio issue comment add {{issue.identifier}} --content-file review.md',
      );
    expect(PROPOSAL_REVIEW_INSTRUCTION).toContain(
      'nb-studio issue update {{issue.identifier}} --status ui_review',
    );
    expect(PROPOSAL_REVIEW_INSTRUCTION).toContain(
      'nb-studio issue update {{issue.identifier}} --status in_progress',
    );
    expect(UI_REVIEW_INSTRUCTION).toContain(
      'nb-studio issue update {{issue.identifier}} --status in_progress',
    );
    expect(UI_REVIEW_INSTRUCTION).toContain(
      'nb-studio issue update {{issue.identifier}} --status analysis',
    );
    expect(UI_REVIEW_INSTRUCTION).toContain('mention://user/');
    expect(PROPOSAL_REVIEW_INSTRUCTION).toContain(
      'nb-studio issue update {{issue.identifier}} --status analysis',
    );
    expect(CODE_REVIEW_INSTRUCTION).not.toContain('--status');
    // Previews follow pull requests, not the issue's status: finishing an issue runs nothing.
    expect(rulesOf('done')).toBeUndefined();
    expect(rulesOf('cancelled')).toBeUndefined();
  });

  it('offers three ways to start and asks for no approval on any move', () => {
    const { states, transitions } = SOFTWARE_TEMPLATE.definition;
    const startOf = (key: string) =>
      states
        .find((state) => state.key === key)
        ?.rules?.filter((rule) => rule.type === 'startOption')
        .map((rule) => (rule.config as any).label.key);
    expect(startOf('todo')).toEqual([
      'studioAgents.templateStarts.developLabel',
    ]);
    expect(startOf('analysis')).toEqual([
      'studioAgents.templateStarts.designLabel',
    ]);
    expect(startOf('backlog')).toEqual([
      'studioAgents.templateStarts.backlogLabel',
    ]);
    expect(
      transitions.filter((transition) => 'approval' in transition),
    ).toEqual([]);
    expect(transitions).toEqual(
      expect.arrayContaining([
        { from: '*', to: '*', actors: ['user'] },
        { from: 'analysis', to: 'proposal_review', actors: ['agent', 'user'] },
        {
          from: 'proposal_review',
          to: 'in_progress',
          actors: ['agent', 'user'],
        },
        { from: 'proposal_review', to: 'ui_review', actors: ['agent', 'user'] },
        { from: 'ui_review', to: 'in_progress', actors: ['agent', 'user'] },
        { from: 'ui_review', to: 'analysis', actors: ['agent', 'user'] },
        {
          from: 'in_review',
          to: 'done',
          actors: ['system'],
          on: 'studio.merged',
        },
        {
          from: 'in_progress',
          to: 'done',
          actors: ['system'],
          on: 'studio.merged',
        },
      ]),
    );
    // An agent never skips the proposal: nothing takes it from Analysis (or anywhere) straight to In progress.
    expect(
      transitions.filter(
        (transition) =>
          transition.actors.includes('agent') &&
          transition.to === 'in_progress' &&
          ['analysis', '*'].includes(transition.from),
      ),
    ).toEqual([]);
  });

  it('lets an agent propose, and a reviewer pass a design on through UI review or send it back', async () => {
    await installSoftwareAsDefault();
    const agentId = await h.createAgent();
    const asAgent = { ...alice(), actor: { type: 'agent', id: agentId } };
    const issue = await h.projects.issues.create(alice(), {
      title: 'Design it',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    const statusOf = async () =>
      (await h.projects.issueQueries.detail(alice(), issue.id)).statusKey;

    await moveTo(issue, 'analysis');
    await expect(moveTo(issue, 'in_progress', asAgent)).rejects.toMatchObject({
      code: 'TRANSITION_NOT_ALLOWED',
    });
    await moveTo(issue, 'proposal_review', asAgent);
    expect(await statusOf()).toBe('proposal_review');
    // The proposal reviewer sends it back with the changes it needs.
    await moveTo(issue, 'analysis', asAgent);
    expect(await statusOf()).toBe('analysis');
    await moveTo(issue, 'proposal_review', asAgent);

    // A reviewer passes it to UI review, which sends it back to Analysis or on to In progress.
    await moveTo(issue, 'ui_review', asAgent);
    expect(await statusOf()).toBe('ui_review');
    await moveTo(issue, 'analysis', asAgent);
    expect(await statusOf()).toBe('analysis');
    await moveTo(issue, 'proposal_review', asAgent);
    await moveTo(issue, 'ui_review', asAgent);
    await moveTo(issue, 'in_progress', asAgent);
    expect(await statusOf()).toBe('in_progress');

    // Without interface changes the reviewer passes it straight on; a person may approve or send back too.
    await moveTo(issue, 'analysis');
    await moveTo(issue, 'proposal_review', asAgent);
    await moveTo(issue, 'in_progress', asAgent);
    expect(await statusOf()).toBe('in_progress');
    await moveTo(issue, 'analysis');
    await moveTo(issue, 'proposal_review', asAgent);
    await moveTo(issue, 'analysis');
    expect(await statusOf()).toBe('analysis');
  });

  it('moves an issue to Done on merge from In review or In progress, and lets a person do so without approval', async () => {
    await installSoftwareAsDefault();
    const create = (title: string) =>
      h.projects.issues.create(alice(), { title, start: false });
    const reviewed = await create('Reviewed');
    await moveTo(reviewed, 'in_progress');
    await moveTo(reviewed, 'in_review');
    const working = await create('Working');
    await moveTo(working, 'in_progress');

    const moves = await h.projects.workflowEvents.fire({
      event: 'studio.merged',
      issueIds: [reviewed.id, working.id],
    });
    expect(moves).toEqual([
      expect.objectContaining({
        outcome: 'moved',
        from: 'in_review',
        to: 'done',
      }),
      expect.objectContaining({
        outcome: 'moved',
        from: 'in_progress',
        to: 'done',
      }),
    ]);

    // A person moves to Done by hand at once, from either status.
    for (const from of ['in_review', 'in_progress']) {
      const issue = await create(`By hand from ${from}`);
      await moveTo(issue, 'in_progress');
      if (from === 'in_review') await moveTo(issue, 'in_review');
      await moveTo(issue, 'done');
      expect(
        (await h.projects.issueQueries.detail(alice(), issue.id)).statusKey,
      ).toBe('done');
    }
  });

  it('runs the issue’s agent with the stage instruction when the issue enters In progress', async () => {
    await installSoftwareAsDefault();
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Fix login',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    expect(await runsOf(issue.id)).toEqual([]);

    await moveTo(issue, 'in_progress');

    const [run] = await runsOf(issue.id);
    expect(run).toMatchObject({ agentId, actorUserId: 'alice' });
    const instruction = renderInstruction(IN_PROGRESS_INSTRUCTION, {
      'issue.identifier': issue.identifier,
      'issue.title': 'Fix login',
      from: 'todo',
      to: 'in_progress',
      'owner.name': 'alice',
    });
    expect(instruction).toContain(`Work on ${issue.identifier} (Fix login)`);
    expect(instruction).toContain('what you need from alice');
    const detail = await h.agents.runs.detail(run!.id);
    // Only the stage's input: the status change is not told a second time.
    expect(detail.inputs).toHaveLength(1);
    expect(detail.inputs[0]).toMatchObject({
      type: 'signal',
      payload: {
        trigger: 'stageEntered',
        from: 'todo',
        to: 'in_progress',
        instruction,
      },
    });
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'stage_action_applied',
      )?.details,
    ).toMatchObject({ rule: 'runAgent', agentId, runId: run!.id });

    // The run's task carries the workflow stage instruction.
    const payload = await h.claimOne();
    const system = payload.prompt.system as string;
    expect(system).toContain('## Workflow stage instruction');
    expect(system).toContain(`> Work on ${issue.identifier} (Fix login)`);
    expect(system).toContain('The issue entered `in_progress` (from `todo`).');
  });

  it('lets the agent move the issue on without waking itself again', async () => {
    await installSoftwareAsDefault();
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Self',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await moveTo(issue, 'in_progress');
    await moveTo(issue, 'blocked');
    planned.length = 0;
    // The agent moves its issue back in itself: nothing wakes it again, and nobody is told.
    const asAgent = { ...alice(), actor: { type: 'agent', id: agentId } };
    await moveTo(issue, 'in_progress', asAgent);
    expect(await runsOf(issue.id)).toHaveLength(1);
    expect(
      (await activities(issue.id)).find(
        (entry) =>
          entry.action === 'stage_action_skipped' &&
          entry.details.reason === 'selfTriggered',
      ),
    ).toBeDefined();
    expect(
      planned.filter((notice) => notice.type === STAGE_ACTION_PROBLEM),
    ).toEqual([]);
  });
});

describe('runAgent', () => {
  it('makes a named agent the executor and runs it', async () => {
    const agentId = await h.createAgent({ name: 'Builder' });
    await setRules({
      in_progress: [
        {
          type: 'runAgent',
          config: { agentId, instruction: 'Build {{issue.identifier}}.' },
        },
      ],
    });
    const issue = await h.projects.issues.create(alice(), { title: 'A' });
    const moved = await moveTo(issue, 'in_progress');
    expect(moved.executor).toEqual({ type: 'agent', id: agentId });
    const runs = await runsOf(issue.id);
    expect(runs).toHaveLength(1);
    const detail = await h.agents.runs.detail(runs[0]!.id);
    expect(
      detail.inputs.find(
        (input) =>
          (input.payload as { trigger?: string }).trigger === 'stageEntered',
      )?.payload,
    ).toMatchObject({ instruction: `Build ${issue.identifier}.` });
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'executor_changed',
      )?.details,
    ).toMatchObject({ trigger: 'stageEntered', rule: 'runAgent' });
  });

  it('runs a reviewer without making it the executor', async () => {
    const coder = await h.createAgent({ name: 'Coder' });
    const reviewer = await h.createAgent({ name: 'Reviewer' });
    await setRules({
      in_review: [
        { type: 'runAgent', config: { agentId: reviewer, assign: false } },
      ],
    });
    const issue = await h.projects.issues.create(alice(), {
      title: 'A',
      executor: { type: 'agent', id: coder },
      start: false,
    });
    const moved = await moveTo(issue, 'in_review');
    expect(moved.executor).toEqual({ type: 'agent', id: coder });
    expect((await runsOf(issue.id)).map((run) => run.agentId)).toEqual([
      reviewer,
    ]);
  });

  /** A rule handing `status` to `agentId` without making it the executor, as the template's reviews do. */
  const handOver = (status: string, agentId: string, words: string) => ({
    [status]: [
      {
        type: 'runAgent',
        config: {
          agentId,
          assign: false,
          instruction: `${words} {{issue.identifier}}.`,
        },
      },
    ],
  });

  /** The issue's activities of `action`. */
  const activitiesOf = async (issueId: string, action: string) =>
    (await activities(issueId)).filter((entry) => entry.action === action);

  it('only records an executor set in a status whose stage is another agent’s, and wakes it on entering In progress', async () => {
    const reviewer = await h.createAgent({ name: 'Reviewer' });
    const coder = await h.createAgent({ name: 'Coder' });
    await setRules({
      ...handOver('proposal_review', reviewer, 'Review'),
      in_progress: [
        {
          type: 'runAgent',
          config: { instruction: 'Build {{issue.identifier}}.' },
        },
      ],
    });
    const issue = await h.projects.issues.create(alice(), {
      title: 'A',
      start: false,
    });
    await moveTo(issue, 'proposal_review');
    expect((await runsOf(issue.id)).map((run) => run.agentId)).toEqual([
      reviewer,
    ]);
    // Setting the executor in review records it and wakes nobody, the reviewer included.
    const current = await h.projects.issueQueries.detail(alice(), issue.id);
    await h.projects.issues.update(alice(), issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: coder },
    });
    expect((await runsOf(issue.id)).map((run) => run.agentId)).toEqual([
      reviewer,
    ]);
    expect(
      (await activitiesOf(issue.id, 'executor_waits')).map(
        (entry) => entry.details,
      ),
    ).toEqual([{ agentId: coder, name: 'Coder', status: 'proposal_review' }]);
    // Approved, it enters In progress: the executor is woken once, with the stage's instruction.
    await moveTo(issue, 'in_progress');
    const coderRuns = (await runsOf(issue.id)).filter(
      (run) => run.agentId === coder,
    );
    expect(coderRuns).toHaveLength(1);
    const inputs = (await h.agents.runs.detail(coderRuns[0]!.id)).inputs;
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toMatchObject({
      payload: {
        trigger: 'stageEntered',
        instruction: `Build ${issue.identifier}.`,
      },
    });
  });

  it('hands an issue sent back from In review to the executor chosen there', async () => {
    const codeReviewer = await h.createAgent({ name: 'Code reviewer' });
    const first = await h.createAgent({ name: 'First' });
    const second = await h.createAgent({ name: 'Second' });
    await setRules({
      ...handOver('in_review', codeReviewer, 'Review'),
      in_progress: [
        {
          type: 'runAgent',
          config: { instruction: 'Fix {{issue.identifier}}.' },
        },
      ],
    });
    const issue = await h.projects.issues.create(alice(), {
      title: 'A',
      executor: { type: 'agent', id: first },
      start: false,
    });
    await moveTo(issue, 'in_review');
    const before = (await runsOf(issue.id)).map((run) => run.agentId);
    expect(before).toEqual([codeReviewer]);
    const current = await h.projects.issueQueries.detail(alice(), issue.id);
    await h.projects.issues.update(alice(), issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: second },
    });
    expect((await runsOf(issue.id)).map((run) => run.agentId)).toEqual(before);
    // Changes requested: back in In progress, the new executor takes it over with the stage's instruction.
    await moveTo(issue, 'in_progress');
    const taken = (await runsOf(issue.id)).filter(
      (run) => run.agentId === second,
    );
    expect(taken).toHaveLength(1);
    expect((await h.agents.runs.detail(taken[0]!.id)).inputs[0]).toMatchObject({
      payload: {
        trigger: 'stageEntered',
        instruction: `Fix ${issue.identifier}.`,
      },
    });
    expect(
      (await runsOf(issue.id)).filter((run) => run.agentId === first),
    ).toEqual([]);
  });

  it('starts an executor set in a status that runs no agent at once', async () => {
    const reviewer = await h.createAgent({ name: 'Reviewer' });
    const coder = await h.createAgent({ name: 'Coder' });
    await setRules(handOver('proposal_review', reviewer, 'Review'));
    const issue = await h.projects.issues.create(alice(), { title: 'A' });
    const current = await h.projects.issueQueries.detail(alice(), issue.id);
    await h.projects.issues.update(alice(), issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: coder },
    });
    expect((await runsOf(issue.id)).map((run) => run.agentId)).toEqual([coder]);
    expect(await activitiesOf(issue.id, 'executor_waits')).toEqual([]);
  });

  it('asks the owner to assign an executor in In progress, and starts the one assigned there at once', async () => {
    const coder = await h.createAgent({ name: 'Coder' });
    await setRules({
      in_progress: [
        {
          type: 'runAgent',
          config: { instruction: 'Build {{issue.identifier}}.' },
        },
      ],
    });
    const issue = await h.projects.issues.create(alice(), { title: 'A' });
    await moveTo(issue, 'in_progress');
    await expect
      .poll(() => planned.map((notice) => notice.type))
      .toEqual([STAGE_ACTION_PROBLEM]);
    expect(planned[0]).toMatchObject({
      userIds: ['alice'],
      params: { reason: 'noAgentExecutor' },
    });
    const current = await h.projects.issueQueries.detail(alice(), issue.id);
    await h.projects.issues.update(alice(), issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: coder },
    });
    const [run] = await runsOf(issue.id);
    expect(run?.agentId).toBe(coder);
    expect((await h.agents.runs.detail(run!.id)).inputs[0]).toMatchObject({
      payload: {
        trigger: 'assigned',
        status: 'in_progress',
        instruction: `Build ${issue.identifier}.`,
      },
    });
  });

  it('starts a handed-over stage once for an issue created there, with or without an executor', async () => {
    const designer = await h.createAgent({ name: 'Designer' });
    const coder = await h.createAgent({ name: 'Coder' });
    await setRules(handOver('analysis', designer, 'Design'));
    const bare = await h.projects.issues.create(alice(), {
      title: 'A',
      statusKey: 'analysis',
    });
    // The stage starts once the creation commits.
    await expect
      .poll(async () => (await runsOf(bare.id)).map((run) => run.agentId))
      .toEqual([designer]);
    const [run] = await runsOf(bare.id);
    expect((await h.agents.runs.detail(run!.id)).inputs[0]).toMatchObject({
      payload: {
        trigger: 'created',
        status: 'analysis',
        instruction: `Design ${bare.identifier}.`,
      },
    });
    expect(
      (await h.projects.issueQueries.detail(alice(), bare.id)).executor,
    ).toBeNull();
    // With an executor: the designer runs once, and the executor waits.
    const given = await h.projects.issues.create(alice(), {
      title: 'B',
      statusKey: 'analysis',
      executor: { type: 'agent', id: coder },
    });
    await expect
      .poll(async () => (await runsOf(given.id)).map((run) => run.agentId))
      .toEqual([designer]);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect((await runsOf(given.id)).map((run) => run.agentId)).toEqual([
      designer,
    ]);
    expect(
      (await h.agents.runs.detail((await runsOf(given.id))[0]!.id)).inputs,
    ).toHaveLength(1);
    // Where no agent is handed the status, nothing starts.
    const plain = await h.projects.issues.create(alice(), { title: 'C' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(await runsOf(plain.id)).toEqual([]);
  });

  it('starts no handed-over stage for a creator who may not wake its agent', async () => {
    // Only bob may wake this designer; alice creates the issue.
    const designer = await h.createAgent({
      name: 'Private designer',
      access: 'ownerOnly',
      ownerUserId: 'bob',
    });
    await setRules(handOver('analysis', designer, 'Design'));
    const issue = await h.projects.issues.create(alice(), {
      title: 'A',
      statusKey: 'analysis',
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(await runsOf(issue.id)).toEqual([]);
  });

  it('starts a handed-over stage once nothing holds the issue, whatever its executor', async () => {
    const designer = await h.createAgent({ name: 'Designer' });
    const reviewer = await h.createAgent({ name: 'Reviewer' });
    await setRules({
      ...handOver('analysis', designer, 'Design'),
      ...handOver('proposal_review', reviewer, 'Review'),
    });
    const finish = async (issue: Issue) => moveTo(issue, 'done');

    // Created in Analysis with no executor, waiting for another issue: the designer starts once it is finished.
    const first = await h.projects.issues.create(alice(), { title: 'First' });
    const waiting = await h.projects.issues.create(alice(), {
      title: 'Waiting',
      statusKey: 'analysis',
      blockedBy: [first.id],
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(await runsOf(waiting.id)).toEqual([]);
    await finish(first);
    await expect
      .poll(async () => (await runsOf(waiting.id)).map((run) => run.agentId))
      .toEqual([designer]);
    const [run] = await runsOf(waiting.id);
    expect((await h.agents.runs.detail(run!.id)).inputs[0]).toMatchObject({
      payload: { trigger: 'unblocked', status: 'analysis' },
    });

    // In review with a person executing it, waiting for another issue: the reviewer starts once it is finished.
    const second = await h.projects.issues.create(alice(), { title: 'Second' });
    const held = await h.projects.issues.create(alice(), {
      title: 'Held',
      executor: { type: 'user', id: 'bob' },
      blockedBy: [second.id],
      start: false,
    });
    await moveTo(held, 'proposal_review');
    expect(await runsOf(held.id)).toEqual([]);
    await finish(second);
    await expect
      .poll(async () => (await runsOf(held.id)).map((run) => run.agentId))
      .toEqual([reviewer]);
  });

  it('takes the executor’s own rule over another agent’s, with or without an instruction', async () => {
    const issue = {
      id: 'i1',
      identifier: 'PM-1',
      title: 'A',
      statusKey: 'in_review',
      projectId: null,
      ownerUserId: 'alice',
    } as unknown as Issue;
    const projects = (rules: readonly unknown[]) =>
      ({
        workflows: {
          catalogs: {
            forProject: async () => ({
              machine: { states: [{ key: 'in_review', rules }] },
            }),
          },
        },
      }) as never;
    const conn = h.database.connection();
    const reviewerRule = {
      type: 'runAgent',
      config: { agentId: 'reviewer', assign: false, instruction: 'Review.' },
    };
    // The executor's own rule wins even with no instruction of its own.
    expect(
      await currentStage(
        projects([reviewerRule, { type: 'runAgent', config: {} }]),
        conn,
        issue,
        'coder',
      ),
    ).toEqual({ agentId: 'coder', instruction: null });
    // Without one, the status is the reviewer's.
    expect(
      await currentStage(projects([reviewerRule]), conn, issue, 'coder'),
    ).toEqual({ agentId: 'reviewer', instruction: 'Review.' });
  });

  it('proposes the agent to the owner instead when the mover may not wake it', async () => {
    // Only bob, who owns the issue, may wake this agent; alice moves it.
    const agentId = await h.createAgent({
      name: 'Private',
      access: 'ownerOnly',
      ownerUserId: 'bob',
    });
    await setRules({
      in_progress: [{ type: 'runAgent', config: { agentId } }],
    });
    const issue = await h.projects.issues.create(bob(), { title: 'Mine' });

    const moved = await moveTo(issue, 'in_progress', alice());

    expect(moved.statusKey).toBe('in_progress');
    expect(moved.executor).toBeNull();
    expect(await runsOf(issue.id)).toEqual([]);
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'stage_action_skipped',
      )?.details,
    ).toMatchObject({
      rule: 'runAgent',
      reason: 'cannotInvoke',
      userId: 'alice',
      downgradedTo: 'suggestExecutor',
      suggested: true,
    });
    await expect.poll(async () => (await openPlans('bob')).length).toBe(1);
    const [plan] = await openPlans('bob');
    expect(plan).toMatchObject({
      title: `Let Private work on ${issue.identifier}`,
      source: { kind: STATUS_RULE_PLAN_SOURCE, issueId: issue.id },
      deciderUserId: 'bob',
      rows: [
        {
          op: 'issue.update',
          params: {
            issue: issue.id,
            set: { executor: { type: 'agent', id: agentId } },
            start: true,
          },
        },
      ],
    });
    await expect
      .poll(() =>
        planned
          .map((notice) => notice.type)
          .filter((type) => type !== 'status_changed')
          .sort(),
      )
      .toEqual([EXECUTOR_SUGGESTED, STAGE_ACTION_PROBLEM]);
    expect(
      planned.find((notice) => notice.type === STAGE_ACTION_PROBLEM)?.params
        .body,
    ).toBe(
      'The runAgent action of In progress was skipped (cannotInvoke): the person who moved the issue may not wake the agent.',
    );
  });

  it('tells the owner, and proposes nothing, when neither the mover nor the owner may wake the agent', async () => {
    const agentId = await h.createAgent({
      name: 'Private',
      access: 'ownerOnly',
    });
    await setRules({
      in_progress: [{ type: 'runAgent', config: { agentId } }],
    });
    const issue = await h.projects.issues.create(bob(), { title: 'Mine' });
    await moveTo(issue, 'in_progress', bob());
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'stage_action_skipped',
      )?.details,
    ).toMatchObject({ reason: 'cannotInvoke', suggested: false });
    await expect
      .poll(() => planned.map((notice) => notice.type))
      .toEqual([STAGE_ACTION_PROBLEM]);
    expect(await openPlans('bob')).toEqual([]);
  });

  it('tells the owner when there is no agent to run', async () => {
    await setRules({ in_progress: [{ type: 'runAgent' }] });
    const issue = await h.projects.issues.create(alice(), { title: 'A' });
    await moveTo(issue, 'in_progress');
    expect(await runsOf(issue.id)).toEqual([]);
    await expect
      .poll(() => planned.map((notice) => notice.type))
      .toEqual([STAGE_ACTION_PROBLEM]);
    expect(planned[0]).toMatchObject({
      userIds: ['alice'],
      params: { reason: 'noAgentExecutor', rule: 'runAgent' },
    });
  });

  it(`starts at most ${STAGE_RUN_LIMIT} agent-driven stage runs per issue and status within the window`, async () => {
    const agentId = await h.createAgent();
    await setRules(
      { in_progress: [{ type: 'runAgent' }] },
      { agentMoves: true },
    );
    const issue = await h.projects.issues.create(alice(), {
      title: 'Loop',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    for (let round = 0; round < STAGE_RUN_LIMIT + 1; round += 1) {
      await moveTo(issue, 'in_progress', byAgent());
      if (round < STAGE_RUN_LIMIT) await finishStage();
      await moveTo(issue, 'todo');
    }
    const stageInputs = [];
    for (const run of await runsOf(issue.id))
      for (const input of (await h.agents.runs.detail(run.id)).inputs)
        if ((input.payload as { trigger?: string }).trigger === 'stageEntered')
          stageInputs.push(input);
    expect(stageInputs).toHaveLength(STAGE_RUN_LIMIT);
    const skipped = (await activities(issue.id)).filter(
      (entry) =>
        entry.action === 'stage_action_skipped' &&
        entry.details.reason === 'suppressed',
    );
    expect(skipped).toHaveLength(1);
    expect(skipped[0]!.details).toMatchObject({
      limit: STAGE_RUN_LIMIT,
      windowHours: 24,
    });
  });

  it.each([
    'checkoutFailed',
    'setupFailed',
    'leaseExpired',
    'toolNetwork',
    'prepareNetwork',
    'cancelled',
  ] as const)('does not count %s failures after starting', async (reason) => {
    const agentId = await h.createAgent({ maxAttempts: 1 });
    await setRules(
      {
        in_progress: [{ type: 'runAgent', config: { maxRuns: 1 } }],
      },
      { agentMoves: true },
    );
    const issue = await h.projects.issues.create(alice(), {
      title: 'Environment failure',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await moveTo(issue, 'in_progress', byAgent());
    await finishStage(reason);
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    expect(await pendingStageRun(h.projects, alice(), issue.id)).toBeNull();
    expect(
      (await runsOf(issue.id)).filter((run) => run.status === 'queued'),
    ).toHaveLength(1);
  });

  it('does not count a run that never started, but counts an agent failure after starting', async () => {
    const agentId = await h.createAgent({ maxAttempts: 1 });
    await setRules(
      {
        in_progress: [{ type: 'runAgent', config: { maxRuns: 1 } }],
      },
      { agentMoves: true },
    );
    const issue = await h.projects.issues.create(alice(), {
      title: 'Not started',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await moveTo(issue, 'in_progress', byAgent());
    await finishStage('unknown', false);
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    expect(await pendingStageRun(h.projects, alice(), issue.id)).toBeNull();
    await finishStage('toolProcess');
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    expect(await pendingStageRun(h.projects, alice(), issue.id)).toMatchObject({
      maxRuns: 1,
      windowHours: 24,
    });
  });

  it('uses a custom limit and window, and continuing resets the count exactly once', async () => {
    const agentId = await h.createAgent();
    await setRules(
      {
        in_progress: [
          { type: 'runAgent', config: { maxRuns: 1, windowHours: 2 } },
        ],
      },
      { agentMoves: true },
    );
    const issue = await h.projects.issues.create(alice(), {
      title: 'Continue',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await moveTo(issue, 'in_progress', byAgent());
    await finishStage();
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    const pending = (await pendingStageRun(h.projects, alice(), issue.id))!;
    expect(pending).toMatchObject({ maxRuns: 1, windowHours: 2 });
    expect(planned.at(-1)).toMatchObject({
      type: STAGE_ACTION_PROBLEM,
      params: {
        reason: 'suppressed',
        limit: '1',
        windowHours: '2',
        continueToken: pending.token,
      },
    });
    const before = (await runsOf(issue.id)).length;
    const attempts = await Promise.all(
      [0, 1].map(() =>
        h.request('POST', `/issueStageRuns/${issue.id}/continue`, {
          user: 'alice',
          body: { token: pending.token },
        }),
      ),
    );
    expect(attempts.map((attempt) => attempt.status).sort()).toEqual([
      200, 400,
    ]);
    const continued = attempts.find((attempt) => attempt.status === 200)!;
    expect(
      (await h.agents.runs.detail(continued.body.data.runId)).inputs[0]
        ?.payload,
    ).toMatchObject({ continuedFrom: pending.token });
    expect((await runsOf(issue.id)).length).toBe(before + 1);
    expect(await pendingStageRun(h.projects, alice(), issue.id)).toBeNull();
    await expect(
      continueStageRun(h.projects, h.agents, alice(), issue.id, pending.token),
    ).rejects.toMatchObject({ reason: 'STAGE_CONTINUE_STALE' });
    // Before the continued run starts it consumes no execution count, so another entry may still deliver stage input.
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    expect(await pendingStageRun(h.projects, alice(), issue.id)).toBeNull();
    await finishStage();
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    expect(await pendingStageRun(h.projects, alice(), issue.id)).not.toBeNull();
  });

  it.each([
    { maxRuns: 0 },
    { maxRuns: -1 },
    { maxRuns: 1.5 },
    { maxRuns: '3' },
    { windowHours: 0 },
    { windowHours: 1.5 },
    { windowHours: null },
  ])('rejects invalid loop guard config %j', async (config) => {
    await expect(
      setRules({ in_progress: [{ type: 'runAgent', config }] }),
    ).rejects.toMatchObject({ code: 'INVALID_WORKFLOW' });
  });

  it('excludes executions outside a custom window while retaining them in the default window', async () => {
    const agentId = await h.createAgent();
    await setRules(
      {
        in_progress: [
          { type: 'runAgent', config: { maxRuns: 1, windowHours: 2 } },
        ],
      },
      { agentMoves: true },
    );
    const issue = await h.projects.issues.create(alice(), {
      title: 'Window',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await moveTo(issue, 'in_progress', byAgent());
    const runId = await finishStage();
    await h.database
      .connection()
      .repository('agRunInputs')
      .updateMany({
        filter: { runId },
        values: { createdAt: new Date(Date.now() - 3 * 3_600_000) },
      });
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    expect(await pendingStageRun(h.projects, alice(), issue.id)).toBeNull();
    await setRules(
      {
        in_progress: [{ type: 'runAgent', config: { maxRuns: 1 } }],
      },
      { agentMoves: true },
    );
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    expect(await pendingStageRun(h.projects, alice(), issue.id)).not.toBeNull();
  });

  it('requires an editor of the issue, refuses stale entries, and rolls back continuation when blocked', async () => {
    const agentId = await h.createAgent();
    await setRules(
      {
        in_progress: [
          { type: 'runAgent', config: { maxRuns: 1, assign: false, agentId } },
        ],
      },
      { agentMoves: true },
    );
    const issue = await h.projects.issues.create(alice(), {
      title: 'Owner continuation',
      start: false,
    });
    await moveTo(issue, 'in_progress', byAgent());
    await finishStage();
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    const pending = (await pendingStageRun(h.projects, alice(), issue.id))!;
    const url = `/issueStageRuns/${issue.id}`;
    expect((await h.request('GET', url)).status).toBe(401);
    // Another person who may edit the issue sees the continuation too; one who may not is refused before anything is written.
    expect(await pendingStageRun(h.projects, bob(), issue.id)).toMatchObject({
      token: pending.token,
    });
    h.roles.set('bob', 'none');
    expect(
      (
        await h.request('POST', `${url}/continue`, {
          user: 'bob',
          body: { token: pending.token },
        })
      ).status,
    ).toBe(403);
    expect(await pendingStageRun(h.projects, alice(), issue.id)).toMatchObject({
      token: pending.token,
    });
    const blocker = await h.projects.issues.create(alice(), {
      title: 'Blocker',
    });
    await h.projects.subtasks.addDependency(alice(), issue.id, {
      dependsOnIssueId: blocker.id,
    });
    await expect(
      continueStageRun(h.projects, h.agents, alice(), issue.id, pending.token),
    ).rejects.toMatchObject({ reason: 'STAGE_CONTINUE_UNAVAILABLE' });
    expect(await pendingStageRun(h.projects, alice(), issue.id)).toMatchObject({
      token: pending.token,
    });
    await moveTo(issue, 'todo');
    await expect(
      continueStageRun(h.projects, h.agents, alice(), issue.id, pending.token),
    ).rejects.toMatchObject({ reason: 'STAGE_CONTINUE_STALE' });
  });

  it('never stops a person: their move starts the run, is not counted, and restarts the count', async () => {
    const agentId = await h.createAgent();
    await setRules(
      {
        in_progress: [{ type: 'runAgent', config: { maxRuns: 1 } }],
      },
      { agentMoves: true },
    );
    const issue = await h.projects.issues.create(alice(), {
      title: 'Person over the limit',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await moveTo(issue, 'in_progress', byAgent());
    await finishStage();
    await moveTo(issue, 'todo');
    // An agent entering a status already over its limit is still suppressed.
    await moveTo(issue, 'in_progress', byAgent());
    expect(await pendingStageRun(h.projects, alice(), issue.id)).not.toBeNull();
    const before = (await runsOf(issue.id)).length;
    await moveTo(issue, 'todo');
    // A person entering it starts the run and clears the pending continuation.
    await moveTo(issue, 'in_progress');
    expect(await pendingStageRun(h.projects, alice(), issue.id)).toBeNull();
    expect((await runsOf(issue.id)).length).toBe(before + 1);
    const personRun = await finishStage();
    expect(
      (await h.agents.runs.detail(personRun)).inputs[0]?.payload,
    ).toMatchObject({ trigger: 'stageEntered', byPerson: true });
    // The person's run does not count: the next agent entry starts in a fresh window.
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    expect(await pendingStageRun(h.projects, alice(), issue.id)).toBeNull();
    expect((await runsOf(issue.id)).length).toBe(before + 2);
    await finishStage();
    await moveTo(issue, 'todo');
    await moveTo(issue, 'in_progress', byAgent());
    expect(await pendingStageRun(h.projects, alice(), issue.id)).not.toBeNull();
  });

  it('refuses unknown placeholders and finished statuses', async () => {
    await expect(
      setRules({
        in_progress: [
          { type: 'runAgent', config: { instruction: 'Hi {{issue.owner}}' } },
        ],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_WORKFLOW' });
    await expect(
      setRules({ done: [{ type: 'runAgent' }] }),
    ).rejects.toMatchObject({ code: 'INVALID_WORKFLOW' });
  });
});

describe('suggestExecutor', () => {
  it('asks the owner in a decision card, which gives the agent the issue once accepted', async () => {
    const agentId = await h.createAgent({ name: 'Reviewer' });
    await setRules({
      in_review: [
        {
          type: 'suggestExecutor',
          config: { agentId, reason: 'It knows CSS.' },
        },
      ],
    });
    const issue = await h.projects.issues.create(alice(), { title: 'A' });
    await moveTo(issue, 'in_review');
    await expect.poll(async () => (await openPlans('alice')).length).toBe(1);
    const [plan] = await openPlans('alice');
    expect(plan).toMatchObject({
      title: `Let Reviewer work on ${issue.identifier}`,
      description: `${issue.identifier} (A) entered In review, whose workflow suggests Reviewer as the executor. It knows CSS.`,
      source: {
        kind: STATUS_RULE_PLAN_SOURCE,
        key: `statusRule:${issue.id}`,
        issueId: issue.id,
        data: {
          rule: 'suggestExecutor',
          statusKey: 'in_review',
          statusName: 'In review',
          agentId,
          agentName: 'Reviewer',
          identifier: issue.identifier,
          issueTitle: 'A',
          reason: 'It knows CSS.',
        },
      },
      proposer: null,
      createdBy: { type: 'system', id: null },
    });
    expect(plan!.rows[0]!.check).toMatchObject({
      ok: true,
      flags: expect.arrayContaining(['agentExecutor', 'startsRun']),
    });
    // The owner gets a decision card about it; accepting executes the plan behind it.
    await expect.poll(() => planned.length).toBe(1);
    expect(planned[0]).toMatchObject({
      key: `agents:suggested:${plan!.id}`,
      kind: 'decision',
      type: 'executor_suggested',
      userIds: ['alice'],
      issue: { id: issue.id, identifier: issue.identifier },
      params: {
        identifier: issue.identifier,
        status: 'in_review',
        planId: plan!.id,
        agentName: 'Reviewer',
      },
    });
    expect(await runsOf(issue.id)).toEqual([]);

    // The card settles in every recipient's inbox once the plan is no longer open.
    const settled: unknown[] = [];
    const stop = settleSuggestions(
      h.projects,
      () => ({
        send: () => Promise.resolve(),
        resolve: (ref) => {
          settled.push(ref);
          return Promise.resolve();
        },
        withdraw: () => Promise.resolve(),
        settle: () => Promise.resolve(),
      }),
      (error) => {
        throw error;
      },
    );
    const executed = await h.projects.plans.execute(alice(), plan!.id, {
      revision: plan!.revision,
    });
    expect(executed.status).toBe('executed');
    await expect
      .poll(() => settled)
      .toEqual([
        {
          source: 'projects',
          decisionKey: `agents:suggested:${plan!.id}`,
          outcome: 'accepted',
        },
      ]);
    stop();
    const detail = await h.projects.issueQueries.detail(alice(), issue.id);
    expect(detail.executor).toEqual({ type: 'agent', id: agentId });
    expect((await runsOf(issue.id)).map((run) => run.agentId)).toEqual([
      agentId,
    ]);
  });

  it('proposes nothing when the agent executes the issue already', async () => {
    const agentId = await h.createAgent({ name: 'Reviewer' });
    await setRules({
      in_review: [{ type: 'suggestExecutor', config: { agentId } }],
    });
    const issue = await h.projects.issues.create(alice(), {
      title: 'A',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await moveTo(issue, 'in_review');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(await openPlans('alice')).toEqual([]);
  });
});
