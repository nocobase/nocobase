/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { ActionModel, BlockSceneEnum, CollectionBlockModel } from '@nocobase/client';
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
import { Select, Space } from 'antd';
import React from 'react';
import { CalendarBlock } from './components';
import {
  createCalendarEventViewActionOptions,
  createCalendarQuickCreateActionOptions,
} from './actions/CalendarPopupModels';
import {
  CALENDAR_RANGE_FILTER_GROUP,
  createCalendarRangeFilter,
  getCalendarVisibleRange,
  normalizeCalendarFieldPath,
  parseCalendarWeekStart,
} from './utils';

const DEFAULT_TITLE_INTERFACES = ['input', 'select', 'phone', 'email', 'radioGroup'];
const DEFAULT_COLOR_INTERFACES = ['select', 'radioGroup'];
const DEFAULT_DATE_TIME_FIELD_TYPES = [
  'date',
  'datetime',
  'dateOnly',
  'datetimeNoTz',
  'unixTimestamp',
  'createdAt',
  'updatedAt',
];

const VIEW_OPTIONS = [
  { label: tExpr('Month'), value: 'month' },
  { label: tExpr('Week'), value: 'week' },
  { label: tExpr('Day'), value: 'day' },
];

const WEEK_START_OPTIONS = [
  { label: tExpr('Monday'), value: 1 },
  { label: tExpr('Sunday'), value: 0 },
];

const EVENT_OPEN_MODE_OPTIONS = [
  { label: tExpr('Drawer'), value: 'drawer' },
  { label: tExpr('Dialog'), value: 'dialog' },
  { label: tExpr('Page'), value: 'embed' },
];

const normalizeEventOpenMode = (value?: string) => {
  if (value === 'modal') {
    return 'dialog';
  }

  if (value === 'page') {
    return 'embed';
  }

  return value === 'dialog' || value === 'embed' ? value : 'drawer';
};

const isSupportedByValues = (value: string | undefined, supportedValues: string[]) => {
  if (!value) {
    return false;
  }

  return supportedValues.includes(value);
};

type CalendarCollectionField = {
  name: string;
  title?: string;
  interface?: string;
  type?: string;
  uiSchema?: {
    title?: string;
    type?: string;
  };
};

type CalendarActionSubModel = ActionModel & {
  hidden?: boolean;
  props?: {
    position?: string;
  };
  uid: string;
};

const DRAG_HANDLER_TOOLBAR_ITEMS = [
  {
    key: 'drag-handler',
    component: DragHandler as React.ComponentType<any>,
    sort: 1,
  },
];

