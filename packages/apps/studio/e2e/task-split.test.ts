import type { Page } from '@playwright/test';

import { expect, open, test, unique } from './support/fixtures.ts';

interface Issue {
  id: string;
  identifier: string;
  title: string;
  statusKey: string;
}

type Api = Parameters<Parameters<typeof test>[2]>[0]['api'];

/** Tasks the signed-in person owns, named after `prefix` so the search narrows the lists to them. */
async function tasks(api: Api, prefix: string) {
  const me = await api.get<{ userId: string }>('projects/me');
  const make = async (
    title: string,
    statusKey: string,
    parentIssueId?: string,
  ): Promise<Issue> => {
    const created = await api.post<Issue & { revision: number }>(
      'projects/issues',
      {
        title: `${prefix} ${title}`,
        ownerUserId: me.userId,
        executor: null,
        start: false,
        ...(parentIssueId ? { parentIssueId } : {}),
      },
    );
    if (statusKey === 'backlog') return created;
    // A new issue starts in Backlog; it moves on from there.
    const moved = await api.patch<{ issue?: Issue } & Issue>(
      `projects/issues/${created.id}`,
      { revision: created.revision, statusKey },
    );
    return moved.issue ?? moved;
  };
  const accept = await make('等验收', 'in_review');
  const answer = await make('等回复', 'blocked');
  const working = await make('进行中的', 'in_progress');
  return { me, make, accept, answer, working };
}

const issueParam = (page: Page) =>
  new URL(page.url()).searchParams.get('issue');

test.describe('the split view', () => {
  test('groups the tasks, keeps the selection in the address and moves with the keyboard', async ({
    page,
    api,
  }) => {
    const prefix = `分栏 ${unique()}`;
    const { accept, answer, working } = await tasks(api, prefix);
    await open(
      page,
      `/my-issues/owned?view=split&q=${encodeURIComponent(prefix)}`,
    );
    const list = page.getByRole('listbox', { name: '任务列表' });
    const waiting = list.getByRole('region', { name: '等你处理' });
    await expect(waiting.getByRole('option')).toHaveCount(2);
    await expect(
      waiting.getByRole('option').filter({ hasText: accept.title }),
    ).toContainText('等你验收');
    await expect(
      waiting.getByRole('option').filter({ hasText: answer.title }),
    ).toContainText('等你回复');
    await expect(
      list.getByRole('region', { name: '进行中' }).getByRole('option'),
    ).toContainText(working.title);
    // Nothing followed yet: the follow group says how to follow.
    await expect(list.getByRole('region', { name: '关注' })).toContainText(
      '按 S',
    );

    // The longest waiting is first and selected at once, in the address.
    const detail = page.getByTestId('task-detail');
    await expect(
      detail.getByRole('heading', { name: accept.title }),
    ).toBeVisible();
    expect(issueParam(page)).toBe(accept.id);
    await expect(page.getByTestId('task-position')).toHaveText('1 / 3');

    await page.keyboard.press('j');
    await expect(
      detail.getByRole('heading', { name: answer.title }),
    ).toBeVisible();
    expect(issueParam(page)).toBe(answer.id);
    await page.keyboard.press('k');
    await expect(
      detail.getByRole('heading', { name: accept.title }),
    ).toBeVisible();

    // S follows it: it moves to the follow group.
    await page.keyboard.press('s');
    await expect(
      list.getByRole('region', { name: '关注' }).getByRole('option'),
    ).toContainText(accept.title);

    // A refresh comes back to the same task.
    await page.reload();
    await expect(
      page.getByTestId('task-detail').getByRole('heading', {
        name: accept.title,
      }),
    ).toBeVisible();

    // Enter opens the full page over the list; Back returns to the split view with the task still selected.
    await page.getByRole('option', { name: new RegExp(accept.title) }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      new RegExp(`/my-issues/owned/${accept.identifier}`),
    );
    await expect(
      page.getByRole('heading', { name: accept.title, level: 1 }),
    ).toBeVisible();
    await page.goBack();
    await expect(
      page.getByTestId('task-detail').getByRole('heading', {
        name: accept.title,
      }),
    ).toBeVisible();
    await api.post(`followUps/issues/${accept.id}/unfollow`);
  });

  test('a handled task stays in place and the toast leads to the next one waiting', async ({
    page,
    api,
  }) => {
    const prefix = `处理 ${unique()}`;
    const { accept, answer } = await tasks(api, prefix);
    await open(
      page,
      `/my-issues/owned?view=split&q=${encodeURIComponent(prefix)}&issue=${accept.id}`,
    );
    const detail = page.getByTestId('task-detail');
    await expect(
      detail.getByRole('heading', { name: accept.title }),
    ).toBeVisible();
    await detail.getByTestId('task-status-menu').click();
    await page.getByRole('menuitemradio', { name: '已完成' }).click();

    const next = page.getByRole('button', {
      name: `下一个等你处理：${answer.identifier}`,
    });
    await expect(next).toBeVisible();
    // Still where it was, so the list does not jump.
    const waiting = page
      .getByRole('listbox', { name: '任务列表' })
      .getByRole('region', { name: '等你处理' });
    await expect(
      waiting.getByRole('option').filter({ hasText: accept.title }),
    ).toBeVisible();
    await next.click();
    await expect(
      detail.getByRole('heading', { name: answer.title }),
    ).toBeVisible();
    // Moving on, the handled task leaves the group.
    await expect(
      waiting.getByRole('option').filter({ hasText: accept.title }),
    ).toHaveCount(0);
  });

  test('My tasks counts what waits for you on its tabs', async ({
    page,
    api,
  }) => {
    await tasks(api, `计数 ${unique()}`);
    await open(page, '/my-issues/owned');
    await expect(
      page.getByRole('tab', { name: /我负责的/ }).getByTestId('tab-waiting'),
    ).toHaveAttribute('aria-label', /^等你 \d+$/u);
  });
});

