/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AddNewActionModel,
  FilterActionModel,
  ActionGroupModel,
  ActionModel,
  RefreshActionModel,
} from '@nocobase/client';
import { escapeT } from '@nocobase/flow-engine';
import { BulkUpdateActionModel } from '@nocobase/plugin-action-bulk-update/client';

export class MapActionGroupModel extends ActionGroupModel {}

MapActionGroupModel.define({
  label: escapeT('Map action', { ns: 'map-block' }),
});

MapActionGroupModel.registerActionModels({
  FilterActionModel,
  AddNewActionModel,
  RefreshActionModel,
  BulkUpdateActionModel,
});
