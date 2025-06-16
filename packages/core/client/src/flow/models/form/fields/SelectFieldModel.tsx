/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Select } from '@formily/antd-v5';
import { FormFieldModel } from '../../FormFieldModel';

export class SelectFieldModel extends FormFieldModel {
  setDataSource(dataSource?: any[]) {
    this.field.dataSource = dataSource;
  }

  get component() {
    return [
      Select,
      {
        ...this.props,
        options: this.props.dataSource || this.collectionField?.options?.uiSchema?.enum || [],
      },
    ];
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
