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

export class InputEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['input', 'email', 'phone', 'uuid', 'url', 'sequence'];
  get component() {
    return [Input, {}];
  }
}

InputEditableFieldModel.registerFlow({
  key: 'inputFieldSettings',
  sort: 400,
  steps: {
    init: {
      handler(ctx) {
        if (ctx.model.collectionField.interface === 'email') {
          const props = ctx.model.parent.getProps();
          const rules = [...(props.rules || [])];
          if (!rules.some((rule) => rule.type === 'email')) {
            rules.push({
              type: 'email',
              message: ctx.t('The field value is not a email format'),
            });
          }

          ctx.model.parent.setProps({ rules });
        }
      },
    },
  },
});
