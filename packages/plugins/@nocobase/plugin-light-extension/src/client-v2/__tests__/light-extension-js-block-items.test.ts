/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { createLightExtensionJSBlockAddItems } from '../add-block/lightExtensionJsBlockItems';

describe('createLightExtensionJSBlockAddItems', () => {
  it('creates JS block items from selectable entries using current runtime defaults', async () => {
    const request = vi.fn(async (options: { url: string }) =>
      options.url === 'lightExtensionRepos:list'
        ? {
            data: {
              data: [
                {
                  id: 'repo_sales',
                  name: 'sales',
                  normalizedName: 'sales',
                  title: 'Sales extensions',
                  version: 1,
                  lifecycleStatus: 'enabled',
                  healthStatus: 'ready',
                  headCommitId: 'commit_sales',
                },
              ],
            },
          }
        : {
            data: {
              data: [salesEntry(), actionEntry(), draftEntry()],
            },
          },
    );
    const items = await createLightExtensionJSBlockAddItems({
      api: { request },
      t: (key: string) => key,
    } as never);
    const group = items[0];
    const child = Array.isArray(group?.children) ? group.children[0] : null;
    const createModelOptions =
      typeof child?.createModelOptions === 'function' ? child.createModelOptions() : child?.createModelOptions;

    expect(request).toHaveBeenCalledWith({
      url: 'lightExtensionEntries:listSelectable',
      method: 'post',
      data: { kind: 'js-block' },
    });
    expect(request).toHaveBeenCalledWith({
      url: 'lightExtensionRepos:list',
      method: 'post',
    });
    expect(items).toHaveLength(1);
    expect(group).toMatchObject({
      key: 'select-scene-light-extension-js-blocks',
      type: 'group',
      label: 'From light extension',
    });
    expect(group?.children).toHaveLength(1);
    expect(child).toMatchObject({
      key: 'light-extension-js-block:entry_sales',
      label: 'Sales extensions',
      sort: 7,
    });
    expect(createModelOptions).toMatchObject({
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'repo_sales',
              repoTitle: 'Sales extensions',
              entryId: 'entry_sales',
              entryTitle: 'Sales KPI',
              entryName: 'sales',
              entryPath: 'src/client/js-blocks/sales/index.tsx',
              kind: 'js-block',
            },
            settings: {
              title: 'Sales',
            },
            version: 'v2',
          },
        },
      },
    });
  });

  it('keeps a repository group when multiple JS blocks belong to the same light extension', async () => {
    const request = vi.fn(async (options: { url: string }) =>
      options.url === 'lightExtensionRepos:list'
        ? {
            data: {
              data: [
                {
                  id: 'repo_sales',
                  name: 'sales',
                  normalizedName: 'sales',
                  title: 'Sales extensions',
                  version: 1,
                  lifecycleStatus: 'enabled',
                  healthStatus: 'ready',
                  headCommitId: 'commit_sales',
                },
              ],
            },
          }
        : {
            data: {
              data: [
                salesEntry(),
                {
                  ...salesEntry(),
                  id: 'entry_chart',
                  entryName: 'chart',
                  title: 'Sales chart',
                  sort: 8,
                  entryPath: 'src/client/js-blocks/chart/index.tsx',
                },
              ],
            },
          },
    );

    const items = await createLightExtensionJSBlockAddItems({
      api: { request },
      t: (key: string) => key,
    } as never);
    const lightExtensionGroup = items[0];
    const repoGroup = Array.isArray(lightExtensionGroup?.children) ? lightExtensionGroup.children[0] : null;

    expect(repoGroup).toMatchObject({
      key: 'light-extension-js-block-repo:repo_sales',
      type: 'group',
      label: 'Sales extensions',
      sort: 7,
    });
    expect(
      repoGroup?.children && Array.isArray(repoGroup.children) ? repoGroup.children.map((item) => item.label) : [],
    ).toEqual(['Sales KPI', 'Sales chart']);
  });
});

function salesEntry() {
  return {
    id: 'entry_sales',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-block',
    entryName: 'sales',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
    metaPath: null,
    settingsPath: null,
    title: 'Sales KPI',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: 7,
    settingsSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          default: 'Sales',
        },
      },
    },
    compiledCommitId: 'commit_sales',
    runtimeArtifact: {
      code: 'ctx.render("sales");',
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales/index.tsx',
    },
    runtimeVersion: 'v2',
    surfaceStyle: 'render',
    runtimeCodeHash: 'runtime_hash',
    filesHash: 'files_hash',
    settingsDefaultsHash: 'defaults_hash',
    compiledAt: '2026-07-09T00:00:00.000Z',
    healthStatus: 'ready',
    diagnostics: [],
  };
}

function actionEntry() {
  return {
    id: 'entry_action',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-action',
    entryName: 'action',
    entryPath: 'src/client/js-actions/action.ts',
    metaPath: null,
    settingsPath: null,
    title: 'Action',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: null,
    compiledCommitId: 'commit_action',
    runtimeArtifact: {
      code: 'return true;',
      version: 'v2',
      entryPath: 'src/client/js-actions/action.ts',
    },
    runtimeVersion: 'v2',
    surfaceStyle: 'action',
    runtimeCodeHash: 'runtime_hash_action',
    filesHash: 'files_hash_action',
    settingsDefaultsHash: 'defaults_hash_action',
    compiledAt: '2026-07-09T00:00:00.000Z',
    healthStatus: 'ready',
    diagnostics: [],
  };
}

function draftEntry() {
  return {
    id: 'entry_draft',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-block',
    entryName: 'draft',
    entryPath: 'src/client/js-blocks/draft.tsx',
    metaPath: null,
    settingsPath: null,
    title: 'Draft',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: null,
    compiledCommitId: null,
    runtimeArtifact: null,
    runtimeVersion: null,
    surfaceStyle: null,
    runtimeCodeHash: null,
    filesHash: null,
    settingsDefaultsHash: null,
    compiledAt: null,
    healthStatus: 'missing',
    diagnostics: [],
  };
}
