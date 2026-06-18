/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionModel,
  ActionSceneEnum,
  CollectionActionGroupModel,
  DataBlockModel,
  TableActionsColumnModel,
} from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, test, vi } from 'vitest';
import { GanttBlockModel } from '../models/GanttBlockModel';
import {
  ALLOWED_GANTT_COLLECTION_ACTIONS,
  GanttCollectionActionGroupModel,
  GanttExpandCollapseActionModel,
  GanttTodayActionModel,
} from '../models/actions/GanttActionModels';
import { GanttEventViewActionModel } from '../models/actions/GanttPopupModels';
import {
  GANTT_TREE_CHILDREN_COLUMN,
  getGanttTreeMeta,
  getOrderedGanttTasks,
  getGanttTableRecords,
  getVisibleGanttTasks,
} from '../models/components/GanttBlock.tree';
import { getDateIndex, getRowNumber, measureMaxElementHeight } from '../models/components/GanttBlock.helpers';
import PluginGanttClient from '../plugin';
import { convertToBarTasks } from '../shared/helpers/bar-helper';

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
    expect(flowEngine.getModelClass('GanttExpandCollapseActionModel')).toBe(GanttExpandCollapseActionModel);
    expect(flowEngine.getModelClass('GanttTodayActionModel')).toBe(GanttTodayActionModel);
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
        'Scroll to today on first display': '默认定位到今天',
        'Show table': '表格显示',
        'Table width': '表格宽度',
        Today: '今天',
      }),
    );
    expect(i18n.addResources).toHaveBeenCalledWith(
      'zh-CN',
      'gantt',
      expect.objectContaining({
        Day: '天',
        Hour: '小时',
        'Event popup settings': '任务弹窗设置',
        'Scroll to today on first display': '默认定位到今天',
        'Show table': '表格显示',
        'Table width': '表格宽度',
        Today: '今天',
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

  test('rebuilds the action configurator when tree table mode changes', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });

    const treeTableSpy = vi.spyOn(model, 'isTreeTableEnabled');
    treeTableSpy.mockReturnValue(false);
    const plainButton = model.renderConfigureActions();

    treeTableSpy.mockReturnValue(true);
    const treeButton = model.renderConfigureActions();

    expect(plainButton.key).toBe('gantt-add-actions-plain');
    expect(treeButton.key).toBe('gantt-add-actions-tree');
  });
});

