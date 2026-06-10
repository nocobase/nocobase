/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import {
  ActionModel,
  BlockSceneEnum,
  TableActionsColumnModel,
  TableBlockModel,
  TableColumnModel,
  TableCustomColumnModel,
} from '@nocobase/client-v2';
import {
  AddSubModelButton,
  DndProvider,
  Droppable,
  FlowModelRenderer,
  FlowSettingsButton,
  MultiRecordResource,
} from '@nocobase/flow-engine';
import { Space } from 'antd';
import React from 'react';
import { Task } from '../shared/types/public-types';
import { createGanttEventViewActionOptions } from './actions/GanttPopupModels';
import { GanttBlock } from './components/GanttBlock';
import { ROW_SELECTION_COLUMN_WIDTH, TREE_EXPAND_COLUMN_WIDTH } from './components/GanttBlock.helpers';
import { getLabelFormatValue, toPlainLabel } from './components/getLabelFormatValue';
import {
  DATE_FIELD_TYPES,
  DRAG_HANDLER_TOOLBAR_ITEMS,
  getFieldEnumColor,
  getProgress,
  HIDDEN_GANTT_TOP_ACTION_MODELS,
  isSupportedByValues,
  normalizeColorValue,
  normalizeEventOpenMode,
  TITLE_FIELD_TYPES,
} from './GanttBlockModel.helpers';
import { registerGanttBlockModelSettings } from './GanttBlockModel.settings';

type GanttBlockStructure = {
  subModels: {
    actions: ActionModel[];
    columns: Array<TableColumnModel | TableCustomColumnModel | TableActionsColumnModel>;
    eventViewAction?: ActionModel;
  };
};

type GanttScrollToDateOptions = {
  behavior?: ScrollBehavior;
};

export class GanttBlockModel extends TableBlockModel {
  static scene = BlockSceneEnum.many;

  customModelClasses = {
    CollectionActionGroupModel: 'GanttCollectionActionGroupModel',
    RecordActionGroupModel: 'RecordActionGroupModel',
    TableColumnModel: 'TableColumnModel',
    TableAssociationFieldGroupModel: 'TableAssociationFieldGroupModel',
    TableCustomColumnModel: 'TableCustomColumnModel',
  };

  static filterCollection(collection: any) {
    if (!super.filterCollection(collection)) {
      return false;
    }

    const fields = collection?.getFields?.() || [];
    return fields.some((field: any) => {
      return (
        isSupportedByValues(field?.type, DATE_FIELD_TYPES) ||
        isSupportedByValues(field?.interface, DATE_FIELD_TYPES) ||
        isSupportedByValues(field?.uiSchema?.type, DATE_FIELD_TYPES)
      );
    });
  }

  get resource() {
    return super.resource as MultiRecordResource;
  }

  createResource() {
    const resource = this.context.createResource(MultiRecordResource);
    resource.setPageSize(this.getPageSize());
    if (this.isTreeTableEnabled()) {
      resource.setRequestParameters({ tree: true });
    }
    const sortField = Array.isArray(this.collection?.filterTargetKey)
      ? this.collection.filterTargetKey[0]
      : this.collection?.filterTargetKey || 'id';
    resource.setSort(this.props?.globalSort?.length ? this.props.globalSort : [sortField]);
    return resource;
  }

  normalizePageSize(value?: any) {
    const pageSize = Number(value);
    return Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
  }

  getPageSize() {
    return this.normalizePageSize(this.props?.pageSize ?? this.getStepParams('tableSettings', 'pageSize')?.pageSize);
  }

  normalizeTableWidth(value?: any) {
    const width = Number(value);
    return Number.isFinite(width) && width > 0 ? Math.max(120, Math.round(width)) : undefined;
  }

  getAutoTableWidth() {
    const tableColumns = this.getColumns().filter((column: any) => column?.key !== 'empty');
    const dataColumnWidth = tableColumns.reduce(
      (total, column: any) => total + (typeof column?.width === 'number' ? column.width : 0),
      0,
    );

    return (
      (dataColumnWidth || 150) + ROW_SELECTION_COLUMN_WIDTH + (this.isTreeTableEnabled() ? TREE_EXPAND_COLUMN_WIDTH : 0)
    );
  }

  getTableWidth() {
    return (
      this.normalizeTableWidth(
        this.props?.tableWidth ?? this.getStepParams('ganttSettings', 'tableWidth')?.tableWidth,
      ) || this.getAutoTableWidth()
    );
  }

  shouldShowRowNumbers() {
    return (this.props?.showIndex ?? this.getStepParams('tableSettings', 'showRowNumbers')?.showIndex) !== false;
  }

