/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DatePicker as AntdDatePicker, Space, Select } from 'antd';
import dayjs from 'dayjs';
import { last, first } from 'lodash';
import React, { useState, useEffect, useRef } from 'react';
import { getPickerFormat, getDateTimeFormat } from '@nocobase/utils/client';
import { useTranslation } from 'react-i18next';
import { getDateRanges, mapDatePicker, mapRangePicker, inferPickerType, isMobile } from './util';
import { useCompile } from '../../../../../';
import { autorun } from '@formily/reactive';

interface IDatePickerProps {
  utc?: boolean;
}

const DatePickerContext = React.createContext<IDatePickerProps>({ utc: true });

export const useDatePickerContext = () => React.useContext(DatePickerContext);
export const DatePickerProvider = DatePickerContext.Provider;

const InternalRangePicker = AntdDatePicker.RangePicker;

export const DatePicker = (props: any) => {
  const { utc = true } = useDatePickerContext();
  const value = Array.isArray(props.value) ? props.value[0] : props.value;
  const [disabledDate, setDisabledDate] = useState(null);
  const [disabledTime, setDisabledTime] = useState(null);
  const disposeRef = useRef(null);

  const newProps = {
    utc,
    ...props,
    disabledDate,
    disabledTime,
    showTime: props.showTime ? { defaultValue: dayjs('00:00:00', 'HH:mm:ss') } : false,
  };
  return <AntdDatePicker {...newProps} value={value} />;
};

// DatePicker.RangePicker = function RangePicker(props: any) {
//   const { value, picker = 'date', format, showTime, timeFormat } = props;
//   const { t } = useTranslation();
//   const { utc = true } = useDatePickerContext();
//   const rangesValue = getDateRanges();
//   const compile = useCompile();
//   const presets = [
//     { label: t('Today'), value: rangesValue.today },
//     { label: t('Last week'), value: rangesValue.lastWeek },
//     { label: t('This week'), value: rangesValue.thisWeek },
//     { label: t('Next week'), value: rangesValue.nextWeek },
//     { label: t('Last month'), value: rangesValue.lastMonth },
//     { label: t('This month'), value: rangesValue.thisMonth },
//     { label: t('Next month'), value: rangesValue.nextMonth },
//     { label: t('Last quarter'), value: rangesValue.lastQuarter },
//     { label: t('This quarter'), value: rangesValue.thisQuarter },
//     { label: t('Next quarter'), value: rangesValue.nextQuarter },
//     { label: t('Last year'), value: rangesValue.lastYear },
//     { label: t('This year'), value: rangesValue.thisYear },
//     { label: t('Next year'), value: rangesValue.nextYear },
//     { label: t('Last 7 days'), value: rangesValue.last7Days },
//     { label: t('Next 7 days'), value: rangesValue.next7Days },
//     { label: t('Last 30 days'), value: rangesValue.last30Days },
//     { label: t('Next 30 days'), value: rangesValue.next30Days },
//     { label: t('Last 90 days'), value: rangesValue.last90Days },
//     { label: t('Next 90 days'), value: rangesValue.next90Days },
//   ];

//   const targetPicker = value ? inferPickerType(value?.[0], picker) : picker;
//   const targetDateFormat = getPickerFormat(targetPicker) || format;
//   const newProps: any = {
//     utc,
//     presets,
//     ...props,
//     format: getDateTimeFormat(targetPicker, targetDateFormat, showTime, timeFormat),
//     picker: targetPicker,
//     showTime: showTime ? { defaultValue: [dayjs('00:00:00', 'HH:mm:ss'), dayjs('23:59:59', 'HH:mm:ss')] } : false,
//   };
//   return <InternalRangePicker {...newProps} />;
// };
