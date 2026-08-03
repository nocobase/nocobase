/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type LightExtensionSelectableEntrySummary } from '../../shared/types';
import { type ApiClientLike, type ApiRequestOptions } from '../api/lightExtensionEntriesRequests';
import {
  createLightExtensionModelMenuProvider,
  type LightExtensionModelMenuOptions,
} from '../modelMenu/createLightExtensionModelMenuProvider';
import { registerLightExtensionModelMenus } from '../modelMenu/registerLightExtensionModelMenus';
import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';
import {
  ActionGroupModel,
  ActionModel,
  BlockGridModel,
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
  registerRunJSSurfaceMenuItemProvider,
  resolveFieldMenuItems,
} from '@nocobase/client-v2';
import { FlowEngine, FlowModel, type FlowModelContext, type SubModelItem } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Consolidated from runjs-surface-menu-model-provider.cases.ts.
function registerModelMenuProviderTests() {
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
            title: 'column',
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
      expect(root.label).toBe('JS Template');
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

  function createApi(input: { includeRepoLabels?: boolean } = {}): ApiClientLike {
    const catalog =
      input.includeRepoLabels === false
        ? entries.map(({ repoName: _repoName, repoTitle: _repoTitle, ...entry }) => entry)
        : entries;
    return {
      request: vi.fn(async <TResponse>(options) => {
        if (options.url !== 'jsTemplateEntries:listSelectable') {
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
}
registerModelMenuProviderTests();

// Consolidated from runjs-surface-menu-registration.cases.ts.
function registerModelMenuRegistrationTests() {
  class JSRecordActionModel extends ActionModel {}
  JSRecordActionModel.define({ label: 'JS action' });

  class TestActionGroupModel extends ActionGroupModel {}
  TestActionGroupModel.registerActionModels({ JSRecordActionModel });

  describe('registerLightExtensionModelMenus', () => {
    beforeEach(clearProviders);
    afterEach(clearProviders);

    it('contributes Light extension submenus to block, action, field, and column menus', async () => {
      const dispose = registerLightExtensionModelMenus(createApi());
      const blockItems = await resolveBlockItems();
      const actionItems = await TestActionGroupModel.defineChildren(createContext());
      const fieldItems = await resolveFieldMenuItems({
        surface: 'form-field',
        model: {} as never,
        ctx: createContext(),
        items: [
          { key: 'display-fields', sort: 100 },
          { key: 'js-field', sort: 110 },
          { key: 'association-fields', sort: 1000 },
        ],
      });
      const columnItems = await resolveFieldMenuItems({
        surface: 'table-column',
        model: {} as never,
        ctx: createContext(),
      });
      const detailsItems = await resolveFieldMenuItems({
        surface: 'details-field',
        model: {} as never,
        ctx: createContext(),
      });
      const filterFormItems = await resolveFieldMenuItems({
        surface: 'filter-form-field',
        model: {} as never,
        ctx: createContext(),
      });

      expect(getOtherBlockChildren(blockItems)).toContainEqual(expect.objectContaining({ key: 'light-extension' }));
      expect(actionItems).toContainEqual(expect.objectContaining({ key: 'light-extension' }));
      expect(fieldItems).toContainEqual(expect.objectContaining({ key: 'light-extension' }));
      expect(fieldItems.map((item) => item.key)).toEqual([
        'display-fields',
        'js-field',
        'light-extension',
        'association-fields',
      ]);
      expect(columnItems).toContainEqual(expect.objectContaining({ key: 'light-extension' }));
      expect(detailsItems).toContainEqual(expect.objectContaining({ key: 'light-extension' }));
      expect(filterFormItems).not.toContainEqual(expect.objectContaining({ key: 'light-extension' }));

      dispose();
      expect(getOtherBlockChildren(await resolveBlockItems())).not.toContainEqual(
        expect.objectContaining({ key: 'light-extension' }),
      );
      expect(await TestActionGroupModel.defineChildren(createContext())).not.toContainEqual(
        expect.objectContaining({ key: 'light-extension' }),
      );
      expect(
        await resolveFieldMenuItems({ surface: 'form-field', model: {} as never, ctx: createContext() }),
      ).not.toContainEqual(expect.objectContaining({ key: 'light-extension' }));
    });

    it('keeps providers active until every client lane releases its registration', async () => {
      const firstApi = createApi();
      const secondApi = createApi();
      const disposeFirst = registerLightExtensionModelMenus(firstApi);
      const disposeSecond = registerLightExtensionModelMenus(secondApi);

      expect(getOtherBlockChildren(await resolveBlockItems())).toContainEqual(
        expect.objectContaining({ key: 'light-extension' }),
      );
      disposeSecond();
      expect(getOtherBlockChildren(await resolveBlockItems())).toContainEqual(
        expect.objectContaining({ key: 'light-extension' }),
      );
      disposeFirst();
      expect(getOtherBlockChildren(await resolveBlockItems())).not.toContainEqual(
        expect.objectContaining({ key: 'light-extension' }),
      );
    });

    it('does not remove a later provider registered under the same catalog key', async () => {
      const disposeLightExtension = registerLightExtensionModelMenus(createApi());
      const disposeLater = registerRunJSSurfaceMenuItemProvider(
        '@nocobase/plugin-light-extension/model-menus',
        ({ surface }) => ({
          key: `later-${surface}`,
        }),
      );

      disposeLightExtension();

      expect(getOtherBlockChildren(await resolveBlockItems())).toContainEqual(
        expect.objectContaining({ key: 'later-block' }),
      );
      expect(await TestActionGroupModel.defineChildren(createContext())).toContainEqual(
        expect.objectContaining({ key: 'later-action' }),
      );
      expect(
        await resolveFieldMenuItems({ surface: 'form-field', model: {} as never, ctx: createContext() }),
      ).toContainEqual(expect.objectContaining({ key: 'later-form-field' }));

      disposeLater();
    });
  });

  async function resolveBlockItems(): Promise<SubModelItem[]> {
    const engine = new FlowEngine();
    engine.registerModels({ BlockGridModel });
    engine.context.defineProperty('view', { value: { inputArgs: {} } });
    const model = engine.createModel<BlockGridModel>({ use: 'BlockGridModel' });
    const source = model.addBlockItems;
    return typeof source === 'function' ? source(model.context) : source || [];
  }

  function getOtherBlockChildren(items: SubModelItem[]): SubModelItem[] {
    const otherBlocks = items.find((item) => item.key === 'BlockModel');
    return Array.isArray(otherBlocks?.children) ? otherBlocks.children : [];
  }

  function createContext(): FlowModelContext {
    const engine = new FlowEngine();
    engine.registerModels({ ActionModel, JSRecordActionModel, TestActionGroupModel });
    return {
      engine,
      t: (key: string) => key,
    } as FlowModelContext;
  }

  function createApi(): ApiClientLike {
    return {
      request: vi.fn(),
    };
  }

  function clearProviders() {
    clearBlockGridSelectSceneAddBlockProviders();
    clearActionGroupMenuItemProviders();
    clearFieldMenuItemProviders();
  }
}
registerModelMenuRegistrationTests();

// Consolidated from runjs-surface-menu-source-items.cases.ts.
function registerSourceMenuItemTests() {
  const selectableEntry = {
    id: 'entry_order_total',
    repoId: 'repo_orders',
    repoName: 'orders',
    repoTitle: 'Orders',
    kind: 'js-block',
    entryName: 'order-total',
    entryPath: 'src/client/js-blocks/order-total/index.tsx',
    title: 'Order total calculator',
    category: null,
    settingsSchema: {
      type: 'object',
      properties: {
        currency: {
          type: 'string',
          default: 'USD',
        },
      },
    },
    settingsSchemaHash: 'schema_hash',
    runtimeCodeHash: 'runtime_hash',
    settingsDefaultsHash: 'defaults_hash',
    runtimeAvailable: true,
  };

  const chartSelectableEntry = {
    ...selectableEntry,
    id: 'entry_order_chart',
    entryName: 'order-chart',
    entryPath: 'src/client/js-blocks/order-chart/index.tsx',
    title: 'Order chart block',
    settingsSchema: null,
    settingsSchemaHash: null,
    settingsDefaultsHash: null,
    runtimeCodeHash: 'runtime_hash_chart',
  };

  describe('light extension source menu items', () => {
    it('groups single-entry repositories before writing the current runtime binding', async () => {
      const request = vi.fn(async () => {
        return {
          data: {
            data: [selectableEntry],
          },
        };
      });
      const api = createMockApiClient(request);
      const resolver = createLightExtensionRunJSResolver(api);

      const items = await resolver.listSourceMenuItems?.({
        kind: 'js-block',
        sourceMode: 'inline',
        settings: {
          stale: true,
        },
        t: (key) => key,
      });
      const lightExtensionItem = items?.[0];
      const repoItem = items?.[1];
      const entryItem = repoItem?.children?.[0];

      expect(request).toHaveBeenCalledWith({
        url: 'lightExtensionEntries:listSelectable',
        method: 'post',
      });
      expect(request).toHaveBeenCalledTimes(1);
      expect(lightExtensionItem?.label).toBe('JS Templates');
      expect(lightExtensionItem?.disabled).toBe(true);
      expect(lightExtensionItem?.children).toBeUndefined();
      expect(repoItem?.label).toBe('Orders');
      expect(repoItem?.children).toHaveLength(1);
      expect(entryItem?.label).toBe('order-total');
      expect(entryItem?.searchText).toContain('Orders');
      expect(entryItem?.searchText).toContain('order-total');

      const selectedParams = await entryItem?.onSelect?.({
        kind: 'js-block',
        sourceMode: 'inline',
        params: {
          settings: {
            stale: true,
            currency: 'EUR',
          },
        },
        defaultParams: {
          version: 'v2',
        },
      });

      expect(selectedParams).toMatchObject({
        sourceMode: 'light-extension',
        sourceBinding: {
          repoId: 'repo_orders',
          repoName: 'orders',
          repoTitle: 'Orders',
          entryId: 'entry_order_total',
          entryTitle: 'order-total',
          entryName: 'order-total',
          entryPath: 'src/client/js-blocks/order-total/index.tsx',
          kind: 'js-block',
        },
        settings: {},
        version: 'v2',
      });
      expect(selectedParams).not.toHaveProperty('settings.stale');
      await expect(
        resolver.getBindingTitle?.({
          sourceMode: 'light-extension',
          sourceBinding: {
            type: 'light-extension-entry',
            repoId: 'repo_orders',
            entryId: 'entry_order_total',
            kind: 'js-block',
          },
        }),
      ).resolves.toBe('Orders / order-total');
      expect(request).toHaveBeenCalledTimes(1);
    });

    it('keeps a repository submenu when a repository has multiple entries', async () => {
      const request = vi.fn(async () => {
        return {
          data: {
            data: [selectableEntry, chartSelectableEntry],
          },
        };
      });
      const api = createMockApiClient(request);
      const resolver = createLightExtensionRunJSResolver(api);

      const items = await resolver.listSourceMenuItems?.({
        kind: 'js-block',
        sourceMode: 'inline',
        t: (key) => key,
      });
      const repoItem = items?.[1];

      expect(items?.[0]?.label).toBe('JS Templates');
      expect(repoItem?.label).toBe('Orders');
      expect(repoItem?.children?.map((item) => item.label)).toEqual(['order-total', 'order-chart']);
      expect(repoItem?.searchText).toContain('order-chart');
      expect(request).toHaveBeenCalledTimes(1);
    });

    it('ignores persisted repository title hints unless the catalog authorizes them', async () => {
      const request = vi.fn().mockResolvedValue({
        data: {
          data: [{ ...selectableEntry, repoName: undefined, repoTitle: undefined }],
        },
      });
      const resolver = createLightExtensionRunJSResolver(createMockApiClient(request));

      await expect(
        resolver.getBindingTitle?.({
          sourceMode: 'light-extension',
          sourceBinding: {
            type: 'light-extension-entry',
            repoId: 'repo_orders',
            repoTitle: 'Secret title',
            entryId: 'entry_order_total',
            entryName: 'order-total',
            kind: 'js-block',
          },
        }),
      ).resolves.toBe('repo_orders / order-total');
    });
  });

  function createMockApiClient(request: (options: ApiRequestOptions) => Promise<unknown>): ApiClientLike {
    return {
      request: async <TResponse>(options: ApiRequestOptions): Promise<TResponse> => {
        return (await request(options)) as TResponse;
      },
    };
  }
}
registerSourceMenuItemTests();
