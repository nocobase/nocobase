/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dayjs } from '@nocobase/utils/client';
import { FormulaResult } from '../models/FormulaFieldModel';

type DatePickerProps = {
  onChange?: (value: dayjs.Dayjs | null) => void;
  picker?: string;
  showTime?: unknown;
  value?: unknown;
};

const mocks = vi.hoisted(() => ({
  datePickerProps: [] as DatePickerProps[],
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    DatePicker: (props: DatePickerProps) => {
      mocks.datePickerProps.push(props);
      return ReactModule.createElement('button', { type: 'button' }, 'date-picker');
    },
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    getDisplayNumber: ({ value }: { value: unknown }) => String(value ?? ''),
  };
});

vi.mock('@nocobase/evaluators/client', () => ({
  evaluators: {
    get: () => ({
      evaluate: () => null,
    }),
  },
}));

function latestDatePickerProps() {
  const props = mocks.datePickerProps.at(-1);
  expect(props).toBeDefined();
  return props as DatePickerProps;
}

function renderFilterDatePicker(props: Record<string, unknown>, onChange = vi.fn()) {
  return {
    onChange,
    ...render(
      <FormulaResult
        {...props}
        collectionField={{
          options: {
            dataType: 'date',
          },
        }}
        form={{
          props: {
            'x-flag': {
              isInFilterAction: true,
            },
          },
        }}
        onChange={onChange}
      />,
    ),
  };
}

describe('FormulaFieldModel date picker normalization', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.datePickerProps = [];
  });

  it('normalizes empty and equivalent date values without emitting redundant changes', () => {
    const { onChange } = renderFilterDatePicker({
      value: '2026-06-03',
      dateOnly: true,
    });

    act(() => {
      latestDatePickerProps().onChange?.(dayjs('2026-06-03'));
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      latestDatePickerProps().onChange?.(null);
    });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('normalizes date values for filter, local and gmt picker modes', () => {
    const onChange = vi.fn();
    const { rerender } = renderFilterDatePicker(
      {
        underFilter: true,
        showTime: true,
        value: '',
      },
      onChange,
    );

    act(() => {
      latestDatePickerProps().onChange?.(dayjs('2026-06-03 04:05:06'));
    });
    expect(onChange).toHaveBeenLastCalledWith('2026-06-03 04:05:06');

    rerender(
      <FormulaResult
        value=""
        collectionField={{
          options: {
            dataType: 'date',
          },
        }}
        form={{
          props: {
            'x-flag': {
              isInFilterAction: true,
            },
          },
        }}
        onChange={onChange}
        utc={false}
      />,
    );
    act(() => {
      latestDatePickerProps().onChange?.(dayjs('2026-06-03 04:05:06'));
    });
    expect(onChange).toHaveBeenLastCalledWith('2026-06-03');

    rerender(
      <FormulaResult
        value=""
        collectionField={{
          options: {
            dataType: 'date',
          },
        }}
        form={{
          props: {
            'x-flag': {
              isInFilterAction: true,
            },
          },
        }}
        onChange={onChange}
        gmt
        picker="year"
      />,
    );
    act(() => {
      latestDatePickerProps().onChange?.(dayjs('2026-06-03 04:05:06'));
    });
    expect(onChange).toHaveBeenLastCalledWith('2026-01-01T00:00:00.000Z');
  });

  it('normalizes month, quarter and week picker values', () => {
    const onChange = vi.fn();
    const { rerender } = renderFilterDatePicker(
      {
        value: '',
        gmt: true,
        picker: 'month',
      },
      onChange,
    );

    act(() => {
      latestDatePickerProps().onChange?.(dayjs('2026-06-03'));
    });
    expect(onChange).toHaveBeenLastCalledWith('2026-06-01T00:00:00.000Z');

    rerender(
      <FormulaResult
        value=""
        collectionField={{
          options: {
            dataType: 'date',
          },
        }}
        form={{
          props: {
            'x-flag': {
              isInFilterAction: true,
            },
          },
        }}
        onChange={onChange}
        gmt
        picker="quarter"
      />,
    );
    act(() => {
      latestDatePickerProps().onChange?.(dayjs('2026-06-03'));
    });
    expect(onChange).toHaveBeenLastCalledWith('2026-04-01T00:00:00.000Z');

    rerender(
      <FormulaResult
        value=""
        collectionField={{
          options: {
            dataType: 'date',
          },
        }}
        form={{
          props: {
            'x-flag': {
              isInFilterAction: true,
            },
          },
        }}
        onChange={onChange}
        gmt
        picker="week"
      />,
    );
    act(() => {
      latestDatePickerProps().onChange?.(dayjs('2026-06-03'));
    });
    expect(onChange).toHaveBeenLastCalledWith('2026-06-01T00:00:00.000Z');
  });
});
