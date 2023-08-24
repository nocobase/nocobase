import { useCompile, useRecord } from '@nocobase/client';
import { Tag } from 'antd';
import React from 'react';
import { EXECUTION_STATUS, ExecutionStatusOptionsMap } from '../constants';

function JobInfo() {
  const { lastJob, status } = useRecord();
  return status < EXECUTION_STATUS.STARTED && lastJob ? (
    <Tag>{`${lastJob.node.title} (#${lastJob.nodeId})`}</Tag>
  ) : null;
}

export function ExecutionStatusColumn() {
  const compile = useCompile();
  const record = useRecord();
  const { label, color, icon } = ExecutionStatusOptionsMap[record.status];
  return (
    <div>
      <Tag color={color}>
        {icon}
        <span>{compile(label)}</span>
      </Tag>
      <JobInfo />
    </div>
  );
}
