import path from 'node:path';
import { createRequire } from 'node:module';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
const work = process.env.VERIFICATION_WORK;
const source = process.env.NOCOBASE_SOURCE;
if (!work || !source) throw Error('Set VERIFICATION_WORK and NOCOBASE_SOURCE');
const require = createRequire(
  path.join(source, 'packages/templates/app-template-default/package.json'),
);
const { chromium, expect } = require('@playwright/test');
const kind = process.argv[2] ?? 'new',
  base =
    process.env.APP_ENTRY ??
    `http://127.0.0.1:${kind === 'new' ? 13817 : 13818}/main/`;
if (!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD)
  throw Error(
    'Provide native credentials for the explicitly authorized test application through the process environment.',
  );
const sample = process.env.SAMPLE_ID ?? kind;
const appPath = new URL(base).pathname.replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  locale: 'en-US',
  viewport: { width: 1360, height: 950 },
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const logs = [];
let reads = 0;
page.on('request', (r) => {
  if (
    r.method() === 'GET' &&
    new URL(r.url()).pathname === `${appPath}/api/loans`
  )
    reads++;
});
const go = async (query) => {
  await page.goto(`${base}loans?${query}`);
  await expect(page.getByTestId('total')).not.toContainText('Loading');
};
const query =
  'page=3&pageSize=10&q=Loan&status=open&sort=name&order=desc&tab=active';
