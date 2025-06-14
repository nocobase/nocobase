/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@formily/antd-v5';
import { Field as FormilyField } from '@formily/react';
import { FormFieldModel } from '../../FormFieldModel';
import React from 'react';
import { InputNumber } from 'antd';

export class InputNumberFieldModel extends FormFieldModel {
  createField() {
    return this.form.createField({
      name: this.collectionField.name,
      ...this.props,
      decorator: [
        FormItem,
        {
          title: this.props.title,
        },
      ],
      component: [
        InputNumber,
        {
          ...this.props,
        },
      ],
    }) as any;
  }
}
