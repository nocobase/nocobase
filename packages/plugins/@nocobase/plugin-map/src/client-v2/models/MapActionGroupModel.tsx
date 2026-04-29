/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AddNewActionModel, FilterActionModel, ActionGroupModel, RefreshActionModel } from '@nocobase/client-v2';

import { tExpr } from '../locale';

export class MapActionGroupModel extends ActionGroupModel {}

MapActionGroupModel.define({
  label: tExpr('Map action'),
});

MapActionGroupModel.registerActionModels({
  FilterActionModel,
  AddNewActionModel,
  RefreshActionModel,
});
