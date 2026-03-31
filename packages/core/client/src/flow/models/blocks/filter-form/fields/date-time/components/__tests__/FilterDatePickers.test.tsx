/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils/client';

import { FilterDatePicker } from '../FilterDatePicker';
import { FilterRangePicker } from '../FilterRangePicker';

let capturedDatePickerProps: any;
let capturedRangePickerProps: any;
let capturedSelectProps: any;

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => ({
      isMobileLayout: false,
      model: {
        translate: (value: string) => value,
      },
    }),
    useFlowEngine: () => ({
      translate: (value: string) => value,
    }),
  };
});

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    DatePicker: Object.assign(
      (props: any) => {
        capturedDatePickerProps = props;
        return <div data-testid="date-picker" />;
      },
      {
        RangePicker: (props: any) => {
          capturedRangePickerProps = props;
          return <div data-testid="range-picker" />;
        },
      },
    ),
    Select: (props: any) => {
      capturedSelectProps = props;
      return <div data-testid="select" />;
    },
    Space: {
      Compact: ({ children }: { children: React.ReactNode }) => <div data-testid="compact">{children}</div>,
    },
  };
});

describe('Filter date pickers', () => {
  beforeEach(() => {
    capturedDatePickerProps = undefined;
    capturedRangePickerProps = undefined;
    capturedSelectProps = undefined;
  });

  it('resolves date format with showTime for single picker', () => {
    render(
      <FilterDatePicker
        picker="date"
        format="YYYY-MM-DD HH:mm:ss"
        showTime
        timeFormat="HH:mm:ss"
        value="2024-01-02 12:30:00"
      />,
    );

    expect(capturedDatePickerProps?.format).toBe('YYYY-MM-DD HH:mm:ss');
    expect(capturedDatePickerProps?.showTime).toBeTruthy();
  });

  it('keeps non-date picker format without time', () => {
    render(<FilterDatePicker picker="month" showTime format="YYYY-MM" value="2024-01" />);

    expect(capturedDatePickerProps?.format).toBe('YYYY-MM');
  });

  it('emits formatted value when switching picker', () => {
    const onChange = vi.fn();

    render(<FilterDatePicker picker="date" value="2024-01-15" onChange={onChange} />);

    act(() => {
      capturedSelectProps?.onChange?.('month');
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const [nextValue, nextString] = onChange.mock.calls[0];
    expect(dayjs.isDayjs(nextValue)).toBe(true);
    expect(nextString).toBe('2024-01');
  });

  it('resolves date format with showTime for range picker', () => {
    render(
      <FilterRangePicker
        picker="date"
        format="YYYY-MM-DD HH:mm:ss"
        showTime
        timeFormat="HH:mm:ss"
        value={['2024-01-01 08:00:00', '2024-01-02 09:00:00']}
      />,
    );

    expect(capturedRangePickerProps?.format).toBe('YYYY-MM-DD HH:mm:ss');
    expect(capturedRangePickerProps?.showTime).toBeTruthy();
  });
});
