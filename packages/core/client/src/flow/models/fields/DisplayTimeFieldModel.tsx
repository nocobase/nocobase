/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, tExpr } from '@nocobase/flow-engine';
import React from 'react';
import dayjs from 'dayjs';
import { ClickableFieldModel } from './ClickableFieldModel';

export class DisplayTimeFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    const { prefix, suffix } = this.props;
    const format = this.props['format'] || 'HH:mm:ss';
    const result = value && dayjs(value, 'HH:mm:ss').format(format);
    return (
      <span>
        {prefix}
        {result}
        {suffix}
      </span>
    );
  }
}

DisplayTimeFieldModel.registerFlow({
  key: 'timeSettings',
  sort: 1000,
  title: tExpr('Time settings'),
  steps: {
    dateFormat: {
      title: tExpr('Time format'),
      use: 'dateDisplayFormat',
    },
  },
});

DisplayTimeFieldModel.define({
  label: tExpr('Time'),
});
DisplayItemModel.bindModelToInterface('DisplayTimeFieldModel', ['time'], {
  isDefault: true,
});
