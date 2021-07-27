import React, { useContext, useMemo, useRef, useState } from 'react';
import { createForm } from '@formily/core';
import {
  SchemaOptionsContext,
  Schema,
  useFieldSchema,
  observer,
  SchemaExpressionScopeContext,
  FormProvider,
  ISchema,
  useField,
  useForm,
  RecursionField,
} from '@formily/react';
import {
  useSchemaPath,
  SchemaField,
  useDesignable,
  removeSchema,
  useCollectionContext,
  useResourceContext,
  ResourceContextProvider,
} from '../';
import get from 'lodash/get';
import { Button, Dropdown, Menu, message, Space } from 'antd';
import { MenuOutlined, DragOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { FormLayout } from '@formily/antd';
import './style.less';
import AddNew from '../add-new';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { isGridRowOrCol } from '../grid';
import constate from 'constate';
import { useEffect } from 'react';
import { uid } from '@formily/shared';
import { getSchemaPath } from '../../components/schema-renderer';
import { DesignableBar } from './DesignableBar';
import { FieldDesignableBar } from './Field.DesignableBar';
import { createContext } from 'react';
import { BlockItem } from '../block-item';
import { Resource } from '../../resource';
import { useMap } from 'ahooks';

const [DisplayFieldsContextProvider, useDisplayFieldsContext] = constate(() => {
  const [displayFields, { set, remove, get }] = useMap([]);

  return {
    displayFields,
    hasDisplayField(fieldName) {
      return !!get(fieldName);
    },
    addDisplayField(fieldName, schema) {
      set(fieldName, schema);
    },
    getDisplayField(fieldName) {
      return get(fieldName);
    },
    removeDisplayField(fieldName) {
      remove(fieldName);
    },
  };
});

export { DisplayFieldsContextProvider, useDisplayFieldsContext };

export const Form: any = observer((props: any) => {
  const {
    useValues = () => ({}),
    showDefaultButtons = false,
    resourceName,
    ...others
  } = props;
  const { schema } = useDesignable();
  const initialValues = useValues();
  const form = useMemo(() => {
    console.log('Form.useMemo', initialValues);
    return createForm({ 
      initialValues, 
      readPretty: schema['x-read-pretty'],
    });
  }, []);
  const path = useSchemaPath();
  const scope = useContext(SchemaExpressionScopeContext);
  const content = (
    <FormProvider form={form}>
      {schema['x-decorator'] === 'Form' ? (
        <SchemaField
          scope={scope}
          schema={{
            type: 'object',
            properties: {
              [schema.name]: {
                ...schema.toJSON(),
                'x-path': path,
                // 避免死循环
                'x-decorator': 'Form.__Decorator',
              },
            },
          }}
        />
      ) : (
        <FormLayout layout={'vertical'} {...others}>
          <SchemaField
            scope={scope}
            schema={{
              type: 'object',
              properties: schema.properties,
            }}
          />
        </FormLayout>
      )}
      {showDefaultButtons && (
        <Space style={{ marginTop: 24 }}>
          <Button
            onClick={async () => {
              const values = await form.submit();
              console.log({ values });
              await Resource.make(resourceName).save(values);
              message.success('保存成功');
              await form.reset();
            }}
            type={'primary'}
          >
            提交
          </Button>
          <Button
            onClick={async () => {
              await form.reset();
            }}
          >
            重置
          </Button>
        </Space>
      )}
    </FormProvider>
  );
  return resourceName ? (
    // @ts-ignore
    <ResourceContextProvider resourceName={resourceName}>
      <DisplayFieldsContextProvider>{content}</DisplayFieldsContextProvider>
    </ResourceContextProvider>
  ) : (
    <DisplayFieldsContextProvider>{content}</DisplayFieldsContextProvider>
  );
});

export const FormFieldUIDContext = createContext(null);

Form.Field = observer((props: any) => {
  const { fieldName } = props;
  const { schema } = useDesignable();
  const path = getSchemaPath(schema);
  console.log('getSchemaPath', path);
  const { addDisplayField } = useDisplayFieldsContext();
  const { resource = {} } = useResourceContext();
  useEffect(() => {
    if (fieldName) {
      addDisplayField && addDisplayField(fieldName, schema);
    }
  }, [fieldName, schema]);
  if (!fieldName) {
    return null;
  }
  const field = resource?.fields?.find((item) => item.name === fieldName);
  if (!field) {
    return null;
  }
  const name = useContext(FormFieldUIDContext);
  const title = schema['title'] || field.uiSchema['title'];
  return (
    <RecursionField
      name={name}
      schema={
        new Schema({
          'x-path': path,
          type: 'void',
          properties: {
            [field.name]: {
              ...field.uiSchema,
              title,
              'x-decorator': 'FormilyFormItem',
            },
          },
        })
      }
    />
  );
});

Form.Field.Item = observer((props) => {
  const name = uid();
  return (
    <FormFieldUIDContext.Provider value={name}>
      <BlockItem>{props.children}</BlockItem>
    </FormFieldUIDContext.Provider>
  );
});

Form.__Decorator = ({ children }) => children;
Form.DesignableBar = DesignableBar;
Form.Field.DesignableBar = FieldDesignableBar;
