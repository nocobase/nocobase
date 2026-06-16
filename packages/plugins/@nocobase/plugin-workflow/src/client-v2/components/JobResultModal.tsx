/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext as useFlowEngineContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Input, Modal, Space, Spin, Tag } from 'antd';
import React from 'react';
import { useT } from '../locale';
import { useInstruction } from '../canvas/useWorkflowInstruction';
import { useFlowContext } from '../canvas/contexts';
import { formatTime } from './workflowCanvas';
import { JobStatusTag } from './jobStatus';
import useStyles from '../canvas/style';

function JobResult({ jobId }: { jobId: string | number }) {
  const ctx = useFlowEngineContext();
  const t = useT();
  const { styles } = useStyles();
  const { data, loading } = useRequest(async () => {
    const response = await ctx.api.resource('jobs').get({ filterByTk: jobId });
    return response?.data?.data ?? null;
  });

  if (loading) {
    return <Spin />;
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('Status')}:</div>
        <JobStatusTag value={data?.status ?? null} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('Executed at')}:</div>
        <div>{formatTime(data?.updatedAt)}</div>
      </div>
      <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('Node result')}:</div>
      <Input.TextArea
        value={JSON.stringify(data?.result ?? null, null, 2)}
        disabled
        autoSize={{ minRows: 4, maxRows: 20 }}
        className={styles.nodeJobResultClass}
        style={{ whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '80%' }}
      />
      {data?.log ? (
        <>
          <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 500 }}>{t('Log')}</div>
          <Input.TextArea
            value={data.log}
            disabled
            autoSize={{ minRows: 4, maxRows: 20 }}
            style={{ whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '80%' }}
          />
        </>
      ) : null}
    </>
  );
}

export function JobResultModal() {
  const { viewJob, setViewJob } = useFlowContext() ?? {};
  const t = useT();
  const instruction = useInstruction(viewJob?.node?.type);
  const { styles } = useStyles();

  return (
    <Modal
      open={Boolean(viewJob)}
      onCancel={() => setViewJob?.(null)}
      footer={null}
      width={980}
      title={
        <div className={styles.nodeTitleClass}>
          <Tag>{instruction ? t(instruction.title as string) : viewJob?.node?.type}</Tag>
          <strong>{viewJob?.node?.title}</strong>
        </div>
      }
      destroyOnClose
      modalRender={(node) => (
        <div onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
          {node}
        </div>
      )}
    >
      {viewJob?.id != null ? <JobResult jobId={viewJob.id} /> : null}
    </Modal>
  );
}

export default JobResultModal;
