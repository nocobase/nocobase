import { expect, test } from '@playwright/test';

test.beforeEach(() =>
  test.skip(
    test.info().config.metadata.isolatedMailProductionAcceptance !== true,
    'Use production-acceptance.config.ts; never a user application.',
  ),
);

test('real production page guards, local OAuth persistence, success/failure returns and workspace', async ({
  page,
  context,
  baseURL,
}) => {
  if (!baseURL) throw new Error('Acceptance fixture requires baseURL');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const mailReads: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'GET' &&
      new URL(request.url()).pathname.startsWith('/main/api/mail/')
    )
      mailReads.push(request.url());
  });
  const origin = new URL(baseURL).origin;
  const api = `${origin}/main/api`;
  await page.goto(`${baseURL}mail/accounts`);
  await expect(
    page.getByRole('heading', {
      name: 'Sign in to the acceptance application',
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/main\/login$/);
  expect(mailReads).toEqual([]);
  expect((await context.request.get(`${api}/mail/accounts`)).status()).toBe(
    401,
  );

  const login = async (email: string): Promise<void> => {
    const response = await context.request.post(`${api}/auth/sign-in/email`, {
      data: { email, password: 'Local-acceptance-only-password-42!' },
      headers: { origin },
    });
    expect(response.status()).toBe(200);
    expect(
      (await context.cookies()).some((cookie) =>
        cookie.name.includes('session'),
      ),
    ).toBe(true);
  };
  await login('denied@acceptance.invalid');
  await page.goto(`${baseURL}mail/accounts`);
  await expect(
    page.getByRole('heading', { name: 'Access denied' }),
  ).toBeVisible();
  await page.goto(`${baseURL}mail`);
  await expect(
    page.getByRole('heading', { name: 'Access denied' }),
  ).toBeVisible();
  expect(mailReads).toEqual([]);
  const denied = await context.request.get(`${api}/mail/accounts`);
  expect(denied.status()).toBe(403);
  expect((await denied.json()).error.reason).toBe('MAIL_ACCESS_DENIED');
  // Authorization precedes even JSON validation on the write boundary.
  const deniedWrite = await context.request.post(`${api}/mail/authorizations`, {
    data: {},
    headers: { origin },
  });
  expect(deniedWrite.status()).toBe(403);
  expect((await deniedWrite.json()).error.reason).toBe('MAIL_ACCESS_DENIED');
  await context.clearCookies();
  await login('allowed@acceptance.invalid');
  await page.goto(`${baseURL}mail/accounts`);
  await expect(
    page.getByText('saved-account@acceptance.invalid', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('browser-saved-account@acceptance.invalid', { exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      Reflect.get(window, '__mailProductionAcceptance'),
    ),
  ).toEqual({ production: true, realMailClient: true, devRoutes: 0 });
  expect(['default', 'compact']).toContain(
    await page.evaluate(() => document.documentElement.dataset.theme),
  );
  await page
    .getByRole('button', { name: 'Connect account', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('combobox', { name: 'Mail account type', exact: true })
    .selectOption({ label: 'Local acceptance OAuth · local' });
  await page
    .getByRole('dialog')
    .getByRole('button', {
      name: /Connect account|Connect|Authorize/,
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(
    `${baseURL}mail/accounts?source=connect&mailAuthorization=success`,
  );
  await expect(page.getByText(/Account connected successfully/)).toBeVisible();
  await expect(
    page.getByText('browser-saved-account@acceptance.invalid', { exact: true }),
  ).toBeVisible();
  await test.info().attach('OAuth success with persisted account', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  expect(page.url()).not.toMatch(
    /code=|state=|local-private|mailAuthorization=old/,
  );
  await page.screenshot({
    path: test.info().outputPath('oauth-success.png'),
    fullPage: false,
  });
  await page.reload();
  await expect(
    page.getByText('browser-saved-account@acceptance.invalid', { exact: true }),
  ).toBeVisible();
  const accounts = await context.request.get(`${api}/mail/accounts`);
  expect(accounts.status()).toBe(200);
  const data = await accounts.json();
  expect(data.data).toHaveLength(2);
  expect(JSON.stringify(data)).not.toMatch(/local-private|credentialReference/);

  const started = await context.request.post(`${api}/mail/authorizations`, {
    data: {
      type: 'acceptance-local',
      name: 'local',
      initialSyncReceivedAfter: '2026-01-01T00:00:00Z',
    },
    headers: { origin },
  });
  expect(started.status()).toBe(201);
  const authorization = (await started.json()).data;
  await page.goto(`${authorization.authorizationUrl}&failure=true`);
  await expect(page).toHaveURL(
    `${baseURL}mail/accounts?source=connect&mailAuthorization=failure`,
  );
  await expect(
    page.getByText('The mail account could not be connected. Try again.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(page.url()).not.toMatch(/code=|state=|local-private/);
  await page.screenshot({
    path: test.info().outputPath('oauth-failure.png'),
    fullPage: false,
  });
  await expect(
    page.getByText('browser-saved-account@acceptance.invalid', { exact: true }),
  ).toBeVisible();
  await test.info().attach('OAuth failure without leaked provider detail', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await page.goto(`${baseURL}mail`);
  await expect(
    page.getByRole('heading', { name: 'Mail', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'browser-saved-account@acceptance.invalid',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Mail accounts', exact: true }),
  ).toHaveAttribute('href', '/main/mail/accounts');
  expect(errors).toEqual([]);
});
