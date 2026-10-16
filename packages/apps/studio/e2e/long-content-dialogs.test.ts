import type { Locator, Page, TestInfo } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

import {
  Api,
  expect,
  signIn,
  test as base,
  unique,
  url,
} from './support/fixtures.ts';
import { FakeRunner } from './support/runner.ts';

// Fixture teardown has a separate budget and preserves the test body's first error.
const test = base.extend<{ variableProject: { id: string } }>({
  variableProject: async ({ api }, use, info) => {
    const project = await api.post<{ id: string }>('projects', {
      name: `Dialog regression ${unique()}`,
      visibility: 'members',
    });
    try {
      await use(project);
    } finally {
      await api.delete(`projects/${project.id}`);
      await info.attach('variable-project-cleanup.json', {
        body: JSON.stringify({ projectId: project.id, deleteSucceeded: true }),
        contentType: 'application/json',
      });
    }
  },
});

async function dismissSavedToast(page: Page, name: string): Promise<void> {
  const saved = page.locator('[data-slot=toast]').filter({
    has: page.getByText(`Saved ${name}.`, { exact: true }),
  });
  await expect(saved).toBeVisible();
  await saved.getByRole('button', { name: 'Close toast', exact: true }).click();
  await expect(saved).toBeHidden();
}

const longValue = '界'.repeat(2730) + 'AA';

interface ScrollElement {
  scrollHeight: number;
  clientHeight: number;
  scrollTop: number;
  parentElement: ScrollElement | null;
  getAttribute(name: string): string | null;
  ownerDocument: {
    defaultView: {
      getComputedStyle(element: ScrollElement): { overflowY: string };
    };
  };
}

// Locale changes must not reach the accounts used by other browser tests.
test.use({
  user: 'admin',
  viewport: { width: 1440, height: 1000 },
  isolatedStudio: true,
});

async function captureLayout(
  dialog: Locator,
  info: TestInfo,
  name: string,
): Promise<void> {
  mkdirSync(info.outputDir, { recursive: true });
  const file = info.outputPath(name);
  writeFileSync(
    file,
    JSON.stringify(
      {
        dialog: await dialog.boundingBox(),
        title: await dialog.getByRole('heading').boundingBox(),
        save: await dialog
          .getByRole('button', { name: 'Save', exact: true })
          .boundingBox(),
      },
      null,
      2,
    ),
  );
  await info.attach(name, { path: file, contentType: 'application/json' });
}

async function reachable(page: Page, dialog: Locator): Promise<void> {
  const height = page.viewportSize()!.height;
  for (const control of [
    dialog.getByRole('heading'),
    dialog.getByRole('button', { name: 'Save', exact: true }),
    dialog.getByRole('button', { name: 'Cancel', exact: true }),
  ]) {
    await expect(control).toBeInViewport({ ratio: 1 });
  }
  const box = await dialog.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(height);
}

async function scrollingBody(
  dialog: Locator,
  body = dialog.locator('[data-slot=field-group]').first(),
): Promise<void> {
  await expect
    .poll(() =>
      body.evaluate((raw) => {
        const element = raw as unknown as ScrollElement;
        return (
          element.ownerDocument.defaultView.getComputedStyle(element)
            .overflowY === 'auto' && element.scrollHeight > element.clientHeight
        );
      }),
    )
    .toBe(true);
  const title = dialog.getByRole('heading');
  const before = await title.boundingBox();
  await body.hover();
  await body.page().mouse.wheel(0, 500);
  await expect
    .poll(() =>
      body.evaluate((raw) => {
        let parent: ScrollElement | null = raw as unknown as ScrollElement;
        while (parent && parent.getAttribute('role') !== 'dialog') {
          if (parent.scrollTop > 0) return true;
          parent = parent.parentElement;
        }
        return false;
      }),
    )
    .toBe(true);
  expect((await title.boundingBox())!.y).toBe(before!.y);
}

