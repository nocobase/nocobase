import {
  expect,
  open,
  test,
  unique,
  horizontalOverflow,
  apiAs,
  signIn,
} from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';

test.describe('issue page', () => {
  let me: { userId: string };
  let issue: Issue;

  test.beforeEach(async ({ api }) => {
    me = await api.get<{ userId: string }>('projects/me');
    issue = await api.post<Issue>('projects/issues', {
      title: `任务页测试 ${unique()}`,
      description: '用于端到端测试的任务。',
      ownerUserId: me.userId,
    });
  });

  test('keeps horizontal overscroll enabled, vertical scroll contained and code scrollable', async ({
    page,
    api,
  }) => {
    const code = 'wide_code_block_'.repeat(100);
    await api.patch(`projects/issues/${issue.id}`, {
      description: `\`\`\`text\n${code}\n\`\`\``,
    });
    await open(page, '/issues');
    await open(page, `/issues/${issue.identifier}`);
    await expect(
      page.getByRole('heading', { name: issue.title, level: 1 }),
    ).toBeVisible();

    // Check computed CSS: wheel events in headless Chromium cannot trigger macOS swipe navigation.
    const scroller = page.locator('[data-slot="route-child-page"] > div');
    await expect(scroller).toHaveCSS('overscroll-behavior-x', 'auto');
    await expect(scroller).toHaveCSS('overscroll-behavior-y', 'contain');

    const block = page.locator('pre').filter({ hasText: code });
    await block.hover();
    await page.mouse.wheel(500, 0);
    await expect
      .poll(() =>
        block.evaluate(
          (element) =>
            (element as unknown as { readonly scrollLeft: number }).scrollLeft,
        ),
      )
      .toBeGreaterThan(0);

    await page.goBack();
    await expect(page).toHaveURL(/\/issues$/u);
    await expect(
      page.getByRole('heading', { name: issue.title, level: 1 }),
    ).toBeHidden();
  });

  test('execution history stays after details, wraps and preserves focus across container widths', async ({
    page,
    api,
    browser,
    context,
  }) => {
    test.setTimeout(120_000);
    // Account preferences persist across browser contexts; keep locale/theme changes private to this test.
    const suffix = unique();
    const user = {
      email: `issue-layout-${suffix}@example.com`,
      password: 'issue-layout-e2e-password',
    };
    const admin = await apiAs(browser, 'admin');
    try {
      await admin.api.post('users', {
        ...user,
        name: `Issue layout ${suffix}`,
        roleScopes: { studio: ['admin'] },
      });
    } finally {
      await admin.close();
    }
    await signIn(context, user);
    const agent = {
      id: await new FakeRunner(
        api,
        `layout agent with a very long readable name ${suffix}`,
      ).agent(),
    };
    const records = [
      'running',
      'queued',
      'failed',
      'completed',
      'cancelled',
      'completed',
    ].map((status, index) => ({
      id: `sidebar-run-${index}`,
      agentId: agent.id,
      agentType: 'runner',
      status,
      actualModels: ['long-model-name-'.repeat(6)],
      model: 'configured-model',
      createdAt: `2026-01-0${index + 1}T09:00:00Z`,
      startedAt: '2026-01-01T09:01:00Z',
      finishedAt: ['running', 'queued'].includes(status)
        ? null
        : '2026-01-01T09:02:00Z',
      cancelRequestedAt: null,
      maxAttempts: 1,
      attempt: 1,
      inputs: [],
      subject: { kind: 'issue', id: issue.id },
      tool: null,
      modelService: null,
    }));
    let visibleRecords = records;
    let status = 200;
    let hold = false;
    let release: (() => void) | undefined;
    await page.route('**/api/agents/runs?**', async (route) => {
      if (hold)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      await route.fulfill({
        status,
        json:
          status === 200
            ? { data: visibleRecords }
            : { error: { code: 'REQUEST_FAILED', message: 'Test failure' } },
      });
    });
    await page.route(
      /\/api\/agents\/runs\/sidebar-run-\d+(?:\/events(?:\?.*)?)?$/u,
      (route) => {
        const path = new URL(route.request().url()).pathname;
        const record = records.find((item) => path.includes(item.id));
        return route.fulfill({
          json: {
            data: path.endsWith('/events')
              ? { events: [], hasMore: false }
              : record,
          },
        });
      },
    );
    await open(page, `/issues/${issue.identifier}`);
    // The runs on the activity line are system records, folded under "Conversation only".
    await page
      .getByTestId('issue-feed')
      .getByRole('button', { name: '全部', exact: true })
      .click();
    const history = page.locator('[data-slot="agent-run-history"]');
    const aside = page.locator('[data-slot="issue-detail-layout"] aside');
    await expect(history).toHaveCount(1);
    await expect(aside.locator('[data-slot="agent-run-history"]')).toHaveCount(
      1,
    );
    const datesBox = await aside
      .getByRole('heading', { name: '详情', exact: true })
      .boundingBox();
    const historyBox = await history.boundingBox();
    expect(historyBox?.y).toBeGreaterThan(datesBox!.y);
    const check = async (width: number, assistant: boolean) => {
      await page.setViewportSize({ width, height: 900 });
      await expect(history).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
      expect(
        await history.evaluate((element) => {
          const metrics = element as unknown as {
            scrollWidth: number;
            clientWidth: number;
          };
          return metrics.scrollWidth - metrics.clientWidth;
        }),
      ).toBeLessThanOrEqual(1);
      const layout = page.locator('[data-slot="issue-detail-layout"]');
      const available = await layout.evaluate(
        (element) =>
          (element as unknown as { clientWidth: number }).clientWidth,
      );
      await expect(layout.locator(':scope > div')).toHaveCSS(
        'flex-direction',
        available >= 896 ? 'row' : 'column',
      );
      await page.evaluate(
        `(() => { const scroller = document.querySelector('[data-slot="route-child-page"] > div'); scroller.scrollTop = 0; })()`,
      );
      await page.screenshot({
        path: `storage/ui-workflow/issue-runs/screenshots/page-top-${width}-${assistant ? 'assistant' : 'plain'}.png`,
      });
      await page.evaluate(
        `(() => { const scroller = document.querySelector('[data-slot="route-child-page"] > div'); const dates = document.querySelector('[data-slot="agent-run-history"]'); scroller.scrollTop += dates.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 180; })()`,
      );
      await page.screenshot({
        path: `storage/ui-workflow/issue-runs/screenshots/history-${width}-${assistant ? 'assistant' : 'plain'}.png`,
      });
    };
    for (const width of [375, 1280, 1600]) await check(width, false);
    const layout = page.locator('[data-slot="issue-detail-layout"]');
    const inset =
      1600 -
      (await layout.evaluate(
        (element) =>
          (element as unknown as { clientWidth: number }).clientWidth,
      ));
    for (const available of [895, 896, 897, 1023])
      await check(available + inset, false);
    await expect(aside.locator(':scope > div')).toHaveCSS('position', 'static');
    await history
      .getByRole('button', { name: '查看全部 6 条' })
      .scrollIntoViewIfNeeded();
    expect(
      await page
        .locator('[data-slot="route-child-page"] > div')
        .evaluate(
          (element) => (element as unknown as { scrollTop: number }).scrollTop,
        ),
    ).toBeGreaterThan(0);

    await page.screenshot({
      path: 'storage/ui-workflow/issue-runs/screenshots/history-bottom.png',
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.keyboard.press('Control+j');
    await expect(page.getByTestId('chat-panel')).toBeVisible();
    await check(1280, true);
    await page
      .getByRole('button', { name: 'Toggle Sidebar', exact: true })
      .click();
    await check(1280, true);
    const verifySummaryFocus = async () => {
      for (const trigger of [
        page.locator('a').filter({ has: page.getByTestId('run-live') }),
        page.getByTestId('run-row-sidebar-run-0').getByRole('link'),
      ]) {
        await trigger.focus();
        await trigger.press('Enter');
        await expect(
          page.getByRole('dialog', { name: '运行记录', exact: true }),
        ).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(
          page.getByRole('dialog', { name: '运行记录', exact: true }),
        ).toBeHidden();
        await expect(trigger).toBeFocused();
      }
    };
    await verifySummaryFocus();
    const link = history.getByRole('link').first();
    await link.focus();
    await page.setViewportSize({ width: 1600, height: 900 });
    await expect(link).toBeFocused();
    await link.press('Enter');
    await expect(
      page.getByRole('dialog', { name: '运行记录', exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('dialog', { name: '运行记录', exact: true }),
    ).toBeHidden();
    await expect(link).toBeFocused();
    const all = history.getByRole('button', { name: '查看全部 6 条' });
    await all.click();
    await page.getByTestId('all-runs').getByRole('link').last().click();
    await expect(
      page.getByRole('dialog', { name: '运行记录', exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('all-runs')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('dialog', { name: '运行记录', exact: true }),
    ).toBeHidden();
    await expect(all).toBeFocused();
    await verifySummaryFocus();
    for (const locale of ['en-US', 'zh-CN']) {
      for (const mode of ['light', 'dark']) {
        await api.patch('users/me/preferences', { locale, 'theme.mode': mode });
        await page.evaluate(
          `localStorage.setItem('nocobase.locale', '${locale}'); localStorage.setItem('nocobase:main:theme:color-scheme', '${mode}');`,
        );
        await page.reload();
        await expect(history).toBeVisible();
        await expect(
          history.getByRole('heading', {
            name: locale === 'en-US' ? 'Execution log' : '执行记录',
            exact: true,
          }),
        ).toBeVisible();
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
        await page.evaluate(
          `(() => { const scroller = document.querySelector('[data-slot="route-child-page"] > div'); const dates = document.querySelector('[data-slot="agent-run-history"]'); scroller.scrollTop += dates.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 180; })()`,
        );
        await page.screenshot({
          path: `storage/ui-workflow/issue-runs/screenshots/history-${locale}-${mode}.png`,
        });
      }
    }
    hold = true;
    await page.reload();
    await expect(
      history.getByRole('status', { name: '正在加载执行记录…' }),
    ).toBeVisible();
    await history.screenshot({
      path: 'storage/ui-workflow/issue-runs/screenshots/loading.png',
    });
    hold = false;
    release?.();
    await expect(history.getByTestId('run-sidebar-run-0')).toBeVisible();
    for (const code of [500, 403, 404]) {
      status = code;
      await page.reload();
      await expect(history.getByRole('alert')).toBeVisible();
      if (code === 500)
        await expect(
          history.getByRole('button', { name: '重试', exact: true }),
        ).toBeVisible();
      else
        await expect(
          history.getByRole('button', { name: '重试', exact: true }),
        ).toHaveCount(0);
      await history.screenshot({
        path: `storage/ui-workflow/issue-runs/screenshots/error-${code}.png`,
      });
    }
    status = 200;
    visibleRecords = [];
    await page.reload();
    await expect(history.getByText('暂无运行。')).toBeVisible();
    await history.screenshot({
      path: 'storage/ui-workflow/issue-runs/screenshots/empty.png',
    });
  });

  test('a comment is posted, shown in the timeline and kept after a reload', async ({
    page,
  }) => {
    await open(page, `/issues/${issue.identifier}`);
    await expect(
      page.getByRole('heading', { name: issue.title, level: 1 }),
    ).toBeVisible();

    const text = `端到端评论 ${unique()}`;
    const editor = page.getByRole('textbox', { name: '评论' });
    await editor.click();
    await editor.pressSequentially(text);
    await page.getByRole('button', { name: '评论', exact: true }).click();

    const timeline = page.getByRole('list', { name: '动态' });
    await expect(
      timeline.getByRole('article').filter({ hasText: text }),
    ).toBeVisible();
    await expect(editor).toHaveText('');

    await page.reload();
    await expect(
      page
        .getByRole('list', { name: '动态' })
        .getByRole('article')
        .filter({ hasText: text }),
    ).toBeVisible();
  });

  test('a file uploaded to the attachments is listed and downloadable', async ({
    page,
    api,
  }) => {
    await open(page, `/issues/${issue.identifier}`);
    // Attachments are added from the description's Add bar; their section appears with the first one.
    const chooser = page.waitForEvent('filechooser');
    await page
      .getByRole('group', { name: '添加' })
      .getByRole('button', { name: '附件' })
      .click();
    await (
      await chooser
    ).setFiles({
      name: '需求说明.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('端到端测试上传的附件。\n'),
    });

    const attachments = page.getByRole('region', { name: '附件' });
    const files = attachments.getByRole('list', { name: '文件' });
    await expect(
      files.getByRole('button', { name: '预览 需求说明.txt' }),
    ).toBeVisible();
    await expect(files.getByRole('listitem')).toHaveCount(1);

    const download = page.waitForEvent('download');
    await files.getByRole('button', { name: '下载 需求说明.txt' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('需求说明.txt');
    const listed = await api.get<{ filename: string; size: number }[]>(
      `projects/issues/${issue.id}/attachments`,
    );
    expect(listed.map((item) => item.filename)).toEqual(['需求说明.txt']);
  });

  test('a comment wakeup and slow run results appear without reloading the issue', async ({
    page,
    api,
  }, testInfo) => {
    await api.patch(`projects/issues/${issue.id}`, {
      statusKey: 'in_progress',
      executor: null,
      start: false,
    });
    const runner = new FakeRunner(api, `live-issue-${unique()}`);
    await runner.agent();
    const runsPath = `agents/runs?subjectKind=issue&subjectId=${issue.id}`;
    expect(await api.get<unknown[]>(runsPath)).toEqual([]);
    await open(page, `/issues/${issue.identifier}`);
    await expect(
      page.getByRole('heading', { name: issue.title }),
    ).toBeVisible();

    // Real API responses take longer than either discovery interval, reproducing a slow connection.
    await page.route('**/api/agents/runs?*', async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 6000));
      await route.fulfill({ response });
    });
    const navigations: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) navigations.push(frame.url());
    });
    // Runs are system records, folded under "Conversation only".
    await page
      .getByTestId('issue-feed')
      .getByRole('button', { name: '全部', exact: true })
      .click();
    // A person's mention wakes the runner's agent.
    await runner.wake(issue);
    const running = await runner.start(issue.identifier);
    const timeline = page.getByRole('list', { name: '动态' });
    await expect(timeline.getByText(/开始工作/u)).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({ path: testInfo.outputPath('run-started.png') });

    const result = `已完成检查 ${unique()}`;
    await api.post(
      `projects/issues/${issue.id}/comments`,
      { content: result },
      { 'x-nocobase-run-token': running.token },
    );
    await runner.complete(running.runId, result);
    // A finished run ends the agent's turn.
    await expect(timeline.getByText(/本轮结束$/u)).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      timeline.getByRole('article').filter({ hasText: result }),
    ).toBeVisible();
    expect(navigations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('run-completed.png') });
    await page.unrouteAll({ behavior: 'wait' });
  });

  test('changing the status from the properties panel is saved', async ({
    page,
    api,
  }) => {
    await open(page, `/issues/${issue.identifier}`);
    const properties = page.getByRole('region', { name: '属性' });
    await properties.getByRole('combobox', { name: '状态' }).click();
    await page.getByRole('option', { name: '进行中' }).click();
    await expect(
      properties.getByRole('combobox', { name: '状态' }),
    ).toContainText('进行中');
    await expect
      .poll(
        async () =>
          (await api.get<Issue>(`projects/issues/${issue.id}`)).statusKey,
      )
      .toBe('in_progress');
  });

  test('a backlog issue says it has not started and Start moves it to In progress', async ({
    page,
    api,
  }) => {
    await open(page, `/issues/${issue.identifier}`);
    const now = page.getByRole('region', { name: '现在' });
    await expect(now).toContainText('还没开始');
    await now.getByRole('button', { name: '开始', exact: true }).click();
    await expect
      .poll(
        async () =>
          (await api.get<Issue>(`projects/issues/${issue.id}`)).statusKey,
      )
      .toBe('in_progress');
    await expect(
      page
        .getByRole('region', { name: '属性' })
        .getByRole('combobox', { name: '状态' }),
    ).toContainText('进行中');
    await expect(
      now.getByRole('button', { name: '开始', exact: true }),
    ).toBeHidden();
  });

  test('only the owner starts; another user comments as a trigger and the transcript names both', async ({
    page,
    api,
    browser,
    context,
  }) => {
    test.setTimeout(120_000);
    const admin = await apiAs(browser, 'admin');
    const suffix = unique();
    const triggerUser = {
      email: `identity-trigger-${suffix}@example.com`,
      password: 'identity-trigger-e2e-password',
    };
    const triggerName = `Identity trigger ${suffix}`;
    const runner = new FakeRunner(
      admin.api,
      `owner-identity-${unique()}`,
      true,
    );
    const settings = await admin.api.get<{
      firstChoiceAgentId: string | null;
      fallbackAgentId: string | null;
    }>('projectManager');
    try {
      const choice = await runner.agent();
      await admin.api.patch('projectManager', {
        firstChoiceAgentId: choice,
        fallbackAgentId: null,
      });
      await admin.api.post('users', {
        ...triggerUser,
        name: triggerName,
        roleScopes: { studio: ['admin'] },
      });
      await signIn(context, triggerUser);
      await open(page, `/issues/${issue.identifier}`);
      await expect(
        page
          .getByRole('region', { name: '现在' })
          .getByRole('button', { name: '开始', exact: true }),
      ).toHaveCount(0);
      await expect(
        api.post(`projectManager/issues/${issue.id}/start`),
      ).rejects.toThrow('ISSUE_OWNER_START_REQUIRED');
      await signIn(context, 'alex');
      await open(page, `/issues/${issue.identifier}`);
      await page
        .getByRole('region', { name: '现在' })
        .getByRole('button', { name: '开始', exact: true })
        .click();
      await expect
        .poll(
          async () =>
            (await api.get<Issue>(`projects/issues/${issue.id}`)).statusKey,
        )
        .toBe('in_progress');
      const first = await runner.start(issue.identifier);
      await runner.complete(first.runId, 'Ready for comments.');
      await signIn(context, triggerUser);
      const trigger = await api.get<{ userId: string }>('projects/me');
      await api.post(`projects/issues/${issue.id}/comments`, {
        content: `Please check the implementation, ${suffix}.`,
      });
      const started = await runner.start(issue.identifier);
      const detail = await admin.api.get<{
        actorUserId: string;
        requestedByUserId: string;
      }>(`agents/runs/${started.runId}`);
      expect(detail.actorUserId).toBe(me.userId);
      expect(detail.requestedByUserId).toBe(trigger.userId);
      await open(page, `/issues/${issue.identifier}/runs/${started.runId}`);
      await expect(page.getByTestId('run-model')).toContainText('使用模型：');
      await expect(page.getByText(/运行身份：Alex Turner/u)).toBeVisible();
      await expect(
        page.getByText(new RegExp(`触发人：${triggerName}`, 'u')),
      ).toBeVisible();
      await page.screenshot({
        path: test.info().outputPath('manager-identity-zh.png'),
      });
      await api.patch('users/me/preferences', {
        locale: 'en-US',
        'theme.mode': 'dark',
      });
      await page.evaluate(() => {
        localStorage.setItem('nocobase.locale', 'en-US');
        localStorage.setItem('nocobase:main:theme:color-scheme', 'dark');
      });
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload();
      await expect(page.getByTestId('run-model')).toContainText('Model:');
      await expect(page.getByText(/Running as Alex Turner/u)).toBeVisible();
      await expect(
        page.getByText(new RegExp(`Triggered by ${triggerName}`, 'u')),
      ).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: test.info().outputPath('manager-identity-en-mobile.png'),
      });
    } finally {
      await admin.api.patch('projectManager', {
        firstChoiceAgentId: settings.firstChoiceAgentId,
        fallbackAgentId: settings.fallbackAgentId,
      });
      await admin.close();
    }
  });

  test('the project manager arranges an issue among the agents', async ({
    page,
  }) => {
    await open(page, `/issues/${issue.identifier}`);
    const properties = page.getByRole('region', { name: '属性' });
    await properties.getByRole('combobox', { name: '安排' }).click();
    // Of the agents, only the project manager is offered; people still are.
    await expect(
      page.getByRole('option', { name: /项目经理|Project manager/ }),
    ).toBeVisible();
    await expect(page.getByRole('option', { name: /Claude ·/ })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });
});
