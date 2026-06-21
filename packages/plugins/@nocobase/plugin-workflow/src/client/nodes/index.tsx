/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CaretRightOutlined, CloseOutlined, CopyOutlined, DeleteOutlined, EllipsisOutlined } from '@ant-design/icons';
import { createForm, Field } from '@formily/core';
import { toJS } from '@formily/reactive';
import { ISchema, observer, useField, useForm } from '@formily/react';
import { Alert, App, Button, Collapse, Dropdown, Empty, Input, Skeleton, Space, Tag, Tooltip, message } from 'antd';
import { cloneDeep, get, set } from 'lodash';
import React, { createContext, Suspense, lazy, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActionContextProvider,
  FormProvider,
  SchemaComponent,
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

import { useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';

import WorkflowPlugin from '..';
import { AddNodeSlot } from '../AddNodeContext';
import { useFlowContext } from '../FlowContext';
import { openNodeConfigDrawer } from '../../client-v2/canvas/NodeConfigDrawer';
import {
  nodeTypeClassName,
  resolveLegacyNodeRenderMode,
  resolveLegacyConfigRenderMode,
} from '../../client-v2/canvas/nodeRenderDispatch';
import { DrawerDescription } from '../components/DrawerDescription';
import { StatusButton } from '../components/StatusButton';
import { JobStatusOptionsMap } from '../constants';
import { useGetAriaLabelOfAddButton, useWorkflowExecuted } from '../hooks';
import { lang } from '../locale';
import useStyles from '../style';
import { WorkflowVariableInput } from '../variable';
import { useRemoveNodeContext } from '../RemoveNodeContext';
import { useNodeDragContext } from '../NodeDragContext';
import { useNodeClipboardContext } from '../NodeClipboardContext';

// The Instruction base class + its pure logic hooks + NodeContext now live in client-v2 and are shared by both canvases
// (ADR-0002/0003). Re-exported here so the ~16 node files that `extends Instruction` from this barrel are unchanged.
import { Instruction, NodeContext, useNodeContext } from '../../client-v2/canvas/Instruction';

export {
  Instruction,
  NodeContext,
  useNodeContext,
  useAvailableUpstreams,
  useUpstreamScopes,
} from '../../client-v2/canvas/Instruction';
export type { NodeAvailableContext, TempAssociationSource } from '../../client-v2/canvas/Instruction';

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
      await updateNodeConfig({
        api,
        nodeId: data.id,
        config: form.values,
      });
      form.setInitialValues(toJS(form.values));
      ctx.setFormValueChanged(false);
      ctx.setVisible(false);
      refresh();
    },
  };
}

export async function updateNodeConfig({ api, nodeId, config, resourceName = 'flow_nodes' }) {
  await api.resource(resourceName).update?.({
    filterByTk: nodeId,
    values: {
      config,
    },
  });
}

export function useNodeSavedConfig(keys = []) {
  const node = useNodeContext();
  return keys.some((key) => get(node.config, key) != null);
}

