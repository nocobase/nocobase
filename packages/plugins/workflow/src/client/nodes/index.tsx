import React, { useState, useContext } from 'react';
import {
  CloseOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { ISchema, useForm } from '@formily/react';
import { Button, message, Modal, Tag, Alert, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import parse from 'json-templates';

import { Registry } from '@nocobase/utils/client';
import { ActionContext, SchemaComponent, SchemaInitializerItemOptions, useActionContext, useAPIClient, useCompile, useRequest, useResourceActionContext } from '@nocobase/client';

import { nodeBlockClass, nodeCardClass, nodeClass, nodeMetaClass, nodeTitleClass } from '../style';
import { AddButton } from '../AddButton';
import { useFlowContext } from '../FlowContext';

import calculation from './calculation';
import condition from './condition';
import parallel from './parallel';
import delay from './delay';

import manual from './manual';

import query from './query';
import create from './create';
import update from './update';
import destroy from './destroy';
import { JobStatusOptions, JobStatusOptionsMap } from '../constants';
import { lang, NAMESPACE } from '../locale';
import request from "./request";
import { VariableOption } from '../variable';

export interface Instruction {
  title: string;
  type: string;
  group: string;
  options?: { label: string; value: any; key: string }[];
  fieldset: { [key: string]: ISchema };
  view?: ISchema;
  scope?: { [key: string]: any };
  components?: { [key: string]: any };
  render?(props): React.ReactNode;
  endding?: boolean;
  getOptions?(config, types?): VariableOption[] | null;
  useInitializers?(node): SchemaInitializerItemOptions | null;
  initializers?: { [key: string]: any };
};

export const instructions = new Registry<Instruction>();

instructions.register('condition', condition);
instructions.register('parallel', parallel);
instructions.register('calculation', calculation);
instructions.register('delay', delay);

instructions.register('manual', manual);

instructions.register('query', query);
instructions.register('create', create);
instructions.register('update', update);
instructions.register('destroy', destroy);
instructions.register('request', request);

function useUpdateAction() {
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const data = useNodeContext();
  const { workflow } = useFlowContext();
  return {
    async run() {
      if (workflow.executed) {
        message.error(lang('Node in executed workflow cannot be modified'));
        return;
      }
      await form.submit();
      await api.resource('flow_nodes', data.id).update?.({
        filterByTk: data.id,
        values: {
          config: form.values
        }
      });
      ctx.setVisible(false);
      refresh();
    },
  };
};

export const NodeContext = React.createContext<any>({});

export function useNodeContext() {
  return useContext(NodeContext);
}

export function useAvailableUpstreams(node) {
  const stack: any[] = [];
  for (let current = node.upstream; current; current = current.upstream) {
    stack.push(current);
  }

  return stack;
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
  const { workflow, nodes, refresh } = useFlowContext() ?? {};
  const current = useNodeContext();
  if (!workflow) {
    return null;
  }
  const resource = api.resource('workflows.nodes', workflow.id);

  async function onRemove() {
    async function onOk() {
      await resource.destroy?.({
        filterByTk: current.id
      });
      refresh();
    }

    const usingNodes = nodes.filter(node => {
      if (node === current) {
        return false;
      }

      const template = parse(node.config);
      const refs = template.parameters.filter(({ key }) => key.startsWith(`$jobsMapByNodeId.${current.id}.`) || key === `$jobsMapByNodeId.${current.id}`);
      return refs.length;
    });

    if (usingNodes.length) {
      Modal.error({
        title: lang('Can not delete'),
        content: lang('The result of this node has been referenced by other nodes ({{nodes}}), please remove the usage before deleting.', { nodes: usingNodes.map(item => `#${item.id}`).join(', ') }),
      });
      return;
    }

    const hasBranches = !nodes.find(item => item.upstream === current && item.branchIndex != null);
    const message = hasBranches
      ? t('Are you sure you want to delete it?')
      : lang('This node contains branches, deleting will also be preformed to them, are you sure?');

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

export function JobButton() {
  const compile = useCompile();
  const { execution } = useFlowContext();
  const { id, type, title, job } = useNodeContext() ?? {};
  if (!execution) {
    return null;
  }

  if (!job) {
    return (
      <span
        className={cx('workflow-node-job-button', css`
          border: 2px solid #d9d9d9;
          border-radius: 50%;
          cursor: not-allowed;
        `)}
      />
    );
  }

  const instruction = instructions.get(type);
  const { value, icon, color } = JobStatusOptionsMap[job.status];

  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          [`${job.id}-button`]: {
            type: 'void',
            'x-component': 'Action',
            'x-component-props': {
              title: <Tag color={color}>{icon}</Tag>,
              shape: 'circle',
              className: ['workflow-node-job-button', css`
                .ant-tag{
                  padding: 0;
                  width: 100%;
                  line-height: 18px;
                  margin-right: 0;
                  border-radius: 50%;
                }
              `]
            },
            properties: {
              [`${job.id}-modal`]: {
                type: 'void',
                'x-decorator': 'Form',
                'x-decorator-props': {
                  initialValue: job
                },
                'x-component': 'Action.Modal',
                title: (
                  <div className={cx(nodeTitleClass)}>
                    <Tag>{compile(instruction.title)}</Tag>
                    <strong>{title}</strong>
                    <span className="workflow-node-id">#{id}</span>
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
                      showTime: true
                    },
                    'x-read-pretty': true,
                  },
                  result: {
                    type: 'object',
                    title: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
                    'x-decorator': 'FormItem',
                    'x-component': 'Input.JSON',
                    'x-component-props': {
                      className: css`
                        padding: 1em;
                        background-color: #eee;
                      `
                    },
                    'x-read-pretty': true,
                  }
                }
              }
            }
          }
        }
      }}
    />
  );
}

