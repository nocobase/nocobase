/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { expect, test } from '@nocobase/test/e2e';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

test('renders a JS Page through the legacy /admin shell with the Light Extension bundles loaded', async ({ page }) => {
  const pageUid = uid();
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(message.text());
    }
  });

  await page.goto('/admin');
  const headers = await page.evaluate(() => {
    const values: Record<string, string> = {
      'X-With-Acl-Meta': 'true',
    };
    const token = window.localStorage.getItem('NOCOBASE_TOKEN');
    const authenticator = window.localStorage.getItem('NOCOBASE_AUTH');
    const role = window.localStorage.getItem('NOCOBASE_ROLE');
    const locale = window.localStorage.getItem('NOCOBASE_LOCALE');
    if (token) values.Authorization = `Bearer ${token}`;
    if (authenticator) values['X-Authenticator'] = authenticator;
    if (role) values['X-Role'] = role;
    if (locale) values['X-Locale'] = locale;
    return values;
  });

  const createResponse = await page.request.post('/api/desktopRoutes:create?layout=admin-layout-model', {
    headers,
    data: {
      type: 'flowPage',
      title: `Legacy JS Page ${pageUid}`,
      schemaUid: pageUid,
      menuSchemaUid: uid(),
      enableTabs: false,
      options: { pageType: 'js-page' },
      children: [
        {
          type: 'tabs',
          schemaUid: uid(),
          tabSchemaName: uid(),
          hidden: true,
        },
      ],
    },
  });
  expect(createResponse.ok(), await createResponse.text()).toBe(true);
  const createBody: unknown = await createResponse.json();
  const routeId = isRecord(createBody) && isRecord(createBody.data) ? createBody.data.id : undefined;

  try {
    await page.goto(`/admin/${pageUid}`);
    await expect(page.getByText('JavaScript page is ready')).toBeVisible();
    await expect(page.getByText(/^Page ID: \S+$/u)).toBeVisible();
    expect(
      runtimeErrors.filter((message) => /RequireJS|AMD|ChunkLoadError|Cannot find module/iu.test(message)),
    ).toEqual([]);
  } finally {
    if (typeof routeId === 'number' || typeof routeId === 'string') {
      await page.request.post(`/api/desktopRoutes:destroy?filterByTk=${routeId}`, { headers });
    }
    await page.request.post(`/api/flowModels:destroy?filterByTk=${pageUid}`, { headers });
  }
});
