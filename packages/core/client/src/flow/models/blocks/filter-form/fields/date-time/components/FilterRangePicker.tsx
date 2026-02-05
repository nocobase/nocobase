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
import { dayjs, getDateTimeFormat, getPickerFormat, str2moment } from '@nocobase/utils/client';
import { DatePicker } from 'antd';
import React, { useMemo } from 'react';
import _ from 'lodash';

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
  const stripTimeFromFormat = (fmt: string) => (fmt ? fmt.replace(/\s*HH?:mm(?::ss)?(?:\.SSS)?/g, '').trim() : fmt);
  const targetDateFormat = showTime ? baseDateFormat : stripTimeFromFormat(baseDateFormat);
  const newProps: any = {
    utc: true,
    presets,
    ...props,
    format: getDateTimeFormat(targetPicker, targetDateFormat, showTime, timeFormat),
    picker: targetPicker,
    showTime: showTime ? { defaultValue: [dayjs('00:00:00', 'HH:mm:ss'), dayjs('23:59:59', 'HH:mm:ss')] } : false,
  };
  const dayjsValue = useMemo(() => {
    return _.castArray(props.value).map((item) => (item ? str2moment(item) : null));
  }, [props.value]);

  return <DatePicker.RangePicker {...newProps} style={{ flex: 1, ...newProps?.style }} value={dayjsValue} />;
};
