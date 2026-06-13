/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TableBlockModel } from '@nocobase/client-v2';
import { InputNumber } from 'antd';
import {
  applyGanttFieldNames,
  COLOR_FIELD_TYPES,
  DATE_FIELD_TYPES,
  getTimeScaleOptions,
  HIDDEN_GANTT_TABLE_SETTING_STEPS,
  PROGRESS_FIELD_TYPES,
  TITLE_FIELD_TYPES,
} from './GanttBlockModel.helpers';
import type { GanttBlockModel as GanttBlockModelType } from './GanttBlockModel';
import { tExpr } from '../locale';

const getGanttModel = (ctx: { model: any }) => ctx.model as GanttBlockModelType;

const shouldHideGanttTreeSetting = (ctx: { model: any; view?: any }) => {
  const model = getGanttModel(ctx);
  return !model.isTreeCollection() || ctx.view?.inputArgs?.scene === 'select';
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

  if (steps.pageSize) {
    steps.pageSize = {
      ...steps.pageSize,
      defaultParams(ctx) {
        const model = getGanttModel(ctx);
        return {
          pageSize: model.getPageSize(),
        };
      },
      async handler(ctx, params) {
        const model = getGanttModel(ctx);
        const pageSize = model.normalizePageSize(params.pageSize);
        model.setProps('pageSize', pageSize);
        model.resource.loading = true;
        model.resource.setPage(1);
        model.resource.setPageSize(pageSize);
        await model.resource.refresh();
      },
      beforeParamsSave(ctx, params) {
        const model = getGanttModel(ctx);
        model.setProps('pageSize', model.normalizePageSize(params.pageSize));
      },
    };
  }

  if (steps.showRowNumbers) {
    steps.showRowNumbers = {
      ...steps.showRowNumbers,
      defaultParams(ctx) {
        const model = getGanttModel(ctx);
        return {
          showIndex: model.shouldShowRowNumbers(),
        };
      },
    };
  }

  if (steps.treeTable) {
    steps.treeTable = {
      ...steps.treeTable,
      hideInSettings: shouldHideGanttTreeSetting,
      defaultParams(ctx) {
        const model = getGanttModel(ctx);
        return {
          treeTable: model.isTreeTableEnabled(),
        };
      },
      async handler(ctx, params) {
        const model = getGanttModel(ctx);
        const treeTable = !!params.treeTable;
        model.setProps('treeTable', treeTable);
        model.resource.loading = true;
        model.resource.setPage(1);
        model.resource.setRequestParameters({
          tree: treeTable,
        });
        await model.resource.refresh();
      },
      beforeParamsSave(ctx, params) {
        getGanttModel(ctx).setProps('treeTable', !!params.treeTable);
      },
    };
  }

  if (steps.defaultExpandAllRows) {
    steps.defaultExpandAllRows = {
      ...steps.defaultExpandAllRows,
      hideInSettings: shouldHideGanttTreeSetting,
      defaultParams(ctx) {
        const model = getGanttModel(ctx);
        return {
          defaultExpandAllRows: model.shouldDefaultExpandAllRows(),
        };
      },
      handler(ctx, params) {
        getGanttModel(ctx).setProps('defaultExpandAllRows', !!params.defaultExpandAllRows);
      },
      beforeParamsSave(ctx, params) {
        getGanttModel(ctx).setProps('defaultExpandAllRows', !!params.defaultExpandAllRows);
      },
    };
  }

  return steps;
};

