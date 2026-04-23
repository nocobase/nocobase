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
  buildCalendarSlotFormData,
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

const getWeekStartOptions = (translate: (key: string, options?: Record<string, any>) => string) => [
  { label: translate('Monday', { ns: 'calendar' }), value: 1 },
  { label: translate('Sunday', { ns: 'calendar' }), value: 0 },
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

  getPopupSettingsPropKey(actionKey: 'quickCreateAction' | 'eventViewAction') {
    return actionKey === 'quickCreateAction' ? 'quickCreatePopupSettings' : 'eventPopupSettings';
  }

  getStoredPopupSettings(actionKey: 'quickCreateAction' | 'eventViewAction') {
    const propKey = this.getPopupSettingsPropKey(actionKey);
    return this.props?.[propKey] || {};
  }

  normalizePopupSettings(actionKey: 'quickCreateAction' | 'eventViewAction', popupSettings?: Record<string, any>) {
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

    // Quick create is collection-scene; keep it isolated from record-scoped template state.
    if (actionKey === 'quickCreateAction' && nextParams.popupTemplateHasFilterByTk) {
      delete nextParams.popupTemplateUid;
      delete nextParams.popupTemplateContext;
      delete nextParams.popupTemplateHasFilterByTk;
      delete nextParams.popupTemplateHasSourceId;
      delete nextParams.uid;
    }

    return nextParams;
  }

  setPopupSettings(actionKey: 'quickCreateAction' | 'eventViewAction', popupSettings?: Record<string, any>) {
    const propKey = this.getPopupSettingsPropKey(actionKey);
    const normalized = this.normalizePopupSettings(actionKey, popupSettings);
    this.setProps({
      [propKey]: normalized,
    });
    return normalized;
  }

  getPopupSettings(action: any, actionKey: 'quickCreateAction' | 'eventViewAction', actionUid?: string) {
    const defaults = this.getPopupSettingsDefaults(action?.uid || actionUid);
    const currentParams = this.getStoredPopupSettings(actionKey);

    return {
      ...defaults,
      ...currentParams,
      uid: currentParams.uid || defaults.uid,
      collectionName: currentParams.collectionName || defaults.collectionName,
      dataSourceKey: currentParams.dataSourceKey || defaults.dataSourceKey,
    };
  }

  async syncPopupActionSettings(action: any, actionKey: 'quickCreateAction' | 'eventViewAction') {
    if (!action) {
      return;
    }

    const nextSettings = this.getPopupSettings(action, actionKey, action?.uid);
    const currentParams = action.getStepParams?.('popupSettings', 'openView') || {};
    if (JSON.stringify(currentParams) === JSON.stringify(nextSettings)) {
      return;
    }

    action.setStepParams('popupSettings', 'openView', nextSettings);

    if (this.context.flowSettingsEnabled && action?.saveStepParams) {
      await action.saveStepParams();
    }
  }

  async loadPopupAction(actionKey: 'quickCreateAction' | 'eventViewAction') {
    const actionUid = this.getPopupActionUid(actionKey);
    try {
      return this.flowEngine.getModel(actionUid) || (await this.flowEngine.loadModel({ uid: actionUid }));
    } catch (error) {
      return null;
    }
  }

  async ensurePopupAction(actionKey: 'quickCreateAction' | 'eventViewAction') {
    const buildActionOptions =
      actionKey === 'quickCreateAction'
        ? () => createCalendarQuickCreateActionOptions(this.getPopupActionUid(actionKey))
        : () => createCalendarEventViewActionOptions(this.getPopupActionUid(actionKey));
    let action = this.subModels?.[actionKey] as any;

    if (!action) {
      const loadedAction = await this.loadPopupAction(actionKey);

      if (loadedAction) {
        this.setSubModel(actionKey, loadedAction);
      } else {
        this.setSubModel(actionKey, buildActionOptions());
      }

      action = this.subModels?.[actionKey] as any;
    }

    if (this.context.flowSettingsEnabled && action?.save) {
      await action.save();
    }

    await this.syncPopupActionSettings(action, actionKey);

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

    const formData = buildCalendarSlotFormData({
      slotInfo,
      collection: this.collection,
      popupAction: action,
      fieldNames: this.getFieldNames(),
    });

    await action.dispatchEvent(
      'click',
      {
        ...(Object.keys(formData).length ? { formData } : {}),
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
            options: [{ label: ctx.t('Not selected', { ns: 'calendar' }), value: '' }, ...model.getColorFieldOptions()],
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
              { label: ctx.t('Not selected', { ns: 'calendar' }), value: '' },
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
    quickCreatePopupSettings: {
      use: 'openView',
      title: tExpr('Quick create popup settings', { ns: 'calendar' }),
      hideInSettings(ctx) {
        const stepParams = ctx.model.getStepParams?.('calendarSettings', 'quickCreateEvent');
        const enabled = stepParams?.enableQuickCreateEvent;
        const defaultEnabled = (ctx.model as CalendarBlockModel).props?.enableQuickCreateEvent ?? true;

        return !(enabled ?? defaultEnabled);
      },
      async defaultParams(ctx) {
        const model = ctx.model as CalendarBlockModel;
        const action = await model.ensurePopupAction('quickCreateAction');
        return model.getPopupSettings(action, 'quickCreateAction', model.getPopupActionUid('quickCreateAction'));
      },
      async handler(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setPopupSettings('quickCreateAction', params);
        const action = await model.ensurePopupAction('quickCreateAction');
        await model.syncPopupActionSettings(action, 'quickCreateAction');
      },
    },
    eventPopupSettings: {
      use: 'openView',
      title: tExpr('Event popup settings', { ns: 'calendar' }),
      async defaultParams(ctx) {
        const model = ctx.model as CalendarBlockModel;
        const action = await model.ensurePopupAction('eventViewAction');
        return model.getPopupSettings(action, 'eventViewAction', model.getPopupActionUid('eventViewAction'));
      },
      async handler(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setPopupSettings('eventViewAction', params);
        const action = await model.ensurePopupAction('eventViewAction');
        await model.syncPopupActionSettings(action, 'eventViewAction');
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
      uiMode(ctx) {
        return {
          type: 'select',
          key: 'weekStart',
          props: {
            options: getWeekStartOptions(ctx.t),
          },
        };
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
