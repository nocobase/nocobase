/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { usePrefixCls } from '@formily/antd-v5/esm/__builtins__';
import { isArr } from '@formily/shared';
import { getDefaultFormat, str2moment } from '@nocobase/utils/client';
import cls from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import { TableColumnModel } from '../TableColumnModel';

const ReadPretty = (props: any) => {
  const { value, picker = 'date' } = props;
  const prefixCls = usePrefixCls('description-date-picker', props);
  if (!value) {
    return <div></div>;
  }
  const getLabels = () => {
    const format = getDefaultFormat(props) as string;
    const m = str2moment(value, props);
    const labels = dayjs.isDayjs(m) ? m.format(format) : '';
    return isArr(labels) ? labels.join('~') : labels;
  };
  return <div className={cls(prefixCls, props.className)}>{getLabels()}</div>;
};
export class DateTimeReadPrettyFieldModel extends TableColumnModel {
  public static readonly supportedFieldInterfaces = [
    'date',
    'datetimeNoTz',
    'createdAt',
    'datetime',
    'updatedAt',
    'unixTimestamp',
  ];
  render() {
    return (value, record, index) => {
      return (
        <>
          <ReadPretty value={value} {...this.getComponentProps()} />
          {this.renderQuickEditButton(record)}
        </>
      );
    };
  }
}

DateTimeReadPrettyFieldModel.registerFlow({
  key: 'key3',
  auto: true,
  sort: 1000,
  title: 'Specific properties',
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: 'Date display format',
      defaultParams: (ctx) => {
        const { showTime, dateFormat, timeFormat, picker } = ctx.model.getComponentProps();
        return {
          picker: picker || 'date',
          dateFormat: dateFormat || 'YYYY-MM-DD',
          timeFormat: timeFormat,
          showTime,
        };
      },
    },
  },
});
