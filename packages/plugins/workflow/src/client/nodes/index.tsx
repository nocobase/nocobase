import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { ISchema, useForm } from '@formily/react';
import { Registry } from '@nocobase/utils/client';
import { Button, message, Modal, Tag } from 'antd';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponent, useActionContext, useAPIClient, useCompile, useRequest, useResourceActionContext } from '@nocobase/client';

import { nodeBlockClass, nodeCardClass, nodeClass, nodeHeaderClass, nodeMetaClass, nodeTitleClass } from '../style';
import { AddButton, useFlowContext } from '../WorkflowCanvas';

import calculation from './calculation';
import condition from './condition';
import parallel from './parallel';
import delay from './delay';

import query from './query';
import create from './create';
import update from './update';
import destroy from './destroy';

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

instructions.register('condition', condition);
instructions.register('parallel', parallel);
instructions.register('calculation', calculation);
instructions.register('delay', delay);

instructions.register('query', query);
instructions.register('create', create);
instructions.register('update', update);
instructions.register('destroy', destroy);

function useUpdateAction() {
  const { t } = useTranslation();
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const data = useNodeContext();
  const { workflow } = useFlowContext();
  return {
    async run() {
      if (workflow.executed) {
        message.error(t('Node in executed workflow cannot be modified'));
        return;
      }
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
    <NodeContext.Provider value={data}>
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
    </NodeContext.Provider>
  );
}

export function RemoveButton() {
  const { t } = useTranslation();
  const api = useAPIClient();
  const { workflow } = useFlowContext();
  const resource = api.resource('workflows.nodes', workflow.id);
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
      ? t('Are you sure you want to delete it?')
      : t('This node contains branches, deleting will also be preformed to them, are you sure?');

    Modal.confirm({
      title: t('Delete'),
      content: message,
      onOk
    });
  }

  return workflow.executed
  ? null
  : (
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
  const compile = useCompile();
  const { workflow } = useFlowContext();
  const { data, children } = props;
  const instruction = instructions.get(data.type);
  const detailText = workflow.executed ? '{{t("View")}}' : '{{t("Configure")}}';

  return (
    <div className={cx(nodeClass, `workflow-node-type-${data.type}`)}>
      <div className={cx(nodeCardClass)}>
        <div className={cx(nodeHeaderClass)}>
          <div className={cx(nodeMetaClass)}>
            <Tag>{compile(instruction.title)}</Tag>
          </div>
          <h4 className={cx(nodeTitleClass)}>
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
                title: detailText,
                'x-component': 'Action.Link',
                'x-component-props': {
                  type: 'primary',
                },
                properties: {
                  [instruction.type]: {
                    type: 'void',
                    title: instruction.title,
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
                        title: '{{t("Name")}}',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                      },
                      config: {
                        type: 'void',
                        name: 'config',
                        'x-component': 'fieldset',
                        'x-component-props': {
                          disabled: workflow.executed,
                          className: css`
                            .ant-select,
                            .ant-cascader-picker,
                            .ant-picker,
                            .ant-input-number,
                            .ant-input-affix-wrapper{
                              width: auto;
                              min-width: 6em;
                            }
                          `
                        },
                        properties: instruction.fieldset
                      },
                      actions: {
                        type: 'void',
                        'x-component': 'Action.Drawer.Footer',
                        properties: workflow.executed
                        ? {
                          close: {
                            title: '{{t("Close")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ cm.useCancelAction }}',
                            },
                          }
                        }
                        : {
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
  );
}
