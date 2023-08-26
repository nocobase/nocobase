import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { ISchema, useForm } from '@formily/react';
import {
  ActionContextProvider,
  SchemaComponent,
  SchemaInitializerItemOptions,
  css,
  cx,
  useAPIClient,
  useActionContext,
  useCompile,
  useRequest,
  useResourceActionContext,
} from '@nocobase/client';
import { Registry, parse, str2moment } from '@nocobase/utils/client';
import { Alert, App, Button, Dropdown, Input, Tag, message } from 'antd';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddButton } from '../AddButton';
import { useFlowContext } from '../FlowContext';
import { DrawerDescription } from '../components/DrawerDescription';
import { JobStatusOptionsMap } from '../constants';
import { NAMESPACE, lang } from '../locale';
import useStyles from '../style';
import { VariableOption, VariableOptions } from '../variable';
import aggregate from './aggregate';
import calculation from './calculation';
import condition from './condition';
import create from './create';
import delay from './delay';
import destroy from './destroy';
import loop from './loop';
import manual from './manual';
import parallel from './parallel';
import query from './query';
import request from './request';
import sql from './sql';
import update from './update';
import { StatusButton } from '../components/StatusButton';

export interface Instruction {
  title: string;
  type: string;
  group: string;
  description?: string;
  options?: { label: string; value: any; key: string }[];
  fieldset: { [key: string]: ISchema };
  view?: ISchema;
  scope?: { [key: string]: any };
  components?: { [key: string]: any };
  component?(props): JSX.Element;
  endding?: boolean;
  useVariables?(node, options?): VariableOption;
  useScopeVariables?(node, options?): VariableOptions;
  useInitializers?(node): SchemaInitializerItemOptions | null;
  initializers?: { [key: string]: any };
}

export const instructions = new Registry<Instruction>();

instructions.register('calculation', calculation);
instructions.register('condition', condition);
instructions.register('parallel', parallel);
instructions.register('loop', loop);
instructions.register('delay', delay);

instructions.register('manual', manual);

instructions.register('query', query);
instructions.register('create', create);
instructions.register('update', update);
instructions.register('destroy', destroy);
instructions.register('aggregate', aggregate);

instructions.register('request', request);
instructions.register('sql', sql);

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
      await api.resource('flow_nodes').update?.({
        filterByTk: data.id,
        values: {
          config: form.values,
        },
      });
      ctx.setVisible(false);
      refresh();
    },
  };
}

export const NodeContext = React.createContext<any>({});

export function useNodeContext() {
  return useContext(NodeContext);
}

export function useAvailableUpstreams(node) {
  const stack: any[] = [];
  if (!node) {
    return [];
  }
  for (let current = node.upstream; current; current = current.upstream) {
    stack.push(current);
  }

  return stack;
}

export function useUpstreamScopes(node) {
  const stack: any[] = [];
  if (!node) {
    return [];
  }

  for (let current = node; current; current = current.upstream) {
    if (current.upstream && current.branchIndex != null) {
      stack.push(current.upstream);
    }
  }

  return stack;
}

