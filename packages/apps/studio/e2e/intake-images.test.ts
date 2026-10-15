/** The real intake form, storage, first-message association and manual source recovery. */
import { mkdirSync } from 'node:fs';
import {
  apiAs,
  expect,
  open,
  signIn,
  test,
  unique,
  url,
} from './support/fixtures.ts';
import { FakeRunner } from './support/runner.ts';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

test('multiple images and text reach the first message and remain editable after a reading failure', async ({
  page,
  api,
  browser,
  context,
}) => {
  const admin = await apiAs(browser, 'admin');
  // Language and chat defaults persist on the account, so parallel intake tests need separate users.
  const suffix = unique();
  const user = {
    email: `image-intake-${suffix}@example.com`,
    password: 'image-intake-e2e-password',
  };
  await admin.api.post('users', {
    ...user,
    name: `Image intake ${suffix}`,
    roleScopes: { studio: ['contributor'] },
  });
  await signIn(context, user);
  const runner = new FakeRunner(admin.api, `image-intake-${suffix}`);
  const agentId = await runner.agent();
  const preference = await api.get<{ defaultAgentId: string | null }>(
    'agents/chatPreferences',
  );
  await api.patch('agents/chatPreferences', { defaultAgentId: agentId });
  try {
    await page.addInitScript(
      "localStorage.setItem('nocobase.locale', 'en-US')",
    );
    await open(page, '/issues/new?tab=ai');
    const dialog = page.getByRole('dialog', { name: 'New issue', exact: true });
    const text = `Keep the Ready card unchanged ${unique()}`;
    await dialog.getByRole('textbox', { name: 'Requirements' }).fill(text);
    await dialog.getByTestId('intake-file-input').setInputFiles([
      { name: 'board.png', mimeType: 'image/png', buffer: png },
      { name: 'detail.png', mimeType: 'image/png', buffer: png },
      {
        name: 'notes.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('PM403-TEXT: preserve eight ready parcels'),
      },
    ]);
    await expect(
      dialog.getByRole('button', { name: 'Let an agent organize' }),
    ).toBeEnabled();
    mkdirSync('output/pm403', { recursive: true });
    await dialog.screenshot({ path: 'output/pm403/image-support.png' });
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/organizeIntake') &&
        r.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Let an agent organize' }).click();
    const sent = await response;
    expect(sent.status()).toBe(200);
    const body = await sent.json();
    const id = body.data.conversation.id as string;
    const request = sent.request().postDataJSON();
    expect(request.imageFileIds).toHaveLength(2);
    const messages = await api.get<
      {
        attachments: { id: string; filename: string; contentUrl: string }[];
        content: { content: string };
      }[]
    >(`agents/conversations/${id}/messages`);
    const first = messages[0]!;
    expect(first.attachments.map((f) => f.filename)).toEqual([
      'board.png',
      'detail.png',
    ]);
    expect(first.content.content).toContain(
      'PM403-TEXT: preserve eight ready parcels',
    );
    const run = await runner.start(`chat-${id}`);
    for (const image of first.attachments) {
      const download = await page.request.get(
        url(`/api/agents/chatAttachments/${image.id}/content`),
        { headers: { 'x-nocobase-run-token': run.token } },
      );
      expect(download.status()).toBe(200);
      expect(await download.body()).toEqual(png);
    }
    // Simulate a tool that cannot read the image: completion alone must never create an intake plan.
    await runner.reply(
      run.runId,
      run.firstSeq,
      'Cannot read board.png: image tool unavailable. No plan proposed.',
    );
    const panel = page.getByTestId('chat-panel');
    await expect(
      panel.getByRole('link', { name: 'Return to edit requirements' }),
    ).toBeVisible();
    await expect(panel).toContainText('Cannot read board.png');
    await panel.screenshot({ path: 'output/pm403/return-to-edit.png' });
    await panel
      .getByRole('link', { name: 'Return to edit requirements' })
      .click();
    await expect(
      dialog.getByRole('textbox', { name: 'Requirements' }),
    ).toHaveValue(text);
    await expect(
      dialog.getByRole('button', { name: 'Preview board.png' }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Preview detail.png' }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Let an agent organize' }).click();
    await expect(dialog.getByRole('alert')).toContainText('still running');
    await runner.complete(
      run.runId,
      'Cannot read board.png: image tool unavailable. No plan proposed.',
    );
    await expect
      .poll(
        async () =>
          (await api.get<{ run: unknown }>(`agents/conversations/${id}`)).run,
      )
      .toBeNull();
    await dialog.getByRole('button', { name: 'Remove detail.png' }).click();
    const retryResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/organizeIntake') &&
        r.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Try organizing again' }).click();
    const retry = await retryResponse;
    expect(retry.status()).toBe(200);
    const retried = await retry.json();
    expect(retried.data.conversation.id).not.toBe(id);
    expect(retry.request().postDataJSON().imageFileIds).toEqual([
      request.imageFileIds[0],
    ]);
    const next = await api.get<typeof messages>(
      `agents/conversations/${retried.data.conversation.id}/messages`,
    );
    expect(next[0]!.attachments.map((f) => f.filename)).toEqual(['board.png']);
    expect(next[0]!.attachments[0]!.id).not.toBe(first.attachments[0]!.id);
    await expect(
      panel.getByRole('link', { name: 'Return to edit requirements' }),
    ).toBeVisible();
  } finally {
    await api.patch('agents/chatPreferences', preference);
    await admin.close();
  }
});
