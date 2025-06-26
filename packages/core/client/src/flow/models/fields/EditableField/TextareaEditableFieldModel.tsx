/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from '@formily/antd-v5';
import { EditableFieldModel } from './EditableFieldModel';

export class TextareaEditableFieldModel extends EditableFieldModel {
  static supportedFieldInterfaces = ['textarea', 'markdown'];

  setComponentProps(componentProps) {
    super.setComponentProps({
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
