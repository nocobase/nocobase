import React, { useContext } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { observable } from '@formily/reactive';
import { ISchema } from '@formily/react';
import { Dropdown, Menu, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  SchemaComponent,
  useCollection,
  useResourceActionContext
} from '..';
import { instructions } from './instructions';
import { TriggerConfig } from './triggers';

const workflowCollection = {
  name: 'workflow',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '流程名称',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    }
  ]
};

const nodeCollection = {
  name: 'flow_nodes',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '节点名称',
        type: 'string',
        'x-component': 'Input'
      } as ISchema,
    },
    {
      type: 'string',
      name: 'type',
      interface: 'select',
      uiSchema: {
        title: '节点类型',
        type: 'string',
        'x-component': 'Select',
        required: true,
      } as ISchema
    }
  ]
};

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

function Flow() {
  const { data, refresh } = useResourceActionContext();

  if (!data?.data) {
    return <div>加载失败</div>;
  }

  const { nodes } = data.data;

  makeNodes(nodes);

  const entry = nodes.find(item => !item.upstream);

  return (
    <FlowContext.Provider value={{ onNodeAdded: refresh }}>
      <Branch entry={entry} />
    </FlowContext.Provider>
  );
}

function Branch({ entry, branchIndex = null }) {
  const list = [];
  for (let node = entry; node; node = node.downstream) {
    list.push(node);
  }

  return (
    <div className="workflow-branch">
      <AddButton upstream={list[0]?.upstream} branchIndex={branchIndex} />
      {list.map(item => <NodeFactory key={item.id} {...item} />)}
    </div>
  );
}

function NodeFactory(props) {
  const { id, type, config } = props;
  return (
    <div className="workflow-node-wrapper">
      <div className="worlflow-node">{`#${id}: ${type}`}</div>
      <AddButton upstream={props} />
    </div>
  );
}

// TODO(bug): useless observable
const instructionsList = observable(Array.from(instructions.getValues()));

interface AddButtonProps {
  upstream;
  branchIndex?: number;
};

const AddButton = ({ upstream, branchIndex = null }: AddButtonProps) => {
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
    <>
      <Dropdown trigger={['click']} overlay={
        <Menu onClick={({ key: type }) => onCreate(type)}>
          {Array.from(instructions.getValues()).map(item => (
            <Menu.Item key={item.type}>{item.title}</Menu.Item>
          ))}
        </Menu>
      }>
        <Button shape="circle" icon={<PlusOutlined />} />
      </Dropdown>
    </>
  );
};

export const WorkflowPage = () => {
  const { params } = useRouteMatch();

  return (
    <div className="workflow-page">
      <div className="workflow-canvas">
        <SchemaComponent
          schema={{
            type: 'void',
            properties: {
              provider: {
                type: 'void',
                'x-decorator': 'ResourceActionProvider',
                'x-decorator-props': {
                  collection: workflowCollection,
                  resourceName: 'workflows',
                  request: {
                    resource: 'workflows',
                    action: 'get',
                    params: {
                      filter: params,
                      appends: ['nodes']
                    }
                  }
                },
                properties: {
                  trigger: {
                    type: 'void',
                    'x-component': 'TriggerConfig'
                  },
                  nodes: {
                    type: 'void',
                    'x-component': 'CollectionProvider',
                    'x-component-props': {
                      collection: nodeCollection,
                    },
                    properties: {
                      nodes: {
                        type: 'void',
                        'x-component': 'Flow',
                        'x-component-props': {
                          // nodes
                        }
                      }
                    }
                  }
                }
              },
            }
          }}
          components={{
            TriggerConfig,
            Flow
          }}
        />
      </div>
    </div>
  );
};
