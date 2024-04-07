import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { ActionContext, SchemaComponent, useCompile, usePlugin, useRecord } from '@nocobase/client';
import { Button, Card, Dropdown } from 'antd';
import _ from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FileManagerPlugin from '.';
import { StorageOptions } from './StorageOptions';
import { storageSchema } from './schemas/storage';

export const CreateStorage = () => {
  const [schema, setSchema] = useState({});
  const plugin = usePlugin(FileManagerPlugin);
  const compile = useCompile();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <div>
      <ActionContext.Provider value={{ visible, setVisible }}>
        <Dropdown
          menu={{
            onClick(info) {
              const storageType = plugin.storageTypes.get(info.key);
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
                        type: storageType.name,
                      },
                    },
                    title: compile("{{t('Add new')}}") + ' - ' + compile(storageType.title),
                    properties: {
                      ..._.cloneDeep(storageType.properties),
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
            items: [...plugin.storageTypes.values()].map((storageType) => {
              return {
                key: storageType.name,
                label: compile(storageType.title),
              };
            }),
          }}
        >
          <Button type={'primary'} icon={<PlusOutlined />}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
        <SchemaComponent scope={{ createOnly: true }} schema={schema} />
      </ActionContext.Provider>
    </div>
  );
};

export const EditStorage = () => {
  const record = useRecord();
  const [schema, setSchema] = useState({});
  const plugin = usePlugin(FileManagerPlugin);
  const compile = useCompile();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <div>
      <ActionContext.Provider value={{ visible, setVisible }}>
        <a
          onClick={() => {
            setVisible(true);
            const storageType = plugin.storageTypes.get(record.type);
            if (storageType.properties['default']) {
              storageType.properties['default']['x-reactions'] = (field) => {
                if (field.initialValue) {
                  field.disabled = true;
                } else {
                  field.disabled = false;
                }
              };
            }
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
                    },
                  },
                  title: compile("{{t('Edit')}}") + ' - ' + compile(storageType.title),
                  properties: {
                    ..._.cloneDeep(storageType.properties),
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
                        submit: {
                          title: '{{t("Submit")}}',
                          'x-component': 'Action',
                          'x-component-props': {
                            type: 'primary',
                            useAction: '{{ cm.useUpdateAction }}',
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
        <SchemaComponent scope={{ createOnly: false }} schema={schema} />
      </ActionContext.Provider>
    </div>
  );
};

export const FileStoragePane = () => {
  const { t } = useTranslation();
  const compile = useCompile();
  const plugin = usePlugin(FileManagerPlugin);
  const storageTypes = [...plugin.storageTypes.values()].map((storageType) => {
    return {
      value: storageType.name,
      label: compile(storageType.title),
    };
  });
  const xStyleProcessDesc = (
    <div>
      {t('See more')}{' '}
      <a target="_blank" href="https://help.aliyun.com/zh/oss/user-guide/resize-images-4" rel="noreferrer">
        x-oss-process
      </a>
    </div>
  );
  return (
    <Card bordered={false}>
      <SchemaComponent
        components={{ StorageOptions, CreateStorage, EditStorage }}
        scope={{ useNewId: (prefix) => `${prefix}${uid()}`, storageTypes, xStyleProcessDesc }}
        schema={storageSchema}
      />
    </Card>
  );
};
