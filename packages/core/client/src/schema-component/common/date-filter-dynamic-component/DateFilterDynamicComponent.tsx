/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { InputNumber, Select, Space } from 'antd';
import { DatePickerProps } from 'antd';
import dayjs from 'dayjs';
import { useCompile } from '../../../schema-component';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '../../antd/date-picker';

const options = [
  {
    value: 'exact',
    label: '{{t("Exact day")}}',
  },
  { value: 'today', label: '{{t("Today")}}' },
  { value: 'yesterday', label: '{{t("Yesterday")}}' },
  { value: 'tomorrow', label: '{{t("Tomorrow")}}' },
  { value: 'thisWeek', label: '{{t("This Week")}}' },
  { value: 'lastWeek', label: '{{t("Last Week")}}' },
  { value: 'nextWeek', label: '{{t("Next Week")}}' },
  { value: 'thisMonth', label: '{{t("This Month")}}' },
  { value: 'lastMonth', label: '{{t("Last Month")}}' },
  { value: 'nextMonth', label: '{{t("Next Month")}}' },
  { value: 'thisQuarter', label: '{{t("This Quarter")}}' },
  { value: 'lastQuarter', label: '{{t("Last Quarter")}}' },
  { value: 'nextQuarter', label: '{{t("Next Quarter")}}' },
  { value: 'thisYear', label: '{{t("This Year")}}' },
  { value: 'lastYear', label: '{{t("Last Year")}}' },
  { value: 'nextYear', label: '{{t("Next Year")}}' },
  { value: 'past', label: '{{t("Past")}}' },
  { value: 'next', label: '{{t("Next")}}' },
];

type SmartDatePickerProps = {
  isRange?: boolean;
} & (
  | (Omit<DatePickerProps, 'onChange' | 'value'> & {
      value?: dayjs.Dayjs;
      onChange?: (value: dayjs.Dayjs | null) => void;
    })
  | (Omit<DatePickerProps, 'onChange' | 'value'> & {
      value?: [dayjs.Dayjs, dayjs.Dayjs] | null;
      onChange?: (value: [dayjs.Dayjs, dayjs.Dayjs] | null) => void;
    })
);

const SmartDatePicker: React.FC<SmartDatePickerProps> = (props) => {
  const { isRange, ...rest } = props as any;
  return isRange ? (
    <DatePicker.RangePicker {...rest} style={{ minWidth: 350 }} />
  ) : (
    <DatePicker.FilterWithPicker {...rest} />
  );
};

export const DateFilterDynamicComponent = (props) => {
  const { value, onChange } = props;
  const compile = useCompile();
  const { t } = useTranslation();
  return (
    <Space.Compact style={{ ...props.style, width: '100%' }}>
      <Select
        options={compile(options)}
        {...props}
        allowClear
        style={{
          width: '100%',
          minWidth: 100,
          maxWidth: ['past', 'next', 'exact', undefined].includes(value?.type) ? 100 : null,
        }}
        value={value?.type || 'exact'}
        onChange={(val) => {
          if (val === 'exact') {
            return onChange(undefined);
          }
          const obj: any = {
            type: val,
          };
          if (['past', 'next'].includes(val)) {
            obj.number = 1;
            obj.unit = 'day';
          }
          onChange(obj);
        }}
      />
      {['past', 'next'].includes(value?.type) && [
        <InputNumber
          key="number"
          value={value?.number}
          // style={{ minWidth: 100 }}
          onChange={(val) => {
            const obj = {
              ...value,
              number: val,
            };
            onChange(obj);
          }}
        />,
        <Select
          key="unit"
          value={value?.unit}
          style={{ maxWidth: 130 }}
          onChange={(val) => {
            const obj = {
              ...value,
              unit: val,
            };
            onChange(obj);
          }}
          options={[
            { value: 'day', label: t('Day') },
            { value: 'week', label: t('Calendar week') },
            { value: 'month', label: t('Calendar Month') },
            { value: 'year', label: t('Calendar Year') },
          ]}
        />,
      ]}
      {(value?.type === 'exact' || !value?.type) && <SmartDatePicker {...props} />}
    </Space.Compact>
  );
};
