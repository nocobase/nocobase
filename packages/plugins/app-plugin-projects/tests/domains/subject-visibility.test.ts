// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { visibleIssues, visibleIssueSubjects } from '../../server/index.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});
it('pushes the same issue scopes as issue lists into cross-domain subject queries', async () => {
  h = await createHarness();
  await h.addUser('owner');
  await h.addUser('reader');
  const owner = h.viewer('owner', 'admin');
  const privateProject = await h.services.projects.create(owner, {
    name: 'Private',
    visibility: 'members',
  });
  const publicProject = await h.services.projects.create(owner, {
    name: 'Public',
    visibility: 'everyone',
  });
  for (const projectId of [null, privateProject.id, publicProject.id]) {
    await h.services.issues.create(owner, {
      title: `Subject ${projectId}`,
      projectId,
    });
  }
  const conn = h.database.connection();
  for (const viewer of [
    h.viewer('owner'),
    h.viewer('reader'),
    h.viewer('reader', 'none'),
    { ...h.viewer('reader'), projectIds: [] },
    {
      ...h.viewer('reader'),
      projectIds: [privateProject.id, publicProject.id],
    },
    { ...h.viewer('reader', 'admin'), projectIds: [privateProject.id] },
  ]) {
    const predicate = visibleIssueSubjects(viewer)!;
    const selected = await conn.query
      .selectFrom('pmIssues as subject')
      .select('subject.id')
      .where((eb) => predicate(eb, 'subject.id'))
      .execute<{ id: string }>();
    const reference = await conn
      .repository<{ id: string }>('pmIssues')
      .findMany({
        filter: (f) => visibleIssues(f, viewer),
        select: (s) => s.fields('id'),
      });
    expect(selected.map((row) => row.id).sort()).toEqual(
      reference.map((row) => row.id).sort(),
    );
  }
  expect(visibleIssueSubjects(owner)).toBeNull();
});
