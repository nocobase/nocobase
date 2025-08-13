/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import { customAlphabet as Alphabet } from 'nanoid';
import { FormFieldModel } from './FormFieldModel';

export class NanoIDEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['nanoid'];

  get component() {
    return [Input, {}];
  }
}

// NanoIDEditableFieldModel.registerFlow({
//   key: 'nanoidSettings',
//   sort: 1000,
//   steps: {
//     initialValue: {
//       handler(ctx, params) {
//       //   const { size, customAlphabet } = ctx.model.collectionField.options || { size: 21 };
//       //   const form = ctx.model.form;
//       //   const fieldPath = ctx.model.fieldPath;
//       //   const value = form.getFieldValue(fieldPath);
//       //   function isValidNanoid(value) {
//       //     if (value?.length !== size) {
//       //       return ctx.t('Field value size is') + ` ${size || 21}`;
//       //     }
//       //     for (let i = 0; i < value.length; i++) {
//       //       if (customAlphabet?.indexOf(value[i]) === -1) {
//       //         return ctx.t('Field value do not meet the requirements');
//       //       }
//       //     }
//       //   }
//       //   if (!value && customAlphabet) {
//       //     form.setFieldValue(fieldPath, Alphabet(customAlphabet, size)());
//       //   }
//       //   // ctx.model.field.validator = isValidNanoid;
//       // },
//     },
//   },
// });
