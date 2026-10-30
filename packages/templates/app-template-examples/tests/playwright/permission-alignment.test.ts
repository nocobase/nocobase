import { expect, test } from '@playwright/test';

const applicationUrl = process.env.APP_URL;
test.skip(!applicationUrl, 'Set APP_URL to the running application entry.');
const fixture = `${applicationUrl?.replace(/\/$/, '')}/tests/fixtures/permission-alignment.html`;

for (const width of [1440, 1024, 768, 390, 375, 360]) {
  test(`aligns scopes across groups and actions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(fixture);
    await expect(page.getByRole('combobox')).toHaveCount(18);
    const geometry = await Promise.all(
      (await page.getByRole('combobox').all()).map(async (node) => {
        const rect = (await node.boundingBox())!;
        return { x: Math.round(rect.x), width: Math.round(rect.width) };
      }),
    );
    expect(new Set(geometry.map((item) => item.x)).size).toBe(
      width >= 1024 ? 2 : 1,
    );
    expect(new Set(geometry.map((item) => item.width)).size).toBe(1);
    expect(
      await page.locator('html').evaluate((element) => {
        const root = element as unknown as {
          scrollWidth: number;
          clientWidth: number;
        };
        return root.scrollWidth <= root.clientWidth;
      }),
    ).toBe(true);
    for (const row of await page.locator('[data-slot=permission-row]').all()) {
      const checkbox = await row.getByRole('checkbox').boundingBox();
      const controls = row.getByRole('combobox');
      if (await controls.count()) {
        const first = await controls.first().boundingBox();
        expect(first!.y).toBeGreaterThan(checkbox!.y + checkbox!.height);
        expect(Math.round(first!.x)).toBe(
          Math.min(...geometry.map((item) => item.x)),
        );
        if ((await controls.count()) % 2 === 1) {
          const last = await controls.last().boundingBox();
          expect(Math.round(last!.x)).toBe(Math.round(first!.x));
        }
      }
    }
    for (const scope of await page
      .locator('[data-slot=permission-scope]')
      .all()) {
      const trigger = await scope.getByRole('combobox').boundingBox();
      if (width < 416) {
        const label = await scope.locator('span[title]').boundingBox();
        expect(label!.y + label!.height).toBeLessThanOrEqual(trigger!.y);
        expect(Math.round(label!.x)).toBe(Math.round(trigger!.x));
      }
      const conditions = scope.getByRole('button', {
        name: 'Conditions',
        exact: true,
      });
      if (await conditions.count()) {
        const button = await conditions.boundingBox();
        expect(button!.y).toBeGreaterThanOrEqual(trigger!.y + trigger!.height);
        expect(Math.round(button!.x)).toBe(Math.round(trigger!.x));
      }
    }
  });
}

test('preserves long labels, independent scope changes and ungranted visibility', async ({
  page,
}) => {
  await page.goto(`${fixture}?chinese`);
  const label = '需要完整显示名称的跨部门监控规则计算数据范围长标签';
  await expect(page.getByTitle(label)).toHaveCount(3);
  const control = page.getByRole('combobox', {
    name: `How far View monitoring rules · ${label} reaches`,
  });
  await control.click();
  await page.getByRole('option', { name: 'All records', exact: true }).click();
  await expect(control.locator('[data-slot=select-value]')).toHaveText(
    'All records',
  );
  await expect(
    page.getByRole('checkbox', { name: 'View monitoring rules', exact: true }),
  ).toBeChecked();
  await page
    .getByRole('checkbox', { name: 'Manage responsible units', exact: true })
    .click();
  await expect(page.getByRole('combobox')).toHaveCount(17);
  await page.getByRole('tab', { name: 'Ungranted', exact: true }).click();
  await expect(page.getByRole('combobox')).toHaveCount(0);
});

test('keeps readonly scopes visible and disables editing', async ({ page }) => {
  await page.goto(`${fixture}?readonly`);
  await expect(page.getByRole('combobox')).toHaveCount(18);
  for (const control of await page.getByRole('combobox').all()) {
    await expect(control).toBeDisabled();
  }
  for (const button of await page
    .getByRole('button', { name: 'Conditions', exact: true })
    .all()) {
    await expect(button).toBeDisabled();
  }
  await expect(
    page.getByRole('checkbox', { name: 'Manage alerts', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
});
