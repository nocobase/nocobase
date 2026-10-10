import { expect, test, unique } from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';

test('parallel fake runners only claim their own design and executor runs', async ({
  api,
}) => {
  const me = await api.get<{ userId: string }>('projects/me');
  const runners = [0, 1].map(
    (index) => new FakeRunner(api, `isolated-${index}-${unique()}`),
  );
  const agents = await Promise.all(runners.map((runner) => runner.agent()));
  const proposals = await Promise.all(
    runners.map((runner, index) =>
      runner.issueWithDesignProposal(
        `Concurrent proposal ${index} ${unique()}`,
        { ownerUserId: me.userId },
      ),
    ),
  );
  for (const proposal of proposals)
    expect(proposal.statusKey).toBe('proposal_review');
  const issues = await Promise.all(
    agents.map((id, index) =>
      api.post<Issue>('projects/issues', {
        title: `Concurrent executor ${index} ${unique()}`,
        ownerUserId: me.userId,
        executor: { type: 'agent', id },
      }),
    ),
  );
  // Even sequential claims must not take the second runner's already queued work.
  for (const [index, runner] of runners.entries())
    expect(await runner.claim(issues[index]!.identifier)).toBeTruthy();
});
