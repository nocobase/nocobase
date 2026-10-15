import type { Role } from '../shared/access.js';
import { expect, test, unique, url } from './support/fixtures.ts';

test.use({ user: 'admin' });

for (const locale of ['en-US', 'zh-CN'] as const) {
  const words =
    locale === 'en-US'
      ? {
          newRole: 'New role',
          name: 'Name',
          create: 'Create',
          duplicate: 'Duplicate as new role',
          marker: ' (copy)',
          budget: 93,
        }
      : {
          newRole: '新建角色',
          name: '名称',
          create: '创建',
          duplicate: '复制为新角色',
          marker: '（副本）',
          budget: 96,
        };

  test(`copies long and short role names with independent nonempty grants in ${locale}`, async ({
    page,
    api,
  }, testInfo) => {
    test.setTimeout(180_000);
    const preferences = await api.get<{ locale: string }>(
      'users/me/preferences',
    );
    await api.patch('users/me/preferences', { locale });
    const created: string[] = [];
    const rolePost = (response: import('@playwright/test').Response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/api/access/roles');
    try {
      for (const variant of ['long', 'short'] as const) {
        const title =
          variant === 'long' ? '1234567890'.repeat(10) : `QA ${unique()}`;
        await page.goto(url('/config/roles'));
        await page
          .getByRole('button', { name: words.newRole, exact: true })
          .click();
        const dialog = page.getByRole('dialog', {
          name: words.newRole,
          exact: true,
        });
        await dialog
          .getByRole('textbox', { name: words.name, exact: true })
          .fill(title);
        const creation = page.waitForResponse(rolePost);
        await dialog
          .getByRole('button', { name: words.create, exact: true })
          .click();
        const creationResponse = await creation;
        expect(creationResponse.status()).toBe(201);
        const source = ((await creationResponse.json()) as { data: Role }).data;
        created.push(source.key);
        await expect(dialog).toBeHidden();
        await expect(page).toHaveURL(url(`/config/roles/${source.key}`));
        await expect(
          page.getByRole('textbox', { name: words.name, exact: true }),
        ).toHaveValue(title);
        // Set up meaningful grants before exercising the real detail page's duplicate button.
        await api.patch(`access/roles/${source.key}`, {
          pages: ['pm-issues'],
          settings: { 'pm.labels/read': true },
          abilities: { 'pm.issues/view': 'all', 'pm.issues/edit': 'related' },
        });
        const before = await api.get<Role>(`access/roles/${source.key}`);
        await page.reload();
        const copyResponsePromise = page.waitForResponse(rolePost);
        await page
          .getByRole('button', { name: words.duplicate, exact: true })
          .click();
        const response = await copyResponsePromise;
        expect(response.status()).toBe(201);
        const copy = ((await response.json()) as { data: Role }).data;
        created.push(copy.key);
        const sent = response.request().postDataJSON() as Record<
          string,
          unknown
        >;
        expect(sent.title).toBe(title.slice(0, words.budget) + words.marker);
        expect(String(sent.title).length).toBeLessThanOrEqual(100);
        expect(copy.key).not.toBe(source.key);
        expect(copy.holderIds).toEqual([]);
        for (const field of ['pages', 'settings', 'abilities'] as const) {
          expect(sent[field]).toEqual(before[field]);
          expect(copy[field]).toEqual(before[field]);
        }
        await expect(page).toHaveURL(url(`/config/roles/${copy.key}`));
        await expect(
          page.getByRole('textbox', { name: words.name, exact: true }),
        ).toHaveValue(copy.title as string);
        await page.screenshot({
          path: testInfo.outputPath(`${locale}-${variant}-copy-success.png`),
        });
        await testInfo.attach(`${locale}-${variant}-page`, {
          path: testInfo.outputPath(`${locale}-${variant}-copy-success.png`),
          contentType: 'image/png',
        });
        await api.patch(`access/roles/${copy.key}`, {
          pages: [],
          settings: {},
          abilities: {},
        });
        expect(await api.get(`access/roles/${source.key}`)).toEqual(before);
        console.log(
          JSON.stringify({
            locale,
            variant,
            sourceCreate: 201,
            copyCreate: response.status(),
            requestTitle: sent.title,
            titleLength: String(sent.title).length,
            independentKey: true,
            nonemptyGrantsEqual: true,
            sourceUnchangedAfterCopyEdit: true,
            navigatedToCopy: true,
          }),
        );
      }
    } finally {
      for (const key of created.reverse())
        await api.delete(`access/roles/${key}`);
      expect(
        (await api.get<Role[]>('access/roles')).some((role) =>
          created.includes(role.key),
        ),
      ).toBe(false);
      await api.patch('users/me/preferences', { locale: preferences.locale });
      console.log(
        JSON.stringify({
          locale,
          cleanup: 'created roles removed and preference restored',
          count: created.length,
        }),
      );
    }
  });
}

test('role creation still rejects overlong titles and anonymous requests', async ({
  context,
  browser,
  api,
}) => {
  const before = await api.get<Role[]>('access/roles');
  const invalid = await context.request.post(url('/api/access/roles'), {
    headers: { origin: new URL(url('/')).origin },
    data: { title: 'x'.repeat(101) },
  });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).error.reason).toBe('INVALID_TITLE');
  const anonymous = await browser.newContext();
  try {
    const request = {
      headers: { origin: new URL(url('/')).origin },
      data: { title: 'QA copy' },
    };
    expect(
      (
        await anonymous.request.post(url('/api/access/roles'), request)
      ).status(),
    ).toBe(401);
    expect(await api.get('access/roles')).toEqual(before);
    console.log(
      JSON.stringify({
        invalidTitle: 400,
        anonymous: 401,
        noRoleWritten: true,
      }),
    );
  } finally {
    await anonymous.close();
  }
});
