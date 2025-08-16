/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from '@formily/antd-v5';
import { largeField } from '@nocobase/flow-engine';
import { FormFieldModel } from '../FormFieldModel';

@largeField()
export class MarkdownEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['markdown'];

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
