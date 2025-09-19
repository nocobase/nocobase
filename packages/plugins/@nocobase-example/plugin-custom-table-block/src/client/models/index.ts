/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ModelConstructor } from '@nocobase/flow-engine';
import {
  CustomTableAssociationFieldGroupModel,
  CustomTableBlockModel,
  CustomTableCollectionActionGroupModel,
  CustomTableColumnModel,
  CustomTableRecordActionGroupModel,
} from './CustomTableBlockModel';

export default {
  CustomTableBlockModel,
  CustomTableCollectionActionGroupModel,
  CustomTableRecordActionGroupModel,
  CustomTableColumnModel,
  CustomTableAssociationFieldGroupModel,
} as Record<string, ModelConstructor>;
