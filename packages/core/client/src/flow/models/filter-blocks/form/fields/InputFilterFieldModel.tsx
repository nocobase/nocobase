/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import { FilterFormFieldModel } from './FilterFormFieldModel';

export class InputFilterFieldModel extends FilterFormFieldModel {
  static readonly supportedFieldInterfaces = [
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
  ];

  get component() {
    return [Input, {}];
  }
}
