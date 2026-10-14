import { writeFileSync } from 'node:fs';
import {
  expect,
  horizontalOverflow,
  open,
  test,
  unique,
  url,
} from './support/fixtures.ts';
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
  test('the table is the default, beside the board and the Agent queue', async ({
    page,
  }) => {
    await open(page, '/issues');
    const views = page.getByRole('group', { name: '视图' });
    await expect(views.getByRole('button', { name: '列表' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await views.getByRole('button', { name: '看板' }).click();
    const board = page.getByRole('region', { name: '任务看板' });
    await expect(
      board.getByRole('region', { name: /^进行中 \d+$/ }),
    ).toBeVisible();

    await views.getByRole('button', { name: '列表' }).click();
    // Other tests add issues to the same list at the same time, so find the demo issue by its words.
    await page
      .getByRole('textbox', { name: '搜索任务' })
      .fill('Drag to reorder issues on the board');
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

  test('my issues default to the table', async ({ page }) => {
    await open(page, '/my-issues');
    await expect(
      page
        .getByRole('group', { name: '视图' })
        .getByRole('button', { name: '列表' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('filters stay in a popover and the desktop view keeps its height', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await open(page, '/issues?view=list');

    const toolbar = page.getByTestId('issues-toolbar');
    const content = page.getByTestId('issues-view-content');
    await expect(toolbar).toBeVisible();
    expect((await toolbar.boundingBox())?.height).toBeLessThanOrEqual(40);
    expect((await content.boundingBox())?.height).toBeGreaterThan(500);

    const trigger = toolbar.getByRole('button', { name: /^筛选/ });
    await trigger.click();
    const filters = page.getByRole('dialog');
    const status = filters.getByRole('combobox', { name: '状态' });
    await status.click();
    await page.getByRole('option').nth(1).click();
    await expect(page).toHaveURL(/status=/);
    await expect(trigger).toContainText('1');

    await page.keyboard.press('Escape');
    await expect(filters).toBeHidden();
    await trigger.click();
    await expect(
      filters.getByRole('combobox', { name: '状态' }),
    ).not.toContainText('全部状态');
    await page.getByRole('button', { name: '清除筛选' }).click();
    await expect(page).not.toHaveURL(/status=/);

    await page.setViewportSize({ width: 375, height: 812 });
    expect(await horizontalOverflow(page)).toBe(0);
    await trigger.click();
    expect(await horizontalOverflow(page)).toBe(0);
    const mobileSearch = filters.getByRole('textbox', { name: '搜索任务' });
    await mobileSearch.fill('PM-1');
    await expect(page).toHaveURL(/q=PM-1/);
    await mobileSearch.press('Escape');
    await expect(filters).toBeHidden();
    await expect(trigger).toBeFocused();
    await toolbar.getByRole('button', { name: '清除筛选' }).click();
    await expect(page).not.toHaveURL(/q=PM-1/);
  });

  test('both task pages retain their content height and controls across desktop widths', async ({
    page,
    api,
  }, testInfo) => {
    await api.patch('users/me/preferences', {
      'theme.mode': 'light',
      'theme.preset': 'default',
    });
    await page.addInitScript(
      "localStorage.setItem('nocobase:sidebar:collapsed', 'false'); localStorage.setItem('nocobase:main:theme:preset', 'default'); localStorage.setItem('nocobase:main:theme:color-scheme', 'light')",
    );
    await page.setViewportSize({ width: 1366, height: 768 });

    const pages = ['/issues?view=board', '/my-issues/owned?view=board'];
    const heights: number[] = [];
    for (const path of pages) {
      await open(page, path);
      const toolbar = page.getByTestId('issues-toolbar');
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        'default',
      );
      await expect(page.locator('html')).toHaveClass(/light/);
      await expect(toolbar).toBeVisible();
      expect((await toolbar.boundingBox())?.height).toBeLessThanOrEqual(40);
      heights.push(
        (await page.getByTestId('issues-view-content').boundingBox())?.height ??
          0,
      );
      await testInfo.attach(
        path.startsWith('/my-issues') ? 'my-issues-1366' : 'issues-1366',
        {
          body: await page.screenshot({
            path: testInfo.outputPath(
              path.startsWith('/my-issues') ? 'my-issues.png' : 'issues.png',
            ),
          }),
          contentType: 'image/png',
        },
      );
    }
    expect(heights.every((height) => height > 500)).toBe(true);

    await page.route('**/api/taskTrees*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      await route.continue();
    });
    for (const path of ['/issues', '/my-issues/owned']) {
      for (const width of [768, 896, 1024]) {
        await page.setViewportSize({ width, height: 768 });
        await open(page, `${path}?view=list&status=todo`);
        const toolbar = page.getByTestId('issues-toolbar');
        const filters = toolbar.getByRole('button', { name: /^筛选/ });
        const clear = toolbar.getByRole('button', { name: '清除筛选' });
        const views = toolbar.getByRole('group', { name: '视图' });
        await expect(filters).toBeVisible();
        await expect(clear).toBeVisible();
        await expect(views.getByRole('button', { name: '列表' })).toBeVisible();
        await toolbar
          .getByRole('textbox', { name: '搜索任务' })
          .fill(`width-check-${width}`);
        await expect(toolbar.getByLabel('加载中')).toBeVisible();
        expect(await horizontalOverflow(page)).toBe(0);
        await expect(
          views.getByRole('button', { name: 'Agent 队列' }),
        ).toBeVisible();
        await clear.click();
      }
    }
    const measurements = testInfo.outputPath('content-heights.json');
    writeFileSync(
      measurements,
      JSON.stringify({ viewport: '1366x768', pages, heights }, null, 2),
    );
    await testInfo.attach('content-heights', {
      path: measurements,
      contentType: 'application/json',
    });
  });

  for (const path of ['/issues', '/my-issues/owned']) {
    test(`${path} keeps mobile filtering usable`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await open(page, `${path}?view=list`);
      const toolbar = page.getByTestId('issues-toolbar');
      const trigger = toolbar.getByRole('button', { name: /^筛选/ });
      const content = page.getByTestId('issues-view-content');
      const height = (await content.boundingBox())?.height;
      await trigger.click();
      const filters = page.getByRole('dialog');
      const status = filters.getByRole('combobox', { name: '状态' });
      await status.click();
      await page.getByRole('option').nth(1).click();
      await expect(page).toHaveURL(/status=/);
      const search = filters.getByRole('textbox', { name: '搜索任务' });
      await search.fill('超长中文条件 Long English search condition');
      await expect(page).toHaveURL(/q=/);
      expect((await content.boundingBox())?.height).toBe(height);
      expect(await horizontalOverflow(page)).toBe(0);
      await testInfo.attach(
        path.startsWith('/my-issues')
          ? 'my-issues-375-filters'
          : 'issues-375-filters',
        {
          body: await page.screenshot({
            path: testInfo.outputPath(
              path.startsWith('/my-issues') ? 'my-issues.png' : 'issues.png',
            ),
          }),
          contentType: 'image/png',
        },
      );
      await search.press('Escape');
      await expect(filters).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(toolbar.getByRole('group', { name: '视图' })).toBeVisible();
      await toolbar.getByRole('button', { name: '清除筛选' }).click();
      await expect(page).not.toHaveURL(/q=|status=/);
      expect(await horizontalOverflow(page)).toBe(0);
    });
  }

  test('the Agent queue shows each agent’s issues in queue order', async ({
    page,
    api,
  }) => {
    const me = await api.get<{ userId: string }>('projects/me');
    const runner = new FakeRunner(api, `agent-view-${unique()}`);
    const agentId = await runner.agent();
    // Working: a mention woke the agent and the runner holds its run.
    const working = await api.post<Issue>('projects/issues', {
      title: `Agent 队列：处理中 ${unique()}`,
      ownerUserId: me.userId,
      statusKey: 'in_progress',
      executor: null,
      start: false,
    });
    await runner.wake(working);
    await runner.claim(working.identifier);
    // Queued: woken after that, and no runner has taken it yet.
    const queued = await api.post<Issue>('projects/issues', {
      title: `Agent 队列：排队中 ${unique()}`,
      ownerUserId: me.userId,
      statusKey: 'in_progress',
      executor: null,
      start: false,
    });
    await runner.wake(queued);
    // An issue no agent touches.
    const blocker = await api.post<Issue>('projects/issues', {
      title: `Agent 队列：无关任务 ${unique()}`,
      ownerUserId: me.userId,
      statusKey: 'in_progress',
      executor: null,
      start: false,
    });

    await open(page, '/issues?view=agent&mine=1');
    const lane = page.locator(`[data-agent="${agentId}"]`);
    const section = (state: string) => lane.locator(`[data-state="${state}"]`);
    const item = (issue: Issue) =>
      lane.getByRole('link').filter({ hasText: issue.title });

    await expect(
      section('working').getByRole('link').filter({ hasText: working.title }),
    ).toContainText(/\d+:\d{2}/);
    await expect(
      section('queued').getByRole('link').filter({ hasText: queued.title }),
    ).toBeVisible();
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
    const group = rows.filter({
      has: page.getByRole('button', { name: '收起常规工作', exact: true }),
    });
    await expect(group).toHaveCount(1);
    await expect(group).toContainText('1 个任务 · 1 棵任务树');
    const parent = rows.filter({
      has: page.getByRole('link', { name: 'PM-1', exact: true }),
    });
    await expect(parent).toContainText('上下文');
    await parent
      .getByRole('button', { name: '展开PM-1的子任务', exact: true })
      .click();
    const tasks = rows.filter({
      has: page.getByRole('link', { name: /^PM-\d+$/ }),
    });
    await expect(tasks).toHaveCount(4);
    const match = tasks.filter({
      has: page.getByRole('link', { name: 'PM-2', exact: true }),
    });
    await expect(match).toHaveCount(1);
    await expect(match).toContainText(
      'Board drag and drop: reorder within a column',
    );
    await expect(match).not.toContainText('上下文');
    const context = tasks.filter({ hasText: '上下文' });
    await expect(context).toHaveCount(3);
  });

  test('creating an issue by hand for later opens it in Backlog', async ({
    page,
    api,
  }) => {
    const title = `手动创建的任务 ${unique()}`;
    await open(page, '/issues');
    await page.getByRole('button', { name: '新建任务', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '新建任务' });
    await dialog.getByRole('tab', { name: '手动' }).click();
    await dialog.getByRole('textbox', { name: '标题' }).fill(title);
    await dialog.getByRole('combobox', { name: '优先级' }).click();
    await page.getByRole('option', { name: '高' }).click();
    // It starts right away unless "Later" is chosen, which leaves it in Backlog.
    await expect(dialog.getByRole('radio', { name: /立即开始/ })).toBeChecked();
    await expect(
      dialog.getByRole('button', { name: '创建并开始', exact: true }),
    ).toBeVisible();
    await dialog.getByRole('radio', { name: /以后再说/ }).click();
    await dialog.getByRole('button', { name: '创建', exact: true }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    const found = await api.get<Issue[]>(
      `projects/issues?q=${encodeURIComponent(title)}`,
    );
    expect(
      found.map((issue) => [issue.title, issue.priority, issue.statusKey]),
    ).toEqual([[title, 'high', 'backlog']]);
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
    // AI split is offered beside the rules; this split is by the rules.
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
