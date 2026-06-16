/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EllipsisOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { App, Button, Dropdown } from 'antd';
import React, { useState } from 'react';
import { useWorkflowRuntimePaths } from '../hooks/useWorkflowRuntimePaths';
import { useWorkflowTranslation } from '../locale';
import { ExecutionHistoryDrawer } from '../pages/ExecutionHistoryDrawer';
import { WorkflowDetailsModal } from './WorkflowDetailsModal';
import { normalizeRecordResponse, type WorkflowCanvasRecord, type WorkflowRevision } from './workflowCanvas';

const WORKFLOW_HOMEPAGE = '/admin/settings/workflow';

export function WorkflowMenu({
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
  const ctx = useFlowContext();
  const { getWorkflowCanvasPath } = useWorkflowRuntimePaths();
  const { modal, message } = App.useApp();
  const [detailsVisible, setDetailsVisible] = useState(false);

  const anyExecuted = Number(record.stats?.executed || 0) > 0;

  const openExecutions = useMemoizedFn(() => {
    ctx.viewer.drawer({
      width: '60%',
      closable: true,
      title: t('Execution history'),
      content: () => <ExecutionHistoryDrawer workflowKey={record.key} />,
    });
  });

  const onRevision = useMemoizedFn(async () => {
    const response = await resource.revision({ filterByTk: record.id, filter: { key: record.key } });
    const revision = normalizeRecordResponse(response);
    message.success(t('Operation succeeded'));
    if (revision?.id != null) {
      ctx.router.navigate(getWorkflowCanvasPath(revision.id));
    }
  });

  const onDelete = useMemoizedFn(() => {
    const content = record.current
      ? t('Delete a main version will cause all other revisions to be deleted too.')
      : t('Current version will be deleted (without affecting other versions).');
    modal.confirm({
      title: t('Are you sure you want to delete it?'),
      content,
      async onOk() {
        await resource.destroy({ filterByTk: record.id });
        message.success(t('Operation succeeded'));
        if (record.current) {
          ctx.router.navigate(WORKFLOW_HOMEPAGE);
          return;
        }
        const fallback = revisions.find((item) => item.current);
        ctx.router.navigate(fallback?.id != null ? getWorkflowCanvasPath(fallback.id) : WORKFLOW_HOMEPAGE);
      },
    });
  });

  const onMenuClick = useMemoizedFn(({ key }: { key: string }) => {
    switch (key) {
      case 'details':
        setDetailsVisible(true);
        return;
      case 'refresh':
        refresh();
        return;
      case 'history':
        openExecutions();
        return;
      case 'revision':
        onRevision();
        return;
      case 'delete':
        onDelete();
        return;
      default:
        break;
    }
  });

  return (
    <>
      <Dropdown
        menu={{
          onClick: onMenuClick,
          items: [
            { key: 'details', label: t('Details') },
            { type: 'divider' },
            { key: 'refresh', label: t('Refresh') },
            { key: 'history', label: t('Execution history'), disabled: !anyExecuted },
            { key: 'revision', label: t('Copy to new version') },
            { type: 'divider' },
            { key: 'delete', label: t('Delete'), danger: true },
          ],
        }}
      >
        <Button aria-label="more" type="text" icon={<EllipsisOutlined />} />
      </Dropdown>
      <WorkflowDetailsModal record={record} open={detailsVisible} onClose={() => setDetailsVisible(false)} />
    </>
  );
}

export default WorkflowMenu;
