/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem, Input } from '@formily/antd-v5';
import { FormFieldModel } from '../../FormFieldModel';

export class TextareaFieldModel extends FormFieldModel {
  get component() {
    return [
      Input.TextArea,
      {
        autoSize: {
          maxRows: 10,
          minRows: 3,
        },
        ...this.props,
      },
    ];
  }
}