export function Node({ data }) {
  const { styles } = useStyles();
  const { getAriaLabel } = useGetAriaLabelOfAddButton(data);
  const workflowPlugin = usePlugin(WorkflowPlugin);
  const instruction = (workflowPlugin.instructions.get(data.type) ?? {}) as Instruction;
  const { Component, ComponentLoader, end } = instruction;
  const renderMode = resolveLegacyNodeRenderMode(instruction);
  // A node that dropped its v1 `Component` but still inherits a v2 `ComponentLoader` renders its card fully via v2 (the
  // card-layer mirror of the drawer's `FieldsetLoader` dispatch). Memoize the lazy component so it isn't rebuilt every
  // render. Other modes never touch the loader.
  const ModernComponent = useMemo(
    () => (renderMode === 'modern-loader' && ComponentLoader ? lazy(ComponentLoader) : null),
    [renderMode, ComponentLoader],
  );
  return (
    <NodeContext.Provider value={data}>
      <div className={cx(styles.nodeBlockClass)}>
        {renderMode === 'legacy-component' && Component ? (
          <Component data={data} />
        ) : ModernComponent ? (
          <Suspense fallback={<Skeleton.Button active block style={{ width: '16em', height: '4em' }} />}>
            <ModernComponent data={data} />
          </Suspense>
        ) : (
          <NodeDefaultView data={data} />
        )}
        {!end || (typeof end === 'function' && !end(data)) ? (
          <AddNodeSlot aria-label={getAriaLabel()} upstream={data} />
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
  const { workflow } = useFlowContext() ?? {};
  const current = useNodeContext();
  const executed = useWorkflowExecuted();
  const removeNodeContext = useRemoveNodeContext();
  const clipboard = useNodeClipboardContext();
  const isCopiedSelf = Boolean(clipboard?.clipboard?.sourceId && clipboard.clipboard.sourceId === current.id);

  // Delegate the whole delete flow (leaf reference-check + confirm, or the keep-branch modal for branching nodes) to
  // the shared provider.
  const onRemove = useCallback(() => {
    removeNodeContext?.requestRemove?.(current);
  }, [removeNodeContext, current]);

  const onCopy = useCallback(() => {
    if (isCopiedSelf) {
      clipboard?.clearClipboard?.();
      return;
    }
    clipboard?.copyNode?.(current);
  }, [clipboard, current, isCopiedSelf]);

  if (!workflow || executed) {
    return null;
  }

  return (
    <Dropdown
      trigger={['hover']}
      menu={{
        items: [
          {
            key: 'copy',
            label: isCopiedSelf ? lang('Cancel copy') : lang('Copy'),
            icon: isCopiedSelf ? undefined : <CopyOutlined />,
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: t('Delete'),
            icon: <DeleteOutlined />,
            danger: true,
          },
        ],
        onClick: ({ key }) => {
          if (key === 'copy') {
            onCopy();
          }
          if (key === 'delete') {
            onRemove();
          }
        },
      }}
    >
      <Button
        type="text"
        shape="circle"
        icon={<EllipsisOutlined />}
        className="workflow-node-action-button"
        size="small"
      />
    </Dropdown>
  );
}

export function JobButton() {
  const { execution, setViewJob } = useFlowContext();
  const { jobs } = useNodeContext();
  const { styles } = useStyles();

  const onOpenJobInList = useCallback(
    ({ key }) => {
      if (!jobs?.length) {
        return;
      }
      const job = jobs.find((item) => item.id == key);
      setViewJob(job);
    },
    [jobs, setViewJob],
  );

  const onOpenOnlyJob = useCallback(() => {
    const job = jobs?.[0];
    if (!job) {
      return;
    }
    setViewJob(job);
  }, [jobs, setViewJob]);

  if (!execution) {
    return null;
  }

  if (!jobs?.length) {
    return <StatusButton className={styles.nodeJobButtonClass} disabled />;
  }

  return (
    <Tooltip title={lang('View result')}>
      {jobs?.length > 1 ? (
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
            onClick: onOpenJobInList,
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
          status={jobs?.[0].status}
          onClick={onOpenOnlyJob}
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

export function LogCollapse({ value }) {
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
  const flowEngine = useFlowEngine();
  const { workflow, refresh } = useFlowContext() ?? {};
  const { styles } = useStyles();
  const workflowPlugin = usePlugin(WorkflowPlugin);
  const executed = useWorkflowExecuted();
  const dragContext = useNodeDragContext();
  const clipboard = useNodeClipboardContext();
  const [editingTitle, setEditingTitle] = useState<string>(data.title);
  const [editingConfig, setEditingConfig] = useState(false);
  const [formValueChanged, setFormValueChanged] = useState(false);

  const instruction = workflowPlugin.instructions.get(data.type);
  const isDraggingSelf = Boolean(dragContext?.dragging && dragContext?.dragNode?.id === data.id);
  const isCopiedSelf = Boolean(clipboard?.clipboard?.sourceId && clipboard.clipboard.sourceId === data.id);
  const isActive = Boolean(editingConfig || isCopiedSelf || isDraggingSelf);

  // Rebuild the form when the node data changes (switching workflow version yields a fresh `data` per node) or when
  // execution state flips the disabled flag. `executed` already derives from `workflow.versionStats`, so `workflow`
  // itself is not a separate dependency.
  const form = useMemo(() => {
    const values = cloneDeep(data.config);
    return createForm({
      initialValues: values,
      disabled: Boolean(executed),
    });
  }, [data, executed]);

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
    [data, instruction, api, compile, refresh],
  );

  // Drawer dispatch (ADR-0003): a legacy `fieldset` wins, so a node keeps its Formily drawer until it drops `fieldset`;
  // only then does the inherited `FieldsetLoader` open the v2 antd config drawer (`ctx.viewer.drawer`), with the form
  // maintained once in client-v2. This mirrors the card-layer `resolveLegacyNodeRenderMode` so every surface migrates
  // the same way. Returns true only when it opened the v2 drawer, so the caller falls through to the Formily
  // `Action.Drawer` (`setEditingConfig`) for the legacy/none cases.
  const openConfig = useMemoizedFn(() => {
    if (resolveLegacyConfigRenderMode(instruction) !== 'modern-loader') {
      return false;
    }
    openNodeConfigDrawer({ ctx: flowEngine.context, data, instruction, t: lang, workflow, refresh });
    return true;
  });

  const onOpenDrawer = useMemoizedFn(function (ev) {
    if (dragContext?.consumeClick?.()) {
      ev.preventDefault();
      return;
    }
    if (ev.target === ev.currentTarget) {
      if (openConfig()) {
        return;
      }
      setEditingConfig(true);
      return;
    }
    const whiteSet = new Set(['workflow-node-meta', 'workflow-node-config-button', 'ant-input-disabled']);
    for (let el = ev.target; el && el !== ev.currentTarget && el !== document.documentElement; el = el.parentNode) {
      if ((Array.from(el.classList) as string[]).some((name: string) => whiteSet.has(name))) {
        ev.stopPropagation();
        if (openConfig()) {
          return;
        }
        setEditingConfig(true);
        return;
      }
    }
  });

  const onCardMouseDown = useCallback(
    (event) => {
      // React synthetic events bubble through the React component tree (not the DOM tree),
      // so mousedown inside a portal (e.g. the node config Drawer) also triggers this handler.
      // When event.target is not a DOM descendant of the card element, the event originated
      // from a portal — skip drag initiation in that case.
      if (!event.currentTarget.contains(event.target as Node)) {
        return;
      }
      dragContext?.onNodeMouseDown?.(data, event);
    },
    [data, dragContext],
  );

  if (!instruction) {
    return (
      <div className={cx(styles.nodeClass, nodeTypeClassName(data.type))}>
        <Tooltip
          title={lang(
            'Node with unknown type will cause error. Please delete it or check plugin which provide this type.',
          )}
        >
          <div
            role="button"
            aria-label={`_untyped-${editingTitle}`}
            className={cx(styles.nodeCardClass, 'invalid', {
              dragging: isDraggingSelf,
              active: isActive,
            })}
            onMouseDown={onCardMouseDown}
          >
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
    <div className={cx(styles.nodeClass, nodeTypeClassName(data.type))}>
      <div
        role="button"
        aria-label={`${typeTitle}-${editingTitle}`}
        className={cx(styles.nodeCardClass, {
          configuring: editingConfig,
          dragging: isDraggingSelf,
          active: isActive,
        })}
        onMouseDown={onCardMouseDown}
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
