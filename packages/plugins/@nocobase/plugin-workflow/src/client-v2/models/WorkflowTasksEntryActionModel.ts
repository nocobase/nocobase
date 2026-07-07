/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, openViewFlow } from '@nocobase/client-v2';
import { observable } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { getWorkflowTasksPath } from '../constants';
import { tExpr } from '../locale';
import { getWorkflowTaskRegistry, subscribeWorkflowTaskCounts, type WorkflowTaskFlowContext } from '../taskCenter';

const WORKFLOW_TASKS_EMBEDDED_PAGE_MODEL = 'WorkflowTasksEmbeddedPageModel';

type ActionPanelBadgeOptions = {
  count?: number | string;
  overflowCount?: number;
};

type WorkflowTaskCountsSubscription = {
  reload: () => Promise<void>;
  unsubscribe: () => void;
};

export class WorkflowTasksEntryActionModel extends ActionModel {
  private readonly actionPanelBadgeState = observable<{ value: ActionPanelBadgeOptions | null }>({
    value: null,
  });
  private countsSubscription?: WorkflowTaskCountsSubscription;

  defaultProps: ButtonProps = {
    title: tExpr('Workflow todos'),
    icon: 'CheckCircleOutlined',
  };

  enableEditType = false;
  enableEditDanger = false;
  enableEditIconOnly = false;

  get actionPanelBadge() {
    return this.actionPanelBadgeState.value;
  }

  set actionPanelBadge(value: ActionPanelBadgeOptions | null) {
    this.actionPanelBadgeState.value = value;
  }

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    this.syncOpenViewStepParams();
  }

  protected onMount(): void {
    super.onMount();
    this.subscribeWorkflowTaskCounts();
  }

  protected onUnmount(): void {
    this.countsSubscription?.unsubscribe();
    this.countsSubscription = undefined;
    super.onUnmount();
  }

  async onClick(event?: unknown) {
    if (this.context.isMobileLayout) {
      await this.dispatchEvent(
        'click',
        {
          event,
          isMobileLayout: true,
          pageModelClass: WORKFLOW_TASKS_EMBEDDED_PAGE_MODEL,
        },
        {
          debounce: true,
        },
      );
      return;
    }

    this.context.router.navigate(getWorkflowTasksPath());
  }

  private syncOpenViewStepParams() {
    const params = this.getStepParams('popupSettings', 'openView') || {};
    this.setStepParams('popupSettings', 'openView', {
      ...params,
      mode: 'embed',
      pageModelClass: WORKFLOW_TASKS_EMBEDDED_PAGE_MODEL,
    });
  }

  private subscribeWorkflowTaskCounts() {
    this.countsSubscription?.unsubscribe();
    const ctx = this.context as WorkflowTaskFlowContext | undefined;
    const taskTypes = getWorkflowTaskRegistry(ctx);
    this.countsSubscription = subscribeWorkflowTaskCounts(ctx, taskTypes, ({ total }) => {
      this.actionPanelBadge = total > 0 ? { count: total, overflowCount: 99 } : null;
    });
  }
}

WorkflowTasksEntryActionModel.define({
  label: tExpr('Workflow todos'),
});

WorkflowTasksEntryActionModel.registerFlow(openViewFlow);

export default WorkflowTasksEntryActionModel;
