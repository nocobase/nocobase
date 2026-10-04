import { afterEach, beforeEach, expect, it } from 'vitest';
import { createFixture } from './helpers.js';

let fixture: Awaited<ReturnType<typeof createFixture>>;
beforeEach(async () => {
  fixture = await createFixture();
});
afterEach(async () => {
  await fixture.destroy();
});

it('exposes plain project queries with the business view scope', async () => {
  const response = await fixture.request(
    'engineer',
    'salesProjects/findMany',
    {},
  );
  expect(response.status).toBe(200);
  expect(
    (await response.json()).data.map((row: { id: string }) => row.id).sort(),
  ).toEqual(['project-1', 'project-2', 'project-3']);
  expect(
    (await fixture.request('delivery', 'salesProjects/findMany', {})).status,
  ).toBe(403);
});

it('updates project notes through the business edit operation', async () => {
  const response = await fixture.request(
    'engineer',
    'salesProjects/updateOne',
    { filter: { id: 'project-2' }, values: { notes: 'Repository edit' } },
  );
  expect(response.status).toBe(200);
  const saved = await fixture.database
    .repository('authorizationExampleProjects')
    .findOne({ filter: { id: 'project-2' } });
  expect(saved?.notes).toBe('Repository edit');
});

it('retains authentication, validation and protected-field boundaries', async () => {
  // Every data endpoint of the exposure sits behind the example's authentication.
  for (const action of ['findMany', 'findOne', 'count', 'updateOne']) {
    const anonymous = await fixture.router.request(
      `/api/authorizationExample/salesProjects/${action}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      },
    );
    expect(anonymous.status).toBe(401);
    expect((await anonymous.json()).error.reason).toBe(
      'AUTHENTICATION_REQUIRED',
    );
  }

  // The update validation middleware runs on the slash path: these values would otherwise reach the Repository,
  // which answers a protected field with 403 rather than an invalid request.
  for (const values of [
    { ownerId: fixture.users.engineer },
    { title: 1 },
    {},
    { notes: 'x'.repeat(501) },
  ]) {
    const response = await fixture.request(
      'engineer',
      'salesProjects/updateOne',
      { filter: { id: 'project-2' }, values },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatchObject({
      reason: 'INVALID_INPUT',
      fieldViolations: expect.arrayContaining([
        expect.objectContaining({ field: expect.stringMatching(/^values/) }),
      ]),
    });
  }
  const invalidJson = await fixture.router.request(
    '/api/authorizationExample/salesProjects/updateOne',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-test-user': fixture.users.engineer,
      },
      body: '{',
    },
  );
  expect(invalidJson.status).toBe(400);
  expect((await invalidJson.json()).error.reason).toBe('INVALID_INPUT');
  expect(
    (
      await fixture.request('engineer', 'salesProjects/deleteOne', {
        filter: { id: 'project-2' },
      })
    ).status,
  ).toBe(403);
});
