// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Issue } from '../../shared/issues.js';
import type {
  WorkflowDefinition,
  WorkflowStatusRule,
} from '../../shared/workflows.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  await h.installStandardWorkflow();
  for (const id of ['admin', 'alice', 'bob']) await h.addUser(id, id);
});
afterEach(() => h.close());

const admin = () => h.viewer('admin', 'admin');
const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

/** Gives the default workflow's `statusKey` these rules. */
async function setRules(
  rules: Readonly<Record<string, readonly WorkflowStatusRule[]>>,
): Promise<void> {
  const [workflow] = await h.services.workflows.list(admin());
  const definition: WorkflowDefinition = {
    ...workflow.definition,
    states: workflow.definition.states.map((state) =>
      rules[state.key] ? { ...state, rules: rules[state.key] } : state,
    ),
  };
  await h.services.workflows.update(admin(), workflow.id, {
    revision: workflow.revision,
    definition,
  });
}

const checklist = (
  items: readonly { key: string; label: string; required: boolean }[],
): WorkflowStatusRule => ({ type: 'checklist', config: { items } });

async function moveTo(
  viewer: ReturnType<typeof alice>,
  issue: Issue,
  statusKey: string,
): Promise<Issue> {
  const current = await h.services.issueQueries.detail(viewer, issue.id);
  return h.services.issues.update(viewer, issue.id, {
    revision: current.revision,
    statusKey,
  });
}

async function actions(issueId: string): Promise<string[]> {
  const page = await h.services.issueQueries.activities(admin(), issueId, {});
  return page.data.map((activity) => activity.action);
}

