import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { ISchema, useForm } from '@formily/react';
import { Registry } from '@nocobase/utils';
import { Button, Modal, Tag } from 'antd';
import React, { useContext } from 'react';
import { SchemaComponent, useActionContext, useAPIClient, useCollection, useRequest, useResourceActionContext } from '../..';
import { nodeBlockClass, nodeCardClass, nodeClass, nodeHeaderClass, nodeTitleClass } from '../style';
import { AddButton, useFlowContext } from '../WorkflowCanvas';

import calculation from './calculation';
import condition from './condition';
import create from './create';
import destroy from './destroy';
import parallel from './parallel';
import query from './query';
import update from './update';



export interface Instruction {
  title: string;
  type: string;
  group: string;
  options?: { label: string; value: any; key: string }[];
  fieldset: { [key: string]: ISchema };
  view?: ISchema;
  scope?: { [key: string]: any };
  components?: { [key: string]: any };
  render?(props): React.ReactElement;
  endding?: boolean;
  getter?(node: any): React.ReactElement;
};

export const instructions = new Registry<Instruction>();

instructions.register('query', query);
instructions.register('create', create);
instructions.register('update', update);
instructions.register('destroy', destroy);
instructions.register('condition', condition);
instructions.register('parallel', parallel);
instructions.register('calculation', calculation);

function useUpdateAction() {
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const data = useNodeContext();
  return {
    async run() {
      await form.submit();
      await api.resource('flow_nodes', data.id).update({
        filterByTk: data.id,
        values: {
          title: form.values.title,
          config: form.values.config
        }
      });
      ctx.setVisible(false);
      refresh();
    },
  };
};

const NodeContext = React.createContext(null);

export function useNodeContext() {
  return useContext(NodeContext);
}

export function Node({ data }) {
  const instruction = instructions.get(data.type);

  return (
    <div className={cx(nodeBlockClass)}>
      {instruction.render
        ? instruction.render(data)
        : <NodeDefaultView data={data} />
      }
      {!instruction.endding
        ? <AddButton upstream={data} />
        : (
          <div
            className={css`
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 1px;
              height: 6em;
              padding: 2em 0;
              background-color: #f0f2f5;

              .anticon{
                font-size: 1.5em;
                line-height: 100%;
              }
            `}
          >
            <CloseOutlined />
          </div>
        )
      }
    </div>
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

    const hasBranches = !nodes.find(item => item.upstream === current && item.branchIndex != null);
    const message = hasBranches
      ? '确定删除该节点吗？'
      : '节点包含分支，将同时删除其所有分支下的子节点，确定继续？';

    Modal.confirm({
      title: '删除节点',
      content: message,
      onOk
    });
  }

  return (
    <Button
      type="text"
      shape="circle"
      icon={<DeleteOutlined />}
      onClick={onRemove}
      className="workflow-node-remove-button"
    />
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
            components={instruction.components}
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
                          const d = useNodeContext();
                          return useRequest(() => {
                            return Promise.resolve({ data: d });
                          }, options);
                        }
                      },
                      properties: {
                        title: {
                          type: 'string',
                          name: 'title',
                          title: '节点名称',
                          'x-decorator': 'FormItem',
                          'x-component': 'Input',
                        },
                        config: {
                          type: 'void',
                          name: 'config',
                          'x-component': 'fieldset',
                          'x-component-props': {},
                          properties: instruction.fieldset
                        },
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
                                useAction: useUpdateAction,
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
