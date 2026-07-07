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
import {
  getAvailableWorkflowTaskTypeKeys,
  getWorkflowTaskRegistry,
  getWorkflowTaskTypeKeys,
  subscribeWorkflowTaskCounts,
  TASK_STATUS,
  type WorkflowTaskCounts,
  type WorkflowTaskFlowContext,
} from '../taskCenter';
import { buildWorkflowTasksEmbeddedPath } from '../pages/workflowTasksEmbeddedRoute';

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
  private workflowTaskCounts: WorkflowTaskCounts = {};

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
      const embeddedPath = await this.getWorkflowTasksEmbeddedPath();
      if (embeddedPath) {
        this.context.router.navigate(embeddedPath);
        return;
      }

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

  private async getWorkflowTasksEmbeddedPath() {
    const ctx = this.context as WorkflowTaskFlowContext | undefined;
    const taskTypes = getWorkflowTaskRegistry(ctx);
    let defaultTaskType = this.getDefaultWorkflowTaskType(taskTypes);

    if (!getAvailableWorkflowTaskTypeKeys(taskTypes, this.workflowTaskCounts).length) {
      this.ensureWorkflowTaskCountsSubscription();
      await this.countsSubscription?.reload().catch((error) => {
        console.error('Failed to load workflow task counts', error);
      });
      defaultTaskType = this.getDefaultWorkflowTaskType(taskTypes);
    }

    if (!defaultTaskType || !this.uid) {
      return null;
    }

    const location = this.getCurrentLocation();
    if (!location.pathname) {
      return null;
    }

    const basePathname = this.ensureCurrentViewPathname(location.pathname);
    const pathname = buildWorkflowTasksEmbeddedPath({
      pathname: basePathname,
      viewUid: this.uid,
      route: {
        taskType: defaultTaskType,
        status: TASK_STATUS.PENDING,
      },
    });

    return `${pathname}${location.search}${location.hash}`;
  }

  private getDefaultWorkflowTaskType(taskTypes: ReturnType<typeof getWorkflowTaskRegistry>) {
    return (
      getAvailableWorkflowTaskTypeKeys(taskTypes, this.workflowTaskCounts)[0] ?? getWorkflowTaskTypeKeys(taskTypes)[0]
    );
  }

  private ensureWorkflowTaskCountsSubscription() {
    if (!this.countsSubscription) {
      this.subscribeWorkflowTaskCounts();
    }
  }

  private getCurrentLocation() {
    const contextLocation = (this.context as { location?: { pathname?: string; search?: string; hash?: string } })
      .location;
    const contextRoute = (this.context as { route?: { pathname?: string; search?: string; hash?: string } }).route;
    const windowLocation = typeof window === 'undefined' ? undefined : window.location;

    return {
      pathname: contextLocation?.pathname || contextRoute?.pathname || windowLocation?.pathname || '',
      search: contextLocation?.search || contextRoute?.search || windowLocation?.search || '',
      hash: contextLocation?.hash || contextRoute?.hash || windowLocation?.hash || '',
    };
  }

  private ensureCurrentViewPathname(pathname: string) {
    const segments = pathname.replace(/^\/+/, '').replace(/\/+$/, '').split('/').filter(Boolean);
    const hasCurrentView = segments.some((segment, index) => {
      if (index === 0 || segments[index - 1] !== 'view') {
        return false;
      }
      try {
        return decodeURIComponent(segment) === this.uid;
      } catch {
        return segment === this.uid;
      }
    });

    if (hasCurrentView) {
      return pathname;
    }

    return `${pathname.replace(/\/+$/, '')}/view/${encodeURIComponent(this.uid)}`;
  }

  private subscribeWorkflowTaskCounts() {
    this.countsSubscription?.unsubscribe();
    const ctx = this.context as WorkflowTaskFlowContext | undefined;
    const taskTypes = getWorkflowTaskRegistry(ctx);
    this.countsSubscription = subscribeWorkflowTaskCounts(ctx, taskTypes, ({ counts, total }) => {
      this.workflowTaskCounts = counts;
      this.actionPanelBadge = total > 0 ? { count: total, overflowCount: 99 } : null;
    });
  }
}

WorkflowTasksEntryActionModel.define({
  label: tExpr('Workflow todos'),
});

WorkflowTasksEntryActionModel.registerFlow(openViewFlow);

export default WorkflowTasksEntryActionModel;
