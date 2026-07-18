/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { request, type APIResponse, type ConsoleMessage, type TestInfo } from '@playwright/test';
import { expect, test } from '@nocobase/test/e2e';
import fs from 'fs/promises';

import type { LightExtensionPullResult } from '../../shared/types';
import {
  generateClientAppFixtureZip,
  getClientAppFixtureMetadata,
  type ClientAppFixtureId,
} from './fixtures/client-app';
import {
  assertApiResponseOk,
  getErrorMessage,
  isRecord,
  readApiResponse,
  signInRootApiAndInstallBrowserSession,
  type RootApiSession,
} from './helpers';

type ClientAppDescriptor = {
  entryId: string;
  repoId: string;
  key: string;
  entryHtml: string;
  contentHash: string;
  fileCount: number;
  ready: boolean;
};

type RepoDescriptor = {
  id: string;
  headCommitId: string;
};

type ReferenceDescriptor = {
  ownerKind?: string;
  ownerId?: string;
  entryId?: string;
};

type TestMemberUser = {
  id: string | number;
  headers: Record<string, string>;
};

type PortalFrontend = { type: 'layout'; layoutUid: string } | { type: 'client-app'; entryId: string };

type PortalInput = {
  uid: string;
  routePath: string;
  authCheck: boolean;
  frontend: PortalFrontend;
};

type DiagnosticCapture = {
  console: Array<{ type: string; text: string }>;
  network: Array<{ method: string; status?: number; url: string; failure?: string }>;
};

test.use({ screenshot: 'only-on-failure', trace: 'retain-on-failure' });

