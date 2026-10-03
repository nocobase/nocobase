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
    'salesProjects:findMany',
    {},
  );
  expect(response.status).toBe(200);
  expect(
    (await response.json()).data.map((row: { id: string }) => row.id).sort(),
  ).toEqual(['project-1', 'project-2', 'project-3']);
  expect(
    (await fixture.request('delivery', 'salesProjects:findMany', {})).status,
  ).toBe(403);
});

it('updates project notes through the business edit operation', async () => {
  const response = await fixture.request(
    'engineer',
    'salesProjects:updateOne',
    { filter: { id: 'project-2' }, values: { notes: 'Repository edit' } },
  );
  expect(response.status).toBe(200);
  const saved = await fixture.database
    .repository('authorizationExampleProjects')
    .findOne({ filter: { id: 'project-2' } });
  expect(saved?.notes).toBe('Repository edit');
});

it('retains authentication, validation and protected-field boundaries', async () => {
  const anonymous = await fixture.router.request(
    '/api/authorization-example/salesProjects:findMany',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    },
  );
  expect(anonymous.status).toBe(401);

  for (const values of [
    { ownerId: fixture.users.engineer },
    { title: 1 },
    {},
    { notes: 'x'.repeat(501) },
  ]) {
    expect(
      (
        await fixture.request('engineer', 'salesProjects:updateOne', {
          filter: { id: 'project-2' },
          values,
        })
      ).status,
    ).toBe(400);
  }
  const invalidJson = await fixture.router.request(
    '/api/authorization-example/salesProjects:updateOne',
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
  expect(
    (
      await fixture.request('engineer', 'salesProjects:deleteOne', {
        filter: { id: 'project-2' },
      })
    ).status,
  ).toBe(403);
});
