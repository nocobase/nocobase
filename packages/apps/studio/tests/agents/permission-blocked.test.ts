// @vitest-environment node
/** Isolated integration of the refusal/report/manager-action contract; agent text is scripted, not model-generated. */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createActionGate,
  createPermissionSource,
} from '../../server/agents/commands/permissions.js';

import { AGENT_BLOCKED } from '../../server/agents/blocked.js';
import {
  MANAGER_ROLE,
  managerInstructions,
  WORKER_INSTRUCTIONS,
} from '../../server/agents/manager/texts.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('limited-owner');
  await h.addUser('other-actor');
});
afterEach(() => h.close());

describe('permission refusal to blocked notification', () => {
  it('reports a restricted owner’s refusal, then carries the manager’s authorization comment to the owner', async () => {
    const notices: any[] = [];
    h.projects.events.on('notice.planned', (event) => {
      notices.push(event.notice);
    });
    const worker = await h.createAgent({
      actions: [
        'pm.issues/view',
        'pm.issues/comment',
        'pm.issues/edit',
        'pm.issues/delete',
      ],
    });
    const issue = await h.projects.issues.create(h.viewer('limited-owner'), {
      title: 'Permission refusal fixture',
      statusKey: 'in_progress',
      executor: null,
    });
    await h.projects.comments.create(h.viewer('limited-owner'), issue.id, {
      content: `[@Coder](mention://agent/${worker}) Delete this test issue.`,
    });
    const claimed = await h.claimOne();
    const token = claimed.cli.credential.content.token;
    const refusal = await h.request(
      'DELETE',
      `/projects/issues/${issue.identifier}`,
      { runToken: token },
    );
    expect(refusal.status).toBe(403);
    expect(refusal.body.error).toMatchObject({
      reason: 'RUN_ACTION_FORBIDDEN',
      metadata: {
        action: 'pm.issues/delete',
        requiredAction: 'pm.issues/delete',
        permissionReason: 'ACTOR_LACKS_ACTION',
        runActor: { userId: 'limited-owner', name: 'limited-owner' },
        issueOwner: { userId: 'limited-owner', name: 'limited-owner' },
      },
    });
    const manifest = await h.manifest({ runToken: token });
    expect(manifest.identity.actingFor).toEqual({
      userId: 'limited-owner',
      name: 'limited-owner',
    });
    expect(
      manifest.withheld.find((command) => command.id === 'issue:delete'),
    ).toMatchObject({
      action: 'pm.issues/delete',
      requiredAction: 'pm.issues/delete',
      permissionReason: 'ACTOR_LACKS_ACTION',
    });
    const report =
      'Deletion was refused: RUN_ACTION_FORBIDDEN, ACTOR_LACKS_ACTION. Run identity limited-owner lacks pm.issues/delete. Someone with role management permission (Settings › Roles) must grant pm.issues/delete to limited-owner before continuing.';
    expect(
      (
        await h.request(
          'POST',
          `/projects/issues/${issue.identifier}/comments`,
          {
            runToken: token,
            body: { content: report },
          },
        )
      ).status,
    ).toBe(201);
    expect(
      (
        await h.runner(RUNNER_ROUTES.complete, claimed.run.id, {
          summary: report,
          handledInputIds: (
            await h.agents.runs.detail(claimed.run.id)
          ).inputs.map((input) => input.id),
        })
      ).status,
    ).toBe(200);

    await h.projects.issues.update(h.viewer('limited-owner'), issue.id, {
      revision: (
        await h.projects.issueQueries.detail(
          h.viewer('limited-owner'),
          issue.id,
        )
      ).revision,
      executor: { type: 'agent', id: PROJECT_MANAGER_ID },
    });
    const manager = await h.claimOne();
    expect((await h.agents.runs.get(manager.run.id)).agentId).toBe(
      PROJECT_MANAGER_ID,
    );
    const managerToken = manager.cli.credential.content.token;
    const summary =
      'Next: wait for authorization, then resume. Someone with role management permission must grant pm.issues/delete (or a role containing it) to run identity limited-owner. Evidence: ACTOR_LACKS_ACTION. No specific grantor is known.';
    const requirement = `${summary}\n\nOriginal error details: ${'Long diagnostic context. '.repeat(100)}`;
    const comment = await h.request(
      'POST',
      `/projects/issues/${issue.identifier}/comments`,
      {
        runToken: managerToken,
        body: { content: requirement },
      },
    );
    expect(comment.status).toBe(201);
    const moved = await h.request(
      'PATCH',
      `/projects/issues/${issue.identifier}`,
      {
        runToken: managerToken,
        body: { statusKey: 'blocked' },
      },
    );
    expect(moved.status).toBe(200);
    await expect
      .poll(() => notices.filter((notice) => notice.type === AGENT_BLOCKED))
      .toHaveLength(1);
    expect(
      notices.find((notice) => notice.type === AGENT_BLOCKED),
    ).toMatchObject({
      userIds: ['limited-owner'],
      actor: { type: 'agent', id: PROJECT_MANAGER_ID },
      params: {
        commentId: comment.body.data.comment.id,
        question: requirement.slice(0, 500),
      },
    });
    expect(
      notices.find((notice) => notice.type === AGENT_BLOCKED).params.question,
    ).toContain(summary);
    expect(
      (
        await h.projects.issueQueries.detail(
          h.viewer('limited-owner'),
          issue.id,
        )
      ).statusKey,
    ).toBe('blocked');
  });

  it.each([
    ['none', ['pm.issues/view'], 'pm.issues/view', 'GET', 'ACTOR_LACKS_ACTION'],
    ['admin', ['pm.issues/view'], 'pm.issues/view', 'GET', null],
    ['admin', [], 'pm.issues/view', 'GET', 'AGENT_NOT_GIVEN'],
    [
      'admin',
      ['pm.issues/create'],
      'pm.issues/create',
      'POST',
      'READ_ONLY_RUN',
    ],
  ] as const)(
    'keeps intake API and manifest explanations aligned (%s, %s)',
    async (role, actions, action, method, reason) => {
      const agent = await h.createAgent({ actions: [...actions] });
      await h.agents.chat.updateSettings('admin', { defaultAgentId: agent });
      await h.projects.intakeAi.start(h.viewer('limited-owner'), {
        mode: 'split',
        text: 'Draft a task',
      });
      h.roles.set('limited-owner', role);
      const run = await h.claimOne();
      const token = run.cli.credential.content.token;
      const response = await h.request(method, '/projects/issues', {
        runToken: token,
        ...(method === 'POST' ? { body: { title: 'Must not create' } } : {}),
      });
      const manifest = await h.manifest({ runToken: token });
      const withheld = manifest.withheld.find(
        (command) => command.action === action && command.reason === 'action',
      );
      if (reason === null) {
        expect(response.status).toBe(200);
        expect(withheld).toBeUndefined();
        expect(manifest.commands.map((command) => command.id)).toContain(
          'issue:search',
        );
      } else {
        expect(response.status).toBe(403);
        expect(response.body.error.metadata).toMatchObject({
          permissionReason: reason,
          requiredAction: action,
        });
        expect(withheld).toMatchObject({
          permissionReason: reason,
          requiredAction: action,
        });
      }
    },
  );
  it('keeps unknown intake read evidence aligned when the permission source is unavailable', async () => {
    const agent = await h.createAgent({ actions: ['pm.issues/view'] });
    await h.agents.chat.updateSettings('admin', { defaultAgentId: agent });
    await h.projects.intakeAi.start(h.viewer('limited-owner'), {
      mode: 'split',
      text: 'Draft a task',
    });
    h.agents.gate.set(
      createActionGate(createPermissionSource(() => undefined)),
    );
    const run = await h.claimOne();
    const token = run.cli.credential.content.token;
    const response = await h.request('GET', '/projects/issues', {
      runToken: token,
    });
    const manifest = await h.manifest({ runToken: token });
    expect(response.status).toBe(403);
    expect(response.body.error.metadata).toMatchObject({
      permissionReason: 'UNKNOWN',
      requiredAction: 'pm.issues/view',
    });
    expect(
      manifest.withheld.find(
        (command) =>
          command.action === 'pm.issues/view' && command.reason === 'action',
      ),
    ).toMatchObject({
      permissionReason: 'UNKNOWN',
      requiredAction: 'pm.issues/view',
    });
  });
  it('keeps the real actor distinct from the issue owner', async () => {
    const worker = await h.createAgent({ actions: ['pm.issues/delete'] });
    const issue = await h.projects.issues.create(h.viewer('limited-owner'), {
      title: 'Different identity',
    });
    await h.agents.runs.enqueue({
      agentId: worker,
      subject: { kind: 'issue', id: issue.id },
      actorUserId: 'other-actor',
      ownerUserId: 'limited-owner',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'other-actor', name: 'other-actor' },
        text: 'Delete',
        payload: { trigger: 'mention' },
      },
    });
    const run = await h.claimOne();
    const denied = await h.request(
      'DELETE',
      `/projects/issues/${issue.identifier}`,
      { runToken: run.cli.credential.content.token },
    );
    expect(denied.body.error.metadata).toMatchObject({
      permissionReason: 'ACTOR_LACKS_ACTION',
      runActor: { userId: 'other-actor', name: 'other-actor' },
      issueOwner: { userId: 'limited-owner', name: 'limited-owner' },
    });
  });

  it('keeps authorization rules in the fixed role even with custom principles', () => {
    expect(managerInstructions('Custom allocation rules')).toContain(
      MANAGER_ROLE,
    );
    expect(MANAGER_ROLE).toContain(
      'first comment the authorization needed, then move the issue to blocked',
    );
    expect(MANAGER_ROLE).toContain('ACTOR_LACKS_ACTION');
    expect(MANAGER_ROLE).toContain('never blindly retry');
    expect(WORKER_INSTRUCTIONS).toContain(
      'actual result → evidenced cause → who should do what next',
    );
  });
});
