/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ModelConstructor } from '@nocobase/flow-engine';
import { NestedBlockModel, NestedSub1BlockModel, NestedSub2BlockModel } from './NestedBlockModel';

export default {
  NestedSub1BlockModel,
  NestedSub2BlockModel,
  NestedBlockModel,
} as Record<string, ModelConstructor>;