test.describe('Light Extension client-app hosting', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(600_000);

  let diagnostics: DiagnosticCapture;

  test.beforeEach(async ({ page }) => {
    diagnostics = { console: [], network: [] };
    page.on('console', (message: ConsoleMessage) => {
      diagnostics.console.push({ type: message.type(), text: message.text() });
    });
    page.on('pageerror', (error) => {
      diagnostics.console.push({ type: 'pageerror', text: error.message });
    });
    page.on('requestfailed', (request) => {
      diagnostics.network.push({
        method: request.method(),
        url: request.url(),
        failure: request.failure()?.errorText || 'request failed',
      });
    });
    page.on('response', (response) => {
      diagnostics.network.push({
        method: response.request().method(),
        status: response.status(),
        url: response.url(),
      });
    });
  });

  test.afterEach(async ({ page: _page }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) {
      return;
    }
    await attachJson(testInfo, 'client-app-console.json', diagnostics.console);
    await attachJson(testInfo, 'client-app-network.json', diagnostics.network);
  });

  test('uploads, replaces, hosts, and protects a real workspace client app', async ({ browser, page }) => {
    page.setDefaultTimeout(20_000);
    const session = await signInRootApiAndInstallBrowserSession(page);
    await page.setExtraHTTPHeaders(session.headers);
    const baseURL = process.env.APP_BASE_URL || 'http://127.0.0.1:23000';
    const gatewayBaseURL = clientAppGatewayBaseUrl(baseURL);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const portalUid = `client-app-e2e-${suffix}`;
    const portalRoutePath = `/client-app-e2e-${suffix}`;
    const portalUrl = new URL(`/v${portalRoutePath}/`, gatewayBaseURL).toString();
    const nestedPortalUid = `nested-client-app-e2e-${suffix}`;
    const nestedPortalRoutePath = `/nested-client-app-e2e-${suffix}`;
    const nestedPortalUrl = new URL(`/v${nestedPortalRoutePath}/`, gatewayBaseURL).toString();
    const switchingPortalUid = `switching-client-app-e2e-${suffix}`;
    const switchingPortalRoutePath = `/switching-client-app-e2e-${suffix}`;
    const switchingPortalUrl = new URL(`/v${switchingPortalRoutePath}/`, gatewayBaseURL).toString();
    let repoId: string | undefined;
    let entryId: string | undefined;
    let nestedEntryId: string | undefined;
    let memberUserId: string | number | undefined;
    let portalCreated = false;
    let nestedPortalCreated = false;
    let switchingPortalCreated = false;

    try {
      const repo = await createRepo(page, session, `client-app-e2e-${suffix}`);
      repoId = repo.id;

      const workspace = await pullWorkspace(page, session, repo.id);
      expect(workspace.repo?.headCommitId).toBe(repo.headCommitId);
      expect(workspace.files?.length).toBeGreaterThan(0);

      const first = await uploadFixture(page, session, repo.id, 'root-v1');
      entryId = first.entryId;
      expect(first).toMatchObject({
        repoId: repo.id,
        key: getClientAppFixtureMetadata('root-v1').key,
        entryHtml: 'index.html',
        ready: true,
      });

      await createPortal(page, session, {
        uid: portalUid,
        routePath: portalRoutePath,
        authCheck: true,
        frontend: { type: 'client-app', entryId: first.entryId },
      });
      portalCreated = true;
      expect(await readPortal(page, session, portalUid)).toMatchObject({
        authCheck: true,
        frontendType: 'client-app',
        clientAppEntryId: first.entryId,
      });
      await waitForHostedDocument(page, portalUrl, 'root client-app fixture v1', session.headers);

      const anonymousContext = await browser.newContext({
        baseURL: gatewayBaseURL,
        storageState: { cookies: [], origins: [] },
      });
      try {
        const anonymousPage = await anonymousContext.newPage();
        await anonymousPage.goto(portalUrl, { waitUntil: 'domcontentloaded' });
        await expect(anonymousPage).toHaveURL(/\/v\/signin\?redirect=/u);
        expect(new URL(anonymousPage.url()).searchParams.get('redirect')).toBe(new URL(portalUrl).pathname);
        const anonymousAsset = await anonymousPage.request.get(`${portalUrl}assets/app.js`, {
          headers: { Accept: 'application/javascript' },
        });
        expect(anonymousAsset.status()).toBe(401);
        await anonymousPage.getByPlaceholder('Username/Email').fill('nocobase');
        await anonymousPage.getByPlaceholder('Password').fill('admin123');
        await anonymousPage.getByRole('button', { name: 'Sign in' }).click();
        await expect(anonymousPage).toHaveURL(portalUrl);
        await expect(anonymousPage.getByTestId('fixture-version')).toHaveText('root client-app fixture v1');
      } finally {
        await anonymousContext.close();
      }

      const memberUser = await createMemberUser(page, session, suffix);
      memberUserId = memberUser.id;
      await removeRolePortalAccess(page, session, 'member', portalUid);
      const memberApi = await request.newContext({
        baseURL: gatewayBaseURL,
        extraHTTPHeaders: memberUser.headers,
      });
      try {
        expect((await memberApi.get(portalUrl, { headers: { Accept: 'text/html' } })).status()).toBe(403);
        await ensureRolePortalAccess(page, session, 'member', portalUid);
        expect((await memberApi.get(portalUrl, { headers: { Accept: 'text/html' } })).status()).toBe(200);
        const memberUsers = await readApiResponse<unknown[]>(
          await memberApi.get('/api/users:list'),
          'List member users',
        );
        expect(memberUsers).toEqual([]);
        expect((await memberApi.get('/api/roles:list')).status()).toBe(403);
      } finally {
        await memberApi.dispose();
      }
      expect((await page.request.get('/api/users:list', { headers: session.headers })).status()).toBe(200);

      await expect
        .poll(async () => (await listReferences(page, session, first.entryId)).length, { timeout: 30_000 })
        .toBe(1);
      expect(await listReferences(page, session, first.entryId)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ownerKind: 'multiPortal.frontend',
            ownerId: portalUid,
          }),
        ]),
      );

      await waitForHostedDocument(page, portalUrl, 'root client-app fixture v1', session.headers);
      await page.goto(`${portalUrl}?autorun=1&getAction=app:getInfo&postAction=auth:check&sdkAction=app:getInfo`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.getByTestId('fixture-version')).toHaveText('root client-app fixture v1');
      await assertRuntimeMatrix(page, 'rgb(22, 119, 255)');

      const firstAsset = await page.request.get(`${portalUrl}assets/app.js`, { headers: session.headers });
      expect(firstAsset.status()).toBe(200);
      const firstEtag = requireHeader(firstAsset, 'etag');
      const notModified = await page.request.get(`${portalUrl}assets/app.js`, {
        headers: { ...session.headers, 'If-None-Match': firstEtag },
      });
      expect(notModified.status()).toBe(304);

      const badReplacement = await uploadFixture(page, session, repo.id, 'bad-wrong-key', {
        entryId: first.entryId,
        contentHash: first.contentHash,
        expectedStatus: 400,
      });
      expect(badReplacement).toMatchObject({ status: 400 });
      const afterBadPackage = await getClientApp(page, session, first.entryId);
      expect(afterBadPackage.contentHash).toBe(first.contentHash);
      const traversalReplacement = await uploadFixture(page, session, repo.id, 'bad-traversal', {
        entryId: first.entryId,
        contentHash: first.contentHash,
        expectedStatus: 422,
      });
      expect(traversalReplacement).toMatchObject({ status: 422 });
      expect((await getClientApp(page, session, first.entryId)).contentHash).toBe(first.contentHash);

      const second = await uploadFixture(page, session, repo.id, 'root-v2', {
        entryId: first.entryId,
        contentHash: first.contentHash,
      });
      expect(second.entryId).toBe(first.entryId);
      expect(second.contentHash).not.toBe(first.contentHash);

      const secondAsset = await page.request.get(`${portalUrl}assets/app.js`, { headers: session.headers });
      expect(secondAsset.status()).toBe(200);
      expect(requireHeader(secondAsset, 'etag')).not.toBe(firstEtag);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('fixture-version')).toHaveText('root client-app fixture v2');
      await assertRuntimeMatrix(page, 'rgb(82, 196, 26)');

      await page.getByRole('link', { name: 'Open history route' }).click();
      await expect(page.getByTestId('fixture-route')).toContainText(`${new URL(portalUrl).pathname}orders/42`);
      expect(new URL(page.url()).searchParams.get('from')).toBe('v2');
      expect(new URL(page.url()).searchParams.get('autorun')).toBe('1');
      expect(new URL(page.url()).hash).toBe('#details');

      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('fixture-version')).toHaveText('root client-app fixture v2');
      await expect(page.getByTestId('fixture-route')).toContainText(`${new URL(portalUrl).pathname}orders/42`);

      const missingAsset = await page.request.get(`${portalUrl}assets/missing.js`, {
        headers: { ...session.headers, Accept: 'application/javascript' },
      });
      expect(missingAsset.status()).toBe(404);
      expect((await missingAsset.text()).toLowerCase()).not.toContain('<!doctype html>');

      const htmlFallback = await page.goto(`${portalUrl}orders/missing?view=open`, { waitUntil: 'domcontentloaded' });
      expect(htmlFallback?.status()).toBe(200);
      expect(htmlFallback?.headers()['content-type']).toContain('text/html');
      await expect(page.getByTestId('fixture-version')).toHaveText('root client-app fixture v2');
      expect(new URL(page.url()).searchParams.get('view')).toBe('open');

      await createPortal(page, session, {
        uid: switchingPortalUid,
        routePath: switchingPortalRoutePath,
        authCheck: false,
        frontend: { type: 'layout', layoutUid: 'admin-layout-model' },
      });
      switchingPortalCreated = true;
      await page.goto(switchingPortalUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('user-center-button')).toBeVisible();
      expect(await readPortal(page, session, switchingPortalUid)).toMatchObject({
        frontendType: 'layout',
        clientAppEntryId: null,
      });

      await updatePortal(page, session, {
        uid: switchingPortalUid,
        routePath: switchingPortalRoutePath,
        authCheck: false,
        frontend: { type: 'client-app', entryId: first.entryId },
      });
      await waitForHostedDocument(page, switchingPortalUrl, 'root client-app fixture v2', session.headers);
      await page.goto(switchingPortalUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('fixture-version')).toHaveText('root client-app fixture v2');
      expect(await readPortal(page, session, switchingPortalUid)).toMatchObject({
        frontendType: 'client-app',
        clientAppEntryId: first.entryId,
      });

      await updatePortal(page, session, {
        uid: switchingPortalUid,
        routePath: switchingPortalRoutePath,
        authCheck: false,
        frontend: { type: 'layout', layoutUid: 'admin-layout-model' },
      });
      await expect
        .poll(async () => (await listReferences(page, session, first.entryId)).length, { timeout: 30_000 })
        .toBe(1);
      await page.goto(switchingPortalUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('user-center-button')).toBeVisible();
      expect(await readPortal(page, session, switchingPortalUid)).toMatchObject({
        frontendType: 'layout',
        clientAppEntryId: null,
      });
      await destroyPortal(page, session, switchingPortalUid);
      switchingPortalCreated = false;

      const nested = await uploadFixture(page, session, repo.id, 'nested-v1');
      nestedEntryId = nested.entryId;
      expect(nested).toMatchObject({
        entryHtml: 'dist/application.html',
        key: getClientAppFixtureMetadata('nested-v1').key,
        ready: true,
      });
      await createPortal(page, session, {
        uid: nestedPortalUid,
        routePath: nestedPortalRoutePath,
        authCheck: false,
        frontend: { type: 'client-app', entryId: nested.entryId },
      });
      nestedPortalCreated = true;
      await waitForHostedDocument(page, nestedPortalUrl, 'nested client-app fixture v1', session.headers);
      await page.goto(
        `${nestedPortalUrl}?autorun=1&getAction=app:getInfo&postAction=auth:check&sdkAction=app:getInfo`,
        {
          waitUntil: 'domcontentloaded',
        },
      );
      await expect(page.getByTestId('fixture-version')).toHaveText('nested client-app fixture v1');
      await assertRuntimeMatrix(page, 'rgb(22, 119, 255)');
      await page.getByRole('link', { name: 'Open history route' }).click();
      await expect(page.getByTestId('fixture-route')).toContainText(`${new URL(nestedPortalUrl).pathname}orders/42`);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('fixture-version')).toHaveText('nested client-app fixture v1');
      await expect(page.getByTestId('fixture-route')).toContainText(`${new URL(nestedPortalUrl).pathname}orders/42`);
      await destroyPortal(page, session, nestedPortalUid);
      nestedPortalCreated = false;
      await assertApiResponseOk(await deleteClientApp(page, session, nested.entryId), 'Delete nested client app');
      nestedEntryId = undefined;

      const protectedDelete = await deleteClientApp(page, session, first.entryId);
      expect(protectedDelete.status()).toBe(409);
      expect(await readErrorCode(protectedDelete)).toBe('LIGHT_EXTENSION_REFERENCE_EXISTS');
      expect((await getClientApp(page, session, first.entryId)).contentHash).toBe(second.contentHash);

      await destroyPortal(page, session, portalUid);
      portalCreated = false;
      await expect
        .poll(async () => (await listReferences(page, session, first.entryId)).length, { timeout: 30_000 })
        .toBe(0);

      await assertApiResponseOk(await deleteClientApp(page, session, first.entryId), 'Delete unreferenced client app');
      entryId = undefined;
    } finally {
      const cleanupErrors: string[] = [];
      if (portalCreated) {
        await captureCleanup(cleanupErrors, () => destroyPortal(page, session, portalUid));
      }
      if (nestedPortalCreated) {
        await captureCleanup(cleanupErrors, () => destroyPortal(page, session, nestedPortalUid));
      }
      if (switchingPortalCreated) {
        await captureCleanup(cleanupErrors, () => destroyPortal(page, session, switchingPortalUid));
      }
      if (nestedEntryId) {
        await captureCleanup(cleanupErrors, async () => {
          const response = await deleteClientApp(page, session, nestedEntryId as string);
          if (!response.ok() && response.status() !== 404) {
            await assertApiResponseOk(response, 'Cleanup nested client app');
          }
        });
      }
      if (entryId) {
        await captureCleanup(cleanupErrors, async () => {
          const response = await deleteClientApp(page, session, entryId as string);
          if (!response.ok() && response.status() !== 404) {
            await assertApiResponseOk(response, 'Cleanup client app');
          }
        });
      }
      if (repoId) {
        await captureCleanup(cleanupErrors, () => removeRepo(page, session, repoId as string));
      }
      if (memberUserId !== undefined) {
        await captureCleanup(cleanupErrors, () => destroyUser(page, session, memberUserId as string | number));
      }
      expect(cleanupErrors, cleanupErrors.join('; ')).toEqual([]);
    }
  });
});

