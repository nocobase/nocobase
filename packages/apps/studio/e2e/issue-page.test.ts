import {
  expect,
  open,
  test,
  unique,
  horizontalOverflow,
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
  }) => {
    test.setTimeout(120_000);
    const name = 'Layout Agent with a very long readable name '.repeat(3);
    const agent = await api.post<{ id: string }>('agents', {
      name,
      modelEntries: [{ tool: 'claude' }],
      access: 'everyone',
    });
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
        available >= 1024 ? 'row' : 'column',
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
    for (const available of [1023, 1024, 1025])
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
    await page.getByTestId('chat-header-button').click();
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
    await api.patch(`projects/issues/${issue.id}`, {
      executor: { type: 'agent', id: agent.id },
    });
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

  test.describe('design proposal', () => {
    test('approving it from the issue page moves the issue to In progress', async ({
      page,
      api,
    }) => {
      const runner = new FakeRunner(api, `issue-approve-${unique()}`);
      const proposal = await runner.issueWithDesignProposal(
        `流式导出（任务页批准）${unique()}`,
        { ownerUserId: me.userId },
      );
      await open(page, `/issues/${proposal.identifier}`);
      const card = page.getByRole('article', { name: '设计方案' });
      await expect(card.getByRole('heading', { name: '方案' })).toBeVisible();
      await card.getByRole('button', { name: '批准进入开发' }).click();

      await expect
        .poll(
          async () =>
            (await api.get<Issue>(`projects/issues/${proposal.id}`)).statusKey,
        )
        .toBe('in_progress');
      await expect(
        card.getByRole('button', { name: '批准进入开发' }),
      ).toBeHidden();
      await expect(
        page
          .getByRole('region', { name: '属性' })
          .getByRole('combobox', { name: '状态' }),
      ).toContainText('进行中');
    });

    test('sending it back with a comment returns the issue to Analysis', async ({
      page,
      api,
    }) => {
      const runner = new FakeRunner(api, `issue-back-${unique()}`);
      const proposal = await runner.issueWithDesignProposal(
        `流式导出（任务页打回）${unique()}`,
        { ownerUserId: me.userId },
      );
      await open(page, `/issues/${proposal.identifier}`);
      const card = page.getByRole('article', { name: '设计方案' });
      await card.getByRole('button', { name: '打回修改' }).click();
      const reason = '请补充旧浏览器的降级方案。';
      await card.getByRole('textbox').fill(reason);
      await card
        .getByRole('button', { name: /打回|发送|提交/ })
        .last()
        .click();

      await expect
        .poll(
          async () =>
            (await api.get<Issue>(`projects/issues/${proposal.id}`)).statusKey,
        )
        .toBe('analysis');
      await expect(
        page.getByRole('list', { name: '动态' }).getByText(reason),
      ).toBeVisible();
    });
  });
});
