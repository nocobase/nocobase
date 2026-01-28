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

export const FilterDatePicker = (props: any) => {
  const { picker = 'date', format, showTime, timeFormat, onChange } = props;
  const ctx = useFlowContext();
  const currentValue = Array.isArray(props.value) ? props.value[0] : props.value;
  const initPicker = currentValue ? inferPickerType(currentValue, picker) : picker;
  const [targetPicker, setTargetPicker] = useState(initPicker);
  const targetDateFormat = format || getPickerFormat(initPicker);
  const t = ctx.model.translate.bind(ctx.model);
  const newProps = {
    utc: true,
    inputReadOnly: ctx.isMobileLayout,
    ...props,
    underFilter: true,
    showTime: showTime ? { defaultValue: dayjs('00:00:00', 'HH:mm:ss') } : false,
    format: getDateTimeFormat(targetPicker, targetDateFormat, showTime, timeFormat),
    picker: targetPicker,
  };
  const [stateProps, setStateProps] = useState(newProps);
  const dayjsValue = useMemo(() => (currentValue ? dayjs(currentValue) : null), [currentValue]);

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
          setTargetPicker(nextPicker);
          const nextDateFormat = format || getPickerFormat(nextPicker);
          const dateTimeFormat = getDateTimeFormat(nextPicker, nextDateFormat, showTime, timeFormat);
          newProps.picker = nextPicker;
          newProps.format = dateTimeFormat;
          setStateProps(newProps);
          if (!currentValue || !onChange) {
            return;
          }
          const parsedValue = dayjs(currentValue);
          if (!parsedValue.isValid()) {
            return;
          }
          onChange(parsedValue.format(dateTimeFormat));
        }}
      />
      <AntdDatePicker {...stateProps} style={{ flex: 1, ...stateProps?.style }} value={dayjsValue} />
    </Space.Compact>
  );
};