async function createRepo(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  name: string,
) {
  const response = await page.request.post('/api/lightExtensionRepos:create', {
    headers: session.headers,
    data: {
      name,
      title: `Client app E2E ${name}`,
      initialFiles: [
        {
          path: 'README.md',
          content: '# Client app E2E\n',
          language: 'markdown',
          mode: '100644',
        },
      ],
    },
  });
  const result = await readApiResponse<unknown>(response, 'Create client-app Light Extension repo');
  const candidate = isRecord(result) && isRecord(result.repo) ? result.repo : result;
  if (!isRecord(candidate) || typeof candidate.id !== 'string' || typeof candidate.headCommitId !== 'string') {
    throw new Error('Client-app Light Extension repo create response is invalid');
  }
  return candidate as RepoDescriptor;
}

async function pullWorkspace(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  repoId: string,
) {
  const response = await page.request.post('/api/lightExtensionFiles:pull', {
    headers: session.headers,
    data: { repoId, includeContent: 'all' },
  });
  return readApiResponse<LightExtensionPullResult>(response, 'Pull client-app Light Extension workspace');
}

async function createMemberUser(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  suffix: string,
): Promise<TestMemberUser> {
  const username = `client-app-member-${suffix}`;
  const password = 'ClientAppE2E!123';
  const response = await page.request.post('/api/users:create', {
    headers: session.headers,
    data: {
      username,
      nickname: `Client app E2E member ${suffix}`,
      password,
    },
  });
  const user = await readApiResponse<unknown>(response, 'Create client-app member user');
  if (!isRecord(user) || (typeof user.id !== 'string' && typeof user.id !== 'number')) {
    throw new Error('Client-app member user create response is invalid');
  }
  await assertApiResponseOk(
    await page.request.post(`/api/users/${encodeURIComponent(String(user.id))}/roles:add?filterByTk=member`, {
      headers: session.headers,
    }),
    'Assign member role to client-app test user',
  );

  const signIn = await page.request.post('/api/auth:signIn', {
    headers: {
      'X-Authenticator': 'basic',
      'X-Locale': session.locale,
    },
    data: { account: username, password },
  });
  const signInResult = await readApiResponse<unknown>(signIn, 'Sign in client-app member user');
  if (!isRecord(signInResult) || typeof signInResult.token !== 'string' || !signInResult.token) {
    throw new Error('Client-app member sign-in response does not contain a token');
  }

  return {
    id: user.id,
    headers: {
      Authorization: `Bearer ${signInResult.token}`,
      'X-Authenticator': 'basic',
      'X-Locale': session.locale,
      'X-Role': 'member',
      'X-Timezone': '+08:00',
      'X-With-Acl-Meta': 'true',
    },
  };
}

