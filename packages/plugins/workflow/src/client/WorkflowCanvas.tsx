import React, { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Dropdown, Menu, Button, Tag, Switch, message, Breadcrumb } from 'antd';
import { DownOutlined, RightOutlined, EllipsisOutlined } from '@ant-design/icons';
import { cx } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';

import {
  ActionContext,
  SchemaComponent,
  useDocumentTitle,
  useResourceActionContext,
  useResourceContext
} from '@nocobase/client';

import { FlowContext } from './FlowContext';
import { branchBlockClass, nodeCardClass, nodeMetaClass, workflowVersionDropdownClass } from './style';
import { TriggerConfig } from './triggers';
import { Branch } from './Branch';
import { executionCollection, executionSchema } from './schemas/executions';
import { ExecutionLink } from './ExecutionLink';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';

import { lang, NAMESPACE } from './locale';



function makeNodes(nodes): void {
  const nodesMap = new Map();
  nodes.forEach(item => nodesMap.set(item.id, item));
  for (let node of nodesMap.values()) {
    if (node.upstreamId) {
      node.upstream = nodesMap.get(node.upstreamId);
    }

    if (node.downstreamId) {
      node.downstream = nodesMap.get(node.downstreamId);
    }
  }
}

export function WorkflowCanvas() {
  const history = useHistory();
  const { data, refresh, loading } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { setTitle } = useDocumentTitle();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const { title } = data?.data ?? {};
    setTitle?.(`${lang('Workflow')}${title ? `: ${title}` : ''}`);
  }, [data?.data]);

  if (!data?.data && !loading) {
    return <div>{lang('Load failed')}</div>;
  }

  const { nodes = [], revisions = [], ...workflow } = data?.data ?? {};

  makeNodes(nodes);

  const entry = nodes.find(item => !item.upstream);

  function onSwitchVersion({ key }) {
    if (key != workflow.id) {
      history.push(key);
    }
  }

  async function onToggle(value) {
    await resource.update({
      filterByTk: workflow[targetKey],
      values: {
        enabled: value,
        // NOTE: keep `key` field to adapt for backend
        key: workflow.key
      }
    });
    refresh();
  }

  async function onRevision() {
    const { data: { data: revision } } = await resource.revision({
      filterByTk: workflow[targetKey]
    });
    message.success(lang('Operation succeeded'));

    history.push(`${revision.id}`);
  }

  async function onMenuCommand({ key }) {
    switch (key) {
      case 'history':
        setVisible(true);
        return;
      case 'revision':
        return onRevision();
      default:
        break;
    }
  }

  const revisionable = workflow.executed && !revisions.find(item => !item.executed && new Date(item.createdAt) > new Date(workflow.createdAt));

  return (
    <FlowContext.Provider value={{
      workflow,
      nodes,
      onNodeAdded: refresh,
      onNodeRemoved: refresh
    }}>
      <div className="workflow-toolbar">
        <header>
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to={`/admin/settings/workflow/workflows`}>
                {lang('Workflow')}
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <strong>{workflow.title}</strong>
            </Breadcrumb.Item>
          </Breadcrumb>
        </header>
        <aside>
          <div className="workflow-versions">
            <Dropdown
              trigger={['click']}
              overlay={
                <Menu
                  onClick={onSwitchVersion}
                  defaultSelectedKeys={[`${workflow.id}`]}
                  className={cx(workflowVersionDropdownClass)}
                >
                  {revisions.sort((a, b) => b.id - a.id).map((item, index) => (
                    <Menu.Item
                      key={`${item.id}`}
                      icon={item.current ? <RightOutlined /> : null}
                      className={classnames({
                        executed: item.executed,
                        unexecuted: !item.executed,
                        enabled: item.enabled,
                      })}
                    >
                      <strong>{`#${item.id}`}</strong>
                      <time>{(new Date(item.createdAt)).toLocaleString()}</time>
                    </Menu.Item>
                  ))}
                </Menu>
              }
            >
              <Button type="text">
                <label>{lang('Version')}</label>
                <span>{workflow?.id ? `#${workflow.id}` : null}</span>
                <DownOutlined />
              </Button>
            </Dropdown>
          </div>
          <Switch
            checked={workflow.enabled}
            onChange={onToggle}
            checkedChildren={lang('On')}
            unCheckedChildren={lang('Off')}
          />
          <Dropdown
            overlay={
              <Menu onClick={onMenuCommand}>
                <Menu.Item key="history" disabled={!workflow.executed}>{lang('Execution history')}</Menu.Item>
                <Menu.Item key="revision" disabled={!revisionable}>{lang('Copy to new version')}</Menu.Item>
              </Menu>
            }
          >
            <Button type="text" icon={<EllipsisOutlined />} />
          </Dropdown>
          <ActionContext.Provider value={{ visible, setVisible }}>
            <SchemaComponent
              schema={{
                type: 'void',
                properties: {
                  drawer: executionSchema
                }
              }}
              components={{
                ExecutionResourceProvider,
                ExecutionLink
              }}
            />
          </ActionContext.Provider>
        </aside>
      </div>
      <div className="workflow-canvas">
        <TriggerConfig />
        <div className={branchBlockClass}>
          <Branch entry={entry} />
        </div>
        <div className={cx(nodeCardClass)}>
          <div className={cx(nodeMetaClass)}>
            <Tag color="#333">{lang('End')}</Tag>
          </div>
        </div>
      </div>
    </FlowContext.Provider>
  );
}
