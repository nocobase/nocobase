/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { reaction } from '@formily/reactive';
import { tExpr } from '@nocobase/flow-engine';
import { FilterFormActionModel } from './FilterFormActionModel';

type FilterFormBlockState = {
  autoTriggerFilter: boolean;
};

const mountedSubmitActions = new WeakSet<object>();
const visibleSubmitActionsByBlock = new WeakMap<FilterFormBlockState, Set<object>>();
const hiddenReactionDisposers = new WeakMap<object, () => void>();

const syncAutoTriggerFilter = (blockModel: FilterFormBlockState, lifecycleAction: object & { hidden?: boolean }) => {
  let visibleSubmitActions = visibleSubmitActionsByBlock.get(blockModel);

  if (mountedSubmitActions.has(lifecycleAction) && !lifecycleAction.hidden) {
    if (!visibleSubmitActions) {
      visibleSubmitActions = new Set<object>();
      visibleSubmitActionsByBlock.set(blockModel, visibleSubmitActions);
    }
    visibleSubmitActions.add(lifecycleAction);
  } else {
    visibleSubmitActions?.delete(lifecycleAction);
  }

  blockModel.autoTriggerFilter = Boolean(!visibleSubmitActions?.size);
  if (!visibleSubmitActions?.size) {
    visibleSubmitActionsByBlock.delete(blockModel);
  }
};

export class FilterFormSubmitActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    title: tExpr('Filter'),
    type: 'primary',
  };

  private getLifecycleAction(): object & { hidden?: boolean } {
    return this.context.model || this;
  }

  private syncAutoTriggerFilter(): void {
    const blockModel = this.context.blockModel as FilterFormBlockState;
    const lifecycleAction = this.getLifecycleAction();
    syncAutoTriggerFilter(blockModel, lifecycleAction);
  }

  onMount(): void {
    super.onMount();
    const blockModel = this.context.blockModel as FilterFormBlockState;
    const lifecycleAction = this.getLifecycleAction();
    mountedSubmitActions.add(lifecycleAction);
    hiddenReactionDisposers.get(lifecycleAction)?.();
    hiddenReactionDisposers.set(
      lifecycleAction,
      reaction(
        () => lifecycleAction.hidden,
        () => syncAutoTriggerFilter(blockModel, lifecycleAction),
      ),
    );
    this.syncAutoTriggerFilter();
  }

  onUnmount(): void {
    super.onUnmount();
    const lifecycleAction = this.getLifecycleAction();
    hiddenReactionDisposers.get(lifecycleAction)?.();
    hiddenReactionDisposers.delete(lifecycleAction);
    mountedSubmitActions.delete(lifecycleAction);
    this.syncAutoTriggerFilter();
  }
}

FilterFormSubmitActionModel.registerFlow({
  key: 'submitSettings',
  on: {
    eventName: 'click',
  },
  steps: {
    doFilter: {
      async handler(ctx, params) {
        ctx.form.submit();
      },
    },
  },
});

FilterFormSubmitActionModel.define({
  label: tExpr('Filter'),
  toggleable: true,
  sort: 100,
});
