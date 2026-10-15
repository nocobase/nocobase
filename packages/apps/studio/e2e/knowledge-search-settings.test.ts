import type { Route } from '@playwright/test';

import type {
  KnowledgeSearchConfig,
  KnowledgeSearchSettings,
} from '../shared/knowledge.js';
import { expect, test } from './support/fixtures.ts';

// Settings are global: this worker owns a separate Studio and restores every case.
test.use({ isolatedStudio: true, user: 'admin', locale: 'en-US' });

for (const order of [
  ['recall', 'chunking'],
  ['chunking', 'recall'],
] as const) {
  test(`keeps both knowledge settings saves: ${order.join(' then ')}`, async ({
    page,
    api,
    studio,
  }) => {
    const original = (await api.get<KnowledgeSearchConfig>('knowledgeSearch'))
      .settings;
    const pending: Route[] = [];
    const requests: KnowledgeSearchSettings[] = [];
    try {
      await api.patch('users/me/preferences', { locale: 'en-US' });
      await page.addInitScript(
        "localStorage.setItem('nocobase.locale', 'en-US')",
      );
      await page.goto(`${studio.baseURL}/config/knowledge-search`, {
        waitUntil: 'domcontentloaded',
      });
      const limit = page.locator('#kb-search-recall-limit');
      const target = page.locator('#kb-search-chunking-target');
      await expect(limit).toBeVisible();
      const nextLimit = original.recall.limit === 21 ? 22 : 21;
      const nextTarget = original.chunking.target === 1300 ? 1400 : 1300;
      await limit.fill(String(nextLimit));
      await target.fill(String(nextTarget));
      const save = (kind: string) =>
        page
          .locator(`section[aria-labelledby="kb-search-${kind}"]`)
          .getByRole('button', { name: 'Save', exact: true });
      await page.route('**/api/knowledgeSearch', async (route) => {
        if (route.request().method() !== 'PUT') return route.continue();
        requests.push(
          route.request().postDataJSON() as KnowledgeSearchSettings,
        );
        pending.push(route);
      });
      await save(order[0]).click();
      await expect.poll(() => pending.length).toBe(1);
      await save(order[1]).click();
      await expect(save(order[1])).toBeDisabled();
      expect(pending).toHaveLength(1);
      for (let index = 0; index < 2; index++) {
        await expect.poll(() => pending.length).toBe(index + 1);
        const route = pending[index]!;
        const response = page.waitForResponse(
          (answer) => answer.request() === route.request(),
        );
        await route.continue();
        expect((await response).status()).toBe(200);
        await expect(
          page
            .getByText('Knowledge search settings saved', { exact: true })
            .last(),
        ).toBeVisible();
      }
      const expected = {
        ...original,
        recall: { ...original.recall, limit: nextLimit },
        chunking: { ...original.chunking, target: nextTarget },
      };
      expect(requests[1]).toEqual(expected);
      expect(
        (await api.get<KnowledgeSearchConfig>('knowledgeSearch')).settings,
      ).toEqual(expected);
      await page.unroute('**/api/knowledgeSearch');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(limit).toHaveValue(String(nextLimit));
      await expect(target).toHaveValue(String(nextTarget));
    } finally {
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await api.put('knowledgeSearch', original);
      expect(
        (await api.get<KnowledgeSearchConfig>('knowledgeSearch')).settings,
      ).toEqual(original);
    }
  });
}
