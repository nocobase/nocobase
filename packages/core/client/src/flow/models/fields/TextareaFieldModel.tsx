/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import { largeField, EditableItemModel } from '@nocobase/flow-engine';
import { FormFieldModel } from './FormFieldModel';

@largeField()
export class TextareaFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['textarea', 'markdown'];

  get component() {
    return [Input.TextArea, {}];
  }
}

EditableItemModel.bindModelToInterface('TextareaFieldModel', ['textarea', 'markdown'], {
  isDefault: true,
  defaultProps: {
    autoSize: {
      maxRows: 10,
      minRows: 3,
    },
  },
});
