import { expect, open, test, unique, signIn } from './support/fixtures.ts';

interface ListNode {
  scrollTop: number;
  setAttribute(name: string, value: string): void;
}

interface Issue {
  id: string;
  identifier: string;
  title: string;
  revision: number;
  statusKey: string;
}

// Each case gets a new owner, keeping its tasks and following preferences isolated from demo data and other files.
test.use({ user: 'admin' });
test.beforeEach(async ({ page, api, context, studio }) => {
  const owner = {
    email: `placement-${unique()}@example.com`,
    password: 'placement-test-password',
  };
  await api.post('users', {
    ...owner,
    name: 'Placement test owner',
    roleScopes: { studio: ['admin'] },
  });
  await signIn(context, owner, studio);
  await page.addInitScript("localStorage.setItem('nocobase.locale', 'en-US')");
});

test('retains the only task after cancellation until the query scope changes', async ({
  page,
  api,
}, info) => {
  const me = await api.get<{ userId: string }>('projects/me');
  const issue = await api.post<Issue>('projects/issues', {
    title: `Only task ${unique()}`,
    ownerUserId: me.userId,
    executor: null,
    start: false,
  });
  await open(page, `/my-issues?view=split&issue=${issue.id}`);
  const list = page.getByRole('listbox', { name: 'Tasks' });
  const row = list.getByRole('option').filter({ hasText: issue.title });
  const detail = page.getByTestId('task-detail');
  await expect(list.getByRole('option')).toHaveCount(1);
  await expect(row).toHaveAttribute('aria-selected', 'true');
  await row.evaluate((node) =>
    (node as unknown as ListNode).setAttribute('data-retained-row', 'original'),
  );
  const before = await row.boundingBox();
  await list.evaluate((node) =>
    (node as unknown as ListNode).setAttribute(
      'data-placement-check',
      'original',
    ),
  );
  const refresh = page.waitForResponse(
    (r) => r.url().includes('/api/taskGroups?') && r.ok(),
  );
  await detail.getByTestId('task-status-menu').click();
  await page
    .getByRole('menuitemradio', { name: 'Cancelled', exact: true })
    .click();
  await refresh;
  await expect(row).toHaveAttribute('aria-selected', 'true');
  await expect(row).toHaveAttribute('data-retained-row', 'original');
  expect((await row.boundingBox())?.y).toBe(before?.y);
  await expect(row.locator('[data-status-shape=closed]')).toHaveCount(1);
  await expect(detail.getByTestId('task-status-menu')).toContainText(
    'Cancelled',
  );
  await expect(
    detail.getByRole('heading', { name: issue.title }),
  ).toBeVisible();
  await expect(list).toHaveAttribute('data-placement-check', 'original');
  expect(
    await list.evaluate((node) => (node as unknown as ListNode).scrollTop),
  ).toBe(0);
  expect(new URL(page.url()).searchParams.get('issue')).toBe(issue.id);
  await page.screenshot({
    path: info.outputPath('cancelled-task-retained.png'),
  });

  // Change the query without remounting the page: a retained row must not leak into a different search.
  await page
    .getByRole('textbox', { name: 'Search issues' })
    .fill(`No match ${unique()}`);
  await expect(row).toHaveCount(0);
  await expect(
    page.getByText('No task matches.', { exact: true }),
  ).toBeVisible();
  await expect(list.getByRole('option')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search issues' }).fill('');
  await expect(
    page.getByText('You have no tasks', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('option').filter({ hasText: issue.title }),
  ).toHaveCount(0);
});

test('retains a task omitted from the full waiting page, then releases it on selection', async ({
  page,
  api,
}, info) => {
  const prefix = `Waiting placement ${unique()}`;
  const me = await api.get<{ userId: string }>('projects/me');
  const make = async (title: string, statusKey: string) => {
    const issue = await api.post<Issue>('projects/issues', {
      title: `${prefix} ${title}`,
      ownerUserId: me.userId,
      executor: null,
      start: false,
    });
    const updated = await api.patch<{ issue: Issue }>(
      `projects/issues/${issue.id}`,
      { revision: issue.revision, statusKey },
    );
    return updated.issue;
  };
  let first: Issue | undefined;
  for (let n = 0; n < 50; n++) {
    const waiting = await make(`Waiting ${n + 1}`, 'blocked');
    first ??= waiting;
  }
  const selected = await make('Selected task', 'in_progress');
  await open(
    page,
    `/my-issues?view=split&q=${encodeURIComponent(prefix)}&issue=${selected.id}`,
  );
  const list = page.getByRole('listbox', { name: 'Tasks' });
  const doing = list.getByRole('region', { name: 'In progress', exact: true });
  const row = doing.getByRole('option').filter({ hasText: selected.title });
  const detail = page.getByTestId('task-detail');
  await expect(row).toHaveAttribute('aria-selected', 'true');
  await row.evaluate((node) =>
    (node as unknown as ListNode).setAttribute('data-retained-row', 'original'),
  );
  await expect(
    list.getByRole('button', { name: 'Show more', exact: true }),
  ).toHaveCount(0);
  const before = await row.boundingBox();
  const scroll = await list.evaluate(
    (node) => (node as unknown as ListNode).scrollTop,
  );
  expect(scroll).toBeGreaterThan(0);
  await list.evaluate((node) =>
    (node as unknown as ListNode).setAttribute(
      'data-placement-check',
      'original',
    ),
  );
  const refresh = page.waitForResponse(
    (r) => r.url().includes('/api/taskGroups?') && r.ok(),
  );
  await detail.getByTestId('task-status-menu').click();
  await page
    .getByRole('menuitemradio', { name: 'Blocked', exact: true })
    .click();
  const response = await refresh;
  const result = (await response.json()).data as {
    groups: {
      group: string;
      count: number;
      nextCursor: string | null;
      data: { issue: Issue }[];
    }[];
  };
  const waiting = result.groups.find((g) => g.group === 'wait')!;
  expect(waiting.count).toBe(51);
  expect(waiting.nextCursor).not.toBeNull();
  expect(waiting.data).toHaveLength(50);
  expect(waiting.data.some((i) => i.issue.id === selected.id)).toBe(false);
  await expect(row).toHaveAttribute('aria-selected', 'true');
  await expect(row).toHaveAttribute('data-retained-row', 'original');
  await expect(row.locator('[data-status-shape=blocked]')).toHaveCount(1);
  await expect(detail.getByTestId('task-status-menu')).toContainText('Blocked');
  await expect(
    detail.getByRole('heading', { name: selected.title }),
  ).toBeVisible();
  await expect(list).toHaveAttribute('data-placement-check', 'original');
  expect(
    await list.evaluate((node) => (node as unknown as ListNode).scrollTop),
  ).toBe(scroll);
  expect((await row.boundingBox())?.y).toBe(before?.y);
  expect(new URL(page.url()).searchParams.get('issue')).toBe(selected.id);
  await expect(
    list.getByRole('button', { name: 'Show more', exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath('paginated-task-retained.png'),
  });
  await list.locator(`[data-task-id="${first!.id}"]`).click();
  await expect(
    detail.getByRole('heading', { name: first!.title }),
  ).toBeVisible();
  await expect(
    list.getByRole('option').filter({ hasText: selected.title }),
  ).toHaveCount(0);
  await expect(
    list.getByRole('button', { name: 'Show more', exact: true }),
  ).toBeVisible();
});
