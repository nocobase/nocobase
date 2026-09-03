/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';

export class FlowUtils {
  static getSubModels(model: FlowModel) {
    return Object.values(model.subModels).flatMap((item) => (Array.isArray(item) ? item : [item]));
  }

  static walkthrough(model: FlowModel, callback: (model: FlowModel) => void) {
    const queue: FlowModel[] = FlowUtils.getSubModels(model);
    while (queue.length) {
      const item = queue.shift();
      if (!item) {
        continue;
      }
      if (item.subModels) {
        queue.push(...FlowUtils.getSubModels(item));
      }
      callback(item);
    }
  }
}
