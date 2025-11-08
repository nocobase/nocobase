/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CaretRightOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { createForm, Field } from '@formily/core';
import { toJS } from '@formily/reactive';
import { ISchema, observer, useField, useForm } from '@formily/react';
import { Alert, App, Button, Collapse, Dropdown, Empty, Input, Space, Tag, Tooltip, message } from 'antd';
import { cloneDeep, get, set } from 'lodash';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActionContextProvider,
  FormProvider,
  SchemaComponent,
  SchemaInitializerItemType,
  Variable,
  css,
  cx,
  useAPIClient,
  useActionContext,
  useCompile,
  usePlugin,
  useResourceActionContext,
} from '@nocobase/client';
import { parse, str2moment } from '@nocobase/utils/client';

import WorkflowPlugin from '..';
import { AddButton } from '../AddNodeContext';
import { useFlowContext } from '../FlowContext';
import { DrawerDescription } from '../components/DrawerDescription';
import { StatusButton } from '../components/StatusButton';
import { JobStatusOptionsMap } from '../constants';
import { useGetAriaLabelOfAddButton, useWorkflowExecuted } from '../hooks';
import { lang } from '../locale';
import useStyles from '../style';
import { UseVariableOptions, VariableOption, WorkflowVariableInput } from '../variable';
import { useRemoveNodeContext } from '../RemoveNodeContext';

export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};

type Config = Record<string, any>;

type Options = { label: string; value: any }[];

export abstract class Instruction {
  title: string;
  type: string;
  group: string;
  description?: string;
  icon?: JSX.Element;
  /**
   * @deprecated migrate to `presetFieldset` instead
   */
  options?: { label: string; value: any; key: string }[];
  fieldset: Record<string, ISchema>;
  /**
   * @experimental
   */
  presetFieldset?: Record<string, ISchema>;
  /**
   * To presentation if the instruction is creating a branch
   * @experimental
   */
  branching?: boolean | Options | ((config: Config) => boolean | Options);
  /**
   * @experimental
   */
  view?: ISchema;
  scope?: Record<string, any>;
  components?: Record<string, any>;
  Component?(props): JSX.Element;
  /**
   * @experimental
   */
  createDefaultConfig?(): Config {
    return {};
  }
  useVariables?(node, options?: UseVariableOptions): VariableOption;
  useScopeVariables?(node, options?): VariableOption[];
  useInitializers?(node): SchemaInitializerItemType | null;
  /**
   * @experimental
   */
  isAvailable?(ctx: NodeAvailableContext): boolean;
  end?: boolean | ((node) => boolean);
  testable?: boolean;
}

