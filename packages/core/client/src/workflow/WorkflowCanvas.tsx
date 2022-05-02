import React, { useContext } from 'react';
import { Dropdown, Menu, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { cx } from '@emotion/css';
import { useTranslation } from 'react-i18next';

import {
  useCollection,
  useCompile,
  useResourceActionContext
} from '..';
import { Instruction, instructions, Node } from './nodes';
import { addButtonClass, branchBlockClass, branchClass, nodeBlockClass, nodeCardClass, nodeHeaderClass, nodeTitleClass } from './style';




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
  const { data, refresh, loading } = useResourceActionContext();

  if (!data?.data && !loading) {
    return <div>{t('Load failed')}</div>;
  }

  const { nodes = [], ...workflow } = data?.data ?? {};

  makeNodes(nodes);

  const entry = nodes.find(item => !item.upstream);

  return (
    <FlowContext.Provider value={{
      workflow,
      nodes,
      onNodeAdded: refresh,
      onNodeRemoved: refresh
    }}>
      <div className={branchBlockClass}>
        <Branch entry={entry} />
      </div>
      <div className={cx(nodeCardClass)}>{t('End')}</div>
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
  const { resource } = useCollection();
  const { data } = useResourceActionContext();
  const { onNodeAdded } = useFlowContext();

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
        workflowId: data.data.id,
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
      <Dropdown trigger={['click']} overlay={
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
      }>
        <Button shape="circle" icon={<PlusOutlined />} />
      </Dropdown>
    </div>
  );
};
