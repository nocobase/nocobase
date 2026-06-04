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
import React from 'react';
import { useParams } from 'react-router-dom';
import { ExecutionViewHeader } from '../components/ExecutionViewHeader';
import { normalizeRecordResponse } from '../components/workflowCanvas';
import { useWorkflowTranslation } from '../locale';

export default function ExecutionViewPage() {
  const { t } = useWorkflowTranslation();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const params = useParams<{ id?: string }>();
  const executionId = params.id;
  const resource = ctx.api.resource('executions');

  const { data, refresh } = useRequest(
    async () => {
      if (!executionId) {
        return null;
      }
      const response = await resource.get({
        filterByTk: executionId,
        appends: ['workflow'],
        except: ['context', 'output', 'stack', 'workflow.config', 'workflow.options'],
      });
      return normalizeRecordResponse(response);
    },
    { refreshDeps: [executionId] },
  );

  const record = data?.id != null && String(data.id) === String(executionId) ? data : null;

  if (!executionId) {
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
      <ExecutionViewHeader execution={record} resource={resource} refresh={refresh} />
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
