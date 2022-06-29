import React, { useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Dropdown, Menu, Button, Tag, Switch, message } from 'antd';
import { PlusOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { cx } from '@emotion/css';
import { useTranslation } from 'react-i18next';

import {
  useAPIClient,
  useCompile,
  useDocumentTitle,
  useResourceActionContext,
  useResourceContext
} from '@nocobase/client';

import { Instruction, instructions, Node } from './nodes';
import { addButtonClass, branchBlockClass, branchClass, nodeCardClass, nodeMetaClass, workflowVersionDropdownClass } from './style';
import { TriggerConfig } from './triggers';




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

const FlowContext = React.createContext(null);

export function useFlowContext() {
  return useContext(FlowContext);
}

export function WorkflowCanvas() {
  const { t } = useTranslation();
  const history = useHistory();
  const { data, refresh, loading } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { setTitle } = useDocumentTitle();
  useEffect(() => {
    const { title } = data?.data ?? {};
    setTitle(`${title ? `${title} - ` : ''}${t('Workflow')}`);
  }, [data?.data]);

  if (!data?.data && !loading) {
    return <div>{t('Load failed')}</div>;
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
        // NOTE: keep `key` field to adapter for backend
        key: workflow.key
      }
    });
    refresh();
  }

  async function onRevision() {
    const { data: { data: revision } } = await resource.revision({
      filterByTk: workflow[targetKey]
    });
    message.success(t('Operation succeeded'));

    history.push(`${revision.id}`);
  }

  return (
    <FlowContext.Provider value={{
      workflow,
      nodes,
      onNodeAdded: refresh,
      onNodeRemoved: refresh
    }}>
      <div className="workflow-toolbar">
        <header>
          <strong>{workflow.title}</strong>
        </header>
        <aside>
          <div className="workflow-versions">
            <label>{t('Version')}</label>
            <Dropdown
              trigger={['click']}
              overlay={
                <Menu
                  onClick={onSwitchVersion}
                  defaultSelectedKeys={[workflow.id]}
                  className={cx(workflowVersionDropdownClass)}
                >
                  {revisions.sort((a, b) => b.id - a.id).map(item => (
                    <Menu.Item
                      key={item.id}
                      icon={item.current ? <RightOutlined /> : null}
                      className={item.executed ? 'executed' : 'unexecuted'}
                    >
                      <strong>{`#${item.id}`}</strong>
                      <time>{(new Date(item.createdAt)).toLocaleString()}</time>
                    </Menu.Item>
                  ))}
                </Menu>
              }
            >
              <Button type="link">{workflow?.id ? `#${workflow.id}` : null}<DownOutlined /></Button>
            </Dropdown>
          </div>
          <Switch
            checked={workflow.enabled}
            onChange={onToggle}
            checkedChildren={t('On')}
            unCheckedChildren={t('Off')}
          />
          {workflow.executed && !revisions.find(item => !item.executed && new Date(item.createdAt) > new Date(workflow.createdAt))
            ? (
              <Button onClick={onRevision}>{t('Copy to new version')}</Button>
            )
            : null
          }
        </aside>
      </div>
      <div className="workflow-canvas">
        <TriggerConfig />
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

export function Branch({
  from = null,
  entry = null,
  branchIndex = null,
  controller = null
}) {
  const list = [];
  for (let node = entry; node; node = node.downstream) {
    list.push(node);
  }

  return (
    <div className={cx(branchClass)}>
      <div className="workflow-branch-lines" />
      {controller}
      <AddButton upstream={from} branchIndex={branchIndex} />
      <div className="workflow-node-list">
        {list.map(item => <Node data={item} key={item.id} />)}
      </div>
    </div>
  );
}

// TODO(bug): useless observable
// const instructionsList = observable(Array.from(instructions.getValues()));

interface AddButtonProps {
  upstream;
  branchIndex?: number;
};

export function AddButton({ upstream, branchIndex = null }: AddButtonProps) {
  const compile = useCompile();
  const api = useAPIClient();
  const { workflow, onNodeAdded } = useFlowContext();
  const resource = api.resource('workflows.nodes', workflow.id);

  async function onCreate({ keyPath }) {
    const type = keyPath.pop();
    const config = {};
    const [optionKey] = keyPath;
    if (optionKey) {
      const { value } = instructions.get(type).options.find(item => item.key === optionKey);
      Object.assign(config, value);
    }

    const { data: { data: node } } = await resource.create({
      values: {
        type,
        upstreamId: upstream?.id ?? null,
        branchIndex,
        config
      }
    });

    onNodeAdded(node);
  }

  const groups = [
    { value: 'control', name: '{{t("Control")}}' },
    { value: 'collection', name: '{{t("Collection operations")}}' },
  ];
  const instructionList = (Array.from(instructions.getValues()) as Instruction[]);

  return (
    <div className={cx(addButtonClass)}>
      <Dropdown
        trigger={['click']}
        overlay={
          <Menu onClick={ev => onCreate(ev)}>
            {groups.map(group => (
              <Menu.ItemGroup key={group.value} title={compile(group.name)}>
                {instructionList.filter(item => item.group === group.value).map(item => item.options
                ? (
                  <Menu.SubMenu key={item.type} title={compile(item.title)}>
                    {item.options.map(option => (
                      <Menu.Item key={option.key}>{compile(option.label)}</Menu.Item>
                    ))}
                  </Menu.SubMenu>
                )
                : (
                  <Menu.Item key={item.type}>{compile(item.title)}</Menu.Item>
                ))}
              </Menu.ItemGroup>
            ))}
          </Menu>
        }
        disabled={workflow.executed}
      >
        <Button shape="circle" icon={<PlusOutlined />} />
      </Dropdown>
    </div>
  );
};