test.describe('the grouped table', () => {
  test('lists task trees by group, opened down to what waits for you', async ({
    page,
    api,
  }) => {
    const prefix = `表格 ${unique()}`;
    const { make } = await tasks(api, prefix);
    const parent = await make('父任务', 'in_progress');
    const child = await make('子任务等回复', 'blocked', parent.id);
    await open(
      page,
      `/my-issues/owned?view=list&q=${encodeURIComponent(prefix)}`,
    );
    const table = page.getByRole('table');
    await expect(
      table.getByRole('button', { name: '折叠等你处理' }),
    ).toBeVisible();
    const toggle = table.getByRole('button', {
      name: `收起 ${parent.identifier} 的子任务`,
    });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const childRow = table.getByRole('row').filter({ hasText: child.title });
    await expect(childRow).toContainText('等你回复');
    // The expand button folds the tree without opening the task.
    await toggle.click();
    await expect(childRow).toHaveCount(0);
    await expect(page).toHaveURL(/view=list/u);
    // A row opens the task's page.
    await table
      .getByRole('link', { name: parent.identifier, exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: parent.title, level: 1 }),
    ).toBeVisible();
  });
});

test.describe('on a phone', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('opens a task full screen with the action bar, and Back returns to the list', async ({
    page,
    api,
  }) => {
    const prefix = `手机 ${unique()}`;
    const { accept } = await tasks(api, prefix);
    await open(page, `/my-issues/owned?q=${encodeURIComponent(prefix)}`);
    const list = page.getByRole('listbox', { name: '任务列表' });
    await list.getByRole('option').filter({ hasText: accept.title }).click();
    const screen = page.getByTestId('phone-task');
    await expect(
      screen.getByRole('heading', { name: accept.title }),
    ).toBeVisible();
    const bar = page.getByTestId('task-action-bar');
    await expect(bar).toContainText('等你验收');
    await expect(bar.getByRole('button', { name: '退回修改' })).toBeVisible();
    await screen.getByRole('button', { name: '返回' }).click();
    await expect(screen).toHaveCount(0);
    await expect(list).toBeVisible();
  });
});