  isTreeCollection() {
    try {
      return (
        this.collection?.template === 'tree' ||
        this.collection?.options?.template === 'tree' ||
        !!(this.collection as any)?.tree
      );
    } catch {
      return false;
    }
  }

  isTreeTableEnabled() {
    if (!this.isTreeCollection()) {
      return false;
    }
    return (this.props?.treeTable ?? this.getStepParams('tableSettings', 'treeTable')?.treeTable) === true;
  }

  shouldDefaultExpandAllRows() {
    return (
      (this.props?.defaultExpandAllRows ??
        this.getStepParams('tableSettings', 'defaultExpandAllRows')?.defaultExpandAllRows) === true
    );
  }

  shouldScrollToTodayOnFirstRender() {
    return (
      (this.props?.scrollToTodayOnFirstRender ??
        this.getStepParams('ganttSettings', 'scrollToTodayOnFirstRender')?.scrollToTodayOnFirstRender) === true
    );
  }

  getTreeChildrenFieldName() {
    return (
      this.getCollectionFields().find((field: any) => field?.treeChildren || field?.options?.treeChildren)?.name ||
      'children'
    );
  }

  private treeExpanded = false;

  isTreeExpanded() {
    return this.treeExpanded;
  }

  setTreeExpandFlag(expanded: boolean) {
    this.treeExpanded = expanded;
    this.mapSubModels('actions', (action: any) => {
      if (action?.use === 'GanttExpandCollapseActionModel' && typeof action.setExpandFlag === 'function') {
        action.setExpandFlag(expanded);
      }
    });
  }

  expandAllTreeRows() {
    this.emitter.emit('expandAllTreeRows');
  }

  collapseAllTreeRows() {
    this.emitter.emit('collapseAllTreeRows');
  }

  toggleAllTreeRows() {
    if (this.isTreeExpanded()) {
      this.collapseAllTreeRows();
    } else {
      this.expandAllTreeRows();
    }
  }

  scrollToDate(date: Date, options?: GanttScrollToDateOptions) {
    this.emitter.emit('scrollToDate', {
      date,
      behavior: options?.behavior,
    });
  }

  scrollToToday(options?: GanttScrollToDateOptions) {
    this.scrollToDate(new Date(), {
      behavior: options?.behavior ?? 'smooth',
    });
  }

  getCollectionFields() {
    return this.collection?.getFields?.() || [];
  }

  getFieldOptions(types: string[]) {
    return this.getCollectionFields()
      .filter((field: any) => {
        return (
          isSupportedByValues(field.type, types) ||
          isSupportedByValues(field.interface, types) ||
          isSupportedByValues(field.uiSchema?.type, types)
        );
      })
      .map((field: any) => ({
        label: field.title || field.uiSchema?.title || field.name,
        value: field.name,
      }));
  }

  getDefaultTitleFieldName() {
    return this.getFieldOptions(TITLE_FIELD_TYPES)[0]?.value || this.collection?.filterTargetKey || 'id';
  }

  getDefaultStartFieldName() {
    const options = this.getFieldOptions(DATE_FIELD_TYPES);
    return options.find((item) => item.value === 'createdAt')?.value || options[0]?.value;
  }

  getDefaultEndFieldName() {
    const startFieldName = this.getDefaultStartFieldName();
    return (
      this.getFieldOptions(DATE_FIELD_TYPES).find((item) => item.value !== startFieldName)?.value || startFieldName
    );
  }

  getFieldNames() {
    const fieldNames = this.props?.fieldNames || {};
    return {
      title: fieldNames.title || this.getDefaultTitleFieldName(),
      start: fieldNames.start || this.getDefaultStartFieldName(),
      end: fieldNames.end || this.getDefaultEndFieldName(),
      progress: fieldNames.progress,
      color: fieldNames.color,
      range: fieldNames.range || 'day',
    };
  }

  getRecordFilterByTk(record: any, fallback?: string) {
    if (record) {
      return this.collection?.getFilterByTK?.(record) ?? fallback;
    }

    try {
      return JSON.parse(fallback);
    } catch {
      return fallback;
    }
  }

  private getTaskId(record: any) {
    const filterByTk = this.collection?.getFilterByTK?.(record);
    if (filterByTk !== undefined && filterByTk !== null) {
      return typeof filterByTk === 'object' ? JSON.stringify(filterByTk) : String(filterByTk);
    }
    return String(record?.id);
  }

  private formatTitle(record: any, titleFieldName: string) {
    const titleField = this.collection?.getField?.(titleFieldName);
    return toPlainLabel(getLabelFormatValue(titleField?.uiSchema, record?.[titleFieldName]));
  }

