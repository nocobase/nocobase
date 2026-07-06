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

const publication = {
  id: 'pub_sales',
  repoId: 'repo_sales',
  entryId: 'entry_sales',
  commitId: 'commit_sales',
  entryPath: 'src/client/js-blocks/sales/index.tsx',
  target: 'client',
  kind: 'js-block',
  surfaceStyle: 'render',
  runtimeVersion: 'v2',
  artifact: {
    version: 'v2',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
  },
  settingsSchemaSnapshot: null,
  settingsDefaultsSnapshot: {
    title: 'Sales',
  },
  settingsSchemaHash: 'schema_hash',
  settingsDefaultsHash: 'defaults_hash',
  filesHash: 'files_hash',
  runtimeCodeHash: 'runtime_hash',
  diagnostics: [],
};

describe('createLightExtensionJSBlockAddItems', () => {
  it('creates pinned JS block items from selectable entries using active publication snapshots', async () => {
    const request = vi.fn(async () => ({
      data: {
        data: [
          {
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
            activePublicationId: 'pub_sales',
            activePublication: publication,
            healthStatus: 'ready',
            diagnostics: [],
          },
          {
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
            activePublicationId: 'pub_action',
            activePublication: { ...publication, id: 'pub_action', entryId: 'entry_action', kind: 'js-action' },
            healthStatus: 'ready',
            diagnostics: [],
          },
          {
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
            activePublicationId: null,
            activePublication: null,
            healthStatus: 'draft',
            diagnostics: [],
          },
        ],
      },
    }));
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
      data: undefined,
    });
    expect(items).toHaveLength(1);
    expect(group).toMatchObject({
      key: 'select-scene-light-extension-js-blocks',
      type: 'group',
      label: 'From light extension',
    });
    expect(group?.children).toHaveLength(1);
    expect(child).toMatchObject({
      key: 'light-extension-js-block:entry_sales:pub_sales',
      label: 'Sales KPI',
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
              entryId: 'entry_sales',
              kind: 'js-block',
              publicationId: 'pub_sales',
              versionPolicy: 'pinned',
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
});