async function uploadFixture(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  repoId: string,
  fixtureId: ClientAppFixtureId,
  expected?: { entryId: string; contentHash: string; expectedStatus?: number },
): Promise<ClientAppDescriptor | { status: number }> {
  const metadata = getClientAppFixtureMetadata(fixtureId);
  const multipart: Record<string, string | { name: string; mimeType: string; buffer: Buffer }> = {
    repoId,
    file: {
      name: metadata.archiveName,
      mimeType: 'application/zip',
      buffer: await generateClientAppFixtureZip(fixtureId),
    },
  };
  if (expected) {
    multipart.expectedEntryId = expected.entryId;
    multipart.expectedContentHash = expected.contentHash;
  }
  const response = await page.request.post('/api/lightExtensionClientApps:upload', {
    headers: session.headers,
    multipart,
  });
  if (expected?.expectedStatus !== undefined) {
    expect(response.status()).toBe(expected.expectedStatus);
    return { status: response.status() };
  }
  return readApiResponse<ClientAppDescriptor>(response, `Upload client-app fixture ${fixtureId}`);
}

async function getClientApp(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  entryId: string,
) {
  const response = await page.request.post('/api/lightExtensionClientApps:get', {
    headers: session.headers,
    data: { entryId },
  });
  return readApiResponse<ClientAppDescriptor>(response, `Get client app ${entryId}`);
}

