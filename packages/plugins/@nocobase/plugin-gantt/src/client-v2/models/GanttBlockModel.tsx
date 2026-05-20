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
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowSettingsButton,
  MultiRecordResource,
} from '@nocobase/flow-engine';
import { Space } from 'antd';
import React from 'react';
import { Task } from '../../shared/types/public-types';
import { createGanttEventViewActionOptions } from './actions/GanttPopupModels';
import { LEGACY_NAMESPACE, NAMESPACE, tExpr } from '../locale';
import { GanttBlock } from './components/GanttBlock';
import { getLabelFormatValue, toPlainLabel } from './components/getLabelFormatValue';

const DATE_FIELD_TYPES = ['date', 'datetime', 'dateOnly', 'datetimeNoTz', 'unixTimestamp', 'createdAt', 'updatedAt'];
const TITLE_FIELD_TYPES = ['string'];
const PROGRESS_FIELD_TYPES = ['float'];

const TIME_SCALE_OPTION_DEFS = [
  { label: 'Hour', value: 'hour' },
  { label: 'Quarter of day', value: 'quarterDay' },
  { label: 'Half of day', value: 'halfDay' },
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'QuarterYear', value: 'quarterYear' },
];

const getTimeScaleOptions = (translate?: (key: string, options?: Record<string, any>) => string) => {
  return TIME_SCALE_OPTION_DEFS.map((item) => ({
    ...item,
    label: translate
      ? translate(item.label, { ns: [NAMESPACE, LEGACY_NAMESPACE, 'client'], nsMode: 'fallback' })
      : tExpr(item.label),
  }));
};

const DRAG_HANDLER_TOOLBAR_ITEMS = [
  {
    key: 'drag-handler',
    component: DragHandler as React.ComponentType<any>,
    sort: 1,
  },
];

const HIDDEN_GANTT_TABLE_SETTING_STEPS = [
  'quickEdit',
  'showRowNumbers',
  'pageSize',
  'tableDensity',
  'dragSort',
  'dragSortBy',
];

type GanttBlockStructure = {
  subModels: {
    actions: ActionModel[];
    columns: Array<TableColumnModel | TableCustomColumnModel | TableActionsColumnModel>;
    eventViewAction?: ActionModel;
  };
};

const isSupportedByValues = (value: any, values: string[]) => {
  return value && values.includes(value);
};

const applyGanttFieldNames = (model: GanttBlockModel, params: Record<string, any>) => {
  model.setProps({
    fieldNames: {
      ...(model.props?.fieldNames || {}),
      ...(Object.prototype.hasOwnProperty.call(params, 'title') ? { title: params.title } : {}),
      ...(Object.prototype.hasOwnProperty.call(params, 'start') ? { start: params.start } : {}),
      ...(Object.prototype.hasOwnProperty.call(params, 'end') ? { end: params.end } : {}),
      ...(Object.prototype.hasOwnProperty.call(params, 'progress') ? { progress: params.progress } : {}),
      ...(Object.prototype.hasOwnProperty.call(params, 'range') ? { range: params.range || 'day' } : {}),
    },
  });
};

const getGanttTableSettingsSteps = () => {
  const tableSettings = TableBlockModel.globalFlowRegistry.getFlow('tableSettings');
  const steps = { ...(tableSettings?.steps || {}) };

  HIDDEN_GANTT_TABLE_SETTING_STEPS.forEach((key) => {
    if (steps[key]) {
      steps[key] = {
        ...steps[key],
        hideInSettings: true,
      };
    }
  });

  return steps;
};

const getProgress = (record: any, progressFieldName?: string) => {
  if (!progressFieldName) {
    return 0;
  }
  const value = Number(record?.[progressFieldName]);
  if (!Number.isFinite(value)) {
    return 0;
  }
  const percent = Number((value * 100).toFixed(2));
  return percent > 100 ? 100 : percent || 0;
};

