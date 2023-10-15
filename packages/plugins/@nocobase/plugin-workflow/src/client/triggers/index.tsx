import { InfoOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
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
  useResourceActionContext,
} from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';
import { Alert, Button, Input, Tag, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useFlowContext } from '../FlowContext';
import { DrawerDescription } from '../components/DrawerDescription';
import { NAMESPACE, lang } from '../locale';
import useStyles from '../style';
import { VariableOptions } from '../variable';
import collection from './collection';
import formTrigger from './form';
import schedule from './schedule/';

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
  description?: string;
  // group: string;
  useVariables?(config: any, options?): VariableOptions;
  fieldset: { [key: string]: ISchema };
  view?: ISchema;
  scope?: { [key: string]: any };
  components?: { [key: string]: any };
  useInitializers?(config): SchemaInitializerItemOptions | null;
  initializers?: any;
}

export const triggers = new Registry<Trigger>();

triggers.register(formTrigger.type, formTrigger);
triggers.register(collection.type, collection);
triggers.register(schedule.type, schedule);

function TriggerExecution() {
  const compile = useCompile();
  const { workflow, execution } = useFlowContext();
  const { styles } = useStyles();

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
          size: 'small',
          className: styles.nodeJobButtonClass,
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
              <div className={cx(styles.nodeTitleClass)}>
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
  const { styles } = useStyles();
  let typeTitle = '';
  useEffect(() => {
    if (workflow) {
      setEditingTitle(workflow.title ?? typeTitle);
    }
  }, [workflow]);

  const form = useMemo(
    () =>
      createForm({
        initialValues: workflow?.config,
        values: workflow?.config,
        disabled: workflow?.executed,
      }),
    [workflow],
  );

  if (!workflow || !workflow.type) {
    return null;
  }
  const { title, type, executed } = workflow;
  const trigger = triggers.get(type);
  const { fieldset, scope, components } = trigger;
  typeTitle = trigger.title;
  const detailText = executed ? '{{t("View")}}' : '{{t("Configure")}}';
  const titleText = lang('Trigger');

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
      if ((Array.from(el.classList ?? []) as string[]).some((name: string) => whiteSet.has(name))) {
        setEditingConfig(true);
        ev.stopPropagation();
        return;
      }
    }
  }

  return (
    <div className={cx(styles.nodeCardClass)} onClick={onOpenDrawer}>
      <div className={cx(styles.nodeMetaClass, 'workflow-node-meta')}>
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
      <ActionContextProvider value={{ visible: editingConfig, setVisible: setEditingConfig }}>
        <SchemaComponent
          schema={{
            name: `workflow-trigger-${workflow.id}`,
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
                'x-decorator': 'FormV2',
                'x-decorator-props': {
                  form,
                },
                properties: {
                  ...(trigger.description
                    ? {
                        description: {
                          type: 'void',
                          'x-component': DrawerDescription,
                          'x-component-props': {
                            label: lang('Trigger type'),
                            title: trigger.title,
                            description: trigger.description,
                          },
                        },
                      }
                    : {}),
                  fieldset: {
                    type: 'void',
                    'x-component': 'fieldset',
                    'x-component-props': {
                      className: css`
                        .ant-select.auto-width {
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
      </ActionContextProvider>
    </div>
  );
};

export function useTrigger() {
  const { workflow } = useFlowContext();
  return triggers.get(workflow.type);
}

export function getTriggersOptions() {
  return Array.from(triggers.getEntities()).map(([value, { title }]) => ({
    value,
    label: title,
    color: 'gold',
  }));
}