export class CalendarBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  customModelClasses = {
    CollectionActionGroupModel: 'CalendarCollectionActionGroupModel',
  };

  static filterCollection(collection: any) {
    if (!super.filterCollection(collection)) {
      return false;
    }

    return !!collection?.getFields?.()?.some?.((field: CalendarCollectionField) => {
      return (
        isSupportedByValues(field?.interface, DEFAULT_DATE_TIME_FIELD_TYPES) ||
        isSupportedByValues(field?.type, DEFAULT_DATE_TIME_FIELD_TYPES)
      );
    });
  }

  get calendarPlugin() {
    return this.context.app.pm.get('calendar') as any;
  }

  getTitleInterfaces() {
    return Object.keys(this.calendarPlugin?.titleFieldInterfaces || {}).length
      ? Object.keys(this.calendarPlugin.titleFieldInterfaces)
      : DEFAULT_TITLE_INTERFACES;
  }

  getColorInterfaces() {
    return Object.keys(this.calendarPlugin?.colorFieldInterfaces || {}).length
      ? Object.keys(this.calendarPlugin.colorFieldInterfaces)
      : DEFAULT_COLOR_INTERFACES;
  }

  getDateFieldTypes() {
    const types = this.calendarPlugin?.dateTimeFieldInterfaces;
    return Array.isArray(types) && types.length ? types : DEFAULT_DATE_TIME_FIELD_TYPES;
  }

  getCollectionFields() {
    return (this.collection?.getFields?.() || []) as CalendarCollectionField[];
  }

  getTitleFieldOptions() {
    const supportedInterfaces = this.getTitleInterfaces();
    return this.getCollectionFields()
      .filter((field) => isSupportedByValues(field.interface, supportedInterfaces))
      .map((field) => ({
        label: field.title || field.uiSchema?.title || field.name,
        value: field.name,
      }));
  }

  getColorFieldOptions() {
    const supportedInterfaces = this.getColorInterfaces();
    return this.getCollectionFields()
      .filter((field) => isSupportedByValues(field.interface, supportedInterfaces))
      .map((field) => ({
        label: field.title || field.uiSchema?.title || field.name,
        value: field.name,
      }));
  }

  getDateFieldOptions() {
    const supportedTypes = this.getDateFieldTypes();
    return this.getCollectionFields()
      .filter((field) => {
        return (
          isSupportedByValues(field.interface, supportedTypes) ||
          isSupportedByValues(field.type, supportedTypes) ||
          isSupportedByValues(field.uiSchema?.type, supportedTypes)
        );
      })
      .map((field) => ({
        label: field.title || field.uiSchema?.title || field.name,
        value: field.name,
      }));
  }

  getDefaultTitleFieldName() {
    return this.getTitleFieldOptions()[0]?.value || this.collection?.filterTargetKey || 'id';
  }

  getDefaultStartFieldName() {
    const options = this.getDateFieldOptions();
    return options.find((item) => item.value === 'createdAt')?.value || options[0]?.value;
  }

  getDefaultEndFieldName() {
    const startFieldName = this.getDefaultStartFieldName();
    return this.getDateFieldOptions().find((item) => item.value !== startFieldName)?.value;
  }

  getDefaultView() {
    return this.props?.defaultView || 'month';
  }

  getEventOpenMode() {
    return normalizeEventOpenMode(this.props?.eventOpenMode);
  }

  getWeekStart() {
    return parseCalendarWeekStart(this.props?.weekStart ?? 1);
  }

  getFieldNames() {
    const fieldNames = this.props?.fieldNames || {};

    return {
      id: 'id',
      title: fieldNames.title || this.getDefaultTitleFieldName(),
      start: fieldNames.start || this.getDefaultStartFieldName(),
      end: fieldNames.end || this.getDefaultEndFieldName(),
      colorFieldName: fieldNames.colorFieldName,
    };
  }

  createResource() {
    const resource = this.context.createResource(MultiRecordResource);
    resource.addRequestParameter('paginate', false);

    const { start, end } = this.getFieldNames();
    [start, end].forEach((fieldPath) => {
      if (Array.isArray(fieldPath) && fieldPath.length >= 2) {
        resource.addAppends(fieldPath[0]);
      }
    });

    const rangeFilter = createCalendarRangeFilter(
      this.getFieldNames(),
      getCalendarVisibleRange(new Date(), this.getDefaultView(), this.getWeekStart()),
    );

    if (rangeFilter) {
      resource.addFilterGroup(CALENDAR_RANGE_FILTER_GROUP, rangeFilter);
    }

    return resource;
  }

  renderComponent() {
    return <CalendarBlockView model={this} />;
  }

  getQuickCreateAction() {
    return this.subModels?.quickCreateAction as any;
  }

  getEventViewAction() {
    return this.subModels?.eventViewAction as any;
  }

  getPopupActionUid(actionKey: 'quickCreateAction' | 'eventViewAction') {
    return `${this.uid}-${actionKey}`;
  }

  async syncPopupActionOpenMode(action: any) {
    if (!action) {
      return;
    }

    const nextMode = this.getEventOpenMode();
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

  async ensurePopupAction(actionKey: 'quickCreateAction' | 'eventViewAction') {
    const buildActionOptions =
      actionKey === 'quickCreateAction'
        ? () => createCalendarQuickCreateActionOptions(this.getPopupActionUid(actionKey))
        : () => createCalendarEventViewActionOptions(this.getPopupActionUid(actionKey));
    let action = this.subModels?.[actionKey] as any;

    if (!action) {
      this.setSubModel(actionKey, buildActionOptions());
      action = this.subModels?.[actionKey] as any;
    }

    if (this.context.flowSettingsEnabled && action?.save) {
      await action.save();
    }

    await this.syncPopupActionOpenMode(action);

    return action;
  }

  async openQuickCreate(slotInfo: any) {
    if (this.props?.enableQuickCreateEvent === false) {
      return;
    }

    const action = await this.ensurePopupAction('quickCreateAction');
    if (!action) {
      return;
    }

    await action.dispatchEvent(
      'click',
      {
        mode: this.getEventOpenMode(),
        defineProperties: {
          calendarSelectedSlot: { value: slotInfo },
          calendarFieldNames: { value: this.getFieldNames() },
        },
      },
      { debounce: true },
    );
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
        mode: this.getEventOpenMode(),
        filterByTk,
      },
      { debounce: true },
    );
  }
}

