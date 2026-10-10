import { expect, open, test, unique, url } from './support/fixtures.ts';
import { FakeRunner } from './support/runner.ts';

interface Issue {
  id: string;
  identifier: string;
  title: string;
  parentIssueId?: string | null;
  priority?: string | null;
  statusKey: string;
}

test.describe('issues', () => {
  test('the board is the default, beside the list and the Agent queue', async ({
    page,
  }) => {
    await open(page, '/issues');
    const views = page.getByRole('group', { name: '视图' });
    await expect(views.getByRole('button', { name: '看板' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const board = page.getByRole('region', { name: '任务看板' });
    await expect(
      board.getByRole('region', { name: /^进行中 \d+$/ }),
    ).toBeVisible();

    await views.getByRole('button', { name: '列表' }).click();
    const table = page.getByRole('table');
    await expect(
      table.getByRole('row', {
        name: /PM-1 Drag to reorder issues on the board and move them between columns/,
      }),
    ).toBeVisible();

    await views.getByRole('button', { name: 'Agent 队列' }).click();
    await expect(page.getByTestId('agent-queue')).toBeVisible();

    // The choice is remembered on the page: without `?view=`, it is the Agent queue again.
    await open(page, '/issues');
    await expect(
      views.getByRole('button', { name: 'Agent 队列' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('my issues default to the board', async ({ page }) => {
    await open(page, '/my-issues');
    await expect(
      page
        .getByRole('group', { name: '视图' })
        .getByRole('button', { name: '看板' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('the Agent queue shows each agent’s issues in queue order', async ({
    page,
    api,
  }) => {
    const me = await api.get<{ userId: string }>('projects/me');
    const runner = new FakeRunner(api, `agent-view-${unique()}`);
    const agentId = await runner.agent();
    // Waiting for me: a design proposal in Proposal review.
    const proposal = await runner.issueWithDesignProposal(
      `Agent 队列：等待审核 ${unique()}`,
      { ownerUserId: me.userId },
    );
    // Working: a run the runner holds.
    const working = await api.post<Issue>('projects/issues', {
      title: `Agent 队列：处理中 ${unique()}`,
      ownerUserId: me.userId,
      executor: { type: 'agent', id: agentId },
    });
    await runner.claim(working.identifier);
    // Queued: it waits for an unfinished issue, and the agent starts when that is done.
    const blocker = await api.post<Issue>('projects/issues', {
      title: `Agent 队列：前置任务 ${unique()}`,
      ownerUserId: me.userId,
    });
    const queued = await api.post<Issue>('projects/issues', {
      title: `Agent 队列：等待前置 ${unique()}`,
      ownerUserId: me.userId,
      executor: { type: 'agent', id: agentId },
      blockedBy: [blocker.id],
    });

    await open(page, '/issues?view=agent&mine=1');
    const lane = page.locator(`[data-agent="${agentId}"]`);
    const section = (state: string) => lane.locator(`[data-state="${state}"]`);
    const item = (issue: Issue) =>
      lane.getByRole('link').filter({ hasText: issue.title });

    const waitingItem = section('waiting').locator('[data-for-me]');
    await expect(waitingItem).toContainText(proposal.title);
    await expect(waitingItem).toContainText('等你');
    await expect(
      // A link drawn as a button.
      waitingItem.getByRole('button', { name: /去处理/ }),
    ).toHaveAttribute(
      'href',
      new RegExp(`/issues/${proposal.identifier}#design$`),
    );
    await expect(
      section('working').getByRole('link').filter({ hasText: working.title }),
    ).toContainText(/\d+:\d{2}/);
    await expect(
      section('queued').getByRole('link').filter({ hasText: queued.title }),
    ).toContainText(`被 ${blocker.identifier} 阻塞`);
    // The issue without an agent is not part of it.
    await expect(item(blocker)).toHaveCount(0);

    // An item opens its issue.
    await item(working).click();
    await expect(
      page.getByRole('heading', { name: working.title, level: 1 }),
    ).toBeVisible();
  });

  test('searching narrows the list to the matching issue', async ({ page }) => {
    await open(page, '/issues');
    await page
      .getByRole('group', { name: '视图' })
      .getByRole('button', { name: '列表' })
      .click();
    await page
      .getByRole('textbox', { name: '搜索任务' })
      .fill('reorder within a column');
    const rows = page
      .getByRole('table')
      .getByRole('rowgroup')
      .last()
      .getByRole('row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('PM-2');
  });

  test('creating an issue by hand opens it', async ({ page, api }) => {
    const title = `手动创建的任务 ${unique()}`;
    await open(page, '/issues');
    await page.getByRole('button', { name: '新建任务', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '新建任务' });
    await dialog.getByRole('tab', { name: '手动' }).click();
    await dialog.getByRole('textbox', { name: '标题' }).fill(title);
    await dialog.getByRole('combobox', { name: '优先级' }).click();
    await page.getByRole('option', { name: '高' }).click();
    await dialog.getByRole('button', { name: '创建', exact: true }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    const found = await api.get<Issue[]>(
      `projects/issues?q=${encodeURIComponent(title)}`,
    );
    expect(found.map((issue) => [issue.title, issue.priority])).toEqual([
      [title, 'high'],
    ]);
  });

  test('the AI tab splits notes into a draft and creates the issues with their hierarchy', async ({
    page,
    api,
  }) => {
    const tag = unique();
    await open(page, '/issues/new');
    const dialog = page.getByRole('dialog', { name: '新建任务' });
    await expect(dialog.getByRole('tab', { name: 'AI 整理' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await dialog
      .getByRole('textbox', { name: '需求' })
      .fill(
        `# 导出改进 ${tag}\n- 导出 CSV ${tag} [high]\n- 导出 Excel ${tag}\n  - 大文件分片 ${tag}`,
      );
    // The built-in project assistant is an online agent, so AI split is offered beside the rules; this split is by the rules.
    await dialog
      .getByRole('button', { name: '按规则拆分', exact: true })
      .click();

    const draft = dialog.getByRole('region', { name: '草稿（4）' });
    await expect(draft).toBeVisible();
    await expect(
      draft.getByRole('combobox', { name: `导出 CSV ${tag} 优先级` }),
    ).toContainText('高');
    // Nothing is created before the draft is confirmed.
    expect(await api.get<Issue[]>(`projects/issues?q=${tag}`)).toEqual([]);

    await dialog.getByRole('button', { name: '创建 4 个任务' }).click();
    await expect(dialog).toBeHidden();

    await expect
      .poll(
        async () => (await api.get<Issue[]>(`projects/issues?q=${tag}`)).length,
      )
      .toBe(4);
    const issues = await api.get<Issue[]>(`projects/issues?q=${tag}`);
    const byTitle = new Map(
      issues.map((issue) => [issue.title.replace(` ${tag}`, ''), issue]),
    );
    const parent = byTitle.get('导出改进');
    expect(byTitle.get('导出 CSV')?.parentIssueId).toBe(parent?.id);
    expect(byTitle.get('导出 CSV')?.priority).toBe('high');
    expect(byTitle.get('大文件分片')?.parentIssueId).toBe(
      byTitle.get('导出 Excel')?.id,
    );
  });

  test('an issue opened by its identifier shows its page', async ({ page }) => {
    await page.goto(url('/issues/PM-1'));
    await expect(
      page.getByRole('heading', {
        name: 'Drag to reorder issues on the board and move them between columns',
        level: 1,
      }),
    ).toBeVisible();
    const subtasks = page.getByRole('region', { name: /^子任务/ });
    await expect(subtasks.getByRole('listitem')).toHaveCount(3);
    await expect(
      subtasks.getByRole('link', {
        name: 'PM-2 Board drag and drop: reorder within a column',
      }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('complementary', { name: '属性' })
        .getByRole('combobox', { name: '状态' }),
    ).toContainText('进行中');
  });
});

test('table hierarchy keeps subtrees together at every list entry and after sorting or filtering', async ({
  page,
  api,
}) => {
  const tag = unique();
  const me = await api.get<{ userId: string }>('projects/me');
  const projects = await api.get<{ id: string }[]>('projects');
  const projectId = projects[0]!.id;
  const parent = await api.post<Issue>('projects/issues', {
    title: `Parent ${tag}`,
    projectId,
    ownerUserId: me.userId,
  });
  const child = await api.post<Issue>('projects/issues', {
    title: `Child ${tag}`,
    projectId,
    ownerUserId: me.userId,
    parentIssueId: parent.id,
  });
  const grandchild = await api.post<Issue>('projects/issues', {
    title: `Descendant ${tag}`,
    projectId,
    ownerUserId: me.userId,
    parentIssueId: child.id,
  });
  for (const path of [
    '/issues',
    '/my-issues',
    `/projects/${projectId}/issues`,
  ]) {
    await open(page, `${path}?view=list&q=${tag}&sort=number&direction=desc`);
    const rows = page
      .getByRole('table')
      .getByRole('rowgroup')
      .last()
      .getByRole('row');
    await expect(rows).toHaveCount(3);
    expect(await rows.getByRole('link').allTextContents()).toEqual([
      parent.identifier,
      child.identifier,
      grandchild.identifier,
    ]);
    await expect(rows.nth(2).locator('[data-issue-depth]')).toHaveAttribute(
      'data-issue-depth',
      '2',
    );
    await page.getByRole('button', { name: '编号', exact: true }).click();
    await expect(page).toHaveURL(/direction=asc/);
    expect(await rows.getByRole('link').allTextContents()).toEqual([
      parent.identifier,
      child.identifier,
      grandchild.identifier,
    ]);
  }
  await open(page, `/issues?view=list&q=${encodeURIComponent(child.title)}`);
  const rows = page
    .getByRole('table')
    .getByRole('rowgroup')
    .last()
    .getByRole('row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator('[data-issue-depth]')).toHaveAttribute(
    'data-issue-depth',
    '0',
  );
});