const normalizeEventOpenMode = (value?: string) => {
  if (value === 'modal') {
    return 'dialog';
  }

  if (value === 'page') {
    return 'embed';
  }

  return value === 'dialog' || value === 'embed' ? value : 'drawer';
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
    resource.addRequestParameter('paginate', false);
    const sortField = Array.isArray(this.collection?.filterTargetKey)
      ? this.collection.filterTargetKey[0]
      : this.collection?.filterTargetKey || 'id';
    resource.setSort([sortField]);
    return resource;
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

  private formatData(
    data: any[] = [],
    tasks: Array<Task & { record?: any }> = [],
    projectId: any = undefined,
  ): Array<Task & { record?: any }> {
    const fieldNames = this.getFieldNames();

    data.forEach((record: any) => {
      const title = this.formatTitle(record, fieldNames.title);
      const id = this.getTaskId(record);
      const children = Array.isArray(record.children) ? record.children : [];
      const start = record[fieldNames.start] ? new Date(record[fieldNames.start]) : undefined;
      const end = record[fieldNames.end] ? new Date(record[fieldNames.end]) : start;

      if (children.length) {
        tasks.push({
          start,
          end,
          name: title,
          id,
          type: 'project',
          progress: getProgress(record, fieldNames.progress),
          hideChildren: !!this.props?.hideChildren,
          project: projectId,
          color: record.color,
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
          color: record.color,
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

    await action.dispatchEvent(
      'click',
      {
        filterByTk,
      },
      { debounce: true },
    );
  }

  getActionsColumn() {
    return this.findSubModel(
      'columns',
      (column) => column instanceof TableActionsColumnModel,
    ) as TableActionsColumnModel | null;
  }

  renderConfigureActions() {
    return (
      <AddSubModelButton
        key={'gantt-add-actions'}
        model={this}
        subModelBaseClass={this.getModelClassName('CollectionActionGroupModel')}
        subModelKey="actions"
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  renderActionBar() {
    const isConfigMode = !!this.context.flowSettingsEnabled;

    return (
      <DndProvider>
        <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
          {this.mapSubModels('actions', (action) => {
            if (action.hidden && !isConfigMode) {
              return;
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

GanttBlockModel.registerFlow({
  key: 'ganttSettings',
  sort: 500,
  title: tExpr('Gantt'),
  steps: {
    fields: {
      title: tExpr('Gantt fields'),
      preset: true,
      hideInSettings: true,
      uiSchema(ctx) {
        const model = ctx.model as GanttBlockModel;
        const titleFieldOptions = model.getFieldOptions(TITLE_FIELD_TYPES);
        const dateFieldOptions = model.getFieldOptions(DATE_FIELD_TYPES);
        const progressFieldOptions = model.getFieldOptions(PROGRESS_FIELD_TYPES);
        const timeScaleOptions = getTimeScaleOptions(ctx.t);

        return {
          title: {
            type: 'string',
            title: tExpr('Title field'),
            required: true,
            enum: titleFieldOptions,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-component-props': {
              options: titleFieldOptions,
            },
          },
          start: {
            type: 'string',
            title: tExpr('Start date field'),
            required: true,
            enum: dateFieldOptions,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-component-props': {
              options: dateFieldOptions,
            },
          },
          end: {
            type: 'string',
            title: tExpr('End date field'),
            required: true,
            enum: dateFieldOptions,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-component-props': {
              options: dateFieldOptions,
            },
          },
          progress: {
            type: 'string',
            title: tExpr('Progress field'),
            enum: progressFieldOptions,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-component-props': {
              options: progressFieldOptions,
              allowClear: true,
            },
          },
          range: {
            type: 'string',
            title: tExpr('Time scale'),
            default: 'day',
            enum: timeScaleOptions,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-component-props': {
              options: timeScaleOptions,
            },
          },
        };
      },
      defaultParams() {
        return {};
      },
      handler(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
    },
    titleField: {
      title: tExpr('Title field'),
      uiMode(ctx) {
        return {
          type: 'select',
          key: 'title',
          props: {
            options: (ctx.model as GanttBlockModel).getFieldOptions(TITLE_FIELD_TYPES),
          },
        };
      },
      defaultParams(ctx) {
        return {
          title: (ctx.model as GanttBlockModel).getFieldNames().title,
        };
      },
      handler(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
    },
    timeScale: {
      title: tExpr('Time scale'),
      uiMode(ctx) {
        return {
          type: 'select',
          key: 'range',
          props: {
            options: getTimeScaleOptions(ctx.t),
          },
        };
      },
      defaultParams(ctx) {
        return {
          range: (ctx.model as GanttBlockModel).getFieldNames().range,
        };
      },
      handler(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
    },
    startDateField: {
      title: tExpr('Start date field'),
      uiMode(ctx) {
        return {
          type: 'select',
          key: 'start',
          props: {
            options: (ctx.model as GanttBlockModel).getFieldOptions(DATE_FIELD_TYPES),
          },
        };
      },
      defaultParams(ctx) {
        return {
          start: (ctx.model as GanttBlockModel).getFieldNames().start,
        };
      },
      handler(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
    },
    endDateField: {
      title: tExpr('End date field'),
      uiMode(ctx) {
        return {
          type: 'select',
          key: 'end',
          props: {
            options: (ctx.model as GanttBlockModel).getFieldOptions(DATE_FIELD_TYPES),
          },
        };
      },
      defaultParams(ctx) {
        return {
          end: (ctx.model as GanttBlockModel).getFieldNames().end,
        };
      },
      handler(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
    },
    processField: {
      title: tExpr('Progress field'),
      uiMode(ctx) {
        return {
          type: 'select',
          key: 'progress',
          props: {
            options: (ctx.model as GanttBlockModel).getFieldOptions(PROGRESS_FIELD_TYPES),
            allowClear: true,
          },
        };
      },
      defaultParams(ctx) {
        return {
          progress: (ctx.model as GanttBlockModel).getFieldNames().progress,
        };
      },
      handler(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyGanttFieldNames(ctx.model as GanttBlockModel, params);
      },
    },
    enableDragToReschedule: {
      title: tExpr('Enable drag to reschedule'),
      uiMode: { type: 'switch', key: 'enableDragToReschedule' },
      defaultParams(ctx) {
        return {
          enableDragToReschedule: (ctx.model as GanttBlockModel).props?.enableDragToReschedule !== false,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('enableDragToReschedule', params.enableDragToReschedule !== false);
      },
      beforeParamsSave(ctx, params) {
        ctx.model.setProps('enableDragToReschedule', params.enableDragToReschedule !== false);
      },
    },
    eventPopupSettings: {
      use: 'openView',
      title: tExpr('Event popup settings'),
      async defaultParams(ctx) {
        const model = ctx.model as GanttBlockModel;
        const action = await model.ensurePopupAction('eventViewAction');
        return model.getPopupSettings(action, model.getPopupActionUid('eventViewAction'));
      },
      async handler(ctx, params) {
        const model = ctx.model as GanttBlockModel;
        model.setPopupSettings(params);
        const action = await model.ensurePopupAction('eventViewAction');
        await model.syncPopupActionSettings(action);
      },
    },
  },
});

const tableSettingsFlow = TableBlockModel.globalFlowRegistry.getFlow('tableSettings');

GanttBlockModel.registerFlow({
  key: 'tableSettings',
  sort: tableSettingsFlow?.sort ?? 500,
  title: tableSettingsFlow?.title ?? tExpr('Table settings'),
  steps: getGanttTableSettingsSteps(),
});

GanttBlockModel.define({
  label: tExpr('Gantt'),
  group: tExpr('Content'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'GanttBlockModel',
    props: {
      enableDragToReschedule: true,
    },
    subModels: {
      actions: [],
      columns: [
        {
          use: 'TableActionsColumnModel',
          props: {
            title: tExpr('Actions'),
            width: 150,
          },
        },
      ],
    },
  },
  sort: 500,
});
