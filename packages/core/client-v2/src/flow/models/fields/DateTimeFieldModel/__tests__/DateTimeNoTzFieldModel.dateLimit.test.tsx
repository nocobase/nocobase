/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils/client';
import { DateTimeNoTzPicker } from '../DateTimeNoTzFieldModel';

let capturedDatePickerProps: any;
let currentForm: any;
const mockResolveJsonTemplate = vi.fn();

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowModelContext: () => ({
      isMobileLayout: false,
      model: {
        context: {
          form: currentForm,
        },
      },
    }),
    useFlowContext: () => ({
      resolveJsonTemplate: mockResolveJsonTemplate,
    }),
  };
});

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    DatePicker: (props: any) => {
      capturedDatePickerProps = props;
      return <div data-testid="date-picker" />;
    },
    Form: actual.Form,
  };
});

const TestWrapper = (props: any) => {
  const [form] = Form.useForm();
  currentForm = form;

  return (
    <Form form={form} initialValues={{ b: '2026-05-10 12:34:56' }}>
      <DateTimeNoTzPicker {...props} />
    </Form>
  );
};

describe('DateTimeNoTzPicker date range limit', () => {
  beforeEach(() => {
    currentForm = undefined;
    capturedDatePickerProps = undefined;
    mockResolveJsonTemplate.mockReset();
    mockResolveJsonTemplate.mockImplementation(async (params) => ({
      ...params,
      _maxDate: currentForm?.getFieldValue?.('b'),
    }));
  });

  it('applies maxDate from current form field b', async () => {
    render(<TestWrapper picker="date" showTime _maxDate={'{{ $nForm.b }}'} onChange={vi.fn()} value={null} />);

    await waitFor(() => {
      expect(mockResolveJsonTemplate).toHaveBeenCalledWith({
        _minDate: undefined,
        _maxDate: '{{ $nForm.b }}',
      });
      expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-11 00:00:00'))).toBe(true);
    });

    const timeConfig = capturedDatePickerProps?.disabledTime?.(dayjs('2026-05-10 00:00:00'));
    expect(timeConfig?.disabledHours?.()).toContain(13);
    expect(timeConfig?.disabledHours?.()).not.toContain(12);
    expect(timeConfig?.disabledMinutes?.(12)).toContain(35);
    expect(timeConfig?.disabledMinutes?.(12)).not.toContain(34);
    expect(timeConfig?.disabledSeconds?.(12, 34)).toContain(57);
    expect(timeConfig?.disabledSeconds?.(12, 34)).not.toContain(56);
  });

  it('updates field a maxDate immediately when field b changes', async () => {
    render(<TestWrapper picker="date" showTime _maxDate={'{{ $nForm.b }}'} onChange={vi.fn()} value={null} />);

    await waitFor(() => {
      expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-11 00:00:00'))).toBe(true);
    });

    currentForm.setFieldValue('b', '2026-05-12 08:09:10');

    await waitFor(() => {
      expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-11 00:00:00'))).toBe(false);
      expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-13 00:00:00'))).toBe(true);
    });

    const timeConfig = capturedDatePickerProps?.disabledTime?.(dayjs('2026-05-12 00:00:00'));
    expect(timeConfig?.disabledHours?.()).toContain(9);
    expect(timeConfig?.disabledHours?.()).not.toContain(8);
    expect(timeConfig?.disabledMinutes?.(8)).toContain(10);
    expect(timeConfig?.disabledMinutes?.(8)).not.toContain(9);
    expect(timeConfig?.disabledSeconds?.(8, 9)).toContain(11);
    expect(timeConfig?.disabledSeconds?.(8, 9)).not.toContain(10);
  });

  it('applies minDate from current form field b', async () => {
    mockResolveJsonTemplate.mockImplementation(async (params) => ({
      ...params,
      _minDate: currentForm?.getFieldValue?.('b'),
      _maxDate: undefined,
    }));

    render(<TestWrapper picker="date" showTime _minDate={'{{ $nForm.b }}'} onChange={vi.fn()} value={null} />);

    await waitFor(() => {
      expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-09 00:00:00'))).toBe(true);
      expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-10 00:00:00'))).toBe(false);
    });

    const timeConfig = capturedDatePickerProps?.disabledTime?.(dayjs('2026-05-10 00:00:00'));
    expect(timeConfig?.disabledHours?.()).toContain(11);
    expect(timeConfig?.disabledHours?.()).not.toContain(12);
    expect(timeConfig?.disabledMinutes?.(12)).toContain(33);
    expect(timeConfig?.disabledMinutes?.(12)).not.toContain(34);
    expect(timeConfig?.disabledSeconds?.(12, 34)).toContain(55);
    expect(timeConfig?.disabledSeconds?.(12, 34)).not.toContain(56);
  });

  it('applies both minDate and maxDate together', async () => {
    mockResolveJsonTemplate.mockImplementation(async (params) => ({
      ...params,
      _minDate: '2026-05-10 08:00:00',
      _maxDate: '2026-05-12 18:30:40',
    }));

    render(
      <TestWrapper
        picker="date"
        showTime
        _minDate={'{{ $nForm.min }}'}
        _maxDate={'{{ $nForm.max }}'}
        onChange={vi.fn()}
        value={null}
      />,
    );

    await waitFor(() => {
      expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-09 00:00:00'))).toBe(true);
      expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-13 00:00:00'))).toBe(true);
    });

    expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-11 00:00:00'))).toBe(false);

    const minDayTimeConfig = capturedDatePickerProps?.disabledTime?.(dayjs('2026-05-10 00:00:00'));
    expect(minDayTimeConfig?.disabledHours?.()).toContain(7);
    expect(minDayTimeConfig?.disabledHours?.()).not.toContain(8);

    const maxDayTimeConfig = capturedDatePickerProps?.disabledTime?.(dayjs('2026-05-12 00:00:00'));
    expect(maxDayTimeConfig?.disabledHours?.()).toContain(19);
    expect(maxDayTimeConfig?.disabledHours?.()).not.toContain(18);
    expect(maxDayTimeConfig?.disabledMinutes?.(18)).toContain(31);
    expect(maxDayTimeConfig?.disabledMinutes?.(18)).not.toContain(30);
    expect(maxDayTimeConfig?.disabledSeconds?.(18, 30)).toContain(41);
    expect(maxDayTimeConfig?.disabledSeconds?.(18, 30)).not.toContain(40);
  });

  it('uses first minDate and last maxDate when resolved values are arrays', async () => {
    mockResolveJsonTemplate.mockImplementation(async (params) => ({
      ...params,
      _minDate: ['2026-05-10 08:00:00', '2026-05-11 09:00:00'],
      _maxDate: ['2026-05-12 10:00:00', '2026-05-13 11:12:13'],
    }));

    render(
      <TestWrapper
        picker="date"
        showTime
        _minDate={'{{ $nForm.min }}'}
        _maxDate={'{{ $nForm.max }}'}
        onChange={vi.fn()}
        value={null}
      />,
    );

    await waitFor(() => {
      expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-09 00:00:00'))).toBe(true);
      expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-14 00:00:00'))).toBe(true);
    });

    expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-10 00:00:00'))).toBe(false);
    expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-13 00:00:00'))).toBe(false);

    const timeConfig = capturedDatePickerProps?.disabledTime?.(dayjs('2026-05-13 00:00:00'));
    expect(timeConfig?.disabledHours?.()).toContain(12);
    expect(timeConfig?.disabledHours?.()).not.toContain(11);
    expect(timeConfig?.disabledMinutes?.(11)).toContain(13);
    expect(timeConfig?.disabledMinutes?.(11)).not.toContain(12);
    expect(timeConfig?.disabledSeconds?.(11, 12)).toContain(14);
    expect(timeConfig?.disabledSeconds?.(11, 12)).not.toContain(13);
  });

  it('clears date and time restrictions when resolved values are empty', async () => {
    mockResolveJsonTemplate.mockImplementation(async (params) => ({
      ...params,
      _minDate: undefined,
      _maxDate: undefined,
    }));

    render(
      <TestWrapper
        picker="date"
        showTime
        _minDate={'{{ $nForm.min }}'}
        _maxDate={'{{ $nForm.max }}'}
        onChange={vi.fn()}
        value={null}
      />,
    );

    await waitFor(() => {
      expect(capturedDatePickerProps).toBeTruthy();
    });

    expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-01 00:00:00'))).toBe(false);
    expect(capturedDatePickerProps?.disabledDate?.(dayjs('2026-05-31 00:00:00'))).toBe(false);

    const timeConfig = capturedDatePickerProps?.disabledTime?.(dayjs('2026-05-15 00:00:00'));
    expect(timeConfig?.disabledHours?.()).toEqual([]);
    expect(timeConfig?.disabledMinutes?.(12)).toEqual([]);
    expect(timeConfig?.disabledSeconds?.(12, 34)).toEqual([]);
  });
});
