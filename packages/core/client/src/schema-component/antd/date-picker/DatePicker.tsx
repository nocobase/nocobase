/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapProps, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { DatePicker as AntdDatePicker, Space, Select } from 'antd';
import dayjs from 'dayjs';
import { last, first } from 'lodash';
import React, { useState, useEffect, useRef } from 'react';
import { getPickerFormat, getDateTimeFormat } from '@nocobase/utils/client';
import { useTranslation } from 'react-i18next';
import { ReadPretty } from './ReadPretty';
import { getDateRanges, mapDatePicker, mapRangePicker, inferPickerType, isMobile } from './util';
import { useCompile } from '../../';
import { useVariables, useLocalVariables, isVariable } from '../../../variables';
import { autorun } from '@formily/reactive';
interface IDatePickerProps {
  utc?: boolean;
}

const DatePickerContext = React.createContext<IDatePickerProps>({ utc: true });

export const useDatePickerContext = () => React.useContext(DatePickerContext);
export const DatePickerProvider = DatePickerContext.Provider;

const InternalDatePicker = connect(AntdDatePicker, mapProps(mapDatePicker()), mapReadPretty(ReadPretty.DatePicker));

const InternalRangePicker = connect(
  AntdDatePicker.RangePicker,
  mapProps(mapRangePicker()),
  mapReadPretty(ReadPretty.DateRangePicker),
);

export const DatePicker = (props: any) => {
  const { utc = true } = useDatePickerContext();
  const value = Array.isArray(props.value) ? props.value[0] : props.value;
  const { parseVariable } = useVariables() || {};
  const localVariables = useLocalVariables();
  const [disabledDate, setDisabledDate] = useState(null);
  const [disabledTime, setDisabledTime] = useState(null);
  const disposeRef = useRef(null);

  useEffect(() => {
    if (disposeRef.current) {
      disposeRef.current();
    }
    disposeRef.current = autorun(() => {
      limitDate();
    });
    return () => {
      disposeRef.current();
    };
  }, [props._maxDate, props._minDate, localVariables, parseVariable]);

  const limitDate = async () => {
    // 直接将 UTC 时间字符串转换成 dayjs 对象（注意不转成本地时间）
    let minDateTimePromise = props._minDate
      ? Promise.resolve(dayjs(props._minDate)) // 保持 UTC 时间
      : Promise.resolve(null);
    let maxDateTimePromise = props._maxDate ? Promise.resolve(dayjs(props._maxDate)) : Promise.resolve(null);

    if (isVariable(props._maxDate)) {
      maxDateTimePromise = parseVariable(props._maxDate, localVariables).then((result) => {
        console.log(dayjs(Array.isArray(result.value) ? last(result.value) : result.value));
        return dayjs(Array.isArray(result.value) ? last(result.value) : result.value);
      });
    }
    if (isVariable(props._minDate)) {
      minDateTimePromise = parseVariable(props._minDate, localVariables).then((result) =>
        dayjs(Array.isArray(result.value) ? first(result.value) : result.value),
      );
    }

    const [minDateTime, maxDateTime] = await Promise.all([minDateTimePromise, maxDateTimePromise]);

    const fullTimeArr = Array.from({ length: 60 }, (_, i) => i);

    // disabledDate 只禁用日期，不要管时间部分
    const disabledDate = (current) => {
      if (!dayjs.isDayjs(current)) return false;

      // 把 current 转成本地时间（不加 .utc()，因为 current 就是本地时间）
      // 然后和 maxDateTime（同为本地时间）做比较
      const min = minDateTime ? minDateTime.startOf('day') : null;
      const max = maxDateTime ? maxDateTime.endOf('day') : null;

      return (min && current.isBefore(min, 'day')) || (max && current.isAfter(max, 'day'));
    };

    const disabledTime = (current) => {
      if (!current || (!minDateTime && !maxDateTime)) {
        return { disabledHours: () => [], disabledMinutes: () => [], disabledSeconds: () => [] };
      }

      // current 是本地时间，转成 UTC 时间
      const currentUtc = current.utc();

      // 判断是不是 minDate 和 maxDate 的同一天（UTC）
      const isCurrentMinDay = minDateTime && currentUtc.isSame(minDateTime, 'day');
      const isCurrentMaxDay = maxDateTime && currentUtc.isSame(maxDateTime, 'day');

      const disabledHours = () => {
        const hours = [];
        if (isCurrentMinDay) {
          for (let h = 0; h < minDateTime.hour(); h++) {
            hours.push(h);
          }
        }
        if (isCurrentMaxDay) {
          for (let h = maxDateTime.hour() + 1; h < 24; h++) {
            hours.push(h);
          }
        }
        return hours;
      };

      const disabledMinutes = (selectedHour) => {
        if (isCurrentMinDay && selectedHour === minDateTime.hour()) {
          return fullTimeArr.filter((m) => m < minDateTime.minute());
        }
        if (isCurrentMaxDay && selectedHour === maxDateTime.hour()) {
          return fullTimeArr.filter((m) => m > maxDateTime.minute());
        }
        return [];
      };

      const disabledSeconds = (selectedHour, selectedMinute) => {
        if (isCurrentMinDay && selectedHour === minDateTime.hour() && selectedMinute === minDateTime.minute()) {
          return fullTimeArr.filter((s) => s < minDateTime.second());
        }
        if (isCurrentMaxDay && selectedHour === maxDateTime.hour() && selectedMinute === maxDateTime.minute()) {
          return fullTimeArr.filter((s) => s > maxDateTime.second());
        }
        return [];
      };

      return {
        disabledHours,
        disabledMinutes,
        disabledSeconds,
      };
    };

    setDisabledDate(() => disabledDate);
    setDisabledTime(() => disabledTime);
  };

  const newProps = {
    utc,
    ...props,
    disabledDate,
    disabledTime,
    showTime: props.showTime ? { defaultValue: dayjs('00:00:00', 'HH:mm:ss') } : false,
  };
  return <InternalDatePicker {...newProps} value={value} />;
};

