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
  tExpr,
} from '@nocobase/flow-engine';
import { InputNumber, Space, Switch } from 'antd';
import React from 'react';
import { generateNTemplate, lang } from '../locale';
import { KanbanBlockView } from './components/KanbanBlock';
import { createKanbanCardViewActionOptions } from './actions/KanbanPopupModels';
import { createKanbanQuickCreateActionOptions } from './actions/KanbanPopupModels';
import {
  normalizeKanbanPopupTargetUid,
  normalizeKanbanPopupTemplateUid,
  resolveKanbanOpenViewDefaultParams,
} from './popupSettings';
import {
  DEFAULT_KANBAN_COLUMN_WIDTH,
  DEFAULT_KANBAN_PAGE_SIZE,
  getKanbanCollectionField,
  getKanbanCollectionFieldOptions,
  getKanbanCollectionFields,
  getKanbanCollectionFilterTargetKey,
  getKanbanCollectionTitleField,
  getKanbanFieldScopeKey,
  getKanbanGroupFieldSortScopeKeys,
  getKanbanGroupFieldCandidates,
  getKanbanInlineGroupOptions,
  isAssociationGroupField,
  isKanbanGroupField,
  isMultipleGroupField,
  normalizeKanbanCardOpenMode,
  normalizeKanbanPopupSize,
  normalizeKanbanGroupOptions,
  type KanbanGroupOption,
  type KanbanGroupingValue,
  resolveKanbanFieldColorValue,
} from './utils';

const DRAG_HANDLER_TOOLBAR_ITEMS = [
  {
    key: 'drag-handler',
    component: DragHandler as React.ComponentType<any>,
    sort: 1,
  },
];

const KANBAN_PAGE_SIZE_OPTIONS = [10, 20, 50, 100].map((value) => ({
  label: String(value),
  value,
}));

const KANBAN_POPUP_WIDTH_MAP: Record<'drawer' | 'dialog', Record<string, string>> = {
  drawer: {
    small: '30%',
    medium: '50%',
    large: '70%',
  },
  dialog: {
    small: '40%',
    medium: '50%',
    large: '80%',
  },
};

const DRAG_SORT_FIELD_TIP =
  'Choose the sorting field that matches the current grouping field. Other sorting fields cannot be used for drag sorting.';
const DRAG_SORT_FIELD_TIP_EXPR = tExpr(DRAG_SORT_FIELD_TIP, { ns: 'kanban' });

const getKanbanSortingSettings = (model: KanbanBlockModel) => {
  return {
    dragEnabled:
      typeof model.getDragEnabled === 'function' ? model.getDragEnabled() : model.props?.dragEnabled === true,
    dragSortBy:
      (typeof model.getDragSortFieldName === 'function' ? model.getDragSortFieldName() : model.props?.dragSortBy) ??
      null,
  };
};

const getKanbanGroupingFormSortingSettings = (ctx: any) => {
  const grouping = ctx?.getStepFormValues?.('kanbanSettings', 'grouping')?.grouping;

  if (!grouping || typeof grouping !== 'object') {
    return undefined;
  }

  return {
    dragEnabled: grouping.dragEnabled === true,
    dragSortBy: grouping.dragSortBy ?? null,
  };
};

const getKanbanCardItemProps = (model: KanbanBlockModel) => {
  return {
    ...(model.subModels?.item?.props || {}),
    ...(model.subModels?.item?.getProps?.() || {}),
  };
};

const hasOwnModelProp = (props: Record<string, any>, key: string) => Object.prototype.hasOwnProperty.call(props, key);

const replaceModelStepParams = (model: any, flowKey: string, stepKey: string, params: Record<string, any>) => {
  if (!model) {
    return;
  }

  model.stepParams = model.stepParams || {};
  model.stepParams[flowKey] = model.stepParams[flowKey] || {};
  model.stepParams[flowKey][stepKey] = { ...params };
  model.emitter?.emit?.('onStepParamsChanged');
};

const setKanbanModelProps = (model: any, props: Record<string, any>) => {
  model.setProps(props);
  model._options = model._options || {};
  model._options.props = {
    ...(model._options.props || {}),
    ...props,
  };
};

const getCompatibleKanbanSortFieldName = (
  model: KanbanBlockModel,
  sortFieldName: string | undefined,
  groupFieldOrName?: any,
  options: { allowPendingCreatedField?: boolean } = {},
) => {
  const compatibleSortFieldName = model.getCompatibleSortFieldName(sortFieldName, groupFieldOrName);

  if (compatibleSortFieldName || !options.allowPendingCreatedField) {
    return compatibleSortFieldName;
  }

  return sortFieldName;
};

const getKanbanSortFieldCandidatesWithCurrent = (model: KanbanBlockModel, groupFieldOrName?: any) => {
  const candidates = model.getSortFieldCandidates(groupFieldOrName);
  const currentDragSortBy = getKanbanSortingSettings(model).dragSortBy;

  if (!currentDragSortBy || candidates.some((field: any) => field.value === currentDragSortBy)) {
    return candidates;
  }

  return [
    ...candidates,
    {
      label: currentDragSortBy,
      value: currentDragSortBy,
    },
  ];
};

const syncKanbanDragSortingStepParams = (
  model: KanbanBlockModel,
  settings: { dragEnabled: boolean; dragSortBy?: string | null },
) => {
  replaceModelStepParams(model, 'kanbanSettings', 'dragEnabled', { dragEnabled: settings.dragEnabled });
  replaceModelStepParams(model, 'kanbanSettings', 'dragSortBy', { dragSortBy: settings.dragSortBy ?? null });
};

