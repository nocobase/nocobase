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

const DateTimeNoTzPicker = (props) => {
  const { value, format = 'YYYY-MM-DD HH:mm:ss', showTime, picker = 'date', ...rest } = props;
  // When showTime is true, use date-only format to avoid duplication
  // because getDateTimeFormat will append time format automatically
  const dateFormat = showTime && picker === 'date' ? 'YYYY-MM-DD' : format;
  return <DateFilterDynamicComponent {...rest} value={value} format={dateFormat} picker={picker} showTime={showTime} />;
};

export class DateTimeNoTzFilterFieldModel extends DateTimeFilterFieldModel {
  render() {
    return <DateTimeNoTzPicker {...this.props} />;
  }
}

FilterableItemModel.bindModelToInterface('DateTimeNoTzFilterFieldModel', ['datetimeNoTz'], {
  isDefault: true,
});
