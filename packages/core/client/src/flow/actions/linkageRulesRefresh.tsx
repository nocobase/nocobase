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
    // If a new request arrives during the current run, rerun once after it finishes so fast-changing form values
    // cannot leave action linkage rules stale.
    const runKey = `${flowKey}:${stepKey}:${actionName}`;
    const inflightMap: Map<
      string,
      {
        promise: Promise<any>;
        pending: boolean;
        latestCtx: typeof ctx;
      }
    > = (model.__linkageRulesRefreshInflight ||= new Map());
    const existing = inflightMap.get(runKey);
    if (existing) {
      existing.pending = true;
      existing.latestCtx = ctx;
      await existing.promise;
      return;
    }

    const state = {
      promise: null as Promise<any>,
      pending: false,
      latestCtx: ctx,
    };

    const runOnce = async () => {
      const runCtx = state.latestCtx;
      const raw = model?.getStepParams?.(flowKey, stepKey);
      const resolved = await runCtx.resolveJsonTemplate({ value: [], ...(raw || {}) });
      const action = runCtx.getAction?.(actionName);
      if (action?.handler) {
        await action.handler(runCtx, resolved);
      }
    };

    state.promise = (async () => {
      try {
        do {
          state.pending = false;
          await runOnce();
        } while (state.pending);
      } finally {
        inflightMap.delete(runKey);
      }
    })();

    inflightMap.set(runKey, state);
    await state.promise;
  },
});