test('variable dialog keeps legal long values and its actions reachable', async ({
  page,
  api,
  studio,
  variableProject: project,
}, info) => {
  await api.patch('users/me/preferences', { locale: 'en-US' });
  await page.goto(
    url(`/projects/${project.id}/settings?section=variables`, studio),
  );
  await page.getByRole('button', { name: 'Add variable', exact: true }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Add environment variable',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('DIALOG_VALUE');
  const value = dialog.getByRole('textbox', { name: 'Value', exact: true });
  await value.fill('short test value');
  await reachable(page, dialog);
  await page.screenshot({
    path: info.outputPath('variable-short-value.png'),
    mask: [value],
  });
  expect(Buffer.byteLength(longValue)).toBe(8192);
  await value.fill(longValue);
  await captureLayout(dialog, info, 'variable-layout.json');
  await page.screenshot({
    path: info.outputPath('variable-long-value.png'),
    mask: [dialog.locator('[data-slot=field-group]')],
  });
  await reachable(page, dialog);
  await scrollingBody(dialog);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('cell', { name: 'DIALOG_VALUE', exact: true }),
  ).toBeVisible();
  await dismissSavedToast(page, 'DIALOG_VALUE');
  const edit = async (name: string) => {
    await page
      .getByRole('button', { name: `Actions for ${name}`, exact: true })
      .click();
    await page
      .getByRole('menuitem', { name: 'Replace value', exact: true })
      .click();
    return page.getByRole('dialog', { name: `Replace ${name}`, exact: true });
  };
  const replacement = await edit('DIALOG_VALUE');
  const replacementValue = replacement.getByRole('textbox', {
    name: 'Value',
    exact: true,
  });
  await expect(replacementValue).toHaveValue('');
  await replacementValue.fill(longValue + 'A');
  await replacement.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    replacement.getByText('The value is larger than 8 KB.', { exact: true }),
  ).toBeVisible();
  await expect(replacementValue).toHaveValue(longValue + 'A');
  await reachable(page, replacement);
  await replacement
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Keep editing', exact: true })
    .click();
  await expect(replacementValue).toHaveValue(longValue + 'A');
  await replacement
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Discard', exact: true })
    .click();
  await expect(replacement).toBeHidden();
  const name = 'L'.repeat(128);
  await api.put(`agents/variables/project/${project.id}/${name}`, {
    value: 'original test value',
  });
  await page.reload();
  await page.setViewportSize({ width: 375, height: 812 });
  const narrow = await edit(name);
  await reachable(page, narrow);
  const narrowValue = narrow.getByRole('textbox', {
    name: 'Value',
    exact: true,
  });
  await narrowValue.fill(longValue);
  await reachable(page, narrow);
  await scrollingBody(narrow);
  await page.screenshot({
    path: info.outputPath('variable-narrow-long-name.png'),
    mask: [narrow.locator('[data-slot=field-group]')],
  });
  await narrow.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(narrow).toBeHidden();
  await dismissSavedToast(page, name);
  const blank = await edit(name);
  await blank.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(blank).toBeHidden();
  await dismissSavedToast(page, name);
  const revealed = await api.post<{ name: string; value: string }[]>(
    `agents/variables/project/${project.id}/reveal`,
  );
  const audits = await api.get<{ action: string }[]>(
    `agents/variables/project/${project.id}/audits`,
  );
  expect(audits.some((item) => item.action === 'set')).toBe(true);
  expect(audits.some((item) => item.action === 'reveal')).toBe(true);
  expect(revealed.find((item) => item.name === name)?.value === longValue).toBe(
    true,
  );
  expect(
    revealed.find((item) => item.name === 'DIALOG_VALUE')?.value === longValue,
  ).toBe(true);
  await page
    .getByRole('button', { name: `Actions for ${name}`, exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Access log', exact: true }).click();
  await expect(
    page.getByText(`Access log of ${name}`, { exact: true }),
  ).toBeVisible();
});

test('agent capability dialog keeps long descriptions and its actions reachable', async ({
  page,
  api,
  studio,
}, info) => {
  await api.patch('users/me/preferences', { locale: 'en-US' });
  const runner = new FakeRunner(api, `dialog-${unique()}`);
  const agent = await runner.discovered();
  await page.goto(url('/agents', studio));
  await page
    .getByRole('button', { name: `Edit ${agent.name}`, exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: `Edit ${agent.name}`,
    exact: true,
  });
  const description = dialog.getByRole('textbox', {
    name: 'Good at',
    exact: true,
  });
  await reachable(page, dialog);
  await description.fill('正常中文能力说明'.repeat(353));
  await captureLayout(dialog, info, 'agent-layout.json');
  await page.screenshot({
    path: info.outputPath('agent-long-description.png'),
  });
  await reachable(page, dialog);
  await scrollingBody(dialog, dialog.locator('form'));
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await page
    .getByRole('button', { name: `Edit ${agent.name}`, exact: true })
    .click();
  await expect(description).toHaveValue('正常中文能力说明'.repeat(353));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await reachable(page, dialog);
  await scrollingBody(dialog, dialog.locator('form'));
  await page.screenshot({ path: info.outputPath('agent-narrow-dark.png') });
  await description.fill('Unsaved test description');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page
    .getByRole('button', { name: `Edit ${agent.name}`, exact: true })
    .click();
  await expect(description).toHaveValue('正常中文能力说明'.repeat(353));
  await description.fill('');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    dialog.getByText('Write what it is good at before enabling it.', {
      exact: true,
    }),
  ).toBeVisible();
  await description.fill('正常中文能力说明'.repeat(353));
  await dialog
    .getByRole('combobox', { name: 'Reasoning effort', exact: true })
    .click();
  await page.getByRole('option', { name: 'High', exact: true }).click();
  await dialog.getByRole('switch', { name: 'Enabled', exact: true }).uncheck();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await page
    .getByRole('button', { name: 'Show disabled', exact: true })
    .click();
  await page
    .getByRole('button', { name: `Edit ${agent.name}`, exact: true })
    .click();
  await expect(description).toHaveValue('正常中文能力说明'.repeat(353));
  await expect(
    dialog.getByRole('switch', { name: 'Enabled', exact: true }),
  ).not.toBeChecked();
  await expect(
    dialog
      .getByRole('combobox', { name: 'Reasoning effort', exact: true })
      .locator('[data-slot=select-value]'),
  ).toHaveText('High');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await runner.probe()).toEqual([]);
});

