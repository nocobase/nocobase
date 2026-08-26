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
import { FieldAssignExactDatePicker } from '../FieldAssignExactDatePicker';

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

describe('FieldAssignExactDatePicker', () => {
  beforeEach(() => {
    capturedDatePickerProps = undefined;
    capturedRangePickerProps = undefined;
    capturedSelectProps = undefined;
  });

  it('keeps single ISO date semantic under weekday-only format', () => {
    render(
      <FieldAssignExactDatePicker value="2037-03-06T12:34:56.000Z" format="dddd HH:mm:ss" showTime picker="date" />,
    );

    expect(dayjs.isDayjs(capturedDatePickerProps?.value)).toBe(true);
    expect(capturedDatePickerProps?.value?.year()).toBe(2037);
    expect(capturedDatePickerProps?.value?.date()).toBe(6);
  });

  it('emits dayjs value on single picker change', () => {
    const onChange = vi.fn();
    render(<FieldAssignExactDatePicker value="2037-03-06T12:34:56.000Z" showTime onChange={onChange} />);

    act(() => {
      capturedDatePickerProps?.onChange?.(dayjs('2037-03-07T01:02:03.000Z'));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(dayjs.isDayjs(onChange.mock.calls[0][0])).toBe(true);
  });

  it('keeps range ISO date semantic under weekday-only format', () => {
    render(
      <FieldAssignExactDatePicker
        isRange
        value={['2037-03-06T12:34:56.000Z', '2037-03-07T01:02:03.000Z']}
        format="dddd HH:mm:ss"
        showTime
        picker="date"
      />,
    );

    expect(Array.isArray(capturedRangePickerProps?.value)).toBe(true);
    expect(dayjs.isDayjs(capturedRangePickerProps?.value?.[0])).toBe(true);
    expect(dayjs.isDayjs(capturedRangePickerProps?.value?.[1])).toBe(true);
    expect(capturedRangePickerProps?.value?.[0]?.year()).toBe(2037);
    expect(capturedRangePickerProps?.value?.[1]?.year()).toBe(2037);
    expect(capturedRangePickerProps?.value?.[0]?.date()).toBe(6);
    expect(capturedRangePickerProps?.value?.[1]?.date()).toBe(7);
  });

  it('keeps semantic date when switching picker granularity', () => {
    const onChange = vi.fn();
    render(<FieldAssignExactDatePicker value="2037-03-06T12:34:56.000Z" showTime onChange={onChange} />);

    act(() => {
      capturedSelectProps?.onChange?.('month');
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(dayjs.isDayjs(onChange.mock.calls[0][0])).toBe(true);
    expect(onChange.mock.calls[0][0].year()).toBe(2037);
    expect(onChange.mock.calls[0][0].date()).toBe(6);
  });
});
