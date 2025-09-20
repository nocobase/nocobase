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

export class SimpleCollectionPopupActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection popup'),
  };
}

SimpleCollectionPopupActionModel.define({
  label: tExpr('Simple collection popup'),
});
