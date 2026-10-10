import {
  expect,
  test as base,
  type Locator,
  type Page,
  type TestInfo,
} from '@playwright/test';
import { installMailApi } from '../fixtures/workspace-browser/api.js';

const test = base.extend<{
  mailApi: Awaited<ReturnType<typeof installMailApi>>;
}>({
  mailApi: async ({ page, baseURL }, provideFixture, info) => {
    if (!baseURL) throw new Error('The isolated fixture needs a baseURL');
    await page
      .context()
      .addCookies([
        { name: 'fixture_mail_access', value: 'allowed', url: baseURL },
      ]);
    const api = await installMailApi(page);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await provideFixture(api);
    await info.attach('synthetic-mail-requests', {
      body: JSON.stringify(api.requests, null, 2),
      contentType: 'application/json',
    });
    expect(
      api.unexpected,
      'Every request must remain inside the deterministic API fixture',
    ).toEqual([]);
    expect(
      errors,
      'Production page must not raise browser runtime errors',
    ).toEqual([]);
  },
});

// The live-mail acceptance config also discovers *.test.ts; never run this fixture suite against that host.
test.beforeEach(() => {
  test.skip(
    test.info().config.metadata.isolatedMailWorkspace !== true,
    'Run with workspace-browser.config.ts and the isolated production fixture.',
  );
});

const pane = (page: Page, name: string): Locator =>
  page.locator(`[data-slot="mail-${name}-pane"]`);
const navButton = (page: Page): Locator =>
  page.getByRole('button', { name: 'Mailboxes and folders', exact: true });
const drawer = (page: Page): Locator =>
  page.getByRole('dialog', { name: 'Mailboxes and folders', exact: true });
const list = (page: Page): Locator =>
  pane(page, 'list').getByRole('region', { name: 'Mail', exact: true });
const select = async (page: Page, index: number): Promise<void> => {
  await pane(page, 'list')
    .getByRole('button', {
      name: new RegExp(`Fixture message ${index}(?:\\D|$)`),
    })
    .click();
};

async function open(page: Page, query = ''): Promise<void> {
  await page.goto(`mail${query}`);
  await expect(
    pane(page, 'list').getByRole('button', {
      name: /Fixture message 0(?:\D|$)/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Compose', exact: true }),
  ).toBeEnabled();
  // Only this static fixture is used: allow its initial realtime-connect invalidation to settle.
  await page.waitForLoadState('networkidle');
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __mailBrowserFixture?: unknown })
          .__mailBrowserFixture,
    ),
  ).toEqual({
    production: true,
    realMailClient: true,
    host: 'ClientApplication + AppClientRoot',
  });
}

async function geometry(
  page: Page,
  info: TestInfo,
  name: string,
): Promise<void> {
  const measurements = await page.evaluate(() => {
    const box = (element: Element): Record<string, unknown> => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        scrollWidth: element.scrollWidth,
        display: getComputedStyle(element).display,
      };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      documentWidth: document.documentElement.scrollWidth,
      slots: Object.fromEntries(
        ['workspace', 'navigation-pane', 'list-pane', 'conversation-pane'].map(
          (slot) => [
            `mail-${slot}`,
            box(document.querySelector(`[data-slot="mail-${slot}"]`)!),
          ],
        ),
      ),
    };
  });
  await info.attach(`${name}-geometry`, {
    body: JSON.stringify(measurements, null, 2),
    contentType: 'application/json',
  });
  expect(measurements.documentWidth).toBeLessThanOrEqual(
    measurements.viewport.width,
  );
}

async function screenshot(
  page: Page,
  info: TestInfo,
  name: string,
): Promise<void> {
  const session = await page.context().newCDPSession(page);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const capture = await Promise.race([
      session.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('CDP screenshot exceeded 5 seconds')),
          5000,
        );
      }),
    ]);
    await info.attach(name, {
      body: Buffer.from(capture.data, 'base64'),
      contentType: 'image/png',
    });
  } finally {
    clearTimeout(timer);
    await session.detach();
  }
}

