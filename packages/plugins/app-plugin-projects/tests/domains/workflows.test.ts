// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createWorkflowTemplates } from '../../server/domains/workflows/index.js';
import {
  BUILTIN_STATUSES,
  type WorkflowDefinition,
  type WorkflowListItem,
} from '../../shared/workflows.js';
import { createHarness, STANDARD_TEMPLATE, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['admin', 'alice']) await h.addUser(id, id);
});
afterEach(() => h.close());

const admin = () => h.viewer('admin', 'admin');
const alice = () => h.viewer('alice');

async function defaultWorkflow(): Promise<WorkflowListItem> {
  const [first] = await h.services.workflows.list(alice());
  return first;
}

/** A copy of the default with a `qa` status added. */
async function withQa(): Promise<WorkflowListItem> {
  const copy = await h.services.workflows.create(admin(), {
    name: 'With QA',
    copyFrom: (await defaultWorkflow()).id,
  });
  return h.services.workflows.update(admin(), copy.id, {
    revision: copy.revision,
    definition: {
      ...copy.definition,
      states: [
        ...copy.definition.states,
        { key: 'qa', name: 'QA', category: 'started', color: 'blue' },
      ],
    },
  });
}

const without = (
  definition: WorkflowDefinition,
  key: string,
): WorkflowDefinition => ({
  states: definition.states.filter((state) => state.key !== key),
  transitions: definition.transitions.filter(
    (transition) => transition.from !== key && transition.to !== key,
  ),
});

const BUILTIN_KEYS = BUILTIN_STATUSES.map((status) => status.key);

describe('without a default workflow', () => {
  it('ships none: projects use the built-in statuses, and people move issues freely', async () => {
    await expect(h.services.workflows.list(alice())).resolves.toEqual([]);
    const project = await h.services.projects.create(alice(), { name: 'P' });
    expect(
      (await h.services.issueQueries.statuses(alice(), project.id)).map(
        (status) => status.key,
      ),
    ).toEqual(BUILTIN_KEYS);
    let issue = await h.services.issues.create(alice(), {
      title: 'A',
      projectId: project.id,
    });
    for (const statusKey of ['done', 'backlog', 'blocked', 'cancelled'])
      issue = await h.services.issues.update(alice(), issue.id, {
        revision: issue.revision,
        statusKey,
      });
    expect(issue.statusKey).toBe('cancelled');
  });

  it('starts a workflow from the built-in statuses', async () => {
    const created = await h.services.workflows.create(admin(), {
      name: 'Ours',
      copyFrom: null,
    });
    expect(created).toMatchObject({
      isDefault: false,
      builtInKey: null,
      projectCount: 0,
    });
    expect(created.definition.states.map((state) => state.key)).toEqual(
      BUILTIN_KEYS,
    );
  });

  it('makes a workflow the default, keeping the statuses issues are in', async () => {
    const project = await h.services.projects.create(alice(), { name: 'P' });
    const inProject = await h.services.issues.create(alice(), {
      title: 'A',
      projectId: project.id,
    });
    await h.services.issues.update(alice(), inProject.id, {
      revision: inProject.revision,
      statusKey: 'in_review',
    });
    const loose = await h.services.issues.create(alice(), { title: 'B' });
    await h.services.issues.update(alice(), loose.id, {
      revision: loose.revision,
      statusKey: 'blocked',
    });
    const created = await h.services.workflows.create(admin(), {
      name: 'Ours',
      copyFrom: null,
    });
    const withQa = await h.services.workflows.update(admin(), created.id, {
      revision: created.revision,
      definition: {
        ...created.definition,
        states: [
          ...created.definition.states,
          { key: 'qa', name: 'QA', category: 'started', color: 'blue' },
        ],
      },
    });
    await expect(
      h.services.workflows.setDefault(admin(), withQa.id),
    ).resolves.toMatchObject({ isDefault: true, projectCount: 1 });
    expect(
      (await h.services.issueQueries.statuses(alice(), project.id)).map(
        (status) => status.key,
      ),
    ).toContain('qa');
  });

  it('installs a makeDefault template as the default only while there is none', async () => {
    const workflow = await h.installStandardWorkflow();
    expect(workflow).toMatchObject({
      name: 'Standard',
      isDefault: true,
    });
    const second = {
      ...STANDARD_TEMPLATE,
      key: 'second',
      name: 'Second',
    };
    await h.services.workflows.installTemplate(second);
    expect(
      (await h.services.workflows.list(alice())).map((item) => [
        item.builtInKey,
        item.isDefault,
      ]),
    ).toEqual([
      ['standard', true],
      ['second', false],
    ]);
  });

  it('installs a makeDefault template next to the built-in statuses when an issue is in a status it lacks', async () => {
    const base = await h.services.workflows.create(admin(), {
      name: 'With QA',
      copyFrom: null,
    });
    const qa = await h.services.workflows.update(admin(), base.id, {
      revision: base.revision,
      definition: {
        ...base.definition,
        states: [
          ...base.definition.states,
          { key: 'qa', name: 'QA', category: 'started', color: 'blue' },
        ],
      },
    });
    await h.services.workflows.setDefault(admin(), qa.id);
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      statusKey: 'qa',
    });
    // The service never leaves no default once there is one; clear it behind its back, leaving an issue in `qa`.
    await h.database
      .connection()
      .query.updateTable('pmWorkflows')
      .set({ isDefault: false })
      .where('id', '=', qa.id)
      .execute();
    await h.services.workflows.installTemplate(STANDARD_TEMPLATE);
    expect(
      (await h.services.workflows.list(alice())).some((item) => item.isDefault),
    ).toBe(false);
  });

  it('lets the application await the templates being installed', async () => {
    const templates = createWorkflowTemplates();
    const installed: string[] = [];
    templates.add({ ...STANDARD_TEMPLATE, key: 'early' });
    let done = false;
    const waiting = templates.installed().then(() => {
      done = true;
    });
    await Promise.resolve();
    expect(done).toBe(false);
    templates.installWith(async (template) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      installed.push(template.key);
    });
    templates.add({ ...STANDARD_TEMPLATE, key: 'late' });
    await waiting;
    expect(installed).toEqual(['early']);
    await templates.installed();
    expect(installed).toEqual(['early', 'late']);
    // A failed installation still settles.
    templates.add({ ...STANDARD_TEMPLATE, key: 'broken', name: 'Broken' });
    templates.installWith(() => Promise.reject(new Error('no')));
    templates.add({ ...STANDARD_TEMPLATE, key: 'failing' });
    await expect(templates.installed()).resolves.toBeUndefined();
  });
});

