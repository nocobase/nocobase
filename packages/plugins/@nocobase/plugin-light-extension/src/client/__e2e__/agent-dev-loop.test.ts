/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { expect, test } from '@nocobase/test/e2e';
import type { APIResponse, Page } from '@playwright/test';

interface ApiResult {
  response: APIResponse;
  data: unknown;
}

test('keeps JS Block and JS Page Agent Preview Problems snapshot-scoped before a CAS save', async ({ page }) => {
  const suffix = uid()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '')
    .slice(0, 10);
  const repoName = `agent-loop-${suffix}`;
  await page.goto('/admin');
  const headers = await getAuthHeaders(page);
  let repoId: string | undefined;

  try {
    const created = await postApi(page, headers, '/api/lightExtensionRepos:create', {
      name: repoName,
      title: `Agent loop ${suffix}`,
      message: 'Create Agent loop E2E source',
      initialFiles: createInitialFiles(),
    });
    expect(created.response.ok(), JSON.stringify(created.data)).toBe(true);
    repoId = requireString(requireRecord(created.data).id, 'repository id');
    const initialHead = requireNullableString(requireRecord(created.data).headCommitId, 'initial Head');

    const entriesResult = await postApi(page, headers, '/api/lightExtensionEntries:list', { repoId });
    expect(entriesResult.response.ok(), JSON.stringify(entriesResult.data)).toBe(true);
    const entries = requireArray(entriesResult.data, 'entries').map((entry) => requireRecord(entry));
    expect(entries.map((entry) => entry.kind).sort()).toEqual(['js-block', 'js-page']);

    const pullResult = await postApi(page, headers, '/api/lightExtensionFiles:pull', {
      repoId,
      includeContent: 'all',
    });
    expect(pullResult.response.ok(), JSON.stringify(pullResult.data)).toBe(true);
    const pulled = requireRecord(pullResult.data);
    const files = requireArray(pulled.files, 'pulled files').map((file) => requireRecord(file));

    for (const entry of entries) {
      const entryId = requireString(entry.id, 'entry id');
      const kind = requireString(entry.kind, 'entry kind');
      const entryPath = requireString(entry.entryPath, 'entry path');
      const checked = await postApi(page, headers, '/api/lightExtensions:compileWorkspacePreview', {
        repoId,
        expectedHeadCommitId: initialHead,
        entryId,
        kind,
        entryPath,
        runtimeVersion: 'v2',
        files,
      });
      expect(checked.response.ok(), JSON.stringify(checked.data)).toBe(true);
      const check = requireRecord(checked.data);
      expect(check.accepted).toBe(true);
      const snapshotId = requireString(check.snapshotId, 'check snapshot');
      const artifactHash = requireString(requireRecord(check.artifact).artifactHash, 'artifact hash');
      const ownerLocator =
        kind === 'js-page'
          ? { kind: 'flowModel.pageSettings', modelUid: `page_${suffix}`, use: 'JSPageModel' }
          : {
              kind: 'flowModel.step',
              modelUid: `block_${suffix}`,
              use: 'JSBlockModel',
              stepPath: ['stepParams', 'jsSettings'],
            };
      const opened = await postApi(page, headers, '/api/lightExtensionPreviewProblems:open', {
        repoId,
        entryId,
        ownerLocator,
        snapshotId,
        artifactHash,
      });
      expect(opened.response.ok(), JSON.stringify(opened.data)).toBe(true);
      const session = requireRecord(opened.data);
      const sessionIdentity = {
        sessionId: requireString(session.sessionId, 'session id'),
        repoId,
        entryId,
        ownerLocator,
        snapshotId,
        artifactHash,
        executionId: requireString(session.executionId, 'execution id'),
      };
      const appended = await postApi(page, headers, '/api/lightExtensionPreviewProblems:append', {
        ...sessionIdentity,
        problems: [
          {
            schemaVersion: 1,
            phase: 'runtime',
            source: 'host-runtime',
            severity: 'warning',
            code: `agent_loop_${kind}`,
            message: `${kind} preview completed`,
            snapshotId,
            requestId: sessionIdentity.executionId,
            fingerprint: `${kind}:${snapshotId}`,
            path: entryPath,
          },
        ],
      });
      expect(appended.response.ok(), JSON.stringify(appended.data)).toBe(true);
      const watched = await postApi(page, headers, '/api/lightExtensionPreviewProblems:watch', {
        ...sessionIdentity,
        cursor: 0,
      });
      expect(watched.response.ok(), JSON.stringify(watched.data)).toBe(true);
      const watchedSession = requireRecord(watched.data);
      const items = requireArray(watchedSession.items, 'Preview Problem items').map((item) => requireRecord(item));
      expect(items).toHaveLength(1);
      expect(requireRecord(items[0].problem)).toMatchObject({
        snapshotId,
        requestId: sessionIdentity.executionId,
        code: `agent_loop_${kind}`,
      });
      const closed = await postApi(page, headers, '/api/lightExtensionPreviewProblems:close', {
        ...sessionIdentity,
        state: 'completed',
      });
      expect(closed.response.ok(), JSON.stringify(closed.data)).toBe(true);
      expect(requireRecord(closed.data).state).toBe('completed');
    }

    const saved = await postApi(page, headers, '/api/lightExtensionFiles:saveSource', {
      repoId,
      expectedHeadCommitId: initialHead,
      message: 'Save reviewed Agent patch',
      files: [
        {
          path: 'src/client/js-blocks/agent-block/index.tsx',
          operation: 'upsert',
          content: 'ctx.render(<div>Reviewed Agent block patch</div>);\n',
          encoding: 'utf8',
          language: 'typescript',
          mode: '100644',
        },
      ],
    });
    expect(saved.response.ok(), JSON.stringify(saved.data)).toBe(true);
    const newHead = requireString(requireRecord(requireRecord(saved.data).commit).id, 'saved Head');
    expect(newHead).not.toBe(initialHead);

    const staleSave = await postApi(page, headers, '/api/lightExtensionFiles:saveSource', {
      repoId,
      expectedHeadCommitId: initialHead,
      message: 'Reject stale Agent patch',
      files: [
        {
          path: 'src/client/js-pages/agent-page/index.tsx',
          operation: 'upsert',
          content: 'ctx.render(<div>Stale patch</div>);\n',
          encoding: 'utf8',
          language: 'typescript',
          mode: '100644',
        },
      ],
    });
    expect(staleSave.response.status()).toBe(409);

    await page.goto(`/admin/settings/light-extension?repoId=${encodeURIComponent(repoId)}&panel=source`);
    await expect(page.getByText(`Agent loop ${suffix}`, { exact: true })).toBeVisible();
    await expect(page.getByText('agent-block', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('agent-page', { exact: false }).first()).toBeVisible();
  } finally {
    if (repoId) {
      await postApi(page, headers, '/api/lightExtensionRepos:delete', { repoId });
    }
  }
});

