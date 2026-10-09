// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type {
  CommentChange,
  IssueChange,
} from '../../server/domains/issues/ports.js';
import type { Viewer } from '../../server/access/viewer.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
let changed: IssueChange[];
let commented: CommentChange[];
let refuseComment: boolean;
const alice = () => h.viewer('alice');
const target = { type: 'bot', id: 'b1', tool: 'codex' };

beforeEach(async () => {
  h = await createHarness();
  await h.addUser('alice');
  changed = [];
  commented = [];
  refuseComment = false;
  h.services.kinds.add({
    key: 'bot',
    executor: {
      require: (_conn, id, userId) => {
        expect(userId).toBe('alice');
        if (id === 'forbidden') throw new Error('Executor denied');
        return Promise.resolve();
      },
      canKeep: () => Promise.resolve(true),
      tools: (_conn, _id, userId) => {
        expect(userId).toBe('alice');
        return Promise.resolve([
          { id: 'codex', name: 'Codex', model: 'model-one' },
        ]);
      },
      availability: (_conn, _id, tool, userId) => {
        expect([tool, userId]).toEqual(['codex', 'alice']);
        return Promise.resolve({
          status: 'available',
          runnerName: 'Lima',
          reason: null,
        });
      },
    },
    work: {
      onIssueChanged: (_tx, change) => {
        changed.push(change);
        return Promise.resolve([]);
      },
      onCommentCreated: (_tx, change) => {
        commented.push(change);
        if (refuseComment) throw new Error('No work');
        return Promise.resolve([]);
      },
    },
  });
});
afterEach(() => h.close());

describe('executor variants', () => {
  it('reads tools, sources and caller-dependent availability', async () => {
    const issue = await h.services.issues.create(alice(), {
      title: 'Tools',
      executor: target,
    });
    expect(issue.executor).toEqual({ ...target, toolSource: 'explicit' });
    expect(
      (await h.services.issueQueries.detail(alice(), issue.id)).executor,
    ).toEqual(issue.executor);
    expect(
      await h.services.members.executorTools(alice(), 'bot', 'b1'),
    ).toEqual([{ id: 'codex', name: 'Codex', model: 'model-one' }]);
    expect(
      await h.services.members.executorAvailability(
        alice(),
        'bot',
        'b1',
        'codex',
      ),
    ).toMatchObject({ status: 'available', runnerName: 'Lima' });
    expect(
      await h.services.members.executorTools(alice(), 'user', 'alice'),
    ).toEqual([]);
    await expect(
      h.services.members.executorTools(alice(), 'bot', 'forbidden'),
    ).rejects.toThrow('Executor denied');
  });

  it('preserves the tool for the same principal and clears it when type or id changes', async () => {
    let issue = await h.services.issues.create(alice(), {
      title: 'Tools',
      executor: target,
    });
    issue = await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      executor: { type: 'bot', id: 'b1' },
    });
    expect(issue.executor?.tool).toBe('codex');
    issue = await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      executor: { type: 'bot', id: 'b2' },
    });
    expect(issue.executor).toEqual({ type: 'bot', id: 'b2' });
    issue = await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      executor: { type: 'bot', id: 'b2', tool: 'codex', toolSource: 'default' },
    });
    expect(issue.executor?.toolSource).toBe('default');
    issue = await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      executor: { type: 'user', id: 'alice' },
    });
    expect(issue.executor).toEqual({ type: 'user', id: 'alice' });
  });

  it('records a tool change with start false, and permits explicit clearing', async () => {
    let issue = await h.services.issues.create(alice(), {
      title: 'Tools',
      executor: target,
    });
    changed.length = 0;
    issue = await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      executor: { ...target, tool: 'other', toolSource: 'rule' },
    });
    expect(changed).toHaveLength(1);
    expect(changed[0]?.start).toBe(false);
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.activities.at(-1)).toMatchObject({
      action: 'executor_changed',
      details: {
        from: { tool: 'codex' },
        to: { tool: 'other', toolSource: 'rule' },
      },
    });
    issue = await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      executor: { ...target, tool: null },
    });
    expect(issue.executor).toEqual({ type: 'bot', id: 'b1' });
  });

  it('writes a source-only change while preserving the selected tool', async () => {
    const issue = await h.services.issues.create(alice(), {
      title: 'Tools',
      executor: target,
    });
    const updated = await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      executor: { type: 'bot', id: 'b1', toolSource: 'default' },
    });
    expect(updated.executor).toEqual({ ...target, toolSource: 'default' });
  });

  it('supports a tool in plan issue.update and its previous value', async () => {
    const issue = await h.services.issues.create(alice(), {
      title: 'Tools',
      executor: target,
    });
    const plan = await h.services.plans.create(alice(), {
      title: 'Tools plan',
      source: { kind: 'conversation', key: 'conversation:tools' },
      proposer: { agentId: 'planner' },
      rows: [
        {
          op: 'issue.update',
          params: {
            issue: issue.id,
            set: { executor: { ...target, tool: 'other' } },
            start: false,
          },
        },
      ],
    });
    expect(plan.rows[0]?.check?.error).toBeNull();
    await h.services.plans.execute(alice(), plan.id, {
      revision: plan.revision,
    });
    expect(
      (await h.services.issueQueries.detail(alice(), issue.id)).executor?.tool,
    ).toBe('other');
  });
});

