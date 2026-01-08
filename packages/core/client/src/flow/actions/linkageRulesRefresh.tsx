/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';
import { FlowRuntimeContext } from '@nocobase/flow-engine';

type LinkageRulesRefreshParams = {
  /**
   * The action name that actually runs linkage rules.
   * e.g. 'actionLinkageRules' | 'detailsFieldLinkageRules' | 'fieldLinkageRules'
   */
  actionName: string;
  /** Where linkage rules are stored. e.g. 'buttonSettings' */
  flowKey: string;
  /** Defaults to 'linkageRules'. */
  stepKey?: string;
};

export const linkageRulesRefresh = defineAction({
  name: 'linkageRulesRefresh',
  async handler(ctx, params) {
    const actionName = params?.actionName;
    const flowKey = params?.flowKey;
    const stepKey = params?.stepKey || 'linkageRules';

    if (!actionName || !flowKey) return;

    const model = ctx.model;
    const hasFlow = !!model.getFlow(flowKey);
    // Prefer running on the current model; fallback to blockModel when the current model doesn't own the flow.
    if (!hasFlow) return;

    // If forks exist, skip running on master (template) model to avoid polluting baseline state.
    if (!model?.isFork && model?.forks?.size) {
      return;
    }

    // Dedupe concurrent refreshes triggered by deep dispatch (e.g. many items calling the same refresh).
    const runKey = `${flowKey}:${stepKey}:${actionName}`;
    const inflightMap: Map<string, Promise<any>> = (model.__linkageRulesRefreshInflight ||= new Map());
    const existing = inflightMap.get(runKey);
    if (existing) {
      await existing;
      return;
    }

    const run = (async () => {
      const raw = model?.getStepParams?.(flowKey, stepKey);
      const resolved = await ctx.resolveJsonTemplate({ value: [], ...(raw || {}) });
      const action = ctx.getAction?.(actionName);
      if (action?.handler) {
        await action.handler(ctx, resolved);
      }
    })();

    inflightMap.set(runKey, run);
    try {
      await run;
    } finally {
      inflightMap.delete(runKey);
    }
  },
});
