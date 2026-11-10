import { afterEach, expect, it, vi } from 'vitest';
import { createHarness, type Harness } from './harness.js';
import {
  runVisibility,
  subjectVisibleForRun,
  mayAccessRun,
} from '../server/core/runs/access.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});
it('hides an unreadable subject from every run endpoint, list, options, reports and realtime policy', async () => {
  h = await createHarness();
  const sample = h.services.subjects.get('sample')!;
  const hook = vi.fn(
    async () => (eb: import('@nocobase/db').ExpressionBuilder) => eb.or([]),
  );
  h.services.subjects.register({
    ...sample,
    kind: 'hidden',
    visibleSubjects: hook,
  });
  const agentId = await h.createAgent();
  const id = await h.enqueue(agentId, 'secret', { actorUserId: 'bob' });
  await h.database
    .connection()
    .query.updateTable('agRuns')
    .set({ subjectKind: 'hidden' })
    .where('id', '=', id)
    .execute();
  const caller = {
    user: 'reader',
    can: ['agents.agents/read', 'agents.agents/manage'],
  };
  for (const [method, suffix] of [
    ['GET', ''],
    ['GET', '/brief'],
    ['GET', '/events'],
    ['POST', '/cancel'],
    ['POST', '/retry'],
  ] as const) {
    expect(
      (await h.request(method, `/agents/runs/${id}${suffix}`)).status,
    ).toBe(401);
    expect(
      (await h.request(method, `/agents/runs/${id}${suffix}`, caller)).status,
    ).toBe(404);
  }
  expect(
    (
      await h.request(
        'GET',
        '/agents/runs?subjectKind=hidden&subjectId=secret',
        caller,
      )
    ).body.data,
  ).toEqual([]);
  expect(
    (
      await h.request(
        'GET',
        '/agents/runAgents?subjectKind=hidden&subjectId=secret',
        caller,
      )
    ).body.data,
  ).toEqual([]);
  expect(
    (await h.services.reporting.usage({ userId: 'reader', allRuns: true }, {}))
      .totals.runs,
  ).toBe(0);
  expect(
    await h.services.reporting.runRecords(
      { userId: 'reader', allRuns: true },
      { groupId: null },
    ),
  ).toEqual([]);
  const run = await h.services.runs.get(id);
  const realtime = (userId: string) =>
    mayAccessRun(
      run,
      userId,
      false,
      async () => true,
      () =>
        subjectVisibleForRun(
          h.database.connection(),
          h.services.subjects,
          run,
          userId,
        ),
    );
  expect(await realtime('reader')).toBe(false);
  expect(await realtime('bob')).toBe(true);
  expect(
    (await h.request('GET', `/agents/runs/${id}`, { user: 'bob' })).status,
  ).toBe(200);
});
it('filters before pagination and prepares each subject policy once per page', async () => {
  h = await createHarness();
  const sample = h.services.subjects.get('sample')!;
  const hook = vi.fn(
    async () =>
      (eb: import('@nocobase/db').ExpressionBuilder, column: string) =>
        eb(column, '=', 'visible'),
  );
  h.services.subjects.register({
    ...sample,
    kind: 'filtered',
    visibleSubjects: hook,
  });
  const agentId = await h.createAgent();
  const visible: string[] = [];
  for (let i = 0; i < 7; i++) {
    const id = await h.enqueue(agentId, String(i), { actorUserId: 'bob' });
    await h.database
      .connection()
      .query.updateTable('agRuns')
      .set({ subjectKind: 'filtered', subjectId: i % 2 ? 'hidden' : 'visible' })
      .where('id', '=', id)
      .execute();
    if (i % 2 === 0) visible.push(id);
  }
  const seen: string[] = [];
  let token: string | undefined;
  do {
    hook.mockClear();
    const page = await h.request(
      'GET',
      '/agents/runs?pageSize=2' + (token ? `&pageToken=${token}` : ''),
      { user: 'reader', can: ['agents.agents/read'] },
    );
    expect(page.status).toBe(200);
    expect(page.body.data).toHaveLength(2);
    expect(hook).toHaveBeenCalledTimes(1);
    seen.push(...page.body.data.map((run: { id: string }) => run.id));
    token = page.body.meta.nextPageToken;
  } while (token);
  expect(seen).toEqual(visible.reverse());
  // A full visibility result emits no subject subquery.
  h.services.subjects.register({
    ...sample,
    kind: 'unrestricted',
    visibleSubjects: async () => null,
  });
  const predicate = await runVisibility(
    h.database.connection(),
    h.services.subjects,
    'reader',
    true,
  );
  expect(predicate).toBeTypeOf('function');
});
