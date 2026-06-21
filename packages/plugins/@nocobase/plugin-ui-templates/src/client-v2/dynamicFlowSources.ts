/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { getPluginT } from './locale';

export function registerReferenceBlockDynamicFlowSourceProvider(flowEngine: FlowEngine) {
  flowEngine.flowSettings.registerDynamicFlowSourceProvider({
    key: 'ui-templates-reference-block',
    visible(model) {
      return !!getReferenceBlockTarget(model);
    },
    getSources(model) {
      const target = getReferenceBlockTarget(model);
      if (!target) {
        return [];
      }

      return [
        {
          key: 'referenced-template',
          label: getPluginT(model)('Referenced template'),
          model: target,
          sort: 10,
        },
      ];
    },
  });
}

function getReferenceBlockTarget(model: FlowModel): FlowModel | undefined {
  if (!isReferenceBlockModel(model)) {
    return;
  }

  const target = model.context?.refModel as FlowModel | undefined;
  if (!target || target.uid === model.uid || target.getEvents().size === 0) {
    return;
  }

  return target;
}

function isReferenceBlockModel(model: FlowModel): boolean {
  return model?.use === 'ReferenceBlockModel' || model?.constructor?.name === 'ReferenceBlockModel';
}
