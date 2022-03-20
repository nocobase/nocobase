import React, { useContext } from 'react';
import { Dropdown, Menu, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { cx } from '@emotion/css';
import { addButtonClass, branchClass, nodeBlockClass, nodeClass, nodeHeaderClass, nodeTitleClass } from './style';

import {
  useCollection,
  useResourceActionContext
} from '..';
import { instructions, Node } from './nodes';




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

function useFlowContext() {
  return useContext(FlowContext);
}

export function WorkflowCanvas() {
  const { data, refresh, loading } = useResourceActionContext();

  if (!data?.data && !loading) {
    return <div>加载失败</div>;
  }

  const { nodes = [] } = data?.data ?? {};

  makeNodes(nodes);

  const entry = nodes.find(item => !item.upstream);

  return (
    <FlowContext.Provider value={{ onNodeAdded: refresh }}>
      <Branch entry={entry} />
      <div className={cx(nodeClass)}>结束</div>
    </FlowContext.Provider>
  );
}

export function Branch({ entry, branchIndex = null }) {
  const list = [];
  for (let node = entry; node; node = node.downstream) {
    list.push(node);
  }

  return (
    <div className={cx(branchClass)}>
      <AddButton upstream={list[0]?.upstream} branchIndex={branchIndex} />
      {list.map(item => {
        return (
          <div key={item.id} className={cx(nodeBlockClass)}>
            <Node {...item} />
            <AddButton upstream={item} />
          </div>
        );
      })}
    </div>
  );
}

// TODO(bug): useless observable
// const instructionsList = observable(Array.from(instructions.getValues()));

interface AddButtonProps {
  upstream;
  branchIndex?: number;
};

function AddButton({ upstream, branchIndex = null }: AddButtonProps) {
  const { resource } = useCollection();
  const { data } = useResourceActionContext();
  const { onNodeAdded } = useFlowContext();

  async function onCreate(type) {
    const { data: { data: node } } = await resource.create({
      values: {
        type,
        workflowId: data.data.id,
        upstreamId: upstream?.id ?? null,
        branchIndex
      }
    });

    onNodeAdded(node);
  }

  return (
    <div className={cx(addButtonClass)}>
      <Dropdown trigger={['click']} overlay={
        <Menu onClick={({ key: type }) => onCreate(type)}>
          {Array.from(instructions.getValues()).map(item => (
            <Menu.Item key={item.type}>{item.title}</Menu.Item>
          ))}
        </Menu>
      }>
        <Button shape="circle" icon={<PlusOutlined />} />
      </Dropdown>
    </div>
  );
};
