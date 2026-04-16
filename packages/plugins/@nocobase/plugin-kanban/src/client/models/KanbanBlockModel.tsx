/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { CollectionBlockModel } from '@nocobase/client';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowSettingsButton,
  MultiRecordResource,
  observer,
  tExpr,
} from '@nocobase/flow-engine';
import { InputNumber, Select, Space, Switch } from 'antd';
import React from 'react';
import { KanbanBlockView } from './components/KanbanBlock';
import { KanbanCreateSortFieldSelect } from './components/KanbanCreateSortFieldSelect';
import { createKanbanCardViewActionOptions } from './actions/KanbanPopupModels';
import {
  DEFAULT_KANBAN_COLUMN_WIDTH,
  DEFAULT_KANBAN_PAGE_SIZE,
  getKanbanCollectionField,
  getKanbanCollectionFieldMetadata,
  getKanbanCollectionFields,
  getKanbanFieldScopeKey,
  getKanbanGroupFieldSortScopeKeys,
  getKanbanGroupFieldCandidates,
  getKanbanInlineGroupOptions,
  isAssociationGroupField,
  isKanbanGroupField,
  isMultipleGroupField,
  normalizeKanbanCardOpenMode,
  normalizeKanbanGroupOptions,
  type KanbanGroupOption,
} from './utils';

const DRAG_HANDLER_TOOLBAR_ITEMS = [
  {
    key: 'drag-handler',
    component: DragHandler as React.ComponentType<any>,
    sort: 1,
  },
];

class KanbanBlockResource extends MultiRecordResource {
  async refresh(): Promise<void> {
    this.clearError();
    this.loading = true;

    try {
      this.emit('refresh');
    } finally {
      this.loading = false;
    }
  }
}