for (const width of [320, 390]) {
  test(`${width}px reading retains the actual list DOM, page and scroll`, async ({
    page,
    mailApi,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    await open(page);
    await expect(pane(page, 'navigation')).toBeHidden();
    await expect(pane(page, 'conversation')).toBeHidden();
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await expect(
      pane(page, 'list').getByText('51-100 of 100', { exact: true }),
    ).toBeVisible();
    const region = list(page);
    await region.evaluate((element) => {
      element.scrollTop = 680;
    });
    const retained = await region.elementHandle();
    const offset = await region.evaluate((element) => element.scrollTop);
    expect(offset).toBeGreaterThan(0);
    const feedCount = mailApi.requests.filter(
      (request) => request.path === 'mail/messages',
    ).length;
    // Select a visible scrolled row so Playwright itself does not change the saved scroll position.
    const index = await region.evaluate((element) => {
      const boundary = element.getBoundingClientRect();
      const row = [...element.querySelectorAll('button')].find((button) => {
        const rect = button.getBoundingClientRect();
        return rect.top >= boundary.top && rect.bottom <= boundary.bottom;
      });
      return Number(/Fixture message (\d+)/.exec(row?.textContent ?? '')?.[1]);
    });
    expect(Number.isFinite(index)).toBe(true);
    await select(page, index);
    await expect(pane(page, 'list')).toBeHidden();
    await expect(
      pane(page, 'conversation').getByText(
        new RegExp(`Readable fixture body ${index}`),
      ),
    ).toBeVisible();
    const reading = await pane(page, 'conversation').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const text = [...element.querySelectorAll('*')].find(
        (child) =>
          child.textContent?.startsWith('Readable fixture body') &&
          child.children.length === 0,
      );
      const body = text?.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        scrollWidth: element.scrollWidth,
        bodyWidth: body?.width ?? 0,
        bodyRight: body?.right ?? Infinity,
        paneRight: rect.right,
      };
    });
    expect(reading.width).toBeGreaterThan(width * 0.7);
    expect(reading.height).toBeGreaterThan(200);
    expect(reading.bodyWidth).toBeGreaterThan(100);
    expect(reading.scrollWidth).toBeLessThanOrEqual(Math.ceil(reading.width));
    expect(reading.bodyRight).toBeLessThanOrEqual(reading.paneRight + 1);
    await geometry(page, info, `${width}-reading`);
    await screenshot(page, info, `${width}-reading.png`);
    await page
      .getByRole('button', { name: 'Back to message list', exact: true })
      .click();
    await expect(pane(page, 'conversation')).toBeHidden();
    await expect(
      pane(page, 'list').getByText('51-100 of 100', { exact: true }),
    ).toBeVisible();
    expect(
      await retained!.evaluate(
        (element) =>
          element ===
          document.querySelector('[data-slot="mail-list-pane"] section'),
      ),
    ).toBe(true);
    expect(await region.evaluate((element) => element.scrollTop)).toBe(offset);
    expect(
      mailApi.requests.filter((request) => request.path === 'mail/messages')
        .length,
    ).toBe(feedCount);
  });
}

