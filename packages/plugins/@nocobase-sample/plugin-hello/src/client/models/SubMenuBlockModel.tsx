/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel } from '@nocobase/client';

export class SubMenuBlockModel extends BlockModel {
  static defineChildren() {
    return [
      {
        key: 'item1',
        label: 'Hello Block',
        useModel: 'HelloBlockModel',
        createModelOptions: {},
      },
      {
        key: 'item2',
        label: 'Custom Table Block',
        useModel: 'CustomTableBlockModel',
        createModelOptions: {
          stepParams: {
            resourceSettings: {
              init: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
            },
          },
        },
      },
      {
        key: 'item3',
        label: 'Custom Form Block',
        useModel: 'CustomFormBlockModel',
        createModelOptions: {
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
        },
      },
    ];
  }
}

SubMenuBlockModel.define({
  label: 'Sub Menu',
});
