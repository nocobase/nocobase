/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultRelatedModels, FlowModel } from '@nocobase/flow-engine';

type BlockFlowModelMeta = {
  title: string;
  group?: string;
  defaultOptions?: Record<string, any>;
  icon?: string;
};

export class BlockFlowModel<T = DefaultRelatedModels> extends FlowModel<T> {
  static meta: BlockFlowModelMeta;
  static define(meta: BlockFlowModelMeta) {
    this.meta = meta;
  }
}