DatePicker.ReadPretty = ReadPretty.DatePicker;

DatePicker.RangePicker = function RangePicker(props: any) {
  const { value, picker = 'date', format, showTime, timeFormat } = props;
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

  const targetPicker = value ? inferPickerType(value?.[0], picker) : picker;
  const targetDateFormat = getPickerFormat(targetPicker) || format;
  const newProps: any = {
    utc,
    presets,
    ...props,
    format: getDateTimeFormat(targetPicker, targetDateFormat, showTime, timeFormat),
    picker: targetPicker,
    showTime: showTime ? { defaultValue: [dayjs('00:00:00', 'HH:mm:ss'), dayjs('23:59:59', 'HH:mm:ss')] } : false,
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
            const dateTimeFormat = getDateTimeFormat(value, format, showTime, timeFormat);
            field.setComponentProps({
              picker: value,
              format,
            });
            newProps.picker = value;
            newProps.format = dateTimeFormat;
            setStateProps(newProps);
            fieldSchema['x-component-props'] = {
              ...props,
              picker: value,
              format: dateTimeFormat,
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
  const { picker = 'date', format, showTime, timeFormat } = props;
  const isMobileMedia = isMobile();
  const { utc = true } = useDatePickerContext();
  const value = Array.isArray(props.value) ? props.value[0] : props.value;
  const compile = useCompile();
  const fieldSchema = useFieldSchema();
  const initPicker = value ? inferPickerType(value, picker) : picker;
  const [targetPicker, setTargetPicker] = useState(initPicker);
  const targetDateFormat = getPickerFormat(initPicker) || format;
  const newProps = {
    utc,
    inputReadOnly: isMobileMedia,
    ...props,
    underFilter: true,
    showTime: showTime ? { defaultValue: dayjs('00:00:00', 'HH:mm:ss') } : false,
    format: getDateTimeFormat(targetPicker, targetDateFormat, showTime, timeFormat),
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
    <Space.Compact style={{ width: '100%' }}>
      <Select
        // @ts-ignore
        role="button"
        data-testid="select-picker"
        style={{ width: '100px' }}
        popupMatchSelectWidth={false}
        value={targetPicker}
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
          setTargetPicker(value);
          const format = getPickerFormat(value);
          const dateTimeFormat = getDateTimeFormat(value, format, showTime, timeFormat);
          field.setComponentProps({
            picker: value,
            format,
          });
          newProps.picker = value;
          newProps.format = dateTimeFormat;
          setStateProps(newProps);
          fieldSchema['x-component-props'] = {
            ...props,
            picker: value,
            format: dateTimeFormat,
          };
          field.value = null;
        }}
      />
      <InternalDatePicker {...stateProps} value={value} />
    </Space.Compact>
  );
};

export default DatePicker;
