// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Issue } from '../../shared/issues.js';
import {
  BUILTIN_STATUSES,
  type WorkflowDefinition,
  type WorkflowStatusRule,
} from '../../shared/workflows.js';
import type {
  StatusRuleEntry,
  StatusRuleType,
} from '../../server/domains/workflows/index.js';
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

/** A contributed type that remembers what it saw, gives the issue to bob on entering, and skips when told to. */
function pingType(seen: StatusRuleEntry[]): StatusRuleType {
  return {
    type: 'ping',
    categories: ['unstarted', 'started'],
    validate: (config) =>
      Object.keys(config)
        .filter((field) => field !== 'skip')
        .map((field) => ({ path: field, message: 'Unknown field.' })),
    describe: () => ({ summary: 'Pings someone.', attention: true }),
    async entered(entry, config) {
      seen.push(entry);
      if (config.skip === true)
        return { status: 'skipped', reason: 'told', details: { why: 'test' } };
      await entry.setExecutor({ type: 'user', id: 'bob' });
      return { status: 'applied', details: { pinged: 'bob' } };
    },
  };
}

async function defaultWorkflow() {
  const [workflow] = await h.services.workflows.list(admin());
  return workflow;
}

function withRules(
  definition: WorkflowDefinition,
  rules: Readonly<Record<string, readonly WorkflowStatusRule[]>>,
): WorkflowDefinition {
  return {
    ...definition,
    states: definition.states.map((state) => {
      if (!(state.key in rules)) return state;
      const { rules: _old, ...rest } = state;
      return rules[state.key].length > 0
        ? { ...rest, rules: rules[state.key] }
        : rest;
    }),
  };
}

async function setRules(
  rules: Readonly<Record<string, readonly WorkflowStatusRule[]>>,
): Promise<void> {
  const workflow = await defaultWorkflow();
  await h.services.workflows.update(admin(), workflow.id, {
    revision: workflow.revision,
    definition: withRules(workflow.definition, rules),
  });
}

async function moveTo(issue: Issue, statusKey: string): Promise<Issue> {
  const current = await h.services.issueQueries.detail(alice(), issue.id);
  return h.services.issues.update(alice(), issue.id, {
    revision: current.revision,
    statusKey,
  });
}

async function activities(issueId: string) {
  const page = await h.services.issueQueries.activities(admin(), issueId, {});
  return page.data;
}

async function issuesOf(error: Promise<unknown>): Promise<string[]> {
  try {
    await error;
    return [];
  } catch (caught) {
    return (
      (caught as { details?: { issues?: { path: string }[] } }).details
        ?.issues ?? []
    ).map((issue) => issue.path);
  }
}