const reset = async (count) => {
  const r = await page.request.post(`${base}api/loans/reset`, {
    data: { count },
    headers: { origin: new URL(base).origin },
  });
  if (!r.ok()) throw Error(`Reset failed ${r.status()} ${await r.text()}`);
};
const snapshot = async () => {
  const r = await page.request.get(`${base}api/loans/snapshot`);
  if (!r.ok()) throw Error(`Snapshot failed ${r.status()}`);
  return r.json();
};
try {
  await page.goto(`${base}login`);
  await page.getByLabel('Username or email').fill(process.env.E2E_USERNAME);
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
  // Learn the independent test application's API from its signed-in OpenAPI document.
  const swagger = await page.request.get(`${base}api/swagger`);
  expect(swagger.ok()).toBeTruthy();
  const paths = (await swagger.json()).paths;
  expect(paths['/api/loans'] ?? paths[`${appPath}/api/loans`]).toBeTruthy();
  await mkdir(path.join(work, 'evidence'), { recursive: true });
  if (kind === 'before') {
    await reset(21);
    await go(query);
    await expect(page.getByTestId('ids')).toHaveText('001');
    await page.getByRole('button', { name: 'Delete 001', exact: true }).click();
    await expect(page.getByTestId('total')).toHaveText('Matching total: 20');
    expect(new URL(page.url()).searchParams.get('page')).toBe('3');
    await expect(page.getByTestId('ids')).toBeEmpty();
    await page.screenshot({
      path: path.join(work, 'evidence/old-before-empty-page.png'),
      fullPage: true,
    });
    await reset(21);
    await writeFile(
      path.join(work, 'evidence/old-retained-before.json'),
      JSON.stringify(await snapshot(), null, 2),
    );
    logs.push({
      case: 'pre-upgrade last-row deletion',
      result: 'reproduced invalid page 3 with total 20 and no rows',
    });
  } else {
    if (kind === 'old' && process.env.RECHECK_ONLY !== '1')
      expect(await snapshot()).toEqual(
        JSON.parse(
          await readFile(
            path.join(work, 'evidence/old-retained-before.json'),
            'utf8',
          ),
        ),
      );
    await reset(21);
    await go(query);
    await expect(page.getByTestId('ids')).toHaveText('001');
    reads = 0;
    await page.getByRole('button', { name: 'Delete 001', exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByTestId('total')).toHaveText('Matching total: 20');
    await expect(page.getByTestId('ids')).toHaveText(
      '011,010,009,008,007,006,005,004,003,002',
    );
    expect(new URL(page.url()).searchParams.toString()).toBe(
      query.replace('page=3', 'page=2'),
    );
    expect(reads).toBe(2);
    logs.push({
      case: 'last page single delete, filtered and sorted',
      reads,
      result: 'page 2; total 20; ids 011..002; context retained',
    });
    await page.screenshot({
      path: `${work}/evidence/${kind}-after-page-correction.png`,
      fullPage: true,
    });
    // Open corrected detail and use native back link: no invalid source page is restored.
    await page.getByRole('link', { name: 'Loan 011', exact: true }).click();
    await page.getByRole('link', { name: 'Back', exact: true }).click();
    await expect(page).toHaveURL(/loans\?page=2/);
    await expect(page.getByTestId('ids')).toContainText('011');
    await reset(21);
    await go(query);
    await page.getByRole('link', { name: 'Loan 001', exact: true }).click();
    reads = 0;
    await page
      .getByRole('button', { name: 'Delete loan and return', exact: true })
      .click();
    await expect(page).toHaveURL(/loans\?page=2/);
    await expect(page.getByTestId('ids')).toContainText('011');
    expect(reads).toBe(2);
    logs.push({
      case: 'detail delete and return',
      reads,
      result: 'source corrected once on activation; context retained',
    });
    await reset(21);
    await go(query);
    await page.getByRole('link', { name: 'Loan 001', exact: true }).click();
    reads = 0;
    await page
      .getByRole('button', { name: 'Delete loan and stay', exact: true })
      .click();
    // Await committed mutation using retained server data, without a timing sleep.
    await expect
      .poll(
        async () =>
          (await snapshot()).data.find((row) => row.id === '001').deleted,
      )
      .toBeTruthy();
    expect(new URL(page.url()).pathname).toBe(`${appPath}/loans/001`);
    expect(new URL(page.url()).searchParams.get('page')).toBe('3');
    expect(reads).toBe(0);
    await page.goBack();
    await expect(page).toHaveURL(/loans\?page=2/);
    await expect(page.getByTestId('ids')).toContainText('011');
    expect(reads).toBe(2);
    logs.push({
      case: 'detail delete, stay, browser Back',
      reads,
      result: 'hidden URL unchanged; return corrects source',
    });
    await reset(22);
    await go(query);
    await expect(page.getByTestId('ids')).toHaveText('002,001');
    await page.getByLabel('Select 002').check();
    await page.getByLabel('Select 001').check();
    reads = 0;
    await page
      .getByRole('button', { name: 'Delete selected', exact: true })
      .click();
    await expect(page.getByTestId('failures')).toHaveText(
      'Failed operations: 1',
    );
    await expect(page.getByTestId('total')).toHaveText('Matching total: 21');
    await expect(page.getByTestId('ids')).toHaveText('002');
    expect(reads).toBe(1);
    logs.push({
      case: 'partially successful batch',
      reads,
      result: 'protected 002 remains; total 21; page 3 retained',
    });
    reads = 0;
    await page.getByRole('button', { name: 'Delete 002', exact: true }).click();
    await expect
      .poll(
        async () =>
          (await snapshot()).data.find((row) => row.id === '002').deleted,
      )
      .toBeFalsy();
    await expect(page.getByTestId('failures')).toHaveText(
      'Failed operations: 1',
    );
    await expect(page.getByTestId('ids')).toHaveText('002');
    expect(reads).toBe(0);
    logs.push({
      case: 'server business constraint rejection',
      reads,
      result: 'rows, total, URL and approval preserved',
    });
    await reset(21);
    await go(query.replace('page=3', 'page=1'));
    reads = 0;
    await page.getByRole('button', { name: 'Delete 021', exact: true }).click();
    await expect(page.getByTestId('ids')).toHaveText(
      '020,019,018,017,016,015,014,013,012,011',
    );
    expect(reads).toBe(1);
    logs.push({
      case: 'first page refill',
      reads,
      result: 'page 1 retained and refilled with id 011',
    });
    await reset(1);
    await go(query.replace('page=3', 'page=1'));
    reads = 0;
    await page.getByRole('button', { name: 'Delete 001', exact: true }).click();
    await expect(page.getByTestId('total')).toHaveText('Matching total: 0');
    await expect(page.getByTestId('ids')).toBeEmpty();
    expect(new URL(page.url()).searchParams.get('page')).toBe('1');
    expect(reads).toBe(1);
    logs.push({
      case: 'all matches deleted',
      reads,
      result: 'legal first page and true empty result; closed rows retained',
    });
    await reset(21);
    await go(`${query}&mode=client`);
    reads = 0;
    await page.getByRole('button', { name: 'Delete 001', exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByTestId('ids')).toContainText('011');
    expect(reads).toBe(1);
    logs.push({
      case: 'complete client pagination',
      reads,
      result: 'one refresh, local correction, full data retained',
    });
    // Hold an actual pre-delete response; its snapshot must never replace the fresh list.
    await reset(21);
    await go(query);
    await expect(page.getByTestId('ids')).toHaveText('001');
    let captured, release, completed;
    const capturedPromise = new Promise((resolve) => {
      captured = resolve;
    });
    const releasePromise = new Promise((resolve) => {
      release = resolve;
    });
    const completedPromise = new Promise((resolve) => {
      completed = resolve;
    });
    let first = true;
    const matcher = '**/api/loans?**';
    const delayed = async (route) => {
      if (!first) {
        await route.continue();
        return;
      }
      first = false;
      const response = await route.fetch();
      const body = await response.body();
      captured();
      await releasePromise;
      try {
        await route.fulfill({ response, body });
      } catch {
      } finally {
        completed();
      }
    };
    await page.route(matcher, delayed);
    await page
      .getByRole('button', { name: 'Refresh loans', exact: true })
      .click();
    await capturedPromise;
    await page.getByRole('button', { name: 'Delete 001', exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByTestId('ids')).toContainText('011');
    release();
    await completedPromise;
    await page.unroute(matcher, delayed);
    await expect(page.getByTestId('ids')).not.toContainText('001');
    expect(new URL(page.url()).searchParams.get('page')).toBe('2');
    logs.push({
      case: 'delayed pre-delete response',
      result:
        'captured server snapshot discarded after mutation and correction',
    });
    // A wholly successful batch is settled before one refresh and one corrective read.
    await reset(23);
    await go(query);
    await expect(page.getByTestId('ids')).toHaveText('003,002,001');
    await page.getByLabel('Select 003').check();
    await page.getByLabel('Select 001').check();
    reads = 0;
    await page
      .getByRole('button', { name: 'Delete selected', exact: true })
      .click();
    await expect(page.getByTestId('ids')).toHaveText('002');
    await expect(page.getByTestId('total')).toHaveText('Matching total: 21');
    expect(reads).toBe(1);
    logs.push({
      case: 'wholly successful batch',
      reads,
      result:
        'both selected records deleted; protected record outside selection retained',
    });
    // Concurrent independent writers shrink the actual database before each verification read.
    await reset(1000);
    await go(query.replace('page=3', 'page=100'));
    await expect(page.getByTestId('total')).toHaveText('Matching total: 1000');
    let concurrentRounds = 0;
    const concurrent = async (route) => {
      concurrentRounds++;
      const rows = (await snapshot()).data
        .filter(
          (row) => !row.deleted && row.status === 'open' && !row.protected,
        )
        .slice(-20);
      await Promise.all(
        rows.map(async (row) => {
          const response = await page.request.delete(
            `${base}api/loans/${row.id}`,
            { headers: { origin: new URL(base).origin } },
          );
          expect(response.ok()).toBeTruthy();
        }),
      );
      await route.continue();
    };
    await page.route(matcher, concurrent);
    reads = 0;
    await page
      .getByRole('button', { name: 'Refresh loans', exact: true })
      .click();
    await expect(page.getByTestId('error')).toHaveText(
      'The list has changed. Please retry.',
    );
    expect(concurrentRounds).toBe(3);
    expect(reads).toBe(3);
    expect(new URL(page.url()).searchParams.get('page')).toBe('96');
    await page.screenshot({
      path: `${work}/evidence/${kind}-bounded-recovery.png`,
      fullPage: true,
    });
    await page.unroute(matcher, concurrent);
    await page
      .getByRole('button', { name: 'Refresh loans', exact: true })
      .click();
    await expect(page.getByTestId('error')).toBeEmpty();
    await expect(page).toHaveURL(/page=94/);
    logs.push({
      case: 'continuously shrinking real database',
      reads: 3,
      result:
        'two corrections then retry error; explicit Retry recovers page 94',
    });
    await reset(21);
    await go(query);
    await page.getByRole('button', { name: 'Delete 001', exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    const retained = await snapshot();
    const deleted = retained.data.find((row) => row.id === '001');
    expect(deleted.deleted).toBeTruthy();
    expect(deleted.deleteEvents).toBe(1);
    expect(
      retained.data.every(
        (row) =>
          row.costCenter === 'LAB-42' && row.approvalState === 'approved',
      ),
    ).toBeTruthy();
    expect(retained.data.filter((row) => row.status === 'closed')).toHaveLength(
      3,
    );
    const validation = await page.request.post(`${base}api/loans/validate`, {
      data: { costCenter: '' },
      headers: { origin: new URL(base).origin },
    });
    expect(validation.status()).toBe(400);
    const anonymous = await browser.newContext();
    expect((await anonymous.request.get(`${base}api/loans`)).status()).toBe(
      401,
    );
    await anonymous.close();
    logs.push({
      case: 'customizations and retained data',
      result:
        'cost center, approval, validation, native auth, soft delete and exactly one event preserved',
    });
    expect(errors).toEqual([]);
  }
  await writeFile(
    `${work}/evidence/${kind}-browser-results.json`,
    JSON.stringify({ sample, entry: base, cases: logs, errors }, null, 2),
  );
  console.log(JSON.stringify({ kind, cases: logs.length, result: 'passed' }));
} finally {
  await context.close();
  await browser.close();
}
