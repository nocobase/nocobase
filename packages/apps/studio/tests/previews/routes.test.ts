// @vitest-environment node
/**
 * The preview routes behind `nb-studio preview status|logs|list|down` (`server/previews/routes.ts`): a person, a scoped
 * key and an agent's run reach them through the issue's permissions; a run on an issue names none and gets its own.
 * `retry` stays a person's.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness({ releases: true, previews: true });
  await h.addUser('alice');
});
afterEach(() => h.close());

async function runOn(actions: readonly string[]) {
  const agentId = await h.createAgent({ actions: [...actions] });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Fix login',
    executor: { type: 'agent', id: agentId },
  });
  const payload = await h.claimOne();
  return { issue, token: payload.cli.credential.content.token as string };
}

describe('the preview routes', () => {
  it('validates and protects the preview preference for people and scoped keys', async () => {
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Preference',
      start: false,
    });
    const body = { issueId: issue.id, notRequired: true };
    expect(
      (await h.request('POST', '/previews/preference', { body })).status,
    ).toBe(401);
    expect(
      (
        await h.request('POST', '/previews/preference', {
          user: 'alice',
          headers: {
            'x-test-key-scope': JSON.stringify({
              'projects.issues': { level: 'read' },
            }),
          },
          body,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request('POST', '/previews/preference', {
          user: 'alice',
          body: { ...body, notRequired: 'true' },
        })
      ).status,
    ).toBe(400);
    expect(
      (await h.request('POST', '/previews/preference', { user: 'alice', body }))
        .body.data,
    ).toMatchObject({ notRequired: true, labels: [] });
    expect(
      (
        await h.request('GET', `/previews/status?issueId=${issue.id}`, {
          user: 'alice',
        })
      ).body.data.notRequired,
    ).toBe(true);
    expect(
      (
        await h.request('POST', '/previews/preference', {
          user: 'alice',
          body: { ...body, issueId: 'missing' },
        })
      ).status,
    ).toBe(404);
  });
  it('allows an editing run to set its own preference and refuses a viewing run', async () => {
    const viewer = await runOn(['pm.issues/view']);
    expect(
      (
        await h.request('POST', '/previews/preference', {
          runToken: viewer.token,
          body: { notRequired: true },
        })
      ).status,
    ).toBe(403);
    const editor = await runOn(['pm.issues/view', 'pm.issues/edit']);
    expect(
      (
        await h.request('POST', '/previews/preference', {
          runToken: editor.token,
          body: { notRequired: true },
        })
      ).body.data,
    ).toMatchObject({ issueId: editor.issue.id, notRequired: true });
  });
  it('read the run’s own issue when it names none', async () => {
    const { issue, token } = await runOn(['pm.issues/view']);
    const status = await h.request('GET', '/previews/status', {
      runToken: token,
    });
    expect(status.status).toBe(200);
    expect(status.body.data).toMatchObject({
      issueId: issue.id,
      identifier: issue.identifier,
      previews: [],
      blocker: 'noRepository',
      canEdit: false,
    });
    const list = await h.request('GET', '/previews', { runToken: token });
    expect(list.status).toBe(200);
    expect(list.body.meta).toEqual({ total: 0 });
    // Reading a preview's logs is managing it: an action of its own.
    const logs = await h.request('GET', '/previews/logs', {
      runToken: token,
    });
    expect(logs.status).toBe(403);
    expect(logs.body.error).toMatchObject({
      reason: 'RUN_ACTION_FORBIDDEN',
      metadata: { action: 'studio.previews/manage' },
    });
    const manager = await runOn([
      'pm.issues/view',
      'pm.issues/edit',
      'studio.previews/manage',
    ]);
    const none = await h.request('GET', '/previews/logs', {
      runToken: manager.token,
    });
    expect(none.status).toBe(404);
    expect(none.body.error.reason).toBe('PREVIEW_NOT_FOUND');
  });

  it('refuse a run outside its agent’s actions', async () => {
    const viewOnly = await runOn(['pm.issues/view']);
    const down = await h.request('POST', '/previews/down', {
      runToken: viewOnly.token,
      body: {},
    });
    expect(down.status).toBe(403);
    const blind = await runOn(['pm.issues/comment']);
    const status = await h.request('GET', '/previews/status', {
      runToken: blind.token,
    });
    expect(status.status).toBe(403);
  });

  it('let a run whose agent may edit the issue and manage previews take them down', async () => {
    const editor = await runOn(['pm.issues/view', 'pm.issues/edit']);
    expect(
      (
        await h.request('POST', '/previews/down', {
          runToken: editor.token,
          body: {},
        })
      ).status,
    ).toBe(403);
    const { issue, token } = await runOn([
      'pm.issues/view',
      'pm.issues/edit',
      'studio.previews/manage',
    ]);
    const down = await h.request('POST', '/previews/down', {
      runToken: token,
      body: {},
    });
    expect(down.status).toBe(200);
    expect(down.body.meta.message).toContain(issue.identifier);
  });

  it('let a person name the issue, and ask for it otherwise', async () => {
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'By hand',
      start: false,
    });
    const status = await h.request(
      'GET',
      `/previews/status?issueId=${issue.identifier}&adminPassword=true`,
      { user: 'alice' },
    );
    expect(status.status).toBe(200);
    expect(status.body.data.canEdit).toBe(true);
    const unnamed = await h.request('GET', '/previews/status', {
      user: 'alice',
    });
    expect(unnamed.status).toBe(400);
    expect(unnamed.body.error.reason).toBe('ISSUE_REQUIRED');
  });

  it('hold a scoped key to its scope, and keep retry a person’s', async () => {
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Scoped',
      start: false,
    });
    const headers = {
      'x-test-key-scope': JSON.stringify({
        'projects.issues': { level: 'read' },
      }),
    };
    const status = await h.request(
      'GET',
      `/previews/status?issueId=${issue.id}`,
      { user: 'alice', headers },
    );
    expect(status.status).toBe(200);
    expect(status.body.data.canEdit).toBe(false);
    const down = await h.request('POST', '/previews/down', {
      user: 'alice',
      headers,
      body: { issueId: issue.id },
    });
    expect(down.status).toBe(403);
    const retry = await h.request('POST', '/previews/retry', {
      user: 'alice',
      headers,
      body: { issueId: issue.id, appId: 'web' },
    });
    expect(retry.status).toBe(403);
    expect(retry.body.error.reason).toBe('SCOPED_KEY_FORBIDDEN');
    const { token } = await runOn(['pm.issues/view', 'pm.issues/edit']);
    const byRun = await h.request('POST', '/previews/retry', {
      runToken: token,
      body: { issueId: issue.id, appId: 'web' },
    });
    expect(byRun.status).toBe(403);
    expect(byRun.body.error.reason).toBe('CREDENTIAL_NOT_ACCEPTED');
  });

  it('keep saving a preview’s variables a person’s', async () => {
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Variables',
      start: false,
    });
    const body = {
      issueId: issue.id,
      appId: 'web',
      scope: 'preview',
      values: { SMTP_PASSWORD: 'x' },
    };
    const { token } = await runOn(['pm.issues/view', 'pm.issues/edit']);
    const byRun = await h.request('POST', '/previews/variables', {
      runToken: token,
      body,
    });
    expect(byRun.status).toBe(403);
    expect(byRun.body.error.reason).toBe('CREDENTIAL_NOT_ACCEPTED');
    const badName = await h.request('POST', '/previews/variables', {
      user: 'alice',
      body: { ...body, values: { 'not a name': 'x' } },
    });
    expect(badName.status).toBe(400);
    const none = await h.request('POST', '/previews/variables', {
      user: 'alice',
      body,
    });
    expect(none.status).toBe(404);
    expect(none.body.error.reason).toBe('PREVIEW_NOT_FOUND');
  });
});