async function getAuthHeaders(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const values: Record<string, string> = { 'X-With-Acl-Meta': 'true' };
    const token = window.localStorage.getItem('NOCOBASE_TOKEN');
    const authenticator = window.localStorage.getItem('NOCOBASE_AUTH');
    const role = window.localStorage.getItem('NOCOBASE_ROLE');
    const locale = window.localStorage.getItem('NOCOBASE_LOCALE');
    if (token) values.Authorization = `Bearer ${token}`;
    if (authenticator) values['X-Authenticator'] = authenticator;
    if (role) values['X-Role'] = role;
    if (locale) values['X-Locale'] = locale;
    return values;
  });
}

async function postApi(
  page: Page,
  headers: Record<string, string>,
  path: string,
  data: Record<string, unknown>,
): Promise<ApiResult> {
  const response = await page.request.post(path, { headers, data });
  const body: unknown = await response.json();
  const record = requireRecord(body);
  return { response, data: record.data };
}

function createInitialFiles(): Array<Record<string, unknown>> {
  return [
    {
      path: 'src/client/js-blocks/agent-block/entry.json',
      content: '{"schemaVersion":1,"key":"agent-block"}\n',
      language: 'json',
    },
    {
      path: 'src/client/js-blocks/agent-block/index.tsx',
      content: 'ctx.render(<div>Agent block</div>);\n',
      language: 'typescript',
    },
    {
      path: 'src/client/js-pages/agent-page/entry.json',
      content: '{"schemaVersion":1,"key":"agent-page"}\n',
      language: 'json',
    },
    {
      path: 'src/client/js-pages/agent-page/index.tsx',
      content: 'ctx.render(<div>Agent page</div>);\n',
      language: 'typescript',
    },
  ];
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an object response');
  }
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${label}`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Expected ${label}`);
  }
  return value;
}

function requireNullableString(value: unknown, label: string): string | null {
  if (value === null) {
    return null;
  }
  return requireString(value, label);
}