describe('comment handoffs', () => {
  it('passes a transient handoff unchanged even when the issue has no executor', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Handoff' });
    await h.services.comments.create(alice(), issue.id, {
      content: 'Work',
      handoff: target,
      persist: false,
    });
    expect(commented[0]).toMatchObject({ handoff: target, persist: false });
    expect(
      (await h.services.issueQueries.detail(alice(), issue.id)).executor,
    ).toBeNull();
  });

  it('persists in the comment transaction without starting an assignment', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Handoff' });
    changed.length = 0;
    await h.services.comments.create(alice(), issue.id, {
      content: 'Work',
      handoff: target,
      persist: true,
    });
    expect(changed[0]?.start).toBe(false);
    expect(commented).toHaveLength(1);
    expect(commented[0]?.issue.executor).toEqual({
      ...target,
      toolSource: 'explicit',
    });
    expect(commented[0]?.handoff).toEqual(target);
    expect(
      (await h.services.issueQueries.detail(alice(), issue.id)).executor?.tool,
    ).toBe('codex');
  });

  it('rolls back both writes if a comment handler refuses', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Handoff' });
    refuseComment = true;
    await expect(
      h.services.comments.create(alice(), issue.id, {
        content: 'Work',
        handoff: target,
        persist: true,
      }),
    ).rejects.toThrow('No work');
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.executor).toBeNull();
    expect(detail.threads).toEqual([]);
    expect(detail.activities).toHaveLength(1);
  });

  it('makes none a note, including mentions, and starts no work', async () => {
    const issue = await h.services.issues.create(alice(), {
      title: 'Handoff',
      executor: target,
    });
    const result = await h.services.comments.create(alice(), issue.id, {
      content: '[@Bot](mention://bot/b1)',
      handoff: { none: true },
    });
    expect(result.comment.note).toBe(true);
    expect(result.triggered).toEqual([]);
    expect(commented).toEqual([]);
  });

  it('requires edit permission only for persist and rejects persist without a target', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Handoff' });
    const viewer: Viewer = {
      ...alice(),
      permissions: {
        ...alice().permissions,
        scopes: { ...alice().permissions.scopes, 'pm.issues/edit': 'none' },
      },
    };
    await h.services.comments.create(viewer, issue.id, {
      content: 'Work',
      handoff: target,
    });
    await expect(
      h.services.comments.create(viewer, issue.id, {
        content: 'Work',
        handoff: target,
        persist: true,
      }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(
      h.services.comments.create(alice(), issue.id, {
        content: 'Work',
        handoff: { none: true },
        persist: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_HANDOFF' });
    expect(
      (await h.services.issueQueries.detail(alice(), issue.id)).executor,
    ).toBeNull();
  });
});
