/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { KanbanBlockModel } from '../models';
import { KanbanCreateSortFieldSelect } from '../models/components/KanbanCreateSortFieldSelect';
import { FlowEngine } from '@nocobase/flow-engine';

describe('KanbanBlockModel.filterCollection', () => {
  test('defaults dragging to disabled for newly created blocks', () => {
    expect((KanbanBlockModel as any).meta.createModelOptions).toMatchObject({
      props: {
        dragEnabled: false,
      },
    });
  });

  test('accepts collections with a supported grouping field', () => {
    expect(
      KanbanBlockModel.filterCollection({
        filterTargetKey: 'id',
        getFields: () => [{ name: 'status', interface: 'select' }],
      } as any),
    ).toBe(true);

    expect(
      KanbanBlockModel.filterCollection({
        filterTargetKey: 'id',
        getFields: () => [{ name: 'owner', interface: 'm2o' }],
      } as any),
    ).toBe(true);
  });

  test('rejects collections without filterTargetKey even if fields are otherwise supported', () => {
    expect(
      KanbanBlockModel.filterCollection({
        getFields: () => [{ name: 'status', interface: 'select' }],
      } as any),
    ).toBe(false);
  });

  test('rejects collections that have no supported grouping fields', () => {
    expect(
      KanbanBlockModel.filterCollection({
        filterTargetKey: 'id',
        getFields: () => [{ name: 'title', interface: 'input' }],
      } as any),
    ).toBe(false);
  });

  test('rejects collections whose only grouping candidates are multi-value relations', () => {
    expect(
      KanbanBlockModel.filterCollection({
        filterTargetKey: 'id',
        getFields: () => [{ name: 'watchers', interface: 'm2m' }],
      } as any),
    ).toBe(false);
  });

  test('grouping defaultParams works during create flow before model exists', () => {
    const statusField = {
      name: 'status',
      interface: 'select',
      uiSchema: {
        enum: [{ value: 'todo', label: 'Todo' }],
      },
    };
    const collection = {
      getFields: () => [statusField],
      getField: (name: string) => (name === 'status' ? statusField : undefined),
    };
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;

    expect(step.defaultParams({ collection } as any)).toEqual({
      groupField: 'status',
      groupOptions: [{ value: 'todo', label: 'Todo', color: 'default', enabled: true, isUnknown: undefined }],
    });
  });

  test('grouping uiSchema requires at least one option before save', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;
    const schema = step.uiSchema({ model: { uid: 'kanban-1' }, collection: { name: 'posts' } } as any);

    expect(schema.groupOptions).toMatchObject({
      type: 'array',
      required: true,
      'x-validator': [
        {
          min: 1,
          message: '{{t("At least one option is required", {"ns":"kanban"})}}',
        },
      ],
    });
  });

  test('grouping uiSchema does not embed cyclical runtime objects in component props', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;
    const model = { uid: 'kanban-1' };
    const collection = { name: 'posts' };
    const schema = step.uiSchema({ model, collection, dataSource: { key: 'main' } } as any);

    expect(schema).toEqual({
      groupField: {
        title: '{{t("Grouping field", {"ns":"kanban"})}}',
        description: '{{t("Single select and many-to-one fields can be used as the grouping field", {"ns":"kanban"})}}',
        enum: [],
        'x-component': 'Select',
        'x-decorator': 'FormItem',
      },
      groupOptions: {
        title: '{{t("Options", {"ns":"kanban"})}}',
        type: 'array',
        required: true,
        'x-component': 'KanbanGroupOptionsTable',
        'x-decorator': 'FormItem',
        'x-validator': [
          {
            min: 1,
            message: '{{t("At least one option is required", {"ns":"kanban"})}}',
          },
        ],
        'x-reactions': {
          dependencies: ['.groupField'],
          fulfill: {
            state: {
              componentProps: {
                groupFieldName: '{{$deps[0]}}',
              },
            },
          },
        },
      },
    });
  });

  test('kanban block settings no longer expose card open mode', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');

    expect(flow.steps.cardOpenMode).toBeUndefined();
  });

  test('sort field candidates only include sorting fields scoped to the current grouping field', () => {
    const candidates = KanbanBlockModel.prototype.getSortFieldCandidates.call({
      collection: {
        getFields: () => [
          { name: 'status_sort', interface: 'sort', scopeKey: 'status', uiSchema: { title: 'Status sort' } },
          { name: 'owner_sort', interface: 'sort', scopeKey: 'owner', uiSchema: { title: 'Owner sort' } },
          { name: 'global_sort', interface: 'sort', uiSchema: { title: 'Global sort' } },
          { name: 'status', interface: 'select', uiSchema: { title: 'Status' } },
        ],
      },
      getGroupField: () => ({ name: 'status' }),
    });

    expect(candidates).toEqual([
      {
        label: 'Status sort',
        value: 'status_sort',
        scopeKey: 'status',
      },
    ]);
  });

  test('sort field candidates support scopeKey from field options metadata', () => {
    const candidates = KanbanBlockModel.prototype.getSortFieldCandidates.call({
      collection: {
        getFields: () => [
          {
            name: 'status_sort',
            interface: 'sort',
            options: { scopeKey: 'status' },
            uiSchema: { title: 'Status sort' },
          },
          { name: 'status', interface: 'select', uiSchema: { title: 'Status' } },
        ],
      },
      getGroupField: () => ({ name: 'status' }),
    });

    expect(candidates).toEqual([
      {
        label: 'Status sort',
        value: 'status_sort',
        scopeKey: 'status',
      },
    ]);
  });

  test('association grouping accepts sort fields scoped by the raw foreign key', () => {
    const candidates = KanbanBlockModel.prototype.getSortFieldCandidates.call({
      collection: {
        getFields: () => [
          { name: 'owner_sort', interface: 'sort', scopeKey: 'owner_id', uiSchema: { title: 'Owner sort' } },
          { name: 'legacy_owner_sort', interface: 'sort', scopeKey: 'owner', uiSchema: { title: 'Legacy owner sort' } },
          { name: 'owner', interface: 'm2o', foreignKey: 'owner_id', uiSchema: { title: 'Owner' } },
        ],
      },
      getGroupField: () => ({ name: 'owner', interface: 'm2o', foreignKey: 'owner_id' }),
    });

    expect(candidates).toEqual([
      {
        label: 'Owner sort',
        value: 'owner_sort',
        scopeKey: 'owner_id',
      },
      {
        label: 'Legacy owner sort',
        value: 'legacy_owner_sort',
        scopeKey: 'owner',
      },
    ]);
  });

  test('uses params.sort as a fallback configured sort field for existing blocks', () => {
    const sortFieldName = KanbanBlockModel.prototype.getSortFieldName.call({
      props: {
        params: {
          sort: ['-status_sort'],
        },
      },
      collection: {
        getFields: () => [
          { name: 'status_sort', interface: 'sort', scopeKey: 'status', uiSchema: { title: 'Status sort' } },
          { name: 'status', interface: 'select', uiSchema: { title: 'Status' } },
        ],
      },
      getConfiguredSortFieldName: KanbanBlockModel.prototype.getConfiguredSortFieldName,
      getCompatibleSortFieldName: KanbanBlockModel.prototype.getCompatibleSortFieldName,
      getSortFieldCandidates: KanbanBlockModel.prototype.getSortFieldCandidates,
      getGroupField: () => ({ name: 'status' }),
    });

    expect(sortFieldName).toBe('status_sort');
  });

  test('configured association sort fields remain compatible after migrating scope to the raw foreign key', () => {
    const sortFieldName = KanbanBlockModel.prototype.getSortFieldName.call({
      props: {
        sortField: 'owner_sort',
      },
      collection: {
        getFields: () => [
          { name: 'owner_sort', interface: 'sort', scopeKey: 'owner_id', uiSchema: { title: 'Owner sort' } },
          { name: 'owner', interface: 'm2o', foreignKey: 'owner_id', uiSchema: { title: 'Owner' } },
        ],
      },
      getConfiguredSortFieldName: KanbanBlockModel.prototype.getConfiguredSortFieldName,
      getCompatibleSortFieldName: KanbanBlockModel.prototype.getCompatibleSortFieldName,
      getSortFieldCandidates: KanbanBlockModel.prototype.getSortFieldCandidates,
      getGroupField: () => ({ name: 'owner', interface: 'm2o', foreignKey: 'owner_id' }),
    });

    expect(sortFieldName).toBe('owner_sort');
  });

  test('card open mode prefers the latest configured item props', () => {
    const openMode = KanbanBlockModel.prototype.getCardOpenMode.call({
      subModels: {
        item: {
          getProps: () => ({ openMode: 'dialog' }),
          props: { openMode: 'drawer' },
        },
      },
      props: {
        cardOpenMode: 'embed',
      },
    });

    expect(openMode).toBe('dialog');
  });

  test('enables drag sorting when dragging is on and sort field comes from params.sort fallback', () => {
    const canDragSort = KanbanBlockModel.prototype.canDragSort.call({
      props: {
        dragEnabled: true,
        params: {
          sort: ['status_sort'],
        },
      },
      getDragEnabled: KanbanBlockModel.prototype.getDragEnabled,
      getSortFieldName: KanbanBlockModel.prototype.getSortFieldName,
      getConfiguredSortFieldName: KanbanBlockModel.prototype.getConfiguredSortFieldName,
      getCompatibleSortFieldName: KanbanBlockModel.prototype.getCompatibleSortFieldName,
      getSortFieldCandidates: KanbanBlockModel.prototype.getSortFieldCandidates,
      getGroupField: () => ({ name: 'status' }),
      collection: {
        getFields: () => [
          { name: 'status_sort', interface: 'sort', scopeKey: 'status', uiSchema: { title: 'Status sort' } },
          { name: 'status', interface: 'select', uiSchema: { title: 'Status' } },
        ],
      },
    });

    expect(canDragSort).toBe(true);
  });

  test('dragging interaction stays disabled when no sort field is selected', () => {
    const canDragSort = KanbanBlockModel.prototype.canDragSort.call({
      props: {
        dragEnabled: true,
      },
      getDragEnabled: KanbanBlockModel.prototype.getDragEnabled,
      getSortFieldName: () => undefined,
    });

    expect(canDragSort).toBe(false);
  });

  test('dragging defaults keep dragging disabled until a sort field is selected', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.dragging;

    expect(
      step.defaultParams({
        model: {
          props: {},
          getDragEnabled: () => true,
          getSortFieldName: () => undefined,
        },
      } as any),
    ).toEqual({
      dragEnabled: false,
      sortField: null,
    });
  });

  test('grouping changes disable dragging when the grouping sort field is missing', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;
    const setProps = vi.fn();
    const setSort = vi.fn();

    step.handler(
      {
        model: {
          props: {},
          resource: {
            setSort,
          },
          setProps,
          getDragEnabled: () => true,
          getConfiguredSortFieldName: () => undefined,
          getCompatibleSortFieldName: () => undefined,
        },
      } as any,
      {
        groupField: 'status',
        groupOptions: [],
      },
    );

    expect(setProps).toHaveBeenCalledWith({
      groupField: 'status',
      groupOptions: [],
      sortField: undefined,
      dragEnabled: false,
    });
    expect(setSort).toHaveBeenCalledWith([]);
  });

  test('cross-column dragging still works when dragging is enabled from legacy props', () => {
    const canCrossColumnDrag = KanbanBlockModel.prototype.canCrossColumnDrag.call({
      props: {
        allowCrossColumnDrag: true,
        params: {
          sort: ['status_sort'],
        },
      },
      getDragEnabled: KanbanBlockModel.prototype.getDragEnabled,
      getSortFieldName: KanbanBlockModel.prototype.getSortFieldName,
      getConfiguredSortFieldName: KanbanBlockModel.prototype.getConfiguredSortFieldName,
      getCompatibleSortFieldName: KanbanBlockModel.prototype.getCompatibleSortFieldName,
      getSortFieldCandidates: KanbanBlockModel.prototype.getSortFieldCandidates,
      getGroupField: () => ({ name: 'status' }),
      collection: {
        getFields: () => [
          { name: 'status_sort', interface: 'sort', scopeKey: 'status', uiSchema: { title: 'Status sort' } },
          { name: 'status', interface: 'select', uiSchema: { title: 'Status' } },
        ],
      },
    });

    expect(canCrossColumnDrag).toBe(true);
  });

  test('kanban blocks always use manual base-resource loading to avoid the unused initial list request', () => {
    expect(KanbanBlockModel.prototype.getDataLoadingMode.call({})).toBe('manual');
  });

  test('kanban blocks disable automatic base-resource refreshes', () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('location', { value: { search: '' } as any });
    engine.registerModels({ KanbanBlockModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'status', type: 'string', interface: 'select', uiSchema: { enum: [] } },
      ],
    });

    const model = engine.createModel<KanbanBlockModel>({
      uid: 'kanban-manual-refresh',
      use: 'KanbanBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'posts',
          },
        },
      },
    });

    expect(model.isManualRefresh).toBe(true);
  });

  test('kanban block beforeRender does not issue a base list request', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('location', { value: { search: '' } as any });
    engine.registerModels({ KanbanBlockModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'status', type: 'string', interface: 'select', uiSchema: { enum: [] } },
      ],
    });

    const model = engine.createModel<KanbanBlockModel>({
      uid: 'kanban-before-render-refresh',
      use: 'KanbanBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'posts',
          },
        },
      },
    });

    const runActionSpy = vi.spyOn(model.resource, 'runAction');

    await model.dispatchEvent('beforeRender', undefined, { useCache: false });

    expect(runActionSpy).not.toHaveBeenCalled();
  });

  test('does not fall back to a default scoped sort field when none is selected explicitly', () => {
    const sortField = KanbanBlockModel.prototype.getSortFieldName.call({
      props: {
        dragEnabled: true,
      },
      collection: {
        getFields: () => [
          { name: 'status_sort', interface: 'sort', scopeKey: 'status', uiSchema: { title: 'Status sort' } },
          { name: 'manual_sort', interface: 'sort', scopeKey: 'status', uiSchema: { title: 'Manual sort' } },
          { name: 'status', interface: 'select', uiSchema: { title: 'Status' } },
        ],
      },
      getGroupField: () => ({ name: 'status' }),
      getSortFieldName: KanbanBlockModel.prototype.getSortFieldName,
      getConfiguredSortFieldName: KanbanBlockModel.prototype.getConfiguredSortFieldName,
      getCompatibleSortFieldName: KanbanBlockModel.prototype.getCompatibleSortFieldName,
      getSortFieldCandidates: KanbanBlockModel.prototype.getSortFieldCandidates,
    });

    expect(sortField).toBeUndefined();
  });

  test('dragging uiSchema exposes the merged drag switch before sort field selection', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.dragging;
    const schema = step.uiSchema({
      model: {
        collection: {
          name: 'posts',
          dataSourceKey: 'main',
          getFields: () => [],
        },
        getGroupField: () => ({ name: 'status', title: 'Status', uiSchema: { title: 'Status' } }),
        getSortFieldCandidates: () => [],
      },
      t: (value: string) => value,
    } as any);

    expect(Object.keys(schema)).toEqual(['dragEnabled', 'sortField']);
    expect(schema.sortField.required).toBe(false);
    expect(schema.sortField['x-reactions']).toEqual([
      {
        dependencies: ['.dragEnabled'],
        fulfill: {
          state: {
            required: '{{$deps[0] === true}}',
          },
        },
      },
    ]);
  });

  test('dragging uiSchema uses the quick-create sort selector with scoped sort options and plain field metadata', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.dragging;
    const cyclicalField: any = {
      name: 'priority',
      interface: 'integer',
      scopeKey: 'status',
      uiSchema: { title: 'Priority' },
    };
    cyclicalField.self = cyclicalField;
    const schema = step.uiSchema({
      model: {
        collection: {
          name: 'posts',
          dataSourceKey: 'main',
          getFields: () => [cyclicalField],
        },
        getGroupField: () => ({ name: 'status', title: 'Status', uiSchema: { title: 'Status' } }),
        getSortFieldCandidates: () => [{ label: 'Status sort', value: 'status_sort', scopeKey: 'status' }],
      },
      t: (value: string) => value,
    } as any);

    expect(schema.sortField['x-component']).toBe(KanbanCreateSortFieldSelect);
    expect(schema.sortField['x-component-props']).toMatchObject({
      collectionName: 'posts',
      dataSource: 'main',
      groupField: { label: 'Status', value: 'status' },
      sortFields: [{ label: 'Status sort', value: 'status_sort', scopeKey: 'status' }],
      collectionFields: [
        {
          name: 'priority',
          interface: 'integer',
          scopeKey: 'status',
          uiSchema: { title: 'Priority' },
        },
      ],
    });
  });
});
