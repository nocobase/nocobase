/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableItemModel, FilterableItemModel, escapeT } from '@nocobase/flow-engine';
import { Input } from 'antd';
import React from 'react';
import { FieldModel } from '../base';

export class InputFieldModel extends FieldModel {
  render() {
    return <Input {...this.props} />;
  }
}

InputFieldModel.define({
  label: escapeT('Input'),
});
EditableItemModel.bindModelToInterface(
  'InputFieldModel',
  ['input', 'email', 'phone', 'uuid', 'url', 'sequence', 'nanoid'],
  {
    isDefault: true,
  },
);

FilterableItemModel.bindModelToInterface(
  'InputFieldModel',
  [
    'input',
    'email',
    'phone',
    'uuid',
    'url',
    'sequence',
    'nanoid',
    'textarea',
    'markdown',
    'richText',
    'password',
    'color',
  ],
  {
    isDefault: true,
  },
);
