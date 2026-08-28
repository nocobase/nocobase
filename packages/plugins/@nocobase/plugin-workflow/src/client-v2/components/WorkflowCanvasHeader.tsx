/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Breadcrumb, Tooltip, theme } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import { useT, useWorkflowTranslation } from '../locale';
import type { WorkflowCanvasRecord, WorkflowRevision } from './workflowCanvas';
import { WorkflowEnabledSwitch } from './WorkflowEnabledSwitch';
import { WorkflowMenu } from './WorkflowMenu';
import { WorkflowRevisionsDropdown } from './WorkflowRevisionsDropdown';
import { ExecuteWorkflowButton } from '../triggers/ExecuteWorkflowButton';
import { SyncModeTag } from './SyncModeTag';

const WORKFLOW_HOMEPAGE = '/admin/settings/workflow';

export function WorkflowCanvasHeader({
  record,
  revisions,
  resource,
  refresh,
}: {
  record: WorkflowCanvasRecord;
  revisions: WorkflowRevision[];
  resource: any;
  refresh: () => void;
}) {
  const { t } = useWorkflowTranslation();
  const compile = useT();
  const { token } = theme.useToken();

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
      <div style={{ display: 'flex', alignItems: 'center', gap: token.marginSM }}>
        <Breadcrumb
          items={[
            {
              title: <Link to={WORKFLOW_HOMEPAGE}>{t('Workflow')}</Link>,
            },
            {
              title: (
                <Tooltip title={`Key: ${record.key}`}>
                  <strong>{compile(record.title || '')}</strong>
                </Tooltip>
              ),
            },
          ]}
        />
        <SyncModeTag value={record.sync} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
        <ExecuteWorkflowButton record={record} refresh={refresh} />
        <WorkflowRevisionsDropdown record={record} resource={resource} />
        <WorkflowEnabledSwitch record={record} resource={resource} onChanged={() => refresh()} />
        <WorkflowMenu record={record} revisions={revisions} resource={resource} refresh={refresh} />
      </div>
    </div>
  );
}

export default WorkflowCanvasHeader;
