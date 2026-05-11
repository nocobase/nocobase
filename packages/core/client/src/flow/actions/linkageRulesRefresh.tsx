/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';

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

    // In runtime, only skip master when there are mounted forks that can handle the same flow.
    // Otherwise master is likely the rendered model and still needs refresh.
    // In design mode, always refresh master so the currently edited model state stays in sync.
    const flowSettingsEnabled = Boolean(
      (ctx as any)?.flowSettingsEnabled || (model as any)?.context?.flowSettingsEnabled,
    );
    const hasMountedForkWithFlow =
      !model?.isFork &&
      !!model?.forks?.size &&
      Array.from(model?.forks || []).some((fork: any) => {
        if (!fork || fork.disposed) return false;
        if (!fork?.context?.ref?.current) return false;
        return !!fork?.getFlow?.(flowKey);
      });
    const isMasterMounted = Boolean((model as any)?.context?.ref?.current);
    if (hasMountedForkWithFlow && !isMasterMounted && !flowSettingsEnabled) {
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
      const action = ctx.getAction?.(actionName);
      const paramsForAction = action?.useRawParams
        ? { value: [], ...(raw || {}) }
        : await ctx.resolveJsonTemplate({ value: [], ...(raw || {}) });
      if (action?.handler) {
        await action.handler(ctx, paramsForAction);
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
