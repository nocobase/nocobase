/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { ActionModel, BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowSettingsButton,
  MultiRecordResource,
  observer,
} from '@nocobase/flow-engine';
import { Select, Space, theme } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import { tExpr } from '../locale';
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

type CalendarPopupActionOptions = {
  persist?: boolean;
};

const DRAG_HANDLER_TOOLBAR_ITEMS = [
  {
    key: 'drag-handler',
    component: DragHandler as React.ComponentType<any>,
    sort: 1,
  },
];

const useCalendarActionBarStyle = createStyles(({ token }) => {
  return {
    actionBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: token.margin,
      gap: token.marginXXS,
    },
  };
});

const getWeekStartOptions = (translate: (key: string, options?: Record<string, any>) => string) => [
  { label: translate('Monday', { ns: 'calendar' }), value: 1 },
  { label: translate('Sunday', { ns: 'calendar' }), value: 0 },
];

const applyCalendarFieldNames = (model: CalendarBlockModel, params: Record<string, any>) => {
  model.setProps({
    fieldNames: {
      ...(model.props?.fieldNames || {}),
      ...(Object.prototype.hasOwnProperty.call(params, 'titleField') ? { title: params.titleField } : {}),
      ...(Object.prototype.hasOwnProperty.call(params, 'start') ? { start: params.start } : {}),
      ...(Object.prototype.hasOwnProperty.call(params, 'end') ? { end: params.end || null } : {}),
    },
  });
};

const applyCalendarColorFieldName = (model: CalendarBlockModel, params: Record<string, any>) => {
  model.setProps({
    fieldNames: {
      ...(model.props?.fieldNames || {}),
      colorFieldName: params.colorFieldName || undefined,
    },
  });
};