test('a project member cannot manage or reveal its variables', async ({
  browser,
  api,
  studio,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const project = await api.post<{ id: string }>('projects', {
    name: `Dialog permissions ${unique()}`,
    visibility: 'members',
  });
  try {
    await api.put(`agents/variables/project/${project.id}/DIALOG_VALUE`, {
      value: 'synthetic test value',
    });
    await signIn(context, 'lisa', studio);
    const member = new Api(context.request);
    const viewer = await member.get<{ userId: string }>('projects/me');
    await api.post(`projects/${project.id}/members`, { userId: viewer.userId });
    await member.patch('users/me/preferences', { locale: 'en-US' });
    await page.goto(
      url(`/projects/${project.id}/settings?section=variables`, studio),
    );
    await expect(page).toHaveURL((address) =>
      address.pathname.endsWith('/overview'),
    );
    await expect(
      page.getByRole('button', { name: 'Add variable', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Reveal values', exact: true }),
    ).toHaveCount(0);
    for (const [method, suffix, data] of [
      ['PUT', '/DIALOG_VALUE', { value: 'refused test value' }],
      ['POST', '/reveal', {}],
      ['GET', '/audits', undefined],
    ] as const) {
      const response = await context.request.fetch(
        url(`/api/agents/variables/project/${project.id}${suffix}`, studio),
        {
          method,
          headers: { origin: studio.origin },
          ...(data ? { data } : {}),
        },
      );
      expect(response.status()).toBe(403);
    }
  } finally {
    await context.close();
    await api.delete(`projects/${project.id}`);
  }
});
