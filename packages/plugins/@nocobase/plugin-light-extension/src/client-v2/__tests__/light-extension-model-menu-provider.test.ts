/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelContext, SubModelItem } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';

import type { LightExtensionSelectableEntrySummary } from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import {
  createLightExtensionModelMenuProvider,
  type LightExtensionModelMenuOptions,
} from '../modelMenu/createLightExtensionModelMenuProvider';

type StaticCreateModelOptions = {
  use?: string;
  stepParams?: Record<string, { runJs?: unknown }> & {
    tableColumnSettings?: { title?: { title?: string } };
  };
  subModels?: {
    field?: {
      use?: string;
      stepParams?: { jsSettings?: { runJs?: unknown } };
    };
  };
};

const entries: LightExtensionSelectableEntrySummary[] = [
  createEntry({
    id: 'block',
    kind: 'js-block',
    repoId: 'repo-a',
    repoName: 'repo-a',
    repoTitle: 'Repository A',
    title: 'Dashboard block',
  }),
  createEntry({
    id: 'action',
    kind: 'js-action',
    repoId: 'repo-a',
    repoName: 'repo-a',
    repoTitle: 'Repository A',
    title: 'Refresh action',
  }),
  createEntry({
    id: 'field',
    kind: 'js-field',
    repoId: 'repo-a',
    repoName: 'repo-a',
    repoTitle: 'Repository A',
    title: 'Status field',
  }),
  createEntry({
    id: 'field-category',
    kind: 'js-field',
    repoId: 'repo-b',
    repoName: 'repo-b',
    repoTitle: 'Repository B',
    category: 'js-field',
  }),
  createEntry({
    id: 'field-business-category',
    kind: 'js-field',
    repoId: 'repo-b',
    repoName: 'repo-b',
    repoTitle: 'Repository B',
    category: 'sales',
  }),
  createEntry({
    id: 'column',
    kind: 'js-field',
    repoId: 'repo-b',
    repoName: 'repo-b',
    repoTitle: 'Repository B',
    title: 'Summary column',
    category: 'js-column',
  }),
];

describe('createLightExtensionModelMenuProvider', () => {
  it.each<{
    options: LightExtensionModelMenuOptions;
    entryId: string;
    expectedUse: string;
    flowKey: 'jsSettings' | 'clickSettings';
  }>([
    { options: { target: 'block' }, entryId: 'block', expectedUse: 'JSBlockModel', flowKey: 'jsSettings' },
    {
      options: { target: 'action', modelUse: 'JSRecordActionModel' },
      entryId: 'action',
      expectedUse: 'JSRecordActionModel',
      flowKey: 'clickSettings',
    },
    { options: { target: 'column' }, entryId: 'column', expectedUse: 'JSColumnModel', flowKey: 'jsSettings' },
  ])('builds the $options.target leaf model options', async ({ options, entryId, expectedUse, flowKey }) => {
    const api = createApi();
    const root = await getRootItem(api, options);

    expect(root.key).toBe('light-extension');
    expect(root.label).toBe('Light extension');
    expect(root.useModel).toBe(options.target === 'action' ? expectedUse : undefined);
    const leaf = await findLeaf(root, entryId);
    const runJs = leaf.createModelOptions?.stepParams?.[flowKey]?.runJs;

    expect(leaf.label).toBe(entryId);
    expect(leaf.createModelOptions).toMatchObject({ use: expectedUse });
    expect(leaf.useModel).toBe(expectedUse);
    expect(runJs).toEqual({
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: expect.objectContaining({
        type: 'light-extension-entry',
        repoId: expect.stringMatching(/^repo-/),
        repoTitle: expect.stringMatching(/^Repository /),
        entryId,
        kind: expect.stringMatching(/^js-/),
      }),
      settings: {
        color: '#1677ff',
        nested: { enabled: true },
      },
    });
    if (options.target === 'column') {
      expect(leaf.createModelOptions).toMatchObject({
        stepParams: { tableColumnSettings: { title: { title: 'column' } } },
      });
    }
  });

  it.each([
    {
      itemModelUse: 'FormItemModel',
      fieldModelUse: 'JSEditableFieldModel',
      refreshTargets: ['FormItemModel'],
    },
    {
      itemModelUse: 'DetailsItemModel',
      fieldModelUse: 'JSFieldModel',
      refreshTargets: ['DetailsItemModel'],
    },
  ])('binds the selected entry to a real collection field wrapper', async (fieldOptions) => {
    const root = await getRootItem(createApi(), { target: 'field', ...fieldOptions });
    const entryItem = await findEntryItem(root, 'field');
    const fieldItems = await resolveChildren(entryItem, createFieldContext());
    const fieldItem = fieldItems.find((item) => item.key === 'status');
    if (!fieldItem?.createModelOptions) {
      throw new Error('Bound field item was not found');
    }
    const createModelOptions =
      typeof fieldItem.createModelOptions === 'function'
        ? await fieldItem.createModelOptions(createFieldContext())
        : fieldItem.createModelOptions;

    expect(createModelOptions).toMatchObject({
      use: fieldOptions.itemModelUse,
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'status',
          },
        },
      },
      subModels: {
        field: {
          use: fieldOptions.fieldModelUse,
          stepParams: {
            jsSettings: {
              runJs: {
                sourceMode: 'light-extension',
                sourceBinding: expect.objectContaining({ entryId: 'field' }),
              },
            },
          },
        },
      },
    });
  });

  it('puts uncategorized js-field entries only in field menus and groups entries by repository', async () => {
    const api = createApi();
    const fieldRoot = await getRootItem(api, { target: 'field' });
    const columnRoot = await getRootItem(api, { target: 'column' });
    const fieldRepos = await resolveChildren(fieldRoot);
    const columnRepos = await resolveChildren(columnRoot);

    expect(fieldRepos.map((item) => item.label)).toEqual(['Repository A', 'Repository B']);
    expect(await getLeafIds(fieldRepos)).toEqual(['field', 'field-category', 'field-business-category']);
    expect(await getLeafIds(columnRepos)).toEqual(['column']);
  });

  it('falls back to repoId and returns a disabled item when loading fails', async () => {
    const fallbackApi = createApi({ includeRepoLabels: false });
    const root = await getRootItem(fallbackApi, { target: 'block' });
    expect((await resolveChildren(root))[0].label).toBe('repo-a');

    const failingApi: ApiClientLike = { request: vi.fn().mockRejectedValue(new Error('network')) };
    const failingRoot = await getRootItem(failingApi, { target: 'block' });
    await expect(resolveChildren(failingRoot)).resolves.toEqual([
      expect.objectContaining({ key: 'light-extension-load-error', disabled: true }),
    ]);
  });
});

