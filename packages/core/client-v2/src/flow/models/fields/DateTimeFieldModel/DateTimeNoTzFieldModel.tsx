/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { EditableItemModel, useFlowModelContext } from '@nocobase/flow-engine';
import { DateTimeFieldModel } from './DateTimeFieldModel';
import { MobileDatePicker } from '../mobile-components/MobileDatePicker';

export const DateTimeNoTzPicker = (props) => {
  const { value, format = 'YYYY-MM-DD HH:mm:ss', showTime, picker = 'date', onChange, ...rest } = props;
  const parsedValue = value ? dayjs(value) : null;
  const ctx = useFlowModelContext();
  const componentProps = {
    ...rest,
    value: parsedValue,
    format,
    picker,
    showTime,
    onChange: (val: any) => {
      if (!val) {
        return onChange(val);
      }
      const outputFormat = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';

      // Adjust to start of period for month/quarter/year pickers
      const adjustedVal = picker !== 'date' ? dayjs(val).startOf(picker) : dayjs(val);

      onChange(adjustedVal.format(outputFormat));
    },
  };

  // TODO: 移动端相关的代码需迁移到单独的插件中
  if (ctx.isMobileLayout) {
    return <MobileDatePicker {...componentProps} />;
  }

  return <DatePicker {...componentProps} />;
};

export class DateTimeNoTzFieldModel extends DateTimeFieldModel {
  render() {
    return <DateTimeNoTzPicker {...this.props} style={{ width: '100%' }} />;
  }
}

EditableItemModel.bindModelToInterface('DateTimeNoTzFieldModel', ['datetimeNoTz'], { isDefault: true });
