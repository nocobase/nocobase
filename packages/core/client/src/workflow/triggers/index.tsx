import React from "react";
import { ISchema, useForm } from "@formily/react";
import { cx } from "@emotion/css";
import { Registry } from "@nocobase/utils";

import { SchemaComponent, useActionContext, useAPIClient, useCompile, useRecord, useRequest, useResourceActionContext } from '../../';
import collection from './collection';
import { nodeCardClass, nodeMetaClass } from "../style";
import { useTranslation } from "react-i18next";
import { Tag } from "antd";


function useUpdateConfigAction() {
  const form = useForm();
  const api = useAPIClient();
  const record = useRecord();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  return {
    async run() {
      await form.submit();
      await api.resource('workflows', record.id).update({
        filterByTk: record.id,
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

export const TriggerConfig = () => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { data } = useResourceActionContext();
  if (!data) {
    return null;
  }
  const { type, config } = data.data;
  const { title, fieldset, scope, components } = triggers.get(type);
  return (
    <div className={cx(nodeCardClass)}>
      <div className={cx(nodeMetaClass)}>
        <Tag color="gold">{t('Trigger')}</Tag>
      </div>
      <h4>{compile(title)}</h4>
      <SchemaComponent
        schema={{
          type: 'void',
          title: '{{t("Configure")}}',
          'x-component': 'Action.Link',
          name: 'drawer',
          properties: {
            drawer: {
              type: 'void',
              title: '{{t("Configure")}}',
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
                  'x-component-props': {},
                  properties: fieldset
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
