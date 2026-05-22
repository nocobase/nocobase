/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum, DataBlockModel, TableActionsColumnModel } from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, test, vi } from 'vitest';
import { GanttBlockModel } from '../models/GanttBlockModel';
import { ALLOWED_GANTT_COLLECTION_ACTIONS, GanttCollectionActionGroupModel } from '../models/actions/GanttActionModels';
import { GanttEventViewActionModel } from '../models/actions/GanttPopupModels';
import PluginGanttClient from '../plugin';

describe('GanttBlockModel.filterCollection', () => {
  test('accepts collections with common NocoBase date fields', () => {
    expect(
      GanttBlockModel.filterCollection({
        filterTargetKey: 'id',
        getFields: () => [{ name: 'createdAt', interface: 'createdAt' }],
      } as any),
    ).toBe(true);

    expect(
      GanttBlockModel.filterCollection({
        filterTargetKey: 'id',
        getFields: () => [{ name: 'updatedAt', type: 'updatedAt' }],
      } as any),
    ).toBe(true);

    expect(
      GanttBlockModel.filterCollection({
        filterTargetKey: 'id',
        getFields: () => [{ name: 'startAt', uiSchema: { type: 'datetime' } }],
      } as any),
    ).toBe(true);
  });

  test('rejects collections without a filter target key', () => {
    expect(
      GanttBlockModel.filterCollection({
        getFields: () => [{ name: 'createdAt', interface: 'createdAt' }],
      } as any),
    ).toBe(false);
  });
});

describe('PluginGanttClient model discovery', () => {
  test('preloads GanttBlockModel as an add-block data block candidate', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ DataBlockModel });

    await PluginGanttClient.prototype.load.call({ app: { i18n: { addResources: vi.fn() } }, flowEngine });
    await flowEngine.preloadModelLoaders();

    expect(flowEngine.getModelClass('GanttBlockModel')).toBe(GanttBlockModel);
    expect(Array.from(flowEngine.getSubclassesOf('DataBlockModel').keys())).toContain('GanttBlockModel');
  });

  test('registers zh-CN locale resources for gantt v2 settings and options', async () => {
    const flowEngine = new FlowEngine();
    const i18n = {
      addResources: vi.fn(),
    };

    await PluginGanttClient.prototype.load.call({ app: { i18n }, flowEngine });

    expect(i18n.addResources).toHaveBeenCalledWith(
      'zh-CN',
      '@nocobase/plugin-gantt',
      expect.objectContaining({
        Day: '天',
        Hour: '小时',
        'Event popup settings': '任务弹窗设置',
        'Show table': '表格显示',
      }),
    );
    expect(i18n.addResources).toHaveBeenCalledWith(
      'zh-CN',
      'gantt',
      expect.objectContaining({
        Day: '天',
        Hour: '小时',
        'Event popup settings': '任务弹窗设置',
        'Show table': '表格显示',
      }),
    );
  });
});

describe('GanttBlockModel row actions column', () => {
  test('does not create default top toolbar actions', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel, TableActionsColumnModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });

    expect(model.mapSubModels('actions', (action) => action.uid)).toEqual([]);
  });

  test('does not render expand collapse actions in the top toolbar', () => {
    class ExpandCollapseActionModel extends ActionModel {
      static scene = ActionSceneEnum.collection;
    }

    class RefreshActionModel extends ActionModel {
      static scene = ActionSceneEnum.collection;
    }

    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel, ExpandCollapseActionModel, RefreshActionModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
      subModels: {
        actions: [{ use: 'ExpandCollapseActionModel' }, { use: 'RefreshActionModel' }],
      },
    });

    expect(model.mapSubModels('actions', (action) => action.use)).toEqual([
      'ExpandCollapseActionModel',
      'RefreshActionModel',
    ]);
    expect(model.getVisibleActionModels().map((action) => action.use)).toEqual(['RefreshActionModel']);
  });

  test('creates a default table actions column for record operations', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel, TableActionsColumnModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });

    const actionsColumn = model.getActionsColumn();

    expect(actionsColumn).toBeInstanceOf(TableActionsColumnModel);
    expect(actionsColumn?.props).toMatchObject({
      title: '{{t("Actions", {"ns":["@nocobase/plugin-gantt","gantt","client"],"nsMode":"fallback"})}}',
      width: 150,
    });
  });

  test('persists the action column width on the column model', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel, TableActionsColumnModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });
    const actionsColumn = model.getActionsColumn();
    const step = actionsColumn?.getFlow('tableColumnSettings')?.steps?.width;

    step?.handler?.({ model: actionsColumn } as any, { width: 250 });

    expect(actionsColumn?.props?.width).toBe(250);
  });
});

