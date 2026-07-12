/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { act, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExportActionModel } from '../ExportActionModel';
import { PluginActionExportClient } from '../index';

const fileSaverMocks = vi.hoisted(() => ({
  saveAs: vi.fn(),
}));
const antdMocks = vi.hoisted(() => ({
  cascaderProps: [] as CascaderProps[],
}));

vi.mock('file-saver', () => ({
  saveAs: fileSaverMocks.saveAs,
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    Cascader: (props: CascaderProps) => {
      antdMocks.cascaderProps.push(props);
      return ReactModule.createElement('button', { type: 'button', 'data-testid': 'export-fields-cascader' });
    },
  };
});

type ExportSetting = {
  dataIndex: string[];
  enum?: { value: unknown; label: string }[];
  defaultTitle?: string;
};

type CascaderOption = {
  name: string;
  title?: string;
  isLeaf?: boolean;
  loading?: boolean;
  children?: CascaderOption[];
};

type CascaderProps = {
  value?: unknown[];
  fieldNames?: Record<string, string>;
  options?: CascaderOption[];
  loadData?: (selectedOptions: CascaderOption[]) => void;
  onChange?: (value: unknown[]) => void;
  onDropdownVisibleChange?: (open: boolean) => void;
  displayRender?: (labels: string[], selectedOptions?: CascaderOption[]) => string;
};

type ExportHandlerContext = {
  model: {
    context: {
      blockModel: ReturnType<typeof createBlock>;
    };
    getProps: () => { exportSettings: ExportSetting[] };
  };
  blockModel: ReturnType<typeof createBlock>;
  t: (key?: string) => string;
};

function createField(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    interface: 'input',
    options: {
      interface: 'input',
    },
    uiSchema: {
      title: name,
    },
    isAssociationField: () => false,
    ...overrides,
  };
}

