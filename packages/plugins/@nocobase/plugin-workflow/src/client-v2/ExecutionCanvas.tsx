/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Result } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CanvasContent } from './canvas/CanvasContent';
import { FlowContext } from './canvas/contexts';
import { linkNodes } from './canvas/nodeTree';
import { ExecutionViewHeader } from './components/ExecutionViewHeader';
import { JobResultModal } from './components/JobResultModal';
import { useWorkflowTranslation } from './locale';

function attachJobs(nodes: any[], jobs: any[] = []) {
  const nodesMap = new Map();
  nodes.forEach((item) => {
    item.jobs = [];
    nodesMap.set(item.id, item);
  });
  jobs.forEach((item) => {
    const node = nodesMap.get(item.nodeId);
    if (!node) {
      return;
    }
    node.jobs.push(item);
    item.node = {
      id: node.id,
      key: node.key,
      title: node.title,
      type: node.type,
    };
  });
  nodes.forEach((item) => {
    item.jobs = item.jobs.sort((a, b) => a.id - b.id);
  });
}

export function ExecutionCanvas({ record, resource, refresh }: { record: any; resource: any; refresh: () => void }) {
  const { t } = useWorkflowTranslation();
  const navigate = useNavigate();
  const [viewJob, setViewJob] = useState<any>(null);

  const { jobs = [], workflow, ...execution } = record ?? {};
  const nodes = useMemo(() => {
    const nextNodes = [...(workflow?.nodes ?? [])];
    linkNodes(nextNodes);
    attachJobs(nextNodes, jobs);
    return nextNodes;
  }, [jobs, workflow?.nodes]);

  const entry = useMemo(() => nodes.find((item) => !item.upstream) ?? null, [nodes]);

  useEffect(() => {
    if (!viewJob?.id) {
      return;
    }
    const latest = jobs.find((job) => String(job.id) === String(viewJob.id));
    if (latest) {
      setViewJob(latest);
    }
  }, [jobs, viewJob?.id]);

  const onBack = () => {
    navigate(-1);
  };

  if (!workflow) {
    return (
      <Result
        status="404"
        title={t('Not found')}
        subTitle={t('Workflow of execution is not existed')}
        extra={<Button onClick={onBack}>{t('Go back')}</Button>}
      />
    );
  }

  return (
    <FlowContext.Provider
      value={{
        workflow: workflow.type ? workflow : null,
        nodes,
        execution,
        viewJob,
        setViewJob,
      }}
    >
      <ExecutionViewHeader execution={record} resource={resource} refresh={refresh} />
      <CanvasContent entry={entry} />
      <JobResultModal />
    </FlowContext.Provider>
  );
}

export default ExecutionCanvas;