export function registerGanttBlockModelSettings(GanttBlockModel: any) {
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
          const model = getGanttModel(ctx);
          const titleFieldOptions = model.getFieldOptions(TITLE_FIELD_TYPES);
          const dateFieldOptions = model.getFieldOptions(DATE_FIELD_TYPES);
          const progressFieldOptions = model.getFieldOptions(PROGRESS_FIELD_TYPES);
          const colorFieldOptions = model.getFieldOptions(COLOR_FIELD_TYPES);
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
            color: {
              type: 'string',
              title: tExpr('Color field'),
              enum: colorFieldOptions,
              'x-component': 'Select',
              'x-decorator': 'FormItem',
              'x-component-props': {
                options: colorFieldOptions,
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
          applyGanttFieldNames(ctx.model, params);
        },
        beforeParamsSave(ctx, params) {
          applyGanttFieldNames(ctx.model, params);
        },
      },
      titleField: {
        title: tExpr('Title field'),
        uiMode(ctx) {
          const model = getGanttModel(ctx);
          return {
            type: 'select',
            key: 'title',
            props: {
              options: model.getFieldOptions(TITLE_FIELD_TYPES),
            },
          };
        },
        defaultParams(ctx) {
          const model = getGanttModel(ctx);
          return {
            title: model.getFieldNames().title,
          };
        },
        handler(ctx, params) {
          applyGanttFieldNames(ctx.model, params);
        },
        beforeParamsSave(ctx, params) {
          applyGanttFieldNames(ctx.model, params);
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
          const model = getGanttModel(ctx);
          return {
            range: model.getFieldNames().range,
          };
        },
        handler(ctx, params) {
          applyGanttFieldNames(ctx.model, params);
        },
        beforeParamsSave(ctx, params) {
          applyGanttFieldNames(ctx.model, params);
        },
      },
      startDateField: {
        title: tExpr('Start date field'),
        uiMode(ctx) {
          const model = getGanttModel(ctx);
          return {
            type: 'select',
            key: 'start',
            props: {
              options: model.getFieldOptions(DATE_FIELD_TYPES),
            },
          };
        },
        defaultParams(ctx) {
          const model = getGanttModel(ctx);
          return {
            start: model.getFieldNames().start,
          };
        },
        handler(ctx, params) {
          applyGanttFieldNames(ctx.model, params);
        },
        beforeParamsSave(ctx, params) {
          applyGanttFieldNames(ctx.model, params);
        },
      },
      endDateField: {
        title: tExpr('End date field'),
        uiMode(ctx) {
          const model = getGanttModel(ctx);
          return {
            type: 'select',
            key: 'end',
            props: {
              options: model.getFieldOptions(DATE_FIELD_TYPES),
            },
          };
        },
        defaultParams(ctx) {
          const model = getGanttModel(ctx);
          return {
            end: model.getFieldNames().end,
          };
        },
        handler(ctx, params) {
          applyGanttFieldNames(ctx.model, params);
        },
        beforeParamsSave(ctx, params) {
          applyGanttFieldNames(ctx.model, params);
        },
      },
      processField: {
        title: tExpr('Progress field'),
        uiMode(ctx) {
          const model = getGanttModel(ctx);
          return {
            type: 'select',
            key: 'progress',
            props: {
              options: model.getFieldOptions(PROGRESS_FIELD_TYPES),
              allowClear: true,
            },
          };
        },
        defaultParams(ctx) {
          const model = getGanttModel(ctx);
          return {
            progress: model.getFieldNames().progress,
          };
        },
        handler(ctx, params) {
          if (!Object.prototype.hasOwnProperty.call(params, 'progress')) {
            params.progress = null;
          }
          applyGanttFieldNames(ctx.model, params);
        },
        beforeParamsSave(ctx, params) {
          if (!Object.prototype.hasOwnProperty.call(params, 'progress')) {
            params.progress = null;
          }
          applyGanttFieldNames(ctx.model, params);
        },
      },
      colorField: {
        title: tExpr('Color field'),
        uiMode(ctx) {
          const model = getGanttModel(ctx);
          return {
            type: 'select',
            key: 'color',
            props: {
              options: model.getFieldOptions(COLOR_FIELD_TYPES),
              allowClear: true,
            },
          };
        },
        defaultParams(ctx) {
          const model = getGanttModel(ctx);
          return {
            color: model.getFieldNames().color,
          };
        },
        handler(ctx, params) {
          if (!Object.prototype.hasOwnProperty.call(params, 'color')) {
            params.color = null;
          }
          applyGanttFieldNames(ctx.model, params);
        },
        beforeParamsSave(ctx, params) {
          if (!Object.prototype.hasOwnProperty.call(params, 'color')) {
            params.color = null;
          }
          applyGanttFieldNames(ctx.model, params);
        },
      },
      showTable: {
        title: tExpr('Show table'),
        uiMode: { type: 'switch', key: 'showTable' },
        defaultParams(ctx) {
          const model = getGanttModel(ctx);
          return {
            showTable: model.props?.showTable !== false,
          };
        },
        handler(ctx, params) {
          getGanttModel(ctx).setProps('showTable', params.showTable !== false);
        },
        beforeParamsSave(ctx, params) {
          getGanttModel(ctx).setProps('showTable', params.showTable !== false);
        },
      },
      tableWidth: {
        title: tExpr('Table width'),
        hideInSettings(ctx) {
          return getGanttModel(ctx).props?.showTable === false;
        },
        uiSchema: {
          tableWidth: {
            type: 'number',
            'x-component': InputNumber,
            'x-decorator': 'FormItem',
            'x-component-props': {
              min: 120,
              precision: 0,
              style: { width: '100%' },
            },
          },
        },
        defaultParams(ctx) {
          const model = getGanttModel(ctx);
          return {
            tableWidth: model.getTableWidth(),
          };
        },
        handler(ctx, params) {
          const model = getGanttModel(ctx);
          const tableWidth = model.normalizeTableWidth(params.tableWidth) || model.getAutoTableWidth();
          params.tableWidth = tableWidth;
          model.setProps('tableWidth', tableWidth);
        },
        beforeParamsSave(ctx, params) {
          const model = getGanttModel(ctx);
          const tableWidth = model.normalizeTableWidth(params.tableWidth) || model.getAutoTableWidth();
          params.tableWidth = tableWidth;
          model.setProps('tableWidth', tableWidth);
        },
      },
      enableDragToReschedule: {
        title: tExpr('Enable drag to reschedule'),
        uiMode: { type: 'switch', key: 'enableDragToReschedule' },
        defaultParams(ctx) {
          const model = getGanttModel(ctx);
          return {
            enableDragToReschedule: model.props?.enableDragToReschedule !== false,
          };
        },
        handler(ctx, params) {
          getGanttModel(ctx).setProps('enableDragToReschedule', params.enableDragToReschedule !== false);
        },
        beforeParamsSave(ctx, params) {
          getGanttModel(ctx).setProps('enableDragToReschedule', params.enableDragToReschedule !== false);
        },
      },
      scrollToTodayOnFirstRender: {
        title: tExpr('Scroll to today on first display'),
        uiMode: { type: 'switch', key: 'scrollToTodayOnFirstRender' },
        defaultParams(ctx) {
          const model = getGanttModel(ctx);
          return {
            scrollToTodayOnFirstRender: model.shouldScrollToTodayOnFirstRender(),
          };
        },
        handler(ctx, params) {
          getGanttModel(ctx).setProps('scrollToTodayOnFirstRender', params.scrollToTodayOnFirstRender === true);
        },
        beforeParamsSave(ctx, params) {
          getGanttModel(ctx).setProps('scrollToTodayOnFirstRender', params.scrollToTodayOnFirstRender === true);
        },
      },
      eventPopupSettings: {
        use: 'openView',
        title: tExpr('Event popup settings'),
        async defaultParams(ctx) {
          const model = getGanttModel(ctx);
          const action = await model.ensurePopupAction('eventViewAction');
          return model.getPopupSettings(action, action?.uid);
        },
        async handler(ctx, params) {
          const model = getGanttModel(ctx);
          model.setPopupSettings(params);
          await model.ensurePopupAction('eventViewAction', { persist: true });
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
        scrollToTodayOnFirstRender: false,
        showTable: true,
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
}
