/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd';
import { ActionModel, ActionSceneEnum } from '../base';
import { applyDisassociateAction, isAssociationBlockContext } from './AssociationActionUtils';

export class DisassociateActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;
  static capabilityActionName = 'update';

  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('Disassociate'),
    icon: 'DisconnectOutlined',
  };

  getAclActionName() {
    return 'update';
  }
}

DisassociateActionModel.define({
  label: tExpr('Disassociate'),
  sort: 65,
  hide(ctx) {
    return !isAssociationBlockContext(ctx);
  },
});

DisassociateActionModel.registerFlow({
  key: 'disassociateSettings',
  title: tExpr('Disassociate settings'),
  on: 'click',
  steps: {
    confirm: {
      use: 'confirm',
      defaultParams: {
        enable: true,
        title: tExpr('Disassociate record'),
        content: tExpr('Are you sure you want to disassociate it?'),
      },
    },
    disassociate: {
      async handler(ctx) {
        await applyDisassociateAction(ctx);
      },
    },
  },
});
