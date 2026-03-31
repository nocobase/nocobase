/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { dayjsable, formatDayjsValue } from '@formily/antd-v5/esm/__builtins__';
import { TimePicker } from 'antd';
import React from 'react';
import { EditableItemModel, FilterableItemModel, tExpr, useFlowModelContext } from '@nocobase/flow-engine';
import dayjs from 'dayjs';
import { FieldModel } from '../base';
import { MobileTimePicker } from './mobile-components/MobileTimePicker';

const TimePickerCom = (props) => {
  const format = props['format'] || 'HH:mm:ss';
  const onChange = props.onChange;
  const ctx = useFlowModelContext();
  const componentProps = {
    ...props,
    picker: 'time',
    format,
    inputReadOnly: true,
    value: dayjsable(props.value, 'HH:mm:ss'),
    onChange: (value: dayjs.Dayjs | dayjs.Dayjs[]) => {
      if (onChange) {
        onChange(formatDayjsValue(value, 'HH:mm:ss') || null);
      }
    },
  };

  // TODO: 移动端相关的代码需迁移到单独的插件中
  if (ctx.isMobileLayout) {
    return <MobileTimePicker {...componentProps} />;
  }

  return <TimePicker {...componentProps} />;
};

export class TimeFieldModel extends FieldModel {
  render() {
    return <TimePickerCom {...this.props} style={{ width: '100%' }} />;
  }
}

TimeFieldModel.registerFlow({
  key: 'timeSettings',
  sort: 3000,
  title: tExpr('Time settings'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: tExpr('Time format'),
    },
  },
});

EditableItemModel.bindModelToInterface('TimeFieldModel', ['time'], {
  isDefault: true,
});

FilterableItemModel.bindModelToInterface('TimeFieldModel', ['time'], {
  isDefault: true,
});
