import {
  ActionContextProvider,
  cx,
  SchemaComponent,
  useAPIClient,
  useApp,
  useCompile,
  useDocumentTitle,
  useResourceActionContext,
} from '@nocobase/client';
import { str2moment } from '@nocobase/utils/client';
import { Breadcrumb, Dropdown, Space, Tag } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CanvasContent } from './CanvasContent';
import { ExecutionStatusOptionsMap, JobStatusOptions } from './constants';
import { FlowContext, useFlowContext } from './FlowContext';
import { lang, NAMESPACE } from './locale';
import { instructions } from './nodes';
import useStyles from './style';
import { linkNodes } from './utils';
import { DownOutlined } from '@ant-design/icons';
import { StatusButton } from './components/StatusButton';
import { getWorkflowDetailPath, getWorkflowExecutionsPath } from './constant';

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

function JobModal() {
  const compile = useCompile();
  const { viewJob: job, setViewJob } = useFlowContext();
  const { styles } = useStyles();

  const { node = {} } = job ?? {};
  const instruction = instructions.get(node.type);

  return (
    <ActionContextProvider value={{ visible: Boolean(job), setVisible: setViewJob }}>
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
                  'x-component': 'Input.JSON',
                  'x-component-props': {
                    className: styles.nodeJobResultClass,
                  },
                  'x-read-pretty': true,
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
  }, [execution]);

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
  }, [execution]);

  const onClick = useCallback(
    ({ key }) => {
      if (key != execution.id) {
        navigate(getWorkflowExecutionsPath(key));
      }
    },
    [execution],
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
  const compile = useCompile();
  const { data, loading } = useResourceActionContext();
  const { setTitle } = useDocumentTitle();
  const [viewJob, setViewJob] = useState(null);
  const app = useApp();
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
        setViewJob,
      }}
    >
      <div className="workflow-toolbar">
        <header>
          <Breadcrumb
            items={[
              { title: <Link to={app.pluginSettingsManager.getRoutePath('workflow')}>{lang('Workflow')}</Link> },
              { title: <Link to={getWorkflowDetailPath(workflow.id)}>{workflow.title}</Link> },
              { title: <ExecutionsDropdown /> },
            ]}
          />
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
