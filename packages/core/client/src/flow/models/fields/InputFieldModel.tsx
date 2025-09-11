/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableItemModel, FilterableItemModel } from '@nocobase/flow-engine';
import { Input } from 'antd';
import { FormFieldModel } from './FormFieldModel';

export class InputFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['input', 'email', 'phone', 'uuid', 'url', 'sequence', 'nanoid'];
  get component() {
    return [Input, {}];
  }
}

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
