import React, { useState, useEffect } from 'react';
import { css, cx } from '@emotion/css';
import { ISchema, useForm } from '@formily/react';
import { Registry } from '@nocobase/utils/client';
import { message, Tag, Alert, Button, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { InfoOutlined } from '@ant-design/icons';

import {
  ActionContext,
  SchemaComponent,
  SchemaInitializerItemOptions,
  useActionContext,
  useAPIClient,
  useCompile,
  useRequest,
  useResourceActionContext,
} from '@nocobase/client';

import { nodeCardClass, nodeJobButtonClass, nodeMetaClass, nodeTitleClass } from '../style';
import { useFlowContext } from '../FlowContext';
import collection from './collection';
import schedule from './schedule/';
import { lang, NAMESPACE } from '../locale';
import { VariableOptions } from '../variable';

function useUpdateConfigAction() {
  const form = useForm();
  const api = useAPIClient();
  const { workflow } = useFlowContext() ?? {};
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  return {
    async run() {
      if (workflow.executed) {
        message.error(lang('Trigger in executed workflow cannot be modified'));
        return;
      }
      await form.submit();
      await api.resource('workflows').update?.({
        filterByTk: workflow.id,
        values: {
          config: form.values,
        },
      });
      ctx.setVisible(false);
      refresh();
    },
  };
}

export interface Trigger {
  title: string;
  type: string;
  // group: string;
  getOptions?(config: any, types: any[]): VariableOptions;
  fieldset: { [key: string]: ISchema };
  view?: ISchema;
  scope?: { [key: string]: any };
  components?: { [key: string]: any };
  render?(props): React.ReactNode;
  useInitializers?(config): SchemaInitializerItemOptions | null;
  initializers?: any;
}

export const triggers = new Registry<Trigger>();

triggers.register(collection.type, collection);
triggers.register(schedule.type, schedule);

function TriggerExecution() {
  const compile = useCompile();
  const { workflow, execution } = useFlowContext();
  if (!execution) {
    return null;
  }

  const trigger = triggers.get(workflow.type);

  return (
    <SchemaComponent
      schema={{
        type: 'void',
        name: 'execution',
        'x-component': 'Action',
        'x-component-props': {
          title: <InfoOutlined />,
          shape: 'circle',
          className: cx(nodeJobButtonClass, 'workflow-node-job-button'),
          type: 'primary',
        },
        properties: {
          [execution.id]: {
            type: 'void',
            'x-decorator': 'Form',
            'x-decorator-props': {
              initialValue: execution,
            },
            'x-component': 'Action.Modal',
            title: (
              <div className={cx(nodeTitleClass)}>
                <Tag>{compile(trigger.title)}</Tag>
                <strong>{workflow.title}</strong>
                <span className="workflow-node-id">#{execution.id}</span>
              </div>
            ),
            properties: {
              createdAt: {
                type: 'string',
                title: `{{t("Triggered at", { ns: "${NAMESPACE}" })}}`,
                'x-decorator': 'FormItem',
                'x-component': 'DatePicker',
                'x-component-props': {
                  showTime: true,
                },
                'x-read-pretty': true,
              },
              context: {
                type: 'object',
                title: `{{t("Trigger variables", { ns: "${NAMESPACE}" })}}`,
                'x-decorator': 'FormItem',
                'x-component': 'Input.JSON',
                'x-component-props': {
                  className: css`
                    padding: 1em;
                    background-color: #eee;
                  `,
                },
                'x-read-pretty': true,
              },
            },
          },
        },
      }}
    />
  );
}

export const TriggerConfig = () => {
  const api = useAPIClient();
  const compile = useCompile();
  const { workflow, refresh } = useFlowContext();
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingConfig, setEditingConfig] = useState(false);
  useEffect(() => {
    setEditingTitle(workflow.title ?? typeTitle);
  }, [workflow]);

  if (!workflow || !workflow.type) {
    return null;
  }
  const { title, type, config, executed } = workflow;
  const { title: typeTitle, fieldset, scope, components } = triggers.get(type);
  const detailText = executed ? '{{t("View")}}' : '{{t("Configure")}}';
  const titleText = `${lang('Trigger')}: ${compile(typeTitle)}`;

  async function onChangeTitle(next) {
    const t = next || typeTitle;
    setEditingTitle(t);
    if (t === title) {
      return;
    }
    await api.resource('workflows').update?.({
      filterByTk: workflow.id,
      values: {
        title: t,
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
    for (let el = ev.target; el && el !== ev.currentTarget; el = el.parentNode) {
      if ((Array.from(el.classList) as string[]).some((name: string) => whiteSet.has(name))) {
        setEditingConfig(true);
        ev.stopPropagation();
        return;
      }
    }
  }

  return (
    <div className={cx(nodeCardClass)} onClick={onOpenDrawer}>
      <div className={cx(nodeMetaClass, 'workflow-node-meta')}>
        <Tag color="gold">{titleText}</Tag>
      </div>
      <div>
        <Input.TextArea
          value={editingTitle}
          onChange={(ev) => setEditingTitle(ev.target.value)}
          onBlur={(ev) => onChangeTitle(ev.target.value)}
          autoSize
        />
      </div>
      <TriggerExecution />
      <ActionContext.Provider value={{ visible: editingConfig, setVisible: setEditingConfig }}>
        <SchemaComponent
          schema={{
            type: 'void',
            properties: {
              config: {
                type: 'void',
                'x-content': detailText,
                'x-component': Button,
                'x-component-props': {
                  type: 'link',
                  className: 'workflow-node-config-button',
                },
              },
              drawer: {
                type: 'void',
                title: titleText,
                'x-component': 'Action.Drawer',
                'x-decorator': 'Form',
                'x-decorator-props': {
                  disabled: workflow.executed,
                  useValues(options) {
                    return useRequest(
                      () =>
                        Promise.resolve({
                          data: config,
                        }),
                      options,
                    );
                  },
                },
                properties: {
                  ...(executed
                    ? {
                        alert: {
                          'x-component': Alert,
                          'x-component-props': {
                            type: 'warning',
                            showIcon: true,
                            message: `{{t("Trigger in executed workflow cannot be modified", { ns: "${NAMESPACE}" })}}`,
                            className: css`
                              width: 100%;
                              font-size: 85%;
                              margin-bottom: 2em;
                            `,
                          },
                        },
                      }
                    : {}),
                  fieldset: {
                    type: 'void',
                    'x-component': 'fieldset',
                    'x-component-props': {
                      className: css`
                        .ant-select:not(.full-width) {
                          width: auto;
                          min-width: 6em;
                        }
                      `,
                    },
                    properties: fieldset,
                  },
                  actions: {
                    ...(executed
                      ? {}
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
                                useAction: useUpdateConfigAction,
                              },
                            },
                          },
                        }),
                  },
                },
              },
            },
          }}
          scope={scope}
          components={components}
        />
      </ActionContext.Provider>
    </div>
  );
};

export function useTrigger() {
  const { workflow } = useFlowContext();
  return triggers.get(workflow.type);
}
