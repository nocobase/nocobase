/** The same personal table and following content scroll independently, or remain reachable by partitions. */
import {
  expect,
  horizontalOverflow,
  open,
  test,
  unique,
} from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';
import {
  deleteTestIssues,
  wheelTo,
  workspaceGeometry,
} from './support/personal-task-scroll.ts';

// Following preferences are per user: do not race the follow-ups or phone file's fixtures.
test.use({ user: 'wendy' });

test.describe('personal task columns', () => {
  test('each region scrolls to its last item at common desktop sizes and below the column threshold', async ({
    page,
    api,
    browser,
  }) => {
    test.setTimeout(180_000);
    const me = await api.get<{ userId: string }>('projects/me');
    const suffix = unique();
    const issues: Issue[] = [];
    try {
      for (let index = 0; index < 32; index += 1) {
        const issue = await api.post<Issue>('projects/issues', {
          title: `验收列表 ${suffix} ${String(index).padStart(2, '0')}`,
          ownerUserId: me.userId,
          executor: null,
          start: false,
        });
        await api.patch(`projects/issues/${issue.id}`, {
          revision: issue.revision,
          statusKey: 'in_review',
        });
        issues.push(issue);
      }
      const oldest = `最早动态 ${suffix}`;
      await api.post(`projects/issues/${issues[4]!.id}/comments`, {
        content: oldest,
      });
      for (let index = 0; index < 12; index++)
        await api.post(`projects/issues/${issues[4]!.id}/comments`, {
          content: `动态 ${index} ${'较长的回复内容。'.repeat(40)}`,
        });
      await api.put('followUps/following', {
        issueIds: issues.slice(0, 5).map((issue) => issue.id),
      });
      for (const viewport of [
        { width: 1512, height: 800 },
        { width: 1440, height: 760 },
        { width: 1280, height: 680 },
        { width: 1728, height: 1000 },
        { width: 1600, height: 844 },
        { width: 1309, height: 691 },
      ]) {
        await page.setViewportSize(viewport);
        await open(page, `/follow-ups?view=list&tab=mine&q=${suffix}`);
        const workspace = page.getByTestId('personal-task-workspace');
        let measured: Awaited<ReturnType<typeof workspaceGeometry>> | undefined;
        try {
          await expect
            .poll(async () => {
              measured = await workspaceGeometry(workspace);
              return measured;
            }, 'Content width, the 69rem threshold and rendered columns must agree')
            .toMatchObject({ consistent: true });
        } finally {
          await test
            .info()
            .attach(`workspace-geometry-${viewport.width}.json`, {
              body: JSON.stringify({ viewport, measured }),
              contentType: 'application/json',
            });
          console.info(
            'Workspace geometry:',
            JSON.stringify({ viewport, measured }),
          );
        }
        if (!measured) throw new Error('Workspace measurement did not execute');
        const wide = measured.width >= measured.threshold;
        if (wide) await expect(workspace).toHaveAttribute('data-columns');
        else await expect(workspace).not.toHaveAttribute('data-columns');
        const table = page.getByRole('table');
        const rows = table.getByRole('row').filter({ hasText: suffix });
        await expect(rows).toHaveCount(32);
        await wheelTo(page, table, rows.last().getByRole('link'), true);
        if (!wide)
          await page
            .getByRole('navigation', { name: '个人任务分区' })
            .getByRole('button', { name: '关注', exact: true })
            .click();
        const rail = page.getByTestId('follow-ups-following');
        const lastFollow = rail
          .getByRole('button')
          .filter({ hasText: issues[4]!.title });
        await expect(lastFollow).toBeVisible();
        // Long following cards may overflow; reach the last one without requiring the whole page to scroll.
        await lastFollow.scrollIntoViewIfNeeded();
        await expect(lastFollow).toBeInViewport({ ratio: 1 });
        await lastFollow.click();
        const activity = page.getByRole('region', { name: '任务动态' });
        await expect(activity.getByTestId('issue-feed')).toBeVisible();
        await wheelTo(
          page,
          activity,
          activity.locator('[data-comment-id]').filter({ hasText: oldest }),
          true,
        );
        await expect(activity.getByTestId('issue-composer')).toBeInViewport({
          ratio: 1,
        });
        if (!wide) {
          await activity.getByRole('button', { name: '返回列表' }).click();
          await expect(rail).toBeVisible();
          await page
            .getByRole('navigation', { name: '个人任务分区' })
            .getByRole('button', { name: '我的任务-α', exact: true })
            .click();
          console.info(
            'Partition return:',
            JSON.stringify({
              url: page.url(),
              geometry: await workspaceGeometry(workspace),
              tables: await table.count(),
              rows: await rows.count(),
              preview: await activity.count(),
            }),
          );
          await expect(
            page
              .getByRole('navigation', { name: '个人任务分区' })
              .getByRole('button', { name: '我的任务-α', exact: true }),
          ).toHaveAttribute('aria-pressed', 'true');
          await expect(table).toBeVisible();
          await expect(rows).toHaveCount(32);
          await expect(rows.last().getByRole('link')).toBeInViewport({
            ratio: 1,
          });
        }
        const box = (await workspace.boundingBox())!;
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
        await expect(
          page.getByRole('heading', { name: '我的任务-α', level: 1 }).last(),
        ).toBeInViewport({ ratio: 1 });
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      }
    } finally {
      await api.put('followUps/following', { issueIds: [] });
      await deleteTestIssues(
        browser,
        issues.map((issue) => issue.id),
      );
    }
  });
});
