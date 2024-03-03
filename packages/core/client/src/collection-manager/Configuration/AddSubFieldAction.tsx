import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd-v5';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, MenuProps } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../api-client';
import { useCollectionRecordData } from '../../data-source';
import { RecordProvider } from '../../record-provider';
import { ActionContextProvider, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useCollectionManager_deprecated } from '../hooks';
import { IField } from '../interfaces/types';
import * as components from './components';
import { useFieldInterfaceOptions } from './interfaces';

const getSchema = (schema: IField): ISchema => {
  if (!schema) {
    return;
  }
  const properties = cloneDeep(schema.properties) as any;
  const initialValue = {
    name: `f_${uid()}`,
    ...cloneDeep(schema.default),
    interface: schema.name,
  };
  // initialValue.uiSchema.title = schema.title;
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
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
        title: '{{ t("Add field") }}',
        properties: {
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
                  useAction: '{{ cm.useCancelAction }}',
                },
              },
              action2: {
                title: '{{ t("Submit") }}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: '{{ ds.useCreateAction }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

const useCreateSubField = () => {
  const ctx = useActionContext();
  return {
    async run() {
      // const options = form?.values?.uiSchema?.enum?.slice() || [];
      // form.setValuesIn(
      //   'uiSchema.enum',
      //   options.map((option) => {
      //     return {
      //       value: uid(),
      //       ...option,
      //     };
      //   }),
      // );
      // await run();
      // await refreshCM();
    },
  };
};

export const AddSubFieldAction = () => {
  const { getInterface } = useCollectionManager_deprecated();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const compile = useCompile();
  const options = useFieldInterfaceOptions();
  const { t } = useTranslation();
  const items = useMemo(() => {
    return options.map((option) => {
      const children = option.children.map((child) => {
        return { label: compile(child.title), key: child.name };
      });
      return {
        label: compile(option.label),
        key: option.key,
        children,
      };
    });
  }, [options]);
  const menu = useMemo<MenuProps>(() => {
    return {
      style: {
        maxHeight: '60vh',
        overflow: 'auto',
      },
      onClick: (info) => {
        const schema = getSchema(getInterface(info.key));
        setSchema(schema);
        setVisible(true);
      },
      items,
    };
  }, [items]);
  const recordData = useCollectionRecordData();

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Dropdown menu={menu}>
        <Button icon={<PlusOutlined />} type={'primary'}>
          {t('Add field')}
        </Button>
      </Dropdown>
      <RecordProvider record={{}} parent={recordData}>
        <SchemaComponent
          schema={schema}
          components={{ ...components, ArrayTable }}
          scope={{ createOnly: true, useCreateSubField }}
        />
      </RecordProvider>
    </ActionContextProvider>
  );
};
