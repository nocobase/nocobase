/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, CreateFormModel } from '@nocobase/client';
import { ButtonProps } from 'antd';

export class CustomFormBlockModel extends CreateFormModel {
  subModelBaseClasses = {
    action: ['FormActionModel', 'CustomFormActionModel'] as any,
    field: ['FormItemModel', 'FormCustomItemModel'] as any,
  };
}

export class CustomFormActionModel extends ActionModel {}

export class HelloCustomFormActionModel extends CustomFormActionModel {
  defaultProps: ButtonProps = {
    title: 'Hello Custom Action',
  };
}

CustomFormBlockModel.define({
  hide: true,
  children: false,
  createModelOptions: async (ctx, extra) => {
    return {
      use: 'CustomFormBlockModel',
      subModels: {
        grid: {
          use: 'FormGridModel',
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
        },
      },
    };
  },
});