function useUpdateAction() {
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const data = useNodeContext();
  const executed = useWorkflowExecuted();
  return {
    async run() {
      if (executed) {
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
      form.setInitialValues(toJS(form.values));
      ctx.setFormValueChanged(false);
      ctx.setVisible(false);
      refresh();
    },
  };
}

export const NodeContext = React.createContext<any>({});

export function useNodeContext() {
  return useContext(NodeContext);
}

export function useNodeSavedConfig(keys = []) {
  const node = useNodeContext();
  return keys.some((key) => get(node.config, key) != null);
}

/**
 * @experimental
 */
export function useAvailableUpstreams(node, filter?) {
  const stack: any[] = [];
  if (!node) {
    return [];
  }
  for (let current = node.upstream; current; current = current.upstream) {
    if (typeof filter !== 'function' || filter(current)) {
      stack.push(current);
    }
  }

  return stack;
}

/**
 * @experimental
 */
export function useUpstreamScopes(node) {
  const stack: any[] = [];

  for (let current = node; current; current = current.upstream) {
    if (current.upstream && current.branchIndex != null) {
      stack.push(current.upstream);
    }
  }

  return stack;
}

export function Node({ data }) {
  const { styles } = useStyles();
  const { getAriaLabel } = useGetAriaLabelOfAddButton(data);
  const workflowPlugin = usePlugin(WorkflowPlugin);
  const { Component = NodeDefaultView, end } = workflowPlugin.instructions.get(data.type) ?? {};
  return (
    <NodeContext.Provider value={data}>
      <div className={cx(styles.nodeBlockClass)}>
        <Component data={data} />
        {!end || (typeof end === 'function' && !end(data)) ? (
          <AddButton aria-label={getAriaLabel()} upstream={data} />
        ) : (
          <div className="end-sign">
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
  const executed = useWorkflowExecuted();
  const removeNodeContext = useRemoveNodeContext();

  const onOk = useCallback(async () => {
    await api.resource('flow_nodes').destroy?.({
      filterByTk: current.id,
    });
    refresh();
  }, [current.id, refresh, api]);

  const onRemove = useCallback(async () => {
    const branches = nodes.filter((item) => item.upstream === current && item.branchIndex != null);
    if (!branches.length) {
      const usingNodes = nodes.filter((node) => {
        if (node === current) {
          return false;
        }

        const template = parse(node.config);
        const refs = template.parameters.filter(
          ({ key }) =>
            key.startsWith(`$jobsMapByNodeKey.${current.key}.`) || key === `$jobsMapByNodeKey.${current.key}`,
        );
        return refs.length;
      });

      if (usingNodes.length) {
        modal.error({
          title: lang('Can not delete'),
          content: lang(
            'The result of this node has been referenced by other nodes ({{nodes}}), please remove the usage before deleting.',
            { nodes: usingNodes.map((item) => item.title).join(', ') },
          ),
        });
        return;
      }

      modal.confirm({
        title: t('Delete'),
        content: t('Are you sure you want to delete it?'),
        onOk,
      });
    } else {
      removeNodeContext?.setDeletingNode(current);
    }
  }, [current, modal, nodes, onOk, removeNodeContext, t]);

  if (!workflow || executed) {
    return null;
  }

  return (
    <Button
      type="text"
      shape="circle"
      icon={<DeleteOutlined />}
      onClick={onRemove}
      className="workflow-node-remove-button"
      size="small"
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

  return (
    <Tooltip title={lang('View result')}>
      {jobs.length > 1 ? (
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
      )}
    </Tooltip>
  );
}

function useFormProviderProps() {
  return { form: useForm() };
}

const useRunAction = () => {
  const { values, query } = useForm();
  const node = useNodeContext();
  const api = useAPIClient();
  const ctx = useActionContext();
  const field = useField<Field>();
  return {
    async run() {
      const template = parse(node.config);
      const config = template(toJS(values.config));
      const logField = query('log').take() as Field;
      const resultField = query('result').take() as Field;
      resultField.setValue(null);
      resultField.setFeedback({});

      field.data = field.data || {};
      field.data.loading = true;

      try {
        const {
          data: { data },
        } = await api.resource('flow_nodes').test({
          values: {
            config,
            type: node.type,
          },
        });

        resultField.setFeedback({
          type: data.status > 0 ? 'success' : 'error',
          messages: data.status > 0 ? [lang('Resolved')] : [lang('Failed')],
        });
        resultField.setValue(data.result);
        logField.setValue(data.log || '');
      } catch (err) {
        resultField.setFeedback({
          type: 'error',
          messages: err.message,
        });
      }
      field.data.loading = false;
    },
  };
};

const VariableKeysContext = createContext<string[]>([]);

function VariableReplacer({ name, value, onChange }) {
  return (
    <Space>
      <WorkflowVariableInput variableOptions={{}} value={`{{${name}}}`} disabled />
      <Variable.Input
        useTypedConstant={['string', 'number', 'boolean', 'date', 'object']}
        value={value}
        onChange={onChange}
      />
    </Space>
  );
}

function TestFormFieldset({ value, onChange }) {
  const keys = useContext(VariableKeysContext);

  return keys.length ? (
    <>
      {keys.map((key) => (
        <VariableReplacer
          key={key}
          name={key}
          value={get(value, key)}
          onChange={(v) => {
            set(value, key, v);
            onChange(toJS(value));
          }}
        />
      ))}
    </>
  ) : (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={lang('No variable')} style={{ margin: '1em' }} />
  );
}

function LogCollapse({ value }) {
  return value ? (
    <Collapse
      ghost
      items={[
        {
          key: 'log',
          label: lang('Log'),
          children: (
            <Input.TextArea
              value={value}
              autoSize={{ minRows: 5, maxRows: 20 }}
              style={{ whiteSpace: 'pre', cursor: 'text', fontFamily: 'monospace', fontSize: '80%' }}
              disabled
            />
          ),
        },
      ]}
      className={css`
        .ant-collapse-item > .ant-collapse-header {
          padding: 0;
        }
        .ant-collapse-content > .ant-collapse-content-box {
          padding: 0;
        }
      `}
    />
  ) : null;
}

function useCancelAction() {
  const form = useForm();
  const ctx = useActionContext();
  return {
    async run() {
      const resultField = form.query('result').take() as Field;
      resultField.setFeedback();
      form.setValues({ result: null, log: null });
      form.clearFormGraph('*');
      form.reset();
      ctx.setVisible(false);
    },
  };
}

function TestButton() {
  const node = useNodeContext();
  const { values } = useForm();
  const [visible, setVisible] = useState(false);
  const template = parse(values);
  const keys = template.parameters.map((item) => item.key);
  const form = useMemo(() => createForm(), []);

  const onOpen = useCallback(() => {
    setVisible(true);
  }, []);
  const setModalVisible = useCallback(
    (v: boolean) => {
      if (v) {
        setVisible(true);
        return;
      }
      const resultField = form.query('result').take() as Field;
      resultField?.setFeedback();
      form.setValues({ result: null, log: null });
      form.clearFormGraph('*');
      form.reset();
      setVisible(false);
    },
    [form],
  );

  return (
    <NodeContext.Provider value={{ ...node, config: values }}>
      <VariableKeysContext.Provider value={keys}>
        <ActionContextProvider value={{ visible, setVisible: setModalVisible }}>
          <Button icon={<CaretRightOutlined />} onClick={onOpen}>
            {lang('Test run')}
          </Button>
          <SchemaComponent
            components={{
              Alert,
              TestFormFieldset,
              LogCollapse,
            }}
            scope={{
              useCancelAction,
              useRunAction,
            }}
            schema={{
              type: 'void',
              name: 'modal',
              'x-decorator': 'FormV2',
              'x-decorator-props': {
                form,
              },
              'x-component': 'Action.Modal',
              title: `{{t("Test run", { ns: "workflow" })}}`,
              properties: {
                alert: {
                  type: 'void',
                  'x-component': 'Alert',
                  'x-component-props': {
                    message: `{{t("Test run will do the actual data manipulating or API calling, please use with caution.", { ns: "workflow" })}}`,
                    type: 'warning',
                    showIcon: true,
                    className: css`
                      margin-bottom: 1em;
                    `,
                  },
                },
                config: {
                  type: 'object',
                  title: '{{t("Replace variables", { ns: "workflow" })}}',
                  'x-decorator': 'FormItem',
                  'x-component': 'TestFormFieldset',
                },
                actions: {
                  type: 'void',
                  'x-component': 'ActionBar',
                  properties: {
                    submit: {
                      type: 'void',
                      title: '{{t("Run")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction: '{{ useRunAction }}',
                      },
                    },
                  },
                },
                result: {
                  type: 'string',
                  title: `{{t("Result", { ns: "workflow" })}}`,
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.JSON',
                  'x-component-props': {
                    autoSize: {
                      minRows: 5,
                      maxRows: 20,
                    },
                    style: {
                      whiteSpace: 'pre',
                      cursor: 'text',
                    },
                  },
                  'x-pattern': 'disabled',
                },
                log: {
                  type: 'string',
                  'x-component': 'LogCollapse',
                },
              },
            }}
          />
        </ActionContextProvider>
      </VariableKeysContext.Provider>
    </NodeContext.Provider>
  );
}

export function NodeDefaultView(props) {
  const { data, children } = props;
  const compile = useCompile();
  const api = useAPIClient();
  const { workflow, refresh } = useFlowContext() ?? {};
  const { styles } = useStyles();
  const workflowPlugin = usePlugin(WorkflowPlugin);
  const executed = useWorkflowExecuted();
  const instruction = workflowPlugin.instructions.get(data.type);

  const [editingTitle, setEditingTitle] = useState<string>(data.title);
  const [editingConfig, setEditingConfig] = useState(false);
  const [formValueChanged, setFormValueChanged] = useState(false);

  const form = useMemo(() => {
    const values = cloneDeep(data.config);
    return createForm({
      initialValues: values,
      disabled: Boolean(executed),
    });
  }, [data, workflow]);

  const resetForm = useCallback(
    (editing) => {
      setEditingConfig(editing);
      if (!editing) {
        form.reset();
      }
    },
    [form],
  );

  const onChangeTitle = useCallback(
    async function (next) {
      const title = next || compile(instruction?.title);
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
    },
    [data, instruction],
  );

  const onOpenDrawer = useCallback(function (ev) {
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
  }, []);

  if (!instruction) {
    return (
      <div className={cx(styles.nodeClass, `workflow-node-type-${data.type}`)}>
        <Tooltip
          title={lang(
            'Node with unknown type will cause error. Please delete it or check plugin which provide this type.',
          )}
        >
          <div role="button" aria-label={`_untyped-${editingTitle}`} className={cx(styles.nodeCardClass, 'invalid')}>
            <div className={styles.nodeHeaderClass}>
              <div className={cx(styles.nodeMetaClass, 'workflow-node-meta')}>
                <Tag color="error">{lang('Unknown node')}</Tag>
                <span className="workflow-node-id">{data.id}</span>
              </div>
              <div className="workflow-node-actions">
                <RemoveButton />
                <JobButton />
              </div>
            </div>
            <Input.TextArea value={editingTitle} disabled autoSize />
          </div>
        </Tooltip>
      </div>
    );
  }

  const typeTitle = compile(instruction.title);

  return (
    <div className={cx(styles.nodeClass, `workflow-node-type-${data.type}`)}>
      <div
        role="button"
        aria-label={`${typeTitle}-${editingTitle}`}
        className={cx(styles.nodeCardClass, { configuring: editingConfig })}
        onClick={onOpenDrawer}
      >
        <div className={styles.nodeHeaderClass}>
          <div className={cx(styles.nodeMetaClass, 'workflow-node-meta')}>
            <Tag icon={instruction.icon}>{typeTitle}</Tag>
            <span className="workflow-node-id">{data.id}</span>
          </div>
          <div className="workflow-node-actions">
            <RemoveButton />
            <JobButton />
          </div>
        </div>
        <Input.TextArea
          disabled={Boolean(executed)}
          value={editingTitle}
          onChange={(ev) => setEditingTitle(ev.target.value)}
          onBlur={(ev) => onChangeTitle(ev.target.value)}
          autoSize
        />
        <ActionContextProvider
          value={{
            visible: editingConfig,
            setVisible: resetForm,
            formValueChanged,
            setFormValueChanged,
          }}
        >
          <FormProvider form={form}>
            <SchemaComponent
              distributed={false}
              scope={{
                ...instruction.scope,
                useFormProviderProps,
                useUpdateAction,
              }}
              components={instruction.components}
              schema={{
                type: 'void',
                properties: {
                  ...(instruction.view ? { view: instruction.view } : {}),
                  // button: {
                  //   type: 'void',
                  //   'x-content': detailText,
                  //   'x-component': Button,
                  //   'x-component-props': {
                  //     type: 'link',
                  //     className: 'workflow-node-config-button',
                  //   },
                  // },
                  [data.id]: {
                    type: 'void',
                    title: (
                      <div
                        className={css`
                          display: flex;
                          justify-content: space-between;

                          strong {
                            font-weight: bold;
                          }

                          .ant-tag {
                            margin-inline-end: 0;
                          }

                          code {
                            font-weight: normal;
                          }
                        `}
                      >
                        <strong>{data.title}</strong>
                        <Tooltip title={lang('Variable key of node')}>
                          <Tag>
                            <code>{data.key}</code>
                          </Tag>
                        </Tooltip>
                      </div>
                    ),
                    'x-decorator': 'FormV2',
                    'x-use-decorator-props': 'useFormProviderProps',
                    'x-component': 'Action.Drawer',
                    properties: {
                      ...(instruction.description
                        ? {
                            description: {
                              type: 'void',
                              'x-component': DrawerDescription,
                              'x-component-props': {
                                label: lang('Node type'),
                                title: instruction.title,
                                icon: instruction.icon,
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
                      footer: executed
                        ? null
                        : {
                            type: 'void',
                            'x-component': 'Action.Drawer.Footer',
                            properties: {
                              actions: {
                                type: 'void',
                                'x-component': 'ActionBar',
                                'x-component-props': {
                                  style: {
                                    flexGrow: 1,
                                  },
                                },
                                properties: {
                                  ...(instruction.testable
                                    ? {
                                        test: {
                                          type: 'void',
                                          'x-component': observer(TestButton),
                                          'x-align': 'left',
                                        },
                                      }
                                    : {}),
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
                                      useAction: '{{ useUpdateAction }}',
                                    },
                                  },
                                },
                              },
                            },
                          },
                    },
                  } as ISchema,
                },
              }}
            />
          </FormProvider>
        </ActionContextProvider>
      </div>
      {children}
    </div>
  );
}
