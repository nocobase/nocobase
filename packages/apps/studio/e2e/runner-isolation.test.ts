import { expect, test, unique } from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';

test('parallel fake runners only claim the runs of their own agents', async ({
  api,
}) => {
  const me = await api.get<{ userId: string }>('projects/me');
  const runners = [0, 1].map(
    (index) => new FakeRunner(api, `isolated-${index}-${unique()}`),
  );
  const agents = await Promise.all(runners.map((runner) => runner.agent()));
  expect(new Set(agents).size).toBe(2);
  const issues = await Promise.all(
    runners.map((_, index) =>
      api.post<Issue>('projects/issues', {
        title: `Concurrent mention ${index} ${unique()}`,
        ownerUserId: me.userId,
      }),
    ),
  );
  await Promise.all(
    runners.map((runner, index) => runner.wake(issues[index]!)),
  );
  // Even sequential claims must not take the second runner's already queued work.
  for (const [index, runner] of runners.entries())
    expect(await runner.claim(issues[index]!.identifier)).toBeTruthy();
});
