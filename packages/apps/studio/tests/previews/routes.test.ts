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

/** A run of an agent with `actions` on a step a person handed it, mentioning it on an issue. */
async function runOn(actions: readonly string[]) {
  const agentId = await h.createAgent({ actions: [...actions] });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Fix login',
    executor: null,
  });
  await h.projects.comments.post({ type: 'user', id: 'alice' }, issue.id, {
    content: `[@Coder](mention://agent/${agentId}) look at it`,
  });
  const payload = await h.claimOne();
  return {
    issue,
    runId: payload.run.id as string,
    token: payload.cli.credential.content.token as string,
  };
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
  it('uses identity edit permission for preferences, irrespective of legacy actions', async () => {
    const viewer = await runOn(['pm.issues/view']);
    const readScope = {
      'x-test-key-scope': JSON.stringify({
        'projects.issues': { level: 'read' },
      }),
    };
    expect(
      (
        await h.request('POST', '/previews/preference', {
          user: 'alice',
          headers: readScope,
          body: { issueId: viewer.issue.id, notRequired: true },
        })
      ).status,
    ).toBe(403);
    const editor = await runOn([]);
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
    const { issue, token } = await runOn([]);
    const status = await h.request('GET', '/previews/status', {
      runToken: token,
    });
    expect(status.status).toBe(200);
    expect(status.body.data).toMatchObject({
      issueId: issue.id,
      identifier: issue.identifier,
      previews: [],
      blocker: 'noRepository',
      canEdit: true,
    });
    const list = await h.request('GET', '/previews', { runToken: token });
    expect(list.status).toBe(200);
    expect(list.body.meta).toEqual({ total: 0 });
    // The identity can manage previews even when its legacy catalog is empty.
    const logs = await h.request('GET', '/previews/logs', { runToken: token });
    expect(logs.status).toBe(404);
    expect(logs.body.error.reason).toBe('PREVIEW_NOT_FOUND');
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

  it('refuses a run after its identity loses permission and hides its commands', async () => {
    const viewOnly = await runOn(['pm.issues/view']);
    const blind = await runOn(['pm.issues/comment']);
    h.roles.set('alice', 'none');
    expect(
      (await h.manifest({ runToken: blind.token })).commands.map((c) => c.id),
    ).not.toContain('preview:status');
    const down = await h.request('POST', '/previews/down', {
      runToken: viewOnly.token,
      body: {},
    });
    expect(down.status).toBe(403);
    const status = await h.request('GET', '/previews/status', {
      runToken: blind.token,
    });
    expect(status.status).toBe(403);
  });

  it('offers and executes preview management without a legacy action entry', async () => {
    const editor = await runOn(['pm.issues/view', 'pm.issues/edit']);
    expect(
      (await h.manifest({ runToken: editor.token })).commands.map((c) => c.id),
    ).toContain('preview:down');
    expect(
      (
        await h.request('POST', '/previews/down', {
          runToken: editor.token,
          body: {},
        })
      ).status,
    ).toBe(200);
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

  it('rejects inaccessible issue objects and aligns scoped command discovery with HTTP', async () => {
    const { token, issue } = await runOn([]);
    await h.addUser('bob');
    const hidden = await h.projects.projects.create(h.viewer('bob'), {
      name: 'Bob private',
      visibility: 'members',
    });
    const other = await h.projects.issues.create(h.viewer('bob'), {
      title: 'Bob only',
      projectId: hidden.id,
      start: false,
    });
    expect(
      (
        await h.request('POST', '/previews/down', {
          runToken: token,
          body: { issueId: other.id },
        })
      ).status,
    ).toBe(404);
    const headers = {
      'x-test-key-scope': JSON.stringify({
        'projects.issues': { level: 'read' },
      }),
    };
    const ids = (
      await h.request('GET', '/cli/manifest', { user: 'alice', headers })
    ).body.data.commands.map((c: { id: string }) => c.id);
    expect(ids).toContain('preview:status');
    expect(ids).not.toContain('preview:down');
    expect(
      (
        await h.request('POST', '/previews/down', {
          user: 'alice',
          headers,
          body: { issueId: issue.id },
        })
      ).status,
    ).toBe(403);
  });

  it('keeps consultation preview commands read-only despite identity edit permission', async () => {
    const parent = await runOn([]);
    const child = await runOn([]);
    // Model the persisted consultation relationship; both runs retain Alice's existing actor identity.
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({
        filter: { id: child.runId },
        values: { parentRunId: parent.runId },
      });
    const ids = (await h.manifest({ runToken: child.token })).commands.map(
      (c) => c.id,
    );
    expect(ids).toContain('preview:status');
    expect(ids).not.toContain('preview:down');
    expect(
      (await h.request('GET', '/previews/status', { runToken: child.token }))
        .status,
    ).toBe(200);
    expect(
      (
        await h.request('POST', '/previews/down', {
          runToken: child.token,
          body: {},
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request('POST', '/previews/preference', {
          runToken: child.token,
          body: { notRequired: true },
        })
      ).status,
    ).toBe(403);
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
