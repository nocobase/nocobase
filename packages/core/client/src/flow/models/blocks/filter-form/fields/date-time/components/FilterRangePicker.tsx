/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { getDateRanges, inferPickerType } from '../../../../../../../schema-component';
import { dayjs, getDateTimeFormat, getPickerFormat } from '@nocobase/utils/client';
import { DatePicker } from 'antd';
import React, { useMemo } from 'react';
import _ from 'lodash';

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

export const FilterRangePicker = (props: any) => {
  const { value, picker = 'date', format, showTime, timeFormat } = props;
  const flowEngine = useFlowEngine();
  const t = flowEngine.translate.bind(flowEngine);
  const rangesValue = getDateRanges();
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
  const baseDateFormat = targetPicker === picker && format ? format : getPickerFormat(targetPicker);
  const targetDateFormat = targetPicker === 'date' ? stripTimeFromFormat(baseDateFormat) : baseDateFormat;
  const resolvedFormat = getDateTimeFormat(targetPicker, targetDateFormat, showTime, timeFormat);
  const newProps: any = {
    utc: true,
    presets,
    ...props,
    format: resolvedFormat,
    picker: targetPicker,
    showTime: showTime ? { defaultValue: [dayjs('00:00:00', 'HH:mm:ss'), dayjs('23:59:59', 'HH:mm:ss')] } : false,
  };
  const dayjsValue = useMemo(() => {
    return _.castArray(props.value).map((item) => parseDateValue(item, resolvedFormat));
  }, [props.value, resolvedFormat]);

  return <DatePicker.RangePicker {...newProps} style={{ flex: 1, ...newProps?.style }} value={dayjsValue} />;
};
