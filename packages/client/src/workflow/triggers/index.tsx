import React from "react";
import { ISchema, useForm } from "@formily/react";
import { cx } from "@emotion/css";
import { Registry } from "@nocobase/utils";

import { SchemaComponent, useActionContext, useAPIClient, useRecord, useResourceActionContext } from '../../';
import model from './model';
import { nodeCardClass } from "../style";


function useUpdateConfigAction() {
  const form = useForm();
  const api = useAPIClient();
  const record = useRecord();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  return {
    async run() {
      await api.resource('workflows', record.id).update({
        filterByTk: record.id,
        values: {
          config: {
            ...record.config,
            ...form.values
          }
        },
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

triggers.register('model', model);

export const TriggerConfig = () => {
  const { data } = useResourceActionContext();
  if (!data) {
    return null;
  }
  const { type, config } = data.data;
  const { title, fieldset, scope } = triggers.get(type);
  return (
    <div className={cx(nodeCardClass)}>
      <h4>{title}</h4>
      <SchemaComponent
        schema={{
          type: 'void',
          title: '触发器配置',
          'x-component': 'Action.Link',
          name: 'drawer',
          properties: {
            drawer: {
              type: 'void',
              title: '触发器配置',
              'x-component': 'Action.Drawer',
              'x-decorator': 'Form',
              'x-decorator-props': {
                initialValue: config
              },
              properties: {
                ...fieldset,
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
      />
    </div>
  );
}
