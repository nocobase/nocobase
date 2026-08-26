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
import { act, fireEvent, render, screen } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils/client';
import { MobileDatePicker } from '../MobileDatePicker';

type MockDatePickerProps = Record<string, unknown> & {
  value?: unknown;
  visible?: boolean;
};

const mockState = vi.hoisted(
  (): {
    antdDatePickerProps?: MockDatePickerProps;
    mobileDatePickerProps?: MockDatePickerProps;
  } => ({
    antdDatePickerProps: undefined,
    mobileDatePickerProps: undefined,
  }),
);

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  return {
    ...actual,
    useFlowModelContext: () => ({
      t: (value: string) => value,
    }),
  };
});

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    DatePicker: (props: MockDatePickerProps) => {
      mockState.antdDatePickerProps = props;
      return <div data-testid="antd-date-picker" />;
    },
  };
});

vi.mock('antd-mobile', () => ({
  DatePicker: (props: MockDatePickerProps) => {
    mockState.mobileDatePickerProps = props;
    return props.visible ? <div data-testid="mobile-date-picker" /> : null;
  },
}));

describe('MobileDatePicker', () => {
  beforeEach(() => {
    mockState.antdDatePickerProps = undefined;
    mockState.mobileDatePickerProps = undefined;
  });

  it('uses the form value as the mobile popup value', () => {
    render(
      <MobileDatePicker
        value={dayjs('2037-03-06 12:34:56')}
        showTime
        picker="date"
        timeFormat="HH:mm:ss"
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByTestId('antd-date-picker').parentElement as HTMLElement;
    act(() => {
      fireEvent.click(trigger);
    });

    const popupValue = mockState.mobileDatePickerProps?.value;
    expect(screen.getByTestId('mobile-date-picker')).toBeInTheDocument();
    expect(popupValue).toBeInstanceOf(Date);
    if (!(popupValue instanceof Date)) {
      throw new Error('Expected popup value to be a Date');
    }
    expect(popupValue.getFullYear()).toBe(2037);
    expect(popupValue.getMonth()).toBe(2);
    expect(popupValue.getDate()).toBe(6);
    expect(popupValue.getHours()).toBe(12);
    expect(popupValue.getMinutes()).toBe(34);
    expect(popupValue.getSeconds()).toBe(56);
  });
});