describe('GanttBlockModel settings', () => {
  test('hides table-only settings that are not supported by the gantt block', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });
    const tableSettings = model.getFlow('tableSettings');

    expect(tableSettings?.steps?.quickEdit?.hideInSettings).toBe(true);
    expect(tableSettings?.steps?.showRowNumbers?.hideInSettings).toBe(true);
    expect(tableSettings?.steps?.pageSize?.hideInSettings).toBe(true);
    expect(tableSettings?.steps?.tableDensity?.hideInSettings).toBe(true);
    expect(tableSettings?.steps?.dragSort?.hideInSettings).toBe(true);
    expect(tableSettings?.steps?.dragSortBy?.hideInSettings).toBe(true);
  });

  test('keeps data scope and default sorting only in inherited table settings', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });

    expect(model.getFlow('ganttSettings')?.steps?.dataScope).toBeUndefined();
    expect(model.getFlow('ganttSettings')?.steps?.defaultSorting).toBeUndefined();
    expect(model.getFlow('tableSettings')?.steps?.dataScope).toBeDefined();
    expect(model.getFlow('tableSettings')?.steps?.defaultSorting).toBeDefined();
  });

  test('shows the left table by default and persists the table visibility setting', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });
    const step = model.getFlow('ganttSettings')?.steps?.showTable;

    const defaultParams =
      typeof step?.defaultParams === 'function' ? step.defaultParams({ model } as any) : step?.defaultParams;
    expect(defaultParams).toEqual({ showTable: true });

    step?.handler?.({ model } as any, { showTable: false });
    expect(model.props?.showTable).toBe(false);

    step?.beforeParamsSave?.({ model } as any, { showTable: true });
    expect(model.props?.showTable).toBe(true);
  });

  test('translates time scale options at settings render time', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });
    const step = model.getFlow('ganttSettings')?.steps?.timeScale;
    const uiMode =
      typeof step?.uiMode === 'function' ? (step.uiMode({ model, t: (key) => `zh:${key}` } as any) as any) : null;

    expect(uiMode?.props?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'zh:Hour', value: 'hour' }),
        expect.objectContaining({ label: 'zh:Day', value: 'day' }),
        expect.objectContaining({ label: 'zh:Month', value: 'month' }),
      ]),
    );
  });

  test('only exposes single select and color fields as gantt color field candidates', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });
    flowEngine.dataSourceManager.getDataSource('main').addCollection({
      name: 'calendar',
      filterTargetKey: 'id',
      fields: [
        { name: 'title', type: 'string', interface: 'input', uiSchema: { title: 'Title' } },
        { name: 'status', type: 'string', interface: 'select', uiSchema: { title: 'Status' } },
        { name: 'taskColor', type: 'string', interface: 'color', uiSchema: { title: 'Task color' } },
        { name: 'progress', type: 'float', interface: 'number', uiSchema: { title: 'Progress' } },
      ],
    });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'calendar',
          },
        },
      },
    });
    const step = model.getFlow('ganttSettings')?.steps?.colorField;
    const uiMode = typeof step?.uiMode === 'function' ? (step.uiMode({ model } as any) as any) : null;

    expect(uiMode?.props?.options).toEqual([
      { label: 'Status', value: 'status' },
      { label: 'Task color', value: 'taskColor' },
    ]);
  });

  test('formats task color from the selected single select field option', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });
    flowEngine.dataSourceManager.getDataSource('main').addCollection({
      name: 'calendar',
      filterTargetKey: 'id',
      fields: [
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'startAt', type: 'datetime', interface: 'datetime' },
        { name: 'endAt', type: 'datetime', interface: 'datetime' },
        {
          name: 'status',
          type: 'string',
          interface: 'select',
          uiSchema: {
            enum: [
              { label: 'Todo', value: 'todo', color: 'blue' },
              { label: 'Done', value: 'done', color: '#52c41a' },
            ],
          },
        },
      ],
    });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
      props: {
        fieldNames: {
          title: 'title',
          start: 'startAt',
          end: 'endAt',
          color: 'status',
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'calendar',
          },
        },
      },
    });

    model.resource.setData([
      { id: 1, title: 'Task 1', startAt: '2026-05-01', endAt: '2026-05-02', status: 'todo' },
      { id: 2, title: 'Task 2', startAt: '2026-05-03', endAt: '2026-05-04', status: 'done' },
    ]);

    expect(model.getTasks().map((task) => task.color)).toEqual(['#1677FF', '#52c41a']);
  });

  test('formats task color from the selected color field value', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });
    flowEngine.dataSourceManager.getDataSource('main').addCollection({
      name: 'calendar',
      filterTargetKey: 'id',
      fields: [
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'startAt', type: 'datetime', interface: 'datetime' },
        { name: 'endAt', type: 'datetime', interface: 'datetime' },
        { name: 'taskColor', type: 'string', interface: 'color' },
      ],
    });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
      props: {
        fieldNames: {
          title: 'title',
          start: 'startAt',
          end: 'endAt',
          color: 'taskColor',
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'calendar',
          },
        },
      },
    });

    model.resource.setData([
      { id: 1, title: 'Task 1', startAt: '2026-05-01', endAt: '2026-05-02', taskColor: '#722ed1' },
    ]);

    expect(model.getTasks()[0].color).toBe('#722ed1');
  });

  test('exposes event popup settings through openView', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel, GanttEventViewActionModel });
    flowEngine.dataSourceManager.getDataSource('main').addCollection({
      name: 'calendar',
      filterTargetKey: 'id',
      fields: [{ name: 'id', type: 'integer', interface: 'number' }],
    });

    const model = flowEngine.createModel<GanttBlockModel>({
      uid: 'calendar-gantt',
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'calendar',
          },
        },
      },
    });
    const step = model.getFlow('ganttSettings')?.steps?.eventPopupSettings;

    expect(step?.use).toBe('openView');

    const params =
      typeof step?.defaultParams === 'function' ? await step.defaultParams({ model } as any) : step?.defaultParams;
    expect(params).toMatchObject({
      mode: 'drawer',
      size: 'medium',
      pageModelClass: 'ChildPageModel',
      uid: 'calendar-gantt-eventViewAction',
      dataSourceKey: 'main',
      collectionName: 'calendar',
    });
  });

  test('opens the configured event popup with the clicked task record', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel, GanttEventViewActionModel });
    flowEngine.dataSourceManager.getDataSource('main').addCollection({
      name: 'calendar',
      filterTargetKey: 'id',
      fields: [{ name: 'id', type: 'integer', interface: 'number' }],
    });

    const model = flowEngine.createModel<GanttBlockModel>({
      uid: 'calendar-gantt',
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'calendar',
          },
        },
      },
    });
    const action = await model.ensurePopupAction('eventViewAction');
    action.dispatchEvent = vi.fn();

    await model.openEvent({ id: 12 });

    expect(action.dispatchEvent).toHaveBeenCalledWith(
      'click',
      {
        filterByTk: 12,
      },
      { debounce: true },
    );
  });
});

