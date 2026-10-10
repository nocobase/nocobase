import {
  apiAs,
  expect,
  open,
  test,
  unique,
  type Api,
} from './support/fixtures.ts';
import { projectWithDoneApproval } from './support/approval.ts';
import { FakeRunner, type Issue } from './support/runner.ts';
import type { Page } from '@playwright/test';

/** Opens the waiting decisions view and the item whose title is given. */
async function openDecision(page: Page, title: string) {
  await open(page, '/inbox');
  await page.getByRole('tab', { name: /^待我决定/ }).click();
  const list = page.getByRole('list', { name: '待我决定' });
  await list
    .getByRole('button', { name: new RegExp(title) })
    .first()
    .click();
  return page.getByRole('article').filter({ hasText: title }).first();
}

test.describe('inbox decisions', () => {
  let me: { userId: string };

  test.beforeEach(async ({ api }) => {
    me = await api.get<{ userId: string }>('projects/me');
  });

  test.describe('status change approval', () => {
    /**
     * Lisa Nguyen finishes her issue in a project led by Alex Turner, whose workflow makes moving to Done wait for the
     * lead.
     */
    async function requestDone(
      api: Api,
      browser: import('@playwright/test').Browser,
    ) {
      const project = await projectWithDoneApproval(api, me.userId);
      const lisa = await apiAs(browser, 'lisa');
      try {
        const lisaMe = await lisa.api.get<{ userId: string }>('projects/me');
        const issue = await api.post<Issue>('projects/issues', {
          title: `待审批的任务 ${unique()}`,
          projectId: project.id,
          ownerUserId: lisaMe.userId,
          statusKey: 'in_progress',
          executor: { type: 'user', id: lisaMe.userId },
        });
        const current = await lisa.api.get<Issue>(
          `projects/issues/${issue.id}`,
        );
        await lisa.api.patch(`projects/issues/${issue.id}`, {
          revision: current.revision,
          statusKey: 'done',
        });
        return issue;
      } finally {
        await lisa.close();
      }
    }

    test('switching to notifications clears the selected decision and hides its approval actions', async ({
      page,
      api,
      browser,
    }) => {
      const issue = await requestDone(api, browser);
      const card = await openDecision(page, issue.title);
      await expect(
        card.getByRole('button', { name: '批准', exact: true }),
      ).toBeVisible();
      const decisions = page.getByRole('tab', { name: /^待我决定/ });
      const notifications = page.getByRole('tab', { name: /^通知/ });
      await expect(decisions.getByLabel(/\d+ 项待处理/)).toBeVisible();
      await expect(notifications.getByLabel(/\d+ 条未读/)).toBeVisible();
      expect(new URL(page.url()).searchParams.get('item')).toBeTruthy();

      await notifications.click();
      await expect(page).toHaveURL(/view=notifications/);
      expect(new URL(page.url()).searchParams.has('item')).toBe(false);
      await expect(notifications).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('list', { name: '待我决定' })).toBeHidden();
      await expect(card).toBeHidden();
      await expect(
        page.getByRole('button', { name: '批准', exact: true }),
      ).toBeHidden();

      await decisions.click();
      await expect(page).toHaveURL(/view=todo/);
      await expect(page.getByRole('list', { name: '待我决定' })).toBeVisible();
    });

    test('the project lead approves a move to Done from the inbox', async ({
      page,
      api,
      browser,
    }) => {
      const issue = await requestDone(api, browser);
      expect(
        (await api.get<Issue>(`projects/issues/${issue.id}`)).statusKey,
      ).toBe('in_progress');

      const card = await openDecision(page, issue.title);
      await expect(card.getByText('状态变更待审批')).toBeVisible();
      await expect(
        card.getByText('Lisa Nguyen 申请将状态从 进行中 改为 已完成。'),
      ).toBeVisible();
      await card.getByRole('button', { name: '批准', exact: true }).click();

      await expect
        .poll(
          async () =>
            (await api.get<Issue>(`projects/issues/${issue.id}`)).statusKey,
        )
        .toBe('done');
      await expect(
        card.getByRole('button', { name: '批准', exact: true }),
      ).toBeHidden();
    });

    test('the project lead rejects a move to Done from the inbox', async ({
      page,
      api,
      browser,
    }) => {
      const issue = await requestDone(api, browser);
      const card = await openDecision(page, issue.title);
      expect(
        (await api.get<Issue>(`projects/issues/${issue.id}`)).pendingApproval,
      ).toBeTruthy();
      await card.getByRole('button', { name: '驳回', exact: true }).click();
      const reason = card.getByRole('textbox', {
        name: `驳回：${issue.title}`,
      });
      await reason.fill('还有一项验收标准没有完成。');
      await card.getByRole('button', { name: '驳回', exact: true }).click();

      await expect(reason).toBeHidden();
      await expect(
        card.getByRole('button', { name: '批准', exact: true }),
      ).toBeHidden();
      await expect
        .poll(
          async () =>
            (await api.get<Issue>(`projects/issues/${issue.id}`))
              .pendingApproval ?? null,
        )
        .toBeNull();
      expect(
        (await api.get<Issue>(`projects/issues/${issue.id}`)).statusKey,
      ).toBe('in_progress');
    });
  });

  test.describe('design proposal', () => {
    test('the owner approves it from the inbox', async ({ page, api }) => {
      const runner = new FakeRunner(api, `inbox-approve-${unique()}`);
      const issue = await runner.issueWithDesignProposal(
        `流式导出（收件箱批准）${unique()}`,
        { ownerUserId: me.userId },
      );
      const card = await openDecision(page, issue.title);
      const proposal = card.getByRole('article', { name: '设计方案' }).or(card);
      await expect(
        proposal.getByRole('heading', { name: '验证计划' }).first(),
      ).toBeVisible();
      await proposal
        .getByRole('button', { name: '批准进入开发' })
        .first()
        .click();

      await expect
        .poll(
          async () =>
            (await api.get<Issue>(`projects/issues/${issue.id}`)).statusKey,
        )
        .toBe('in_progress');
    });

    test('the owner sends it back from the inbox with a comment', async ({
      page,
      api,
    }) => {
      const runner = new FakeRunner(api, `inbox-back-${unique()}`);
      const issue = await runner.issueWithDesignProposal(
        `流式导出（收件箱打回）${unique()}`,
        { ownerUserId: me.userId },
      );
      const card = await openDecision(page, issue.title);
      await card.getByRole('button', { name: '打回修改' }).first().click();
      await card.getByRole('textbox').last().fill('先只做 CSV。');
      await card
        .getByRole('button', { name: /打回|发送|提交/ })
        .last()
        .click();

      await expect
        .poll(
          async () =>
            (await api.get<Issue>(`projects/issues/${issue.id}`)).statusKey,
        )
        .toBe('analysis');
    });
  });
});