async function listReferences(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  entryId: string,
) {
  const response = await page.request.post('/api/lightExtensionClientApps:listReferences', {
    headers: session.headers,
    data: { entryId },
  });
  return readApiResponse<ReferenceDescriptor[]>(response, `List client app references ${entryId}`);
}

async function createPortal(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  input: PortalInput,
) {
  const response = await page.request.post('/api/multiPortals:create', {
    headers: session.headers,
    data: portalValues(input),
  });
  await assertApiResponseOk(response, 'Create Multi-Portal');
  await updatePortal(page, session, input);
}

async function updatePortal(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  input: PortalInput,
) {
  const response = await page.request.post(`/api/multiPortals:update?filterByTk=${encodeURIComponent(input.uid)}`, {
    headers: session.headers,
    data: portalValues(input),
  });
  await assertApiResponseOk(response, 'Update Multi-Portal frontend');
}

async function readPortal(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  portalUid: string,
) {
  const response = await page.request.get('/api/multiPortals:get', {
    headers: session.headers,
    params: { filterByTk: portalUid },
  });
  return readApiResponse<Record<string, unknown>>(response, 'Read Multi-Portal frontend');
}

function portalValues(input: PortalInput): Record<string, unknown> {
  return {
    uid: input.uid,
    title: `Client app E2E ${input.uid}`,
    routeName: input.uid.replaceAll('-', '_'),
    routePath: input.routePath,
    authCheck: input.authCheck,
    enabled: true,
    frontendType: input.frontend.type,
    uiLayoutUid: input.frontend.type === 'layout' ? input.frontend.layoutUid : null,
    clientAppEntryId: input.frontend.type === 'client-app' ? input.frontend.entryId : null,
  };
}

