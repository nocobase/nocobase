/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { KanbanBlockModel } from '../models';
import { KanbanCardItemModel } from '../models/KanbanCardItemModel';
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

  test('accepts collections that have no supported grouping fields', () => {
    expect(
      KanbanBlockModel.filterCollection({
        filterTargetKey: 'id',
        getFields: () => [{ name: 'title', interface: 'input' }],
      } as any),
    ).toBe(true);
  });

  test('accepts collections whose only grouping candidates are multi-value relations', () => {
    expect(
      KanbanBlockModel.filterCollection({
        filterTargetKey: 'id',
        getFields: () => [{ name: 'watchers', interface: 'm2m' }],
      } as any),
    ).toBe(true);
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
      grouping: {
        groupField: undefined,
        groupTitleField: undefined,
        groupColorField: undefined,
        groupOptions: undefined,
        dragEnabled: false,
        dragSortBy: null,
      },
    });
  });

  test('grouping defaultParams keep current block grouping config when editing an existing block', () => {
    const statusField = {
      name: 'status',
      interface: 'select',
      uiSchema: {
        enum: [
          { value: 'todo', label: 'Todo' },
          { value: 'done', label: 'Done' },
        ],
      },
    };
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;

    expect(
      step.defaultParams({
        model: {
          props: {
            groupField: 'status',
            groupOptions: [
              { value: 'done', label: 'Done' },
              { value: 'todo', label: 'Todo' },
            ],
          },
          collection: {
            getField: (name: string) => (name === 'status' ? statusField : undefined),
          },
          getConfiguredGroupOptions: () => [
            { value: 'done', label: 'Done' },
            { value: 'todo', label: 'Todo' },
          ],
        },
      } as any),
    ).toEqual({
      grouping: {
        groupField: 'status',
        groupTitleField: undefined,
        groupColorField: undefined,
        groupOptions: [
          { value: 'done', label: 'Done' },
          { value: 'todo', label: 'Todo' },
        ],
        dragEnabled: false,
        dragSortBy: null,
      },
    });
  });

  test('grouping uiSchema requires at least one option before save', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;
    const schema = step.uiSchema({
      model: {
        uid: 'kanban-1',
        getGroupFieldCandidates: () => [{ label: 'Status', value: 'status' }],
        translate: (key: string, options?: any) => (options?.ns === 'kanban' ? `zh:${key}` : key),
      },
      collection: { name: 'posts', getFields: () => [], getField: () => undefined },
    } as any);

    expect(schema.grouping).toMatchObject({
      type: 'object',
      required: true,
      properties: {
        groupField: {
          required: true,
          'x-component': 'Select',
        },
        groupTitleField: {
          required: true,
          'x-component': 'Select',
        },
        groupOptions: {
          required: true,
          'x-component': 'KanbanGroupingSelector',
        },
        dragEnabled: {
          title: '{{t("Enable drag and drop sorting", {"ns":"kanban"})}}',
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
        dragSortBy: {
          title: '{{t("Drag and drop sorting field", {"ns":"kanban"})}}',
          'x-component': 'KanbanCreateSortFieldSelect',
          'x-decorator': 'FormItem',
          'x-decorator-props': {
            tooltip:
              '{{t("Choose the sorting field that matches the current grouping field. Other sorting fields cannot be used for drag sorting.", {"ns":"kanban"})}}',
          },
        },
      },
    });
    expect(typeof schema.grouping.properties.groupOptions['x-validator']).toBe('function');
    expect(
      schema.grouping.properties.groupOptions['x-validator']([], undefined, { field: { selfModified: false } }),
    ).toBeUndefined();
    expect(
      schema.grouping.properties.groupOptions['x-validator']([], undefined, {
        field: { selfModified: false, modified: true, form: { submitting: false } },
      }),
    ).toBeUndefined();
    expect(
      schema.grouping.properties.groupOptions['x-validator']([], undefined, {
        field: { selfModified: true, form: { submitting: false } },
      }),
    ).toBe('zh:At least one option is required');
  });

  test('card click uses flow context openView with the latest card-item props', async () => {
    const openView = vi.fn().mockResolvedValue(undefined);
    const ensureCardViewAction = vi.fn().mockResolvedValue({ uid: 'card-view-action' });

    await KanbanBlockModel.prototype.openCard.call(
      {
        context: {
          openView,
          layoutContentElement: { id: 'layout-root' },
        },
        subModels: {
          item: {
            getProps: () => ({ enableCardClick: true }),
            props: { enableCardClick: false },
          },
        },
        collection: {
          getFilterByTK: (record: any) => record.id,
          filterTargetKey: 'id',
        },
        ensureCardViewAction,
        getCardOpenMode: () => 'dialog',
        isCardClickable: KanbanBlockModel.prototype.isCardClickable,
      },
      { id: 1 },
    );

    expect(ensureCardViewAction).toHaveBeenCalledTimes(1);
    expect(openView).toHaveBeenCalledWith('card-view-action', {
      mode: 'dialog',
      filterByTk: 1,
      navigation: false,
      target: { id: 'layout-root' },
    });
  });

  test('configured select grouping keeps enum colors from the collection field', () => {
    const options = KanbanBlockModel.prototype.getConfiguredGroupOptions.call({
      props: {
        groupOptions: [
          { value: 'done', label: 'Done' },
          { value: 'todo', label: 'Todo' },
        ],
      },
      getGroupField: () => ({
        name: 'status',
        interface: 'select',
        uiSchema: {
          enum: [
            { value: 'todo', label: 'Todo', color: 'blue' },
            { value: 'done', label: 'Done', color: 'green' },
          ],
        },
      }),
      getInlineGroupOptions: KanbanBlockModel.prototype.getInlineGroupOptions,
    });

    expect(options).toEqual([
      { value: 'done', label: 'Done', color: 'green', isUnknown: undefined },
      { value: 'todo', label: 'Todo', color: 'blue', isUnknown: undefined },
    ]);
  });

  test('syncPopupAction persists pageModelClass alongside other popup settings', async () => {
    const setStepParams = vi.fn();

    await KanbanBlockModel.prototype.syncPopupAction.call(
      {
        context: { flowSettingsEnabled: false },
      },
      {
        getStepParams: () => ({ mode: 'drawer' }),
        setStepParams,
      },
      {
        mode: 'dialog',
        size: 'large',
        popupTemplateUid: 'template-1',
        uid: 'popup-1',
        pageModelClass: 'PopupPageModel',
      },
    );

    expect(setStepParams).toHaveBeenCalledWith('popupSettings', 'openView', {
      mode: 'dialog',
      size: 'large',
      popupTemplateUid: 'template-1',
      uid: 'popup-1',
      pageModelClass: 'PopupPageModel',
    });
  });

  test('syncPopupAction overwrites removed popup settings with undefined so stale template params do not survive merges', async () => {
    const setStepParams = vi.fn();

    await KanbanBlockModel.prototype.syncPopupAction.call(
      {
        context: { flowSettingsEnabled: false },
      },
      {
        uid: 'kanban-quick-create-action',
        getStepParams: () => ({
          mode: 'drawer',
          size: 'medium',
          popupTemplateUid: 'template-1',
          pageModelClass: 'PopupPageModel',
        }),
        setStepParams,
      },
      {
        mode: 'drawer',
        size: 'medium',
      },
    );

    expect(setStepParams).toHaveBeenCalledWith('popupSettings', 'openView', {
      mode: 'drawer',
      size: 'medium',
      popupTemplateUid: undefined,
      pageModelClass: undefined,
      uid: 'kanban-quick-create-action',
    });
  });

  test('syncPopupAction drops stale template-derived popup params after the template is cleared', async () => {
    const setStepParams = vi.fn();

    await KanbanBlockModel.prototype.syncPopupAction.call(
      {
        uid: 'kanban-block-1',
        context: { flowSettingsEnabled: false },
      },
      {
        uid: 'kanban-block-1-quick-create-action',
        getStepParams: () => ({
          mode: 'drawer',
          size: 'medium',
          popupTemplateUid: 'template-1',
          uid: 'template-popup-1',
          dataSourceKey: 'secondary',
          collectionName: 'archived_tasks',
          associationName: 'users.tasks',
          popupTemplateContext: true,
        }),
        setStepParams,
      },
      {
        mode: 'drawer',
        size: 'medium',
        uid: 'template-popup-1',
      },
    );

    expect(setStepParams).toHaveBeenCalledWith('popupSettings', 'openView', {
      mode: 'drawer',
      size: 'medium',
      popupTemplateUid: undefined,
      pageModelClass: undefined,
      uid: 'kanban-block-1-quick-create-action',
    });
  });

  test('popup settings handler clears a stale popup target uid when removing the popup template', async () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.popup;
    const ensureQuickCreateAction = vi.fn().mockResolvedValue({ uid: 'quick-create-action' });
    const syncQuickCreateAction = vi.fn().mockResolvedValue(undefined);
    const setProps = vi.fn();

    await step.handler(
      {
        model: {
          props: {
            popupTemplateUid: 'template-1',
            popupTargetUid: 'template-popup-1',
          },
          getPopupTemplateUid: () => 'template-1',
          getPopupTargetUid: () => 'template-popup-1',
          setProps,
          ensureQuickCreateAction,
          syncQuickCreateAction,
        },
      } as any,
      {
        mode: 'drawer',
        size: 'medium',
        uid: 'template-popup-1',
      },
    );

    expect(setProps).toHaveBeenCalledWith({
      popupMode: 'drawer',
      popupSize: 'medium',
      popupTemplateUid: undefined,
      popupPageModelClass: undefined,
      popupTargetUid: undefined,
    });
  });

  test('popup settings beforeParamsSave clears stale popup target uid on the actual settings save path', async () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.popup;
    const setProps = vi.fn(function (this: any, nextProps) {
      Object.assign(this.props, nextProps);
    });
    const setStepParams = vi.fn();
    const action = {
      uid: 'quick-create-action',
      getStepParams: () => ({
        mode: 'drawer',
        size: 'medium',
        popupTemplateUid: 'template-1',
        uid: 'template-popup-1',
      }),
      setStepParams,
    };
    const model: any = {
      props: {
        popupTemplateUid: 'template-1',
        popupTargetUid: 'template-popup-1',
      },
      stepParams: {
        kanbanSettings: {
          popup: {
            popupTemplateUid: 'template-1',
            uid: 'template-popup-1',
          },
        },
      },
      context: { flowSettingsEnabled: false },
      emitter: { emit: vi.fn() },
      setProps,
      getPopupTemplateUid() {
        return this.props.popupTemplateUid;
      },
      getPopupTargetUid() {
        return this.props.popupTargetUid;
      },
      getAction: () => ({ beforeParamsSave: vi.fn().mockResolvedValue(undefined) }),
      ensureQuickCreateAction: vi.fn().mockResolvedValue(action),
      syncQuickCreateAction: KanbanBlockModel.prototype.syncQuickCreateAction,
      syncPopupAction: KanbanBlockModel.prototype.syncPopupAction,
      getPopupMode: () => 'drawer',
      getPopupSize: () => 'medium',
      getPopupPageModelClass: () => undefined,
      getQuickCreateActionUid: () => 'quick-create-action',
      uid: 'kanban-block-1',
    };

    await step.beforeParamsSave(
      {
        model,
      } as any,
      {
        mode: 'drawer',
        size: 'medium',
        uid: 'template-popup-1',
      },
      {
        popupTemplateUid: 'template-1',
        uid: 'template-popup-1',
      },
    );

    expect(model.props.popupTargetUid).toBeUndefined();
    expect(model.stepParams.kanbanSettings.popup.uid).toBeUndefined();
    expect(setStepParams).toHaveBeenCalledWith('popupSettings', 'openView', {
      mode: 'drawer',
      size: 'medium',
      popupTemplateUid: undefined,
      pageModelClass: undefined,
      uid: 'quick-create-action',
    });
  });

  test('card popup getter treats an explicitly cleared item template as higher priority than legacy block props', () => {
    expect(
      KanbanBlockModel.prototype.getCardPopupTemplateUid.call({
        subModels: {
          item: {
            props: { popupTemplateUid: undefined },
            getProps: () => ({ popupTemplateUid: undefined }),
          },
        },
        props: {
          cardPopupTemplateUid: 'legacy-template',
        },
      }),
    ).toBeUndefined();
  });

  test('card popup settings sync pageModelClass back to the parent card-view action', async () => {
    const ensureCardViewAction = vi.fn().mockResolvedValue({ uid: 'card-view-action' });
    const syncCardViewAction = vi.fn().mockResolvedValue(undefined);
    const parentModel = {
      props: {},
      setProps: vi.fn(function (this: any, nextProps) {
        Object.assign(this.props, nextProps);
      }),
      ensureCardViewAction,
      syncCardViewAction,
      subModels: {},
    };
    const itemModel = {
      props: {},
      parent: parentModel,
      setProps: vi.fn(function (this: any, nextProps) {
        Object.assign(this.props, nextProps);
      }),
    };

    const flow: any = (KanbanCardItemModel as any).globalFlowRegistry.getFlow('cardSettings');
    await flow.steps.popup.handler(
      {
        model: itemModel,
      } as any,
      {
        mode: 'dialog',
        size: 'large',
        popupTemplateUid: 'template-1',
        pageModelClass: 'PopupPageModel',
        uid: 'popup-1',
      },
    );

    expect(itemModel.props).toMatchObject({
      openMode: 'dialog',
      popupSize: 'large',
      popupTemplateUid: 'template-1',
      pageModelClass: 'PopupPageModel',
      popupTargetUid: 'popup-1',
    });
    expect(parentModel.props).toMatchObject({
      cardPopupPageModelClass: 'PopupPageModel',
    });
    expect(ensureCardViewAction).toHaveBeenCalledTimes(1);
    expect(syncCardViewAction).toHaveBeenCalledWith({ uid: 'card-view-action' });
  });

  test('grouping uiSchema does not embed cyclical runtime objects in component props', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;
    const model = { uid: 'kanban-1' };
    const collection = { name: 'posts', getFields: () => [], getField: () => undefined };
    const schema = step.uiSchema({ model, collection, dataSource: { key: 'main' } } as any);

    expect(schema).toEqual({
      grouping: {
        type: 'object',
        required: true,
        properties: {
          groupField: {
            type: 'string',
            title: '{{t("Grouping field", {"ns":"kanban"})}}',
            required: true,
            enum: [],
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip:
                '{{t("Single select and many-to-one fields can be used as the grouping field", {"ns":"kanban"})}}',
            },
            'x-component-props': {
              options: [],
            },
            'x-reactions': expect.any(Array),
          },
          groupTitleField: {
            type: 'string',
            title: '{{t("Title field", {"ns":"kanban"})}}',
            required: true,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-reactions': expect.any(Array),
          },
          groupColorField: {
            type: 'string',
            title: '{{t("Color field", {"ns":"kanban"})}}',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-component-props': {
              allowClear: true,
            },
            'x-reactions': expect.any(Array),
          },
          groupOptions: {
            type: 'array',
            title: '{{t("Select group values", {"ns":"kanban"})}}',
            required: true,
            'x-component': 'KanbanGroupingSelector',
            'x-decorator': 'FormItem',
            'x-validator': expect.any(Function),
            'x-reactions': expect.any(Array),
          },
          dragEnabled: {
            type: 'boolean',
            title: '{{t("Enable drag and drop sorting", {"ns":"kanban"})}}',
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
            'x-reactions': expect.any(Array),
          },
          dragSortBy: {
            type: 'string',
            title: '{{t("Drag and drop sorting field", {"ns":"kanban"})}}',
            'x-component': 'KanbanCreateSortFieldSelect',
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip:
                '{{t("Choose the sorting field that matches the current grouping field. Other sorting fields cannot be used for drag sorting.", {"ns":"kanban"})}}',
            },
            'x-component-props': {
              allowClear: true,
              useGroupingFormValues: true,
            },
            'x-reactions': expect.any(Array),
          },
        },
      },
    });
  });

  test('grouping options stay visible but disabled until grouping field is selected', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;
    const schema = step.uiSchema({
      model: {
        getGroupFieldCandidates: () => [{ label: 'Status', value: 'status' }],
      },
      collection: {
        name: 'tasks',
        getField: () => undefined,
        getFields: () => [],
      },
    } as any);

    expect(schema.grouping.properties.groupOptions['x-reactions']).toEqual([
      {
        dependencies: ['.groupField'],
        fulfill: {
          state: {
            disabled: '{{!$deps[0]}}',
          },
        },
      },
    ]);
  });

  test('grouping settings helper text uses tooltip consistently', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;
    const schema = step.uiSchema({
      model: {
        getGroupFieldCandidates: () => [{ label: 'Status', value: 'status' }],
        translate: (key: string, options?: any) => (options?.ns === 'kanban' ? `中文:${key}` : key),
      },
      collection: {
        name: 'tasks',
        getField: () => undefined,
        getFields: () => [],
      },
    } as any);

    expect(schema.grouping.properties.groupField.description).toBeUndefined();
    expect(schema.grouping.properties.groupField['x-decorator-props']).toMatchObject({
      tooltip: '{{t("Single select and many-to-one fields can be used as the grouping field", {"ns":"kanban"})}}',
    });
    expect(schema.grouping.properties.groupOptions.description).toBeUndefined();
    expect(schema.grouping.properties.groupOptions['x-decorator-props']).toBeUndefined();
    expect(schema.grouping.properties.dragSortBy['x-decorator-props']).toMatchObject({
      tooltip:
        '{{t("Choose the sorting field that matches the current grouping field. Other sorting fields cannot be used for drag sorting.", {"ns":"kanban"})}}',
    });
  });

  test('grouping drag sort field keeps quick-create context out of formily reactions', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;
    const schema = step.uiSchema({
      model: {
        getGroupFieldCandidates: () => [{ label: 'Status', value: 'status' }],
      },
      collection: {
        name: 'tasks',
        dataSourceKey: 'main',
        getField: () => undefined,
        getFields: () => [],
      },
    } as any);

    expect(schema.grouping.properties.dragSortBy['x-component-props']).toEqual({
      allowClear: true,
      useGroupingFormValues: true,
    });
    expect(schema.grouping.properties.dragSortBy['x-reactions']).toEqual([
      {
        dependencies: ['.dragEnabled'],
        fulfill: {
          state: {
            hidden: '{{!$deps[0]}}',
            required: '{{$deps[0]}}',
          },
        },
      },
    ]);
  });

  test('style and sorting settings expose inline menu controls while using the common default sorting modal', async () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const inlineStyleMode = await flow.steps.styleVariant.uiMode({ model: {} } as any);
    const inlineDragSortMode = await flow.steps.dragSortBy.uiMode({
      model: {
        getSortFieldCandidates: () => [{ label: 'Status sort', value: 'status_sort' }],
        getGroupField: () => ({ name: 'status' }),
        translate: (key: string, options?: any) => (options?.ns === 'kanban' ? `kanban:${key}` : key),
      },
    } as any);
    expect(flow.steps.defaultSorting).toMatchObject({
      use: 'sortingRule',
      title: '{{t("Default sorting")}}',
    });
    expect(flow.steps.dragEnabled.uiMode).toEqual({ type: 'switch', key: 'dragEnabled' });
    expect(inlineDragSortMode).toMatchObject({
      type: 'select',
      key: 'dragSortBy',
      props: {
        options: [{ label: 'Status sort', value: 'status_sort' }],
        allowClear: true,
        tooltip:
          'kanban:Choose the sorting field that matches the current grouping field. Other sorting fields cannot be used for drag sorting.',
      },
    });
    expect(
      flow.steps.dragSortBy.hideInSettings({
        model: {
          props: {},
          getDragEnabled: () => false,
          getDragSortFieldName: () => undefined,
        },
      } as any),
    ).toBe(true);
    expect(flow.steps.sorting).toBeUndefined();
  });

  test('drag sort field settings include saved field before collection field cache refreshes', async () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.dragSortBy;
    const model: any = {
      props: {
        dragEnabled: true,
        dragSortBy: 'status_sort',
      },
      getDragEnabled: () => true,
      getDragSortFieldName: () => 'status_sort',
      getSortFieldCandidates: () => [],
      getGroupField: () => ({ name: 'status' }),
      translate: (key: string) => key,
    };

    expect(step.uiSchema({ model }).dragSortBy.enum).toEqual([
      {
        label: 'status_sort',
        value: 'status_sort',
      },
    ]);
    expect((await step.uiMode({ model })).props.options).toEqual([
      {
        label: 'status_sort',
        value: 'status_sort',
      },
    ]);
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

  test('card popup settings still read persisted item props when getProps is empty', () => {
    const popupTargetUid = KanbanBlockModel.prototype.getCardPopupTargetUid.call({
      subModels: {
        item: {
          getProps: () => ({}),
          props: { popupTargetUid: 'popup-card-1' },
        },
      },
      props: {
        cardPopupTargetUid: 'popup-card-block',
      },
    });

    expect(popupTargetUid).toBe('popup-card-1');
  });

  test('configured inline group options reuse datasource enum colors', () => {
    const statusField = {
      name: 'status',
      interface: 'select',
      uiSchema: {
        enum: [
          { value: 'todo', label: 'Todo', color: 'blue' },
          { value: 'done', label: 'Done', color: 'green' },
        ],
      },
    };

    const groupOptions = KanbanBlockModel.prototype.getConfiguredGroupOptions.call({
      props: {
        groupOptions: [{ value: 'done', label: 'Done' }],
      },
      getGroupField: () => statusField,
      getInlineGroupOptions: KanbanBlockModel.prototype.getInlineGroupOptions,
    });

    expect(groupOptions).toEqual([{ value: 'done', label: 'Done', color: 'green', isUnknown: undefined }]);
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
      getConfiguredDragSortFieldName: KanbanBlockModel.prototype.getConfiguredDragSortFieldName,
      getCompatibleSortFieldName: KanbanBlockModel.prototype.getCompatibleSortFieldName,
      getSortFieldCandidates: KanbanBlockModel.prototype.getSortFieldCandidates,
      getDragSortFieldName: KanbanBlockModel.prototype.getDragSortFieldName,
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
      getDragSortFieldName: () => undefined,
    });

    expect(canDragSort).toBe(false);
  });

  test('drag sorting field becomes visible as soon as drag sorting is enabled', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.dragSortBy;

    expect(step.defaultParams({ model: { props: {}, getDragSortFieldName: () => undefined } } as any)).toEqual({
      dragSortBy: null,
    });
    expect(
      step.hideInSettings({
        model: {
          props: { dragEnabled: true },
          getDragEnabled: () => true,
          getDragSortFieldName: () => undefined,
          getStepParams: () => ({ dragEnabled: true }),
        },
      } as any),
    ).toBe(false);
  });

  test('drag sort field updates the resource sort and refreshes immediately', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.dragSortBy;
    const setProps = vi.fn();
    const setSort = vi.fn();
    const refresh = vi.fn().mockResolvedValue(undefined);

    step.handler(
      {
        model: {
          setProps,
          getCompatibleSortFieldName: () => 'status_sort',
          getDragEnabled: () => true,
          getDragSortFieldName: () => 'status_sort',
          getConfiguredGlobalSort: () => [],
          resource: {
            setSort,
            refresh,
          },
        },
      } as any,
      {
        dragSortBy: 'status_sort',
      },
    );

    expect(setProps).toHaveBeenCalledWith({
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(setSort).toHaveBeenCalledWith(['status_sort']);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  test('drag switch updates grouping settings params when disabled from block settings', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.dragEnabled;
    const setProps = vi.fn();
    const setSort = vi.fn();
    const emitter = {
      emit: vi.fn(),
    };
    const model: any = {
      props: {
        dragEnabled: true,
        dragSortBy: 'status_sort',
      },
      stepParams: {
        kanbanSettings: {
          grouping: {
            grouping: {
              groupField: 'status',
              groupOptions: [],
              dragEnabled: true,
              dragSortBy: 'status_sort',
            },
          },
        },
      },
      emitter,
      setProps,
      getDragEnabled: () => true,
      getDragSortFieldName: () => 'status_sort',
      getGroupField: () => ({ name: 'status' }),
      getCompatibleSortFieldName: () => 'status_sort',
      getConfiguredGlobalSort: () => [],
      resource: {
        setSort,
        refresh: vi.fn(),
      },
    };

    step.handler(
      {
        model,
      } as any,
      {
        dragEnabled: false,
      },
    );

    expect(setProps).toHaveBeenCalledWith({
      dragEnabled: false,
      dragSortBy: 'status_sort',
    });
    expect(setSort).toHaveBeenCalledWith([]);
    expect(model.stepParams.kanbanSettings.dragEnabled).toEqual({ dragEnabled: false });
    expect(model.stepParams.kanbanSettings.dragSortBy).toEqual({ dragSortBy: 'status_sort' });
    expect(model.stepParams.kanbanSettings.grouping.grouping).toMatchObject({
      dragEnabled: false,
      dragSortBy: 'status_sort',
    });
    expect(emitter.emit).toHaveBeenCalledWith('onStepParamsChanged');
  });

  test('create preset drag switch keeps grouping drag sorting values when syncing block settings', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.dragEnabled;
    const setProps = vi.fn();
    const setSort = vi.fn();
    const model: any = {
      props: {
        dragEnabled: false,
      },
      _options: {
        props: {
          dragEnabled: false,
        },
      },
      stepParams: {
        kanbanSettings: {
          grouping: {
            grouping: {
              groupField: 'status',
              groupOptions: [],
              dragEnabled: true,
              dragSortBy: 'status_sort',
            },
          },
        },
      },
      emitter: {
        emit: vi.fn(),
      },
      setProps,
      getDragEnabled: () => false,
      getDragSortFieldName: () => undefined,
      getGroupField: () => ({ name: 'status' }),
      getCompatibleSortFieldName: () => 'status_sort',
      getConfiguredGlobalSort: () => [],
      resource: {
        setSort,
      },
    };

    step.beforeParamsSave(
      {
        model,
        getStepFormValues: () => ({
          grouping: {
            groupField: 'status',
            groupOptions: [],
            dragEnabled: true,
            dragSortBy: 'status_sort',
          },
        }),
      } as any,
      {
        dragEnabled: false,
      },
    );

    expect(setProps).toHaveBeenCalledWith({
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(model._options.props).toMatchObject({
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(model.stepParams.kanbanSettings.dragEnabled).toEqual({ dragEnabled: true });
    expect(model.stepParams.kanbanSettings.dragSortBy).toEqual({ dragSortBy: 'status_sort' });
    expect(model.stepParams.kanbanSettings.grouping.grouping).toMatchObject({
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(setSort).toHaveBeenCalledWith(['status_sort']);
  });

  test('grouping changes keep the drag switch enabled even when the grouping sort field is missing', () => {
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
          getConfiguredDragSortFieldName: () => undefined,
          getCompatibleSortFieldName: () => undefined,
        },
      } as any,
      {
        grouping: {
          groupField: 'status',
          groupOptions: [],
        },
      },
    );

    expect(setProps).toHaveBeenCalledWith({
      groupField: 'status',
      groupTitleField: undefined,
      groupColorField: undefined,
      groupOptions: [],
      dragSortBy: undefined,
      dragEnabled: true,
    });
    expect(setSort).toHaveBeenCalledWith([]);
  });

  test('grouping settings sync drag sorting options with block settings', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;
    const setProps = vi.fn();
    const setSort = vi.fn();
    const emitter = {
      emit: vi.fn(),
    };
    const model: any = {
      collection: {
        getField: (name: string) => (name === 'status' ? { name: 'status', interface: 'select' } : undefined),
      },
      resource: {
        setSort,
      },
      setProps,
      emitter,
      getDragEnabled: () => false,
      getConfiguredDragSortFieldName: () => undefined,
      getConfiguredGlobalSort: () => [],
      getCompatibleSortFieldName: (sortFieldName: string, groupFieldName: string) =>
        groupFieldName === 'status' && sortFieldName === 'status_sort' ? 'status_sort' : undefined,
    };

    step.handler(
      {
        model,
      } as any,
      {
        grouping: {
          groupField: 'status',
          groupOptions: [],
          dragEnabled: true,
          dragSortBy: 'status_sort',
        },
      },
    );

    expect(setProps).toHaveBeenCalledWith({
      groupField: 'status',
      groupTitleField: undefined,
      groupColorField: undefined,
      groupOptions: [],
      dragSortBy: 'status_sort',
      dragEnabled: true,
    });
    expect(setSort).toHaveBeenCalledWith(['status_sort']);
    expect(model.stepParams.kanbanSettings.dragEnabled).toEqual({ dragEnabled: true });
    expect(model.stepParams.kanbanSettings.dragSortBy).toEqual({ dragSortBy: 'status_sort' });
    expect(emitter.emit).toHaveBeenCalledWith('onStepParamsChanged');
  });

  test('create preset keeps quick-created drag sort field before collection field cache refreshes', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.grouping;
    const setProps = vi.fn();
    const setSort = vi.fn();
    const model: any = {
      isNew: true,
      collection: {
        getField: (name: string) => (name === 'status' ? { name: 'status', interface: 'select' } : undefined),
      },
      stepParams: {
        kanbanSettings: {
          grouping: {
            grouping: {
              groupField: 'status',
              groupOptions: [],
              dragEnabled: true,
              dragSortBy: 'status_sort',
            },
          },
        },
      },
      resource: {
        setSort,
      },
      setProps,
      emitter: {
        emit: vi.fn(),
      },
      getDragEnabled: () => false,
      getConfiguredDragSortFieldName: () => undefined,
      getConfiguredGlobalSort: () => [],
      getCompatibleSortFieldName: () => undefined,
    };

    step.beforeParamsSave(
      {
        model,
      } as any,
      {
        grouping: {
          groupField: 'status',
          groupOptions: [],
          dragEnabled: true,
          dragSortBy: 'status_sort',
        },
      },
    );

    expect(setProps).toHaveBeenCalledWith({
      groupField: 'status',
      groupTitleField: undefined,
      groupColorField: undefined,
      groupOptions: [],
      dragSortBy: 'status_sort',
      dragEnabled: true,
    });
    expect(setSort).toHaveBeenCalledWith(['status_sort']);
    expect(model.stepParams.kanbanSettings.dragEnabled).toEqual({ dragEnabled: true });
    expect(model.stepParams.kanbanSettings.dragSortBy).toEqual({ dragSortBy: 'status_sort' });
    expect(model.stepParams.kanbanSettings.grouping.grouping).toMatchObject({
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
  });

  test('create preset drag sort step does not override quick-created grouping sort field with empty params', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const groupingStep: any = flow?.steps?.grouping;
    const dragSortByStep: any = flow?.steps?.dragSortBy;
    const setProps = vi.fn();
    const setSort = vi.fn();
    const model: any = {
      isNew: true,
      collection: {
        getField: (name: string) => (name === 'status' ? { name: 'status', interface: 'select' } : undefined),
      },
      stepParams: {},
      resource: {
        setSort,
      },
      setProps,
      emitter: {
        emit: vi.fn(),
      },
      getDragEnabled: () => false,
      getDragSortFieldName: () => undefined,
      getGroupField: () => ({ name: 'status' }),
      getConfiguredDragSortFieldName: () => undefined,
      getConfiguredGlobalSort: () => [],
      getCompatibleSortFieldName: () => undefined,
    };
    const groupingFormValues = {
      grouping: {
        groupField: 'status',
        groupOptions: [],
        dragEnabled: true,
        dragSortBy: 'status_sort',
      },
    };

    model.stepParams.kanbanSettings = {
      grouping: groupingFormValues,
    };
    groupingStep.beforeParamsSave({ model } as any, groupingFormValues);
    dragSortByStep.beforeParamsSave(
      {
        model,
        getStepFormValues: () => groupingFormValues,
      } as any,
      {
        dragSortBy: null,
      },
    );

    expect(model.stepParams.kanbanSettings.dragEnabled).toEqual({ dragEnabled: true });
    expect(model.stepParams.kanbanSettings.dragSortBy).toEqual({ dragSortBy: 'status_sort' });
    expect(model.stepParams.kanbanSettings.grouping.grouping).toMatchObject({
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(setSort).toHaveBeenLastCalledWith(['status_sort']);
  });

  test('cross-column dragging still works when dragging is enabled from legacy props', () => {
    const canCrossColumnDrag = KanbanBlockModel.prototype.canCrossColumnDrag.call({
      props: {
        allowCrossColumnDrag: true,
        dragEnabled: true,
        dragSortBy: 'status_sort',
        params: {
          sort: ['status_sort'],
        },
      },
      getDragEnabled: KanbanBlockModel.prototype.getDragEnabled,
      getDragSortFieldName: KanbanBlockModel.prototype.getDragSortFieldName,
      getConfiguredSortFieldName: KanbanBlockModel.prototype.getConfiguredSortFieldName,
      getConfiguredDragSortFieldName: KanbanBlockModel.prototype.getConfiguredDragSortFieldName,
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
    engine.context.defineProperty('route', { value: { params: {} } as any });
    engine.registerModels({ KanbanBlockModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    expect(ds).toBeDefined();

    if (!ds) {
      return;
    }

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
    engine.context.defineProperty('route', { value: { params: {} } as any });
    engine.registerModels({ KanbanBlockModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    expect(ds).toBeDefined();

    if (!ds) {
      return;
    }

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

  test('block popup settings reuse the common popup schema and sync back to kanban props', async () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const syncQuickCreateAction = vi.fn().mockResolvedValue(undefined);
    const ensureQuickCreateAction = vi.fn().mockResolvedValue({ uid: 'quick-create-action' });
    const setProps = vi.fn();
    const step: any = flow?.steps?.popup;
    const defaultParams = await step.defaultParams({
      model: {
        props: {},
        getPopupMode: () => 'dialog',
        getPopupSize: () => 'large',
        getPopupTemplateUid: () => 'tpl-quick-create',
        getPopupTargetUid: () => 'popup-action-1',
        uid: 'kanban-popup-test',
      },
    } as any);

    expect(step.use).toBe('openView');
    expect(defaultParams).toMatchObject({
      mode: 'dialog',
      size: 'large',
      popupTemplateUid: 'tpl-quick-create',
      uid: 'popup-action-1',
    });

    await step.handler(
      {
        model: {
          setProps,
          ensureQuickCreateAction,
          syncQuickCreateAction,
        },
      } as any,
      {
        mode: 'embed',
        size: 'small',
        popupTemplateUid: 'tpl-quick-create',
        uid: 'popup-action-1',
      },
    );

    expect(setProps).toHaveBeenCalledWith({
      popupMode: 'embed',
      popupSize: 'small',
      popupTemplateUid: 'tpl-quick-create',
      popupTargetUid: 'popup-action-1',
    });
    expect(ensureQuickCreateAction).toHaveBeenCalledTimes(1);
    expect(syncQuickCreateAction).toHaveBeenCalledWith({ uid: 'quick-create-action' });
  });

  test('block popup settings do not default the popup target uid back to the kanban block itself', async () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.popup;

    const defaultParams = await step.defaultParams({
      model: {
        uid: 'kanban-popup-test',
        props: {},
        getPopupMode: () => 'drawer',
        getPopupSize: () => 'medium',
        getPopupTemplateUid: () => undefined,
        getPopupTargetUid: () => undefined,
      },
    } as any);

    expect(defaultParams.uid).toBeUndefined();
  });

  test('syncPopupAction falls back to the popup action uid when the target uid resolves to the kanban block itself', async () => {
    const setStepParams = vi.fn();

    await KanbanBlockModel.prototype.syncPopupAction.call(
      {
        uid: 'kanban-block-1',
        context: { flowSettingsEnabled: false },
      },
      {
        uid: 'kanban-block-1-quick-create-action',
        getStepParams: () => ({ mode: 'drawer', uid: 'kanban-block-1' }),
        setStepParams,
      },
      {
        mode: 'drawer',
        size: 'medium',
        uid: 'kanban-block-1',
      },
    );

    expect(setStepParams).toHaveBeenCalledWith('popupSettings', 'openView', {
      mode: 'drawer',
      size: 'medium',
      uid: 'kanban-block-1-quick-create-action',
    });
  });

  test('syncPopupAction keeps the popup action uid when there is no external popup target uid', async () => {
    const setStepParams = vi.fn();

    await KanbanBlockModel.prototype.syncPopupAction.call(
      {
        uid: 'kanban-block-1',
        context: { flowSettingsEnabled: false },
      },
      {
        uid: 'kanban-block-1-quick-create-action',
        getStepParams: () => ({ mode: 'drawer' }),
        setStepParams,
      },
      {
        mode: 'drawer',
        size: 'medium',
      },
    );

    expect(setStepParams).toHaveBeenCalledWith('popupSettings', 'openView', {
      mode: 'drawer',
      size: 'medium',
      uid: 'kanban-block-1-quick-create-action',
    });
  });

  test('quick create uses flow context openView with the prefilled form data', async () => {
    const openView = vi.fn().mockResolvedValue(undefined);
    const ensureQuickCreateAction = vi.fn().mockResolvedValue({ uid: 'quick-create-action' });

    await KanbanBlockModel.prototype.openQuickCreate.call(
      {
        context: {
          openView,
          layoutContentElement: { id: 'layout-root' },
        },
        props: {
          quickCreateEnabled: true,
        },
        getQuickCreateEnabled: KanbanBlockModel.prototype.getQuickCreateEnabled,
        ensureQuickCreateAction,
        buildQuickCreateFormData: () => ({ status: 'todo' }),
      },
      { value: 'todo' },
    );

    expect(ensureQuickCreateAction).toHaveBeenCalledTimes(1);
    expect(openView).toHaveBeenCalledWith('quick-create-action', {
      formData: { status: 'todo' },
      navigation: false,
      target: { id: 'layout-root' },
    });
  });

  test('quick create falls back to an empty popup shell when the popup action open fails', async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    const openView = vi.fn().mockRejectedValue(new Error('open failed'));
    const ensureQuickCreateAction = vi.fn().mockResolvedValue({ uid: 'quick-create-action' });

    await KanbanBlockModel.prototype.openQuickCreate.call(
      {
        context: {
          openView,
          viewer: { open },
          layoutContentElement: { id: 'layout-root' },
        },
        translate: (value: string) => value,
        props: {
          quickCreateEnabled: true,
        },
        getQuickCreateEnabled: KanbanBlockModel.prototype.getQuickCreateEnabled,
        getPopupMode: () => 'drawer',
        getPopupSize: () => 'medium',
        openEmptyPopupShell: KanbanBlockModel.prototype.openEmptyPopupShell,
        ensureQuickCreateAction,
        buildQuickCreateFormData: () => ({ status: 'todo' }),
      },
      { value: 'todo' },
    );

    expect(ensureQuickCreateAction).toHaveBeenCalledTimes(1);
    expect(openView).toHaveBeenCalledWith('quick-create-action', {
      formData: { status: 'todo' },
      navigation: false,
      target: { id: 'layout-root' },
    });
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drawer',
        width: '50%',
        target: { id: 'layout-root' },
        title: 'Add new',
      }),
    );
  });

  test('card click falls back to an empty popup shell when the popup action open fails', async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    const openView = vi.fn().mockRejectedValue(new Error('open failed'));
    const ensureCardViewAction = vi.fn().mockResolvedValue({ uid: 'card-view-action' });

    await KanbanBlockModel.prototype.openCard.call(
      {
        context: {
          openView,
          viewer: { open },
          layoutContentElement: { id: 'layout-root' },
        },
        translate: (value: string) => value,
        collection: {
          getFilterByTK: (record: any) => record.id,
          filterTargetKey: 'id',
        },
        getCardOpenMode: () => 'dialog',
        getCardPopupSize: () => 'large',
        isCardClickable: () => true,
        openEmptyPopupShell: KanbanBlockModel.prototype.openEmptyPopupShell,
        ensureCardViewAction,
      },
      { id: 1 },
    );

    expect(ensureCardViewAction).toHaveBeenCalledTimes(1);
    expect(openView).toHaveBeenCalledWith('card-view-action', {
      mode: 'dialog',
      filterByTk: 1,
      navigation: false,
      target: { id: 'layout-root' },
    });
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dialog',
        width: '80%',
        target: { id: 'layout-root' },
        title: 'Details',
      }),
    );
  });

  test('page size settings use the fixed dropdown options', () => {
    const flow: any = (KanbanBlockModel as any).globalFlowRegistry.getFlow('kanbanSettings');
    const step: any = flow?.steps?.pageSize;

    expect(step.uiSchema.pageSize).toMatchObject({
      enum: [
        { label: '10', value: 10 },
        { label: '20', value: 20 },
        { label: '50', value: 50 },
        { label: '100', value: 100 },
      ],
      'x-component': 'Select',
      'x-decorator': 'FormItem',
    });
  });
});