describe('status rule types other plugins contribute', () => {
  it('validates their settings and where they sit, and refuses types nobody registered', async () => {
    h.services.statusRules.add(pingType([]));
    const workflow = await defaultWorkflow();
    const save = (rules: Record<string, WorkflowStatusRule[]>) =>
      h.services.workflows.update(admin(), workflow.id, {
        revision: workflow.revision,
        definition: withRules(workflow.definition, rules),
      });
    expect(
      await issuesOf(
        save({ in_progress: [{ type: 'ping', config: { x: 1 } }] }),
      ),
    ).toEqual(['states[4].rules[0].config.x']);
    expect(await issuesOf(save({ done: [{ type: 'ping' }] }))).toEqual([
      'states[7].rules[0].type',
    ]);
    expect(await issuesOf(save({ in_progress: [{ type: 'nobody' }] }))).toEqual(
      ['states[4].rules[0].type'],
    );
    expect(() => h.services.statusRules.add(pingType([]))).toThrow(
      /registered already/u,
    );
    expect(() =>
      h.services.statusRules.add({ ...pingType([]), type: 'checklist' }),
    ).toThrow(/registered already/u);
  });

  it('lists the built-in types through the same registry, described like contributed ones', async () => {
    const types = h.services.statusRules.list().map((type) => type.type);
    expect(types.slice(0, 4)).toEqual([
      'checklist',
      'notifyOwner',
      'subtasksDone',
      'blockersDone',
    ]);
    h.services.statusRules.add(pingType([]));
    expect(h.services.statusRules.get('ping')?.type).toBe('ping');
    expect(
      h.services.statusRules
        .get('checklist')
        ?.describe?.({ items: [{ key: 'a', label: 'A', required: true }] }),
    ).toEqual({ summary: 'Gives the issue a checklist of 1 item(s).' });
  });

  it('asks an exit condition before the issue leaves a status carrying the rule', async () => {
    const asked: { from: string; to: string }[] = [];
    h.services.statusRules.add({
      type: 'holdOn',
      async canLeave(check) {
        asked.push({ from: check.from, to: check.status.key });
        return check.status.category === 'closed'
          ? null
          : { code: 'TEST_HELD', message: 'Held.' };
      },
    });
    await setRules({ in_progress: [{ type: 'holdOn' }] });
    const issue = await h.services.issues.create(alice(), { title: 'Ship' });
    await moveTo(issue, 'in_progress');
    await expect(moveTo(issue, 'in_review')).rejects.toMatchObject({
      code: 'TEST_HELD',
      details: { rule: 'holdOn' },
    });
    expect((await moveTo(issue, 'cancelled')).statusKey).toBe('cancelled');
    expect(asked).toEqual([
      { from: 'in_progress', to: 'in_review' },
      { from: 'in_progress', to: 'cancelled' },
    ]);
  });

  it('acts on entering the status, in the move, with the issue as it is after it, and records what it did', async () => {
    const seen: StatusRuleEntry[] = [];
    h.services.statusRules.add(pingType(seen));
    await setRules({ in_progress: [{ type: 'ping' }] });
    const issue = await h.services.issues.create(alice(), { title: 'Ship' });

    const moved = await moveTo(issue, 'in_progress');

    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({
      from: 'todo',
      status: { key: 'in_progress', category: 'started' },
      actor: { type: 'user', id: 'alice' },
    });
    expect(seen[0].issue.statusKey).toBe('in_progress');
    expect(moved.statusKey).toBe('in_progress');
    expect(moved.executor).toEqual({ type: 'user', id: 'bob' });
    const log = await activities(issue.id);
    expect(
      log.find((entry) => entry.action === 'stage_action_applied'),
    ).toMatchObject({
      details: { rule: 'ping', statusKey: 'in_progress', pinged: 'bob' },
    });
    expect(
      log.find((entry) => entry.action === 'executor_changed')?.details,
    ).toMatchObject({ trigger: 'stageEntered', rule: 'ping' });
  });

  it('records a skip with its reason, and the move stands', async () => {
    h.services.statusRules.add(pingType([]));
    await setRules({ in_progress: [{ type: 'ping', config: { skip: true } }] });
    const issue = await h.services.issues.create(alice(), { title: 'Ship' });

    expect((await moveTo(issue, 'in_progress')).statusKey).toBe('in_progress');
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'stage_action_skipped',
      )?.details,
    ).toMatchObject({ rule: 'ping', reason: 'told', why: 'test' });
  });

  it('keeps a rule whose plugin is gone: saving around it works, entering skips it as unavailable', async () => {
    const remove = h.services.statusRules.add(pingType([]));
    await setRules({ in_progress: [{ type: 'ping' }] });
    remove();
    const issue = await h.services.issues.create(alice(), { title: 'Ship' });

    // The rule is unknown now, but unchanged: the workflow still saves.
    const workflow = await defaultWorkflow();
    await h.services.workflows.update(admin(), workflow.id, {
      revision: workflow.revision,
      definition: withRules(workflow.definition, {
        in_review: [{ type: 'notifyOwner' }],
      }),
    });
    // Adding it somewhere else is refused.
    const again = await defaultWorkflow();
    expect(
      await issuesOf(
        h.services.workflows.update(admin(), again.id, {
          revision: again.revision,
          definition: withRules(again.definition, {
            todo: [{ type: 'ping' }],
          }),
        }),
      ),
    ).toEqual(['states[1].rules[0].type']);

    const moved = await moveTo(issue, 'in_progress');
    expect(moved.statusKey).toBe('in_progress');
    expect(moved.executor).toBeNull();
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'stage_action_skipped',
      )?.details,
    ).toMatchObject({ rule: 'ping', reason: 'unavailable' });
  });

  it('previews what a change does to the rules and points out what wakes someone', async () => {
    h.services.statusRules.add(pingType([]));
    const workflow = await defaultWorkflow();
    const preview = await h.services.workflows.preview(admin(), workflow.id, {
      definition: withRules(workflow.definition, {
        in_progress: [{ type: 'ping' }],
        in_review: [{ type: 'notifyOwner', config: { message: 'Look' } }],
      }),
    });
    expect(preview.rules).toEqual([
      expect.objectContaining({
        statusKey: 'in_progress',
        change: 'added',
        available: true,
        summary: 'Pings someone.',
        attention: true,
      }),
      expect.objectContaining({
        statusKey: 'in_review',
        change: 'added',
        summary: 'Notifies the issue owner: "Look".',
        attention: false,
      }),
    ]);
    expect(preview.attention).toEqual([
      expect.objectContaining({ statusKey: 'in_progress', isNew: true }),
    ]);
    await expect(
      h.services.workflows.preview(alice(), workflow.id, {
        definition: workflow.definition,
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('workflow templates other plugins contribute', () => {
  const template = {
    key: 'pinging',
    name: 'Pinging',
    title: { key: 'templates.pinging', ns: 'other' },
    description: {
      key: 'templates.pingingDescription',
      ns: 'other',
      defaultValue: 'Pings in progress.',
    },
    definition: {
      states: BUILTIN_STATUSES.map((status) =>
        status.key === 'in_progress'
          ? { ...status, rules: [{ type: 'ping' }] }
          : status,
      ),
      transitions: [{ from: '*', to: '*', actors: ['user'] }],
    } satisfies WorkflowDefinition,
  };

  it('installs a template once, next to the default, with its translated name, and never again once deleted', async () => {
    h.services.statusRules.add(pingType([]));
    expect(await h.services.workflows.installTemplate(template)).toBe(true);
    expect(await h.services.workflows.installTemplate(template)).toBe(false);
    h.services.templates.add(template);

    const list = await h.services.workflows.list(admin());
    expect(
      list.map((workflow) => [workflow.builtInKey, workflow.isDefault]),
    ).toEqual([
      ['standard', true],
      ['pinging', false],
    ]);
    const installed = list[1];
    expect(installed).toMatchObject({
      name: 'Pinging',
      title: { key: 'templates.pinging', ns: 'other' },
      description: 'Pings in progress.',
      descriptionTitle: { key: 'templates.pingingDescription', ns: 'other' },
    });
    expect(installed.definition.states[4].rules).toEqual([{ type: 'ping' }]);

    // Renamed, it is the people's own name.
    await h.services.workflows.update(admin(), installed.id, {
      revision: installed.revision,
      name: 'Ours',
    });
    const renamed = await h.services.workflows.get(admin(), installed.id);
    expect(renamed.title).toBeUndefined();
    // The description is translated until it is changed.
    expect(renamed.descriptionTitle).toEqual({
      key: 'templates.pingingDescription',
      ns: 'other',
    });
    await h.services.workflows.update(admin(), installed.id, {
      revision: renamed.revision,
      description: 'Our pings.',
    });
    expect(
      (await h.services.workflows.get(admin(), installed.id)).descriptionTitle,
    ).toBeUndefined();

    await h.services.workflows.remove(admin(), installed.id);
    expect(await h.services.workflows.installTemplate(template)).toBe(false);
    expect(await h.services.workflows.list(admin())).toHaveLength(1);
  });

  it('refuses a template naming a rule nobody registered', async () => {
    await expect(
      h.services.workflows.installTemplate(template),
    ).rejects.toMatchObject({ code: 'INVALID_WORKFLOW' });
    expect(await h.services.workflows.list(admin())).toHaveLength(1);
  });
});