export function NodeDefaultView(props) {
  const { data, children } = props;
  const compile = useCompile();
  const api = useAPIClient();
  const { workflow, refresh } = useFlowContext() ?? {};

  const instruction = instructions.get(data.type);
  const detailText = workflow.executed ? '{{t("View")}}' : '{{t("Configure")}}';
  const typeTitle = compile(instruction.title);

  const [editingTitle, setEditingTitle] = useState<string>(data.title ?? typeTitle);
  const [editingConfig, setEditingConfig] = useState(false);

  async function onChangeTitle(next) {
    const title = next || typeTitle;
    setEditingTitle(title);
    if (title === data.title) {
      return;
    }
    await api.resource('flow_nodes').update?.({
      filterByTk: data.id,
      values: {
        title
      }
    });
    refresh();
  }

  function onOpenDrawer(ev) {
    if (ev.target === ev.currentTarget) {
      setEditingConfig(true);
      return;
    }
    const whiteSet = new Set(['workflow-node-meta', 'workflow-node-config-button', 'ant-input-disabled']);
    for (let el = ev.target; el && el !== ev.currentTarget; el = el.parentNode) {
      if ((Array.from(el.classList) as string[]).some((name: string) => whiteSet.has(name))) {
        setEditingConfig(true);
        ev.stopPropagation();
        return;
      }
    }
  }

  return (
    <div className={cx(nodeClass, `workflow-node-type-${data.type}`)}>
      <div className={cx(nodeCardClass, { configuring: editingConfig })} onClick={onOpenDrawer}>
        <div className={cx(nodeMetaClass, 'workflow-node-meta')}>
          <Tag>{typeTitle}</Tag>
          <span className="workflow-node-id">{data.id}</span>
        </div>
        <div>
          <Input.TextArea
            disabled={workflow.executed}
            value={editingTitle}
            onChange={(ev) => setEditingTitle(ev.target.value)}
            onBlur={(ev) => onChangeTitle(ev.target.value)}
            autoSize
          />
        </div>
        <RemoveButton />
        <JobButton />
        <ActionContext.Provider value={{ visible: editingConfig, setVisible: setEditingConfig }}>
          <SchemaComponent
            scope={instruction.scope}
            components={instruction.components}
            schema={{
              type: 'void',
              properties: {
                ...(instruction.view ? { view: instruction.view } : {}),
                button: {
                  type: 'void',
                  'x-content': detailText,
                  'x-component': Button,
                  'x-component-props': {
                    type: 'link',
                    className: 'workflow-node-config-button'
                  },
                },
                [`${instruction.type}_${data.id}`]: {
                  type: 'void',
                  title: instruction.title,
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'Form',
                  'x-decorator-props': {
                    disabled: workflow.executed,
                    useValues(options) {
                      const { config } = useNodeContext();
                      return useRequest(() => {
                        return Promise.resolve({ data: config });
                      }, options);
                    }
                  },
                  properties: {
                    ...(workflow.executed ? {
                      alert: {
                        type: 'void',
                        'x-component': Alert,
                        'x-component-props': {
                          type: 'warning',
                          showIcon: true,
                          message: `{{t("Node in executed workflow cannot be modified", { ns: "${NAMESPACE}" })}}`,
                          className: css`
                            width: 100%;
                            font-size: 85%;
                            margin-bottom: 2em;
                          `
                        },
                      }
                    } : {}),
                    fieldset: {
                      type: 'void',
                      'x-component': 'fieldset',
                      'x-component-props': {
                        className: css`
                          .ant-input,
                          .ant-select,
                          .ant-cascader-picker,
                          .ant-picker,
                          .ant-input-number,
                          .ant-input-affix-wrapper{
                            &:not(.full-width){
                              width: auto;
                              min-width: 6em;
                            }
                          }
                        `
                      },
                      properties: instruction.fieldset
                    },
                    actions: workflow.executed
                    ? null
                    : {
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
                    }
                  }
                } as ISchema
              }
            }}
          />
        </ActionContext.Provider>
      </div>
      {children}
    </div>
  );
}
