import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';

import { expect, open, test, unique } from './support/fixtures.ts';

const viewports = [
  { width: 1280, height: 800 },
  { width: 760, height: 560 },
  { width: 375, height: 667 },
];

for (const viewport of viewports) {
  test(`a long intake confirmation keeps its actions visible at ${viewport.width}px`, async ({
    page,
    api,
  }) => {
    await page.addInitScript(
      "localStorage.setItem('nocobase.locale', 'zh-CN')",
    );
    const me = await api.get<{ userId: string }>('projects/me');
    const members = await api.get<{ userId: string }[]>('projects/members');
    const owner = members.find((member) => member.userId !== me.userId)!;
    const tag = unique();
    const plan = await api.post<Plan>('projects/plans', {
      title: `Intake layout ${tag}`,
      source: { kind: 'intake' },
      rows: Array.from({ length: 18 }, (_, index) => ({
        op: 'issue.create',
        params: {
          title: `Report ${index + 1} ${tag}: validate every supported export format`,
          ownerUserId: owner.userId,
          statusKey: 'backlog',
          executor: null,
        },
      })),
    });
    await open(page, `/issues/new?tab=ai&draft=${plan.id}`);
    const draft = page.getByRole('dialog', { name: '新建任务', exact: true });
    await page.setViewportSize(viewport);
    await draft.getByRole('button', { name: '创建 18 个任务' }).click();
    const confirmation = page.getByRole('alertdialog');
    const cancel = confirmation.getByRole('button', {
      name: '取消',
      exact: true,
    });
    const execute = confirmation.getByRole('button', {
      name: '执行',
      exact: true,
    });
    await expect(cancel).toBeInViewport({ ratio: 1 });
    await expect(execute).toBeInViewport({ ratio: 1 });
    const list = confirmation.getByRole('list');
    const scroll = await list.evaluate((element) => {
      const area = element as unknown as {
        scrollTop: number;
        scrollHeight: number;
      };
      area.scrollTop = area.scrollHeight;
      return area.scrollTop;
    });
    expect(scroll).toBeGreaterThan(0);
    await expect(execute).toBeInViewport({ ratio: 1 });
    await cancel.click();
    await expect(confirmation).toBeHidden();
    await draft.getByRole('button', { name: '创建 18 个任务' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '执行', exact: true })
      .click();
    await expect(draft).toBeHidden();
    await expect
      .poll(
        async () => (await api.get<Plan>(`projects/plans/${plan.id}`)).status,
      )
      .toBe('executed');
  });
}
