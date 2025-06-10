/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultStructure, FlowModel, FlowModelMeta } from '@nocobase/flow-engine';

export class BlockFlowModel<T = DefaultStructure> extends FlowModel<T> {
  static define(meta: FlowModelMeta) {
    super.define({
      ...meta,
      type: 'block',
    });
  }
}