const syncKanbanGroupingDragSortingStepParams = (
  model: KanbanBlockModel,
  settings: { dragEnabled: boolean; dragSortBy?: string | null },
) => {
  const currentGroupingParams =
    model.getStepParams?.('kanbanSettings', 'grouping') || model.stepParams?.kanbanSettings?.grouping;
  const currentGrouping = currentGroupingParams?.grouping;

  if (!currentGrouping) {
    return;
  }

  replaceModelStepParams(model, 'kanbanSettings', 'grouping', {
    ...currentGroupingParams,
    grouping: {
      ...currentGrouping,
      dragEnabled: settings.dragEnabled,
      dragSortBy: settings.dragSortBy ?? null,
    },
  });
};

const resolveKanbanPopupTargetUid = ({
  nextPopupTemplateUid,
  nextPopupTargetUid,
  currentPopupTemplateUid,
  currentPopupTargetUid,
}: {
  nextPopupTemplateUid?: string;
  nextPopupTargetUid?: string;
  currentPopupTemplateUid?: string;
  currentPopupTargetUid?: string;
}) => {
  return !nextPopupTemplateUid && currentPopupTemplateUid && nextPopupTargetUid === currentPopupTargetUid
    ? undefined
    : nextPopupTargetUid;
};

const applyKanbanBlockPopupSettings = async (model: KanbanBlockModel, params: Record<string, any>) => {
  const nextPopupTemplateUid = normalizeKanbanPopupTemplateUid(params.popupTemplateUid);
  const nextPopupTargetUid = normalizeKanbanPopupTargetUid(params.uid);
  const currentPopupTemplateUid =
    typeof model.getPopupTemplateUid === 'function'
      ? model.getPopupTemplateUid()
      : normalizeKanbanPopupTemplateUid(model.props?.popupTemplateUid);
  const currentPopupTargetUid =
    typeof model.getPopupTargetUid === 'function'
      ? model.getPopupTargetUid()
      : normalizeKanbanPopupTargetUid(model.props?.popupTargetUid);
  const resolvedPopupTargetUid = resolveKanbanPopupTargetUid({
    nextPopupTemplateUid,
    nextPopupTargetUid,
    currentPopupTemplateUid,
    currentPopupTargetUid,
  });
  const normalizedParams = {
    ...params,
    mode: normalizeKanbanCardOpenMode(params.mode),
    size: normalizeKanbanPopupSize(params.size),
    popupTemplateUid: nextPopupTemplateUid,
    pageModelClass: params.pageModelClass || undefined,
    uid: resolvedPopupTargetUid,
  };

  replaceModelStepParams(model, 'kanbanSettings', 'popup', normalizedParams);
  model.setProps({
    popupMode: normalizedParams.mode,
    popupSize: normalizedParams.size,
    popupTemplateUid: normalizedParams.popupTemplateUid,
    popupPageModelClass: normalizedParams.pageModelClass,
    popupTargetUid: normalizedParams.uid,
  });

  const action = await model.ensureQuickCreateAction();
  await model.syncQuickCreateAction(action);
};

const applyKanbanDragSortingSettings = (model: KanbanBlockModel, params: Record<string, any>) => {
  const currentSettings = getKanbanSortingSettings(model);
  const nextDragSortBy = params.dragSortBy ?? currentSettings.dragSortBy ?? undefined;
  const dragSortBy = getCompatibleKanbanSortFieldName(model, nextDragSortBy, undefined, {
    allowPendingCreatedField:
      model.isNew === true && typeof params.dragSortBy === 'string' && Boolean(params.dragSortBy),
  });
  const groupField = typeof model.getGroupField === 'function' ? model.getGroupField() : undefined;
  const dragEnabled = params.dragEnabled === true && !isMultipleGroupField(groupField);

  setKanbanModelProps(model, {
    dragEnabled,
    dragSortBy,
  });
  syncKanbanDragSortingStepParams(model, {
    dragEnabled,
    dragSortBy,
  });
  syncKanbanGroupingDragSortingStepParams(model, {
    dragEnabled,
    dragSortBy,
  });
  model.resource.setSort(
    dragEnabled && dragSortBy
      ? [dragSortBy]
      : typeof model.getConfiguredGlobalSort === 'function'
        ? model.getConfiguredGlobalSort()
        : [],
  );

  return {
    dragEnabled,
    dragSortBy,
  };
};

