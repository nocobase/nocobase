// @vitest-environment node
import { expect, it } from 'vitest';
import { createReleasesApi } from '../server/routes/api.js';
import { createArtifact, createHarness } from './harness.js';

it('passes server request context to artifact logs, including reuse and legacy ticket correlation', async () => {
  const harness = await createHarness();
  try {
    await harness.environment({
      id: 'test',
      name: 'Test',
      driver: 'fake',
      config: { images: true },
    });
    const caller = await harness.as('carol', 'contributor', 'agent');
    for (const id of ['source', 'target', 'image'])
      await harness.services.releases.createApp(caller, {
        id,
        name: id,
        environmentId: 'test',
      });
    const events: {
      event: string;
      details: Record<string, unknown>;
      actor: unknown;
    }[] = [];
    const api = createReleasesApi(harness.services, {
      authenticate: async (context, next) => {
        // Stand in for the host's authenticated context, not an upload field.
        context.set('fixtureActor', 'authenticated-actor');
        await next();
      },
      callerOf: async () => caller,
      securityLog: (event, details, context) =>
        events.push({ event, details, actor: context?.get('fixtureActor') }),
    });
    const { bytes } = await createArtifact(harness.rootDir, '1.0.0');
    const raw = (path: string, headers = {}) =>
      api.request(path, {
        method: 'POST',
        headers: { 'content-type': 'application/gzip', ...headers },
        body: bytes,
      });
    const post = (path: string, body: unknown) =>
      api.request(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    const uploaded = await raw('/apps/source/releases');
    expect(uploaded.status).toBe(201);
    const source = (await uploaded.json()).data;
    expect((await raw('/apps/source/releases')).status).toBe(200);
    for (const [path, body, event] of [
      [
        `/apps/source/releases/${source.id}/promote`,
        { toAppId: 'target' },
        'releases.release.promote',
      ],
      [
        '/apps/image/imageReleases',
        {
          version: '1.0.0',
          ref: 'registry.test/example/app',
          digest: `sha256:${'d'.repeat(64)}`,
        },
        'releases.release.image',
      ],
    ] as const) {
      expect((await post(path, body)).ok).toBe(true);
      expect((await post(path, body)).status).toBe(200);
      expect(events.at(-1)).toMatchObject({
        event,
        actor: 'authenticated-actor',
        details: { actorId: 'carol' },
      });
    }
    const ticketResponse = await post('/apps/source/uploadTickets', {});
    expect(ticketResponse.status).toBe(201);
    const ticket = (await ticketResponse.json()).data;
    expect(events.at(-1)).toMatchObject({
      event: 'releases.ticket.create',
      actor: 'authenticated-actor',
      details: { ticketId: ticket.id },
    });
    expect(
      (
        await raw('/apps/source/releases', {
          authorization: `Bearer ${ticket.token}`,
        })
      ).status,
    ).toBe(200);
    expect(events.at(-1)).toMatchObject({
      event: 'releases.release.upload',
      details: { ticketId: ticket.id, releaseId: source.id },
      actor: undefined,
    });
    const before = events.length;
    expect(
      (
        await raw('/apps/source/releases', {
          authorization: `Bearer ${ticket.token}`,
        })
      ).status,
    ).toBe(401);
    expect(events).toHaveLength(before);
    expect(
      events
        .filter(({ event }) => event === 'releases.release.upload')
        .slice(0, 2),
    ).toEqual([
      expect.objectContaining({ actor: 'authenticated-actor' }),
      expect.objectContaining({ actor: 'authenticated-actor' }),
    ]);
  } finally {
    await harness.close();
  }
});