test('keyboard selection focuses Back and returning restores the original row without scrolling', async ({
  page,
  mailApi,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(
    pane(page, 'list').getByText('51-100 of 100', { exact: true }),
  ).toBeVisible();
  await list(page).evaluate((element) => {
    element.scrollTop = 680;
  });
  const index = await list(page).evaluate((element) => {
    const boundary = element.getBoundingClientRect();
    const row = [...element.querySelectorAll('button')].find((button) => {
      const rect = button.getBoundingClientRect();
      return rect.top >= boundary.top && rect.bottom <= boundary.bottom;
    });
    return Number(/Fixture message (\d+)/.exec(row?.textContent ?? '')?.[1]);
  });
  const row = pane(page, 'list').getByRole('button', {
    name: new RegExp(`Fixture message ${index}(?:\\D|$)`),
  });
  await row.focus();
  const offset = await list(page).evaluate((element) => element.scrollTop);
  expect(offset).toBeGreaterThan(0);
  const feedCount = mailApi.requests.filter(
    (request) => request.path === 'mail/messages',
  ).length;
  await page.keyboard.press('Enter');
  const back = page.getByRole('button', {
    name: 'Back to message list',
    exact: true,
  });
  await expect(back).toBeFocused();
  await expect(
    pane(page, 'conversation').getByText(
      new RegExp(`Readable fixture body ${index}`),
    ),
  ).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(row).toBeFocused();
  await expect(pane(page, 'conversation')).toBeHidden();
  expect(await list(page).evaluate((element) => element.scrollTop)).toBe(
    offset,
  );
  expect(
    mailApi.requests.filter((request) => request.path === 'mail/messages')
      .length,
  ).toBe(feedCount);
});

test('return invalidates a late conversation response and does not mark it read', async ({
  page,
  mailApi,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const late = mailApi.delayConversation(0);
  await select(page, 0);
  await late.started;
  await expect(pane(page, 'conversation')).toBeVisible();
  await page
    .getByRole('button', { name: 'Back to message list', exact: true })
    .click();
  await late.release();
  // Allow the already delivered promise continuation and rendering to run, rather than cancel the network request.
  await page.waitForTimeout(150);
  await expect(pane(page, 'conversation')).toBeHidden();
  await expect(pane(page, 'list')).toBeVisible();
  expect(
    mailApi.requests.filter((request) => request.method === 'PATCH'),
  ).toEqual([]);
  await select(page, 1);
  await expect(
    pane(page, 'conversation').getByText(/Readable fixture body 1/),
  ).toBeVisible();
  await expect(
    pane(page, 'conversation').getByText(/Readable fixture body 0/),
  ).toHaveCount(0);
});

test('current navigation closes the drawer, returns to the retained list without fetching', async ({
  page,
  mailApi,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await select(page, 0);
  await expect(
    pane(page, 'conversation').getByText(/Readable fixture body 0/),
  ).toBeVisible();
  await navButton(page).click();
  await expect(drawer(page)).toBeVisible();
  const count = mailApi.requests.filter(
    (request) => request.path === 'mail/messages',
  ).length;
  await drawer(page)
    .getByRole('button', { name: 'Inbox', exact: true })
    .click();
  await expect(drawer(page)).toHaveCount(0);
  await expect(pane(page, 'list')).toBeVisible();
  await expect(pane(page, 'conversation')).toBeHidden();
  await expect(navButton(page)).toBeFocused();
  expect(
    mailApi.requests.filter((request) => request.path === 'mail/messages')
      .length,
  ).toBe(count);
});

test('drawer folder, account, smart view and label use the existing MailClient queries', async ({
  page,
  mailApi,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const choose = async (
    operation: (dialog: Locator) => Promise<void>,
    query: Record<string, string>,
  ): Promise<void> => {
    await select(page, 0);
    await expect(
      pane(page, 'conversation').getByText(/Readable fixture body 0/),
    ).toBeVisible();
    await navButton(page).click();
    await expect(drawer(page)).toBeVisible();
    await operation(drawer(page));
    await expect(drawer(page)).toHaveCount(0);
    await expect(pane(page, 'list')).toBeVisible();
    await expect
      .poll(
        () =>
          mailApi.requests
            .filter((request) => request.path === 'mail/messages')
            .at(-1)?.query,
      )
      .toMatchObject(query);
    await expect(list(page)).toHaveAttribute('aria-busy', 'false');
  };
  await choose(
    (dialog) =>
      dialog
        .getByRole('group', { name: 'alpha@example.test', exact: true })
        .getByRole('button', {
          name: 'Projects — alpha@example.test',
          exact: true,
        })
        .click(),
    { accountId: 'alpha', folderId: 'Projects' },
  );
  await choose(
    async (dialog) => {
      await dialog.getByRole('combobox').selectOption('beta');
    },
    {
      accountId: 'beta',
      folderId: '__nocobase_default_inbox__',
    },
  );
  await choose(
    (dialog) =>
      dialog.getByRole('button', { name: 'Unread', exact: true }).click(),
    { accountId: 'beta', unread: 'true' },
  );
  await choose(
    (dialog) =>
      dialog.getByRole('button', { name: 'Starred', exact: true }).click(),
    { accountId: 'beta', starred: 'true' },
  );
  await choose(
    (dialog) =>
      dialog.getByRole('button', { name: 'Priority', exact: true }).click(),
    { accountId: 'beta', labelId: 'priority' },
  );
  const final = mailApi.requests
    .filter((request) => request.path === 'mail/messages')
    .at(-1)!.query;
  expect(final).not.toHaveProperty('folderId');
  expect(final).not.toHaveProperty('unread');
  expect(final).not.toHaveProperty('starred');
});

test('drawer close and Escape preserve reading, trap Tab and restore trigger focus', async ({
  page,
  mailApi,
}, info) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await open(page);
  await select(page, 0);
  await expect(
    pane(page, 'conversation').getByText(/Readable fixture body 0/),
  ).toBeVisible();
  await navButton(page).click();
  await expect(drawer(page)).toBeVisible();
  await expect
    .poll(() =>
      drawer(page).evaluate((element) =>
        element.contains(document.activeElement),
      ),
    )
    .toBe(true);
  for (let step = 0; step < 20; step++) {
    await page.keyboard.press('Tab');
    // Base UI redirects its focus sentinel asynchronously at the wrap boundary.
    await expect
      .poll(() =>
        drawer(page).evaluate((element) =>
          element.contains(document.activeElement),
        ),
      )
      .toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  await expect
    .poll(() =>
      drawer(page).evaluate((element) =>
        element.contains(document.activeElement),
      ),
    )
    .toBe(true);
  await screenshot(page, info, '320-navigation.png');
  await page.keyboard.press('Escape');
  await expect(drawer(page)).toHaveCount(0);
  await expect(navButton(page)).toBeFocused();
  await expect(pane(page, 'conversation')).toBeVisible();
  await navButton(page).click();
  await drawer(page)
    .getByRole('button', { name: 'Close mailbox navigation', exact: true })
    .click();
  await expect(drawer(page)).toHaveCount(0);
  await expect(navButton(page)).toBeFocused();
  await expect(pane(page, 'conversation')).toBeVisible();
  expect(mailApi.requests.some((request) => request.method === 'DELETE')).toBe(
    false,
  );
});

test('resizing an open drawer wide removes overlay, focuses live search and never reloads mail', async ({
  page,
  mailApi,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await select(page, 0);
  await expect(
    pane(page, 'conversation').getByText(/Readable fixture body 0/),
  ).toBeVisible();
  // Already-read fixture messages isolate resize from legitimate unread invalidation refreshes.
  await navButton(page).click();
  await expect(drawer(page)).toBeVisible();
  const count = mailApi.requests.length;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(drawer(page)).toHaveCount(0);
  await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
  await expect(navButton(page)).toBeHidden();
  await expect(
    page.getByRole('textbox', { name: 'Search mail', exact: true }),
  ).toBeFocused();
  for (const name of ['navigation', 'list', 'conversation'])
    await expect(pane(page, name)).toBeVisible();
  await page.waitForTimeout(200);
  expect(mailApi.requests.length).toBe(count);
  await geometry(page, info, '1440-three-column');
  await screenshot(page, info, '1440-three-column.png');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(pane(page, 'list')).toBeHidden();
  await expect(pane(page, 'conversation')).toBeVisible();
  expect(mailApi.requests.length).toBe(count);
});

test('changing the root font while the drawer is open follows the CSS breakpoint and live focus', async ({
  page,
  mailApi,
}, info) => {
  await page.setViewportSize({ width: 1040, height: 900 });
  await open(page);
  // This probes rem breakpoint synchronization, not a theme density implementation.
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '20px';
  });
  await expect(navButton(page)).toBeVisible();
  await navButton(page).click();
  await expect(drawer(page)).toBeVisible();
  const count = mailApi.requests.length;
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '16px';
  });
  await expect(drawer(page)).toHaveCount(0);
  await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
  await expect(navButton(page)).toBeHidden();
  await expect(
    page.getByRole('textbox', { name: 'Search mail', exact: true }),
  ).toBeFocused();
  for (const name of ['navigation', 'list', 'conversation'])
    await expect(pane(page, name)).toBeVisible();
  await page.waitForTimeout(200);
  expect(mailApi.requests.length).toBe(count);
  await geometry(page, info, 'root-font-breakpoint');
});

test('1440px with an application sidebar downgrades by actual container width', async ({
  page,
  mailApi,
}, info) => {
  await open(page, '?constrained=true');
  await expect(pane(page, 'navigation')).toBeHidden();
  await expect(navButton(page)).toBeVisible();
  const width = await page
    .locator('[data-slot="mail-workspace"]')
    .evaluate((element) => element.clientWidth);
  expect(width).toBeLessThan(896);
  await select(page, 0);
  await expect(pane(page, 'list')).toBeHidden();
  await expect(
    pane(page, 'conversation').getByText(/Readable fixture body 0/),
  ).toBeVisible();
  await geometry(page, info, '1440-constrained-reading');
  await screenshot(page, info, '1440-constrained-reading.png');
  expect(
    mailApi.requests
      .filter((request) => request.path === 'mail/messages')
      .every(
        (request) => request.query.folderId === '__nocobase_default_inbox__',
      ),
  ).toBe(true);
});

test('wide three-column layout retains built-in compose, sync, links and application actions', async ({
  page,
  mailApi,
}, info) => {
  await open(page);
  for (const name of ['navigation', 'list', 'conversation'])
    await expect(pane(page, name)).toBeVisible();
  const rectangles = await Promise.all(
    ['navigation', 'list', 'conversation'].map((name) =>
      pane(page, name).boundingBox(),
    ),
  );
  expect(rectangles[0]!.width).toBeCloseTo(208, 0);
  expect(rectangles[1]!.width).toBeCloseTo(320, 0);
  expect(rectangles[2]!.width).toBeGreaterThan(300);
  expect(rectangles[1]!.x).toBeCloseTo(
    rectangles[0]!.x + rectangles[0]!.width,
    0,
  );
  expect(rectangles[2]!.x).toBeCloseTo(
    rectangles[1]!.x + rectangles[1]!.width,
    0,
  );
  await expect(
    page.getByRole('link', { name: 'Mail accounts', exact: true }),
  ).toHaveAttribute('href', '/main/mail/accounts');
  await page
    .getByRole('button', { name: 'Application action', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Application action completed',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Compose', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Sync all mailboxes', exact: true })
    .click();
  await expect
    .poll(
      () =>
        mailApi.requests.filter((request) =>
          /^mail\/accounts\/[^/]+\/sync$/.test(request.path),
        ).length,
    )
    .toBe(2);
  await expect(
    page.getByRole('button', { name: 'Sync all mailboxes', exact: true }),
  ).toBeEnabled();
  await select(page, 0);
  await expect(
    pane(page, 'conversation').getByRole('button', {
      name: 'Reply',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    pane(page, 'conversation').getByRole('button', {
      name: 'Forward',
      exact: true,
    }),
  ).toBeVisible();
  await geometry(page, info, 'wide-original-actions');
});

test('fixture APIs require explicit synthetic permission, not route metadata', async ({
  page,
  mailApi,
}) => {
  await page.context().clearCookies();
  await page.goto('mail');
  const denied = page.waitForResponse(
    (response) =>
      response.url().includes('/api/mail/accounts') &&
      response.status() === 403,
  );
  await page.reload();
  expect((await (await denied).json()).error.reason).toBe(
    'FIXTURE_ACCESS_DENIED',
  );
  await expect(page.getByRole('alert')).toBeVisible();
  expect(mailApi.requests.some((request) => request.method !== 'GET')).toBe(
    false,
  );
});
