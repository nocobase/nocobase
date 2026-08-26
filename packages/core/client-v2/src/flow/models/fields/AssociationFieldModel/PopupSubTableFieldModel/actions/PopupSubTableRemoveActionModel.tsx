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
import { SubTableRecordAction } from './PopupSubTableEditActionModel';

export class PopupSubTableRemoveActionModel extends SubTableRecordAction {
  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('Remove'),
  };

  async onDispatchEventStart(eventName: string) {
    if (eventName === 'beforeRender') {
      this.onClick = (event) => {
        this.dispatchEvent(
          'click',
          {
            event,
            ...this.getInputArgs(),
          },
          {
            debounce: true,
          },
        );
      };
    }
  }
}

PopupSubTableRemoveActionModel.define({
  label: tExpr('Remove'),
});
PopupSubTableRemoveActionModel.registerFlow({
  key: 'subTableRemoveActionSettings',
  steps: {
    disableProps: {
      async handler(ctx, params) {
        if (!ctx.model.context.associationModel) {
          return;
        }
        const allowDisassociation = ctx.model.context.associationModel.getStepParams?.(
          'advanceSubTableAssociation',
          'allowDisassociation',
        )?.allowDisassociation;
        const record = ctx.record;
        if (allowDisassociation === false && !(record.__is_new__ || record.__is_stored__)) {
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
PopupSubTableRemoveActionModel.registerFlow({
  key: 'deleteSettings',
  title: tExpr('Delete settings'),
  on: 'click',
  steps: {
    confirm: {
      use: 'confirm',
      defaultParams: {
        enable: true,
        title: tExpr('Remove record'),
        content: tExpr('Are you sure you want to remove it?'),
      },
    },
    delete: {
      async handler(ctx, params) {
        const subTableModel = ctx.model.context.associationModel;
        subTableModel.dispatchEvent('removeRow', {
          removeRecord: ctx.record,
        });
      },
    },
  },
});

PopupSubTableRemoveActionModel.registerFlow({
  key: 'enableRemoveChange',
  on: 'enableRemoveChange',
  steps: {
    pageRefresh: {
      handler(ctx, params) {
        console.log(ctx, 999999);
      },
    },
  },
});
