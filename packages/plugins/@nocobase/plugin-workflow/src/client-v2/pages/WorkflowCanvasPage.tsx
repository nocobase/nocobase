/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Empty, Spin, theme } from 'antd';
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { WorkflowCanvasHeader } from '../components/WorkflowCanvasHeader';
import { normalizeRecordResponse, type WorkflowRevision } from '../components/workflowCanvas';
import { useWorkflowTranslation } from '../locale';

export default function WorkflowCanvasPage() {
  const { t } = useWorkflowTranslation();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const params = useParams<{ id?: string }>();
  const workflowId = params.id;
  const resource = ctx.api.resource('workflows');

  const { data, refresh } = useRequest(
    async () => {
      if (!workflowId) {
        return null;
      }
      const response = await resource.get({
        filterByTk: workflowId,
        except: ['config'],
        appends: ['stats', 'versionStats', 'createdBy', 'updatedBy'],
      });
      return normalizeRecordResponse(response);
    },
    { refreshDeps: [workflowId] },
  );

  // Revisions feed the "delete" fallback target (jump to the current version
  // after deleting a non-current one).
  const { data: revisionsData } = useRequest(
    async () => {
      if (!data?.key) {
        return [] as WorkflowRevision[];
      }
      const response = await resource.list({
        filter: { key: data.key },
        fields: ['id', 'current', 'enabled'],
        sort: '-id',
      });
      return (response?.data?.data ?? []) as WorkflowRevision[];
    },
    { refreshDeps: [data?.key] },
  );

  const record = data?.id != null && String(data.id) === String(workflowId) ? data : null;
  const revisions = useMemo(() => revisionsData ?? [], [revisionsData]);

  if (!workflowId) {
    return null;
  }

  if (!record) {
    return <Spin />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        minHeight: 0,
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
        background: token.colorBgLayout,
      }}
    >
      <WorkflowCanvasHeader record={record} revisions={revisions} resource={resource} refresh={refresh} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Empty description={t('Workflow canvas editor is being migrated to the new UI.')} />
      </div>
    </div>
  );
}