describe('GanttCollectionActionGroupModel', () => {
  test('only offers supported collection actions in top toolbar configuration', async () => {
    const flowEngine = new FlowEngine();
    const actionModels = ALLOWED_GANTT_COLLECTION_ACTIONS.reduce<Record<string, typeof ActionModel>>(
      (models, modelName) => {
        class AllowedActionModel extends ActionModel {
          static scene = ActionSceneEnum.collection;
        }

        AllowedActionModel.define({
          label: modelName,
        });

        models[modelName] = AllowedActionModel;
        return models;
      },
      {},
    );

    class GanttExpandCollapseActionModel extends ActionModel {
      static scene = ActionSceneEnum.collection;
    }

    GanttExpandCollapseActionModel.define({
      label: 'Expand/Collapse',
    });

    class DuplicateActionModel extends ActionModel {
      static scene = ActionSceneEnum.collection;
    }

    DuplicateActionModel.define({
      label: 'Duplicate',
    });

    flowEngine.registerModels({
      GanttCollectionActionGroupModel,
      ...actionModels,
      GanttExpandCollapseActionModel,
      DuplicateActionModel,
    });

    const items = await GanttCollectionActionGroupModel.defineChildren({
      engine: flowEngine,
      dataSourceManager: flowEngine.dataSourceManager,
      model: { uid: 'gantt-1' },
    } as any);

    expect(items.map((item) => item.useModel)).toEqual(ALLOWED_GANTT_COLLECTION_ACTIONS);
  });
});
