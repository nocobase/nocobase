/// <reference lib="dom" />
import { expect, test, type Locator, type Page } from '@playwright/test';
import path from 'node:path';

const applicationUrl = process.env.APP_URL;
test.skip(!applicationUrl, 'Set APP_URL to the running application entry.');
const fixture = `${applicationUrl?.replace(/\/$/, '')}/tests/fixtures/dialog-footer.html`;

async function geometry(page: Page) {
  return page.getByTestId('cancel').evaluate((cancel) => {
    const submit = document.querySelector('[data-testid=submit]')!;
    const footer = cancel.parentElement!;
    const panel = cancel.closest('[role=dialog], [role=alertdialog]')!;
    const measure = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      return {
        x: rect.x,
        y: rect.y,
        right: rect.right,
        bottom: rect.bottom,
        height: rect.height,
        width: rect.width,
        paddingLeft: css.paddingLeft,
        paddingRight: css.paddingRight,
        paddingTop: css.paddingTop,
        paddingBottom: css.paddingBottom,
        minHeight: parseFloat(css.minHeight),
        overflow: element.scrollWidth > element.clientWidth + 1,
      };
    };
    return {
      cancel: measure(cancel),
      submit: measure(submit),
      footer: measure(footer),
      panel: measure(panel),
      horizontal:
        getComputedStyle(footer).flexDirection === 'row' ||
        getComputedStyle(footer).display === 'grid',
    };
  });
}

async function checkGeometry(page: Page) {
  await expect(page.getByTestId('cancel')).toBeVisible();
  let previous = '';
  await expect
    .poll(async () => {
      const current = JSON.stringify(await geometry(page));
      const stable = current === previous;
      previous = current;
      return stable;
    })
    .toBe(true);
  const result = await geometry(page);
  const { cancel, submit, footer, panel, horizontal } = result;
  expect(cancel.height).toBeGreaterThanOrEqual(cancel.minHeight - 1);
  expect(submit.height).toBeGreaterThanOrEqual(submit.minHeight - 1);
  expect(cancel.paddingLeft).toBe(submit.paddingLeft);
  expect(cancel.paddingRight).toBe(submit.paddingRight);
  expect(cancel.paddingTop).toBe(submit.paddingTop);
  expect(cancel.paddingBottom).toBe(submit.paddingBottom);
  if (horizontal) {
    expect(Math.abs(cancel.y - submit.y)).toBeLessThan(1);
    expect(Math.abs(cancel.bottom - submit.bottom)).toBeLessThan(1);
    expect(cancel.right).toBeLessThanOrEqual(submit.x + 1);
  } else {
    expect(submit.bottom).toBeLessThanOrEqual(cancel.y + 1);
  }
  for (const button of [cancel, submit]) {
    expect(button.overflow).toBe(false);
    expect(button.x).toBeGreaterThanOrEqual(panel.x);
    expect(button.right).toBeLessThanOrEqual(panel.right + 1);
    expect(button.y).toBeGreaterThanOrEqual(footer.y);
    expect(button.bottom).toBeLessThanOrEqual(panel.bottom + 1);
    expect(button.bottom).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.right).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(panel.overflow).toBe(false);
  return result;
}

async function screenshot(page: Page, name: string) {
  if (process.env.DIALOG_EVIDENCE_DIR) {
    await page.screenshot({
      path: path.join(process.env.DIALOG_EVIDENCE_DIR, `${name}.png`),
    });
  }
}

for (const kind of [
  'dialog',
  'dialog-close',
  'alert',
  'alert-small',
  'route',
  'drawer',
]) {
  for (const preset of ['compact', 'default']) {
    for (const width of [1440, 375]) {
      test(`${kind}, ${preset}, ${width}: semantic actions align and keep their padding`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${fixture}?kind=${kind}&preset=${preset}`);
        const result = await checkGeometry(page);
        expect(result.cancel.height).toBeCloseTo(result.submit.height, 0);
        expect(result.cancel.minHeight).toBe(preset === 'compact' ? 36 : 40);
        expect(result.cancel.paddingLeft).toBe(
          preset === 'compact' ? '14.4px' : '16px',
        );
        if (width > 640 && kind !== 'alert-small')
          expect(result.cancel.width).toBeLessThan(result.submit.width);
        if (preset === 'default') await screenshot(page, `${kind}-${width}-en`);
      });
    }
  }

  for (const language of ['english', 'chinese']) {
    test(`${kind}: long ${language} labels remain visible on a short phone viewport`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(
        `${fixture}?kind=${kind}&long&${language === 'chinese' ? 'chinese&' : ''}dark`,
      );
      await checkGeometry(page);
      await screenshot(page, `${kind}-375-long-${language}`);
    });
  }

  test(`${kind}: disabled and submitting actions retain geometry`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(`${fixture}?kind=${kind}&pending`);
    await checkGeometry(page);
    await expect(page.getByTestId('cancel')).toBeDisabled();
    await expect(page.getByTestId('submit')).toBeDisabled();
    await expect(page.getByTestId('submit')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('submit')).toBeVisible();
  });
}

for (const kind of ['dialog', 'alert']) {
  test(`${kind}: a phone row wraps long labels without overflowing`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${fixture}?kind=${kind}&horizontal&chinese`);
    await checkGeometry(page);
  });
}

async function expectKeyboardFocus(action: Locator) {
  await action.focus();
  await expect(action).toBeFocused();
  expect(
    await action.evaluate(
      (element) =>
        getComputedStyle(element).outlineStyle !== 'none' ||
        getComputedStyle(element).boxShadow !== 'none',
    ),
  ).toBe(true);
}

for (const kind of ['dialog', 'route', 'drawer']) {
  test(`${kind}: link cancel and native form submit remain independent`, async ({
    page,
  }) => {
    await page.goto(`${fixture}?kind=${kind}`);
    await checkGeometry(page);
    const cancel = page.getByTestId('cancel');
    await expect(cancel).toHaveAttribute('href', '/instances?filter=recent');
    expect(await cancel.evaluate((element) => element.tagName)).toBe('A');
    await expectKeyboardFocus(cancel);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('location')).toHaveText(
      '/instances?filter=recent',
    );
    await expect(page.getByTestId('submit')).toHaveCount(0);
    await page.goto(`${fixture}?kind=${kind}`);
    await checkGeometry(page);
    await page.getByLabel('Instance name').fill('New customer portal');
    await expectKeyboardFocus(page.getByTestId('submit'));
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('location')).toHaveText(
      '/instances?created=1',
    );
  });
}

test('route footer stays visible when the body scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${fixture}?kind=route&long`);
  const before = await checkGeometry(page);
  await page.locator('[data-slot=route-overlay-body]').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect
    .poll(() =>
      page
        .locator('[data-slot=route-overlay-body]')
        .evaluate((element) => element.scrollTop),
    )
    .toBeGreaterThan(0);
  const after = await checkGeometry(page);
  expect(after.footer.y).toBe(before.footer.y);
  await page.getByTestId('cancel').click();
  await expect(page.getByTestId('location')).toHaveText(
    '/instances?filter=recent',
  );
});

// DialogClose replaces Button's semantic slot just as AlertDialog's actions do.
test('DialogClose cancels without submitting the form', async ({ page }) => {
  await page.goto(`${fixture}?kind=dialog-close`);
  await checkGeometry(page);
  await page.getByTestId('cancel').click();
  await expect(page.getByTestId('submit')).toHaveCount(0);
  await expect(page.getByTestId('location')).toHaveText('Instance list');
});
