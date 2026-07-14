/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import type { Page } from '@playwright/test';

test.describe('light extension immutable runtime artifact', () => {
  test('serves content-addressed artifacts with immutable HTTP headers', async ({ page }) => {
    const headers = await signIn(page);
    const name = `immutable-artifact-${Date.now()}`;
    const createResponse = await page.request.post('/api/lightExtensionRepos:create', {
      headers,
      data: { name, title: name },
    });
    expect(createResponse.ok()).toBe(true);
    const createResult = unwrap<Record<string, unknown>>(await createResponse.json());
    const repo = (createResult.repo || createResult) as Record<string, unknown>;
    const repoId = String(repo.id);
    try {
      const entriesResponse = await page.request.post('/api/lightExtensionEntries:listSelectable', {
        headers,
        data: { kind: 'js-action', repoId },
      });
      const entries = unwrap<Array<Record<string, unknown>>>(await entriesResponse.json());
      const entry = entries.find((item) => item.kind === 'js-action');
      expect(entry).toBeTruthy();

      const resolveResponse = await page.request.post('/api/light-extension-runtime/resolve', {
        headers,
        data: {
          sourceMode: 'light-extension',
          sourceBinding: {
            type: 'light-extension-entry',
            repoId,
            entryId: String(entry?.id),
            kind: 'js-action',
          },
          settings: {},
        },
      });
      expect(resolveResponse.ok()).toBe(true);
      const resolved = unwrap<Record<string, unknown>>(await resolveResponse.json());
      expect(resolved).not.toHaveProperty('code');
      expect(resolved).not.toHaveProperty('sourceMap');

      const artifactUrl = String(resolved.artifactUrl);
      const artifactResponse = await page.request.get(artifactUrl, { headers });
      expect(artifactResponse.status()).toBe(200);
      expect(artifactResponse.headers().etag).toBe(`"${resolved.artifactHash}"`);
      expect(artifactResponse.headers()['cache-control']).toBe('private, max-age=31536000, immutable');
      const artifact = unwrap<Record<string, unknown>>(await artifactResponse.json());
      expect(artifact).toMatchObject({
        artifactHash: resolved.artifactHash,
        runtimeCodeHash: resolved.runtimeCodeHash,
        code: expect.any(String),
      });
    } finally {
      await page.request.post('/api/lightExtensionRepos:archive', { headers, data: { repoId } });
      await page.request.post('/api/lightExtensionRepos:delete', { headers, data: { repoId } });
    }
  });
});

async function signIn(page: Page): Promise<Record<string, string>> {
  const response = await page.request.post('/api/auth:signIn', {
    headers: { 'X-Authenticator': 'basic' },
    data: {
      account: process.env.INIT_ROOT_USERNAME || 'nocobase',
      password: process.env.INIT_ROOT_PASSWORD || 'admin123',
    },
  });
  expect(response.ok()).toBe(true);
  const result = unwrap<{ token: string }>(await response.json());
  return { Authorization: `Bearer ${result.token}` };
}

function unwrap<T>(body: unknown): T {
  const record = body as { data?: unknown };
  const first = record?.data;
  if (first && typeof first === 'object' && 'data' in first) {
    return (first as { data: T }).data;
  }
  return (typeof first === 'undefined' ? body : first) as T;
}
