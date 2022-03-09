import React from "react";
import { useForm } from "@formily/react";
import { useActionContext, useAPIClient, useRecord, useResourceActionContext } from '../../';
import { SchemaComponent } from "../../schema-component";
import * as model from './model';


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


const triggerTypes = {
  model
};

export const TriggerConfig = () => {
  const { type, config } = useRecord();
  const { properties, scope } = triggerTypes[type];
  return (
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
              ...properties,
              actions: {
                type: 'void',
                'x-component': 'Action.Drawer.Footer',
                properties: {
                  cancel: {
                    title: 'Cancel',
                    'x-component': 'Action',
                    'x-component-props': {
                      useAction: '{{ cm.useCancelAction }}',
                    },
                  },
                  submit: {
                    title: 'Submit',
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
  );
}
