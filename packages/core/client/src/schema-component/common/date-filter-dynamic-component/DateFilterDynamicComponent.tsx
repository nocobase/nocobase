/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { InputNumber, Select, Space, Divider, DatePickerProps, theme } from 'antd';
import dayjs from 'dayjs';
import { css } from '@emotion/css';
import { useCompile } from '../../../schema-component';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '../../antd/date-picker';

const options = [
  {
    value: 'exact',
    label: '{{t("Exact day")}}',
  },
  { value: 'past', label: '{{t("Past")}}' },
  { value: 'next', label: '{{t("Next")}}' },
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
  return isRange ? <DatePicker.RangePicker {...rest} /> : <DatePicker.FilterWithPicker {...rest} />;
};

export const DateFilterDynamicComponent = (props) => {
  const { value, onChange } = props;
  const compile = useCompile();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);
  const handleSelect = (val) => {
    setOpen(false);
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
  };
  const dropdownRender = () => {
    const firstPart = options.slice(0, 3);
    const secondPart = options.slice(3);
    const optionStyle = css`
      padding: 3px 10px;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      &:hover {
        background-color: ${token.colorFillSecondary};
      }
    `;
    return (
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {firstPart.map((opt) => (
          <div key={opt.value} role="option" onClick={() => handleSelect(opt.value)} className={optionStyle}>
            {compile(opt.label)}
          </div>
        ))}
        <Divider style={{ margin: '4px 0' }} />
        {secondPart.map((opt) => (
          <div
            key={opt.value}
            role="option"
            className={optionStyle}
            onClick={() => handleSelect(opt.value)}
            title={compile(opt.label)}
          >
            {compile(opt.label)}
          </div>
        ))}
      </div>
    );
  };
  return (
    <Space.Compact style={{ ...props.style, width: '100%' }}>
      <Select
        options={compile(options)}
        open={open}
        onDropdownVisibleChange={setOpen}
        {...props}
        allowClear
        style={{
          width: '100%',
          minWidth: 100,
          maxWidth: ['past', 'next', 'exact', undefined].includes(value?.type) ? 100 : null,
        }}
        value={value?.type || 'exact'}
        onChange={handleSelect}
        dropdownRender={dropdownRender}
      />
      {['past', 'next'].includes(value?.type) && [
        <InputNumber
          key="number"
          value={value?.number}
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
          style={{ maxWidth: 140 }}
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
          popupMatchSelectWidth
        />,
      ]}
      {(value?.type === 'exact' || !value?.type) && <SmartDatePicker {...props} />}
    </Space.Compact>
  );
};
