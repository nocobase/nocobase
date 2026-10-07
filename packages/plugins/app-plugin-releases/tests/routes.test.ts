// @vitest-environment node
/**
 * The HTTP API over a real listener: sign-in by the application, upload tickets (single use, expiry, deploy), CI with
 * an API key scoped to some Apps, and the refusals a bearer credential meets.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createApiServer,
  createArtifact,
  createHarness,
  type Harness,
} from './harness.js';

describe('HTTP API', () => {
  let harness: Harness;
  let server: Awaited<ReturnType<typeof createApiServer>>;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({
      id: 'staging',
      name: 'Staging',
      driver: 'fake',
    });
    await harness.environment({
      id: 'production',
      name: 'Production',
      driver: 'fake',
      protected: true,
    });
    harness.application.roles.set('carol', 'contributor');
    harness.application.roles.set('admin', 'admin');
    server = await createApiServer(harness.services);
  });
  afterEach(async () => {
    await server.close();
    await harness.close();
  });

  const call = async (
    path: string,
    init: RequestInit & { user?: string; agent?: boolean; json?: unknown } = {},
  ) => {
    const headers = new Headers(init.headers);
    if (init.user) headers.set('x-test-user', init.user);
    if (init.agent) headers.set('x-test-agent', 'true');
    if (init.json !== undefined)
      headers.set('content-type', 'application/json');
    const response = await fetch(`${server.url}${path}`, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });
    const text = await response.text();
    return {
      status: response.status,
      body: (text ? JSON.parse(text) : undefined) as {
        data?: any;
        meta?: any;
        error?: any;
      },
    };
  };

  const upload = (
    path: string,
    bytes: Uint8Array,
    headers: Record<string, string>,
  ) =>
    call(path, {
      method: 'POST',
      headers: { 'content-type': 'application/gzip', ...headers },
      body: bytes,
    });

  it('needs a sign-in and reports the caller’s permissions', async () => {
    expect((await call('/apps')).status).toBe(401);
    const me = await call('/me', { user: 'carol' });
    expect(me.body.data).toMatchObject({
      userId: 'carol',
      kind: 'human',
      permissions: {
        pages: { 'rel-apps': true },
        scopes: { 'rel.apps/view': { users: ['carol'] } },
      },
    });
    expect(
      (await call('/me', { user: 'carol', agent: true })).body.data.kind,
    ).toBe('agent');
  });

  it('answers in the standard shapes and checks permission before input', async () => {
    const created = await call('/apps', {
      method: 'POST',
      user: 'admin',
      json: { id: 'shop', name: 'Shop', environmentId: 'staging' },
    });
    expect(created.status).toBe(201);
    expect(await call('/apps?pageSize=1', { user: 'admin' })).toMatchObject({
      status: 200,
      body: {
        data: [{ app: { id: 'shop' } }],
        meta: { page: 1, pageSize: 1, total: 1 },
      },
    });
    expect(
      (await call('/apps?pageSize=101', { user: 'admin' })).body.error,
    ).toMatchObject({ reason: 'INVALID_INPUT', domain: 'app' });
    expect((await call('/environments', { user: 'admin' })).body).toMatchObject(
      { meta: { total: 2 } },
    );
    // What each environment runs, from its driver: the fake one runs uploaded archives.
    expect(
      (await call('/environments', { user: 'admin' })).body.data[0],
    ).toMatchObject({
      capabilities: { archives: true, images: false, onDemand: true },
    });
    // An unknown field is refused, but only once the caller may do this at all.
    const unknown = await call('/environments', {
      method: 'POST',
      user: 'admin',
      json: { id: 'qa', name: 'QA', driver: 'fake', colour: 'red' },
    });
    expect(unknown.status).toBe(400);
    expect(unknown.body.error).toMatchObject({
      reason: 'INVALID_INPUT',
      fieldViolations: [expect.objectContaining({ field: '' })],
    });
    const refused = await call('/environments', {
      method: 'POST',
      user: 'carol',
      json: { colour: 'red' },
    });
    expect(refused.status).toBe(403);
    expect(
      (
        await call('/environments', {
          method: 'POST',
          user: 'admin',
          json: { id: 'check', name: 'Check', driver: 'fake' },
        })
      ).body.error,
    ).toMatchObject({ reason: 'INVALID_ENVIRONMENT_ID' });
    // The App in the path is a 404; a release the body names is a bad request.
    expect(
      (await call('/apps/missing', { user: 'admin' })).body.error,
    ).toMatchObject({ code: 404, reason: 'APP_NOT_FOUND', domain: 'releases' });
    const deploy = await call('/apps/shop/deploy', {
      method: 'POST',
      user: 'admin',
      json: { releaseId: 'missing' },
    });
    expect(deploy.status).toBe(400);
    expect(deploy.body.error).toMatchObject({
      reason: 'RELEASE_NOT_FOUND',
      fieldViolations: [{ field: 'releaseId' }],
    });
    expect(
      (await call('/apps/shop', { method: 'DELETE', user: 'admin' })).body
        .error,
    ).toMatchObject({ reason: 'CONFIRMATION_REQUIRED' });
    const removed = await call('/apps/shop?confirm=shop', {
      method: 'DELETE',
      user: 'admin',
    });
    expect(removed).toEqual({ status: 204, body: undefined });
  });

  it('uploads once with a ticket and deploys when the ticket says so', async () => {
    await call('/apps', {
      method: 'POST',
      user: 'carol',
      json: { id: 'shop', name: 'Shop', environmentId: 'staging' },
    });
    const ticket = await call('/apps/shop/uploadTickets', {
      method: 'POST',
      user: 'carol',
      json: { deploy: true, ttlSeconds: 60 },
    });
    expect(ticket.status).toBe(201);
    expect(ticket.body.data.token).toMatch(/^rel_ticket_/);
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const uploaded = await upload('/apps/shop/releases', artifact.bytes, {
      authorization: `Bearer ${ticket.body.data.token}`,
      'x-artifact-sha256': artifact.checksum,
      'x-release-labels': JSON.stringify({ commit: 'a1b2c3d' }),
    });
    expect(uploaded.status).toBe(202);
    expect(uploaded.body.data).toMatchObject({
      version: '1.0.0',
      createdBy: 'carol',
      createdVia: 'key',
      labels: { commit: 'a1b2c3d' },
    });
    await harness.services.releases.waitForDeployment(
      uploaded.body.data.deploymentId,
    );
    expect(harness.fake.running.get('shop')?.release.version).toBe('1.0.0');
    // Single use.
    const again = await upload('/apps/shop/releases', artifact.bytes, {
      authorization: `Bearer ${ticket.body.data.token}`,
    });
    expect(again).toMatchObject({
      status: 401,
      body: { error: { reason: 'INVALID_TICKET' } },
    });
    // A ticket does nothing else.
    const other = await call('/apps/shop', {
      headers: { authorization: `Bearer ${ticket.body.data.token}` },
    });
    expect(other.status).toBe(403);
  });

  it('refuses an expired ticket, a ticket for another App, and deploying tickets on protected environments', async () => {
    await call('/apps', {
      method: 'POST',
      user: 'admin',
      json: { id: 'shop', name: 'Shop', environmentId: 'staging' },
    });
    await call('/apps', {
      method: 'POST',
      user: 'admin',
      json: { id: 'prod', name: 'Prod', environmentId: 'production' },
    });
    const ticket = await call('/apps/shop/uploadTickets', {
      method: 'POST',
      user: 'admin',
      json: { ttlSeconds: 60 },
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const wrongApp = await upload('/apps/prod/releases', artifact.bytes, {
      authorization: `Bearer ${ticket.body.data.token}`,
    });
    expect(wrongApp.status).toBe(401);
    await harness.database
      .connection()
      .query.updateTable('relUploadTickets')
      .set({ expiresAt: new Date(Date.now() - 1000).toISOString() })
      .where('id', '=', ticket.body.data.id)
      .execute();
    const expired = await upload('/apps/shop/releases', artifact.bytes, {
      authorization: `Bearer ${ticket.body.data.token}`,
    });
    expect(expired).toMatchObject({
      status: 401,
      body: { error: { reason: 'INVALID_TICKET' } },
    });
    // A plain ticket may not deploy.
    const plain = await call('/apps/shop/uploadTickets', {
      method: 'POST',
      user: 'admin',
      json: {},
    });
    const deploying = await upload('/apps/shop/releases', artifact.bytes, {
      authorization: `Bearer ${plain.body.data.token}`,
      'x-release-deploy': 'true',
    });
    expect(deploying.status).toBe(403);
    const protectedTicket = await call('/apps/prod/uploadTickets', {
      method: 'POST',
      user: 'admin',
      json: { deploy: true },
    });
    expect(protectedTicket.body.error?.reason).toBe('TICKET_DEPLOY_REFUSED');
  });

  it('lets CI upload and deploy with a scoped API key, within the key and the owner’s permissions', async () => {
    await call('/apps', {
      method: 'POST',
      user: 'carol',
      json: { id: 'shop', name: 'Shop', environmentId: 'staging' },
    });
    // The "CI deploy" preset: read and write on the Apps chosen.
    const key = {
      'x-test-user': 'carol',
      'x-test-key': JSON.stringify({
        actions: [
          'rel.apps/view',
          'rel.apps/read-logs',
          'rel.apps/upload',
          'rel.apps/deploy',
          'rel.apps/operate',
        ],
        pages: ['rel-apps'],
        apps: ['shop'],
      }),
    };
    const artifact = await createArtifact(harness.rootDir, '2.0.0');
    const uploaded = await upload('/apps/shop/releases', artifact.bytes, {
      ...key,
      'idempotency-key': 'ci-42',
    });
    expect(uploaded.status).toBe(201);
    const deployed = await call('/apps/shop/deploy', {
      method: 'POST',
      headers: key,
      json: { releaseId: uploaded.body.data.id },
    });
    expect(deployed.status).toBe(202);
    await harness.services.releases.waitForDeployment(deployed.body.data.id);
    const status = await call(
      `/apps/shop/deployments/${deployed.body.data.id}`,
      { headers: key },
    );
    expect(status.body.data).toMatchObject({
      status: 'succeeded',
      actorKind: 'key',
    });
    // Not the configuration, nor the environments' settings, nor another App.
    expect((await call('/apps/shop/config', { headers: key })).status).toBe(
      403,
    );
    expect(
      (
        await call('/environments', {
          method: 'POST',
          headers: key,
          json: { id: 'ci-made', name: 'CI', driver: 'fake' },
        })
      ).status,
    ).toBe(403);
    await call('/apps', {
      method: 'POST',
      user: 'admin',
      json: { id: 'other', name: 'Other', environmentId: 'staging' },
    });
    const elsewhere = await upload('/apps/other/releases', artifact.bytes, key);
    expect(elsewhere.status).toBe(403);
    const listed = await call('/apps', { headers: key });
    expect(
      listed.body.data.map((item: { app: { id: string } }) => item.app.id),
    ).toEqual(['shop']);
    // Nor directly to a protected environment, even for an administrator's key.
    const prod = await call('/apps', {
      method: 'POST',
      user: 'admin',
      json: { id: 'prod', name: 'Prod', environmentId: 'production' },
    });
    expect(prod.status).toBe(201);
    const adminKey = {
      'x-test-user': 'admin',
      'x-test-key': JSON.stringify({
        actions: ['rel.apps/view', 'rel.apps/upload', 'rel.apps/deploy'],
      }),
    };
    const toProd = await upload('/apps/prod/releases', artifact.bytes, {
      ...adminKey,
      'x-release-deploy': 'true',
    });
    expect(toProd.body.error?.reason).toBe('APPROVAL_REQUIRED');
    // When the owner loses the role, the key loses its power.
    harness.application.roles.set('carol', 'viewer');
    const revoked = await call('/apps/shop/deploy', {
      method: 'POST',
      headers: key,
      json: { releaseId: uploaded.body.data.id },
    });
    expect(revoked.status).toBe(403);
  });

  it('runs an approval round trip over HTTP', async () => {
    await call('/environments/production', {
      method: 'PATCH',
      user: 'admin',
      json: { approvers: ['wang'] },
    });
    harness.application.roles.set('wang', 'viewer');
    await call('/apps', {
      method: 'POST',
      user: 'admin',
      json: { id: 'prod', name: 'Prod', environmentId: 'production' },
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await upload('/apps/prod/releases', artifact.bytes, {
      'x-test-user': 'admin',
    });
    const request = await call('/apps/prod/deploymentRequests', {
      method: 'POST',
      user: 'admin',
      json: { releaseId: release.body.data.id },
    });
    expect(request.body.data.status).toBe('pending');
    const pending = await call('/deploymentRequests?awaitingMe=true', {
      user: 'wang',
    });
    expect(pending.body.data).toHaveLength(1);
    const approved = await call(
      `/deploymentRequests/${request.body.data.id}/approve`,
      {
        method: 'POST',
        user: 'wang',
        json: { note: 'ok', confirm: 'prod' },
      },
    );
    expect(approved.body.data.status).toBe('approved');
    await harness.services.releases.waitForDeployment(
      approved.body.data.deploymentId,
    );
    expect(harness.fake.running.get('prod')?.release.version).toBe('1.0.0');
  });
});
