/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { dayjs, getDateTimeFormat, getPickerFormat } from '@nocobase/utils/client';
import { DatePicker as AntdDatePicker, Select, Space } from 'antd';
import React, { useMemo, useState } from 'react';
import { inferPickerType } from '../../../../../../../schema-component';

const stripTimeFromFormat = (format?: string) =>
  format ? format.replace(/\s*HH?:mm(?::ss)?(?:\.SSS)?/g, '').trim() : format;

const parseDateValue = (value: any, format: string) => {
  if (!value) {
    return null;
  }
  if (dayjs.isDayjs(value)) {
    return value;
  }
  if (typeof value === 'string' && value.endsWith('Z')) {
    const localString = dayjs(value).format(format);
    const localParsed = dayjs(localString, format);
    return localParsed.isValid() ? localParsed : dayjs(value);
  }
  const parsed = dayjs(value, format);
  if (parsed.isValid()) {
    return parsed;
  }
  const fallback = dayjs(value);
  return fallback.isValid() ? fallback : null;
};

export const FilterDatePicker = (props: any) => {
  const { picker = 'date', format, showTime, timeFormat, onChange } = props;
  const ctx = useFlowContext();
  const currentValue = Array.isArray(props.value) ? props.value[0] : props.value;
  const initPicker = currentValue ? inferPickerType(currentValue, picker) : picker;
  const [targetPicker, setTargetPicker] = useState(initPicker);
  const t = ctx.model.translate.bind(ctx.model);
  const getResolvedFormat = (value: string) => {
    const baseFormat = value === picker && format ? format : getPickerFormat(value);
    const dateFormat = value === 'date' ? stripTimeFromFormat(baseFormat) : baseFormat;
    return getDateTimeFormat(value, dateFormat, showTime, timeFormat);
  };
  const resolvedFormat = useMemo(
    () => getResolvedFormat(targetPicker),
    [format, picker, showTime, targetPicker, timeFormat],
  );
  const dayjsValue = useMemo(() => parseDateValue(currentValue, resolvedFormat), [currentValue, resolvedFormat]);
  const datePickerProps = {
    utc: true,
    inputReadOnly: ctx.isMobileLayout,
    ...props,
    underFilter: true,
    showTime: showTime ? { defaultValue: dayjs('00:00:00', 'HH:mm:ss') } : false,
    format: resolvedFormat,
    picker: targetPicker,
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Select
        style={{ width: '100px' }}
        popupMatchSelectWidth={false}
        value={targetPicker}
        options={[
          {
            label: t('Date'),
            value: 'date',
          },

          {
            label: t('Month'),
            value: 'month',
          },
          {
            label: t('Quarter'),
            value: 'quarter',
          },
          {
            label: t('Year'),
            value: 'year',
          },
        ]}
        onChange={(nextPicker) => {
          const nextResolvedFormat = getResolvedFormat(nextPicker);
          const previousResolvedFormat = resolvedFormat;
          setTargetPicker(nextPicker);
          if (!currentValue || !onChange) {
            return;
          }
          const parsedValue = parseDateValue(currentValue, previousResolvedFormat);
          if (!parsedValue || !parsedValue.isValid()) {
            return;
          }
          onChange(parsedValue, parsedValue.format(nextResolvedFormat));
        }}
      />
      <AntdDatePicker {...datePickerProps} style={{ flex: 1, ...datePickerProps?.style }} value={dayjsValue} />
    </Space.Compact>
  );
};
