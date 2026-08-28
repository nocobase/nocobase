/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { renderHook } from '@testing-library/react';
import { ConfigProvider, theme } from 'antd';
import React from 'react';
import { buildCalendarSlotFormData } from '../actions/CalendarPopupModels';
import { CalendarBlockModel } from '../CalendarBlockModel';
import { PluginCalendarClient } from '../../plugin';

describe('calendarPopupModels', () => {
  it('should expose preset field settings before creating a calendar block', () => {
    const flow: any = (CalendarBlockModel as any).globalFlowRegistry.getFlow('calendarSettings');
    const step = flow?.steps?.fields;
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;

    Object.defineProperty(model, 'props', {
      value: {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(model, 'collection', {
      value: {
        filterTargetKey: 'id',
        getFields: () => [
          { name: 'name', interface: 'input', uiSchema: { title: 'Name' } },
          { name: 'startsAt', interface: 'datetime', uiSchema: { title: 'Starts at' } },
          { name: 'endsAt', type: 'datetime', uiSchema: { title: 'Ends at' } },
        ],
      },
      configurable: true,
    });
    Object.defineProperty(model, 'calendarPlugin', {
      value: {
        titleFieldInterfaces: {},
        colorFieldInterfaces: {},
        dateTimeFieldInterfaces: [],
      },
      configurable: true,
    });
    (model as any).setProps = function setProps(next: Record<string, any>) {
      this.props = {
        ...(this.props || {}),
        ...next,
      };
    };

    expect(step).toMatchObject({
      preset: true,
      hideInSettings: true,
      title: '{{t("Calendar fields", {"ns":"calendar"})}}',
    });
    expect(step.defaultParams({ model } as any)).toEqual({});
    expect(step.uiSchema({ model } as any)).toMatchObject({
      titleField: {
        title: '{{t("Title field", {"ns":"calendar"})}}',
        required: true,
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        'x-component-props': {
          options: [{ label: 'Name', value: 'name' }],
        },
      },
      start: {
        title: '{{t("Start date field", {"ns":"calendar"})}}',
        required: true,
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        'x-component-props': {
          options: [
            { label: 'Starts at', value: 'startsAt' },
            { label: 'Ends at', value: 'endsAt' },
          ],
        },
      },
      end: {
        title: '{{t("End date field", {"ns":"calendar"})}}',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        'x-component-props': {
          allowClear: true,
          options: [
            { label: 'Starts at', value: 'startsAt' },
            { label: 'Ends at', value: 'endsAt' },
          ],
        },
      },
    });

    step.beforeParamsSave({ model } as any, {
      titleField: 'name',
      start: 'startsAt',
      end: 'endsAt',
    });

    expect(model.props.fieldNames).toEqual({
      title: 'name',
      start: 'startsAt',
      end: 'endsAt',
    });
  });

  it('should preserve an empty end date field selection without falling back to defaults', () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;

    Object.defineProperty(model, 'props', {
      value: {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(model, 'collection', {
      value: {
        filterTargetKey: 'id',
        getFields: () => [
          { name: 'name', interface: 'input', uiSchema: { title: 'Name' } },
          { name: 'startsAt', interface: 'datetime', uiSchema: { title: 'Starts at' } },
          { name: 'endsAt', type: 'datetime', uiSchema: { title: 'Ends at' } },
        ],
      },
      configurable: true,
    });
    Object.defineProperty(model, 'calendarPlugin', {
      value: {
        titleFieldInterfaces: {},
        colorFieldInterfaces: {},
        dateTimeFieldInterfaces: [],
      },
      configurable: true,
    });
    (model as any).setProps = function setProps(next: Record<string, any>) {
      this.props = {
        ...(this.props || {}),
        ...next,
      };
    };

    const flow: any = (CalendarBlockModel as any).globalFlowRegistry.getFlow('calendarSettings');
    flow.steps.fields.beforeParamsSave({ model } as any, {
      titleField: 'name',
      start: 'startsAt',
    });

    expect(model.props.fieldNames).toEqual({
      title: 'name',
      start: 'startsAt',
      end: null,
    });
    expect(model.getFieldNames()).toEqual({
      id: 'id',
      title: 'name',
      start: 'startsAt',
      end: undefined,
      colorFieldName: undefined,
    });
  });

  it('should persist the color field selection before saving settings', () => {
    const flow: any = (CalendarBlockModel as any).globalFlowRegistry.getFlow('calendarSettings');
    const step = flow?.steps?.colorField;
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;

    Object.defineProperty(model, 'props', {
      value: {
        fieldNames: {
          title: 'name',
          start: 'startsAt',
          end: 'endsAt',
        },
      },
      writable: true,
      configurable: true,
    });
    (model as any).setProps = function setProps(next: Record<string, unknown>) {
      this.props = {
        ...(this.props || {}),
        ...next,
      };
    };

    step.beforeParamsSave({ model } as any, { colorFieldName: 'status' });

    expect(model.props.fieldNames).toEqual({
      title: 'name',
      start: 'startsAt',
      end: 'endsAt',
      colorFieldName: 'status',
    });
  });

  it('should append associated title and color field paths when creating the resource', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({ CalendarBlockModel });
    flowEngine.dataSourceManager.getDataSource('main').addCollection({
      name: 'calendar_events',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'integer' },
        { name: 'startsAt', type: 'datetime', interface: 'datetime' },
        { name: 'endsAt', type: 'datetime', interface: 'datetime' },
        { name: 'owner', type: 'belongsTo', interface: 'm2o', target: 'users' },
        { name: 'status', type: 'belongsTo', interface: 'm2o', target: 'statuses' },
      ],
    });

    const model = flowEngine.createModel<CalendarBlockModel>({
      use: 'CalendarBlockModel',
      props: {
        fieldNames: {
          title: ['owner', 'nickname'],
          start: 'startsAt',
          end: 'endsAt',
          colorFieldName: ['status', 'color'],
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'calendar_events',
          },
        },
      },
    });

    expect(model.resource.getAppends()).toEqual(['owner', 'status']);
  });

  it('should resolve default color field background colors to concrete color values', () => {
    const plugin = new PluginCalendarClient({} as any, {} as any);
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ConfigProvider, { theme: { token: { blue: '#123456' } } }, children);
    const { result } = renderHook(
      () => {
        const { token } = theme.useToken();
        const selectColor = plugin.getColorFieldInterface('select').useGetColor(
          {
            interface: 'select',
            uiSchema: {
              enum: [
                { label: 'Todo', value: 'todo', color: 'blue' },
                { label: 'Done', value: 'done', color: '#52c41a' },
                { label: 'Other', value: 'other', color: 'default' },
              ],
            },
          },
          { token },
        );
        const colorFieldColor = plugin.getColorFieldInterface('color').useGetColor(
          {
            interface: 'color',
          },
          { token },
        );

        return {
          colorFieldColor,
          selectColor,
          token,
        };
      },
      { wrapper },
    );

    expect(result.current.selectColor.getFontColor('todo')).toBe(result.current.token.blue7);
    expect(result.current.selectColor.getBackgroundColor('todo')).toBe(result.current.token.blue1);
    expect(result.current.selectColor.getBorderColor?.('todo')).toBe(result.current.token.blue3);
    expect(result.current.selectColor.getFontColor('done')).toBe(result.current.token.colorTextLightSolid);
    expect(result.current.selectColor.getBackgroundColor('done')).toBe('#52c41a');
    expect(result.current.selectColor.getBorderColor?.('done')).toBe('transparent');
    expect(result.current.selectColor.getFontColor('other')).toBeNull();
    expect(result.current.selectColor.getBackgroundColor('other')).toBeNull();
    expect(result.current.selectColor.getBorderColor?.('other')).toBeNull();
    expect(result.current.colorFieldColor.getFontColor({ hex: '#fa541c' })).toBeNull();
    expect(result.current.colorFieldColor.getBackgroundColor({ hex: '#fa541c' })).toBe('#fa541c');
  });

  it('should hide quick create popup settings when quick create is disabled', () => {
    const flow: any = (CalendarBlockModel as any).globalFlowRegistry.getFlow('calendarSettings');
    const step = flow?.steps?.quickCreatePopupSettings;
    const model = {
      props: { enableQuickCreateEvent: true },
      getStepParams: vi.fn(() => ({ enableQuickCreateEvent: false })),
    };

    expect(step?.hideInSettings?.({ model } as any)).toBe(true);
  });

  it('should normalize quick create popup settings default params before rendering settings', async () => {
    const flow: any = (CalendarBlockModel as any).globalFlowRegistry.getFlow('calendarSettings');
    const step = flow?.steps?.quickCreatePopupSettings;
    const action = { uid: 'quick-action-uid' };
    const popupSettings = { popupTemplateUid: 'record-template-uid', uid: 'record-template-target-uid' };
    const normalizedSettings = { uid: 'quick-action-uid' };
    const model = {
      ensurePopupAction: vi.fn().mockResolvedValue(action),
      getPopupSettings: vi.fn(() => popupSettings),
      normalizeQuickCreatePopupTemplateContext: vi.fn().mockResolvedValue(normalizedSettings),
    };

    await expect(step?.defaultParams?.({ model } as any)).resolves.toBe(normalizedSettings);
    expect(model.getPopupSettings).toHaveBeenCalledWith(action, 'quickCreateAction', action.uid);
    expect(model.normalizeQuickCreatePopupTemplateContext).toHaveBeenCalledWith(
      'quickCreateAction',
      popupSettings,
      action.uid,
    );
  });

  it('should expose popup settings from hidden actions instead of stale calendar step params', () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      configurable: true,
    });
    Object.defineProperty(model, 'stepParams', {
      value: {
        calendarSettings: {
          quickCreatePopupSettings: {
            uid: 'stale-template-target-uid',
            popupTemplateUid: 'stale-template-uid',
          },
          eventPopupSettings: {
            uid: 'stale-event-template-target-uid',
            popupTemplateUid: 'stale-event-template-uid',
          },
        },
      },
      configurable: true,
    });
    Object.defineProperty(model, 'subModels', {
      value: {
        quickCreateAction: {
          uid: 'quick-create-action-uid',
          getStepParams: vi.fn(() => ({
            mode: 'drawer',
            uid: 'quick-create-action-uid',
          })),
        },
        eventViewAction: {
          uid: 'event-view-action-uid',
          getStepParams: vi.fn(() => ({
            mode: 'dialog',
            uid: 'event-view-action-uid',
          })),
        },
      },
      configurable: true,
    });

    expect(model.getStepParams('calendarSettings', 'quickCreatePopupSettings')).toMatchObject({
      mode: 'drawer',
      uid: 'quick-create-action-uid',
      collectionName: 'events',
      dataSourceKey: 'main',
    });
    expect(model.getStepParams('calendarSettings', 'quickCreatePopupSettings')).not.toMatchObject({
      popupTemplateUid: 'stale-template-uid',
    });
    expect(model.getStepParams('calendarSettings', 'eventPopupSettings')).toMatchObject({
      mode: 'dialog',
      uid: 'event-view-action-uid',
      collectionName: 'events',
      dataSourceKey: 'main',
    });
  });

  it('should persist popup actions only from popup settings save hooks', async () => {
    const flow: any = (CalendarBlockModel as any).globalFlowRegistry.getFlow('calendarSettings');
    const quickCreateStep = flow?.steps?.quickCreatePopupSettings;
    const eventStep = flow?.steps?.eventPopupSettings;
    const ensurePopupAction = vi.fn().mockResolvedValue({ uid: 'u_popup_action' });
    const model = {
      setPopupSettings: vi.fn(),
      ensurePopupAction,
    };

    await quickCreateStep.handler({ model } as any, { mode: 'drawer' });
    await eventStep.handler({ model } as any, { mode: 'dialog' });

    expect(ensurePopupAction).not.toHaveBeenCalled();

    await quickCreateStep.beforeParamsSave({ model } as any, { mode: 'drawer' });
    await eventStep.beforeParamsSave({ model } as any, { mode: 'dialog' });

    expect(ensurePopupAction).toHaveBeenCalledWith('quickCreateAction');
    expect(ensurePopupAction).toHaveBeenCalledWith('eventViewAction');
  });

  it('should delegate calendar popup settings save to openView beforeParamsSave', async () => {
    const flow: any = (CalendarBlockModel as any).globalFlowRegistry.getFlow('calendarSettings');
    const eventStep = flow?.steps?.eventPopupSettings;
    const beforeParamsSave = vi.fn(async (_ctx, params) => {
      delete params.popupTemplateUid;
      delete params.popupTemplateContext;
      delete params.popupTemplateHasFilterByTk;
      delete params.uid;
    });
    const setPopupSettings = vi.fn();
    const hiddenActionParams = {
      popupTemplateUid: 'hidden-template',
      uid: 'hidden-template-target',
    };
    const ensurePopupAction = vi.fn().mockResolvedValue({
      uid: 'calendar-action-uid',
      getStepParams: vi.fn(() => hiddenActionParams),
    });
    const params = {
      mode: 'dialog',
      popupTemplateUid: undefined,
      popupTemplateContext: true,
      popupTemplateHasFilterByTk: true,
      uid: 'stale-template-target',
    };
    const model = {
      getAction: vi.fn(() => ({ beforeParamsSave })),
      setPopupSettings,
      ensurePopupAction,
    };

    await eventStep.beforeParamsSave({ model } as any, params, { popupTemplateUid: 'template-1' });

    expect(beforeParamsSave).toHaveBeenCalledWith({ model }, params, hiddenActionParams);
    expect(setPopupSettings).toHaveBeenCalledWith('eventViewAction', { mode: 'dialog' });
    expect(ensurePopupAction).toHaveBeenCalledWith('eventViewAction');
  });

  it('should build quick-create formData from the selected slot', () => {
    const slotInfo = {
      start: new Date(2026, 3, 20, 9, 30, 0),
      end: new Date(2026, 3, 20, 11, 45, 0),
    };
    const collection = {
      getField(fieldName: string) {
        if (fieldName === 'startsAt') {
          return {
            getComponentProps: () => ({ picker: 'date', dateOnly: true }),
          };
        }

        if (fieldName === 'endsAt') {
          return {
            getComponentProps: () => ({ picker: 'date', showTime: true }),
          };
        }

        return null;
      },
    };

    expect(
      buildCalendarSlotFormData({
        slotInfo,
        collection,
        fieldNames: {
          start: 'startsAt',
          end: 'endsAt',
        },
      }),
    ).toEqual({
      startsAt: '2026-04-20',
      endsAt: '2026-04-20 11:45:00',
    });
  });

  it('should support nested field paths for popup formData', () => {
    const slotInfo = {
      start: new Date(2026, 3, 20, 0, 0, 0),
      end: new Date(2026, 3, 21, 0, 0, 0),
    };
    const collection = {
      getField: () => ({
        getComponentProps: () => ({ picker: 'date', dateOnly: true }),
      }),
    };

    expect(
      buildCalendarSlotFormData({
        slotInfo,
        collection,
        fieldNames: {
          start: ['range', 'start'],
          end: ['range', 'end'],
        },
      }),
    ).toEqual({
      range: {
        start: '2026-04-20',
        end: '2026-04-21',
      },
    });
  });

  it('should preserve selected time ranges for datetime fields', () => {
    const slotInfo = {
      start: new Date(2026, 3, 20, 9, 30, 0),
      end: new Date(2026, 3, 20, 11, 45, 0),
    };
    const collection = {
      getField(fieldName: string) {
        if (fieldName === 'startsAt' || fieldName === 'endsAt') {
          return {
            getComponentProps: () => ({ picker: 'date', showTime: true }),
          };
        }

        return null;
      },
    };

    expect(
      buildCalendarSlotFormData({
        slotInfo,
        collection,
        fieldNames: {
          start: 'startsAt',
          end: 'endsAt',
        },
      }),
    ).toEqual({
      startsAt: '2026-04-20 09:30:00',
      endsAt: '2026-04-20 11:45:00',
    });
  });

  it('should prefer popup form field props over collection defaults', () => {
    const slotInfo = {
      start: new Date(2026, 3, 20, 14, 15, 0),
      end: new Date(2026, 3, 20, 16, 45, 0),
    };
    const collection = {
      getField(fieldName: string) {
        if (fieldName === 'startsAt' || fieldName === 'endsAt') {
          return {
            getComponentProps: () => ({ picker: 'date', dateOnly: true }),
          };
        }

        return null;
      },
    };
    const popupAction = {
      subModels: {
        page: {
          subModels: {
            form: {
              subModels: {
                grid: {
                  subModels: {
                    startField: {
                      getStepParams: (flowKey: string, stepKey: string) => {
                        if (flowKey === 'fieldSettings' && stepKey === 'init') {
                          return { fieldPath: 'startsAt' };
                        }
                      },
                      subModels: {
                        field: {
                          props: { picker: 'date', showTime: true },
                        },
                      },
                    },
                    endField: {
                      getStepParams: (flowKey: string, stepKey: string) => {
                        if (flowKey === 'fieldSettings' && stepKey === 'init') {
                          return { fieldPath: 'endsAt' };
                        }
                      },
                      subModels: {
                        field: {
                          props: { picker: 'date', showTime: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    expect(
      buildCalendarSlotFormData({
        slotInfo,
        collection,
        popupAction,
        fieldNames: {
          start: 'startsAt',
          end: 'endsAt',
        },
      }),
    ).toEqual({
      startsAt: '2026-04-20 14:15:00',
      endsAt: '2026-04-20 16:45:00',
    });
  });

  it('should preserve event popup template target uid when syncing popup settings', async () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: false,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {
        eventPopupSettings: {
          mode: 'dialog',
          size: 'large',
          uid: 'popup-template-target-uid',
          popupTemplateUid: 'popup-template-uid',
          popupTemplateHasFilterByTk: true,
        },
      },
      configurable: true,
    });

    const action = {
      uid: 'calendar-action-uid',
      getStepParams: vi.fn(() => ({})),
      stepParams: {},
    };

    await model.syncPopupActionSettings(action, 'eventViewAction');

    expect(action.stepParams).toEqual({
      popupSettings: {
        openView: {
          mode: 'dialog',
          size: 'large',
          pageModelClass: 'ChildPageModel',
          uid: 'popup-template-target-uid',
          popupTemplateUid: 'popup-template-uid',
          popupTemplateHasFilterByTk: true,
          collectionName: 'events',
          dataSourceKey: 'main',
        },
      },
    });
  });

  it('should prefer hidden popup action settings over legacy calendar popup props', async () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {
        eventPopupSettings: {
          mode: 'drawer',
          size: 'medium',
          uid: 'legacy-template-target',
          popupTemplateUid: 'legacy-template',
        },
      },
      configurable: true,
    });

    const action = {
      uid: 'calendar-action-uid',
      getStepParams: vi.fn(() => ({
        mode: 'dialog',
        size: 'large',
        uid: 'calendar-action-uid',
      })),
    };

    expect(model.getPopupSettings(action, 'eventViewAction')).toEqual({
      mode: 'dialog',
      size: 'large',
      pageModelClass: 'ChildPageModel',
      uid: 'calendar-action-uid',
      collectionName: 'events',
      dataSourceKey: 'main',
    });
  });

  it('should sync quick create popup settings independently from event popup settings', async () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: false,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {
        quickCreatePopupSettings: {
          mode: 'dialog',
          size: 'large',
        },
        eventPopupSettings: {
          mode: 'drawer',
          size: 'medium',
          uid: 'popup-template-target-uid',
          popupTemplateUid: 'popup-template-uid',
          popupTemplateContext: true,
          popupTemplateHasFilterByTk: true,
        },
      },
      configurable: true,
    });

    const action = {
      uid: 'calendar-quick-create-action-uid',
      getStepParams: vi.fn(() => ({})),
      stepParams: {},
    };

    await model.syncPopupActionSettings(action, 'quickCreateAction');

    expect(action.stepParams).toEqual({
      popupSettings: {
        openView: {
          mode: 'dialog',
          size: 'large',
          pageModelClass: 'ChildPageModel',
          uid: 'calendar-quick-create-action-uid',
          collectionName: 'events',
          dataSourceKey: 'main',
        },
      },
    });
  });

  it('should not expose event popup template params in quick create popup settings', () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      configurable: true,
    });

    const action = {
      uid: 'calendar-quick-create-action-uid',
      getStepParams: vi.fn(() => ({
        mode: 'dialog',
        size: 'large',
        uid: 'event-popup-template-target-uid',
        popupTemplateUid: 'event-popup-template-uid',
        filterByTk: '{{ ctx.record.id }}',
        popupTemplateHasFilterByTk: true,
      })),
    };

    expect(model.getPopupSettings(action, 'quickCreateAction')).toEqual({
      mode: 'dialog',
      size: 'large',
      pageModelClass: 'ChildPageModel',
      uid: 'calendar-quick-create-action-uid',
      collectionName: 'events',
      dataSourceKey: 'main',
    });
  });

  it('should clear persisted record-scoped popup template from quick create action', async () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: false,
        api: {
          resource: vi.fn(() => ({
            get: vi.fn(async () => ({
              data: {
                data: {
                  uid: 'event-template-uid',
                  filterByTk: '{{ ctx.record.id }}',
                },
              },
            })),
          })),
        },
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      configurable: true,
    });

    const action = {
      uid: 'calendar-quick-create-action-uid',
      getStepParams: vi.fn(() => ({
        mode: 'drawer',
        size: 'medium',
        uid: 'event-popup-template-target-uid',
        popupTemplateUid: 'event-template-uid',
        collectionName: 'events',
        dataSourceKey: 'main',
      })),
      stepParams: {},
    };

    await model.syncPopupActionSettings(action, 'quickCreateAction');

    expect(action.stepParams).toEqual({
      popupSettings: {
        openView: {
          mode: 'drawer',
          size: 'medium',
          pageModelClass: 'ChildPageModel',
          uid: 'calendar-quick-create-action-uid',
          collectionName: 'events',
          dataSourceKey: 'main',
        },
      },
    });
  });

  it('should keep collection-scene quick create popup template with historical record default filterByTk', async () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'flowEngine', {
      value: {
        getModelClass: vi.fn((use: string) => {
          if (use !== 'AddNewActionModel') {
            return undefined;
          }
          return class AddNewActionModel {
            static _isScene(scene: string) {
              return scene === 'collection';
            }
          };
        }),
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: false,
        api: {
          resource: vi.fn(() => ({
            get: vi.fn(async () => ({
              data: {
                data: {
                  uid: 'collection-template-uid',
                  useModel: 'AddNewActionModel',
                  filterByTk: '{{ ctx.record.id }}',
                },
              },
            })),
          })),
        },
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      configurable: true,
    });

    const action = {
      uid: 'calendar-quick-create-action-uid',
      getStepParams: vi.fn(() => ({
        mode: 'drawer',
        size: 'medium',
        uid: 'collection-template-target-uid',
        popupTemplateUid: 'collection-template-uid',
        filterByTk: '{{ ctx.record.id }}',
        collectionName: 'events',
        dataSourceKey: 'main',
      })),
      stepParams: {},
    };

    await model.syncPopupActionSettings(action, 'quickCreateAction');

    expect(action.stepParams).toEqual({
      popupSettings: {
        openView: {
          mode: 'drawer',
          size: 'medium',
          pageModelClass: 'ChildPageModel',
          uid: 'collection-template-target-uid',
          popupTemplateUid: 'collection-template-uid',
          collectionName: 'events',
          dataSourceKey: 'main',
        },
      },
    });
  });

  it('should keep calendar popup template copy mode when the template uid is empty', async () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: false,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      writable: true,
      configurable: true,
    });
    (model as any).setProps = function setProps(next: Record<string, any>) {
      this.props = {
        ...(this.props || {}),
        ...next,
      };
    };

    const action = {
      uid: 'calendar-action-uid',
      getStepParams: vi.fn(() => ({})),
      stepParams: {},
    };

    model.setPopupSettings('eventViewAction', {
      mode: 'dialog',
      size: 'large',
      popupTemplateUid: undefined,
      popupTemplateContext: true,
      uid: 'copied-popup-uid',
      dataSourceKey: 'main',
      collectionName: 'template_events',
    });
    await model.syncPopupActionSettings(action, 'eventViewAction', { persist: true });

    expect(action.stepParams).toEqual({
      popupSettings: {
        openView: {
          mode: 'dialog',
          size: 'large',
          pageModelClass: 'ChildPageModel',
          popupTemplateContext: true,
          uid: 'copied-popup-uid',
          collectionName: 'template_events',
          dataSourceKey: 'main',
        },
      },
    });
  });

  it('should clear stale popup template params when event template is removed', async () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: false,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {
        eventPopupSettings: {
          mode: 'drawer',
          size: 'medium',
          popupTemplateUid: 'popup-template-uid',
          popupTemplateContext: true,
          popupTemplateHasFilterByTk: true,
          popupTemplateHasSourceId: true,
          uid: 'popup-template-target-uid',
        },
      },
      writable: true,
      configurable: true,
    });
    (model as any).setProps = function setProps(next: Record<string, any>) {
      this.props = {
        ...(this.props || {}),
        ...next,
      };
    };

    const action = {
      uid: 'calendar-action-uid',
      getStepParams: vi.fn(() => ({
        mode: 'drawer',
        size: 'medium',
        uid: 'popup-template-target-uid',
        popupTemplateUid: 'popup-template-uid',
        popupTemplateContext: true,
        popupTemplateHasFilterByTk: true,
        popupTemplateHasSourceId: true,
      })),
      stepParams: {
        popupSettings: {
          openView: {
            mode: 'drawer',
            size: 'medium',
            uid: 'popup-template-target-uid',
            popupTemplateUid: 'popup-template-uid',
            popupTemplateContext: true,
            popupTemplateHasFilterByTk: true,
            popupTemplateHasSourceId: true,
          },
        },
      },
    };

    model.setPopupSettings('eventViewAction', {
      mode: 'dialog',
      size: 'large',
      popupTemplateUid: undefined,
    });
    await model.syncPopupActionSettings(action, 'eventViewAction', { persist: true });

    expect(action.stepParams).toEqual({
      popupSettings: {
        openView: {
          mode: 'dialog',
          size: 'large',
          pageModelClass: 'ChildPageModel',
          uid: 'calendar-action-uid',
          collectionName: 'events',
          dataSourceKey: 'main',
        },
      },
    });
  });

  it('should keep popup collection context in add and event drawers', () => {
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      configurable: true,
    });

    expect(model.getPopupSettings({ uid: 'quick-action' }, 'quickCreateAction')).toMatchObject({
      uid: 'quick-action',
      collectionName: 'events',
      dataSourceKey: 'main',
    });
    expect(model.getPopupSettings({ uid: 'event-action' }, 'eventViewAction')).toMatchObject({
      uid: 'event-action',
      collectionName: 'events',
      dataSourceKey: 'main',
    });
  });

  it('should not persist hidden popup actions while opening calendar popups', async () => {
    const save = vi.fn();
    const saveStepParams = vi.fn();
    const action = {
      uid: 'u_event_popup',
      getStepParams: vi.fn(() => ({})),
      stepParams: {},
      save,
      saveStepParams,
    };
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'subModels', {
      value: {
        eventViewAction: action,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: true,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      configurable: true,
    });

    await model.ensurePopupAction('eventViewAction');

    expect(save).not.toHaveBeenCalled();
    expect(saveStepParams).not.toHaveBeenCalled();
    expect(action.stepParams).toEqual({
      popupSettings: {
        openView: {
          mode: 'drawer',
          size: 'medium',
          pageModelClass: 'ChildPageModel',
          uid: 'u_event_popup',
          collectionName: 'events',
          dataSourceKey: 'main',
        },
      },
    });
  });

  it('should persist hidden popup actions only when calendar popup settings are saved', async () => {
    const save = vi.fn();
    const saveStepParams = vi.fn();
    const action = {
      uid: 'u_event_popup',
      getStepParams: vi.fn(() => ({})),
      setStepParams: vi.fn(),
      save,
      saveStepParams,
    };
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'subModels', {
      value: {
        eventViewAction: action,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: true,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      configurable: true,
    });

    await model.ensurePopupAction('eventViewAction', { persist: true });

    expect(save).toHaveBeenCalledTimes(1);
    expect(saveStepParams).toHaveBeenCalledTimes(1);
  });

  it('should keep legacy calendar popup action uid usable when popup settings are saved', async () => {
    const destroy = vi.fn();
    const action = {
      uid: 'calendar-block-eventViewAction',
      getStepParams: vi.fn(() => ({})),
      setStepParams: vi.fn(),
      clone: vi.fn(),
      save: vi.fn(),
      saveStepParams: vi.fn(),
      destroy,
    };
    const model = Object.create(CalendarBlockModel.prototype) as CalendarBlockModel;
    Object.defineProperty(model, 'subModels', {
      value: {
        eventViewAction: action,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'collection', {
      value: {
        name: 'events',
        dataSourceKey: 'main',
      },
      configurable: true,
    });
    Object.defineProperty(model, 'context', {
      value: {
        flowSettingsEnabled: true,
      },
      configurable: true,
    });
    Object.defineProperty(model, 'props', {
      value: {},
      configurable: true,
    });
    model.setSubModel = vi.fn(function (this: any, key, value) {
      this.subModels[key] = value;
      return value;
    }) as any;

    await model.ensurePopupAction('eventViewAction');

    expect(action.clone).not.toHaveBeenCalled();
    expect(model.subModels.eventViewAction).toBe(action);
    expect(action.save).not.toHaveBeenCalled();
    expect(action.saveStepParams).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();

    await model.ensurePopupAction('eventViewAction', { persist: true });

    expect(action.clone).not.toHaveBeenCalled();
    expect(model.subModels.eventViewAction).toBe(action);
    expect(action.save).toHaveBeenCalledTimes(1);
    expect(action.saveStepParams).toHaveBeenCalledTimes(1);
    expect(destroy).not.toHaveBeenCalled();
  });

  it('should open quick-create drawer through the hidden action with selected slot data', async () => {
    const dispatchEvent = vi.fn().mockResolvedValue(undefined);
    const ensurePopupAction = vi.fn().mockResolvedValue({ uid: 'u_quick_create_popup', dispatchEvent });
    const slotInfo = {
      start: new Date(2026, 3, 20, 9, 30, 0),
      end: new Date(2026, 3, 20, 10, 30, 0),
    };

    await CalendarBlockModel.prototype.openQuickCreate.call(
      {
        props: {},
        context: {
          layoutContentElement: { id: 'layout-root' },
        },
        collection: {
          name: 'events',
          dataSourceKey: 'main',
          getField: () => ({
            getComponentProps: () => ({ picker: 'date', showTime: true }),
          }),
        },
        ensurePopupAction,
        getFieldNames: () => ({ start: 'startsAt', end: 'endsAt' }),
      } as any,
      slotInfo,
    );

    expect(ensurePopupAction).toHaveBeenCalledWith('quickCreateAction');
    expect(dispatchEvent).toHaveBeenCalledWith(
      'click',
      {
        formData: {
          startsAt: '2026-04-20 09:30:00',
          endsAt: '2026-04-20 10:30:00',
        },
        dataSourceKey: 'main',
        collectionName: 'events',
        target: { id: 'layout-root' },
      },
      { debounce: true },
    );
  });

  it('should open event drawer through the hidden action with record filter key', async () => {
    const dispatchEvent = vi.fn().mockResolvedValue(undefined);
    const ensurePopupAction = vi.fn().mockResolvedValue({ uid: 'u_event_view_popup', dispatchEvent });

    await CalendarBlockModel.prototype.openEvent.call(
      {
        context: {
          layoutContentElement: { id: 'layout-root' },
        },
        collection: {
          name: 'events',
          dataSourceKey: 'main',
          filterTargetKey: 'id',
          getFilterByTK: (record: any) => record.id,
        },
        ensurePopupAction,
      } as any,
      { id: 7 },
    );

    expect(ensurePopupAction).toHaveBeenCalledWith('eventViewAction');
    expect(dispatchEvent).toHaveBeenCalledWith(
      'click',
      {
        dataSourceKey: 'main',
        collectionName: 'events',
        filterByTk: 7,
        target: { id: 'layout-root' },
      },
      { debounce: true },
    );
  });
});