  private getRecordColor(record: any, colorFieldName?: string) {
    if (!colorFieldName) {
      return normalizeColorValue(record?.color);
    }

    const colorField = this.collection?.getField?.(colorFieldName);
    const value = record?.[colorFieldName];
    const fallbackColor = normalizeColorValue(record?.color);

    if (isSupportedByValues(colorField?.interface, ['select']) || isSupportedByValues(colorField?.type, ['select'])) {
      return getFieldEnumColor(colorField, value) || fallbackColor;
    }

    return normalizeColorValue(value) || fallbackColor;
  }

  private formatData(
    data: any[] = [],
    tasks: Array<Task & { record?: any }> = [],
    projectId: any = undefined,
  ): Array<Task & { record?: any }> {
    const fieldNames = this.getFieldNames();

    data.forEach((record: any) => {
      const title = this.formatTitle(record, fieldNames.title);
      const id = this.getTaskId(record);
      const childrenFieldName = this.getTreeChildrenFieldName();
      const children = Array.isArray(record[childrenFieldName]) ? record[childrenFieldName] : [];
      const start = record[fieldNames.start] ? new Date(record[fieldNames.start]) : undefined;
      const end = record[fieldNames.end] ? new Date(record[fieldNames.end]) : start;
      const color = this.getRecordColor(record, fieldNames.color);

      if (children.length) {
        tasks.push({
          start,
          end,
          name: title,
          id,
          type: fieldNames.end ? 'task' : 'milestone',
          progress: getProgress(record, fieldNames.progress),
          project: projectId,
          color,
          isDisabled: false,
          record,
        } as any);
        this.formatData(children, tasks, id);
      } else {
        tasks.push({
          start,
          end,
          name: title,
          id,
          type: fieldNames.end ? 'task' : 'milestone',
          progress: getProgress(record, fieldNames.progress),
          project: projectId,
          color,
          isDisabled: false,
          record,
        } as any);
      }
    });

    return tasks;
  }

  getTasks() {
    return this.formatData(this.resource.getData() || []);
  }

  getEventViewAction() {
    return (this.subModels as GanttBlockStructure['subModels'])?.eventViewAction as any;
  }

  getPopupActionUid(actionKey: 'eventViewAction') {
    return `${this.uid}-${actionKey}`;
  }

  getPopupSettingsDefaults(actionUid?: string) {
    return {
      mode: normalizeEventOpenMode(this.props?.eventOpenMode),
      size: 'medium',
      pageModelClass: 'ChildPageModel',
      uid: actionUid,
      collectionName: this.collection?.name,
      dataSourceKey: this.collection?.dataSourceKey,
    };
  }

  getStoredPopupSettings() {
    return this.props?.eventPopupSettings || {};
  }

  normalizePopupSettings(popupSettings?: Record<string, any>) {
    const nextParams = { ...(popupSettings || {}) };
    const popupTemplateUidProvided = Object.prototype.hasOwnProperty.call(nextParams, 'popupTemplateUid');
    const popupTemplateUid =
      typeof nextParams.popupTemplateUid === 'string'
        ? nextParams.popupTemplateUid.trim()
        : nextParams.popupTemplateUid;

    if (
      popupTemplateUidProvided &&
      (popupTemplateUid === undefined || popupTemplateUid === null || popupTemplateUid === '')
    ) {
      delete nextParams.popupTemplateUid;
      delete nextParams.popupTemplateContext;
      delete nextParams.popupTemplateHasFilterByTk;
      delete nextParams.popupTemplateHasSourceId;
      delete nextParams.uid;
    }

    return nextParams;
  }

  setPopupSettings(popupSettings?: Record<string, any>) {
    const normalized = this.normalizePopupSettings(popupSettings);
    this.setProps({
      eventPopupSettings: normalized,
    });
    return normalized;
  }

  getPopupSettings(action: any, actionUid?: string) {
    const defaults = this.getPopupSettingsDefaults(action?.uid || actionUid);
    const currentParams = this.getStoredPopupSettings();

    return {
      ...defaults,
      ...currentParams,
      uid: currentParams.uid || defaults.uid,
      collectionName: currentParams.collectionName || defaults.collectionName,
      dataSourceKey: currentParams.dataSourceKey || defaults.dataSourceKey,
    };
  }

