import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
const work = process.env.VERIFICATION_WORK,
  source = process.env.NOCOBASE_SOURCE;
if (!work || !source) throw Error('Set VERIFICATION_WORK and NOCOBASE_SOURCE');
const require = createRequire(
  path.join(source, 'packages/templates/app-template-default/package.json'),
);
const { chromium, expect } = require('@playwright/test');
const candidate = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: source,
  encoding: 'utf8',
}).trim();
const kind = process.argv[2] ?? 'new';
const base =
  process.env.APP_ENTRY ??
  `http://127.0.0.1:${kind === 'new' ? 13817 : 13818}/main/`;
if (!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD)
  throw Error(
    'Provide native credentials for the explicitly authorized test application through the process environment.',
  );
const sample = process.env.SAMPLE_ID ?? kind;
const appPath = new URL(base).pathname.replace(/\/$/, '');
const browser = await chromium.launch();
const context = await browser.newContext({
  locale: 'en-US',
  viewport: { width: 1440, height: 1900 },
});
const page = await context.newPage();
const errors = [],
  cases = [],
  requests = [];
let reads = 0;
page.on('pageerror', (error) => errors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith(`${appPath}/api/loans`)) {
    requests.push({
      method: request.method(),
      path: url.pathname,
      query: url.search,
    });
    if (request.method() === 'GET' && url.pathname === `${appPath}/api/loans`)
      reads++;
  }
});
const headers = { origin: new URL(base).origin };
const snapshot = async () => {
  const r = await page.request.get(`${base}api/loans/snapshot`);
  expect(r.ok()).toBeTruthy();
  return r.json();
};
const save = async (name, data) =>
  writeFile(path.join(work, 'evidence', name), JSON.stringify(data, null, 2));
