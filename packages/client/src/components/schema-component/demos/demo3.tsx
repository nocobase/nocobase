import React, { useMemo } from 'react';
import { SchemaComponentProvider, SchemaComponent } from '@nocobase/client';
import { Drawer as AntdDrawer, Button } from 'antd';
import { createForm } from '@formily/core';
import { RecursionField } from '@formily/react';

const Drawer = (props) => {
  const { footer, ...others } = props;
  return <AntdDrawer {...others} footer={<RecursionField schema={footer} onlyRenderProperties />} />;
};

export default function App() {
  const form = useMemo(() => createForm(), []);
  const showDrawer = () => {
    form.query('d1').take((field) => {
      field.componentProps.visible = true;
    });
  };
  const onClose = () => {
    form.query('d1').take((field) => {
      field.componentProps.visible = false;
    });
  };
  const schema = {
    type: 'object',
    properties: {
      b1: {
        type: 'void',
        'x-component': 'Button',
        'x-component-props': {
          children: 'Open',
          type: 'primary',
          onClick: '{{showDrawer}}',
        },
      },
      d1: {
        type: 'void',
        'x-component': 'Drawer',
        'x-component-props': {
          title: 'Basic Drawer',
          onClose: '{{onClose}}',
          footer: {
            type: 'object',
            properties: {
              fb1: {
                type: 'void',
                'x-component': 'Button',
                'x-component-props': {
                  children: 'Close',
                  onClick: '{{onClose}}',
                },
              },
            },
          },
        },
      },
    },
  };
  return (
    <SchemaComponentProvider form={form} components={{ Drawer, Button }} scope={{ showDrawer, onClose }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
