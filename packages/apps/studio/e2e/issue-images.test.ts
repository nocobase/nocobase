import { mkdirSync, writeFileSync } from 'node:fs';
import { request } from '@playwright/test';
import path from 'node:path';
import { expect, open, test, unique } from './support/fixtures.ts';
import { FakeRunner } from './support/runner.ts';

interface BrowserClipboard {
  DataTransfer: new () => { items: { add(file: File): void } };
  ClipboardEvent: new (type: string, options: unknown) => unknown;
}

function pasteImage(element: unknown, base64: string): void {
  const { DataTransfer, ClipboardEvent } =
    globalThis as unknown as BrowserClipboard;
  const bytes = Uint8Array.from(atob(base64), (character) =>
    character.charCodeAt(0),
  );
  const data = new DataTransfer();
  data.items.add(new File([bytes], 'image.png', { type: 'image/png' }));
  (element as { dispatchEvent(event: unknown): void }).dispatchEvent(
    new ClipboardEvent('paste', {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    }),
  );
}

test.use({ user: 'admin', isolatedStudio: true });

test('pasted screenshots survive issue creation and description edits', async ({
  page,
  api,
}) => {
  await api.patch('users/me/preferences', {
    locale: 'en-US',
    'theme.mode': 'light',
  });
  await open(page, '/issues');
  const screenshot = (await page.screenshot()).toString('base64');
  await open(page, '/issues/new?tab=manual');
  const dialog = page.getByRole('dialog', { name: 'New issue', exact: true });
  await dialog
    .getByRole('textbox', { name: 'Title', exact: true })
    .fill(`Pasted screenshot ${unique()}`);
  const editor = dialog.getByRole('textbox', {
    name: 'Description',
    exact: true,
  });
  await editor.click();
  await page.keyboard.type('Screenshot from the running application: ');
  const paste = () => editor.evaluate(pasteImage, screenshot);
  await paste();
  await expect(editor.locator('img[src]')).toHaveCount(1);
  await expect
    .poll(() =>
      editor
        .locator('img[src]')
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as unknown as { naturalWidth: number }).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.keyboard.press('End');
  await page.keyboard.type(' Another view: ');
  await paste();
  await expect(editor.locator('img[src]')).toHaveCount(2);
  const output = process.env.NB_STUDIO_IMAGE_SCREENSHOT_DIR;
  if (output) {
    mkdirSync(output, { recursive: true });
    await page.screenshot({
      path: path.join(output, 'new-issue-pasted-images.png'),
    });
  }
  await dialog.getByRole('radio', { name: /Later/ }).click();
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await page
    .getByRole('button', { name: 'Edit description', exact: true })
    .click();
  const detailEditor = page.getByRole('textbox', {
    name: 'Description',
    exact: true,
  });
  await expect(detailEditor.locator('img[src]')).toHaveCount(2);
  await detailEditor.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(' Verified after reopening.');
  if (output)
    await page.screenshot({
      path: path.join(output, 'issue-description-edit-images.png'),
    });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await page
    .getByRole('button', { name: 'Edit description', exact: true })
    .click();
  await expect(
    page
      .getByRole('textbox', { name: 'Description', exact: true })
      .locator('img[src]'),
  ).toHaveCount(2);
});

test('upload failures can be retried and pending uploads can be cancelled', async ({
  page,
  api,
}) => {
  await api.patch('users/me/preferences', {
    locale: 'en-US',
    'theme.mode': 'light',
  });
  await open(page, '/issues/new?tab=manual');
  const dialog = page.getByRole('dialog', { name: 'New issue', exact: true });
  const editor = dialog.getByRole('textbox', {
    name: 'Description',
    exact: true,
  });
  const paste = async () => {
    await editor.click();
    await editor.evaluate(
      pasteImage,
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
    );
  };
  await page.route('**/api/projects/attachments', (route) =>
    route.abort('failed'),
  );
  await paste();
  await expect(
    page.getByLabel('Notifications').getByText(/Unable to upload/),
  ).toBeVisible();
  const output = process.env.NB_STUDIO_IMAGE_SCREENSHOT_DIR;
  if (output) {
    mkdirSync(output, { recursive: true });
    await page.screenshot({
      path: path.join(output, 'new-issue-upload-failed.png'),
    });
  }
  await expect(
    dialog.getByRole('button', { name: 'Create and start', exact: true }),
  ).toBeEnabled();
  await expect(editor.locator('img[src]')).toHaveCount(0);
  await page.unroute('**/api/projects/attachments');
  await paste();
  await expect(editor.locator('img[src]')).toHaveCount(1);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/projects/attachments', async (route) => {
    await gate;
    await route.continue();
  });
  await paste();
  await expect(
    dialog.getByRole('button', { name: 'Create and start', exact: true }),
  ).toBeDisabled();
  if (output)
    await page.screenshot({
      path: path.join(output, 'new-issue-uploading.png'),
    });
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await expect(dialog).toBeHidden();
  release();
});

test('the first agent run downloads and opens an image attached at creation', async ({
  page,
  api,
  studio,
}) => {
  await open(page, '/issues');
  const screenshot = await page.screenshot();
  const uploaded = await page.request.post(
    `${studio.baseURL}/api/projects/attachments`,
    {
      headers: { origin: studio.origin },
      multipart: {
        file: {
          name: 'agent-first-run.png',
          mimeType: 'image/png',
          buffer: screenshot,
        },
      },
    },
  );
  expect(uploaded.status()).toBe(201);
  const file = (
    (await uploaded.json()) as { data: { id: string; contentUrl: string } }
  ).data;
  const runner = new FakeRunner(api, `Image reader ${unique()}`, true);
  await api.patch('projectManager', {
    firstChoiceAgentId: await runner.agent(),
    fallbackAgentId: null,
  });
  const issue = await api.post<{ id: string; identifier: string }>(
    'projects/issues',
    {
      title: `Read screenshot ${unique()}`,
      statusKey: 'in_progress',
      executor: { type: 'agent', id: 'studio-project-manager' },
      attachmentIds: [file.id],
      description: `![Screenshot](${file.contentUrl})`,
    },
  );
  const token = await runner.claim(issue.identifier);
  const agent = await request.newContext({
    extraHTTPHeaders: { 'x-nocobase-run-token': token },
  });
  try {
    const files = await agent.get(
      `${studio.baseURL}/api/projects/issues/${issue.identifier}/attachments`,
    );
    expect(files.status()).toBe(200);
    expect(
      ((await files.json()) as { data: { id: string }[] }).data.map(
        (item) => item.id,
      ),
    ).toEqual([file.id]);
    const downloaded = await agent.get(
      `${studio.origin}${file.contentUrl}?download=true`,
    );
    expect(downloaded.status()).toBe(200);
    const bytes = await downloaded.body();
    expect(bytes.equals(screenshot)).toBe(true);
    // Decode the bytes actually downloaded with the run identity in the browser.
    await page.goto(`data:image/png;base64,${bytes.toString('base64')}`);
    await expect
      .poll(() =>
        page
          .locator('img[src]')
          .evaluate(
            (image) =>
              (image as unknown as { naturalWidth: number }).naturalWidth,
          ),
      )
      .toBe(1440);
    const output = process.env.NB_STUDIO_IMAGE_SCREENSHOT_DIR;
    if (output) {
      mkdirSync(output, { recursive: true });
      writeFileSync(path.join(output, 'agent-downloaded-image.png'), bytes);
    }
  } finally {
    await agent.dispose();
  }
});
