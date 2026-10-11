import { expect, open, test, unique, url } from './support/fixtures.ts';

// A valid one-pixel PNG; previews must decode actual image bytes.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);

interface StoredFile {
  id: string;
  filename: string;
}

test('pasted and manual images survive task creation while removed images are deleted', async ({
  page,
  api,
}, testInfo) => {
  const tag = unique();
  await open(page, '/issues/new');
  const dialog = page.getByRole('dialog', { name: '新建任务' });
  const box = dialog.getByRole('textbox', { name: '需求' });
  await box.fill(`- 图片附件 ${tag}`);
  const uploaded: StoredFile[] = [];
  page.on('response', async (response) => {
    if (
      response.request().method() === 'POST' &&
      response.url().endsWith('/api/projects/intake/files') &&
      response.ok()
    ) {
      uploaded.push(((await response.json()) as { data: StoredFile }).data);
    }
  });
  const names = ['first.png', 'second.png', 'removed.png'];
  await box.evaluate(
    (element, { names, bytes }) => {
      // Tooling runs in Node; these constructors are provided by the evaluated browser context.
      const browser = globalThis as unknown as {
        DataTransfer: new () => { items: { add(file: File): void } };
        ClipboardEvent: new (
          name: string,
          options: unknown,
        ) => Parameters<typeof element.dispatchEvent>[0];
      };
      const clipboard = new browser.DataTransfer();
      for (const name of names)
        clipboard.items.add(
          new File([new Uint8Array(bytes)], name, { type: 'image/png' }),
        );
      element.dispatchEvent(
        new browser.ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: clipboard,
        }),
      );
    },
    { names, bytes: [...PNG] },
  );
  await expect.poll(() => uploaded.length).toBe(3);
  for (const name of names)
    await expect(
      dialog.getByRole('button', { name: `预览 ${name}` }),
    ).toBeVisible();
  await dialog
    .getByTestId('intake-file-input')
    .setInputFiles({ name: 'manual.png', mimeType: 'image/png', buffer: PNG });
  await expect.poll(() => uploaded.length).toBe(4);
  await expect(
    dialog.getByRole('button', { name: '预览 manual.png' }),
  ).toBeVisible();

  await dialog.getByRole('button', { name: '预览 first.png' }).click();
  const preview = page.getByRole('dialog', { name: 'first.png' });
  await expect(preview).toBeVisible();
  await expect
    .poll(() =>
      preview
        .getByRole('img', { name: 'first.png' })
        .evaluate(
          (image: { complete: boolean; naturalWidth: number }) =>
            image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(preview).toBeHidden();

  const removed = uploaded.find((file) => file.filename === 'removed.png');
  expect(removed).toBeDefined();
  const deletion = page.waitForResponse(
    (response) =>
      response.request().method() === 'DELETE' &&
      response.url().endsWith(`/intake/files/${removed!.id}`),
  );
  await dialog.getByRole('button', { name: '移除 removed.png' }).click();
  expect((await deletion).status()).toBe(204);
  await expect(
    dialog.getByRole('button', { name: '预览 removed.png' }),
  ).toHaveCount(0);
  expect(
    (
      await page.request.get(
        url(`/api/projects/attachments/${removed!.id}/content`),
      )
    ).status(),
  ).toBe(404);

  const keptIds = ['first.png', 'second.png', 'manual.png'].map(
    (name) => uploaded.find((file) => file.filename === name)!.id,
  );
  const split = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().endsWith('/intake/split'),
  );
  await dialog.getByRole('button', { name: '按规则拆分', exact: true }).click();
  const response = await split;
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON()).toMatchObject({ fileIds: keptIds });
  const result = (await response.json()) as {
    data: { plan: { source: { data: { fileIds: string[] } } } };
  };
  expect(result.data.plan.source.data.fileIds).toEqual(keptIds);
  await dialog.getByRole('button', { name: '创建 1 个任务' }).click();
  await expect(dialog).toBeHidden();
  const issues = await api.get<{ id: string; identifier: string }[]>(
    `projects/issues?q=${encodeURIComponent(tag)}`,
  );
  expect(issues).toHaveLength(1);
  const attachments = await api.get<StoredFile[]>(
    `projects/issues/${issues[0]!.id}/attachments`,
  );
  expect(attachments.map((file) => file.id).sort()).toEqual(
    [...keptIds].sort(),
  );
  for (const file of attachments) {
    const content = await page.request.get(
      url(`/api/projects/attachments/${file.id}/content`),
    );
    expect(content.ok()).toBe(true);
    expect(content.headers()['content-type']).toContain('image/png');
    expect(await content.body()).toEqual(PNG);
  }
  expect(
    (
      await page.request.get(
        url(`/api/projects/attachments/${removed!.id}/content`),
      )
    ).status(),
  ).toBe(404);
  await open(page, `/issues/${issues[0]!.identifier}`);
  await expect(
    page.getByRole('button', { name: '预览 first.png' }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('created-image-attachments.png'),
    fullPage: true,
  });
});
