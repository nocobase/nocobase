/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { ActionSceneEnum, PopupActionModel } from '../base';

export class AddNewActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.collection;

  defaultPopupTitle = tExpr('Add new');
  defaultProps: ButtonProps = {
    type: 'primary',
    title: tExpr('Add new'),
    icon: 'PlusOutlined',
  };

  getAclActionName() {
    return 'create';
  }
}

AddNewActionModel.define({
  label: tExpr('Add new'),
  sort: 10,
});