async function destroyPortal(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  portalUid: string,
) {
  const response = await page.request.post(`/api/multiPortals:destroy?filterByTk=${encodeURIComponent(portalUid)}`, {
    headers: session.headers,
  });
  if (!response.ok() && response.status() !== 404) {
    await assertApiResponseOk(response, 'Destroy Multi-Portal');
  }
}

async function ensureRolePortalAccess(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  roleName: string,
  portalUid: string,
) {
  await removeRolePortalAccess(page, session, roleName, portalUid);
  const response = await page.request.post(
    `/api/roles/${encodeURIComponent(roleName)}/multiPortals:add?filterByTk=${encodeURIComponent(portalUid)}`,
    { headers: session.headers },
  );
  await assertApiResponseOk(response, `Grant ${roleName} access to ${portalUid}`);
}

async function removeRolePortalAccess(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  roleName: string,
  portalUid: string,
) {
  const response = await page.request.post(
    `/api/roles/${encodeURIComponent(roleName)}/multiPortals:remove?filterByTk=${encodeURIComponent(portalUid)}`,
    { headers: session.headers },
  );
  if (!response.ok() && response.status() !== 404) {
    await assertApiResponseOk(response, `Remove ${roleName} access from ${portalUid}`);
  }
}

async function deleteClientApp(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  entryId: string,
) {
  return page.request.post('/api/lightExtensionClientApps:delete', {
    headers: session.headers,
    data: { entryId },
  });
}

