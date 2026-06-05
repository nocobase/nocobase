/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, tExpr } from '@nocobase/flow-engine';
import dayjs from 'dayjs';
import React from 'react';
import { ClickableFieldModel } from './ClickableFieldModel';

export class DisplayDateTimeFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    const finalFormat = this.props.format;
    let formattedValue = '';
    if (value) {
      const day = dayjs(value);
      formattedValue = day.isValid() ? day.format(finalFormat) : '';
    }
    return <div>{formattedValue}</div>;
  }
}

DisplayDateTimeFieldModel.registerFlow({
  key: 'datetimeSettings',
  sort: 1000,
  title: tExpr('Datetime settings'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: tExpr('Date display format'),
    },
  },
});
DisplayDateTimeFieldModel.define({
  label: tExpr('Datetime'),
});

DisplayItemModel.bindModelToInterface(
  'DisplayDateTimeFieldModel',
  ['date', 'datetimeNoTz', 'createdAt', 'datetime', 'updatedAt', 'unixTimestamp', 'formula'],
  {
    isDefault: true,
    when(ctx, fieldInstance) {
      if (fieldInstance.type === 'formula') {
        return fieldInstance.dataType === 'date';
      }
      return true;
    },
  },
);
