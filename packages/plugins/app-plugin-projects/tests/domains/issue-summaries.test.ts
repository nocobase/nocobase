// @vitest-environment node
import { performance } from 'node:perf_hooks';
import type { Knex } from 'knex';
import { afterEach, expect, it } from 'vitest';
import { createHarness, type Harness } from '../harness.js';

let h: Harness | undefined;
afterEach(async () => h?.close());

it('reads only authorized live card fields in one query for 1, 12 and 100 references', async () => {
  h = await createHarness();
  await h.addUser('admin');
  await h.addUser('alice');
  const admin = h.viewer('admin', 'admin');
  const project = await h.services.projects.create(admin, {
    name: 'Private',
    visibility: 'members',
  });
  const privateIssue = await h.services.issues.create(admin, {
    title: 'Secret',
    projectId: project.id,
  });
  const issues = [];
  for (let at = 0; at < 100; at++)
    issues.push(await h.services.issues.create(admin, { title: `Card ${at}` }));
  const refs = issues.map((issue) => issue.id);
  const conn = h.database.connection();
  const client = await conn.client<Knex>();
  for (const size of [1, 12, 100]) {
    // Warm lazy repository metadata before measuring the request's business read.
    await h.services.issueQueries.summaries(admin, refs.slice(0, size));
    const queries: string[] = [];
    const listener = ({ sql }: { sql: string }) => queries.push(sql);
    client.on('query', listener);
    const start = performance.now();
    const result = await h.services.issueQueries.summaries(
      admin,
      refs.slice(0, size),
    );
    const elapsed = performance.now() - start;
    client.removeListener('query', listener);
    expect(result).toHaveLength(size);
    expect(queries).toHaveLength(1);
    expect(Object.keys(result[0]!).sort()).toEqual([
      'id',
      'identifier',
      'statusKey',
      'title',
    ]);
    console.info(
      `Summary batch: ${size} refs, ${queries.length} query, ${elapsed.toFixed(2)} ms (SQLite)`,
    );
  }
  const alice = h.viewer('alice', 'member');
  const selected = issues[0]!;
  expect(
    await h.services.issueQueries.summaries(alice, [
      selected.id,
      selected.identifier,
      privateIssue.id,
      'missing',
    ]),
  ).toEqual([
    {
      id: selected.id,
      identifier: selected.identifier,
      title: selected.title,
      statusKey: selected.statusKey,
    },
  ]);
  expect(
    await h.services.issueQueries.summaries(
      { ...admin, projectIds: [project.id] },
      [selected.id, privateIssue.id],
    ),
  ).toEqual([
    {
      id: privateIssue.id,
      identifier: privateIssue.identifier,
      title: privateIssue.title,
      statusKey: privateIssue.statusKey,
    },
  ]);
  expect(
    await h.services.issueQueries.summaries({ ...admin, projectIds: [] }, refs),
  ).toEqual([]);
  await h.services.issues.remove(admin, selected.id);
  expect(await h.services.issueQueries.summaries(admin, [selected.id])).toEqual(
    [],
  );
  await h.services.issues.update(admin, issues[1]!.id, {
    revision: issues[1]!.revision,
    projectId: project.id,
  });
  expect(
    await h.services.issueQueries.summaries(alice, [issues[1]!.id]),
  ).toEqual([]);
}, 30_000);