const useDefaultGetColor = () => {
  return {
    getBackgroundColor: () => null,
    getFontColor: () => null,
    loading: false,
  };
};

const CalendarBlockRenderer = observer(
  ({
    model,
    fieldNames,
    colorCollectionField,
  }: {
    model: CalendarBlockModel;
    fieldNames: any;
    colorCollectionField: any;
  }) => {
    const colorFieldInterface = colorCollectionField?.interface
      ? model.calendarPlugin?.getColorFieldInterface?.(colorCollectionField.interface)
      : null;
    const useGetColor = colorFieldInterface?.useGetColor || useDefaultGetColor;
    const colorFunctions = useGetColor(colorCollectionField);
    const isConfigMode = !!model.context.flowSettingsEnabled;

    const leftActions = ((model as any).mapSubModels('actions', (action: CalendarActionSubModel) => {
      if (action.hidden && !isConfigMode) {
        return null;
      }

      if (action.props.position === 'left') {
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
    }) || []) as React.ReactNode[];

    const rightActions = ((model as any).mapSubModels('actions', (action: CalendarActionSubModel) => {
      if (action.hidden && !isConfigMode) {
        return null;
      }

      if (action.props.position !== 'left') {
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
    }) || []) as React.ReactNode[];

    const hasActions = [...leftActions, ...rightActions].some(Boolean);
    const actionBar =
      hasActions || isConfigMode ? (
        <DndProvider>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: model.context.themeToken.margin,
              gap: model.context.themeToken.marginXXS,
            }}
          >
            <Space wrap>
              {leftActions}
              <span />
            </Space>
            <Space wrap>
              {rightActions}
              <AddSubModelButton
                key="calendar-block-add-actions"
                model={model}
                subModelBaseClass={model.getModelClassName('CollectionActionGroupModel')}
                subModelKey="actions"
              >
                <FlowSettingsButton icon={<SettingOutlined />}>{model.translate('Actions')}</FlowSettingsButton>
              </AddSubModelButton>
            </Space>
          </div>
        </DndProvider>
      ) : null;

    return (
      <CalendarBlock
        actionBar={actionBar}
        {...model.props}
        collection={model.collection}
        dataSource={model.resource.getData()}
        fieldNames={fieldNames}
        defaultView={model.getDefaultView()}
        weekStart={model.getWeekStart()}
        resource={model.resource}
        rangeLoadEnabled
        onSelectSlot={(slotInfo) => {
          void model.openQuickCreate(slotInfo);
        }}
        onSelectEvent={({ record }) => {
          void model.openEvent(record);
        }}
        {...colorFunctions}
      />
    );
  },
);

const CalendarBlockView = observer(({ model }: { model: CalendarBlockModel }) => {
  const fieldNames = model.getFieldNames();
  const colorFieldName = normalizeCalendarFieldPath(fieldNames.colorFieldName);
  const colorCollectionField = colorFieldName ? model.collection?.getField?.(colorFieldName) : null;

  return (
    <CalendarBlockRenderer
      key={colorFieldName || '__calendar-default-color__'}
      model={model}
      fieldNames={fieldNames}
      colorCollectionField={colorCollectionField}
    />
  );
});