const applyKanbanGroupingSettings = (model: KanbanBlockModel, params: Record<string, any>) => {
  const grouping = (params.grouping || {}) as KanbanGroupingValue & {
    dragEnabled?: boolean;
    dragSortBy?: string | null;
  };
  const nextGroupField = grouping.groupField;
  const nextGroupOptions = grouping.groupOptions || [];
  const nextGroupFieldInstance = getKanbanCollectionField(model.collection, nextGroupField);
  const hasDragEnabledValue = Object.prototype.hasOwnProperty.call(grouping, 'dragEnabled');
  const hasDragSortValue = Object.prototype.hasOwnProperty.call(grouping, 'dragSortBy');
  const requestedDragSortField = hasDragSortValue
    ? grouping.dragSortBy || undefined
    : model.getConfiguredDragSortFieldName();
  const dragEnabled =
    (hasDragEnabledValue ? grouping.dragEnabled === true : model.getDragEnabled()) &&
    !isMultipleGroupField(nextGroupFieldInstance);
  const nextDragSortField = getCompatibleKanbanSortFieldName(model, requestedDragSortField, nextGroupField, {
    allowPendingCreatedField: model.isNew === true && hasDragSortValue && Boolean(requestedDragSortField),
  });

  setKanbanModelProps(model, {
    groupField: nextGroupField,
    groupTitleField: grouping.groupTitleField,
    groupColorField: grouping.groupColorField,
    groupOptions: nextGroupOptions,
    dragSortBy: nextDragSortField,
    dragEnabled,
  });
  syncKanbanDragSortingStepParams(model, {
    dragEnabled,
    dragSortBy: nextDragSortField,
  });
  syncKanbanGroupingDragSortingStepParams(model, {
    dragEnabled,
    dragSortBy: nextDragSortField,
  });
  model.resource.setSort(
    dragEnabled && nextDragSortField
      ? [nextDragSortField]
      : typeof model.getConfiguredGlobalSort === 'function'
        ? model.getConfiguredGlobalSort()
        : [],
  );
};

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
    quickCreateAction?: any;
  };
}> {
  static scene = 'many' as any;

  isManualRefresh = true;

  defaultProps = {
    dragEnabled: false,
    quickCreateEnabled: true,
    styleVariant: 'color',
  };

  _defaultCustomModelClasses = {
    CollectionActionGroupModel: 'KanbanCollectionActionGroupModel',
    RecordActionGroupModel: 'RecordActionGroupModel',
    TableColumnModel: 'TableColumnModel',
    TableAssociationFieldGroupModel: 'TableAssociationFieldGroupModel',
    TableCustomColumnModel: 'TableCustomColumnModel',
  };

  // static filterCollection(collection: any) {
  //   if (!super.filterCollection(collection)) {
  //     return false;
  //   }

  //   return !!collection?.getFields?.()?.some?.((field: any) => isKanbanGroupField(field));
  // }

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

  getInlineGroupOptions(field = this.getGroupField()): KanbanGroupOption[] {
    return getKanbanInlineGroupOptions(field, this.props.groupOptions || []);
  }

  getConfiguredGroupOptions(): KanbanGroupOption[] {
    const currentField = this.getGroupField();
    const selectedOptions = normalizeKanbanGroupOptions(this.props.groupOptions || []);
    const inlineOptions = this.getInlineGroupOptions(currentField);

    if (!selectedOptions.length || !inlineOptions.length) {
      return selectedOptions;
    }
    const inlineOptionMap = new Map<string, KanbanGroupOption>(
      inlineOptions.map((item): [string, KanbanGroupOption] => [item.value, item]),
    );
    return selectedOptions.map((item) => inlineOptionMap.get(item.value) || item);
  }

  getGroupTitleFieldName(field = this.getGroupField()): string | undefined {
    if (!field || !isAssociationGroupField(field)) {
      return undefined;
    }

    const targetCollection = field.targetCollection;
    const savedFieldName = this.props.groupTitleField;
    const candidates = getKanbanCollectionFieldOptions(targetCollection);
    if (savedFieldName && candidates.some((item: { value: string }) => item.value === savedFieldName)) {
      return savedFieldName;
    }

    return getKanbanCollectionTitleField(targetCollection);
  }

  getGroupColorFieldName(field = this.getGroupField()): string | undefined {
    if (!field || !isAssociationGroupField(field)) {
      return undefined;
    }

    const targetCollection = field.targetCollection;
    const savedFieldName = this.props.groupColorField;
    const candidates = getKanbanCollectionFieldOptions(targetCollection);
    if (savedFieldName && candidates.some((item: { value: string }) => item.value === savedFieldName)) {
      return savedFieldName;
    }

    return undefined;
  }

  getRelationOptionFieldCandidates(field = this.getGroupField()): Array<{ label: string; value: string }> {
    if (!field || !isAssociationGroupField(field)) {
      return [];
    }

    return getKanbanCollectionFieldOptions(field.targetCollection);
  }

  async loadRelationGroupOptions(
    field = this.getGroupField(),
    options: {
      titleFieldName?: string;
      colorFieldName?: string;
      savedOptions?: Array<Partial<KanbanGroupOption>>;
    } = {},
  ): Promise<KanbanGroupOption[]> {
    const targetCollection = field?.targetCollection;
    if (!targetCollection) {
      return [] as KanbanGroupOption[];
    }

    const params = this.getResourceSettingsInitParams();
    const resource = this.context.createResource(MultiRecordResource);
    const titleFieldName = options.titleFieldName || this.getGroupTitleFieldName(field);
    const colorFieldName = options.colorFieldName || this.getGroupColorFieldName(field);
    const titleField = titleFieldName ? targetCollection.getField?.(titleFieldName) : undefined;
    const colorField = colorFieldName ? targetCollection.getField?.(colorFieldName) : undefined;
    const sortFieldName = titleFieldName || getKanbanCollectionFilterTargetKey(targetCollection);
    const filterTargetKey = getKanbanCollectionFilterTargetKey(targetCollection);

    resource.setDataSourceKey(params.dataSourceKey);
    resource.setResourceName(targetCollection.name);
    resource.setPage(1);
    resource.setPageSize(200);
    resource.setSort([sortFieldName]);
    await resource.refresh();

    return normalizeKanbanGroupOptions(
      (resource.getData() || []).map((item: any) => ({
        label: item?.[titleFieldName || sortFieldName] || item?.[filterTargetKey],
        value: item?.[filterTargetKey],
        color: resolveKanbanFieldColorValue(colorField, item?.[colorFieldName || '']),
      })),
      options.savedOptions || this.props.groupOptions || [],
      {
        useDefaultColors: Boolean(colorFieldName),
        preserveSavedColors: Boolean(colorFieldName),
      },
    );
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

  getConfiguredGlobalSort() {
    if (Array.isArray(this.props.globalSort)) {
      return this.props.globalSort.filter(Boolean);
    }

    if (Array.isArray(this.props.params?.sort)) {
      return this.props.params.sort.filter(Boolean);
    }

    if (typeof this.props.params?.sort === 'string' && this.props.params.sort) {
      return [this.props.params.sort];
    }

    const sortFieldName = this.getSortFieldName();
    return sortFieldName ? [sortFieldName] : [];
  }

  getConfiguredDragSortFieldName() {
    if (typeof this.props.dragSortBy === 'string' && this.props.dragSortBy) {
      return this.props.dragSortBy;
    }

    if (this.props.dragEnabled && typeof this.props.sortField === 'string' && this.props.sortField) {
      return this.props.sortField;
    }

    return undefined;
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

  getDragSortFieldName(groupFieldOrName: any = this.getGroupField()) {
    return this.getCompatibleSortFieldName(this.getConfiguredDragSortFieldName(), groupFieldOrName);
  }

  getEffectiveSortFieldName(groupFieldOrName: any = this.getGroupField()) {
    return this.getDragSortFieldName(groupFieldOrName) || this.getSortFieldName(groupFieldOrName);
  }

  getDragEnabled() {
    if (typeof this.props.dragEnabled === 'boolean') {
      return this.props.dragEnabled;
    }

    return this.props.dragSort === true || this.props.allowCrossColumnDrag === true;
  }

  getCardOpenMode() {
    const itemProps = getKanbanCardItemProps(this);
    const itemOpenMode = hasOwnModelProp(itemProps, 'openMode') ? itemProps.openMode : this.props.cardOpenMode;
    return normalizeKanbanCardOpenMode(itemOpenMode);
  }

  getCardPopupSize() {
    const itemProps = getKanbanCardItemProps(this);
    const itemPopupSize = hasOwnModelProp(itemProps, 'popupSize') ? itemProps.popupSize : this.props.cardPopupSize;
    return normalizeKanbanPopupSize(itemPopupSize);
  }

  getCardPopupTemplateUid() {
    const itemProps = getKanbanCardItemProps(this);
    const itemTemplateUid = hasOwnModelProp(itemProps, 'popupTemplateUid')
      ? itemProps.popupTemplateUid
      : this.props.cardPopupTemplateUid;
    return normalizeKanbanPopupTemplateUid(itemTemplateUid);
  }

  getCardPopupPageModelClass() {
    const itemProps = getKanbanCardItemProps(this);
    return hasOwnModelProp(itemProps, 'pageModelClass') ? itemProps.pageModelClass : this.props.cardPopupPageModelClass;
  }

  getQuickCreateEnabled() {
    return this.props.quickCreateEnabled !== false;
  }

  getPopupMode() {
    return normalizeKanbanCardOpenMode(this.props.popupMode);
  }

  getPopupSize() {
    return normalizeKanbanPopupSize(this.props.popupSize);
  }

  getPopupTemplateUid() {
    return normalizeKanbanPopupTemplateUid(this.props.popupTemplateUid);
  }

  getPopupPageModelClass() {
    return this.props.popupPageModelClass;
  }

  getPopupTargetUid() {
    const targetUid = normalizeKanbanPopupTargetUid(this.props.popupTargetUid);
    const quickCreateActionUid =
      typeof this.getQuickCreateActionUid === 'function' ? this.getQuickCreateActionUid() : undefined;
    if (!targetUid || targetUid === this.uid || (quickCreateActionUid && targetUid === quickCreateActionUid)) {
      return undefined;
    }

    return targetUid;
  }

  getCardPopupTargetUid() {
    const itemProps = getKanbanCardItemProps(this);
    const itemTargetUid = hasOwnModelProp(itemProps, 'popupTargetUid')
      ? itemProps.popupTargetUid
      : this.props.cardPopupTargetUid;
    const targetUid = normalizeKanbanPopupTargetUid(itemTargetUid);
    const popupActionUid = typeof this.getPopupActionUid === 'function' ? this.getPopupActionUid() : undefined;
    if (!targetUid || targetUid === this.uid || (popupActionUid && targetUid === popupActionUid)) {
      return undefined;
    }

    return targetUid;
  }

  getStyleVariant() {
    return this.props.styleVariant === 'default' ? 'default' : 'filled';
  }

  isCardClickable() {
    return getKanbanCardItemProps(this).enableCardClick !== false;
  }

  canDragSort() {
    return this.getDragEnabled() && !!this.getDragSortFieldName();
  }

  canCrossColumnDrag() {
    return this.getDragEnabled() && !!this.getDragSortFieldName() && !isMultipleGroupField(this.getGroupField());
  }

  getDataLoadingMode(): 'auto' | 'manual' {
    return 'manual';
  }

  createResource() {
    const resource = this.context.createResource(KanbanBlockResource);
    const effectiveSort =
      this.getDragEnabled() && this.getDragSortFieldName()
        ? [this.getDragSortFieldName()]
        : this.getConfiguredGlobalSort();
    if (effectiveSort.length) {
      resource.setSort(effectiveSort);
    }

    const groupField = this.getGroupField();
    if (groupField && isAssociationGroupField(groupField)) {
      resource.addAppends(groupField.name);
    }

    // Forward resource refresh events to model emitter for reliable delivery
    resource.on('refresh', () => {
      this.emitter.emit('refresh');
    });

    return resource;
  }

  onActive(forceRefresh = false) {
    // Kanban needs dirty-version refresh on view activation (e.g. popup close)
    // even though it uses manual refresh for initial data loading
    const saved = this.isManualRefresh;
    this.isManualRefresh = false;
    try {
      super.onActive(forceRefresh);
    } finally {
      this.isManualRefresh = saved;
    }
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

  getQuickCreateActionUid() {
    return `${this.uid}-quick-create-action`;
  }

  async syncPopupAction(
    action: any,
    options: { mode: string; size: string; popupTemplateUid?: string; uid?: string; pageModelClass?: string },
  ) {
    if (!action) {
      return;
    }

    const nextMode = options.mode;
    const nextSize = options.size;
    const nextPopupTemplateUid = normalizeKanbanPopupTemplateUid(options.popupTemplateUid);
    const nextUid = normalizeKanbanPopupTargetUid(options.uid);
    const selfUid = normalizeKanbanPopupTargetUid(action?.uid);
    const currentParams = action.getStepParams?.('popupSettings', 'openView') || {};
    const currentPopupTemplateUid = normalizeKanbanPopupTemplateUid(currentParams.popupTemplateUid);
    const currentUid = normalizeKanbanPopupTargetUid(currentParams.uid);
    let sanitizedUid = nextUid && nextUid !== this.uid && nextUid !== selfUid ? nextUid : undefined;

    if (!nextPopupTemplateUid && currentPopupTemplateUid && sanitizedUid === currentUid) {
      sanitizedUid = undefined;
    }

    const resolvedUid = sanitizedUid || (nextPopupTemplateUid ? currentUid || selfUid : selfUid);
    const nextPageModelClass = options.pageModelClass || undefined;

    if (
      currentParams.mode === nextMode &&
      currentParams.size === nextSize &&
      currentParams.popupTemplateUid === nextPopupTemplateUid &&
      normalizeKanbanPopupTargetUid(currentParams.uid) === resolvedUid &&
      currentParams.pageModelClass === nextPageModelClass
    ) {
      return;
    }

    const nextParams = {
      ...(nextPopupTemplateUid ? currentParams : {}),
      mode: nextMode,
      size: nextSize,
      popupTemplateUid: nextPopupTemplateUid,
      uid: resolvedUid,
      pageModelClass: nextPageModelClass,
    };

    action.setStepParams('popupSettings', 'openView', nextParams);

    if (this.context.flowSettingsEnabled && action?.saveStepParams) {
      await action.saveStepParams();
    }
  }

  async syncCardViewAction(action: any) {
    await this.syncPopupAction(action, {
      mode: this.getCardOpenMode(),
      size: this.getCardPopupSize(),
      popupTemplateUid: this.getCardPopupTemplateUid(),
      uid: this.getCardPopupTargetUid(),
      pageModelClass: this.getCardPopupPageModelClass(),
    });
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

  getQuickCreateAction() {
    return this.subModels?.quickCreateAction as any;
  }

  async ensureQuickCreateAction() {
    let action = this.subModels?.quickCreateAction as any;
    if (!action) {
      this.setSubModel('quickCreateAction', createKanbanQuickCreateActionOptions(this.getQuickCreateActionUid()));
      action = this.subModels?.quickCreateAction as any;
    }

    if (this.context.flowSettingsEnabled && action?.save) {
      await action.save();
    }

    await this.syncQuickCreateAction(action);

    return action;
  }

  async syncQuickCreateAction(action: any) {
    await this.syncPopupAction(action, {
      mode: this.getPopupMode(),
      size: this.getPopupSize(),
      popupTemplateUid: this.getPopupTemplateUid(),
      uid: this.getPopupTargetUid(),
      pageModelClass: this.getPopupPageModelClass(),
    });
  }

  async openEmptyPopupShell(options: { mode?: string; size?: string; title?: string }) {
    const viewer = this.context?.viewer as any;
    if (typeof viewer?.open !== 'function') {
      return false;
    }

    const popupType = options.mode === 'dialog' ? 'dialog' : 'drawer';
    const popupSize = normalizeKanbanPopupSize(options.size);

    await viewer.open({
      type: popupType,
      width: KANBAN_POPUP_WIDTH_MAP[popupType][popupSize],
      inheritContext: false,
      destroyOnClose: true,
      target: this.context.layoutContentElement,
      title: options.title,
      content: () => <div />,
    });

    return true;
  }

  buildQuickCreateFormData(column?: { value?: string; isUnknown?: boolean }) {
    const groupField = this.getGroupField();
    if (!groupField?.name) {
      return {};
    }

    const columnValue = column?.isUnknown ? null : column?.value ?? null;
    if (isAssociationGroupField(groupField)) {
      const targetKey = groupField.targetKey || getKanbanCollectionFilterTargetKey(groupField.targetCollection);
      return {
        ...(groupField.foreignKey ? { [groupField.foreignKey]: columnValue } : {}),
        [groupField.name]: columnValue === null ? null : { [targetKey]: columnValue },
      };
    }

    return {
      [groupField.name]: columnValue,
    };
  }

  async openQuickCreate(column?: { value?: string; isUnknown?: boolean }) {
    if (!this.getQuickCreateEnabled()) {
      return;
    }

    const action = await this.ensureQuickCreateAction();
    if (!action?.uid) {
      await this.openEmptyPopupShell({
        mode: this.getPopupMode(),
        size: this.getPopupSize(),
        title: this.translate('Add new', { ns: 'kanban' }),
      });
      return;
    }

    try {
      if (typeof this.context?.openView === 'function') {
        await this.context.openView(action.uid, {
          formData: this.buildQuickCreateFormData(column),
          navigation: false,
          target: this.context.layoutContentElement,
        });
        return;
      }

      await action.dispatchEvent(
        'click',
        {
          formData: this.buildQuickCreateFormData(column),
          navigation: false,
          target: this.context?.layoutContentElement,
        },
        { debounce: true },
      );
    } catch (error) {
      await this.openEmptyPopupShell({
        mode: this.getPopupMode(),
        size: this.getPopupSize(),
        title: this.translate('Add new', { ns: 'kanban' }),
      });
    }
  }

  async openCard(record: any) {
    if (!this.isCardClickable()) {
      return;
    }

    const action = await this.ensureCardViewAction();
    if (!action || !record) {
      await this.openEmptyPopupShell({
        mode: this.getCardOpenMode(),
        size: this.getCardPopupSize(),
        title: this.translate('Details'),
      });
      return;
    }

    const filterByTk = this.collection?.getFilterByTK?.(record) ?? record?.[this.collection?.filterTargetKey || 'id'];
    if (!filterByTk) {
      return;
    }

    try {
      if (typeof this.context?.openView === 'function' && action.uid) {
        await this.context.openView(action.uid, {
          mode: this.getCardOpenMode(),
          filterByTk,
          navigation: false,
          target: this.context.layoutContentElement,
        });
        return;
      }

      await action.dispatchEvent(
        'click',
        {
          mode: this.getCardOpenMode(),
          filterByTk,
          navigation: false,
          target: this.context?.layoutContentElement,
        },
        { debounce: true },
      );
    } catch (error) {
      await this.openEmptyPopupShell({
        mode: this.getCardOpenMode(),
        size: this.getCardPopupSize(),
        title: this.translate('Details'),
      });
    }
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
      uiSchema: (ctx) => {
        const model = ctx.model as KanbanBlockModel | undefined;
        const translate = (key: string) =>
          model?.translate?.(key, { ns: 'kanban' }) || ctx.t?.(key, { ns: 'kanban' }) || key;
        const collection = model?.collection || ctx.collection;
        const groupFieldOptions =
          typeof model?.getGroupFieldCandidates === 'function'
            ? model.getGroupFieldCandidates()
            : getKanbanGroupFieldCandidates(collection);
        let lastGroupFieldValue: string | undefined;

        return {
          grouping: {
            type: 'object',
            required: true,
            properties: {
              groupField: {
                type: 'string',
                title: tExpr('Grouping field', { ns: 'kanban' }),
                required: true,
                enum: groupFieldOptions,
                'x-component': 'Select',
                'x-decorator': 'FormItem',
                'x-decorator-props': {
                  tooltip: tExpr('Single select and many-to-one fields can be used as the grouping field', {
                    ns: 'kanban',
                  }),
                },
                'x-component-props': {
                  options: groupFieldOptions,
                },
                'x-reactions': [
                  (field) => {
                    const nextGroupFieldValue = field.value;
                    if (lastGroupFieldValue === undefined) {
                      lastGroupFieldValue = nextGroupFieldValue;
                      return;
                    }

                    if (lastGroupFieldValue === nextGroupFieldValue) {
                      return;
                    }

                    lastGroupFieldValue = nextGroupFieldValue;
                    field.form.setValuesIn('grouping.groupTitleField', undefined);
                    field.form.setValuesIn('grouping.groupColorField', undefined);
                    field.form.setValuesIn('grouping.groupOptions', []);
                    field.form.clearErrors?.('grouping.groupOptions');
                    field.form.setFieldState?.('grouping.groupOptions', (state: any) => {
                      state.selfModified = false;
                      state.modified = false;
                      state.validating = false;
                      state.feedbacks = [];
                    });
                  },
                ],
              },
              groupTitleField: {
                type: 'string',
                title: tExpr('Title field', { ns: 'kanban' }),
                required: true,
                'x-component': 'Select',
                'x-decorator': 'FormItem',
                'x-reactions': [
                  (field) => {
                    const groupFieldName = field.form.values?.grouping?.groupField;
                    const groupingField = getKanbanCollectionField(collection, groupFieldName);
                    field.hidden = !isAssociationGroupField(groupingField);
                    field.dataSource = model?.getRelationOptionFieldCandidates(groupingField) || [];
                  },
                ],
              },
              groupColorField: {
                type: 'string',
                title: tExpr('Color field', { ns: 'kanban' }),
                'x-component': 'Select',
                'x-decorator': 'FormItem',
                'x-component-props': {
                  allowClear: true,
                },
                'x-reactions': [
                  (field) => {
                    const groupFieldName = field.form.values?.grouping?.groupField;
                    const groupingField = getKanbanCollectionField(collection, groupFieldName);
                    field.hidden = !isAssociationGroupField(groupingField);
                    field.dataSource = model?.getRelationOptionFieldCandidates(groupingField) || [];
                  },
                ],
              },
              groupOptions: {
                type: 'array',
                title: tExpr('Select group values', { ns: 'kanban' }),
                required: true,
                'x-component': 'KanbanGroupingSelector',
                'x-decorator': 'FormItem',
                'x-reactions': [
                  {
                    dependencies: ['.groupField'],
                    fulfill: {
                      state: {
                        disabled: '{{!$deps[0]}}',
                      },
                    },
                  },
                ],
                'x-validator': (groupOptions: any[], _rule: any, validatorCtx: any) => {
                  if (groupOptions?.length) {
                    return undefined;
                  }

                  const field = validatorCtx?.field;
                  const shouldValidate = Boolean(field?.selfModified || field?.form?.submitting);

                  if (!shouldValidate) {
                    return undefined;
                  }

                  return translate('At least one option is required');
                },
              },
              dragEnabled: {
                type: 'boolean',
                title: tExpr('Enable drag and drop sorting', { ns: 'kanban' }),
                'x-component': 'Switch',
                'x-decorator': 'FormItem',
                'x-reactions': [
                  (field) => {
                    const groupFieldName = field.form.values?.grouping?.groupField;
                    const groupingField = getKanbanCollectionField(collection, groupFieldName);
                    field.disabled = isMultipleGroupField(groupingField);

                    if (field.disabled && field.value) {
                      field.value = false;
                    }
                  },
                ],
              },
              dragSortBy: {
                type: 'string',
                title: tExpr('Drag and drop sorting field', { ns: 'kanban' }),
                'x-component': 'KanbanCreateSortFieldSelect',
                'x-decorator': 'FormItem',
                'x-decorator-props': {
                  tooltip: DRAG_SORT_FIELD_TIP_EXPR,
                },
                'x-component-props': {
                  allowClear: true,
                  useGroupingFormValues: true,
                },
                'x-reactions': [
                  {
                    dependencies: ['.dragEnabled'],
                    fulfill: {
                      state: {
                        hidden: '{{!$deps[0]}}',
                        required: '{{$deps[0]}}',
                      },
                    },
                  },
                ],
              },
            },
          },
        };
      },
      defaultParams: (ctx) => {
        const model = ctx.model as KanbanBlockModel | undefined;
        const collection = model?.collection || ctx.collection;
        const savedGroupFieldName = model?.props.groupField;
        const resolvedField = savedGroupFieldName
          ? getKanbanCollectionField(collection, savedGroupFieldName)
          : undefined;
        const groupOptions = resolvedField
          ? model?.getConfiguredGroupOptions() ||
            getKanbanInlineGroupOptions(resolvedField, model?.props.groupOptions || [])
          : undefined;

        return {
          grouping: {
            groupField: savedGroupFieldName,
            groupTitleField: model?.props.groupTitleField,
            groupColorField: model?.props.groupColorField,
            groupOptions,
            dragEnabled: model ? getKanbanSortingSettings(model).dragEnabled : false,
            dragSortBy: model ? getKanbanSortingSettings(model).dragSortBy : null,
          },
        };
      },
      handler(ctx, params) {
        applyKanbanGroupingSettings(ctx.model as KanbanBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyKanbanGroupingSettings(ctx.model as KanbanBlockModel, params);
      },
    },
    styleVariant: {
      title: lang('Style'),
      preset: true,
      uiMode: () => {
        return {
          type: 'select',
          key: 'styleVariant',
          props: {
            options: [
              { label: lang('Classic style'), value: 'default' },
              { label: lang('Filled style'), value: 'filled' },
            ],
          },
        };
      },
      defaultParams: (ctx) => ({
        styleVariant: (ctx.model as KanbanBlockModel).getStyleVariant(),
      }),
      handler(ctx, params) {
        (ctx.model as KanbanBlockModel).setProps({ styleVariant: params.styleVariant || 'color' });
      },
    },
    defaultSorting: {
      use: 'sortingRule',
      title: tExpr('Default sorting'),
    },
    dragEnabled: {
      title: tExpr('Enable drag and drop sorting', { ns: 'kanban' }),
      preset: true,
      uiMode: { type: 'switch', key: 'dragEnabled' },
      defaultParams: (ctx) => ({
        dragEnabled: getKanbanSortingSettings(ctx.model as KanbanBlockModel).dragEnabled,
      }),
      handler(ctx, params) {
        const model = ctx.model as KanbanBlockModel;
        applyKanbanDragSortingSettings(model, {
          ...getKanbanSortingSettings(model),
          dragEnabled: params.dragEnabled === true,
        });
        void model.resource.refresh();
      },
      beforeParamsSave(ctx, params) {
        const model = ctx.model as KanbanBlockModel;
        const groupingSortingSettings = getKanbanGroupingFormSortingSettings(ctx);
        applyKanbanDragSortingSettings(model, {
          ...getKanbanSortingSettings(model),
          ...(groupingSortingSettings || { dragEnabled: params.dragEnabled === true }),
        });
      },
    },
    dragSortBy: {
      title: tExpr('Drag and drop sorting field', { ns: 'kanban' }),
      uiSchema: (ctx) => {
        const model = ctx.model as KanbanBlockModel;
        return {
          dragSortBy: {
            type: 'string',
            title: tExpr('Drag and drop sorting field', { ns: 'kanban' }),
            enum: getKanbanSortFieldCandidatesWithCurrent(model, model.getGroupField()?.name),
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip: DRAG_SORT_FIELD_TIP_EXPR,
            },
            'x-component-props': {
              allowClear: true,
            },
          },
        };
      },
      preset: true,
      hideInSettings(ctx) {
        const dragEnabledStepParams = ctx.model.getStepParams?.('kanbanSettings', 'dragEnabled');
        const dragEnabled = dragEnabledStepParams?.dragEnabled;

        return !(dragEnabled ?? getKanbanSortingSettings(ctx.model as KanbanBlockModel).dragEnabled);
      },
      uiMode: (ctx) => {
        const model = ctx.model as KanbanBlockModel;
        return {
          type: 'select',
          key: 'dragSortBy',
          props: {
            options: getKanbanSortFieldCandidatesWithCurrent(model, model.getGroupField()?.name),
            allowClear: true,
            tooltip: model.translate(DRAG_SORT_FIELD_TIP, { ns: 'kanban' }),
          },
        };
      },
      defaultParams: (ctx) => ({
        dragSortBy: getKanbanSortingSettings(ctx.model as KanbanBlockModel).dragSortBy,
      }),
      handler(ctx, params) {
        const model = ctx.model as KanbanBlockModel;
        const currentSettings = getKanbanSortingSettings(model);
        const nextDragSortBy = params.dragSortBy ?? null;
        applyKanbanDragSortingSettings(model, {
          ...currentSettings,
          dragSortBy: nextDragSortBy,
          dragEnabled: currentSettings.dragEnabled,
        });
        void model.resource.refresh();
      },
      beforeParamsSave(ctx, params) {
        const model = ctx.model as KanbanBlockModel;
        const currentSettings = getKanbanSortingSettings(model);
        const groupingSortingSettings = getKanbanGroupingFormSortingSettings(ctx);
        const nextDragSortBy = groupingSortingSettings?.dragSortBy ?? params.dragSortBy ?? null;
        applyKanbanDragSortingSettings(model, {
          ...currentSettings,
          ...(groupingSortingSettings || {
            dragSortBy: nextDragSortBy,
            dragEnabled: currentSettings.dragEnabled,
          }),
        });
      },
    },
    // appearance: {
    //   title: generateNTemplate('Style'),
    //   hideInSettings: true,
    //   uiSchema: {
    //     styleVariant: {
    //       title: generateNTemplate('Style'),
    //       enum: [
    //         { label: generateNTemplate('Classic'), value: 'default' },
    //         { label: generateNTemplate('Color'), value: 'color' },
    //       ],
    //       'x-component': 'Radio.Group',
    //       'x-decorator': 'FormItem',
    //     },
    //   },
    //   defaultParams: (ctx) => ({
    //     styleVariant: (ctx.model as KanbanBlockModel).getStyleVariant(),
    //   }),
    //   handler(ctx, params) {
    //     (ctx.model as KanbanBlockModel).setProps({ styleVariant: params.styleVariant || 'color' });
    //   },
    // },
    quickCreate: {
      title: tExpr('Quick create'),
      uiMode: { type: 'switch', key: 'quickCreateEnabled' },
      defaultParams: (ctx) => ({
        quickCreateEnabled: (ctx.model as KanbanBlockModel).getQuickCreateEnabled(),
      }),
      handler(ctx, params) {
        (ctx.model as KanbanBlockModel).setProps({ quickCreateEnabled: params.quickCreateEnabled === true });
      },
    },
    popup: {
      title: tExpr('Quick create popup settings', { ns: 'kanban' }),
      use: 'openView',
      hideInSettings(ctx) {
        const stepParams = ctx.model.getStepParams?.('kanbanSettings', 'quickCreate');
        const enabled = stepParams?.quickCreateEnabled;
        const defaultEnabled = (ctx.model as KanbanBlockModel).getQuickCreateEnabled();

        return !(enabled ?? defaultEnabled);
      },
      async defaultParams(ctx) {
        const commonParams = await resolveKanbanOpenViewDefaultParams(ctx as any);
        const popupPageModelClass =
          typeof (ctx.model as KanbanBlockModel).getPopupPageModelClass === 'function'
            ? (ctx.model as KanbanBlockModel).getPopupPageModelClass()
            : ctx.model?.props?.popupPageModelClass;
        return {
          ...commonParams,
          mode: (ctx.model as KanbanBlockModel).getPopupMode(),
          size: (ctx.model as KanbanBlockModel).getPopupSize(),
          popupTemplateUid: (ctx.model as KanbanBlockModel).getPopupTemplateUid(),
          pageModelClass: popupPageModelClass || commonParams.pageModelClass,
          uid: (ctx.model as KanbanBlockModel).getPopupTargetUid(),
        };
      },
      async handler(ctx, params) {
        await applyKanbanBlockPopupSettings(ctx.model as KanbanBlockModel, params);
      },
      async beforeParamsSave(ctx, params, previousParams) {
        await ctx.model?.getAction?.('openView')?.beforeParamsSave?.(ctx, params, previousParams);
        await applyKanbanBlockPopupSettings(ctx.model as KanbanBlockModel, params);
      },
    },
    pageSize: {
      title: tExpr('Page size', { ns: 'kanban' }),
      uiSchema: {
        pageSize: {
          enum: KANBAN_PAGE_SIZE_OPTIONS,
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          'x-component-props': {
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
