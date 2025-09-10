/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox } from 'antd';
import { EditableItemModel } from '@nocobase/flow-engine';
import { FormFieldModel } from './FormFieldModel';

export class CheckboxFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['checkbox'];

  get component() {
    return [Checkbox, {}];
  }
}

EditableItemModel.bindModelToInterface('CheckboxFieldModel', ['checkbox'], {
  isDefault: true,
});
