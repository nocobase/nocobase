/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import { FormFieldModel } from './FormFieldModel';
import { largeField } from '@nocobase/flow-engine';
@largeField()
export class TextareaEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['textarea'];

  setProps(componentProps) {
    super.setProps({
      ...componentProps,
      autoSize: {
        maxRows: 10,
        minRows: 3,
      },
    });
  }
  get component() {
    return [Input.TextArea, {}];
  }
}
