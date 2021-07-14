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
import { SchemaRenderer, useDesignable } from '../DesignableSchemaField';
import get from 'lodash/get';
import { Dropdown, Menu } from 'antd';
import {
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useMouseEvents } from 'beautiful-react-hooks';
import cls from 'classnames';

import './style.less';
import { clone } from '@formily/shared';

function Blank() {
  return null;
}

function useDesignableBar() {
  const schema = useFieldSchema();
  const options = useContext(SchemaOptionsContext);
  const DesignableBar = get(options.components, schema['x-designable-bar']);

  return {
    DesignableBar: DesignableBar || Blank,
  };
}

function useDefaultValues() {
  return {};
}

export const Form: any = observer((props: any) => {
  const scope = useContext(SchemaExpressionScopeContext);
  const { useValues = useDefaultValues } = props;
  const values = useValues();
  const form = useMemo(() => {
    console.log('Form.useMemo', values);
    return createForm({
      values,
      // values: clone(values),
    });
  }, [values]);
  const schema = useFieldSchema();
  const { schema: designableSchema, refresh } = useDesignable();
  const formSchema: ISchema = schema['x-decorator'] === 'Form' ? {
    type: 'void',
    "x-component": 'Blank',
    properties: {
      [schema.name]: {
        ...schema.toJSON(),
        "x-decorator": 'Form.Decorator',
      }
    }
  } : {
    ...schema.toJSON(),
    'x-component': 'Form.Blank',
    'x-component-props': {},
  };
  return (
    <SchemaRenderer
      scope={scope}
      // components={options.components}
      onRefresh={(subSchema: Schema) => {
        designableSchema.properties = subSchema.properties;
        refresh();
      }}
      form={form}
      schema={formSchema}
      onlyRenderProperties
    />
  );
});

Form.Decorator = ({children}) => children;

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
