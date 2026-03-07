/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { InputNumber, Select, Space, Divider, DatePickerProps, theme, Checkbox } from 'antd';
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
  const { isRange, defaultValue, ...rest } = props as any;
  return isRange ? <DatePicker.RangePicker {...rest} /> : <DatePicker.FilterWithPicker {...rest} />;
};

const normalizeRelativeDateValue = (value) => {
  if (!value || !value.type || value.type === 'exact') {
    return undefined;
  }

  if (!['past', 'next'].includes(value.type)) {
    return {
      type: value.type,
    };
  }

  const nextValue = {
    type: value.type,
    number: value.number === undefined ? 1 : value.number,
    unit: value.unit ?? 'day',
  } as any;

  if (value.includeCurrent) {
    nextValue.includeCurrent = true;
  }

  return nextValue;
};

export const DateFilterDynamicComponent = (props) => {
  const { value, onChange } = props;
  const compile = useCompile();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);
  const includeCurrentLabel = useMemo(() => {
    const labelMap = {
      day: t('Include today'),
      week: t('Include this week'),
      month: t('Include this month'),
      year: t('Include this year'),
    };

    return labelMap[value?.unit || 'day'];
  }, [t, value?.unit]);

  const wrapperStyle = useMemo(
    () => ({
      ...props.style,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: token.marginSM,
    }),
    [props.style, token.marginSM],
  );

  const compactStyle = useMemo(
    () => ({
      flex: 1,
      minWidth: 0,
    }),
    [],
  );

  const checkboxStyle = useMemo(
    () => ({
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: token.controlHeight,
      marginInlineStart: token.marginXXS,
      color: token.colorTextSecondary,
      whiteSpace: 'nowrap' as const,
    }),
    [token],
  );

  const handleSelect = (val) => {
    setOpen(false);
    if (val === 'exact') {
      return onChange(undefined);
    }
    const obj = normalizeRelativeDateValue({
      type: val,
    }) as any;
    if (['past', 'next'].includes(val)) {
      obj.number = value?.type === val ? value?.number ?? 1 : 1;
      obj.unit = value?.type === val ? value?.unit ?? 'day' : 'day';
      if (value?.type === 'past' || value?.type === 'next') {
        obj.includeCurrent = value?.includeCurrent;
      }
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
    <div style={wrapperStyle}>
      <Space.Compact block style={compactStyle}>
        <Select
          data-testid="date-filter-type-select"
          options={compile(options)}
          open={open}
          onDropdownVisibleChange={setOpen}
          {...props}
          allowClear={false}
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
            min={1}
            data-testid="date-filter-number-input"
            value={value?.number}
            onChange={(val) => {
              const obj = normalizeRelativeDateValue({
                ...value,
                number: val,
              });
              onChange(obj);
            }}
          />,
          <Select
            key="unit"
            data-testid="date-filter-unit-select"
            value={value?.unit}
            style={{ minWidth: 130, maxWidth: 140 }}
            onChange={(val) => {
              const obj = normalizeRelativeDateValue({
                ...value,
                unit: val,
              });
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
      {['past', 'next'].includes(value?.type) && includeCurrentLabel ? (
        <Checkbox
          data-testid="include-current-checkbox"
          style={checkboxStyle}
          checked={!!value?.includeCurrent}
          onChange={(e) => {
            onChange(
              normalizeRelativeDateValue({
                ...value,
                includeCurrent: e.target.checked || undefined,
              }),
            );
          }}
        >
          {includeCurrentLabel}
        </Checkbox>
      ) : null}
    </div>
  );
};