const expectedContext = {
  q: 'Loan 1',
  status: 'open',
  sort: 'name',
  order: 'desc',
  pageSize: '20',
  tab: 'active',
};
const assertQuery = (url, pageNumber) => {
  expect(url.pathname).toBe(`${appPath}/loans`);
  expect(Object.fromEntries(url.searchParams)).toEqual({
    ...expectedContext,
    page: String(pageNumber),
  });
};
const controls = async () => {
  await expect(
    page.getByRole('textbox', { name: 'Search loans', exact: true }),
  ).toHaveValue('Loan 1');
  await expect(page.getByLabel('Loan status', { exact: true })).toHaveValue(
    'open',
  );
  await expect(page.getByLabel('Sort loans', { exact: true })).toHaveValue(
    'desc',
  );
  await expect(page.getByLabel('Loans per page', { exact: true })).toHaveValue(
    '20',
  );
  await expect(
    page
      .getByRole('combobox', { name: 'Rows per page', exact: true })
      .locator('[data-slot=select-value]'),
  ).toHaveText('20');
  await expect(
    page.getByRole('tab', { name: 'Active loans', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByRole('tab', { name: 'Overview', exact: true }),
  ).toHaveAttribute('aria-selected', 'false');
};
const verifyList = async (total, pageNumber, ids) => {
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === `${appPath}/loans` &&
      url.searchParams.get('page') === String(pageNumber),
  );
  await expect(page.getByTestId('total')).toHaveText(
    `Matching total: ${total}`,
  );
  await expect(page.getByTestId('ids')).toHaveText(ids.join(','));
  await expect(page.getByTestId('error')).toBeEmpty();
  assertQuery(new URL(page.url()), pageNumber);
  await controls();
  await expect(
    page.getByText(
      `Page ${pageNumber} of ${Math.max(1, Math.ceil(total / 20))}`,
      { exact: true },
    ),
  ).toBeVisible();
  const visible = page.getByRole('table').getByRole('link');
  await expect(visible).toHaveText(ids.map((id) => `Loan ${id}`));
  if (total === 0)
    await expect(page.getByText('No results.', { exact: true })).toBeVisible();
  const current = (await snapshot()).data;
  const matches = current
    .filter(
      (row) =>
        !row.deleted && row.status === 'open' && row.name.includes('Loan 1'),
    )
    .sort((a, b) => b.name.localeCompare(a.name));
  expect(matches).toHaveLength(total);
  expect(
    matches.slice((pageNumber - 1) * 20, pageNumber * 20).map((row) => row.id),
  ).toEqual(ids);
  expect(
    current.every(
      (row) => row.costCenter === 'LAB-42' && row.approvalState === 'approved',
    ),
  ).toBeTruthy();
  expect(
    current.filter((row) => row.status === 'closed' && !row.deleted),
  ).toHaveLength(3);
  expect(current.find((row) => row.id === '002').protected).toBeTruthy();
  expect(current.find((row) => row.id === '002').deleted).toBeFalsy();
};
const enter = async (count) => {
  const reset = await page.request.post(`${base}api/loans/reset`, {
    data: { count },
    headers,
  });
  expect(reset.ok()).toBeTruthy();
  await page.goto(`${base}loans`);
  await expect(page.getByTestId('total')).not.toContainText('Loading');
  // Configure real controls, then use the standard table's next-page control.
  await page
    .getByRole('textbox', { name: 'Search loans', exact: true })
    .fill('Loan 1');
  await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'Loan 1');
  await expect(page.getByTestId('query')).toHaveText(
    new URL(page.url()).search,
  );
  await page.getByLabel('Loan status', { exact: true }).selectOption('open');
  await expect(page).toHaveURL(
    (url) => url.searchParams.get('status') === 'open',
  );
  await expect(page.getByTestId('query')).toHaveText(
    new URL(page.url()).search,
  );
  await page.getByLabel('Sort loans', { exact: true }).selectOption('desc');
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get('sort') === 'name' &&
      url.searchParams.get('order') === 'desc',
  );
  await expect(page.getByTestId('query')).toHaveText(
    new URL(page.url()).search,
  );
  await page.getByLabel('Loans per page', { exact: true }).selectOption('20');
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get('pageSize') === '20' &&
      url.searchParams.get('order') === 'desc',
  );
  await expect(page.getByTestId('query')).toHaveText(
    new URL(page.url()).search,
  );
  await page.getByRole('tab', { name: 'Active loans', exact: true }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get('tab') === 'active' &&
      url.searchParams.get('order') === 'desc',
  );
  await expect(page.getByTestId('query')).toHaveText(
    new URL(page.url()).search,
  );
  await expect(page.getByTestId('total')).toHaveText(
    `Matching total: ${count - 99}`,
  );
  await expect(
    page.getByRole('button', { name: 'Go to next page', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Go to next page', exact: true })
    .click();
  await verifyList(count - 99, 2, count === 121 ? ['101', '100'] : ['100']);
  const sourceUrl = page.url();
  await page
    .getByRole('table')
    .getByRole('link', { name: 'Loan 100', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Loan 100', exact: true }),
  ).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(`${appPath}/loans/100`);
  const breadcrumb = page
    .getByRole('navigation', { name: 'Breadcrumb', exact: true })
    .getByRole('link', { name: 'Equipment loans', exact: true });
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb).toHaveAttribute(
    'href',
    new URL(sourceUrl).pathname + new URL(sourceUrl).search,
  );
  await expect(
    page
      .getByRole('navigation', { name: 'Breadcrumb', exact: true })
      .getByText('Loan details', { exact: true }),
  ).toBeVisible();
  return { sourceUrl, breadcrumb };
};
try {
  await mkdir(path.join(work, 'evidence'), { recursive: true });
  await page.goto(`${base}login`);
  await page.getByLabel('Username or email').fill(process.env.E2E_USERNAME);
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
  const swagger = await page.request.get(`${base}api/swagger`);
  expect(swagger.ok()).toBeTruthy();
  expect((await swagger.json()).paths['/api/loans']).toBeTruthy();
  if (kind === 'old' && process.env.RECHECK_ONLY !== '1') {
    const before = JSON.parse(
      await readFile(
        path.join(work, 'evidence/old-retained-before.json'),
        'utf8',
      ),
    );
    const after = await snapshot();
    expect(after).toEqual(before);
    await save('old-retained-after-upgrade.json', after);
  }
  for (const state of ['valid', 'overflow', 'empty'])
    for (const returnVia of ['breadcrumb', 'page-back', 'browser-back']) {
      const { sourceUrl, breadcrumb } = await enter(
        state === 'valid' ? 121 : 120,
      );
      const detailUrl = page.url(),
        destinationBefore = await breadcrumb.getAttribute('href');
      const concurrentIds = [];
      if (state === 'empty') {
        // A second signed-in writer removes the other matches through the same retained business DELETE API.
        // The detail keeps its normal single-record deletion and unchanged business hooks/soft-delete semantics.
        const matching = (await snapshot()).data.filter(
          (row) =>
            !row.deleted &&
            row.status === 'open' &&
            row.name.includes('Loan 1') &&
            row.id !== '100',
        );
        for (const row of matching) {
          const response = await page.request.delete(
            `${base}api/loans/${row.id}`,
            { headers },
          );
          expect(response.ok()).toBeTruthy();
          concurrentIds.push(row.id);
        }
        expect(concurrentIds).toHaveLength(20);
      }
      reads = 0;
      await page
        .getByRole('button', { name: 'Delete loan and stay', exact: true })
        .click();
      await expect(page.locator('p[role=status]')).toHaveText(
        'Loan deletion committed',
      );
      const deleted = (await snapshot()).data.find((row) => row.id === '100');
      expect(deleted.deleted).toBeTruthy();
      expect(deleted.deleteEvents).toBe(1);
      expect(page.url()).toBe(detailUrl);
      expect(reads).toBe(0);
      await expect(breadcrumb).toHaveAttribute('href', destinationBefore);
      if (returnVia === 'breadcrumb') await breadcrumb.hover();
      if (returnVia === 'breadcrumb')
        await page.screenshot({
          path: path.join(
            work,
            `evidence/${kind}-${state}-detail-breadcrumb.png`,
          ),
          fullPage: true,
        });
      let breadcrumbClick;
      if (returnVia === 'breadcrumb') {
        await breadcrumb.evaluate((link) =>
          link.addEventListener(
            'click',
            (event) => {
              window.__breadcrumbEvidence = {
                isTrusted: event.isTrusted,
                href: link.getAttribute('href'),
                from: window.location.href,
              };
            },
            { once: true },
          ),
        );
        await breadcrumb.click();
        breadcrumbClick = await page.evaluate(
          () => window.__breadcrumbEvidence,
        );
        expect(breadcrumbClick).toEqual({
          isTrusted: true,
          href: destinationBefore,
          from: detailUrl,
        });
      } else if (returnVia === 'page-back')
        await page.getByRole('link', { name: 'Back', exact: true }).click();
      else await page.goBack();
      const total = state === 'valid' ? 21 : state === 'overflow' ? 20 : 0,
        pageNumber = state === 'valid' ? 2 : 1;
      const ids =
        state === 'valid'
          ? ['101']
          : state === 'overflow'
            ? Array.from({ length: 20 }, (_, i) => String(120 - i))
            : [];
      await verifyList(total, pageNumber, ids);
      expect(reads).toBe(state === 'valid' ? 1 : 2);
      const afterReturn = page.url(),
        returnReads = reads;
      if (returnVia === 'breadcrumb')
        await page.screenshot({
          path: path.join(
            work,
            `evidence/${kind}-${state}-breadcrumb-result.png`,
          ),
          fullPage: true,
        });
      // Re-enter a surviving detail and assert the actual breadcrumb now points at the corrected page.
      let correctedBreadcrumb;
      if (ids.length) {
        await page
          .getByRole('table')
          .getByRole('link', { name: `Loan ${ids[0]}`, exact: true })
          .click();
        await expect(
          page.getByRole('heading', { name: `Loan ${ids[0]}`, exact: true }),
        ).toBeVisible();
        await expect(breadcrumb).toHaveAttribute(
          'href',
          new URL(afterReturn).pathname + new URL(afterReturn).search,
        );
        correctedBreadcrumb = await breadcrumb.getAttribute('href');
        assertQuery(new URL(correctedBreadcrumb, base), pageNumber);
        await breadcrumb.click();
        await verifyList(total, pageNumber, ids);
      }
      cases.push({
        state,
        returnVia,
        breadcrumbClick,
        result: 'passed',
        sourceUrl,
        detailUrl,
        destinationBefore,
        afterReturn,
        pageNumber,
        total,
        ids,
        returnReads,
        concurrentIds,
        correctedBreadcrumb,
        controls: expectedContext,
        deletedRecord: {
          id: deleted.id,
          deleted: deleted.deleted,
          deleteEvents: deleted.deleteEvents,
        },
      });
      await save(`${kind}-breadcrumb-results.json`, {
        kind,
        sample,
        entry: base,
        candidate,
        cases,
        errors,
        requests,
      });
      console.log(`${kind} ${state} ${returnVia}: passed`);
    }
  expect(errors).toEqual([]);
  console.log(
    JSON.stringify({
      kind,
      cases: cases.length,
      breadcrumbClicks: 3,
      result: 'passed',
    }),
  );
} catch (error) {
  await page
    .screenshot({
      path: path.join(work, `evidence/${kind}-failure.png`),
      fullPage: true,
    })
    .catch(() => {});
  throw error;
} finally {
  await context.close();
  await browser.close();
}
