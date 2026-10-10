import { expect, open, test, unique } from './support/fixtures.ts';
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
    await page.getByRole('option', { name: '开发中' }).click();
    await expect(
      properties.getByRole('combobox', { name: '状态' }),
    ).toContainText('开发中');
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
      ).toContainText('开发中');
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
