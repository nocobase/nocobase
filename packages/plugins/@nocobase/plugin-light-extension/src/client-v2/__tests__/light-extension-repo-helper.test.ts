/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { APIResponse, Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import type { RootApiSession } from '../__e2e__/helpers/api';
import {
  replaceLightExtensionAcceptanceEntrySource,
  type LightExtensionAcceptanceRepo,
} from '../__e2e__/helpers/lightExtensionRepo';

const session = {
  headers: { Authorization: 'Bearer test' },
} as RootApiSession;

const repo: LightExtensionAcceptanceRepo = {
  id: 'repo_1',
  name: 'acceptance-repo',
  title: 'Acceptance repo',
  headCommitId: 'commit_1',
  entries: {
    'js-block': createEntry('js-block', 'src/client/js-blocks/acceptance-js-block/index.tsx'),
    'js-page': createEntry('js-page', 'src/client/js-pages/acceptance-js-page/index.tsx'),
    'js-field': createEntry('js-field', 'src/client/js-fields/acceptance-js-field/index.tsx'),
    'js-action': createEntry('js-action', 'src/client/js-actions/acceptance-js-action/index.ts'),
    'js-item': createEntry('js-item', 'src/client/js-items/acceptance-js-item/index.tsx'),
  },
};

const pulledFiles = [
  file('README.md', '# Acceptance repo\n', 'markdown'),
  file(repo.entries['js-block'].entryPath, 'ctx.render(<div>Before</div>);\n'),
  file('src/client/js-blocks/acceptance-js-block/entry.json', '{"key":"acceptance-js-block"}\n', 'json'),
  file(repo.entries['js-page'].entryPath, 'ctx.render(<div>Page</div>);\n'),
  file('src/client/js-pages/acceptance-js-page/entry.json', '{"key":"acceptance-js-page"}\n', 'json'),
  file(repo.entries['js-field'].entryPath, 'ctx.render(<span>Field</span>);\n'),
  file('src/client/js-fields/acceptance-js-field/entry.json', '{"key":"acceptance-js-field"}\n', 'json'),
  file(
    repo.entries['js-action'].entryPath,
    'ctx.message.success(`${String(ctx.settings.outputLabel)}:${String(ctx.settings.mode)}`);\n',
  ),
  file('src/client/js-actions/acceptance-js-action/entry.json', '{"key":"acceptance-js-action"}\n', 'json'),
  file(repo.entries['js-item'].entryPath, 'ctx.render(<span>Item</span>);\n'),
  file('src/client/js-items/acceptance-js-item/entry.json', '{"key":"acceptance-js-item"}\n', 'json'),
];

describe('Light Extension acceptance repo helper', () => {
  it('pulls the current tree and replaces only the selected entry source', async () => {
    const post = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          repo: { id: repo.id, headCommitId: 'commit_current' },
          files: pulledFiles,
        }),
      )
      .mockResolvedValueOnce(response({ commit: { id: 'commit_next' } }));
    const page = { request: { post } } as unknown as Page;
    const nextHead = await replaceLightExtensionAcceptanceEntrySource(page, session, {
      repo,
      kind: 'js-block',
      source: 'ctx.render(<div>After refresh</div>);\n',
    });

    expect(nextHead).toBe('commit_next');
    expect(post.mock.calls[0]).toEqual([
      '/api/lightExtensionFiles:pull',
      {
        headers: session.headers,
        data: { repoId: repo.id, includeContent: 'all' },
      },
    ]);
    expect(post.mock.calls[1][0]).toBe('/api/lightExtensionFiles:saveSource');
    const saveData = post.mock.calls[1][1]?.data as Record<string, unknown>;
    expect(saveData.expectedHeadCommitId).toBe('commit_current');
    expect(saveData.files).toEqual(
      pulledFiles.map((pulledFile) => ({
        path: pulledFile.path,
        content:
          pulledFile.path === repo.entries['js-block'].entryPath
            ? 'ctx.render(<div>After refresh</div>);\n'
            : pulledFile.content,
        language: pulledFile.language,
        mode: pulledFile.mode,
      })),
    );
    expect(saveData.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: repo.entries['js-action'].entryPath,
          content: 'ctx.message.success(`${String(ctx.settings.outputLabel)}:${String(ctx.settings.mode)}`);\n',
        }),
        ...pulledFiles
          .filter((pulledFile) => pulledFile.path.endsWith('/entry.json'))
          .map((pulledFile) => expect.objectContaining({ path: pulledFile.path, content: pulledFile.content })),
      ]),
    );
  });

  it('does not save when the selected entry source is missing from the pulled tree', async () => {
    const post = vi.fn().mockResolvedValueOnce(
      response({
        repo: { id: repo.id, headCommitId: 'commit_current' },
        files: pulledFiles.filter((pulledFile) => pulledFile.path !== repo.entries['js-block'].entryPath),
      }),
    );
    const page = { request: { post } } as unknown as Page;

    await expect(
      replaceLightExtensionAcceptanceEntrySource(page, session, {
        repo,
        kind: 'js-block',
        source: 'ctx.render(<div>After refresh</div>);\n',
      }),
    ).rejects.toThrow(/Expected exactly one js-block acceptance entry source/u);
    expect(post).toHaveBeenCalledTimes(1);
  });
});

function createEntry(kind: keyof LightExtensionAcceptanceRepo['entries'], entryPath: string) {
  return {
    id: `entry_${kind}`,
    repoId: 'repo_1',
    kind,
    entryName: `acceptance-${kind}`,
    entryPath,
    title: `Acceptance ${kind}`,
  };
}

function file(path: string, content: string, language = 'typescript') {
  return {
    path,
    pathHash: `path:${path}`,
    pathLowerHash: `lower:${path}`,
    blobHash: `blob:${path}`,
    size: content.length,
    language,
    mode: '100644',
    content,
  };
}

function response(data: unknown, status = 200): APIResponse {
  return {
    ok: () => status >= 200 && status < 300,
    status: () => status,
    json: async () => ({ data }),
    text: async () => JSON.stringify({ data }),
  } as APIResponse;
}
