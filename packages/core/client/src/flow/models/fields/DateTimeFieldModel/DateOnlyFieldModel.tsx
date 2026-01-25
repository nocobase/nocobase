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
import { EditableItemModel, useFlowModelContext } from '@nocobase/flow-engine';
import React from 'react';
import { DateTimeFieldModel } from './DateTimeFieldModel';
import { MobileDatePicker } from '../mobile-components/MobileDatePicker';

export const DateOnlyPicker = (props) => {
  const { value, format = 'YYYY-MM-DD', picker = 'date', showTime, ...rest } = props;
  const parsedValue = value && dayjs(value).isValid() ? dayjs(value) : null;
  const ctx = useFlowModelContext();
  const componentProps = {
    ...rest,
    value: parsedValue,
    format,
    picker,
    showTime,
    onChange: (val: any) => {
      const outputFormat = 'YYYY-MM-DD';
      if (!val) {
        props.onChange(undefined);
        return;
      }
      if (picker === 'date') {
        props.onChange(val.format(outputFormat));
      } else {
        props.onChange(val.startOf(picker).format(outputFormat));
      }
    },
  };

  // TODO: 移动端相关的代码需迁移到单独的插件中
  if (ctx.isMobileLayout) {
    return <MobileDatePicker {...componentProps} />;
  }

  return <DatePicker {...componentProps} />;
};

export class DateOnlyFieldModel extends DateTimeFieldModel {
  setProps(componentProps) {
    super.setProps({
      ...componentProps,
      showTime: false,
      utc: false,
    });
  }
  render() {
    return <DateOnlyPicker {...this.props} style={{ width: '100%' }} />;
  }
}

EditableItemModel.bindModelToInterface('DateOnlyFieldModel', ['date'], { isDefault: true });
