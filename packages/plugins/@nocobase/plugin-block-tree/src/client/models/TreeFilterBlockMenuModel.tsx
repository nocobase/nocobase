/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { BlockSceneEnum, FilterBlockModel } from '@nocobase/client';
import { tExpr } from '../locale';
import { TreeBlockModel } from './TreeBlockModel';

export class TreeFilterBlockMenuModel extends FilterBlockModel {
  static scene = BlockSceneEnum.filter;

  static async defineChildren(ctx) {
    return await TreeBlockModel.defineChildren(ctx);
  }

  renderComponent() {
    return null;
  }
}

TreeFilterBlockMenuModel.define({
  label: tExpr('Tree'),
  sort: 1100,
});
