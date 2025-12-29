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

export class ViewActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('View'),
  };

  getAclActionName() {
    return 'view';
  }
}

ViewActionModel.define({
  label: tExpr('View'),
  sort: 10,
});
