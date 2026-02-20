/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DateTimeFilterFieldModel } from './DateTimeFilterFieldModel';
import React from 'react';
import { FilterableItemModel } from '@nocobase/flow-engine';
import { DateFilterDynamicComponent } from './components/DateFilterDynamicComponent';

const DateTimeTzPicker = (props) => {
  const { value, format = 'YYYY-MM-DD HH:mm:ss', picker = 'date', showTime, ...rest } = props;
  // When showTime is true, use date-only format to avoid duplication
  // because getDateTimeFormat will append time format automatically
  const dateFormat = showTime && picker === 'date' ? 'YYYY-MM-DD' : format;
  const componentProps = {
    ...rest,
    value,
    format: dateFormat,
    picker,
    showTime,
  };
  return <DateFilterDynamicComponent {...componentProps} />;
};

export class DateTimeTzFilterFieldModel extends DateTimeFilterFieldModel {
  setProps(componentProps) {
    super.setProps({
      ...componentProps,
      utc: true,
    });
  }

  render() {
    return <DateTimeTzPicker {...this.props} />;
  }
}

FilterableItemModel.bindModelToInterface(
  'DateTimeTzFilterFieldModel',
  ['createdAt', 'datetime', 'updatedAt', 'unixTimestamp'],
  {
    isDefault: true,
  },
);
