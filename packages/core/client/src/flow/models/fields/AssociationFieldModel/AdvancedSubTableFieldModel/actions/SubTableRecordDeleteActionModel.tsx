/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { SubTableRecordAction } from './SubTableEditActionModel';

export class SubTableRecordDeleteActionModel extends SubTableRecordAction {
  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('Delete'),
  };

  getAclActionName() {
    return 'update';
  }
}

SubTableRecordDeleteActionModel.define({
  label: tExpr('Delete'),
});
SubTableRecordDeleteActionModel.registerFlow({
  key: 'subTableRemoveActionSettings',
  steps: {
    disableProps: {
      async handler(ctx, params) {
        const { allowDisassociation } = ctx.associationModel?.props || {};
        const record = ctx.record;
        if (!allowDisassociation && !(record.__is_new__ || record.__is_stored__)) {
          ctx.model.setProps({
            disabled: true,
          });
        } else {
          ctx.model.setProps({
            disabled: false,
          });
        }
      },
    },
  },
});
SubTableRecordDeleteActionModel.registerFlow({
  key: 'deleteSettings',
  title: tExpr('Delete settings'),
  on: 'click',
  steps: {
    confirm: {
      use: 'confirm',
      defaultParams: {
        enable: true,
        title: tExpr('Delete record'),
        content: tExpr('Are you sure you want to delete it?'),
      },
    },
    delete: {
      async handler(ctx, params) {
        const subTableModel = ctx.model.parent.context.associationModel;
        subTableModel.dispatchEvent('removeRow', {
          removeRecord: ctx.record,
        });
      },
    },
  },
});
