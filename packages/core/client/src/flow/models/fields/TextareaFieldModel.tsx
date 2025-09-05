/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import { largeField } from '@nocobase/flow-engine';
import { FormFieldModel } from './FormFieldModel';

@largeField()
export class TextareaFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['textarea', 'markdown'];

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