describe('workflows', () => {
  beforeEach(async () => {
    await h.installStandardWorkflow();
  });

  it('starts with the default, which every member reads', async () => {
    await h.services.projects.create(alice(), { name: 'P' });
    const workflow = await defaultWorkflow();
    expect(workflow).toMatchObject({
      name: 'Standard',
      builtInKey: 'standard',
      isDefault: true,
      projectCount: 1,
    });
    expect(workflow.definition.states.map((state) => state.key)).toEqual([
      'backlog',
      'todo',
      'analysis',
      'proposal_review',
      'in_progress',
      'in_review',
      'blocked',
      'done',
      'cancelled',
    ]);
  });

  it('is changed only by holders of pm.workflows update', async () => {
    const source = await defaultWorkflow();
    await expect(
      h.services.workflows.create(alice(), {
        name: 'Mine',
        copyFrom: source.id,
      }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(
      h.services.workflows.update(alice(), source.id, {
        revision: source.revision,
        name: 'Renamed',
      }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
  });

  it('copies a workflow and refuses a taken name', async () => {
    const source = await defaultWorkflow();
    const copy = await h.services.workflows.create(admin(), {
      name: 'Design first',
      copyFrom: source.id,
    });
    expect(copy).toMatchObject({
      isDefault: false,
      builtInKey: null,
      projectCount: 0,
      definition: source.definition,
    });
    await expect(
      h.services.workflows.create(admin(), {
        name: 'Design first',
        copyFrom: source.id,
      }),
    ).rejects.toMatchObject({ code: 'WORKFLOW_EXISTS' });
  });

  it('reports every problem of a definition with its path', async () => {
    h.services.kinds.add({
      key: 'bot',
      mayEnter: (category) => category !== 'done' && category !== 'closed',
    });
    const source = await defaultWorkflow();
    const broken = without(source.definition, 'blocked');
    const result = h.services.workflows.update(admin(), source.id, {
      revision: source.revision,
      definition: {
        ...broken,
        transitions: [
          ...broken.transitions,
          { from: 'in_review', to: 'done', actors: ['bot'] },
        ],
      },
    });
    await expect(result).rejects.toMatchObject({
      code: 'INVALID_WORKFLOW',
      details: {
        issues: [
          { path: 'states', message: expect.stringContaining('blocked') },
          { path: `transitions[${broken.transitions.length}].actors` },
        ],
      },
    });
  });

  it('names registered kinds only', async () => {
    const source = await defaultWorkflow();
    await expect(
      h.services.workflows.update(admin(), source.id, {
        revision: source.revision,
        definition: {
          ...source.definition,
          transitions: [
            ...source.definition.transitions,
            { from: 'todo', to: 'in_progress', actors: ['robot'] },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_WORKFLOW',
      details: {
        issues: [
          {
            path: `transitions[${source.definition.transitions.length}].actors`,
          },
        ],
      },
    });
  });

  it('refuses a stale revision', async () => {
    const source = await defaultWorkflow();
    await h.services.workflows.update(admin(), source.id, {
      revision: source.revision,
      name: 'Renamed',
    });
    await expect(
      h.services.workflows.update(admin(), source.id, {
        revision: source.revision,
        name: 'Again',
      }),
    ).rejects.toMatchObject({ code: 'REVISION_CONFLICT' });
  });

  it('keeps a status some issue is in', async () => {
    const qa = await withQa();
    const project = await h.services.projects.create(alice(), { name: 'P' });
    await h.services.projects.update(admin(), project.id, {
      workflowId: qa.id,
    });
    const issue = await h.services.issues.create(alice(), {
      title: 'A',
      projectId: project.id,
    });
    await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      statusKey: 'qa',
    });
    await expect(
      h.services.workflows.update(admin(), qa.id, {
        revision: qa.revision,
        definition: without(qa.definition, 'qa'),
      }),
    ).rejects.toMatchObject({
      code: 'WORKFLOW_STATUS_CONFLICT',
      details: {
        conflicts: [
          {
            statusKey: 'qa',
            projectId: project.id,
            projectName: 'P',
            count: 1,
          },
        ],
      },
    });
  });

  it('decides which moves an issue may make', async () => {
    const source = await defaultWorkflow();
    await h.services.workflows.update(admin(), source.id, {
      revision: source.revision,
      definition: {
        states: source.definition.states,
        transitions: [
          { from: '*', to: 'todo', actors: ['user'] },
          { from: 'todo', to: 'in_progress', actors: ['user'] },
          { from: 'in_progress', to: 'done', actors: ['user'] },
        ],
      },
    });
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    await expect(
      h.services.issues.update(alice(), issue.id, {
        revision: issue.revision,
        statusKey: 'done',
      }),
    ).rejects.toMatchObject({ code: 'TRANSITION_NOT_ALLOWED' });
    await expect(
      h.services.issues.update(alice(), issue.id, {
        revision: issue.revision,
        statusKey: 'in_progress',
      }),
    ).resolves.toMatchObject({ statusKey: 'in_progress' });
  });
});

describe('a project’s workflow', () => {
  beforeEach(async () => {
    await h.installStandardWorkflow();
  });

  it('switches only when every issue keeps its status', async () => {
    const qa = await withQa();
    const project = await h.services.projects.create(alice(), { name: 'P' });
    await expect(
      h.services.projects.update(admin(), project.id, { workflowId: 'nope' }),
    ).rejects.toMatchObject({ code: 'INVALID_WORKFLOW' });
    await h.services.projects.update(admin(), project.id, {
      workflowId: qa.id,
    });
    const statuses = await h.services.issueQueries.statuses(
      alice(),
      project.id,
    );
    expect(statuses.map((status) => status.key)).toContain('qa');

    const issue = await h.services.issues.create(alice(), {
      title: 'A',
      projectId: project.id,
    });
    await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      statusKey: 'qa',
    });
    await expect(
      h.services.projects.update(admin(), project.id, { workflowId: null }),
    ).rejects.toMatchObject({ code: 'WORKFLOW_STATUS_CONFLICT' });
    await expect(
      h.services.workflows.get(alice(), qa.id),
    ).resolves.toMatchObject({ projectCount: 1 });
  });

  it('is never deleted while in use, nor as the default', async () => {
    const qa = await withQa();
    const project = await h.services.projects.create(alice(), { name: 'P' });
    await h.services.projects.update(admin(), project.id, {
      workflowId: qa.id,
    });
    await expect(
      h.services.workflows.remove(admin(), qa.id),
    ).rejects.toMatchObject({ code: 'WORKFLOW_IN_USE' });
    await expect(
      h.services.workflows.remove(admin(), (await defaultWorkflow()).id),
    ).rejects.toMatchObject({ code: 'WORKFLOW_IN_USE' });
    await h.services.projects.update(admin(), project.id, { workflowId: null });
    await h.services.workflows.remove(admin(), qa.id);
    await expect(h.services.workflows.list(alice())).resolves.toHaveLength(1);
  });

  it('moves projects without one to a new default that keeps their statuses', async () => {
    const source = await defaultWorkflow();
    const qa = await withQa();
    const issue = await h.services.issues.create(alice(), { title: 'Loose' });
    await h.services.workflows.setDefault(admin(), qa.id);
    await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      statusKey: 'qa',
    });
    await expect(
      h.services.workflows.setDefault(admin(), source.id),
    ).rejects.toMatchObject({ code: 'WORKFLOW_STATUS_CONFLICT' });
    const list = await h.services.workflows.list(alice());
    expect(list.find((item) => item.isDefault)?.id).toBe(qa.id);
  });
});

describe('ways to start an issue', () => {
  beforeEach(async () => {
    await h.installStandardWorkflow();
  });

  it('offers none until a status carries a startOption rule', async () => {
    await expect(
      h.services.issueQueries.starts(alice(), null),
    ).resolves.toEqual({ initialStatus: 'todo', options: [] });
  });

  it('offers the initial status first, then every status with a startOption rule, with their words', async () => {
    const workflow = await defaultWorkflow();
    const label = {
      key: 'designFirst',
      ns: 'acme',
      defaultValue: 'Design first',
    };
    await h.services.workflows.update(admin(), workflow.id, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        states: workflow.definition.states.map((state) =>
          state.key === 'analysis'
            ? {
                ...state,
                rules: [
                  {
                    type: 'startOption',
                    config: { label, hint: 'Propose first.' },
                  },
                ],
              }
            : state.key === 'backlog'
              ? { ...state, rules: [{ type: 'startOption' }] }
              : state,
        ),
      },
    });
    const starts = await h.services.issueQueries.starts(alice(), null);
    expect(
      starts.options.map((option) => [
        option.status.key,
        option.label,
        option.hint,
      ]),
    ).toEqual([
      ['todo', null, null],
      ['backlog', null, null],
      ['analysis', label, 'Propose first.'],
    ]);
    const issue = await h.services.issues.create(alice(), {
      title: 'Design it',
      statusKey: 'analysis',
    });
    expect(issue.statusKey).toBe('analysis');
  });

  it('refuses a startOption rule on a finished status, or with settings it does not know', async () => {
    const workflow = await defaultWorkflow();
    await expect(
      h.services.workflows.update(admin(), workflow.id, {
        revision: workflow.revision,
        definition: {
          ...workflow.definition,
          states: workflow.definition.states.map((state) =>
            state.key === 'done'
              ? { ...state, rules: [{ type: 'startOption' }] }
              : state.key === 'todo'
                ? {
                    ...state,
                    rules: [
                      {
                        type: 'startOption',
                        config: { label: 'x'.repeat(65), color: 'red' },
                      },
                    ],
                  }
                : state,
          ),
        },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_WORKFLOW' });
  });
});
