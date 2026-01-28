/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum, PopupActionModel, PopupCollectionActionModel } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { NAMESPACE } from '../locale';
import { createTagPageOptions } from './utils';

const SETTINGS_FLOW_KEY = 'bulkEditSettings';

export class BulkEditActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.collection;

  defaultPopupTitle = tExpr('Bulk edit');
  defaultProps: ButtonProps = {
    title: tExpr('Bulk edit'),
    icon: 'EditOutlined',
  };

  getAclActionName() {
    return 'update';
  }

  // getInputArgs() {
  //   const base = super.getInputArgs();
  //   console.log('BulkEditActionModel getInputArgs called', base);
  //   return {
  //     ...base,
  //     scene: 'bulkEditForm',
  //   };
  // }
}

BulkEditActionModel.define({
  label: tExpr('Bulk edit'),
  createModelOptions: async (ctx, extra) => {
    console.log('BulkEditActionModel createModelOptions called', ctx, extra);
    return {
      use: 'BulkEditActionModel',
      subModels: {
        page: createTagPageOptions({
          tabTitle: tExpr('Bulk edit'),
        }),
      },
    };
  },
});

BulkEditActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  title: tExpr('Bulk edit action settings', { ns: NAMESPACE }),
  manual: true,
  steps: {
    // 编辑范围：选中记录 or 全部记录
    editMode: {
      title: tExpr('Data will be updated'),
      uiMode: (ctx) => {
        return {
          type: 'select',
          key: 'value',
          props: {
            options: [
              { label: tExpr('Selected'), value: 'selected' },
              { label: tExpr('All'), value: 'all' },
            ],
          },
        };
      },
      handler(ctx, params) {},
      defaultParams: {
        value: 'selected',
      },
    },
    // openModal: {
    //   async handler(ctx) { },
    // },
  },
});
