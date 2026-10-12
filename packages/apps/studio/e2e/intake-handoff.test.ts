/** Intake failures keep the New issue dialog and its input, and cancellation prevents a late panel handoff. */
import type { Page } from '@playwright/test';

import { apiAs, expect, open, test, unique } from './support/fixtures.ts';

// These tests change only this person's preference, never the team's default.
test.use({ user: 'wendy' });

async function intake(page: Page) {
  await open(page, '/issues/new?view=list');
  const dialog = page.getByRole('dialog', { name: '新建任务' });
  const text = `导出失败后可以重试 ${unique()}`;
  await dialog.getByRole('textbox', { name: '需求' }).fill(text);
  return { dialog, text };
}

test('a server failure preserves the input and retry completes the handoff', async ({
  page,
}) => {
  await page.route(
    '**/api/organizeIntake',
    (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            reason: 'INTERNAL_ERROR',
            message: 'Internal exception must stay hidden',
          },
        }),
      }),
    { times: 1 },
  );
  const { dialog, text } = await intake(page);
  await dialog.getByRole('button', { name: '让 Agent 整理' }).click();
  await expect(dialog.getByRole('alert')).toContainText('请求失败');
  await expect(dialog.getByRole('textbox', { name: '需求' })).toHaveValue(text);
  await expect(page.getByTestId('chat-panel')).toBeHidden();
  await expect(dialog).not.toContainText('Internal exception');
  await dialog.screenshot({ path: 'output/pm51-intake-failure.png' });
  await dialog.getByRole('button', { name: '重试整理' }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/issues\?view=list$/u);
  await expect(page.getByTestId('chat-panel')).toContainText(text);
});

test('a network failure leaves an enabled retry and can be cancelled', async ({
  page,
}) => {
  await page.route('**/api/organizeIntake', (route) => route.abort('failed'), {
    times: 1,
  });
  const { dialog, text } = await intake(page);
  await dialog.getByRole('button', { name: '让 Agent 整理' }).click();
  await expect(dialog.getByRole('alert')).toContainText('请求失败');
  await expect(dialog.getByRole('textbox', { name: '需求' })).toHaveValue(text);
  await expect(dialog.getByRole('button', { name: '重试整理' })).toBeEnabled();
  await dialog.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('chat-panel')).toBeHidden();
});

test('no configured default agent is explained in the dialog', async ({
  page,
}) => {
  // The isolated server tests exercise an actual empty team. Keep this shared browser server's default for other tests.
  await page.route('**/api/organizeIntake', (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { reason: 'INTAKE_NO_AGENT', message: 'No default' },
      }),
    }),
  );
  const { dialog, text } = await intake(page);
  await dialog.getByRole('button', { name: '让 Agent 整理' }).click();
  await expect(dialog.getByRole('alert')).toContainText(
    '没有配置可用的默认 Agent',
  );
  await expect(dialog.getByRole('textbox', { name: '需求' })).toHaveValue(text);
  await expect(dialog.getByRole('button', { name: '重试整理' })).toBeEnabled();
  await expect(page.getByTestId('chat-panel')).toBeHidden();
});

test('an accepted message without a started run keeps the dialog open', async ({
  page,
}) => {
  await page.route('**/api/organizeIntake', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          run: null,
          conversation: {
            id: 'unstarted',
            availability: { online: true, reason: null, onlineRunners: 1 },
            run: null,
          },
        },
      }),
    }),
  );
  const { dialog, text } = await intake(page);
  await dialog.getByRole('button', { name: '让 Agent 整理' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Agent 未能启动');
  await expect(dialog.getByRole('textbox', { name: '需求' })).toHaveValue(text);
  await expect(dialog.getByRole('button', { name: '重试整理' })).toBeEnabled();
  await expect(page.getByTestId('chat-panel')).toBeHidden();
});

test('an agent without an eligible runtime is rejected before creating work', async ({
  page,
  api,
  browser,
}) => {
  const admin = await apiAs(browser, 'admin');
  const preference = await api.get<{ defaultAgentId: string | null }>(
    'agents/chatPreferences',
  );
  // The demo's runtimes went offline long ago, so no runner takes its Sonnet agent; other tests' runners report models
  // of their own.
  const agent = (
    await admin.api.get<{ id: string; name: string }[]>('agents')
  ).find((item) => item.name === 'Claude · Sonnet 5');
  expect(agent).toBeTruthy();
  try {
    await api.patch('agents/chatPreferences', { defaultAgentId: agent!.id });
    const { dialog, text } = await intake(page);
    const response = page.waitForResponse('**/api/organizeIntake');
    await dialog.getByRole('button', { name: '让 Agent 整理' }).click();
    expect((await response).status()).toBe(409);
    await expect(dialog.getByRole('alert')).toContainText(
      '没有适合为你运行此 Agent 的在线运行环境',
    );
    await expect(dialog.getByRole('textbox', { name: '需求' })).toHaveValue(
      text,
    );
    await expect(page.getByTestId('chat-panel')).toBeHidden();
    const conversations = await api.get<{ title: string | null }[]>(
      'agents/conversations?pageSize=100',
    );
    expect(conversations.some((item) => item.title?.includes(text))).toBe(
      false,
    );
  } finally {
    await api.patch('agents/chatPreferences', preference);
    await admin.close();
  }
});

test('closing during submission ignores the late response, including when a new dialog is opened', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let handled!: () => void;
  const responseHandled = new Promise<void>((resolve) => {
    handled = resolve;
  });
  await page.route(
    '**/api/organizeIntake',
    async (route) => {
      await gate;
      await route
        .fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              run: { id: 'late-run', outcome: 'created' },
              conversation: {
                id: 'late-conversation',
                availability: { online: true, reason: null, onlineRunners: 1 },
                run: null,
              },
            },
          }),
        })
        .catch((error: unknown) => {
          if (!route.request().failure()) throw error;
        })
        .finally(handled);
    },
    { times: 1 },
  );
  const { dialog } = await intake(page);
  const request = page.waitForRequest('**/api/organizeIntake');
  await dialog.getByRole('button', { name: '让 Agent 整理' }).click();
  const pending = await request;
  const cancelled = page.waitForEvent('requestfailed', {
    predicate: (item) => item === pending,
  });
  await expect(
    dialog.getByRole('button', { name: /让 Agent 整理/u }),
  ).toBeDisabled();
  await dialog.press('Escape');
  await expect(dialog).toBeHidden();
  await cancelled;
  await open(page, '/issues/new?view=list');
  release();
  await responseHandled;
  await expect(page.getByRole('dialog', { name: '新建任务' })).toBeVisible();
  await expect(page.getByTestId('chat-panel')).toBeHidden();
});