CalendarBlockModel.registerFlow({
  key: 'calendarSettings',
  sort: 500,
  title: tExpr('Calendar', { ns: 'calendar' }),
  steps: {
    titleField: {
      title: tExpr('Title field', { ns: 'calendar' }),
      uiMode(ctx) {
        return {
          type: 'select',
          key: 'titleField',
          props: {
            options: (ctx.model as CalendarBlockModel).getTitleFieldOptions(),
          },
        };
      },
      defaultParams(ctx) {
        return {
          titleField: (ctx.model as CalendarBlockModel).getFieldNames().title,
        };
      },
      handler(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setProps({
          fieldNames: {
            ...(model.props?.fieldNames || {}),
            title: params.titleField,
          },
        });
      },
    },
    colorField: {
      title: tExpr('Color field', { ns: 'calendar' }),
      uiMode(ctx) {
        const model = ctx.model as CalendarBlockModel;
        return {
          type: 'select',
          key: 'colorFieldName',
          props: {
            options: [{ label: ctx.t('Not selected'), value: '' }, ...model.getColorFieldOptions()],
          },
        };
      },
      defaultParams(ctx) {
        return {
          colorFieldName: (ctx.model as CalendarBlockModel).getFieldNames().colorFieldName || '',
        };
      },
      handler(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setProps({
          fieldNames: {
            ...(model.props?.fieldNames || {}),
            colorFieldName: params.colorFieldName || undefined,
          },
        });
      },
    },
    startDateField: {
      title: tExpr('Start date field', { ns: 'calendar' }),
      uiMode(ctx) {
        return {
          type: 'select',
          key: 'start',
          props: {
            options: (ctx.model as CalendarBlockModel).getDateFieldOptions(),
          },
        };
      },
      defaultParams(ctx) {
        return {
          start: (ctx.model as CalendarBlockModel).getFieldNames().start,
        };
      },
      handler(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setProps({
          fieldNames: {
            ...(model.props?.fieldNames || {}),
            start: params.start,
          },
        });
      },
    },
    endDateField: {
      title: tExpr('End date field', { ns: 'calendar' }),
      uiMode(ctx) {
        return {
          type: 'select',
          key: 'end',
          props: {
            options: [
              { label: ctx.t('Not selected'), value: '' },
              ...(ctx.model as CalendarBlockModel).getDateFieldOptions(),
            ],
          },
        };
      },
      defaultParams(ctx) {
        return {
          end: (ctx.model as CalendarBlockModel).getFieldNames().end || '',
        };
      },
      handler(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setProps({
          fieldNames: {
            ...(model.props?.fieldNames || {}),
            end: params.end || undefined,
          },
        });
      },
    },
    defaultView: {
      title: tExpr('Default view', { ns: 'calendar' }),
      uiMode: {
        type: 'select',
        key: 'defaultView',
        props: {
          options: VIEW_OPTIONS,
        },
      },
      defaultParams(ctx) {
        return {
          defaultView: (ctx.model as CalendarBlockModel).getDefaultView(),
        };
      },
      handler(ctx, params) {
        (ctx.model as CalendarBlockModel).setProps({ defaultView: params.defaultView || 'month' });
      },
    },
    quickCreateEvent: {
      title: tExpr('Quick create event', { ns: 'calendar' }),
      uiMode: { type: 'switch', key: 'enableQuickCreateEvent' },
      defaultParams(ctx) {
        return {
          enableQuickCreateEvent: (ctx.model as CalendarBlockModel).props?.enableQuickCreateEvent ?? true,
        };
      },
      handler(ctx, params) {
        (ctx.model as CalendarBlockModel).setProps({ enableQuickCreateEvent: params.enableQuickCreateEvent !== false });
      },
    },
    eventOpenMode: {
      title: tExpr('Event open mode', { ns: 'calendar' }),
      uiMode: {
        type: 'select',
        key: 'eventOpenMode',
        props: {
          options: EVENT_OPEN_MODE_OPTIONS,
        },
      },
      defaultParams(ctx) {
        return {
          eventOpenMode: (ctx.model as CalendarBlockModel).getEventOpenMode(),
        };
      },
      async handler(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setProps({ eventOpenMode: normalizeEventOpenMode(params.eventOpenMode) });

        await Promise.all([
          model.syncPopupActionOpenMode(model.getQuickCreateAction()),
          model.syncPopupActionOpenMode(model.getEventViewAction()),
        ]);
      },
    },
    showLunar: {
      title: tExpr('Show lunar', { ns: 'calendar' }),
      uiMode: { type: 'switch', key: 'showLunar' },
      defaultParams(ctx) {
        return {
          showLunar: (ctx.model as CalendarBlockModel).props?.showLunar === true,
        };
      },
      handler(ctx, params) {
        (ctx.model as CalendarBlockModel).setProps({ showLunar: params.showLunar === true });
      },
    },
    weekStart: {
      title: tExpr('Week start day', { ns: 'calendar' }),
      uiMode: {
        type: 'select',
        key: 'weekStart',
        props: {
          options: WEEK_START_OPTIONS,
        },
      },
      defaultParams(ctx) {
        return {
          weekStart: (ctx.model as CalendarBlockModel).getWeekStart(),
        };
      },
      handler(ctx, params) {
        (ctx.model as CalendarBlockModel).setProps({ weekStart: params.weekStart });
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
  },
});

CalendarBlockModel.define({
  label: tExpr('Calendar', { ns: 'calendar' }),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'CalendarBlockModel',
  },
  sort: 490,
});
