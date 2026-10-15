/** Human status controls submit optional owner progress without a required-input prompt. */
import { expect, test, unique, url, signIn } from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';

test.use({ user: 'admin', locale: 'en-US', actionTimeout: 15_000 });

test('human dropdown and board drag can enter waiting states without needsYou', async ({
  page,
  api,
  context,
}) => {
  const suffix = unique();
  const owner = {
    email: `human-progress-${suffix}@example.com`,
    password: 'human-progress-test-password',
  };
  await api.post('users', {
    ...owner,
    name: 'Human progress test owner',
    roleScopes: { studio: ['admin'] },
  });
  await signIn(context, owner);
  await api.patch('users/me/preferences', { locale: 'en-US' });
  const detail = await api.post<Issue>('projects/issues', {
    title: `Human dropdown ${suffix}`,
    executor: null,
    start: false,
  });
  const boardIssues: Issue[] = [];
  for (const status of ['blocked', 'in_review']) {
    boardIssues.push(
      await api.post<Issue>('projects/issues', {
        title: `Human board ${suffix} ${status}`,
        executor: null,
        start: false,
      }),
    );
  }
  try {
    await page.goto(url(`/issues/${detail.identifier}`));
    for (const [label, statusKey] of [
      ['Blocked', 'blocked'],
      ['In review', 'in_review'],
    ] as const) {
      await page.locator('#pm-prop-status').click();
      await page.getByRole('option', { name: label, exact: true }).click();
      await expect
        .poll(
          async () =>
            (await api.get<Issue>(`projects/issues/${detail.id}`)).statusKey,
        )
        .toBe(statusKey);
      expect(
        (
          await api.get<Issue & { needsYou: string | null }>(
            `projects/issues/${detail.id}`,
          )
        ).needsYou,
      ).toBeNull();
      await expect(page.locator('#pm-prop-status')).toContainText(label);
      await expect(page.locator('#pm-prop-needs-you')).toHaveCount(0);
    }
    await page.screenshot({
      path: test.info().outputPath('pm352-human-dropdown.png'),
    });
    await page.setViewportSize({ width: 2400, height: 1000 });
    await page.goto(
      url(
        `/issues?view=board&q=${encodeURIComponent(`Human board ${suffix}`)}`,
      ),
    );
    const board = page.getByRole('region', { name: 'Issue board' });
    await expect(board).toBeVisible();
    for (const [label, statusKey] of [
      ['Blocked', 'blocked'],
      ['In review', 'in_review'],
    ] as const) {
      const boardIssue = boardIssues[statusKey === 'blocked' ? 0 : 1]!;
      const card = board.locator(
        `[role="button"][data-issue="${boardIssue.identifier}"]`,
      );
      const column = board.getByRole('region', {
        name: new RegExp(`^${label} \\d+$`),
      });
      await card.scrollIntoViewIfNeeded();
      const source = await card.boundingBox();
      await column.scrollIntoViewIfNeeded();
      const target = await column.boundingBox();
      if (!source || !target)
        throw new Error('The board drag targets must be visible.');
      await card.scrollIntoViewIfNeeded();
      const visibleSource = await card.boundingBox();
      if (!visibleSource) throw new Error('The board card must be visible.');
      await page.mouse.move(
        visibleSource.x + visibleSource.width / 2,
        visibleSource.y + visibleSource.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(target.x + target.width / 2, target.y + 100, {
        steps: 20,
      });
      await page.mouse.up();
      await expect
        .poll(
          async () =>
            (await api.get<Issue>(`projects/issues/${boardIssue.id}`))
              .statusKey,
        )
        .toBe(statusKey);
      expect(
        (
          await api.get<Issue & { needsYou: string | null }>(
            `projects/issues/${boardIssue.id}`,
          )
        ).needsYou,
      ).toBeNull();
      await expect(
        column.locator(
          `[role="button"][data-issue="${boardIssue.identifier}"]`,
        ),
      ).toBeVisible();
      await expect(page.locator('#board-needs-you')).toHaveCount(0);
    }
    await page.screenshot({
      path: test.info().outputPath('pm352-human-board.png'),
    });
  } finally {
    await api.delete(`projects/issues/${detail.id}`);
    for (const issue of boardIssues)
      await api.delete(`projects/issues/${issue.id}`);
  }
});
