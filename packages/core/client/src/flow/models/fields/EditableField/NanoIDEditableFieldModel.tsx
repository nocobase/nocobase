/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from '@formily/antd-v5';
import { customAlphabet as Alphabet } from 'nanoid';
import { FormFieldModel } from './FormFieldModel';

export class NanoIDEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['nanoid'];

  get component() {
    return [Input, {}];
  }
}

NanoIDEditableFieldModel.registerFlow({
  key: 'nanoidSettings',
  auto: true,
  sort: 1000,
  steps: {
    initialValue: {
      handler(ctx, params) {
        const { size, customAlphabet } = ctx.model.collectionField.options || { size: 21 };
        function isValidNanoid(value) {
          if (value?.length !== size) {
            return ctx.t('Field value size is') + ` ${size || 21}`;
          }
          for (let i = 0; i < value.length; i++) {
            if (customAlphabet?.indexOf(value[i]) === -1) {
              return ctx.t('Field value do not meet the requirements');
            }
          }
        }
        if (!ctx.model.field.value && customAlphabet) {
          ctx.model.field.setInitialValue(Alphabet(customAlphabet, size)());
        }
        ctx.model.field.validator = isValidNanoid;
      },
    },
  },
});