export class KanbanBlockModel extends CollectionBlockModel<{
  subModels: {
    item: any;
    actions?: any[];
    cardViewAction?: any;
  };
}> {
  static scene = 'many' as any;

  isManualRefresh = true;

  defaultProps = {
    dragEnabled: false,
  };

  _defaultCustomModelClasses = {
    CollectionActionGroupModel: 'KanbanCollectionActionGroupModel',
    RecordActionGroupModel: 'RecordActionGroupModel',
    TableColumnModel: 'TableColumnModel',
    TableAssociationFieldGroupModel: 'TableAssociationFieldGroupModel',
    TableCustomColumnModel: 'TableCustomColumnModel',
  };

  static filterCollection(collection: any) {
    if (!super.filterCollection(collection)) {
      return false;
    }

    return !!collection?.getFields?.()?.some?.((field: any) => isKanbanGroupField(field));
  }

  get resource() {
    return super.resource as MultiRecordResource;
  }

  getGroupFieldCandidates() {
    return getKanbanGroupFieldCandidates(this.collection);
  }

  getSortFieldCandidates(groupFieldOrName: any = this.getGroupField()) {
    const scopeKeys =
      typeof groupFieldOrName === 'string' ? [groupFieldOrName] : getKanbanGroupFieldSortScopeKeys(groupFieldOrName);

    return getKanbanCollectionFields(this.collection)
      .filter(
        (field: any) =>
          field?.interface === 'sort' && !field?.target && scopeKeys.includes(getKanbanFieldScopeKey(field)),
      )
      .map((field: any) => ({
        label: field.title || field.uiSchema?.title || field.name,
        value: field.name,
        scopeKey: getKanbanFieldScopeKey(field),
      }));
  }

  getDefaultGroupFieldName() {
    return this.props.groupField || this.getGroupFieldCandidates()[0]?.value;
  }

  getGroupField() {
    const groupFieldName = this.props.groupField || this.getDefaultGroupFieldName();
    return groupFieldName ? this.collection?.getField?.(groupFieldName) : undefined;
  }

  getInlineGroupOptions(field = this.getGroupField()) {
    return getKanbanInlineGroupOptions(field, this.props.groupOptions || []);
  }

  getConfiguredGroupOptions() {
    const currentField = this.getGroupField();
    const inlineOptions = this.getInlineGroupOptions(currentField);
    if (inlineOptions.length) {
      return inlineOptions;
    }
    return normalizeKanbanGroupOptions(this.props.groupOptions || []);
  }

  getPageSize() {
    return this.props.pageSize || DEFAULT_KANBAN_PAGE_SIZE;
  }

  getColumnWidth() {
    return this.props.columnWidth || DEFAULT_KANBAN_COLUMN_WIDTH;
  }

  getConfiguredSortFieldName() {
    if (typeof this.props.sortField === 'string' && this.props.sortField) {
      return this.props.sortField;
    }

    const sortValue = Array.isArray(this.props.params?.sort) ? this.props.params.sort[0] : this.props.params?.sort;
    if (typeof sortValue !== 'string' || !sortValue) {
      return undefined;
    }

    return sortValue.startsWith('-') ? sortValue.slice(1) : sortValue;
  }

  getCompatibleSortFieldName(
    sortFieldName = this.getConfiguredSortFieldName(),
    groupFieldOrName: any = this.getGroupField(),
  ) {
    if (!sortFieldName) {
      return undefined;
    }

    return this.getSortFieldCandidates(groupFieldOrName).find((field: any) => field.value === sortFieldName)?.value;
  }

  getSortFieldName(groupFieldOrName: any = this.getGroupField()) {
    return this.getCompatibleSortFieldName(this.getConfiguredSortFieldName(), groupFieldOrName);
  }

  getDragEnabled() {
    if (typeof this.props.dragEnabled === 'boolean') {
      return this.props.dragEnabled;
    }

    return this.props.dragSort === true || this.props.allowCrossColumnDrag === true;
  }

  getCardOpenMode() {
    const itemOpenMode = this.subModels?.item?.getProps?.()?.openMode ?? this.subModels?.item?.props?.openMode;
    return normalizeKanbanCardOpenMode(itemOpenMode || this.props.cardOpenMode);
  }

  isCardClickable() {
    return this.subModels?.item?.props?.enableCardClick !== false;
  }

  canDragSort() {
    return this.getDragEnabled() && !!this.getSortFieldName();
  }

  canCrossColumnDrag() {
    return this.getDragEnabled() && !!this.getSortFieldName() && !isMultipleGroupField(this.getGroupField());
  }

  getDataLoadingMode(): 'auto' | 'manual' {
    return 'manual';
  }

  createResource() {
    const resource = this.context.createResource(KanbanBlockResource);
    const sortField = this.getSortFieldName();
    if (sortField) {
      resource.setSort([sortField]);
    }

    const groupField = this.getGroupField();
    if (groupField && isAssociationGroupField(groupField)) {
      resource.addAppends(groupField.name);
    }

    return resource;
  }

  renderConfigureActions() {
    return (
      <AddSubModelButton
        key="kanban-actions-add"
        model={this}
        subModelBaseClass={this.getModelClassName('CollectionActionGroupModel')}
        subModelKey="actions"
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  renderActions() {
    const isConfigMode = !!this.context.flowSettingsEnabled;

    if (!isConfigMode && !this.hasSubModel('actions')) {
      return null;
    }

    return (
      <DndProvider>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Space>
            {this.mapSubModels('actions', (action: any) => {
              if (action.props?.position === 'left') {
                return (
                  <FlowModelRenderer
                    key={action.uid}
                    model={action}
                    showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                  />
                );
              }

              return null;
            })}
            <span />
          </Space>
          <Space wrap>
            {this.mapSubModels('actions', (action: any) => {
              if (action.hidden && !isConfigMode) {
                return;
              }

              if (action.props?.position !== 'left') {
                return (
                  <Droppable model={action} key={action.uid}>
                    <FlowModelRenderer
                      model={action}
                      showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                      extraToolbarItems={DRAG_HANDLER_TOOLBAR_ITEMS}
                    />
                  </Droppable>
                );
              }

              return null;
            })}
            {this.renderConfigureActions()}
          </Space>
        </div>
      </DndProvider>
    );
  }

  getPopupActionUid() {
    return `${this.uid}-card-view-action`;
  }

  async syncCardViewAction(action: any) {
    if (!action) {
      return;
    }

    const nextMode = this.getCardOpenMode();
    const currentParams = action.getStepParams?.('popupSettings', 'openView') || {};

    if (currentParams.mode === nextMode) {
      return;
    }

    action.setStepParams('popupSettings', 'openView', {
      ...currentParams,
      mode: nextMode,
    });

    if (this.context.flowSettingsEnabled && action?.saveStepParams) {
      await action.saveStepParams();
    }
  }

  async ensureCardViewAction() {
    let action = this.subModels?.cardViewAction as any;
    if (!action) {
      this.setSubModel('cardViewAction', createKanbanCardViewActionOptions(this.getPopupActionUid()));
      action = this.subModels?.cardViewAction as any;
    }

    if (this.context.flowSettingsEnabled && action?.save) {
      await action.save();
    }

    await this.syncCardViewAction(action);

    return action;
  }

  async openCard(record: any) {
    if (!this.isCardClickable()) {
      return;
    }

    const action = await this.ensureCardViewAction();
    if (!action || !record) {
      return;
    }

    const filterByTk = this.collection?.getFilterByTK?.(record) ?? record?.[this.collection?.filterTargetKey || 'id'];
    if (!filterByTk) {
      return;
    }

    await action.dispatchEvent(
      'click',
      {
        mode: this.getCardOpenMode(),
        filterByTk,
      },
      { debounce: true },
    );
  }

  renderComponent() {
    return <KanbanBlockView model={this} />;
  }
}

KanbanBlockModel.registerFlow({
  key: 'resourceSettings2',
  steps: {},
});

KanbanBlockModel.registerFlow({
  key: 'kanbanSettings',
  sort: 500,
  title: tExpr('Kanban settings', { ns: 'kanban' }),
  steps: {
    grouping: {
      title: tExpr('Grouping settings', { ns: 'kanban' }),
      preset: true,
      uiSchema: (ctx) => ({
        groupField: {
          title: tExpr('Grouping field', { ns: 'kanban' }),
          description: tExpr('Single select and many-to-one fields can be used as the grouping field', {
            ns: 'kanban',
          }),
          enum: ((typeof (ctx.model as KanbanBlockModel | undefined)?.getGroupFieldCandidates === 'function'
            ? (ctx.model as KanbanBlockModel).getGroupFieldCandidates()
            : undefined) || getKanbanGroupFieldCandidates(ctx.collection)) as any,
          'x-component': 'Select',
          'x-decorator': 'FormItem',
        },
        groupOptions: {
          title: tExpr('Options', { ns: 'kanban' }),
          'x-component': 'KanbanGroupOptionsTable',
          'x-decorator': 'FormItem',
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
      }),
      defaultParams: (ctx) => {
        const model = ctx.model as KanbanBlockModel | undefined;
        const collection = model?.collection || ctx.collection;
        const savedOptions = model?.props.groupOptions || [];
        const groupField = model?.getGroupField() || getKanbanCollectionField(collection, model?.props.groupField);
        const groupFieldCandidates = model?.getGroupFieldCandidates() || getKanbanGroupFieldCandidates(collection);
        const defaultGroupFieldName =
          model?.getDefaultGroupFieldName() || groupField?.name || groupFieldCandidates[0]?.value;
        const resolvedField = groupField || getKanbanCollectionField(collection, defaultGroupFieldName);
        const groupOptions =
          model?.getConfiguredGroupOptions() || getKanbanInlineGroupOptions(resolvedField, savedOptions);

        return {
          groupField: defaultGroupFieldName,
          groupOptions,
        };
      },
      handler(ctx, params) {
        const model = ctx.model as KanbanBlockModel;
        const nextSortField = model.getCompatibleSortFieldName(model.getConfiguredSortFieldName(), params.groupField);
        model.setProps({
          groupField: params.groupField,
          groupOptions: params.groupOptions || [],
          sortField: nextSortField,
          dragEnabled: nextSortField ? model.getDragEnabled() : false,
        });
        model.resource.setSort(nextSortField ? [nextSortField] : []);
      },
    },
    dragging: {
      title: tExpr('Drag settings', { ns: 'kanban' }),
      uiSchema: (ctx) => {
        const model = ctx.model as KanbanBlockModel;
        const groupField = model.getGroupField();
        const groupFieldOption = groupField
          ? {
              label: groupField.title || groupField.uiSchema?.title || groupField.name,
              value: groupField.name,
            }
          : undefined;
        return {
          dragEnabled: {
            title: tExpr('Enable dragging', { ns: 'kanban' }),
            'x-component': Switch,
            'x-decorator': 'FormItem',
          },
          sortField: {
            title: tExpr('Sorting field', { ns: 'kanban' }),
            description: tExpr(
              'Used to persist kanban drag order. Only sort fields corresponding to the grouping field can be selected, and you can create one here.',
              { ns: 'kanban' },
            ),
            required: false,
            'x-component': KanbanCreateSortFieldSelect,
            'x-decorator': 'FormItem',
            'x-component-props': {
              sortFields: model.getSortFieldCandidates(groupField?.name),
              collectionFields: getKanbanCollectionFieldMetadata(model.collection),
              groupField: groupFieldOption,
              collectionName: model.collection?.name,
              dataSource: model.collection?.dataSourceKey,
              placeholder: ctx.t('Select field'),
            },
            'x-reactions': [
              {
                dependencies: ['.dragEnabled'],
                fulfill: {
                  state: {
                    required: '{{$deps[0] === true}}',
                  },
                },
              },
            ],
          },
        };
      },
      defaultParams: (ctx) => {
        const model = ctx.model as KanbanBlockModel;
        return {
          dragEnabled: model.getDragEnabled() && !!model.getSortFieldName(),
          sortField: model.getSortFieldName() ?? null,
        };
      },
      handler(ctx, params) {
        const model = ctx.model as KanbanBlockModel;
        const sortField = model.getCompatibleSortFieldName(params.sortField);
        const dragEnabled = params.dragEnabled === true && !!sortField && !isMultipleGroupField(model.getGroupField());
        model.setProps({
          dragEnabled,
          sortField,
        });
        model.resource.setSort(sortField ? [sortField] : []);
      },
    },
    pageSize: {
      title: tExpr('Page size', { ns: 'kanban' }),
      uiSchema: {
        pageSize: {
          'x-component': InputNumber,
          'x-decorator': 'FormItem',
          'x-component-props': {
            min: 1,
            max: 200,
            precision: 0,
            style: { width: '100%' },
          },
        },
      },
      defaultParams: (ctx) => ({
        pageSize: (ctx.model as KanbanBlockModel).getPageSize(),
      }),
      handler(ctx, params) {
        (ctx.model as KanbanBlockModel).setProps({ pageSize: params.pageSize || DEFAULT_KANBAN_PAGE_SIZE });
      },
    },
    columnWidth: {
      title: tExpr('Column width', { ns: 'kanban' }),
      uiSchema: {
        columnWidth: {
          'x-component': InputNumber,
          'x-decorator': 'FormItem',
          'x-component-props': {
            min: 220,
            max: 640,
            precision: 0,
            style: { width: '100%' },
          },
        },
      },
      defaultParams: (ctx) => ({
        columnWidth: (ctx.model as KanbanBlockModel).getColumnWidth(),
      }),
      handler(ctx, params) {
        (ctx.model as KanbanBlockModel).setProps({ columnWidth: params.columnWidth || DEFAULT_KANBAN_COLUMN_WIDTH });
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
  },
});

KanbanBlockModel.define({
  label: tExpr('Kanban', { ns: 'kanban' }),
  group: tExpr('Content'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'KanbanBlockModel',
    props: {
      dragEnabled: false,
    },
    subModels: {
      item: {
        use: 'KanbanCardItemModel',
      },
    },
  },
  sort: 520,
});
