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
import { ClickableFieldModel } from './ClickableFieldModel';

export class DisplayTextFieldModel extends ClickableFieldModel {
  public renderComponent(value, wrap) {
    const { prefix, suffix, overflowMode } = this.props;
    return (
      <span style={{ whiteSpace: overflowMode === 'wrap' || wrap ? 'pre-line' : 'nowrap' }}>
        {prefix}
        {this.translate(value)}
        {suffix}
      </span>
    );
  }
}
DisplayTextFieldModel.define({
  label: tExpr('Text'),
});
DisplayItemModel.bindModelToInterface(
  'DisplayTextFieldModel',
  ['input', 'email', 'phone', 'uuid', 'textarea', 'nanoid'],
  {
    isDefault: true,
  },
);
