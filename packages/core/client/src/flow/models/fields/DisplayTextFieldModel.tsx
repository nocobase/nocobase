/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, escapeT } from '@nocobase/flow-engine';
import React from 'react';
import { ClickableFieldModel } from './ClickableFieldModel';

export class DisplayTextFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    const { prefix, suffix } = this.props;
    return (
      <span>
        {prefix}
        {this.translate(value)}
        {suffix}
      </span>
    );
  }
}
DisplayTextFieldModel.define({
  label: escapeT('Text'),
});
DisplayItemModel.bindModelToInterface(
  'DisplayTextFieldModel',
  ['input', 'email', 'phone', 'uuid', 'attachmentURL', 'textarea', 'nanoid'],
  {
    isDefault: true,
  },
);