export function Node({ data }) {
  const { styles } = useStyles();
  const { component: Component = NodeDefaultView, endding } = instructions.get(data.type);

  return (
    <NodeContext.Provider value={data}>
      <div className={cx(styles.nodeBlockClass)}>
        <Component data={data} />
        {!endding ? (
          <AddButton upstream={data} />
        ) : (
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
              background-color: var(--nb-box-bg);

              .anticon {
                font-size: 1.5em;
                line-height: 100%;
              }
            `}
          >
            <CloseOutlined />
          </div>
        )}
      </div>
    </NodeContext.Provider>
  );
}

export function RemoveButton() {
  const { t } = useTranslation();
  const api = useAPIClient();
  const { workflow, nodes, refresh } = useFlowContext() ?? {};
  const current = useNodeContext();
  const { modal } = App.useApp();

  if (!workflow) {
    return null;
  }
  const resource = api.resource('flow_nodes');

  async function onRemove() {
    async function onOk() {
      await resource.destroy?.({
        filterByTk: current.id,
      });
      refresh();
    }

    const usingNodes = nodes.filter((node) => {
      if (node === current) {
        return false;
      }

      const template = parse(node.config);
      const refs = template.parameters.filter(
        ({ key }) => key.startsWith(`$jobsMapByNodeId.${current.id}.`) || key === `$jobsMapByNodeId.${current.id}`,
      );
      return refs.length;
    });

    if (usingNodes.length) {
      modal.error({
        title: lang('Can not delete'),
        content: lang(
          'The result of this node has been referenced by other nodes ({{nodes}}), please remove the usage before deleting.',
          { nodes: usingNodes.map((item) => `#${item.id}`).join(', ') },
        ),
      });
      return;
    }

    const hasBranches = !nodes.find((item) => item.upstream === current && item.branchIndex != null);
    const message = hasBranches
      ? t('Are you sure you want to delete it?')
      : lang('This node contains branches, deleting will also be preformed to them, are you sure?');

    modal.confirm({
      title: t('Delete'),
      content: message,
      onOk,
    });
  }

  return workflow.executed ? null : (
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
  const { execution, setViewJob } = useFlowContext();
  const { jobs } = useNodeContext() ?? {};
  const { styles } = useStyles();

  if (!execution) {
    return null;
  }

  if (!jobs.length) {
    return <StatusButton className={styles.nodeJobButtonClass} disabled />;
  }

  function onOpenJob({ key }) {
    const job = jobs.find((item) => item.id == key);
    setViewJob(job);
  }

  return jobs.length > 1 ? (
    <Dropdown
      menu={{
        items: jobs.map((job) => {
          return {
            key: job.id,
            label: (
              <>
                <StatusButton statusMap={JobStatusOptionsMap} status={job.status} />
                <time>{str2moment(job.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</time>
              </>
            ),
          };
        }),
        onClick: onOpenJob,
        className: styles.dropdownClass,
      }}
    >
      <StatusButton
        statusMap={JobStatusOptionsMap}
        status={jobs[jobs.length - 1].status}
        className={styles.nodeJobButtonClass}
      />
    </Dropdown>
  ) : (
    <StatusButton
      statusMap={JobStatusOptionsMap}
      status={jobs[0].status}
      onClick={() => setViewJob(jobs[0])}
      className={styles.nodeJobButtonClass}
    />
  );
}

export function NodeDefaultView(props) {
  const { data, children } = props;
  const compile = useCompile();
  const api = useAPIClient();
  const { workflow, refresh } = useFlowContext() ?? {};
  const { styles } = useStyles();

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
        title,
      },
    });
    refresh();
  }

  function onOpenDrawer(ev) {
    if (ev.target === ev.currentTarget) {
      setEditingConfig(true);
      return;
    }
    const whiteSet = new Set(['workflow-node-meta', 'workflow-node-config-button', 'ant-input-disabled']);
    for (let el = ev.target; el && el !== ev.currentTarget && el !== document.documentElement; el = el.parentNode) {
      if ((Array.from(el.classList) as string[]).some((name: string) => whiteSet.has(name))) {
        setEditingConfig(true);
        ev.stopPropagation();
        return;
      }
    }
  }

  return (
    <div className={cx(styles.nodeClass, `workflow-node-type-${data.type}`)}>
      <div className={cx(styles.nodeCardClass, { configuring: editingConfig })} onClick={onOpenDrawer}>
        <div className={cx(styles.nodeMetaClass, 'workflow-node-meta')}>
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
        <ActionContextProvider value={{ visible: editingConfig, setVisible: setEditingConfig }}>
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
                    className: 'workflow-node-config-button',
                  },
                },
                [`${instruction.type}_${data.id}`]: {
                  type: 'void',
                  title: data.title,
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'Form',
                  'x-decorator-props': {
                    disabled: workflow.executed,
                    useValues(options) {
                      const { config } = useNodeContext();
                      return useRequest(() => {
                        return Promise.resolve({ data: config });
                      }, options);
                    },
                  },
                  properties: {
                    ...(workflow.executed
                      ? {
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
                              `,
                            },
                          },
                        }
                      : instruction.description
                      ? {
                          description: {
                            type: 'void',
                            'x-component': DrawerDescription,
                            'x-component-props': {
                              label: lang('Node type'),
                              title: instruction.title,
                              description: instruction.description,
                            },
                          },
                        }
                      : {}),
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
                          .ant-input-affix-wrapper {
                            &.auto-width {
                              width: auto;
                              min-width: 6em;
                            }
                          }
                        `,
                      },
                      properties: instruction.fieldset,
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
                        },
                  },
                } as ISchema,
              },
            }}
          />
        </ActionContextProvider>
      </div>
      {children}
    </div>
  );
}
