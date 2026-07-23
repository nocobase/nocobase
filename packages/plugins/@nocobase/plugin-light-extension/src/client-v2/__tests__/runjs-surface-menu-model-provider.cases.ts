/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, type FlowModelContext, type SubModelItem } from '@nocobase/flow-engine';
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

class JSBlockModel extends FlowModel {}
class JSRecordActionModel extends FlowModel {}
class JSColumnModel extends FlowModel {}
class FormItemModel extends FlowModel<{ subModels: { field?: JSEditableFieldModel } }> {}
class JSEditableFieldModel extends FlowModel {}

const entries: LightExtensionSelectableEntrySummary[] = [
  createEntry({ id: 'block', kind: 'js-block', repoId: 'repo-a', title: 'Dashboard block' }),
  createEntry({ id: 'action', kind: 'js-action', repoId: 'repo-a', title: 'Refresh action' }),
  createEntry({ id: 'field', kind: 'js-field', repoId: 'repo-a', title: 'Status field', category: null }),
  createEntry({ id: 'field-category', kind: 'js-field', repoId: 'repo-b', category: 'js-field' }),
  createEntry({ id: 'field-business-category', kind: 'js-field', repoId: 'repo-b', category: 'sales' }),
  createEntry({ id: 'column', kind: 'js-field', repoId: 'repo-b', title: 'Summary column', category: 'js-column' }),
];

describe('createLightExtensionModelMenuProvider', () => {
  it('persists the four direct-menu model shapes through FlowEngine serialization and reload', async () => {
    const api = createApi();
    const block = await findLeaf(await getRootItem(api, { target: 'block' }), 'block');
    const action = await findLeaf(
      await getRootItem(api, { target: 'action', modelUse: 'JSRecordActionModel' }),
      'action',
    );
    const column = await findLeaf(await getRootItem(api, { target: 'column' }), 'column');
    const fieldRoot = await getRootItem(api, {
      target: 'field',
      itemModelUse: 'FormItemModel',
      fieldModelUse: 'JSEditableFieldModel',
      refreshTargets: ['FormItemModel'],
    });
    const fieldEntry = await findEntryItem(fieldRoot, 'field');
    const field = (await resolveChildren(fieldEntry, createFieldContext())).find((item) => item.key === 'status');
    if (!field?.createModelOptions) {
      throw new Error('Bound field item was not found');
    }
    const fieldOptions =
      typeof field.createModelOptions === 'function'
        ? await field.createModelOptions(createFieldContext())
        : field.createModelOptions;
    const cases = [
      { label: 'block', options: block.createModelOptions, path: ['stepParams', 'jsSettings', 'runJs'] },
      { label: 'action', options: action.createModelOptions, path: ['stepParams', 'clickSettings', 'runJs'] },
      {
        label: 'field wrapper',
        options: fieldOptions,
        path: ['subModels', 'field', 'stepParams', 'jsSettings', 'runJs'],
      },
      { label: 'column', options: column.createModelOptions, path: ['stepParams', 'jsSettings', 'runJs'] },
    ];
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel, JSRecordActionModel, JSColumnModel, FormItemModel, JSEditableFieldModel });

    for (const item of cases) {
      if (!item.options) {
        throw new Error(`${item.label} model options were not created`);
      }
      const created = engine.createModel(item.options as never);
      const persisted = created.serialize();
      const reloaded = engine.createModel(persisted as never);
      const runJs = getAtPath(reloaded.serialize(), item.path);

      expect(runJs, item.label).toMatchObject({
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: expect.objectContaining({ type: 'light-extension-entry' }),
      });
      if (item.label === 'column') {
        expect(getAtPath(reloaded.serialize(), ['stepParams', 'tableColumnSettings', 'title'])).toEqual({
          title: 'Summary column',
        });
      }
    }
  });

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
        stepParams: { tableColumnSettings: { title: { title: 'Summary column' } } },
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
    const fallbackApi = createApi({ repos: [] });
    const root = await getRootItem(fallbackApi, { target: 'block' });
    expect((await resolveChildren(root))[0].label).toBe('repo-a');

    const failingApi: ApiClientLike = { request: vi.fn().mockRejectedValue(new Error('network')) };
    const failingRoot = await getRootItem(failingApi, { target: 'block' });
    await expect(resolveChildren(failingRoot)).resolves.toEqual([
      expect.objectContaining({ key: 'light-extension-load-error', disabled: true }),
    ]);
  });
});

function getAtPath(value: unknown, path: string[]): unknown {
  let current = value;
  for (const segment of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

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

function createApi(input: { repos?: Array<Record<string, unknown>> } = {}): ApiClientLike {
  const repos = input.repos ?? [
    { id: 'repo-a', name: 'repo-a', title: 'Repository A' },
    { id: 'repo-b', name: 'repo-b', title: 'Repository B' },
  ];
  return {
    request: vi.fn(async <TResponse>(options) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        const kind = (options.data as { kind?: string } | undefined)?.kind;
        return { data: { data: entries.filter((entry) => entry.kind === kind) } } as TResponse;
      }
      return { data: { data: repos } } as TResponse;
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