  async syncPopupActionSettings(action: any) {
    if (!action) {
      return;
    }

    const nextSettings = this.getPopupSettings(action, action?.uid);
    const currentParams = action.getStepParams?.('popupSettings', 'openView') || {};
    if (JSON.stringify(currentParams) === JSON.stringify(nextSettings)) {
      return;
    }

    action.setStepParams('popupSettings', 'openView', nextSettings);

    if (this.context.flowSettingsEnabled && action?.saveStepParams) {
      await action.saveStepParams();
    }
  }

  async loadPopupAction(actionKey: 'eventViewAction') {
    const actionUid = this.getPopupActionUid(actionKey);
    try {
      return this.flowEngine.getModel(actionUid) || (await this.flowEngine.loadModel({ uid: actionUid }));
    } catch (error) {
      return null;
    }
  }

  async ensurePopupAction(actionKey: 'eventViewAction' = 'eventViewAction') {
    let action = (this.subModels as GanttBlockStructure['subModels'])?.[actionKey] as any;

    if (!action) {
      const loadedAction = await this.loadPopupAction(actionKey);

      if (loadedAction) {
        this.setSubModel(actionKey, loadedAction);
      } else {
        this.setSubModel(actionKey, createGanttEventViewActionOptions(this.getPopupActionUid(actionKey)));
      }

      action = (this.subModels as GanttBlockStructure['subModels'])?.[actionKey] as any;
    }

    if (this.context.flowSettingsEnabled && action?.save) {
      await action.save();
    }

    await this.syncPopupActionSettings(action);

    return action;
  }

  async openEvent(record: any) {
    const action = await this.ensurePopupAction('eventViewAction');
    if (!action || !record) {
      return;
    }

    const filterByTk = this.collection?.getFilterByTK?.(record) ?? record?.[this.collection?.filterTargetKey || 'id'];
    if (!filterByTk) {
      return;
    }
    const inputArgs = {
      ...(this.collection?.dataSourceKey ? { dataSourceKey: this.collection.dataSourceKey } : {}),
      ...(this.collection?.name ? { collectionName: this.collection.name } : {}),
      filterByTk,
      navigation: false,
      target: this.context?.layoutContentElement,
    };

    if (typeof this.context?.openView === 'function' && action.uid) {
      await this.context.openView(action.uid, inputArgs);
      return;
    }

    await action.dispatchEvent('click', inputArgs, { debounce: true });
  }

  getActionsColumn() {
    return this.findSubModel(
      'columns',
      (column) => column instanceof TableActionsColumnModel,
    ) as TableActionsColumnModel | null;
  }

  renderConfigureActions() {
    const actionMenuKey = `gantt-add-actions-${this.isTreeTableEnabled() ? 'tree' : 'plain'}`;

    return (
      <AddSubModelButton
        key={actionMenuKey}
        model={this}
        subModelBaseClass={this.getModelClassName('CollectionActionGroupModel')}
        subModelKey="actions"
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  getVisibleActionModels() {
    return this.mapSubModels('actions', (action) => action).filter((action) => {
      const use = typeof action.use === 'string' ? action.use : action.constructor?.name;
      return !HIDDEN_GANTT_TOP_ACTION_MODELS.has(use);
    });
  }

  renderActionBar() {
    const isConfigMode = !!this.context.flowSettingsEnabled;
    const actions = this.getVisibleActionModels();

    return (
      <DndProvider>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: this.context.themeToken.marginXXS,
          }}
        >
          <Space wrap>
            {actions.map((action) => {
              if (action.hidden && !isConfigMode) {
                return;
              }
              if ((action.props as any).position !== 'left') {
                return null;
              }

              return (
                <FlowModelRenderer
                  key={action.uid}
                  model={action}
                  showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                  extraToolbarItems={DRAG_HANDLER_TOOLBAR_ITEMS}
                />
              );
            })}
            <span></span>
          </Space>
          <Space wrap>
            {actions.map((action) => {
              if (action.hidden && !isConfigMode) {
                return;
              }
              if ((action.props as any).position === 'left') {
                return null;
              }

              const renderer = (
                <FlowModelRenderer
                  key={action.uid}
                  model={action}
                  showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                  extraToolbarItems={DRAG_HANDLER_TOOLBAR_ITEMS}
                />
              );

              if (!isConfigMode) {
                return renderer;
              }

              return (
                <Droppable model={action} key={action.uid}>
                  {renderer}
                </Droppable>
              );
            })}
            {this.renderConfigureActions()}
          </Space>
        </div>
      </DndProvider>
    );
  }

  renderComponent() {
    return (
      <Space direction="vertical" size={this.context.themeToken.margin} style={{ width: '100%' }}>
        {this.renderActionBar()}
        <GanttBlock model={this} />
      </Space>
    );
  }
}

registerGanttBlockModelSettings(GanttBlockModel);
