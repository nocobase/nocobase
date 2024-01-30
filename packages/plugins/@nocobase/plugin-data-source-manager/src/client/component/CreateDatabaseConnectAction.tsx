import { PlusOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { ActionContext, SchemaComponent, useCompile, usePlugin } from '@nocobase/client';
import { Button, Dropdown } from 'antd';
import _ from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PluginDatabaseConnectionsClient from '../';
import { NAMESPACE } from '../locale';
import { useTestConnectionAction } from '../hooks';

export const CreateDatabaseConnectAction = () => {
  const [schema, setSchema] = useState({});
  const plugin = usePlugin(PluginDatabaseConnectionsClient);
  const compile = useCompile();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const [dialect, setDialect] = useState(null);
  const useDialectDataSource = (field) => {
    const options = [...plugin.types.keys()].map((key) => {
      const type = plugin.types.get(key);
      return {
        value: type.name,
        label: compile(type.label),
      };
    });
    field.dataSource = options;
  };
  return (
    <div>
      <ActionContext.Provider value={{ visible, setVisible }}>
        <Dropdown
          menu={{
            onClick(info) {
              const type = plugin.types.get(info.key);
              setDialect(info.key);
              setVisible(true);
              setSchema({
                type: 'object',
                properties: {
                  [uid()]: {
                    type: 'void',
                    'x-component': 'Action.Drawer',
                    'x-decorator': 'Form',
                    'x-decorator-props': {
                      initialValue: {
                        type: info.key,
                      },
                    },
                    title: compile("{{t('Add new')}}") + ' - ' + compile(type.label),
                    properties: {
                      body: {
                        type: 'void',
                        'x-component': type.DataSourceSettingsForm,
                      },
                      footer: {
                        type: 'void',
                        'x-component': 'Action.Drawer.Footer',
                        properties: {
                          testConnectiion: {
                            title: `{{ t("Test Connection",{ ns: "${NAMESPACE}" }) }}`,
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ useTestConnectionAction }}',
                            },
                          },
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
                              useAction: '{{ cm.useCreateAction }}',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              });
            },
            items: [...plugin.types.keys()].map((key) => {
              const type = plugin.types.get(key);
              return {
                key: key,
                label: compile(type?.label),
              };
            }),
          }}
        >
          <Button type={'primary'} icon={<PlusOutlined />}>
            {t('Add new')}
          </Button>
        </Dropdown>
        <SchemaComponent
          scope={{ createOnly: false, useTestConnectionAction, dialect, useDialectDataSource }}
          schema={schema}
        />
      </ActionContext.Provider>
    </div>
  );
};
