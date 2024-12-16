/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapProps, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { DatePicker as AntdDatePicker, DatePickerProps as AntdDatePickerProps, Space, Select } from 'antd';
import { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { getPickerFormat } from '@nocobase/utils/client';
import { useTranslation } from 'react-i18next';
import { ReadPretty, ReadPrettyComposed } from './ReadPretty';
import { getDateRanges, mapDatePicker, mapRangePicker, inferPickerType } from './util';
import { useCompile } from '../../';

interface IDatePickerProps {
  utc?: boolean;
}

type ComposedDatePicker = React.FC<AntdDatePickerProps> & {
  ReadPretty?: ReadPrettyComposed['DatePicker'];
  RangePicker?: ComposedRangePicker;
  FilterWithPicker?: any;
};

type ComposedRangePicker = React.FC<RangePickerProps> & {
  ReadPretty?: ReadPrettyComposed['DateRangePicker'];
};

const DatePickerContext = React.createContext<IDatePickerProps>({ utc: true });

export const useDatePickerContext = () => React.useContext(DatePickerContext);
export const DatePickerProvider = DatePickerContext.Provider;

const InternalDatePicker: ComposedDatePicker = connect(
  AntdDatePicker,
  mapProps(mapDatePicker()),
  mapReadPretty(ReadPretty.DatePicker),
);

const InternalRangePicker = connect(
  AntdDatePicker.RangePicker,
  mapProps(mapRangePicker()),
  mapReadPretty(ReadPretty.DateRangePicker),
);

export const DatePicker: ComposedDatePicker = (props: any) => {
  const { utc = true } = useDatePickerContext();
  const value = Array.isArray(props.value) ? props.value[0] : props.value;
  const newProps = {
    utc,
    ...props,
    showTime: props.showTime ? { defaultValue: dayjs('00:00:00', 'HH:mm:ss') } : false,
  };
  return <InternalDatePicker {...newProps} value={value} />;
};

DatePicker.ReadPretty = ReadPretty.DatePicker;

DatePicker.RangePicker = function RangePicker(props: any) {
  const { value, picker = 'date', format } = props;
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const field: any = useField();
  const { utc = true } = useDatePickerContext();
  const rangesValue = getDateRanges();
  const compile = useCompile();
  const isFilterAction: any = !fieldSchema['x-filter-operator']; // 在筛选按钮中使用
  const presets = [
    { label: t('Today'), value: rangesValue.today },
    { label: t('Last week'), value: rangesValue.lastWeek },
    { label: t('This week'), value: rangesValue.thisWeek },
    { label: t('Next week'), value: rangesValue.nextWeek },
    { label: t('Last month'), value: rangesValue.lastMonth },
    { label: t('This month'), value: rangesValue.thisMonth },
    { label: t('Next month'), value: rangesValue.nextMonth },
    { label: t('Last quarter'), value: rangesValue.lastQuarter },
    { label: t('This quarter'), value: rangesValue.thisQuarter },
    { label: t('Next quarter'), value: rangesValue.nextQuarter },
    { label: t('Last year'), value: rangesValue.lastYear },
    { label: t('This year'), value: rangesValue.thisYear },
    { label: t('Next year'), value: rangesValue.nextYear },
    { label: t('Last 7 days'), value: rangesValue.last7Days },
    { label: t('Next 7 days'), value: rangesValue.next7Days },
    { label: t('Last 30 days'), value: rangesValue.last30Days },
    { label: t('Next 30 days'), value: rangesValue.next30Days },
    { label: t('Last 90 days'), value: rangesValue.last90Days },
    { label: t('Next 90 days'), value: rangesValue.next90Days },
  ];

  const targetPicker = value ? inferPickerType(value?.[0]) : picker;
  const targetFormat = getPickerFormat(targetPicker) || format;
  const newProps: any = {
    utc,
    presets,
    ...props,
    format: targetFormat,
    picker: targetPicker,
    showTime: props.showTime ? { defaultValue: [dayjs('00:00:00', 'HH:mm:ss'), dayjs('00:00:00', 'HH:mm:ss')] } : false,
  };
  const [stateProps, setStateProps] = useState(newProps);

  if (isFilterAction) {
    return (
      <Space.Compact>
        <Select
          // @ts-ignore
          role="button"
          data-testid="select-picker"
          style={{ width: '100px' }}
          popupMatchSelectWidth={false}
          defaultValue={targetPicker}
          options={compile([
            {
              label: '{{t("Date")}}',
              value: 'date',
            },

            {
              label: '{{t("Month")}}',
              value: 'month',
            },
            {
              label: '{{t("Quarter")}}',
              value: 'quarter',
            },
            {
              label: '{{t("Year")}}',
              value: 'year',
            },
          ])}
          onChange={(value) => {
            const format = getPickerFormat(value);
            field.setComponentProps({
              picker: value,
              format,
            });
            newProps.picker = value;
            newProps.format = format;
            setStateProps(newProps);
            fieldSchema['x-component-props'] = {
              ...props,
              picker: value,
              format,
            };
            field.value = undefined;
          }}
        />
        <InternalRangePicker {...stateProps} value={value} />
      </Space.Compact>
    );
  }
  return <InternalRangePicker {...newProps} />;
};

DatePicker.FilterWithPicker = function FilterWithPicker(props: any) {
  const { picker = 'date', format } = props;
  const { utc = true } = useDatePickerContext();
  const value = Array.isArray(props.value) ? props.value[0] : props.value;
  const compile = useCompile();
  const fieldSchema = useFieldSchema();
  const targetPicker = value ? inferPickerType(value) : picker;
  const targetFormat = getPickerFormat(targetPicker) || format;
  const newProps = {
    utc,
    ...props,
    underFilter: true,
    showTime: props.showTime ? { defaultValue: dayjs('00:00:00', 'HH:mm:ss') } : false,
    format: targetFormat,
    picker: targetPicker,
    onChange: (val) => {
      props.onChange(undefined);
      setTimeout(() => {
        props.onChange(val);
      });
    },
  };
  const field: any = useField();
  const [stateProps, setStateProps] = useState(newProps);
  return (
    <Space.Compact>
      <Select
        // @ts-ignore
        role="button"
        data-testid="select-picker"
        style={{ width: '100px' }}
        popupMatchSelectWidth={false}
        defaultValue={targetPicker}
        options={compile([
          {
            label: '{{t("Date")}}',
            value: 'date',
          },

          {
            label: '{{t("Month")}}',
            value: 'month',
          },
          {
            label: '{{t("Quarter")}}',
            value: 'quarter',
          },
          {
            label: '{{t("Year")}}',
            value: 'year',
          },
        ])}
        onChange={(value) => {
          const format = getPickerFormat(value);
          field.setComponentProps({
            picker: value,
            format,
          });
          newProps.picker = value;
          newProps.format = format;
          setStateProps(newProps);
          fieldSchema['x-component-props'] = {
            ...props,
            picker: value,
            format,
          };
          field.value = null;
        }}
      />
      <InternalDatePicker {...stateProps} value={value} />
    </Space.Compact>
  );
};

export default DatePicker;
