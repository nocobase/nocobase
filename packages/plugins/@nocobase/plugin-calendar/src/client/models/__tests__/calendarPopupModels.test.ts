/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildCalendarSlotFormData } from '../actions/CalendarPopupModels';

describe('calendarPopupModels', () => {
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
});
