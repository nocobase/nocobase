import React, { useContext } from 'react';
import { cx } from '@emotion/css';
import { Button, Modal, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { ISchema, useForm } from '@formily/react';

import { Registry } from '@nocobase/utils';

import { SchemaComponent, useActionContext, useAPIClient, useCollection, useRequest, useResourceActionContext } from '../..';
import { useFlowContext } from '../WorkflowCanvas';

import { nodeClass, nodeCardClass, nodeHeaderClass, nodeTitleClass } from '../style';

import query from './query';
import condition from './condition';
import parallel from './parallel';


function useUpdateConfigAction() {
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const data = useNodeContext();
  return {
    async run() {
      await api.resource('flow_nodes', data.id).update({
        filterByTk: data.id,
        values: {
          config: {
            ...data.config,
            ...form.values
          }
        },
      });
      ctx.setVisible(false);
      refresh();
    },
  };
};



export interface Instruction {
  title: string;
  type: string;
  options?: { label: string; value: any; key: string }[];
  fieldset: { [key: string]: ISchema };
  view: ISchema;
  scope?: { [key: string]: any };
  components?: { [key: string]: any }
  render?(props): React.ReactElement
};

export const instructions = new Registry<Instruction>();

instructions.register('query', query);
instructions.register('condition', condition);
instructions.register('parallel', parallel);

const NodeContext = React.createContext(null);

export function useNodeContext() {
  return useContext(NodeContext);
}

export function Node({ data }) {
  const instruction = instructions.get(data.type);

  if (instruction.render) {
    return instruction.render(data);
  }

  return (
    <NodeDefaultView data={data} />
  );
}

export function RemoveButton() {
  const { resource } = useCollection();
  const current = useNodeContext();
  const { nodes, onNodeRemoved } = useFlowContext();

  async function onRemove() {
    async function onOk() {
      const { data: { data: node } } = await resource.destroy({
        filterByTk: current.id
      });
      onNodeRemoved(node);
    }

    if (!nodes.find(item => item.upstream === current && item.branchIndex != null)) {
      return onOk();
    }

    Modal.confirm({
      title: '删除分支',
      content: '节点包含分支，将删除其所有分支下的子节点，确定继续？',
      onOk
    });
  }

  return (
    <Button type="text" shape="circle" icon={<DeleteOutlined />} onClick={onRemove} />
  );
}

export function NodeDefaultView(props) {
  const { data, children } = props;
  const instruction = instructions.get(data.type);

  return (
    <NodeContext.Provider value={data}>
      <div className={cx(nodeClass, `workflow-node-type-${data.type}`)}>
        <div className={cx(nodeCardClass)}>
          <div className={cx(nodeHeaderClass)}>
            <h4 className={cx(nodeTitleClass)}>
              <Tag>{instruction.title}</Tag>
              <strong>{data.title}</strong>
              <span className="workflow-node-id">#{data.id}</span>
            </h4>
            <RemoveButton />
          </div>
          <SchemaComponent
            scope={instruction.scope}
            components={{...instruction.components}}
            schema={{
              type: 'void',
              properties: {
                view: instruction.view,
                config: {
                  type: 'void',
                  title: '配置节点',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    type: 'primary',
                  },
                  properties: {
                    drawer: {
                      type: 'void',
                      title: '配置节点',
                      'x-component': 'Action.Drawer',
                      'x-decorator': 'Form',
                      'x-decorator-props': {
                        useValues(options) {
                          const node = useNodeContext();
                          return useRequest(() => {
                            return Promise.resolve({ data: node.config });
                          }, options);
                        }
                      },
                      properties: {
                        ...instruction.fieldset,
                        actions: {
                          type: 'void',
                          'x-component': 'Action.Drawer.Footer',
                          properties: {
                            cancel: {
                              title: '{{t("Cancel")}}',
                              'x-component': 'Action',
                              'x-component-props': {
                                useAction: '{{ cm.useCancelAction }}',
                              },
                            },
                            submit: {
                              title: '{{t("Submit")}}',
                              'x-component': 'Action',
                              'x-component-props': {
                                type: 'primary',
                                useAction: useUpdateConfigAction,
                              },
                            },
                          },
                        } as ISchema
                      }
                    }
                  }
                }
              }
            }}
          />
        </div>
        {children}
      </div>
    </NodeContext.Provider>
  );
}
