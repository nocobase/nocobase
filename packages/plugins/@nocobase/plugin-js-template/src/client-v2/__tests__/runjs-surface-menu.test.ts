/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type JsTemplateSelectableTemplateSummary } from '../../shared/types';
import { type ApiClientLike, type ApiRequestOptions } from '../api/jsTemplatesRequests';
import {
  createJsTemplateModelMenuProvider,
  type JsTemplateModelMenuOptions,
} from '../modelMenu/createJsTemplateModelMenuProvider';
import { registerJsTemplateModelMenus } from '../modelMenu/registerJsTemplateModelMenus';
import { createJsTemplateRunJSResolver } from '../resolvers/JsTemplateRunJSResolver';
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

  const templates: JsTemplateSelectableTemplateSummary[] = [
    createTemplate({
      id: 'block',
      kind: 'js-block',
      projectId: 'project-a',
      projectName: 'project-a',
      projectTitle: 'Project A',
      title: 'Dashboard block',
    }),
    createTemplate({
      id: 'action',
      kind: 'js-action',
      projectId: 'project-a',
      projectName: 'project-a',
      projectTitle: 'Project A',
      title: 'Refresh action',
    }),
    createTemplate({
      id: 'field',
      kind: 'js-field',
      projectId: 'project-a',
      projectName: 'project-a',
      projectTitle: 'Project A',
      title: 'Status field',
    }),
    createTemplate({
      id: 'field-category',
      kind: 'js-field',
      projectId: 'project-b',
      projectName: 'project-b',
      projectTitle: 'Project B',
      category: 'js-field',
    }),
    createTemplate({
      id: 'field-business-category',
      kind: 'js-field',
      projectId: 'project-b',
      projectName: 'project-b',
      projectTitle: 'Project B',
      category: 'sales',
    }),
    createTemplate({
      id: 'column',
      kind: 'js-field',
      projectId: 'project-b',
      projectName: 'project-b',
      projectTitle: 'Project B',
      title: 'Summary column',
      category: 'js-column',
    }),
  ];

  describe('createJsTemplateModelMenuProvider', () => {
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
      const fieldTemplate = await findTemplateItem(fieldRoot, 'field');
      const field = (await resolveChildren(fieldTemplate, createFieldContext())).find((item) => item.key === 'status');
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
          sourceMode: 'js-template',
          sourceBinding: expect.objectContaining({ type: 'js-template-entry' }),
        });
        if (item.label === 'column') {
          expect(getAtPath(reloaded.serialize(), ['stepParams', 'tableColumnSettings', 'title'])).toEqual({
            title: 'column',
          });
        }
      }
    });

    it.each<{
      options: JsTemplateModelMenuOptions;
      templateId: string;
      expectedUse: string;
      flowKey: 'jsSettings' | 'clickSettings';
    }>([
      { options: { target: 'block' }, templateId: 'block', expectedUse: 'JSBlockModel', flowKey: 'jsSettings' },
      {
        options: { target: 'action', modelUse: 'JSRecordActionModel' },
        templateId: 'action',
        expectedUse: 'JSRecordActionModel',
        flowKey: 'clickSettings',
      },
      { options: { target: 'column' }, templateId: 'column', expectedUse: 'JSColumnModel', flowKey: 'jsSettings' },
    ])('builds the $options.target leaf model options', async ({ options, templateId, expectedUse, flowKey }) => {
      const api = createApi();
      const root = await getRootItem(api, options);

      expect(root.key).toBe('js-template');
      expect(root.label).toBe('JS Template');
      expect(root.useModel).toBe(options.target === 'action' ? expectedUse : undefined);
      const leaf = await findLeaf(root, templateId);
      const runJs = leaf.createModelOptions?.stepParams?.[flowKey]?.runJs;

      expect(leaf.label).toBe(templateId);
      expect(leaf.createModelOptions).toMatchObject({ use: expectedUse });
      expect(leaf.useModel).toBe(expectedUse);
      expect(runJs).toEqual({
        version: 'v2',
        sourceMode: 'js-template',
        sourceBinding: {
          type: 'js-template-entry',
          projectId: expect.stringMatching(/^project-/),
          templateId,
          kind: expect.stringMatching(/^js-/),
        },
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
    ])('binds the selected template to a real collection field wrapper', async (fieldOptions) => {
      const root = await getRootItem(createApi(), { target: 'field', ...fieldOptions });
      const templateItem = await findTemplateItem(root, 'field');
      const fieldItems = await resolveChildren(templateItem, createFieldContext());
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
                  sourceMode: 'js-template',
                  sourceBinding: expect.objectContaining({ templateId: 'field' }),
                },
              },
            },
          },
        },
      });
    });

    it('puts uncategorized js-field templates only in field menus and groups templates by project', async () => {
      const api = createApi();
      const fieldRoot = await getRootItem(api, { target: 'field' });
      const columnRoot = await getRootItem(api, { target: 'column' });
      const fieldProjects = await resolveChildren(fieldRoot);
      const columnProjects = await resolveChildren(columnRoot);

      expect(fieldProjects.map((item) => item.label)).toEqual(['Project A', 'Project B']);
      expect(await getLeafIds(fieldProjects)).toEqual(['field', 'field-category', 'field-business-category']);
      expect(await getLeafIds(columnProjects)).toEqual(['column']);
    });

    it('falls back to projectId and returns a disabled item when loading fails', async () => {
      const fallbackApi = createApi({ includeProjectLabels: false });
      const root = await getRootItem(fallbackApi, { target: 'block' });
      expect((await resolveChildren(root))[0].label).toBe('project-a');

      const failingApi: ApiClientLike = { request: vi.fn().mockRejectedValue(new Error('network')) };
      const failingRoot = await getRootItem(failingApi, { target: 'block' });
      await expect(resolveChildren(failingRoot)).resolves.toEqual([
        expect.objectContaining({ key: 'js-template-load-error', disabled: true }),
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

  async function getRootItem(api: ApiClientLike, options: JsTemplateModelMenuOptions): Promise<SubModelItem> {
    const provider = createJsTemplateModelMenuProvider(api, options);
    const items = Array.isArray(provider) ? provider : await provider(createContext());
    return items[0];
  }

  async function findLeaf(root: SubModelItem, templateId: string) {
    const leaf = await findTemplateItem(root, templateId);
    if (!leaf || !leaf.createModelOptions || typeof leaf.createModelOptions === 'function') {
      throw new Error(`Leaf ${templateId} was not found`);
    }
    return leaf as SubModelItem & { createModelOptions: StaticCreateModelOptions };
  }

  async function findTemplateItem(root: SubModelItem, templateId: string): Promise<SubModelItem> {
    const projectItems = await resolveChildren(root);
    const templateItems = (await Promise.all(projectItems.map((item) => resolveChildren(item)))).flat();
    const template = templateItems.find((item) => item.key === `js-template-template:${templateId}`);
    if (!template) {
      throw new Error(`Template ${templateId} was not found`);
    }
    return template;
  }

  async function getLeafIds(projectItems: SubModelItem[]): Promise<string[]> {
    return (await Promise.all(projectItems.map(resolveChildren)))
      .flat()
      .map((item) => String(item.key).replace('js-template-template:', ''));
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

  function createApi(input: { includeProjectLabels?: boolean } = {}): ApiClientLike {
    const catalog =
      input.includeProjectLabels === false
        ? templates.map(({ projectName: _projectName, projectTitle: _projectTitle, ...template }) => template)
        : templates;
    return {
      request: vi.fn(async <TResponse>(options) => {
        if (options.url !== 'jsTemplates:listSelectable') {
          throw new Error(`Unexpected request: ${options.url}`);
        }
        return { data: { data: catalog } } as TResponse;
      }),
    };
  }

  function createTemplate(
    input: Partial<JsTemplateSelectableTemplateSummary> &
      Pick<JsTemplateSelectableTemplateSummary, 'id' | 'kind' | 'projectId'>,
  ): JsTemplateSelectableTemplateSummary {
    return {
      templateName: input.id,
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

  describe('registerJsTemplateModelMenus', () => {
    beforeEach(clearProviders);
    afterEach(clearProviders);

    it('contributes JS Template submenus to block, action, field, and column menus', async () => {
      const dispose = registerJsTemplateModelMenus(createApi());
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

      expect(getOtherBlockChildren(blockItems)).toContainEqual(expect.objectContaining({ key: 'js-template' }));
      expect(actionItems).toContainEqual(expect.objectContaining({ key: 'js-template' }));
      expect(fieldItems).toContainEqual(expect.objectContaining({ key: 'js-template' }));
      expect(fieldItems.map((item) => item.key)).toEqual([
        'display-fields',
        'js-field',
        'js-template',
        'association-fields',
      ]);
      expect(columnItems).toContainEqual(expect.objectContaining({ key: 'js-template' }));
      expect(detailsItems).toContainEqual(expect.objectContaining({ key: 'js-template' }));
      expect(filterFormItems).not.toContainEqual(expect.objectContaining({ key: 'js-template' }));

      dispose();
      expect(getOtherBlockChildren(await resolveBlockItems())).not.toContainEqual(
        expect.objectContaining({ key: 'js-template' }),
      );
      expect(await TestActionGroupModel.defineChildren(createContext())).not.toContainEqual(
        expect.objectContaining({ key: 'js-template' }),
      );
      expect(
        await resolveFieldMenuItems({ surface: 'form-field', model: {} as never, ctx: createContext() }),
      ).not.toContainEqual(expect.objectContaining({ key: 'js-template' }));
    });

    it('keeps providers active until every client lane releases its registration', async () => {
      const firstApi = createApi();
      const secondApi = createApi();
      const disposeFirst = registerJsTemplateModelMenus(firstApi);
      const disposeSecond = registerJsTemplateModelMenus(secondApi);

      expect(getOtherBlockChildren(await resolveBlockItems())).toContainEqual(
        expect.objectContaining({ key: 'js-template' }),
      );
      disposeSecond();
      expect(getOtherBlockChildren(await resolveBlockItems())).toContainEqual(
        expect.objectContaining({ key: 'js-template' }),
      );
      disposeFirst();
      expect(getOtherBlockChildren(await resolveBlockItems())).not.toContainEqual(
        expect.objectContaining({ key: 'js-template' }),
      );
    });

    it('does not remove a later provider registered under the same catalog key', async () => {
      const disposeJsTemplate = registerJsTemplateModelMenus(createApi());
      const disposeLater = registerRunJSSurfaceMenuItemProvider(
        '@nocobase/plugin-js-template/model-menus',
        ({ surface }) => ({
          key: `later-${surface}`,
        }),
      );

      disposeJsTemplate();

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
  const selectableTemplate = {
    id: 'template_order_total',
    projectId: 'project_orders',
    projectName: 'orders',
    projectTitle: 'Orders',
    kind: 'js-block',
    templateName: 'order-total',
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

  const chartSelectableTemplate = {
    ...selectableTemplate,
    id: 'template_order_chart',
    templateName: 'order-chart',
    entryPath: 'src/client/js-blocks/order-chart/index.tsx',
    title: 'Order chart block',
    settingsSchema: null,
    settingsSchemaHash: null,
    settingsDefaultsHash: null,
    runtimeCodeHash: 'runtime_hash_chart',
  };

  describe('JS Template source menu items', () => {
    it('groups single-template projects before writing the current runtime binding', async () => {
      const request = vi.fn(async () => {
        return {
          data: {
            data: [selectableTemplate],
          },
        };
      });
      const api = createMockApiClient(request);
      const resolver = createJsTemplateRunJSResolver(api);

      const items = await resolver.listSourceMenuItems?.({
        kind: 'js-block',
        sourceMode: 'inline',
        settings: {
          stale: true,
        },
        t: (key) => key,
      });
      const jsTemplateItem = items?.[0];
      const projectItem = items?.[1];
      const templateItem = projectItem?.children?.[0];

      expect(request).toHaveBeenCalledWith({
        url: 'jsTemplates:listSelectable',
        method: 'post',
      });
      expect(request).toHaveBeenCalledTimes(1);
      expect(jsTemplateItem?.label).toBe('JS Templates');
      expect(jsTemplateItem?.disabled).toBe(true);
      expect(jsTemplateItem?.children).toBeUndefined();
      expect(projectItem?.label).toBe('Orders');
      expect(projectItem?.children).toHaveLength(1);
      expect(templateItem?.label).toBe('Order total calculator');
      expect(templateItem?.searchText).toContain('Orders');
      expect(templateItem?.searchText).toContain('order-total');

      const selectedParams = await templateItem?.onSelect?.({
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
        sourceMode: 'js-template',
        sourceBinding: {
          type: 'js-template-entry',
          projectId: 'project_orders',
          templateId: 'template_order_total',
          kind: 'js-block',
        },
        settings: {},
        version: 'v2',
      });
      expect(selectedParams).not.toHaveProperty('settings.stale');
      await expect(
        resolver.getBindingTitle?.({
          sourceMode: 'js-template',
          sourceBinding: {
            type: 'js-template-entry',
            projectId: 'project_orders',
            templateId: 'template_order_total',
            kind: 'js-block',
          },
        }),
      ).resolves.toBe('Orders / Order total calculator');
      expect(request).toHaveBeenCalledTimes(1);
    });

    it('keeps a project submenu when a project has multiple templates', async () => {
      const request = vi.fn(async () => {
        return {
          data: {
            data: [selectableTemplate, chartSelectableTemplate],
          },
        };
      });
      const api = createMockApiClient(request);
      const resolver = createJsTemplateRunJSResolver(api);

      const items = await resolver.listSourceMenuItems?.({
        kind: 'js-block',
        sourceMode: 'inline',
        t: (key) => key,
      });
      const projectItem = items?.[1];

      expect(items?.[0]?.label).toBe('JS Templates');
      expect(projectItem?.label).toBe('Orders');
      expect(projectItem?.children?.map((item) => item.label)).toEqual(['Order total calculator', 'Order chart block']);
      expect(projectItem?.searchText).toContain('order-chart');
      expect(request).toHaveBeenCalledTimes(1);
    });

    it('uses only catalog labels for canonical persisted bindings', async () => {
      const request = vi.fn().mockResolvedValue({
        data: {
          data: [{ ...selectableTemplate, projectName: undefined, projectTitle: undefined }],
        },
      });
      const resolver = createJsTemplateRunJSResolver(createMockApiClient(request));

      await expect(
        resolver.getBindingTitle?.({
          sourceMode: 'js-template',
          sourceBinding: {
            type: 'js-template-entry',
            projectId: 'project_orders',
            templateId: 'template_order_total',
            kind: 'js-block',
          },
        }),
      ).resolves.toBe('project_orders / Order total calculator');
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