function createBlock(
  options: {
    selectedRows?: { id: number }[];
    filterTargetKey?: string | string[];
    runAction?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const fields = new Map<string, ReturnType<typeof createField>>([
    [
      'status',
      createField('status', {
        uiSchema: {
          title: 'Status',
          enum: [
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
          ],
        },
      }),
    ],
    [
      'active',
      createField('active', {
        uiSchema: {
          title: 'Active',
          type: 'boolean',
        },
      }),
    ],
  ]);
  const selectedRows = options.selectedRows ?? [];
  const runAction = options.runAction ?? vi.fn().mockResolvedValue('xlsx-data');

  return {
    collection: {
      title: 'Posts',
      fields,
      filterTargetKey: options.filterTargetKey ?? 'id',
      getFields: () => Array.from(fields.values()),
      getFilterByTK: vi.fn((rows: { id: number }[]) => rows.map((row) => `tk-${row.id}`)),
    },
    resource: {
      getSelectedRows: vi.fn(() => selectedRows),
      getFilter: vi.fn(() => ({ status: 'draft' })),
      getAppends: vi.fn(() => ['author']),
      getSort: vi.fn(() => ['-createdAt']),
      runAction,
    },
  };
}

function createCtx(block: ReturnType<typeof createBlock>, exportSettings: ExportSetting[]): ExportHandlerContext {
  return {
    model: {
      context: {
        blockModel: block,
      },
      getProps: () => ({
        exportSettings,
      }),
    },
    blockModel: block,
    t: (key) => (key ? `t:${key}` : ''),
  };
}

function createModel(uid: string) {
  const engine = new FlowEngine();
  engine.registerModels({ ExportActionModel });
  return engine.createModel<ExportActionModel>({
    use: 'ExportActionModel',
    uid,
  });
}

function getExportStep(model: ExportActionModel) {
  const step = model.getFlow('exportSettings')?.getStep('export')?.serialize() as
    | { handler?: (ctx: ExportHandlerContext, params?: unknown) => Promise<void> }
    | undefined;
  expect(step?.handler).toBeTypeOf('function');
  return step;
}

function getLatestCascaderProps() {
  const props = antdMocks.cascaderProps.at(-1);
  expect(props).toBeDefined();
  return props as CascaderProps;
}

describe('ExportActionModel', () => {
  afterEach(() => {
    vi.clearAllMocks();
    antdMocks.cascaderProps = [];
  });

  it('registers the export action model loader', async () => {
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginActionExportClient.prototype) as PluginActionExportClient & {
      app: {
        flowEngine: {
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      flowEngine: {
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(registerModelLoaders).toHaveBeenCalledWith({
      ExportActionModel: {
        extends: 'ActionModel',
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.ExportActionModel.loader()).resolves.toHaveProperty('ExportActionModel', ExportActionModel);
  });

  it('exports selected rows with translated column metadata', async () => {
    const model = createModel('export-action-selected');
    const exportSettings: ExportSetting[] = [{ dataIndex: ['status'] }, { dataIndex: ['active'] }];
    const block = createBlock({
      selectedRows: [{ id: 1 }, { id: 2 }],
    });
    const step = getExportStep(model);

    await step.handler?.(createCtx(block, exportSettings));

    expect(block.collection.getFilterByTK).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    expect(block.resource.runAction).toHaveBeenCalledWith('export', {
      data: {
        columns: [
          {
            dataIndex: ['status'],
            enum: [
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
            ],
            defaultTitle: 't:Status',
          },
          {
            dataIndex: ['active'],
            enum: [
              { value: true, label: 't:Yes' },
              { value: false, label: 't:No' },
            ],
            defaultTitle: 't:Active',
          },
        ],
      },
      responseType: 'blob',
      params: {
        title: 't:Posts',
        appends: ['author'],
        sort: ['-createdAt'],
        filter: {
          id: ['tk-1', 'tk-2'],
        },
      },
    });
    expect(fileSaverMocks.saveAs).toHaveBeenCalledWith(expect.any(Blob), 't:Posts.xlsx');
  });

  it('exports current resource filter when no rows are selected', async () => {
    const model = createModel('export-action-filter');
    const exportSettings: ExportSetting[] = [{ dataIndex: ['missing'] }];
    const block = createBlock();
    const step = getExportStep(model);

    await step.handler?.(createCtx(block, exportSettings));

    expect(block.resource.getFilter).toHaveBeenCalled();
    expect(block.resource.runAction).toHaveBeenCalledWith(
      'export',
      expect.objectContaining({
        params: expect.objectContaining({
          filter: {
            status: 'draft',
          },
        }),
      }),
    );
  });

  it('uses $or filter for composite target keys', async () => {
    const model = createModel('export-action-composite-filter');
    const block = createBlock({
      selectedRows: [{ id: 3 }],
      filterTargetKey: ['id', 'locale'],
    });
    const step = getExportStep(model);

    await step.handler?.(createCtx(block, [{ dataIndex: ['status'] }]));

    expect(block.resource.runAction).toHaveBeenCalledWith(
      'export',
      expect.objectContaining({
        params: expect.objectContaining({
          filter: {
            $or: ['tk-3'],
          },
        }),
      }),
    );
  });

  it('builds export setting schema, defaults, and stored columns', () => {
    const model = createModel('export-action-settings');
    const step = model.getFlow('exportActionSetting')?.getStep('exportableFields')?.serialize() as
      | {
          uiSchema?: (ctx: ExportHandlerContext) => Record<string, unknown>;
          defaultParams?: (ctx: ExportHandlerContext) => Record<string, unknown>;
          handler?: (ctx: { model: { setProps: ReturnType<typeof vi.fn> } }, params: Record<string, unknown>) => void;
        }
      | undefined;
    const block = createBlock();
    block.collection.getFields = () => [
      createField('title'),
      createField('author', {
        isAssociationField: () => true,
      }),
      createField('virtual', {
        options: {},
      }),
    ];
    const ctx = createCtx(block, []);

    const schema = step?.uiSchema?.(ctx);
    const dataIndexSchema = schema?.exportSettings?.items?.properties?.space?.properties?.dataIndex as {
      'x-component-props'?: {
        optionsCache?: {
          getRootOptions: () => unknown[];
          loadChildren: (option: unknown) => unknown[];
          preloadPath: (path: unknown[]) => boolean;
        };
      };
    };
    const setProps = vi.fn();

    step?.handler?.(
      {
        model: {
          setProps,
        },
      },
      {
        exportSettings: [
          {
            dataIndex: [{ name: 'author' }, 'nickname'],
            title: 'Author nickname',
          },
          {
            dataIndex: [],
            title: 'Ignored',
          },
        ],
      },
    );

    expect(dataIndexSchema['x-component-props']?.optionsCache).toMatchObject({
      getRootOptions: expect.any(Function),
      loadChildren: expect.any(Function),
      preloadPath: expect.any(Function),
    });
    expect(step?.defaultParams?.(ctx)).toEqual({
      exportSettings: [{ dataIndex: ['title'] }],
    });
    expect(setProps).toHaveBeenCalledWith('exportSettings', [
      {
        dataIndex: ['author', 'nickname'],
        title: 'Author nickname',
      },
    ]);
  });

  it('normalizes cascader values and lazy-loads export field options', () => {
    const model = createModel('export-action-cascader');
    const step = model.getFlow('exportActionSetting')?.getStep('exportableFields')?.serialize() as
      | {
          uiSchema?: (ctx: ExportHandlerContext) => Record<string, unknown>;
        }
      | undefined;
    const block = createBlock();
    block.collection.getFields = () => [
      createField('author', {
        interface: 'm2o',
        type: 'belongsTo',
        target: 'users',
        targetCollection: {
          getFields: () => [createField('nickname')],
        },
      }),
    ];
    const schema = step?.uiSchema?.(createCtx(block, []));
    const dataIndexSchema = schema?.exportSettings?.items?.properties?.space?.properties?.dataIndex as {
      'x-component'?: React.ComponentType<{
        value?: unknown[];
        onChange?: (value: unknown[] | null) => void;
        onDropdownVisibleChange?: (open: boolean) => void;
        optionsCache: unknown;
      }>;
      'x-component-props'?: {
        optionsCache?: unknown;
      };
    };
    const CascaderComponent = dataIndexSchema['x-component'];
    const onChange = vi.fn();
    const onDropdownVisibleChange = vi.fn();

    expect(CascaderComponent).toBeTypeOf('function');
    render(
      React.createElement(CascaderComponent, {
        value: [{ name: 'author' }, { name: 'nickname' }],
        onChange,
        onDropdownVisibleChange,
        optionsCache: dataIndexSchema['x-component-props']?.optionsCache,
      }),
    );

    let cascaderProps = getLatestCascaderProps();
    expect(cascaderProps.value).toEqual(['author', 'nickname']);
    expect(cascaderProps.fieldNames).toEqual({
      label: 'title',
      value: 'name',
      children: 'children',
    });

    act(() => {
      cascaderProps.loadData?.([cascaderProps.options?.[0] as CascaderOption]);
    });
    cascaderProps = getLatestCascaderProps();
    expect(cascaderProps.options?.[0]?.children).toMatchObject([{ name: 'nickname', isLeaf: true }]);

    act(() => {
      cascaderProps.onDropdownVisibleChange?.(true);
    });
    expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);

    cascaderProps = getLatestCascaderProps();
    act(() => {
      cascaderProps.onDropdownVisibleChange?.(true);
      cascaderProps.onDropdownVisibleChange?.(false);
    });
    expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);

    act(() => {
      cascaderProps.onChange?.([{ name: 'author' }, { name: 'nickname' }]);
    });
    expect(onChange).toHaveBeenCalledWith(['author', 'nickname']);

    act(() => {
      cascaderProps.loadData?.([]);
      cascaderProps.loadData?.([{ name: 'nickname', isLeaf: true }]);
      cascaderProps.loadData?.([cascaderProps.options?.[0] as CascaderOption]);
    });
    expect(getLatestCascaderProps().options?.[0]?.children).toMatchObject([{ name: 'nickname', isLeaf: true }]);
    expect(cascaderProps.displayRender?.(['Author', 'Nickname'])).toBe('Author / Nickname');
    expect(cascaderProps.displayRender?.([], [{ name: 'author' }, { name: 'nickname' }])).toBe('author / nickname');

    render(
      React.createElement(CascaderComponent, {
        onChange,
        optionsCache: dataIndexSchema['x-component-props']?.optionsCache,
      }),
    );
    expect(getLatestCascaderProps().value).toBeUndefined();
    expect(
      getLatestCascaderProps().displayRender?.([], [{ name: 'author', title: 'Author' }, { name: 'nickname' }]),
    ).toBe('Author / nickname');
  });
});