async function getRootItem(api: ApiClientLike, options: LightExtensionModelMenuOptions): Promise<SubModelItem> {
  const provider = createLightExtensionModelMenuProvider(api, options);
  const items = Array.isArray(provider) ? provider : await provider(createContext());
  return items[0];
}

async function findLeaf(root: SubModelItem, entryId: string) {
  const leaf = await findEntryItem(root, entryId);
  if (!leaf || !leaf.createModelOptions || typeof leaf.createModelOptions === 'function') {
    throw new Error(`Leaf ${entryId} was not found`);
  }
  return leaf as SubModelItem & { createModelOptions: StaticCreateModelOptions };
}

async function findEntryItem(root: SubModelItem, entryId: string): Promise<SubModelItem> {
  const repoItems = await resolveChildren(root);
  const entries = (await Promise.all(repoItems.map((item) => resolveChildren(item)))).flat();
  const entry = entries.find((item) => item.key === `light-extension-entry:${entryId}`);
  if (!entry) {
    throw new Error(`Entry ${entryId} was not found`);
  }
  return entry;
}

async function getLeafIds(repoItems: SubModelItem[]): Promise<string[]> {
  return (await Promise.all(repoItems.map(resolveChildren)))
    .flat()
    .map((item) => String(item.key).replace('light-extension-entry:', ''));
}

async function resolveChildren(item: SubModelItem, ctx = createContext()): Promise<SubModelItem[]> {
  if (!item.children) {
    return [];
  }
  return Array.isArray(item.children) ? item.children : await item.children(ctx);
}

function createContext(): FlowModelContext {
  return {
    t: (key: string) => key,
  } as FlowModelContext;
}

function createFieldContext(): FlowModelContext {
  return {
    ...createContext(),
    model: {},
    collection: {
      name: 'users',
      dataSourceKey: 'main',
      getFields: () => [
        {
          name: 'status',
          title: 'Status',
          options: { interface: 'input' },
        },
      ],
    },
  } as unknown as FlowModelContext;
}

function createApi(input: { includeRepoLabels?: boolean } = {}): ApiClientLike {
  const catalog =
    input.includeRepoLabels === false
      ? entries.map(({ repoName: _repoName, repoTitle: _repoTitle, ...entry }) => entry)
      : entries;
  return {
    request: vi.fn(async <TResponse>(options) => {
      if (options.url !== 'lightExtensionEntries:listSelectable') {
        throw new Error(`Unexpected request: ${options.url}`);
      }
      return { data: { data: catalog } } as TResponse;
    }),
  };
}

function createEntry(
  input: Partial<LightExtensionSelectableEntrySummary> &
    Pick<LightExtensionSelectableEntrySummary, 'id' | 'kind' | 'repoId'>,
): LightExtensionSelectableEntrySummary {
  return {
    entryName: input.id,
    entryPath: `src/client/${input.id}/index.tsx`,
    title: null,
    category: null,
    settingsSchema: {
      type: 'object',
      properties: {
        color: { type: 'string', default: '#1677ff' },
        nested: { type: 'object', properties: { enabled: { type: 'boolean', default: true } } },
      },
    },
    settingsSchemaHash: 'schema-hash',
    settingsDefaultsHash: 'defaults-hash',
    runtimeCodeHash: 'runtime-hash',
    runtimeAvailable: true,
    ...input,
  };
}