const applyCalendarPresetFieldNames = (model: CalendarBlockModel, params: Record<string, any>) => {
  applyCalendarFieldNames(model, {
    ...params,
    end: params.end || null,
  });
};

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
    const hasEndFieldName = Object.prototype.hasOwnProperty.call(fieldNames, 'end');

    return {
      id: 'id',
      title: fieldNames.title || this.getDefaultTitleFieldName(),
      start: fieldNames.start || this.getDefaultStartFieldName(),
      end: hasEndFieldName ? fieldNames.end || undefined : this.getDefaultEndFieldName(),
      colorFieldName: fieldNames.colorFieldName,
    };
  }

  createResource() {
    const resource = this.context.createResource(MultiRecordResource);
    resource.addRequestParameter('paginate', false);

    const { title, start, end, colorFieldName } = this.getFieldNames();
    [title, start, end, colorFieldName].forEach((fieldPath) => {
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

  async syncPopupActionSettings(
    action: any,
    actionKey: 'quickCreateAction' | 'eventViewAction',
    options: CalendarPopupActionOptions = {},
  ) {
    if (!action) {
      return;
    }

    const nextSettings = this.getPopupSettings(action, actionKey, action?.uid);
    const currentParams = action.getStepParams?.('popupSettings', 'openView') || {};
    if (JSON.stringify(currentParams) === JSON.stringify(nextSettings)) {
      return;
    }

    action.setStepParams('popupSettings', 'openView', nextSettings);

    if (options.persist && this.context.flowSettingsEnabled && action?.saveStepParams) {
      await action.saveStepParams();
    }
  }

  async loadPopupAction(actionKey: 'quickCreateAction' | 'eventViewAction') {
    try {
      return await this.flowEngine.loadModel({ parentId: this.uid, subKey: actionKey });
    } catch (error) {
      return null;
    }
  }

  async ensurePopupAction(
    actionKey: 'quickCreateAction' | 'eventViewAction',
    options: CalendarPopupActionOptions = {},
  ) {
    const buildActionOptions =
      actionKey === 'quickCreateAction'
        ? () => createCalendarQuickCreateActionOptions()
        : () => createCalendarEventViewActionOptions();
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

    if (options.persist && this.context.flowSettingsEnabled && action?.save) {
      await action.save();
    }

    await this.syncPopupActionSettings(action, actionKey, options);

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
    const inputArgs = {
      ...(Object.keys(formData).length ? { formData } : {}),
      ...(this.collection?.dataSourceKey ? { dataSourceKey: this.collection.dataSourceKey } : {}),
      ...(this.collection?.name ? { collectionName: this.collection.name } : {}),
      target: this.context?.layoutContentElement,
    };

    if (typeof this.context?.openView === 'function' && action.uid) {
      await this.context.openView(action.uid, inputArgs);
      return;
    }

    await action.dispatchEvent('click', inputArgs, { debounce: true });
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
      target: this.context?.layoutContentElement,
    };

    if (typeof this.context?.openView === 'function' && action.uid) {
      await this.context.openView(action.uid, inputArgs);
      return;
    }

    await action.dispatchEvent('click', inputArgs, { debounce: true });
  }
}

const useDefaultGetColor = () => {
  return {
    getBackgroundColor: () => null,
    getBorderColor: () => null,
    getFontColor: () => null,
    loading: false,
  };
};

const CalendarBlockRenderer = observer(
  ({
    model,
    fieldNames,
    colorCollectionField,
    colorFieldInterface,
  }: {
    model: CalendarBlockModel;
    fieldNames: any;
    colorCollectionField: any;
    colorFieldInterface: any;
  }) => {
    const { styles } = useCalendarActionBarStyle();
    const { token } = theme.useToken();
    const useGetColor = colorFieldInterface?.useGetColor || useDefaultGetColor;
    const colorFunctions = useGetColor(colorCollectionField, { token });
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
          <div className={styles.actionBar}>
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
        onSelectSlot={async (slotInfo) => {
          await model.openQuickCreate(slotInfo);
        }}
        onSelectEvent={async ({ record }) => {
          await model.openEvent(record);
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
  const colorFieldInterface = colorCollectionField?.interface
    ? model.calendarPlugin?.getColorFieldInterface?.(colorCollectionField.interface)
    : null;

  return (
    <CalendarBlockRenderer
      key={[
        colorFieldName || '__calendar-default-color__',
        colorCollectionField?.interface || '__calendar-no-color-interface__',
        colorFieldInterface ? '__calendar-color-resolver__' : '__calendar-default-color-resolver__',
      ].join(':')}
      model={model}
      fieldNames={fieldNames}
      colorCollectionField={colorCollectionField}
      colorFieldInterface={colorFieldInterface}
    />
  );
});

CalendarBlockModel.registerFlow({
  key: 'calendarSettings',
  sort: 500,
  title: tExpr('Calendar'),
  steps: {
    fields: {
      title: tExpr('Calendar fields'),
      preset: true,
      hideInSettings: true,
      uiSchema(ctx) {
        const model = ctx.model as CalendarBlockModel;
        const titleFieldOptions = model.getTitleFieldOptions();
        const dateFieldOptions = model.getDateFieldOptions();

        return {
          titleField: {
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
            enum: dateFieldOptions,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-component-props': {
              options: dateFieldOptions,
              allowClear: true,
            },
          },
        };
      },
      defaultParams() {
        return {};
      },
      handler(ctx, params) {
        applyCalendarPresetFieldNames(ctx.model as CalendarBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyCalendarPresetFieldNames(ctx.model as CalendarBlockModel, params);
      },
    },
    titleField: {
      title: tExpr('Title field'),
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
        applyCalendarFieldNames(ctx.model as CalendarBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyCalendarFieldNames(ctx.model as CalendarBlockModel, params);
      },
    },
    colorField: {
      title: tExpr('Color field'),
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
        applyCalendarColorFieldName(ctx.model as CalendarBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyCalendarColorFieldName(ctx.model as CalendarBlockModel, params);
      },
    },
    startDateField: {
      title: tExpr('Start date field'),
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
        applyCalendarFieldNames(ctx.model as CalendarBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyCalendarFieldNames(ctx.model as CalendarBlockModel, params);
      },
    },
    endDateField: {
      title: tExpr('End date field'),
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
        applyCalendarFieldNames(ctx.model as CalendarBlockModel, params);
      },
      beforeParamsSave(ctx, params) {
        applyCalendarFieldNames(ctx.model as CalendarBlockModel, params);
      },
    },
    defaultView: {
      title: tExpr('Default view'),
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
      title: tExpr('Quick create event'),
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
      title: tExpr('Quick create popup settings'),
      hideInSettings(ctx) {
        const stepParams = ctx.model.getStepParams?.('calendarSettings', 'quickCreateEvent');
        const enabled = stepParams?.enableQuickCreateEvent;
        const defaultEnabled = (ctx.model as CalendarBlockModel).props?.enableQuickCreateEvent ?? true;

        return !(enabled ?? defaultEnabled);
      },
      async defaultParams(ctx) {
        const model = ctx.model as CalendarBlockModel;
        const action = await model.ensurePopupAction('quickCreateAction');
        return model.getPopupSettings(action, 'quickCreateAction', action?.uid);
      },
      async handler(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setPopupSettings('quickCreateAction', params);
      },
      async beforeParamsSave(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setPopupSettings('quickCreateAction', params);
        await model.ensurePopupAction('quickCreateAction', { persist: true });
      },
    },
    eventPopupSettings: {
      use: 'openView',
      title: tExpr('Event popup settings'),
      async defaultParams(ctx) {
        const model = ctx.model as CalendarBlockModel;
        const action = await model.ensurePopupAction('eventViewAction');
        return model.getPopupSettings(action, 'eventViewAction', action?.uid);
      },
      async handler(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setPopupSettings('eventViewAction', params);
      },
      async beforeParamsSave(ctx, params) {
        const model = ctx.model as CalendarBlockModel;
        model.setPopupSettings('eventViewAction', params);
        await model.ensurePopupAction('eventViewAction', { persist: true });
      },
    },
    showLunar: {
      title: tExpr('Show lunar'),
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
      title: tExpr('Week start day'),
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
  label: tExpr('Calendar'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'CalendarBlockModel',
  },
  sort: 490,
});