async function removeRepo(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  repoId: string,
) {
  for (const action of ['archive', 'delete'] as const) {
    const response = await page.request.post(`/api/lightExtensionRepos:${action}`, {
      headers: session.headers,
      data: { repoId },
    });
    if (!response.ok() && response.status() !== 404) {
      await assertApiResponseOk(response, `${action} client-app Light Extension repo`);
    }
  }
}

async function destroyUser(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  session: RootApiSession,
  userId: string | number,
) {
  const response = await page.request.post(`/api/users:destroy?filterByTk=${encodeURIComponent(String(userId))}`, {
    headers: session.headers,
  });
  if (!response.ok() && response.status() !== 404) {
    await assertApiResponseOk(response, 'Destroy client-app member user');
  }
}

async function waitForHostedDocument(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  portalUrl: string,
  expectedTitle: string,
  headers: Record<string, string>,
) {
  await expect
    .poll(
      async () => {
        const response = await page.request.get(portalUrl, { headers: { ...headers, Accept: 'text/html' } });
        return response.ok() ? await response.text() : '';
      },
      { timeout: 30_000 },
    )
    .toContain(expectedTitle);
}

function clientAppGatewayBaseUrl(appBaseUrl: string): string {
  if (process.env.CLIENT_APP_GATEWAY_BASE_URL) {
    return new URL(process.env.CLIENT_APP_GATEWAY_BASE_URL).origin;
  }
  return new URL(appBaseUrl).origin;
}

async function assertRuntimeMatrix(
  page: Parameters<typeof signInRootApiAndInstallBrowserSession>[0],
  borderColor: string,
) {
  await expect(page.locator('[data-result="assets"]')).toHaveAttribute('data-status', 'success');
  await expect(page.getByTestId('fixture-font')).toHaveAttribute('data-font-status', 'loaded');
  await expect(page.locator('[data-result="native-get"]')).toHaveAttribute('data-status', 'success');
  await expect(page.locator('[data-result="native-post"]')).toHaveAttribute('data-status', 'success');
  await expect(page.locator('[data-result="sdk-get"]')).toHaveAttribute('data-status', 'success');
  await expect(page.getByAltText('Client app fixture pixel')).toHaveJSProperty('naturalWidth', 1);
  await expect
    .poll(() => page.locator('#fixture-card').evaluate((element) => getComputedStyle(element).borderTopColor))
    .toBe(borderColor);
  const assetResult = JSON.parse((await page.locator('[data-result="assets"]').textContent()) || '{}') as Record<
    string,
    unknown
  >;
  expect(assetResult).toMatchObject({ fontLoaded: true, imageBytes: 68, wasmBytes: 8 });
}

function requireHeader(response: APIResponse, name: string): string {
  const value = response.headers()[name.toLowerCase()];
  if (!value) {
    throw new Error(`Response ${response.url()} is missing ${name}`);
  }
  return value;
}

async function readErrorCode(response: APIResponse): Promise<string | undefined> {
  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.errors) || !isRecord(body.errors[0])) {
    return;
  }
  return typeof body.errors[0].code === 'string' ? body.errors[0].code : undefined;
}

async function captureCleanup(errors: string[], cleanup: () => Promise<void>) {
  try {
    await cleanup();
  } catch (error) {
    errors.push(getErrorMessage(error));
  }
}

async function attachJson(testInfo: TestInfo, name: string, value: unknown) {
  const outputPath = testInfo.outputPath(name);
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`);
  await testInfo.attach(name, {
    path: outputPath,
    contentType: 'application/json',
  });
}