describe('workflow rules', () => {
  it('names only registered rules, with valid settings, once per status', async () => {
    const [workflow] = await h.services.workflows.list(admin());
    const withRules = (rules: unknown[]) =>
      h.services.workflows.update(admin(), workflow.id, {
        revision: workflow.revision,
        definition: {
          ...workflow.definition,
          states: workflow.definition.states.map((state) =>
            state.key === 'in_review'
              ? ({ ...state, rules } as typeof state)
              : state,
          ),
        },
      });
    const paths = async (rules: unknown[]) => {
      try {
        await withRules(rules);
        return [];
      } catch (error) {
        return (
          (error as { details?: { issues?: { path: string }[] } }).details
            ?.issues ?? []
        ).map((issue) => issue.path);
      }
    };
    expect(await paths([{ type: 'runExecutor' }])).toEqual([
      'states[5].rules[0].type',
    ]);
    expect(
      await paths([
        {
          type: 'checklist',
          config: {
            items: [
              { key: 'Tests', label: 'Tests pass', required: true },
              { key: 'docs', label: '', required: 'yes' },
            ],
          },
        },
        { type: 'notifyOwner', config: { message: 'x'.repeat(501) } },
      ]),
    ).toEqual([
      'states[5].rules[0].config.items[0].key',
      'states[5].rules[0].config.items[1].label',
      'states[5].rules[0].config.items[1].required',
      'states[5].rules[1].config.message',
    ]);
    expect(
      await paths([{ type: 'notifyOwner' }, { type: 'notifyOwner' }]),
    ).toEqual(['states[5].rules[1]']);
    expect(
      await paths([
        {
          type: 'notifyOwner',
          config: { message: { key: '', ns: 'Not a namespace', extra: 1 } },
        },
      ]),
    ).toEqual([
      'states[5].rules[0].config.message.extra',
      'states[5].rules[0].config.message.key',
      'states[5].rules[0].config.message.ns',
    ]);
    expect(
      await paths([
        {
          type: 'notifyOwner',
          config: {
            message: {
              key: 'templates.review',
              ns: '@nocobase/app-plugin-x',
              defaultValue: 'Review it.',
            },
          },
        },
      ]),
    ).toEqual([]);
  });

  it('gives an issue the checklist of the status it enters and holds it there until the required items are checked', async () => {
    await setRules({
      in_review: [
        checklist([
          { key: 'tests', label: 'Tests pass', required: true },
          { key: 'notes', label: 'Release notes', required: false },
        ]),
      ],
    });
    const issue = await h.services.issues.create(alice(), { title: 'Ship' });
    await moveTo(alice(), issue, 'in_review');

    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.checklist).toMatchObject({
      statusKey: 'in_review',
      current: true,
      complete: false,
      items: [
        { itemKey: 'tests', required: true, checked: false },
        { itemKey: 'notes', required: false, checked: false },
      ],
    });
    await expect(moveTo(alice(), issue, 'done')).rejects.toMatchObject({
      kind: 'conflict',
      code: 'CHECKLIST_INCOMPLETE',
      details: { statusKey: 'in_review', items: ['Tests pass'] },
    });

    const checked = await h.services.checklists.set(
      bob(),
      issue.id,
      'in_review',
      'tests',
      { checked: true },
    );
    expect(checked).toMatchObject({
      complete: true,
      items: [{ checked: true, checkedById: 'bob', checkedByName: 'bob' }, {}],
    });
    await expect(moveTo(alice(), issue, 'done')).resolves.toMatchObject({
      statusKey: 'done',
    });
    expect(await actions(issue.id)).toContain('checklist_item_checked');
  });

  it('lets an issue leave for a closed status with the checklist unchecked', async () => {
    await setRules({
      in_review: [
        checklist([{ key: 'tests', label: 'Tests', required: true }]),
      ],
    });
    const issue = await h.services.issues.create(alice(), { title: 'Drop' });
    await moveTo(alice(), issue, 'in_review');
    await expect(moveTo(alice(), issue, 'cancelled')).resolves.toMatchObject({
      statusKey: 'cancelled',
    });
  });

  it('keeps the checks of an issue that comes back, and adds the items added since', async () => {
    await setRules({
      in_review: [
        checklist([{ key: 'tests', label: 'Tests', required: true }]),
      ],
    });
    const issue = await h.services.issues.create(alice(), { title: 'Loop' });
    await moveTo(alice(), issue, 'in_review');
    await h.services.checklists.set(alice(), issue.id, 'in_review', 'tests', {
      checked: true,
    });
    await moveTo(alice(), issue, 'in_progress');
    await setRules({
      in_review: [
        checklist([
          { key: 'tests', label: 'Tests', required: true },
          { key: 'demo', label: 'Demo', required: true },
        ]),
      ],
    });
    await moveTo(alice(), issue, 'in_review');
    const [current] = await h.services.checklists.list(alice(), issue.id);
    expect(current.items).toMatchObject([
      { itemKey: 'tests', checked: true },
      { itemKey: 'demo', checked: false },
    ]);
  });

  it('refuses a checklist change from someone who may not see or edit the issue', async () => {
    await setRules({
      in_review: [
        checklist([{ key: 'tests', label: 'Tests', required: true }]),
      ],
    });
    const issue = await h.services.issues.create(alice(), { title: 'Mine' });
    await moveTo(alice(), issue, 'in_review');
    await expect(
      h.services.checklists.set(
        h.viewer('bob', 'none'),
        issue.id,
        'in_review',
        'tests',
        { checked: true },
      ),
    ).rejects.toMatchObject({ kind: 'notFound' });
    await expect(
      h.services.checklists.set(alice(), issue.id, 'in_review', 'nope', {
        checked: true,
      }),
    ).rejects.toMatchObject({ kind: 'notFound' });
  });

  it('tells the owner when someone else moves the issue into the status', async () => {
    await setRules({
      in_review: [{ type: 'notifyOwner', config: { message: 'Please look' } }],
    });
    const told: unknown[] = [];
    h.services.events.on('workflow.ownerNotified', (event) => {
      told.push(event);
    });
    const issue = await h.services.issues.create(alice(), { title: 'Read' });
    await moveTo(alice(), issue, 'in_review');
    expect(await actions(issue.id)).not.toContain('owner_notified');
    expect(told).toEqual([]);

    await moveTo(alice(), issue, 'in_progress');
    await moveTo(bob(), issue, 'in_review');
    expect(await actions(issue.id)).toContain('owner_notified');
    expect(told).toEqual([
      expect.objectContaining({
        issueId: issue.id,
        ownerUserId: 'alice',
        statusKey: 'in_review',
        statusName: 'In review',
        message: 'Please look',
      }),
    ]);
  });

  it('keeps a keyed message as a key, for each reader to translate', async () => {
    const message = {
      key: 'templates.review',
      ns: 'acme',
      defaultValue: 'Review the change.',
    };
    await setRules({
      in_review: [{ type: 'notifyOwner', config: { message } }],
    });
    const told: unknown[] = [];
    h.services.events.on('workflow.ownerNotified', (event) => {
      told.push(event);
    });
    const issue = await h.services.issues.create(alice(), { title: 'Read' });
    await moveTo(bob(), issue, 'in_review');
    expect(told).toEqual([expect.objectContaining({ message })]);
  });
});
