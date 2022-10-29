import React, { useEffect } from 'react';
import { Tag } from 'antd';
import { cx } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  useCompile,
  useDocumentTitle,
  useResourceActionContext,
} from '@nocobase/client';
import { str2moment } from '@nocobase/utils/client';

import { FlowContext } from './FlowContext';
import { branchBlockClass, nodeCardClass, nodeMetaClass } from './style';
import { TriggerConfig } from './triggers';
import { Branch } from './Branch';
import { ExecutionStatusOptionsMap } from './constants';




function makeNodes(nodes, jobs = []): void {
  const nodesMap = new Map();
  nodes.forEach(item => nodesMap.set(item.id, item));
  const jobsMap = new Map();
  jobs.forEach(item => jobsMap.set(item.nodeId, item));
  for (let node of nodesMap.values()) {
    if (node.upstreamId) {
      node.upstream = nodesMap.get(node.upstreamId);
    }

    if (node.downstreamId) {
      node.downstream = nodesMap.get(node.downstreamId);
    }

    if (jobsMap.has(node.id)) {
      node.job = jobsMap.get(node.id);
    }
  }
}

export function ExecutionCanvas() {
  const { t } = useTranslation();
  const compile = useCompile();
  const { data, refresh, loading } = useResourceActionContext();
  const { setTitle } = useDocumentTitle();
  useEffect(() => {
    const { workflow } = data?.data ?? {};
    setTitle(`${workflow?.title ? `${workflow.title} - ` : ''}${t('Execution history')}`);
  }, [data?.data]);

  if (!data?.data) {
    if (loading) {
      return <div>{t('Loading')}</div>
    } else {
      return <div>{t('Load failed')}</div>;
    }
  }

  const {
    jobs = [],
    workflow: { nodes = [], revisions = [], ...workflow } = {},
    ...execution
  } = data?.data ?? {};

  makeNodes(nodes, jobs);

  const entry = nodes.find(item => !item.upstream);

  const statusOption = ExecutionStatusOptionsMap[execution.status];

  return (
    <FlowContext.Provider value={{
      workflow: workflow.type ? workflow : null,
      nodes,
      execution
    }}>
      <div className="workflow-toolbar">
        <header>
          <span>
            <Link to={`/admin/settings/workflow/workflows`}>
              {t('Workflow')}
            </Link>
          </span>
          <span>
            <Link to={`/admin/settings/workflow/workflows/${workflow.id}`}>
              {workflow.title}
            </Link>
          </span>
          <strong>{`#${execution.id}`}</strong>
        </header>
        <aside>
          <Tag color={statusOption.color}>{compile(statusOption.label)}</Tag>
          <time>{str2moment(execution.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</time>
        </aside>
      </div>
      <div className="workflow-canvas">
        <TriggerConfig workflow={workflow} />
        <div className={branchBlockClass}>
          <Branch entry={entry} />
        </div>
        <div className={cx(nodeCardClass)}>
          <div className={cx(nodeMetaClass)}>
            <Tag color="#333">{t('End')}</Tag>
          </div>
        </div>
      </div>
    </FlowContext.Provider>
  );
}
