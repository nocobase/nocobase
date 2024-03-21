/**
 * defaultShowCode: true
 */
import React, { FC, useState } from 'react';
import { Application, SchemaSettings, SchemaSettingsItem, useDesignable } from '@nocobase/client';
import { appOptions } from './schema-settings-common';
import { observer, useField } from '@formily/react';
import { Button, Input, Space } from 'antd';

const MarkdownEdit = () => {
  const field = useField();
  return (
    <SchemaSettingsItem
      title="Edit markdown"
      onClick={() => {
        field.editable = true;
      }}
    />
  );
};

const mySettings = new SchemaSettings({
  name: 'mySettings',
  items: [
    {
      name: 'markdown',
      Component: MarkdownEdit,
    },
  ],
});

const Hello: FC<{ content?: string }> = observer((props) => {
  const field = useField();
  const { content } = props;
  const [inputVal, setInputVal] = useState(content);
  const { patch } = useDesignable();
  return field.editable ? (
    <Space>
      <Input placeholder="input value" value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
      <Space>
        <Button
          onClick={() => {
            field.editable = false;
            setInputVal(content);
          }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={() => {
            field.editable = false;
            patch({
              'x-component-props': {
                content: inputVal,
              },
            });
          }}
        >
          Submit
        </Button>
      </Space>
    </Space>
  ) : (
    <h1>{content}</h1>
  );
});

const app = new Application({
  ...appOptions,
  schemaSettings: [mySettings],
});

app.addComponents({ Hello });

export default app.getRootComponent();
