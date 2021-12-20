import React, { useMemo, useState } from 'react';
import { createForm } from '@formily/core';
import { createSchemaField } from '@formily/react';
import { Form, FormItem, Input, Select } from '@formily/antd';
import { Button, Drawer } from 'antd';
import 'antd/dist/antd.css';

const SchemaField = createSchemaField({
  components: {
    Input,
    FormItem,
    Select,
    Button,
    Drawer,
  },
});

export default () => {
  const form = useMemo(() => createForm(), []);
  return (
    <Form form={form} layout="vertical">
      <SchemaField
        schema={{
          type: 'object',
          properties: {
            b1: {
              type: 'void',
              'x-component': 'Button',
              'x-component-props': {
                children: 'Open',
                type: 'primary',
                onClick() {
                  form.query('d1').take((field) => {
                    field.componentProps.visible = true;
                    console.log(field);
                  });
                },
              },
            },
            aa: {
              type: 'string',
              title: 'AA',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: 'Input',
              },
            },
            d1: {
              type: 'void',
              'x-component': 'Drawer',
              'x-component-props': {
                title: 'Basic Drawer',
              },
            },
          },
        }}
      />
    </Form>
  );
};
