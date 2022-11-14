import { css, cx } from "@emotion/css";
import { ISchema, useForm } from "@formily/react";
import { Registry } from "@nocobase/utils/client";
import { message, Tag } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";
import { InfoOutlined } from '@ant-design/icons';

import { SchemaComponent, useActionContext, useAPIClient, useCompile, useRequest, useResourceActionContext } from '@nocobase/client';

import { nodeCardClass, nodeHeaderClass, nodeMetaClass, nodeTitleClass } from "../style";
import { useFlowContext } from "../FlowContext";
import collection from './collection';
import schedule from "./schedule/";
import { lang, NAMESPACE } from "../locale";


function useUpdateConfigAction() {
  const { t } = useTranslation();
  const form = useForm();
  const api = useAPIClient();
  const { workflow } = useFlowContext() ?? {};
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  return {
    async run() {
      if (workflow.executed) {
        message.error(t('Trigger in executed workflow cannot be modified'));
        return;
      }
      await form.submit();
      await api.resource('workflows').update?.({
        filterByTk: workflow.id,
        values: form.values
      });
      ctx.setVisible(false);
      refresh();
    },
  };
};

export interface Trigger {
  title: string;
  type: string;
  // group: string;
  options?: { label: string; value: any; key: string }[];
  fieldset: { [key: string]: ISchema };
  view?: ISchema;
  scope?: { [key: string]: any };
  components?: { [key: string]: any };
  render?(props): React.ReactElement;
  getter?(node: any): React.ReactElement;
};

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
        properties: {
          trigger: {
            type: 'void',
            'x-component': 'Action',
            'x-component-props': {
              title: <InfoOutlined />,
              shape: 'circle',
              className: 'workflow-node-job-button',
              type: 'primary'
            },
            properties: {
              [execution.id]: {
                type: 'void',
                'x-decorator': 'Form',
                'x-decorator-props': {
                  initialValue: execution
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
                      showTime: true
                    },
                    'x-read-pretty': true,
                  },
                  context: {
                    type: 'object',
                    title: `{{t("Trigger context", { ns: "${NAMESPACE}" })}}`,
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

export const TriggerConfig = () => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { workflow } = useFlowContext();
  if (!workflow || !workflow.type) {
    return null;
  }
  const { type, config, executed } = workflow;
  const { title, fieldset, scope, components } = triggers.get(type);
  const detailText = executed ? '{{t("View")}}' : '{{t("Configure")}}';
  const titleText = `${lang('Trigger')}: ${compile(title)}`;

  return (
    <div className={cx(nodeCardClass)}>
      <div className={cx(nodeHeaderClass)}>
        <div className={cx(nodeMetaClass)}>
          <Tag color="gold">{lang('Trigger')}</Tag>
        </div>
        <h4>{compile(title)}</h4>
        <TriggerExecution />
      </div>
      <SchemaComponent
        schema={{
          type: 'void',
          title: detailText,
          'x-component': 'Action.Link',
          name: 'drawer',
          properties: {
            drawer: {
              type: 'void',
              title: titleText,
              'x-component': 'Action.Drawer',
              'x-decorator': 'Form',
              'x-decorator-props': {
                useValues(options) {
                  return useRequest(() => Promise.resolve({
                    data: { config },
                  }), options);
                },
              },
              properties: {
                config: {
                  type: 'void',
                  name: 'config',
                  'x-component': 'fieldset',
                  'x-component-props': {
                    className: css`
                      .ant-select{
                        width: auto;
                        min-width: 6em;
                      }
                    `
                  },
                  properties: fieldset
                },
                actions: {
                  type: 'void',
                  'x-component': 'Action.Drawer.Footer',
                  properties: executed
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
                        useAction: useUpdateConfigAction
                      }
                    }
                  }
                }
              }
            }
          }
        }}
        scope={scope}
        components={components}
      />
    </div>
  );
}
