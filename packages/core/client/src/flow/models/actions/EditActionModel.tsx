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
import { ActionSceneEnum, PopupActionModel } from '../base';

export class EditActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.record;

  defaultPopupTitle = tExpr('Edit');
  defaultProps: ButtonProps = {
    title: tExpr('Edit'),
  };

  getAclActionName() {
    return 'update';
  }
}

EditActionModel.define({
  label: tExpr('Edit'),
  sort: 20,
});