describe('GanttBlockModel scroll helpers', () => {
  test('emits a smooth scroll request when scrolling to today', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });
    const emitSpy = vi.spyOn(model.emitter, 'emit');

    model.scrollToToday();

    expect(emitSpy).toHaveBeenCalledWith(
      'scrollToDate',
      expect.objectContaining({
        date: expect.any(Date),
        behavior: 'smooth',
      }),
    );
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
    expect(tableSettings?.steps?.showRowNumbers?.hideInSettings).toBeUndefined();
    expect(tableSettings?.steps?.pageSize?.hideInSettings).toBeUndefined();
    expect(tableSettings?.steps?.tableDensity?.hideInSettings).toBe(true);
    expect(tableSettings?.steps?.dragSort?.hideInSettings).toBe(true);
    expect(tableSettings?.steps?.dragSortBy?.hideInSettings).toBe(true);
  });

  test('uses gantt tree collection detection for tree settings visibility', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({ use: 'GanttBlockModel' });
    const treeCtx = {
      model: {
        ...model,
        isTreeCollection: () => true,
      },
    } as any;
    const normalCtx = {
      model: {
        ...model,
        isTreeCollection: () => false,
      },
    } as any;

    expect(model.getFlow('tableSettings')?.steps?.treeTable?.hideInSettings?.(treeCtx)).toBe(false);
    expect(model.getFlow('tableSettings')?.steps?.defaultExpandAllRows?.hideInSettings?.(treeCtx)).toBe(false);
    expect(model.getFlow('tableSettings')?.steps?.treeTable?.hideInSettings?.(normalCtx)).toBe(true);
  });

  test('shows row numbers by default and persists the row number setting', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });
    const step = model.getFlow('tableSettings')?.steps?.showRowNumbers;

    const defaultParams =
      typeof step?.defaultParams === 'function' ? step.defaultParams({ model } as any) : step?.defaultParams;
    expect(defaultParams).toEqual({ showIndex: true });
    expect(model.shouldShowRowNumbers()).toBe(true);

    step?.handler?.({ model } as any, { showIndex: false });
    expect(model.props?.showIndex).toBe(false);
    expect(model.shouldShowRowNumbers()).toBe(false);
  });

  test('initializes paginated resource with the configured page size', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });
    flowEngine.dataSourceManager.getDataSource('main').addCollection({
      name: 'calendar',
      filterTargetKey: 'id',
      fields: [{ name: 'startAt', type: 'datetime', interface: 'datetime' }],
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
        tableSettings: {
          pageSize: {
            pageSize: 50,
          },
        },
      },
    });

    expect(model.resource.getRequestParameter('paginate')).toBeNull();
    expect(model.resource.getRequestParameter('pageSize')).toBe(50);
    expect(model.resource.getPageSize()).toBe(50);
  });

  test('prefers configured default sorting when creating the gantt resource', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });
    flowEngine.dataSourceManager.getDataSource('main').addCollection({
      name: 'calendar',
      filterTargetKey: 'id',
      fields: [{ name: 'startAt', type: 'datetime', interface: 'datetime' }],
    });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
      props: {
        globalSort: ['-createdAt'],
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

    expect(model.resource.getSort()).toEqual(['-createdAt']);
  });

  test('initializes tree requests when tree table is enabled for a tree collection', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });
    flowEngine.dataSourceManager.getDataSource('main').addCollection({
      name: 'tasks',
      template: 'tree',
      tree: 'adjacencyList',
      filterTargetKey: 'id',
      fields: [
        { name: 'startAt', type: 'datetime', interface: 'datetime' },
        { name: 'children', type: 'hasMany', treeChildren: true },
      ],
    });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
        tableSettings: {
          treeTable: {
            treeTable: true,
          },
        },
      },
    });

    expect(model.isTreeTableEnabled()).toBe(true);
    expect(model.resource.getRequestParameter('tree')).toBe(true);
  });

  test('formats tree task children from the collection tree children field', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });
    flowEngine.dataSourceManager.getDataSource('main').addCollection({
      name: 'tasks',
      template: 'tree',
      tree: 'adjacencyList',
      filterTargetKey: 'id',
      fields: [
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'startAt', type: 'datetime', interface: 'datetime' },
        { name: 'endAt', type: 'datetime', interface: 'datetime' },
        { name: 'nodes', type: 'hasMany', treeChildren: true },
      ],
    });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
      props: {
        fieldNames: {
          title: 'title',
          start: 'startAt',
          end: 'endAt',
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
      },
    });

    model.resource.setData([
      {
        id: 1,
        title: 'Parent',
        startAt: '2026-05-01',
        endAt: '2026-05-02',
        nodes: [{ id: 2, title: 'Child', startAt: '2026-05-03', endAt: '2026-05-04' }],
      },
    ]);

    expect(model.getTasks().map((task) => ({ id: task.id, project: task.project, type: task.type }))).toEqual([
      { id: '1', project: undefined, type: 'task' },
      { id: '2', project: '1', type: 'task' },
    ]);
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

  test('persists the left table width setting', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel, TableActionsColumnModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });
    const step = model.getFlow('ganttSettings')?.steps?.tableWidth;

    const defaultParams =
      typeof step?.defaultParams === 'function' ? step.defaultParams({ model } as any) : step?.defaultParams;
    expect(defaultParams).toEqual({ tableWidth: model.getAutoTableWidth() });

    step?.handler?.({ model } as any, { tableWidth: 360 });
    expect(model.props?.tableWidth).toBe(360);
    expect(model.getTableWidth()).toBe(360);

    expect(step?.hideInSettings?.({ model: { props: { showTable: false } } } as any)).toBe(true);
  });

  test('keeps initial scroll to today disabled by default and persists the setting', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
    });
    const step = model.getFlow('ganttSettings')?.steps?.scrollToTodayOnFirstRender;

    const defaultParams =
      typeof step?.defaultParams === 'function' ? step.defaultParams({ model } as any) : step?.defaultParams;
    expect(defaultParams).toEqual({ scrollToTodayOnFirstRender: false });
    expect(model.shouldScrollToTodayOnFirstRender()).toBe(false);

    step?.handler?.({ model } as any, { scrollToTodayOnFirstRender: true });
    expect(model.props?.scrollToTodayOnFirstRender).toBe(true);
    expect(model.shouldScrollToTodayOnFirstRender()).toBe(true);

    step?.beforeParamsSave?.({ model } as any, { scrollToTodayOnFirstRender: false });
    expect(model.props?.scrollToTodayOnFirstRender).toBe(false);
    expect(model.shouldScrollToTodayOnFirstRender()).toBe(false);
  });

  test('reads the initial scroll to today setting from stored step params', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
      stepParams: {
        ganttSettings: {
          scrollToTodayOnFirstRender: {
            scrollToTodayOnFirstRender: true,
          },
        },
      },
    });

    expect(model.shouldScrollToTodayOnFirstRender()).toBe(true);
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

  test('clears optional progress and color field names when settings are cleared', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttBlockModel });

    const model = flowEngine.createModel<GanttBlockModel>({
      use: 'GanttBlockModel',
      props: {
        fieldNames: {
          title: 'title',
          start: 'startAt',
          end: 'endAt',
          progress: 'progress',
          color: 'status',
          range: 'day',
        },
      },
      stepParams: {
        ganttSettings: {
          fields: {
            title: 'title',
            start: 'startAt',
            end: 'endAt',
            progress: 'progress',
            color: 'status',
            range: 'day',
          },
          processField: {
            progress: 'progress',
          },
          colorField: {
            color: 'status',
          },
        },
      },
    });

    const progressStep = model.getFlow('ganttSettings')?.steps?.processField;
    const colorStep = model.getFlow('ganttSettings')?.steps?.colorField;
    const progressParams = { progress: undefined };
    const colorParams = {};

    progressStep?.handler?.({ model } as any, progressParams);
    colorStep?.beforeParamsSave?.({ model } as any, colorParams);

    expect(model.props?.fieldNames).toEqual({
      title: 'title',
      start: 'startAt',
      end: 'endAt',
      range: 'day',
    });
    expect(model.getFieldNames().progress).toBeUndefined();
    expect(model.getFieldNames().color).toBeUndefined();
    expect(progressParams).toEqual({ progress: null });
    expect(colorParams).toEqual({ color: null });
    expect(model.getStepParams('ganttSettings', 'fields')).toMatchObject({
      progress: null,
      color: null,
    });
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
      dataSourceKey: 'main',
      collectionName: 'calendar',
    });
    expect(params.uid).toBeTruthy();
    expect(params.uid).not.toContain('eventViewAction');
  });

  test('persists popup actions only from popup settings save hooks', async () => {
    const step = (GanttBlockModel as any).globalFlowRegistry.getFlow('ganttSettings')?.steps?.eventPopupSettings;
    const action = { uid: 'u_event_popup' };
    const model = {
      getEventViewAction: vi.fn(() => null),
      getPopupSettingsDefaults: vi.fn(() => ({
        mode: 'drawer',
        size: 'medium',
        pageModelClass: 'ChildPageModel',
        uid: 'u_event_popup',
        collectionName: 'calendar',
        dataSourceKey: 'main',
      })),
      getPopupActionSettings: vi.fn(() => ({})),
      setPopupActionSettings: vi.fn(),
      clearStoredPopupSettings: vi.fn(),
      ensurePopupAction: vi.fn().mockResolvedValue(action),
    };

    await step?.handler?.({ model } as any, { mode: 'drawer' });

    expect(model.ensurePopupAction).not.toHaveBeenCalled();
    expect(model.setPopupActionSettings).not.toHaveBeenCalled();

    await step?.beforeParamsSave?.({ model } as any, { mode: 'dialog' });

    expect(model.ensurePopupAction).toHaveBeenCalledWith('eventViewAction');
    expect(model.setPopupActionSettings).toHaveBeenCalledWith(
      action,
      {
        mode: 'dialog',
        uid: 'u_event_popup',
        collectionName: 'calendar',
        dataSourceKey: 'main',
      },
      { persist: true },
    );
    expect(model.clearStoredPopupSettings).toHaveBeenCalled();
  });

  test('runs openView beforeParamsSave when saving gantt popup template settings', async () => {
    const step = (GanttBlockModel as any).globalFlowRegistry.getFlow('ganttSettings')?.steps?.eventPopupSettings;
    const openViewBeforeParamsSave = vi.fn(async (_ctx, params) => {
      params.uid = 'u_template_popup';
    });
    const action = { uid: 'u_event_popup' };
    const model = {
      getAction: vi.fn(() => ({
        beforeParamsSave: openViewBeforeParamsSave,
      })),
      getPopupActionSettings: vi.fn(() => ({ uid: 'u_old_popup' })),
      setPopupActionSettings: vi.fn(),
      clearStoredPopupSettings: vi.fn(),
      ensurePopupAction: vi.fn().mockResolvedValue(action),
    };
    const params = { popupTemplateUid: 'tpl-popup', uid: 'u_old_popup' };

    await step?.beforeParamsSave?.({ model } as any, params);

    expect(openViewBeforeParamsSave).toHaveBeenCalledWith({ model }, params, { uid: 'u_old_popup' });
    expect(model.setPopupActionSettings).toHaveBeenCalledWith(
      action,
      {
        popupTemplateUid: 'tpl-popup',
        uid: 'u_template_popup',
      },
      { persist: true },
    );
    expect(model.clearStoredPopupSettings).toHaveBeenCalled();
  });

  test('clears stale popup template params when the gantt popup template setting is removed', async () => {
    const step = (GanttBlockModel as any).globalFlowRegistry.getFlow('ganttSettings')?.steps?.eventPopupSettings;
    const previousParams = {
      mode: 'drawer',
      size: 'medium',
      popupTemplateUid: 'tpl-popup',
      uid: 'u_template_popup',
      dataSourceKey: 'main',
      collectionName: 'templateTasks',
      filterByTk: '{{ ctx.record.id }}',
    };
    const openViewBeforeParamsSave = vi.fn(async (_ctx, params) => {
      expect(params).toEqual({
        mode: 'drawer',
        size: 'medium',
        uid: 'u_event_popup',
        dataSourceKey: 'main',
        collectionName: 'calendar',
      });
    });
    const action = { uid: 'u_event_popup' };
    const model = Object.create(GanttBlockModel.prototype) as GanttBlockModel;
    Object.defineProperties(model, {
      getAction: {
        value: vi.fn(() => ({
          beforeParamsSave: openViewBeforeParamsSave,
        })),
      },
      getStepParams: {
        value: vi.fn(() => previousParams),
      },
      getPopupActionSettings: {
        value: vi.fn(() => previousParams),
      },
      setPopupActionSettings: {
        value: vi.fn(),
      },
      clearStoredPopupSettings: {
        value: vi.fn(),
      },
      ensurePopupAction: {
        value: vi.fn().mockResolvedValue(action),
      },
      collection: {
        value: {
          name: 'calendar',
          dataSourceKey: 'main',
        },
      },
      props: {
        value: {},
      },
    });
    const params = {
      mode: 'drawer',
      size: 'medium',
      uid: 'u_template_popup',
      dataSourceKey: 'main',
      collectionName: 'templateTasks',
      filterByTk: '{{ ctx.record.id }}',
    };

    await step?.beforeParamsSave?.({ model } as any, params);

    expect(openViewBeforeParamsSave).toHaveBeenCalledWith({ model }, params, previousParams);
    expect(params).toEqual({
      mode: 'drawer',
      size: 'medium',
      uid: 'u_event_popup',
      dataSourceKey: 'main',
      collectionName: 'calendar',
    });
    expect(model.setPopupActionSettings).toHaveBeenCalledWith(
      action,
      {
        mode: 'drawer',
        size: 'medium',
        uid: 'u_event_popup',
        dataSourceKey: 'main',
        collectionName: 'calendar',
      },
      { persist: true },
    );
    expect(model.clearStoredPopupSettings).toHaveBeenCalled();
  });

  test('dispatches the hidden popup action so openView template handling can run', async () => {
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
    const openView = vi.fn();
    model.context.defineMethod('openView', openView);

    await model.openEvent({ id: 12 });

    expect(action.uid).not.toContain('eventViewAction');
    expect(action.dispatchEvent).toHaveBeenCalledWith(
      'click',
      {
        dataSourceKey: 'main',
        collectionName: 'calendar',
        filterByTk: 12,
        target: model.context.layoutContentElement,
      },
      {
        debounce: true,
      },
    );
    expect(openView).not.toHaveBeenCalled();
  });

  test('does not persist hidden popup actions while opening gantt popups', async () => {
    const save = vi.fn();
    const saveStepParams = vi.fn();
    const action = {
      uid: 'u_event_popup',
      getStepParams: vi.fn(() => ({})),
      setStepParams: vi.fn(),
      save,
      saveStepParams,
    };
    const model = Object.create(GanttBlockModel.prototype) as GanttBlockModel;
    Object.defineProperty(model, 'subModels', {
      value: {
        eventViewAction: action,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: true,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'calendar',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      writable: true,
      configurable: true,
    });

    await model.ensurePopupAction('eventViewAction');

    expect(save).not.toHaveBeenCalled();
    expect(saveStepParams).not.toHaveBeenCalled();
    expect(action.setStepParams).toHaveBeenCalled();
  });

  test('uses popup template settings stored on the hidden popup action while opening gantt popups', async () => {
    const action = {
      uid: 'u_event_popup',
      getStepParams: vi.fn(() => ({
        uid: 'u_template_popup',
        popupTemplateUid: 'tpl-popup',
        collectionName: 'templateTasks',
        dataSourceKey: 'main',
        filterByTk: '{{ ctx.record.id }}',
      })),
      setStepParams: vi.fn(),
      save: vi.fn(),
      saveStepParams: vi.fn(),
    };
    const model = Object.create(GanttBlockModel.prototype) as GanttBlockModel;
    Object.defineProperty(model, 'subModels', {
      value: {
        eventViewAction: action,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: true,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'calendar',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {
        eventPopupSettings: {
          mode: 'dialog',
          size: 'large',
        },
      },
      writable: true,
      configurable: true,
    });

    await model.ensurePopupAction('eventViewAction');

    expect(action.setStepParams).toHaveBeenCalledWith('popupSettings', {
      openView: expect.objectContaining({
        mode: 'drawer',
        size: 'medium',
        uid: 'u_template_popup',
        popupTemplateUid: 'tpl-popup',
        collectionName: 'templateTasks',
        dataSourceKey: 'main',
        filterByTk: '{{ ctx.record.id }}',
      }),
    });
  });

  test('replaces hidden popup openView params when gantt popup settings are saved without a template', async () => {
    let currentOpenViewParams = {
      uid: 'u_template_popup',
      popupTemplateUid: 'tpl-popup',
      collectionName: 'templateTasks',
      dataSourceKey: 'main',
    };
    const action = {
      uid: 'u_event_popup',
      getStepParams: vi.fn(() => currentOpenViewParams),
      setStepParams: vi.fn((_flowKey, stepParams) => {
        currentOpenViewParams = stepParams.openView;
      }),
      save: vi.fn(),
      saveStepParams: vi.fn(),
    };
    const model = Object.create(GanttBlockModel.prototype) as GanttBlockModel;
    Object.defineProperty(model, 'subModels', {
      value: {
        eventViewAction: action,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: true,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'calendar',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(model, '_options', {
      value: {},
      writable: true,
      configurable: true,
    });

    await model.setPopupActionSettings(
      action,
      {
        mode: 'drawer',
        size: 'medium',
        uid: 'u_event_popup',
        collectionName: 'calendar',
        dataSourceKey: 'main',
      },
      { persist: true },
    );

    expect(action.setStepParams).toHaveBeenCalledWith('popupSettings', {
      openView: {
        mode: 'drawer',
        size: 'medium',
        uid: 'u_event_popup',
        collectionName: 'calendar',
        dataSourceKey: 'main',
      },
    });
    expect(currentOpenViewParams).toMatchObject({
      mode: 'drawer',
      size: 'medium',
      uid: 'u_event_popup',
      collectionName: 'calendar',
      dataSourceKey: 'main',
    });
    expect(currentOpenViewParams).not.toHaveProperty('popupTemplateUid');
  });

  test('persists hidden popup actions only when gantt popup settings are saved', async () => {
    const save = vi.fn();
    const saveStepParams = vi.fn();
    const action = {
      uid: 'u_event_popup',
      getStepParams: vi.fn(() => ({})),
      setStepParams: vi.fn(),
      save,
      saveStepParams,
    };
    const model = Object.create(GanttBlockModel.prototype) as GanttBlockModel;
    Object.defineProperty(model, 'subModels', {
      value: {
        eventViewAction: action,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: true,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'calendar',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      writable: true,
      configurable: true,
    });

    await model.ensurePopupAction('eventViewAction', { persist: true });

    expect(save).toHaveBeenCalledTimes(1);
    expect(saveStepParams).toHaveBeenCalledTimes(1);
  });

  test('keeps legacy gantt popup action uid usable when popup settings are saved', async () => {
    const destroy = vi.fn();
    const action = {
      uid: 'calendar-gantt-eventViewAction',
      getStepParams: vi.fn(() => ({})),
      setStepParams: vi.fn(),
      clone: vi.fn(),
      save: vi.fn(),
      saveStepParams: vi.fn(),
      destroy,
    };
    const model = Object.create(GanttBlockModel.prototype) as GanttBlockModel;
    Object.defineProperty(model, 'subModels', {
      value: {
        eventViewAction: action,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: true,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'calendar',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      writable: true,
      configurable: true,
    });
    model.setSubModel = vi.fn(function (this: any, key, value) {
      this.subModels[key] = value;
      return value;
    }) as any;

    await model.ensurePopupAction('eventViewAction');

    expect(action.clone).not.toHaveBeenCalled();
    expect(model.subModels.eventViewAction).toBe(action);
    expect(action.save).not.toHaveBeenCalled();
    expect(action.saveStepParams).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();

    await model.ensurePopupAction('eventViewAction', { persist: true });

    expect(action.clone).not.toHaveBeenCalled();
    expect(model.subModels.eventViewAction).toBe(action);
    expect(action.save).toHaveBeenCalledTimes(1);
    expect(action.saveStepParams).toHaveBeenCalledTimes(1);
    expect(destroy).not.toHaveBeenCalled();
  });
});

describe('GanttBlock tree helpers', () => {
  const tasks = [
    { id: '1', name: 'Parent', type: 'task', record: { id: 1, children: [{ id: 2 }] } },
    { id: '2', name: 'Child', type: 'task', project: '1', record: { id: 2 } },
    { id: '3', name: 'Sibling', type: 'task', record: { id: 3 } },
  ] as any;

  test('uses the same visible tree order for the table and gantt chart', () => {
    const treeMeta = getGanttTreeMeta(tasks);

    expect(
      getVisibleGanttTasks({
        expandedRowKeySet: new Set(),
        tasks,
        treeTableEnabled: true,
        treeMeta,
      }).map((task) => task.id),
    ).toEqual(['1', '3']);

    expect(
      getVisibleGanttTasks({
        expandedRowKeySet: new Set(['1']),
        tasks,
        treeTableEnabled: true,
        treeMeta,
      }).map((task) => task.id),
    ).toEqual(['1', '2', '3']);
  });

  test('stores gantt tree children in an internal column name instead of record.children', () => {
    const treeMeta = getGanttTreeMeta(tasks);
    const records = getGanttTableRecords({ tasks, treeTableEnabled: true, treeMeta });

    expect(records[0].children).toEqual([{ id: 2 }]);
    expect(records[0][GANTT_TREE_CHILDREN_COLUMN].map((record) => record.__ganttTaskId)).toEqual(['2']);
    expect(records[0].__ganttTaskIndex).toBe(0);
    expect(records[0][GANTT_TREE_CHILDREN_COLUMN][0].__ganttTaskIndex).toBe(1);
    expect(records[1].__ganttTaskIndex).toBe(2);
    expect(records[0].__ganttTaskIndexPath).toBe('0');
    expect(records[0][GANTT_TREE_CHILDREN_COLUMN][0].__ganttTaskIndexPath).toBe('0.children.0');
    expect(records[1].__ganttTaskIndexPath).toBe('1');
    expect(records[0].__ganttTaskDepth).toBe(0);
    expect(records[0][GANTT_TREE_CHILDREN_COLUMN][0].__ganttTaskDepth).toBe(1);
    expect(records.map((record) => record.__ganttTaskId)).toEqual(['1', '3']);
  });

  test('keeps non-tree table rows in the same sorted order as the gantt bars', () => {
    const unorderedTasks = [
      {
        id: '2',
        name: 'Later',
        type: 'task',
        displayOrder: 2,
        start: new Date('2026-05-02'),
        end: new Date('2026-05-03'),
        record: { id: 2 },
      },
      {
        id: '1',
        name: 'Earlier',
        type: 'task',
        displayOrder: 1,
        start: new Date('2026-05-01'),
        end: new Date('2026-05-02'),
        record: { id: 1 },
      },
    ] as any;

    expect(getOrderedGanttTasks({ tasks: unorderedTasks, treeTableEnabled: false }).map((task) => task.id)).toEqual([
      '1',
      '2',
    ]);
    expect(
      getGanttTableRecords({ tasks: unorderedTasks, treeTableEnabled: false }).map((record) => record.__ganttTaskId),
    ).toEqual(['1', '2']);
  });

  test('formats tree row numbers as hierarchical indices', () => {
    expect(getRowNumber({ rowIndex: 0, rowPath: '0' })).toBe('1');
    expect(getRowNumber({ rowIndex: 1, rowPath: '0.children.0' })).toBe('1.1');
    expect(getRowNumber({ rowIndex: 2, rowPath: '0.children.1.children.0' })).toBe('1.2.1');
    expect(getRowNumber({ page: 2, pageSize: 20, rowIndex: 0 })).toBe(21);
  });

  test('finds the matching gantt date column for quick navigation', () => {
    const dates = [new Date('2026-05-24T00:00:00'), new Date('2026-05-25T00:00:00'), new Date('2026-05-26T00:00:00')];

    expect(getDateIndex(new Date('2026-05-25T12:00:00'), dates)).toBe(1);
    expect(getDateIndex(new Date('2026-05-26T00:00:00'), dates)).toBe(-1);
    expect(getDateIndex(new Date('2026-05-23T23:59:59'), dates)).toBe(-1);
  });

  test('uses the tallest visible table row as the gantt row height baseline', () => {
    const shortRow = document.createElement('tr');
    const tallActionRow = document.createElement('tr');

    vi.spyOn(shortRow, 'getBoundingClientRect').mockReturnValue({ height: 48 } as DOMRect);
    vi.spyOn(tallActionRow, 'getBoundingClientRect').mockReturnValue({ height: 72 } as DOMRect);

    expect(measureMaxElementHeight([shortRow, tallActionRow])).toBe(72);
  });
});

describe('Gantt bar task helpers', () => {
  test('keeps dependency children linked to the dependency task', () => {
    const tasks = [
      {
        id: '1',
        name: 'Dependency',
        type: 'task',
        start: new Date('2026-05-01T00:00:00'),
        end: new Date('2026-05-02T00:00:00'),
        progress: 0,
      },
      {
        id: '2',
        name: 'Dependent',
        type: 'task',
        start: new Date('2026-05-02T00:00:00'),
        end: new Date('2026-05-03T00:00:00'),
        progress: 0,
        dependencies: ['1', 'missing'],
      },
    ] as any;

    const barTasks = convertToBarTasks(
      tasks,
      [new Date('2026-05-01T00:00:00'), new Date('2026-05-02T00:00:00'), new Date('2026-05-03T00:00:00')],
      80,
      40,
      20,
      2,
      8,
      false,
      '#1677ff',
      '#1677ff',
      '#1677ff',
      '#1677ff',
      '#1677ff',
      '#1677ff',
      '#1677ff',
      '#1677ff',
      '#faad14',
      '#faad14',
    );

    expect(barTasks[0].barChildren.map((task) => task.id)).toEqual(['2']);
    expect(barTasks[1].barChildren).toEqual([]);
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

describe('Gantt gantt-only actions', () => {
  test('are only offered by gantt action configuration', async () => {
    class VisibleActionModel extends ActionModel {
      static scene = ActionSceneEnum.collection;
    }

    VisibleActionModel.define({
      label: 'Visible action',
    });

    const flowEngine = new FlowEngine();
    flowEngine.registerModels({
      CollectionActionGroupModel,
      GanttCollectionActionGroupModel,
      GanttExpandCollapseActionModel,
      GanttTodayActionModel,
      VisibleActionModel,
    });

    const commonItems = await CollectionActionGroupModel.defineChildren({
      engine: flowEngine,
      dataSourceManager: flowEngine.dataSourceManager,
      model: { uid: 'table-1' },
    } as any);
    expect(commonItems.map((item) => item.useModel)).toContain('VisibleActionModel');
    expect(commonItems.map((item) => item.useModel)).not.toContain('GanttTodayActionModel');
    expect(commonItems.map((item) => item.useModel)).not.toContain('GanttExpandCollapseActionModel');

    const ganttItems = await GanttCollectionActionGroupModel.defineChildren({
      engine: flowEngine,
      dataSourceManager: flowEngine.dataSourceManager,
      model: {
        uid: 'gantt-1',
        isTreeCollection: () => true,
        isTreeTableEnabled: () => true,
        getModelClassName: () => 'GanttCollectionActionGroupModel',
      },
    } as any);
    expect(ganttItems.map((item) => item.useModel)).toContain('GanttExpandCollapseActionModel');
    expect(ganttItems.map((item) => item.useModel)).toContain('GanttTodayActionModel');
  });

  test('does not offer expand collapse when gantt tree table is disabled', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({
      GanttCollectionActionGroupModel,
      GanttExpandCollapseActionModel,
    });

    const ganttItems = await GanttCollectionActionGroupModel.defineChildren({
      engine: flowEngine,
      dataSourceManager: flowEngine.dataSourceManager,
      model: {
        uid: 'gantt-1',
        isTreeCollection: () => true,
        isTreeTableEnabled: () => false,
        getModelClassName: () => 'GanttCollectionActionGroupModel',
      },
    } as any);

    expect(ganttItems.map((item) => item.useModel)).not.toContain('GanttExpandCollapseActionModel');
  });

  test('requests the gantt block to scroll to today on click', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttTodayActionModel });
    const blockModel = {
      scrollToToday: vi.fn(),
    };

    const action = flowEngine.createModel<GanttTodayActionModel>({
      uid: 'today-action',
      use: 'GanttTodayActionModel',
    });
    action.context.defineProperty('blockModel', { value: blockModel });

    await action.dispatchEvent('click');

    expect(blockModel.scrollToToday).toHaveBeenCalledTimes(1);
  });

  test('toggles gantt tree rows on click', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ GanttExpandCollapseActionModel });
    const blockModel = {
      isTreeTableEnabled: () => true,
      isTreeExpanded: vi.fn(() => false),
      toggleAllTreeRows: vi.fn(),
    };

    const action = flowEngine.createModel<GanttExpandCollapseActionModel>({
      uid: 'expand-collapse-action',
      use: 'GanttExpandCollapseActionModel',
    });
    action.context.defineProperty('blockModel', { value: blockModel });

    await action.dispatchEvent('click');

    expect(blockModel.toggleAllTreeRows).toHaveBeenCalledTimes(1);
    expect(action.props?.icon).toBe('NodeCollapseOutlined');
  });
});
