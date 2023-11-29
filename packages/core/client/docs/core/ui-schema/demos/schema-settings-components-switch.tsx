/**
 * defaultShowCode: true
 */
import React, { FC } from 'react';
import { Application, SchemaSettings, SchemaSettingsSwitchItem, useDesignable } from '@nocobase/client';
import { appOptions } from './schema-settings-common';
import { observer, useField } from '@formily/react';
import { Form, Input } from 'antd';

const FormItemRequired = () => {
  const { patch } = useDesignable();
  const filed = useField();
  return (
    <SchemaSettingsSwitchItem
      title={'Required - 组件方式'}
      checked={!!filed.componentProps?.required}
      onChange={(v) => {
        patch({
          'x-component-props': {
            required: v,
          },
        });
      }}
    />
  );
};

const mySettings = new SchemaSettings({
  name: 'mySettings',
  items: [
    {
      name: 'required',
      Component: FormItemRequired,
    },
    {
      name: 'required2',
      type: 'switch',
      useComponentProps() {
        const { patch } = useDesignable();
        const filed = useField();
        return {
          title: 'Required - type 方式',
          checked: !!filed.componentProps?.required,
          onChange(v) {
            patch({
              'x-component-props': {
                required: v,
              },
            });
          },
        };
      },
    },
  ],
});

const Hello: FC<{ required: boolean }> = observer((props) => {
  return (
    <Form>
      <Form.Item name="note" label="Note" rules={[{ required: props.required }]}>
        <Input />
      </Form.Item>
    </Form>
  );
});

const app = new Application({
  ...appOptions,
  schemaSettings: [mySettings],
});

app.addComponents({ Hello });

export default app.getRootComponent();
