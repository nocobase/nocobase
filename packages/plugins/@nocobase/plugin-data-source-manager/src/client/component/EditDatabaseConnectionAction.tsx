import { uid } from '@formily/shared';
import {
  ActionContext,
  SchemaComponent,
  useCompile,
  usePlugin,
  useRecord,
  useActionContext,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import _ from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useField } from '@formily/react';
import PluginDatabaseConnectionsClient from '../';
import { NAMESPACE } from '../locale';

export const EditDatabaseConnectionAction = () => {
  const record = useRecord();
  const [schema, setSchema] = useState({});
  const plugin = usePlugin(PluginDatabaseConnectionsClient);
  const compile = useCompile();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  const useUpdateAction = () => {
    const field = useField();
    const form = useForm();
    const ctx = useActionContext();
    const { refresh } = useResourceActionContext();
    const { resource } = useResourceContext();
    const { name: filterByTk } = useRecord();
    return {
      async run() {
        await form.submit();
        field.data = field.data || {};
        field.data.loading = true;
        try {
          await resource.update({ filterByTk, values: form.values });
          ctx.setVisible(false);
          await form.reset();
          refresh();
        } catch (e) {
          console.log(e);
        } finally {
          field.data.loading = false;
        }
      },
    };
  };
  return (
    <div>
      <ActionContext.Provider value={{ visible, setVisible }}>
        <a
          onClick={() => {
            setVisible(true);
            const databaseType = plugin.databaseTypes.get(record.type);
            setSchema({
              type: 'object',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'Form',
                  'x-decorator-props': {
                    initialValue: {
                      ...record,
                      options: { ...record },
                    },
                  },
                  title: compile("{{t('Edit')}}") + ' - ' + compile(record.displayName),
                  properties: {
                    body: {
                      type: 'void',
                      'x-component': databaseType.DataSourceSettingsForm,
                    },
                    footer: {
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
                        testConnectiion: {
                          title: `{{ t("Test Connection",{ ns: "${NAMESPACE}" }) }}`,
                          'x-component': 'Action',
                          'x-component-props': {
                            useAction: '{{ useTestConnectionAction }}',
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
            });
          }}
        >
          {t('Edit')}
        </a>
        <SchemaComponent scope={{ createOnly: true, useUpdateAction }} schema={schema} />
      </ActionContext.Provider>
    </div>
  );
};
