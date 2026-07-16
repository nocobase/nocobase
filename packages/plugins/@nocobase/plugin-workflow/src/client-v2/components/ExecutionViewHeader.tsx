/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useMemoizedFn } from 'ahooks';
import { App, Breadcrumb, Button, Space, Tag, Tooltip, theme } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  EXECUTION_REASON_OPTIONS_MAP,
  EXECUTION_STATUS,
  EXECUTION_STATUS_OPTIONS_MAP,
} from '../../common/executionStatus';
import { useWorkflowRuntimePaths } from '../hooks/useWorkflowRuntimePaths';
import { useT, useWorkflowTranslation } from '../locale';
import { ExecutionsDropdown } from './ExecutionsDropdown';
import { formatTime } from './workflowCanvas';

const WORKFLOW_HOMEPAGE = '/admin/settings/workflow';

type ExecutionWorkflow = {
  id?: number | string;
  key?: string;
  title?: string;
};

type ExecutionViewRecord = {
  // Optional to accept the loosely-typed page record (a `WorkflowCanvasRecord`,
  // whose `id` is itself optional) without a cast. The header only reads `id`
  // after the page has guarded `data?.id != null`, so it is present at runtime.
  id?: number | string;
  key?: string;
  status?: number | null;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
  workflow?: ExecutionWorkflow;
};

function ExecutionStatus({ execution }: { execution: ExecutionViewRecord }) {
  const compile = useT();
  const option = EXECUTION_STATUS_OPTIONS_MAP[execution.status as number];
  if (!option) {
    return null;
  }
  const reasonOption = execution.reason ? EXECUTION_REASON_OPTIONS_MAP[execution.reason] : undefined;
  return (
    <Tag color={option.color}>
      <Space size={4}>
        {compile(option.label)}
        {execution.reason ? (
          <Tooltip title={compile(reasonOption?.label ?? execution.reason)} placement="bottom">
            <QuestionCircleOutlined />
          </Tooltip>
        ) : null}
      </Space>
    </Tag>
  );
}

export function ExecutionViewHeader({
  execution,
  resource,
  refresh,
}: {
  execution: ExecutionViewRecord;
  resource: any;
  refresh: () => void;
}) {
  const { t } = useWorkflowTranslation();
  const compile = useT();
  const { getWorkflowCanvasPath } = useWorkflowRuntimePaths();
  const { token } = theme.useToken();
  const { modal, message } = App.useApp();
  const workflow = execution.workflow;
  // STARTED (0) / QUEUEING (null) are the in-progress states that can be canceled.
  const cancelable = execution.status === EXECUTION_STATUS.STARTED || execution.status === EXECUTION_STATUS.QUEUEING;

  const onCancel = useMemoizedFn(() => {
    modal.confirm({
      title: t('Cancel the execution'),
      content: t('Are you sure you want to cancel the execution?'),
      async onOk() {
        await resource.cancel({ filterByTk: execution.id });
        message.success(t('Operation succeeded'));
        refresh();
      },
    });
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: token.margin,
        flexWrap: 'wrap',
        padding: `${token.paddingSM}px ${token.padding}px`,
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Breadcrumb
        items={[
          {
            title: <Link to={WORKFLOW_HOMEPAGE}>{t('Workflow')}</Link>,
          },
          {
            title:
              workflow?.id != null ? (
                <Tooltip title={`Key: ${workflow.key}`}>
                  <Link to={getWorkflowCanvasPath(workflow.id)}>{compile(workflow.title || '')}</Link>
                </Tooltip>
              ) : (
                compile(workflow?.title || '')
              ),
          },
          {
            title: (
              <ExecutionsDropdown
                execution={{
                  id: execution.id,
                  key: execution.key,
                  status: execution.status,
                  createdAt: execution.createdAt,
                }}
                refresh={refresh}
              />
            ),
          },
        ]}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
        <ExecutionStatus execution={execution} />
        {cancelable ? (
          <Tooltip title={t('Cancel the execution')}>
            <Button type="link" danger shape="circle" size="small" icon={<StopOutlined />} onClick={onCancel} />
          </Tooltip>
        ) : null}
        <time style={{ opacity: 0.65 }}>{formatTime(execution.updatedAt)}</time>
      </div>
    </div>
  );
}

export default ExecutionViewHeader;
