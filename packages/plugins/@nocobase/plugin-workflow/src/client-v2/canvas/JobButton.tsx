/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo } from 'react';
import { Button, Dropdown, Tag, Tooltip } from 'antd';
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ExclamationOutlined,
  MinusOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { useFlowContext } from './contexts';
import useStyles from './style';
import { useT } from '../locale';
import { formatTime } from '../components/workflowCanvas';

const JOB_STATUS = {
  PENDING: 0,
  RESOLVED: 1,
  FAILED: -1,
  ERROR: -2,
  ABORTED: -3,
  CANCELED: -4,
  REJECTED: -5,
  RETRY_NEEDED: -6,
} as const;

const JOB_STATUS_OPTIONS_MAP: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  [JOB_STATUS.PENDING]: { label: 'Pending', color: 'gold', icon: <ClockCircleOutlined /> },
  [JOB_STATUS.RESOLVED]: { label: 'Resolved', color: 'green', icon: <CheckOutlined /> },
  [JOB_STATUS.FAILED]: { label: 'Failed', color: 'red', icon: <ExclamationOutlined /> },
  [JOB_STATUS.ERROR]: { label: 'Error', color: 'red', icon: <CloseOutlined /> },
  [JOB_STATUS.ABORTED]: { label: 'Aborted', color: 'red', icon: <MinusOutlined rotate={90} /> },
  [JOB_STATUS.CANCELED]: { label: 'Canceled', color: 'volcano', icon: <MinusOutlined rotate={45} /> },
  [JOB_STATUS.REJECTED]: { label: 'Rejected', color: 'volcano', icon: <MinusOutlined /> },
  [JOB_STATUS.RETRY_NEEDED]: { label: 'Retry needed', color: 'volcano', icon: <RedoOutlined /> },
};

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

const emptyStatusButtonClass = css`
  border-width: 2px;
`;

function JobStatusButton({
  status,
  disabled,
  onClick,
  onMouseDown,
  className,
}: {
  status?: number | null;
  disabled?: boolean;
  onClick?: () => void;
  onMouseDown?: React.MouseEventHandler<HTMLElement>;
  className?: string;
}) {
  const t = useT();
  const { styles, cx } = useStyles();
  const option = typeof status !== 'undefined' && status !== null ? JOB_STATUS_OPTIONS_MAP[status] : undefined;
  const content = option ? <Tag color={option.color}>{option.icon}</Tag> : null;
  const button = (
    <Button
      shape="circle"
      size="small"
      disabled={disabled}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className={cx(styles.nodeJobButtonClass, className, content ? statusButtonClass : emptyStatusButtonClass)}
    >
      {content}
    </Button>
  );

  return option ? <Tooltip title={t(option.label)}>{button}</Tooltip> : button;
}

export function JobButton({ data }: { data: any }) {
  const t = useT();
  const { styles } = useStyles();
  const { execution, setViewJob } = useFlowContext() ?? {};
  const jobs = useMemo(() => data?.jobs ?? [], [data?.jobs]);
  const stopPropagation = useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  const onOpenJobInList = useCallback(
    ({ key }: { key: string }) => {
      const job = jobs.find((item: any) => String(item.id) === String(key));
      if (job) {
        setViewJob?.(job);
      }
    },
    [jobs, setViewJob],
  );

  const onOpenOnlyJob = useCallback(() => {
    const job = jobs?.[0];
    if (job) {
      setViewJob?.(job);
    }
  }, [jobs, setViewJob]);

  if (!execution || !setViewJob) {
    return null;
  }

  if (!jobs?.length) {
    return (
      <span onClick={stopPropagation} onMouseDown={stopPropagation}>
        <Tooltip title={t('View result')}>
          <JobStatusButton disabled onMouseDown={stopPropagation} />
        </Tooltip>
      </span>
    );
  }

  if (jobs.length === 1) {
    return (
      <span onClick={stopPropagation} onMouseDown={stopPropagation}>
        <JobStatusButton status={jobs[0].status} onClick={onOpenOnlyJob} onMouseDown={stopPropagation} />
      </span>
    );
  }

  const latestJob = jobs[jobs.length - 1];

  return (
    <Tooltip title={t('View result')}>
      <Dropdown
        menu={{
          items: jobs.map((job: any) => ({
            key: `${job.id}`,
            label: (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '1.5em',
                  minWidth: '14em',
                }}
              >
                <JobStatusButton
                  status={job.status}
                  className={css`
                    pointer-events: none;
                  `}
                />
                <time>{formatTime(job.updatedAt)}</time>
              </span>
            ),
          })),
          onClick: onOpenJobInList,
          className: styles.dropdownClass,
        }}
      >
        <span onClick={stopPropagation} onMouseDown={stopPropagation}>
          <JobStatusButton status={latestJob.status} onMouseDown={stopPropagation} />
        </span>
      </Dropdown>
    </Tooltip>
  );
}

export default JobButton;
