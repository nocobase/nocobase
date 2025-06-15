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
        Input.TextArea,
        {
          autoSize: {
            maxRows: 10,
            minRows: 3,
          },
          ...this.props,
          options: this.props.dataSource || this.collectionField?.options?.uiSchema?.enum || [],
        },
      ],
    }) as any;
  }
}

TextareaFieldModel.registerFlow({
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
