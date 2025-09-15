/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { ActionSceneEnum, PopupActionModel } from '../base';

export class AddNewActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    type: 'primary',
    title: escapeT('Add new'),
    icon: 'PlusOutlined',
  };

  getAclActionName() {
    return 'create';
  }
}

AddNewActionModel.define({
  label: escapeT('Add new'),
});
