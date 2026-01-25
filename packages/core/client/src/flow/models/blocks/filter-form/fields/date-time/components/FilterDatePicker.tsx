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
  const { picker = 'date', format, showTime, timeFormat } = props;
  const ctx = useFlowContext();
  const value = Array.isArray(props.value) ? props.value[0] : props.value;
  const initPicker = value ? inferPickerType(value, picker) : picker;
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
  const dayjsValue = useMemo(() => (value ? dayjs(value) : null), [value]);

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
        onChange={(value) => {
          setTargetPicker(value);
          const nextDateFormat = format || getPickerFormat(value);
          const dateTimeFormat = getDateTimeFormat(value, nextDateFormat, showTime, timeFormat);
          newProps.picker = value;
          newProps.format = dateTimeFormat;
          setStateProps(newProps);
        }}
      />
      <AntdDatePicker {...stateProps} style={{ flex: 1, ...stateProps?.style }} value={dayjsValue} />
    </Space.Compact>
  );
};
