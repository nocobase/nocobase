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

test.describe('light extension runtime payload boundaries', () => {
  test('selectable entries and Resolve do not embed runtime code', async ({ page }) => {
    const headers = await signIn(page);
    const repo = await createAcceptanceRepo(page, headers, `runtime-cache-${Date.now()}`);
    try {
      const entriesResponse = await page.request.post('/api/lightExtensionEntries:listSelectable', {
        headers,
        data: { kind: 'js-action', repoId: repo.id },
      });
      expect(entriesResponse.ok()).toBe(true);
      const entries = unwrap<Array<Record<string, unknown>>>(await entriesResponse.json());
      const entry = entries.find((item) => item.kind === 'js-action');
      expect(entry).toBeTruthy();
      expect(entry).toMatchObject({ runtimeAvailable: true });
      expect(entry).not.toHaveProperty('runtimeArtifact');
      expect(entry).not.toHaveProperty('code');
      expect(entry).not.toHaveProperty('sourceMap');

      const resolveBody = await resolveEntry(page, headers, repo, entry as Record<string, unknown>, {});
      expect(resolveBody.artifactHash).toMatch(/^[a-f0-9]{64}$/u);
      expect(resolveBody.settings).toEqual({});
      expect(resolveBody).not.toHaveProperty('code');
      expect(resolveBody).not.toHaveProperty('sourceMap');
    } finally {
      await removeAcceptanceRepo(page, headers, repo.id);
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

async function createAcceptanceRepo(
  page: Page,
  headers: Record<string, string>,
  name: string,
): Promise<{ id: string; title: string }> {
  const response = await page.request.post('/api/lightExtensionRepos:create', {
    headers,
    data: { name, title: name },
  });
  expect(response.ok()).toBe(true);
  const result = unwrap<Record<string, unknown>>(await response.json());
  const repo = (result.repo || result) as Record<string, unknown>;
  return { id: String(repo.id), title: String(repo.title || name) };
}

async function resolveEntry(
  page: Page,
  headers: Record<string, string>,
  repo: { id: string; title: string },
  entry: Record<string, unknown>,
  settings: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await page.request.post('/api/light-extension-runtime/resolve', {
    headers,
    data: {
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: repo.id,
        repoTitle: repo.title,
        entryId: String(entry.id),
        entryName: String(entry.entryName),
        entryPath: String(entry.entryPath),
        kind: String(entry.kind),
      },
      settings,
    },
  });
  expect(response.ok()).toBe(true);
  return unwrap<Record<string, unknown>>(await response.json());
}

async function removeAcceptanceRepo(page: Page, headers: Record<string, string>, repoId: string): Promise<void> {
  await page.request.post('/api/lightExtensionRepos:archive', { headers, data: { repoId } });
  await page.request.post('/api/lightExtensionRepos:delete', { headers, data: { repoId } });
}

function unwrap<T>(body: unknown): T {
  const record = body as { data?: unknown };
  const first = record?.data;
  if (first && typeof first === 'object' && 'data' in first) {
    return (first as { data: T }).data;
  }
  return (typeof first === 'undefined' ? body : first) as T;
}
