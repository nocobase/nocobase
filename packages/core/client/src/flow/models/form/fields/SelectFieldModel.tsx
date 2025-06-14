/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem, Select } from '@formily/antd-v5';
import { Field as FormilyField } from '@formily/react';
import { FormFieldModel } from '../../FormFieldModel';
import React from 'react';

export class SelectFieldModel extends FormFieldModel {
  setDataSource(dataSource?: any[]) {
    this.props.dataSource = dataSource;
  }

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
        Select,
        {
          options: this.props.dataSource || this.collectionField?.options?.uiSchema?.enum || [],
        },
      ],
    }) as any;
  }
}

SelectFieldModel.registerFlow({
  key: 'select',
  title: 'DataSource',
  steps: {
    dataSource: {
      handler(ctx, params) {
        ctx.model.setDataSource(params.dataSource);
      },
    },
  },
});
