import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd-v5';
import { ISchema, useField, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, MenuProps } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContextProvider, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import { useCancelAction } from '../action-hooks';
import { useCollectionManager_deprecated } from '../hooks';
import * as components from './components';
import { TemplateSummary } from './components/TemplateSummary';

const getSchema = (schema, category, compile): ISchema => {
  if (!schema) {
    return;
  }

  const properties = cloneDeep(schema.configurableProperties) as any;

  if (schema.hasDefaultValue === true) {
    properties['defaultValue'] = cloneDeep(schema.default.uiSchema);
    properties['defaultValue']['title'] = compile('{{ t("Default value") }}');
    properties['defaultValue']['x-decorator'] = 'FormItem';
  }
  const initialValue: any = {
    name: `t_${uid()}`,
    template: schema.name,
    view: schema.name === 'view',
    category,
    ...cloneDeep(schema.default),
  };
  if (initialValue.reverseField) {
    initialValue.reverseField.name = `f_${uid()}`;
  }
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-component-props': {
          getContainer: '{{ getContainer }}',
        },
        'x-decorator': 'Form',
        'x-decorator-props': {
          useValues(options) {
            return useRequest(
              () =>
                Promise.resolve({
                  data: initialValue,
                }),
              options,
            );
          },
        },
        title: '{{ t("Create collection") }}',
        properties: {
          summary: {
            type: 'void',
            'x-component': 'TemplateSummay',
            'x-component-props': {
              schemaKey: schema.name,
            },
          },
          // @ts-ignore
          ...properties,
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              action1: {
                title: '{{ t("Cancel") }}',
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ useCancelAction }}',
                },
              },
              action2: {
                title: '{{ t("Submit") }}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: () => useCreateCollection(schema),
                },
              },
            },
          },
        },
      },
    },
  };
};

const useCreateCollection = (schema?: any) => {
  const form = useForm();
  const { refreshCM } = useCollectionManager_deprecated();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const field = useField();
  return {
    async run() {
      field.data = field.data || {};
      field.data.loading = true;
      try {
        await form.submit();
        const values = cloneDeep(form.values);
        if (schema?.events?.beforeSubmit) {
          schema.events.beforeSubmit(values);
        }
        if (!values.autoCreateReverseField) {
          delete values.reverseField;
        }
        delete values.autoCreateReverseField;
        await resource.create({
          values: {
            logging: true,
            ...values,
          },
        });
        ctx.setVisible(false);
        await form.reset();
        field.data.loading = false;
        refresh();
        await refreshCM();
      } catch (error) {
        field.data.loading = false;
      }
    },
  };
};

export const AddCollection = (props) => {
  const recordData = useRecord();
  return <AddCollectionAction item={recordData} {...props} />;
};

export const AddCollectionAction = (props) => {
  const { scope, getContainer, item: record, children, trigger, align } = props;
  const { getTemplate, templates: collectionTemplates } = useCollectionManager_deprecated();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const compile = useCompile();
  const { t } = useTranslation();
  const items = useMemo(() => {
    const result = [];
    collectionTemplates.forEach((item) => {
      if (item.divider) {
        result.push({
          type: 'divider',
        });
      }
      result.push({
        label: compile(item.title),
        key: item.name,
      });
    });
    return result;
  }, [collectionTemplates]);
  const {
    state: { category },
  } = useResourceActionContext();
  const menu = useMemo<MenuProps>(() => {
    return {
      style: {
        maxHeight: '60vh',
        overflow: 'auto',
      },
      onClick: (info) => {
        const schema = getSchema(getTemplate(info.key), category, compile);
        setSchema(schema);
        setVisible(true);
      },
      items,
    };
  }, [category, items]);

  return (
    <RecordProvider record={record}>
      <ActionContextProvider value={{ visible, setVisible }}>
        <Dropdown getPopupContainer={getContainer} trigger={trigger} align={align} menu={menu}>
          {children || (
            <Button icon={<PlusOutlined />} type={'primary'}>
              {t('Create collection')} <DownOutlined />
            </Button>
          )}
        </Dropdown>
        <SchemaComponent
          schema={schema}
          components={{ ...components, ArrayTable, TemplateSummay: TemplateSummary }}
          scope={{
            getContainer,
            useCancelAction,
            createOnly: true,
            useCreateCollection,
            record,
            showReverseFieldConfig: true,
            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
