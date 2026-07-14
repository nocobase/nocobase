/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckCircleOutlined } from '@ant-design/icons';
import { TopbarActionModel, useMobileLayout } from '@nocobase/client-v2';
import { observer, useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Badge, Button, ConfigProvider, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { getWorkflowTasksPath } from '../constants';
import { tExpr } from '../locale';
import {
  getAvailableWorkflowTaskTypeKeys,
  getWorkflowTaskRegistry,
  useWorkflowTaskCounts,
  type WorkflowTaskFlowContext,
} from '../taskCenter';

const workflowTasksBadgeTheme = {
  components: {
    Badge: {
      indicatorHeightSM: 10,
      textFontSizeSM: 8,
    },
  },
};

const WorkflowTasksTopbarAction = observer(
  ({ model }: { model: WorkflowTasksTopbarActionModel }) => {
    const flowEngine = useFlowEngine();
    const ctx = flowEngine.context as WorkflowTaskFlowContext;
    const taskTypes = getWorkflowTaskRegistry(ctx);
    const { counts, total, reload } = useWorkflowTaskCounts(ctx, taskTypes);
    const { isMobileLayout } = useMobileLayout();
    const availableTaskTypeKeys = useMemo(
      () => getAvailableWorkflowTaskTypeKeys(taskTypes, counts),
      [counts, taskTypes],
    );

    const handleClick = useMemoizedFn(() => {
      reload().catch((error) => {
        console.error('Failed to reload workflow task counts', error);
      });
      model.context.router.navigate(getWorkflowTasksPath());
    });

    if (isMobileLayout || !availableTaskTypeKeys.length) {
      return null;
    }

    return (
      <Tooltip title={model.context.t(model.tooltip)}>
        <Button type="text" onClick={handleClick} data-testid={model.getTestId()}>
          <ConfigProvider theme={workflowTasksBadgeTheme}>
            <Badge count={total} size="small">
              <CheckCircleOutlined />
            </Badge>
          </ConfigProvider>
        </Button>
      </Tooltip>
    );
  },
  { displayName: 'WorkflowTasksTopbarAction' },
);

export class WorkflowTasksTopbarActionModel extends TopbarActionModel {
  sort = 250;
  actionId = 'workflow-tasks';
  testId = 'workflow-tasks-button';
  tooltip = tExpr('Workflow todos');

  render() {
    return <WorkflowTasksTopbarAction model={this} />;
  }
}

export default WorkflowTasksTopbarActionModel;
