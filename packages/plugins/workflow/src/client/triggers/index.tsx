import { css, cx } from "@emotion/css";
import { ISchema, useForm } from "@formily/react";
import { Registry } from "@nocobase/utils/client";
import { message, Tag } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

import { SchemaComponent, useActionContext, useAPIClient, useCompile, useResourceActionContext } from '@nocobase/client';

import { nodeCardClass, nodeMetaClass } from "../style";
import { useFlowContext } from "../WorkflowCanvas";
import collection from './collection';
import schedule from "./schedule/";


function useUpdateConfigAction() {
  const { t } = useTranslation();
  const form = useForm();
  const api = useAPIClient();
  const { workflow } = useFlowContext();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  return {
    async run() {
      if (workflow.executed) {
        message.error(t('Trigger in executed workflow cannot be modified'));
        return;
      }
      await form.submit();
      await api.resource('workflows').update({
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

export const TriggerConfig = () => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { data } = useResourceActionContext();
  if (!data) {
    return null;
  }
  const { type, config, executed } = data.data;
  const { title, fieldset, scope, components } = triggers.get(type);
  const detailText = executed ? '{{t("View")}}' : '{{t("Configure")}}';
  const titleText = `${t('Trigger')}: ${compile(title)}`;

  return (
    <div className={cx(nodeCardClass)}>
      <div className={cx(nodeMetaClass)}>
        <Tag color="gold">{t('Trigger')}</Tag>
      </div>
      <h4>{compile(title)}</h4>
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
                initialValue: { config }
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
