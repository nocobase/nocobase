/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Breadcrumb, Button, Dropdown, message, Modal, Result, Space, Spin, Tag, Tooltip } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  ActionContextProvider,
  cx,
  Input,
  SchemaComponent,
  useAPIClient,
  useApp,
  useCompile,
  useDocumentTitle,
  usePlugin,
  useRequest,
  useResourceActionContext,
} from '@nocobase/client';
import { str2moment } from '@nocobase/utils/client';

import { DownOutlined, ExclamationCircleFilled, StopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import WorkflowPlugin from '.';
import { CanvasContent } from './CanvasContent';
import { StatusButton } from './components/StatusButton';
import { ExecutionStatusOptionsMap, JobStatusOptions } from './constants';
import { FlowContext, useFlowContext } from './FlowContext';
import { lang, NAMESPACE } from './locale';
import useStyles from './style';
import { getWorkflowDetailPath, getWorkflowExecutionsPath, linkNodes } from './utils';
import { get } from 'lodash';

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
      key: node.key,
      title: node.title,
      type: node.type,
    };
  });
  nodes.forEach((item) => {
    item.jobs = item.jobs.sort((a, b) => a.id - b.id);
  });
}

function JobResult(props) {
  const { viewJob } = useFlowContext();
  const { data, loading } = useRequest({
    resource: 'jobs',
    action: 'get',
    params: {
      filterByTk: viewJob.id,
    },
  });

  if (loading) {
    return <Spin />;
  }
  const result = get(data, 'data.result');
  return <Input.JSON {...props} value={result} disabled />;
}

function JobModal() {
  const { instructions } = usePlugin(WorkflowPlugin);
  const compile = useCompile();
  const { viewJob: job, setViewJob } = useFlowContext();
  const { styles } = useStyles();

  const { node = {} } = job ?? {};
  const instruction = instructions.get(node.type);

  return (
    <ActionContextProvider value={{ visible: Boolean(job), setVisible: setViewJob }}>
      <SchemaComponent
        components={{
          JobResult,
        }}
        schema={{
          type: 'void',
          properties: {
            [`${job?.id}-${job?.updatedAt}-modal`]: {
              type: 'void',
              'x-decorator': 'Form',
              'x-decorator-props': {
                initialValue: job,
              },
              'x-component': 'Action.Modal',
              title: (
                <div className={styles.nodeTitleClass}>
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
                  'x-component': 'JobResult',
                  'x-component-props': {
                    className: styles.nodeJobResultClass,
                    autoSize: {
                      minRows: 4,
                      maxRows: 32,
                    },
                  },
                },
              },
            },
          },
        }}
      />
    </ActionContextProvider>
  );
}

function ExecutionsDropdown(props) {
  const { execution } = useFlowContext();
  const apiClient = useAPIClient();
  const navigate = useNavigate();
  const { styles } = useStyles();
  const [executionsBefore, setExecutionsBefore] = useState([]);
  const [executionsAfter, setExecutionsAfter] = useState([]);

  useEffect(() => {
    if (!execution) {
      return;
    }
    apiClient
      .resource('executions')
      .list({
        filter: {
          key: execution.key,
          id: {
            $lt: execution.id,
          },
        },
        sort: '-createdAt',
        pageSize: 10,
        fields: ['id', 'status', 'createdAt'],
      })
      .then(({ data }) => {
        setExecutionsBefore(data.data);
      })
      .catch(() => {});
  }, [execution.id]);

  useEffect(() => {
    if (!execution) {
      return;
    }
    apiClient
      .resource('executions')
      .list({
        filter: {
          key: execution.key,
          id: {
            $gt: execution.id,
          },
        },
        sort: 'createdAt',
        pageSize: 10,
        fields: ['id', 'status', 'createdAt'],
      })
      .then(({ data }) => {
        setExecutionsAfter(data.data.reverse());
      })
      .catch(() => {});
  }, [execution.id]);

  const onClick = useCallback(
    ({ key }) => {
      if (key != execution.id) {
        navigate(getWorkflowExecutionsPath(key));
      }
    },
    [execution.id],
  );

  return execution ? (
    <Dropdown
      menu={{
        onClick,
        defaultSelectedKeys: [`${execution.id}`],
        className: cx(styles.dropdownClass, styles.executionsDropdownRowClass),
        items: [...executionsAfter, execution, ...executionsBefore].map((item) => {
          return {
            key: item.id,
            label: (
              <>
                <span className="id">{`#${item.id}`}</span>
                <time>{str2moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}</time>
              </>
            ),
            icon: (
              <span>
                <StatusButton statusMap={ExecutionStatusOptionsMap} status={item.status} />
              </span>
            ),
          };
        }),
      }}
    >
      <Space>
        <strong>{`#${execution.id}`}</strong>
        <DownOutlined />
      </Space>
    </Dropdown>
  ) : null;
}

export function ExecutionCanvas() {
  const { t } = useTranslation();
  const compile = useCompile();
  const { data, loading, refresh } = useResourceActionContext();
  const { setTitle } = useDocumentTitle();
  const [viewJob, setViewJob] = useState(null);
  const app = useApp();
  const apiClient = useAPIClient();
  useEffect(() => {
    const { workflow } = data?.data ?? {};
    setTitle?.(`${workflow?.title ? `${workflow.title} - ` : ''}${lang('Execution history')}`);
  }, [data?.data, setTitle]);

  const onCancel = useCallback(() => {
    Modal.confirm({
      title: lang('Cancel the execution'),
      icon: <ExclamationCircleFilled />,
      content: lang('Are you sure you want to cancel the execution?'),
      onOk: () => {
        apiClient
          .resource('executions')
          .cancel({
            filterByTk: data?.data.id,
          })
          .then(() => {
            message.success(t('Operation succeeded'));
            refresh();
          })
          .catch((response) => {
            console.error(response.data.error);
          });
      },
    });
  }, [data?.data]);

  if (!data?.data) {
    if (loading) {
      return <Spin />;
    }
    return <Result status="404" title="Not found" />;
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
        setViewJob,
      }}
    >
      <div className="workflow-toolbar">
        <header>
          <Breadcrumb
            items={[
              { title: <Link to={app.pluginSettingsManager.getRoutePath('workflow')}>{lang('Workflow')}</Link> },
              {
                title: (
                  <Tooltip title={`Key: ${workflow.key}`}>
                    <Link to={getWorkflowDetailPath(workflow.id)}>{workflow.title}</Link>
                  </Tooltip>
                ),
              },
              { title: <ExecutionsDropdown /> },
            ]}
          />
        </header>
        <aside>
          <Tag color={statusOption.color}>{compile(statusOption.label)}</Tag>
          {execution.status ? null : (
            <Tooltip title={lang('Cancel the execution')}>
              <Button type="link" danger onClick={onCancel} shape="circle" size="small" icon={<StopOutlined />} />
            </Tooltip>
          )}
          <time>{str2moment(execution.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</time>
        </aside>
      </div>
      <CanvasContent entry={entry} />
      <JobModal />
    </FlowContext.Provider>
  );
}
