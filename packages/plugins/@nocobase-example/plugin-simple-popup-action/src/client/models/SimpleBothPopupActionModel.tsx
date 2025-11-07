/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum, PopupActionModel } from '@nocobase/client';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothPopupActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both popup'),
  };
}

SimpleBothPopupActionModel.define({
  label: tExpr('Simple both popup'),
});
