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

const DateOnlyPicker = (props) => {
  const { value, format = 'YYYY-MM-DD', picker = 'date', showTime, ...rest } = props;

  const componentProps = {
    ...rest,
    value,
    format,
    picker,
    showTime,
  };
  return <DateFilterDynamicComponent {...componentProps} />;
};

export class DateOnlyFilterFieldModel extends DateTimeFilterFieldModel {
  setProps(componentProps) {
    super.setProps({
      ...componentProps,
      showTime: false,
      utc: false,
    });
  }
  render() {
    return <DateOnlyPicker {...this.props} />;
  }
}

FilterableItemModel.bindModelToInterface('DateOnlyFilterFieldModel', ['date'], {
  isDefault: true,
});
