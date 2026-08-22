/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type DateCalculationInputType = 'date' | 'number';
export type DateCalculationOutputType = 'date' | 'number' | 'boolean' | 'string';
export type DateCalculationGroupKey = 'toDate' | 'getter' | 'converter' | 'toString';

export const unitOptionKeys = [
  { labelKey: 'Year', value: 'year' },
  { labelKey: 'Quarter', value: 'quarter' },
  { labelKey: 'Month', value: 'month' },
  { labelKey: 'Week', value: 'week' },
  { labelKey: 'Day', value: 'day' },
  { labelKey: 'Hour', value: 'hour' },
  { labelKey: 'Minute', value: 'minute' },
  { labelKey: 'Second', value: 'second' },
  { labelKey: 'Millisecond', value: 'millisecond' },
] as const;

export const dataTypeOptions = [
  { labelKey: 'Date', value: 'date', color: 'blue' },
  { labelKey: 'Number', value: 'number', color: 'geekblue' },
  { labelKey: 'Boolean', value: 'boolean', color: 'cyan' },
  { labelKey: 'String', value: 'string', color: 'orange' },
] as const;

export const dataTypeOptionMap = dataTypeOptions.reduce(
  (result, option) => ({
    ...result,
    [option.value]: option,
  }),
  {} as Record<DateCalculationOutputType, (typeof dataTypeOptions)[number]>,
);

export const functionGroupOrder: DateCalculationGroupKey[] = ['toDate', 'getter', 'converter', 'toString'];

export const functionGroupLabelKeys: Record<DateCalculationGroupKey, string> = {
  toDate: 'To another date',
  getter: 'Get value',
  converter: 'Value conversion',
  toString: 'Format',
};
