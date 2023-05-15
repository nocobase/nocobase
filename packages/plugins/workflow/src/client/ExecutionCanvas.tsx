import React, { useEffect, useState } from 'react';
import { Tag, Breadcrumb } from 'antd';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';

import {
  ActionContext,
  SchemaComponent,
  useCompile,
  useDocumentTitle,
  useResourceActionContext,
} from '@nocobase/client';
import { str2moment } from '@nocobase/utils/client';

import { FlowContext, useFlowContext } from './FlowContext';
import { nodeTitleClass } from './style';
import { ExecutionStatusOptionsMap, JobStatusOptions } from './constants';
import { lang, NAMESPACE } from './locale';
import { linkNodes } from './utils';
import { instructions } from './nodes';
import { CanvasContent } from './CanvasContent';

function attachJobs(nodes, jobs: any[] = []): void {
  const nodesMap = new Map();
  nodes.forEach((item) => {
    item.jobs = [];
    nodesMap.set(item.id, item);
  });
  jobs.forEach((item) => {
    const node = nodesMap.get(item.nodeId);
    node.jobs.push(item);
    item.node = {
      id: node.id,
      title: node.title,
      type: node.type,
    };
  });
  nodes.forEach((item) => {
    item.jobs = item.jobs.sort((a, b) => a.id - b.id);
  });
}

function JobModal() {
  const compile = useCompile();
  const { viewJob: job, setViewJob } = useFlowContext();
  const { node = {} } = job ?? {};
  const instruction = instructions.get(node.type);

  return (
    <ActionContext.Provider value={{ visible: Boolean(job), setVisible: setViewJob }}>
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            [`${job?.id}-modal`]: {
              type: 'void',
              'x-decorator': 'Form',
              'x-decorator-props': {
                initialValue: job,
              },
              'x-component': 'Action.Modal',
              title: (
                <div className={nodeTitleClass}>
                  <Tag>{compile(instruction?.title)}</Tag>
                  <strong>{node.title}</strong>
                  <span className="workflow-node-id">#{node.id}</span>
                </div>
              ),
              properties: {
                status: {
                  type: 'number',
                  title: `{{t("Status", { ns: "${NAMESPACE}" })}}`,
                  'x-decorator': 'FormItem',
                  'x-component': 'Select',
                  enum: JobStatusOptions,
                  'x-read-pretty': true,
                },
                updatedAt: {
                  type: 'string',
                  title: `{{t("Executed at", { ns: "${NAMESPACE}" })}}`,
                  'x-decorator': 'FormItem',
                  'x-component': 'DatePicker',
                  'x-component-props': {
                    showTime: true,
                  },
                  'x-read-pretty': true,
                },
                result: {
                  type: 'object',
                  title: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.JSON',
                  'x-component-props': {
                    className: css`
                      padding: 1em;
                      background-color: #eee;
                    `,
                  },
                  'x-read-pretty': true,
                },
              },
            },
          },
        }}
      />
    </ActionContext.Provider>
  );
}

export function ExecutionCanvas() {
  const compile = useCompile();
  const { data, loading } = useResourceActionContext();
  const { setTitle } = useDocumentTitle();
  const [viewJob, setViewJob] = useState(null);
  useEffect(() => {
    const { workflow } = data?.data ?? {};
    setTitle?.(`${workflow?.title ? `${workflow.title} - ` : ''}${lang('Execution history')}`);
  }, [data?.data]);

  if (!data?.data) {
    if (loading) {
      return <div>{lang('Loading')}</div>;
    } else {
      return <div>{lang('Load failed')}</div>;
    }
  }

  const { jobs = [], workflow: { nodes = [], revisions = [], ...workflow } = {}, ...execution } = data?.data ?? {};

  linkNodes(nodes);
  attachJobs(nodes, jobs);

  const entry = nodes.find((item) => !item.upstream);

  const statusOption = ExecutionStatusOptionsMap[execution.status];

  return (
    <FlowContext.Provider
      value={{
        workflow: workflow.type ? workflow : null,
        nodes,
        execution,
        viewJob,
        setViewJob
      }}
    >
      <div className="workflow-toolbar">
        <header>
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to={`/admin/settings/workflow/workflows`}>{lang('Workflow')}</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to={`/admin/settings/workflow/workflows/${workflow.id}`}>{workflow.title}</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <strong>{`#${execution.id}`}</strong>
            </Breadcrumb.Item>
          </Breadcrumb>
        </header>
        <aside>
          <Tag color={statusOption.color}>{compile(statusOption.label)}</Tag>
          <time>{str2moment(execution.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</time>
        </aside>
      </div>
      <CanvasContent entry={entry} />
      <JobModal />
    </FlowContext.Provider>
  );
}
