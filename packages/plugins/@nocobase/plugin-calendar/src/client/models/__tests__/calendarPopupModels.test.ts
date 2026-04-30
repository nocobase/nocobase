/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildCalendarSlotFormData } from '../actions/CalendarPopupModels';
import { CalendarBlockModel } from '../CalendarBlockModel';

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

  it('should hide quick create popup settings when quick create is disabled', () => {
    const flow: any = (CalendarBlockModel as any).globalFlowRegistry.getFlow('calendarSettings');
    const step = flow?.steps?.quickCreatePopupSettings;
    const model = {
      props: { enableQuickCreateEvent: true },
      getStepParams: vi.fn(() => ({ enableQuickCreateEvent: false })),
    };

    expect(step?.hideInSettings?.({ model } as any)).toBe(true);
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

    const setStepParams = vi.fn();
    const action = {
      uid: 'calendar-action-uid',
      getStepParams: vi.fn(() => ({})),
      setStepParams,
    };

    await model.syncPopupActionSettings(action, 'eventViewAction');

    expect(setStepParams).toHaveBeenCalledWith('popupSettings', 'openView', {
      mode: 'dialog',
      size: 'large',
      pageModelClass: 'ChildPageModel',
      uid: 'popup-template-target-uid',
      popupTemplateUid: 'popup-template-uid',
      popupTemplateHasFilterByTk: true,
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

    const setStepParams = vi.fn();
    const action = {
      uid: 'calendar-quick-create-action-uid',
      getStepParams: vi.fn(() => ({})),
      setStepParams,
    };

    await model.syncPopupActionSettings(action, 'quickCreateAction');

    expect(setStepParams).toHaveBeenCalledWith('popupSettings', 'openView', {
      mode: 'dialog',
      size: 'large',
      pageModelClass: 'ChildPageModel',
      uid: 'calendar-quick-create-action-uid',
      collectionName: 'events',
      dataSourceKey: 'main',
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

    const setStepParams = vi.fn();
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
      setStepParams,
    };

    model.setPopupSettings('eventViewAction', {
      mode: 'dialog',
      size: 'large',
      popupTemplateUid: undefined,
    });
    await model.syncPopupActionSettings(action, 'eventViewAction');

    expect(setStepParams).toHaveBeenCalledWith('popupSettings', 'openView', {
      mode: 'dialog',
      size: 'large',
      pageModelClass: 'ChildPageModel',
      uid: 'calendar-action-uid',
      collectionName: 'events',
      dataSourceKey: 'main',
    });
  });
});
