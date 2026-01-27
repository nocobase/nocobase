/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableItemModel, FilterableItemModel, tExpr } from '@nocobase/flow-engine';
import { Input } from 'antd';
import React from 'react';
import { FieldModel } from '../base';

export class InputFieldModel extends FieldModel {
  render() {
    return <Input {...this.props} />;
  }
}

InputFieldModel.define({
  label: tExpr('Input'),
});
EditableItemModel.bindModelToInterface('InputFieldModel', ['input', 'email', 'phone', 'uuid', 'url', 'nanoid'], {
  isDefault: true,
});

FilterableItemModel.bindModelToInterface(
  'InputFieldModel',
  [
    'input',
    'email',
    'phone',
    'uuid',
    'url',
    'nanoid',
    'textarea',
    'markdown',
    'vditor',
    'richText',
    'password',
    'color',
  ],
  {
    isDefault: true,
  },
);
