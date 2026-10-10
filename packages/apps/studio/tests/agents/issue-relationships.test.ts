// @vitest-environment node
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { changeRelationshipType } from '../../client/issues/detail/dependency-actions.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
});
afterEach(() => h.close());

function api() {
  const request = async (method: string, path: string, body?: unknown) => {
    const result = await h.request(method, path, { user: 'alice', body });
    if (result.status >= 400) throw new Error(result.body.error.reason);
    return result.body?.data;
  };
  return {
    issue: (id: string): Promise<IssueDetail> =>
      request('GET', `/projects/issues/${id}`),
    addDependency: (
      id: string,
      input: { dependsOnIssueId: string; type?: 'blockedBy' | 'relatedTo' },
    ) => request('POST', `/projects/issues/${id}/dependencies`, input),
    removeDependency: async (id: string, link: string) => {
      await request('DELETE', `/projects/issues/${id}/dependencies/${link}`);
    },
  };
}

async function pair() {
  const viewer = h.viewer('alice');
  return [
    await h.projects.issues.create(viewer, { title: 'First' }),
    await h.projects.issues.create(viewer, { title: 'Second' }),
  ] as const;
}

it('shows related issues at both ends without blockers, and removes them from the reverse end', async () => {
  const [a, b] = await pair();
  const client = api();
  const link = await client.addDependency(a.id, {
    dependsOnIssueId: b.id,
    type: 'relatedTo',
  });
  expect((await client.issue(a.id)).relatedTo).toEqual([
    expect.objectContaining({ issueId: b.id }),
  ]);
  expect((await client.issue(b.id)).relatedTo).toEqual([
    expect.objectContaining({ issueId: a.id }),
  ]);
  expect((await client.issue(a.id)).blockers).toEqual([]);
  expect((await client.issue(b.id)).blockers).toEqual([]);
  await client.removeDependency(b.id, link.dependencyId);
  expect((await client.issue(a.id)).relatedTo).toEqual([]);
  expect((await client.issue(b.id)).relatedTo).toEqual([]);
});

it('converts a reverse related link to a prerequisite and back, with the current issue waiting', async () => {
  const [a, b] = await pair();
  const client = api();
  const related = await client.addDependency(b.id, {
    dependsOnIssueId: a.id,
    type: 'relatedTo',
  });
  await changeRelationshipType(
    client,
    a.id,
    { id: related.dependencyId, issueId: b.id },
    'blockedBy',
  );
  const blocked = await client.issue(a.id);
  expect(blocked.relatedTo).toEqual([]);
  expect(blocked.blockers).toEqual([
    expect.objectContaining({ issueId: b.id }),
  ]);
  expect((await client.issue(b.id)).blocks).toEqual([
    expect.objectContaining({ issueId: a.id }),
  ]);
  await changeRelationshipType(
    client,
    a.id,
    { id: blocked.blockedBy[0]!.dependencyId, issueId: b.id },
    'relatedTo',
  );
  expect((await client.issue(a.id)).blockers).toEqual([]);
  expect((await client.issue(b.id)).blocks).toEqual([]);
  expect((await client.issue(b.id)).relatedTo).toEqual([
    expect.objectContaining({ issueId: a.id }),
  ]);
});

it('preserves the related link when a cyclic prerequisite is refused', async () => {
  const [a, b] = await pair();
  const client = api();
  await client.addDependency(b.id, {
    dependsOnIssueId: a.id,
    type: 'blockedBy',
  });
  const related = await client.addDependency(a.id, {
    dependsOnIssueId: b.id,
    type: 'relatedTo',
  });
  await expect(
    changeRelationshipType(
      client,
      a.id,
      { id: related.dependencyId, issueId: b.id },
      'blockedBy',
    ),
  ).rejects.toThrow();
  expect((await client.issue(a.id)).relatedTo).toHaveLength(1);
  expect((await client.issue(b.id)).relatedTo).toHaveLength(1);
  expect((await client.issue(a.id)).blockedBy).toEqual([]);
});

it('recovers after a failed removal without duplicating or losing a relationship', async () => {
  const [a, b] = await pair();
  const client = api();
  const related = await client.addDependency(a.id, {
    dependsOnIssueId: b.id,
    type: 'relatedTo',
  });
  const dependency = { id: related.dependencyId, issueId: b.id };
  const failed = {
    ...client,
    removeDependency: vi
      .fn()
      .mockRejectedValue(new Error('Connection interrupted')),
  };
  await expect(
    changeRelationshipType(failed, a.id, dependency, 'blockedBy'),
  ).rejects.toThrow('Connection interrupted');
  const partial = await client.issue(a.id);
  expect(partial.relatedTo).toHaveLength(1);
  expect(partial.blockedBy).toHaveLength(1);
  await changeRelationshipType(client, a.id, dependency, 'blockedBy');
  expect((await client.issue(a.id)).relatedTo).toEqual([]);
  expect((await client.issue(a.id)).blockedBy).toHaveLength(1);
  // A stale row cannot recreate a relationship someone already removed.
  await changeRelationshipType(client, a.id, dependency, 'relatedTo');
  expect((await client.issue(a.id)).relatedTo).toEqual([]);
});

it('enforces permissions for direct dependency writes', async () => {
  const [a, b] = await pair();
  const path = `/projects/issues/${a.id}/dependencies`;
  const body = { dependsOnIssueId: b.id, type: 'relatedTo' };
  expect((await h.request('POST', path, { body })).status).toBe(401);
  await h.addUser('reader');
  h.roles.set('reader', 'none');
  expect((await h.request('POST', path, { user: 'reader', body })).status).toBe(
    404,
  );
});
