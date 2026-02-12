/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildDateVariableExpression,
  parseDateVariableExpression,
  type DatePresetType,
  type DateRelativeUnit,
} from '@nocobase/flow-engine';
import { DateFilterDynamicComponent } from '../../../schema-component/common/date-filter-dynamic-component/DateFilterDynamicComponent';

const DATE_PRESET_SET = new Set<DatePresetType>([
  'now',
  'today',
  'yesterday',
  'tomorrow',
  'thisWeek',
  'lastWeek',
  'nextWeek',
  'thisMonth',
  'lastMonth',
  'nextMonth',
  'thisQuarter',
  'lastQuarter',
  'nextQuarter',
  'thisYear',
  'lastYear',
  'nextYear',
]);

const DATE_UNIT_SET = new Set<DateRelativeUnit>(['day', 'week', 'month', 'year']);

type DynamicDateValue =
  | undefined
  | string
  | [string, string]
  | {
      type: string;
      unit?: string;
      number?: number;
    };

export interface DateVariablePathAdapterProps {
  value?: any;
  onChange?: (value: any) => void;
  forceServerSuffix?: boolean;
  [key: string]: any;
}

function toDynamicDateValue(expression: unknown): DynamicDateValue {
  const parsed = parseDateVariableExpression(expression);
  if (!parsed) return undefined;

  if (parsed.kind === 'preset') {
    return { type: parsed.preset };
  }

  if (parsed.kind === 'relative') {
    return {
      type: parsed.direction,
      unit: parsed.unit,
      number: parsed.number,
    };
  }

  if (parsed.mode === 'single') {
    return typeof parsed.value === 'string' ? parsed.value : String(parsed.value ?? '');
  }

  const start = typeof parsed.value[0] === 'string' ? parsed.value[0] : String(parsed.value[0] ?? '');
  const end = typeof parsed.value[1] === 'string' ? parsed.value[1] : String(parsed.value[1] ?? '');
  return [start, end];
}

function toDateVariableExpression(
  dynamicValue: DynamicDateValue,
  options: {
    forceServerSuffix?: boolean;
    previousExpression?: unknown;
  },
): string | undefined {
  if (typeof dynamicValue === 'undefined') return undefined;

  const previousParsed = parseDateVariableExpression(options.previousExpression);
  const server = !!options.forceServerSuffix || !!previousParsed?.server;

  if (Array.isArray(dynamicValue)) {
    if (dynamicValue.length < 2) return undefined;
    return buildDateVariableExpression({
      kind: 'exact',
      mode: 'range',
      picker: 'date',
      value: [dynamicValue[0], dynamicValue[1]],
      server,
    });
  }

  if (typeof dynamicValue === 'string') {
    return buildDateVariableExpression({
      kind: 'exact',
      mode: 'single',
      picker: 'date',
      value: dynamicValue,
      server,
    });
  }

  const type = dynamicValue?.type;
  if (type === 'past' || type === 'next') {
    const unit = DATE_UNIT_SET.has(dynamicValue?.unit as DateRelativeUnit)
      ? (dynamicValue?.unit as DateRelativeUnit)
      : 'day';
    const num = Number(dynamicValue?.number);
    const number = Number.isFinite(num) && num > 0 ? Math.floor(num) : 1;
    return buildDateVariableExpression({
      kind: 'relative',
      direction: type,
      unit,
      number,
      server,
    });
  }

  if (DATE_PRESET_SET.has(type as DatePresetType)) {
    return buildDateVariableExpression({
      kind: 'preset',
      preset: type as DatePresetType,
      server,
    });
  }

  return undefined;
}

export const DateVariablePathAdapter: React.FC<DateVariablePathAdapterProps> = (props) => {
  const { value, onChange, forceServerSuffix = false, isRange, ...restProps } = props;
  const lastStableExpressionRef = useRef<any>(value);
  const dynamicValue = useMemo(() => toDynamicDateValue(value), [value]);
  const [draftDynamicValue, setDraftDynamicValue] = useState<DynamicDateValue>(dynamicValue);
  const resolvedIsRange = typeof isRange === 'boolean' ? isRange : Array.isArray(dynamicValue);

  if (typeof value !== 'undefined') {
    lastStableExpressionRef.current = value;
  }

  useEffect(() => {
    setDraftDynamicValue(dynamicValue);
  }, [dynamicValue]);

  const handleChange = useCallback(
    (nextValue: DynamicDateValue) => {
      const previousExpression = lastStableExpressionRef.current;
      const previousParsed = parseDateVariableExpression(previousExpression);
      const server = !!forceServerSuffix || !!previousParsed?.server;

      // DatePicker.FilterWithPicker 会在用户真正选值前先发一个 undefined。
      // - 从非 exact 切到 exact：需要立刻切到 exact 输入态。
      // - exact 内部选值中间态：忽略这次 undefined，等待下一次真实值。
      if (typeof nextValue === 'undefined') {
        if (previousParsed?.kind === 'exact') {
          return;
        }

        let exactPlaceholder: string;
        if (resolvedIsRange) {
          const placeholderValue: [string, string] = ['', ''];
          setDraftDynamicValue(placeholderValue);
          exactPlaceholder = buildDateVariableExpression({
            kind: 'exact',
            mode: 'range',
            picker: 'date',
            value: placeholderValue,
            server,
          });
        } else {
          const placeholderValue = '';
          setDraftDynamicValue(placeholderValue);
          exactPlaceholder = buildDateVariableExpression({
            kind: 'exact',
            mode: 'single',
            picker: 'date',
            value: placeholderValue,
            server,
          });
        }
        lastStableExpressionRef.current = exactPlaceholder;
        onChange?.(exactPlaceholder);
        return;
      }

      setDraftDynamicValue(nextValue);

      const nextExpression = toDateVariableExpression(nextValue, {
        forceServerSuffix,
        previousExpression,
      });
      if (!nextExpression) return;
      lastStableExpressionRef.current = nextExpression;
      onChange?.(nextExpression);
    },
    [forceServerSuffix, onChange, resolvedIsRange],
  );

  return (
    <DateFilterDynamicComponent
      {...restProps}
      isRange={resolvedIsRange}
      value={draftDynamicValue}
      onChange={handleChange}
    />
  );
};
