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
} from '@formily/react';
import { useSchemaPath, SchemaField, useDesignable } from '../';
import get from 'lodash/get';
import { Dropdown, Menu } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { FormLayout } from '@formily/antd';
import './style.less';

export const Form: any = observer((props: any) => {
  const { useValues = () => ({}), ...others } = props;
  const initialValues = useValues();
  const form = useMemo(() => {
    console.log('Form.useMemo', initialValues);
    return createForm({ initialValues });
  }, []);
  const { schema } = useDesignable();
  const path = useSchemaPath();
  const scope = useContext(SchemaExpressionScopeContext);
  return (
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
    </FormProvider>
  );
});

Form.__Decorator = ({ children }) => children;

Form.DesignableBar = (props) => {
  const { active } = props;
  return (
    <div className={cls('designable-bar', { active })}>
      <div className={'designable-bar-actions'}>
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item>表单配置</Menu.Item>
            </Menu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </div>
    </div>
  );
};
