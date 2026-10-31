/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { css } from '@emotion/css';
import { Button, Tag } from 'antd';
import { useFlowContext as useFlowEngineContext } from '@nocobase/flow-engine';
import { useFlowContext } from './contexts';
import type { CanvasNode } from './contexts';
import useStyles from './style';
import { formatTime } from '../components/workflowCanvas';
import { JOB_STATUS_OPTIONS_MAP } from '../components/jobStatus';
import { JobHistoryPopover, JobSummary } from '../components/JobHistoryPopover';

const statusButtonClass = css`
  border: none;
  .ant-tag {
    width: 100%;
    height: 100%;
    padding: 0;
    margin-right: 0;
    border-radius: 50%;
    text-align: center;
  }
`;

export function JobButton({ data }: { data: CanvasNode & { jobs?: JobSummary[] } }) {
  const ctx = useFlowEngineContext();
  const { styles, cx } = useStyles();
  const { execution, setViewJob } = useFlowContext() ?? {};
  const latestJob = data?.jobs?.[data.jobs.length - 1];
  if (!execution || !setViewJob) {
    return null;
  }
  const status = latestJob ? JOB_STATUS_OPTIONS_MAP[latestJob.status] : undefined;
  if (!latestJob) {
    return <Button shape="circle" size="small" disabled className={styles.nodeJobButtonClass} />;
  }
  return (
    <JobHistoryPopover
      key={`${execution.id}:${latestJob.nodeId}:${latestJob.id}:${latestJob.updatedAt}:${execution.updatedAt}`}
      menuClassName={styles.dropdownClass}
      loadPage={async (cursor) => {
        const response = await ctx.api.resource('executions.jobs', execution.id).list({
          nodeId: latestJob.nodeId,
          ...cursor,
        });
        return response.data.data;
      }}
      onSelect={(job) =>
        setViewJob({ ...job, node: { id: data.id, key: data.key, title: data.title, type: data.type } })
      }
      renderJob={(job) => {
        const option = JOB_STATUS_OPTIONS_MAP[job.status];
        return (
          <span
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '1.5em',
              minWidth: '14em',
            }}
          >
            <Button
              shape="circle"
              size="small"
              tabIndex={-1}
              aria-hidden
              style={{ pointerEvents: 'none' }}
              className={statusButtonClass}
            >
              <Tag color={option?.color}>{option?.icon}</Tag>
            </Button>
            <time>{formatTime(job.updatedAt)}</time>
          </span>
        );
      }}
    >
      <Button shape="circle" size="small" className={cx(styles.nodeJobButtonClass, statusButtonClass)}>
        <Tag color={status?.color}>{status?.icon}</Tag>
      </Button>
    </JobHistoryPopover>
  );
}

export default JobButton;
