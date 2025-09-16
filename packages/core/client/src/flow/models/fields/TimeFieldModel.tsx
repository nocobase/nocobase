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
import { EditableItemModel, FilterableItemModel, escapeT } from '@nocobase/flow-engine';
import dayjs from 'dayjs';
import { FieldModel } from '../base';

export class TimeFieldModel extends FieldModel {
  setProps(props) {
    const format = props['format'] || 'HH:mm:ss';
    const onChange = props.onChange;
    const componentProps = {
      ...props,
      format,
      inputReadOnly: true,
      value: dayjsable(props.value, 'HH:mm:ss'),
      onChange: (value: dayjs.Dayjs | dayjs.Dayjs[]) => {
        if (onChange) {
          onChange(formatDayjsValue(value, 'HH:mm:ss') || null);
        }
      },
    };
    super.setProps({
      ...props,
      ...componentProps,
    });
  }

  render() {
    return <TimePicker {...this.props} style={{ width: '100%' }} />;
  }
}

TimeFieldModel.registerFlow({
  key: 'timeSettings',
  sort: 3000,
  title: escapeT('Time settings'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: escapeT('Time format'),
    },
  },
});

EditableItemModel.bindModelToInterface('TimeFieldModel', ['time'], {
  isDefault: true,
});

FilterableItemModel.bindModelToInterface('TimeFieldModel', ['time'], {
  isDefault: true,
});
