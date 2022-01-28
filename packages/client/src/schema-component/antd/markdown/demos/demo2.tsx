/**
 * title: Markdown
 */
import { FormItem } from '@formily/antd';
import { observer, useField } from '@formily/react';
import { Markdown, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    MarkdownVoid: {
      type: 'string',
      title: `Read pretty`,
      'x-decorator': 'Editable',
      'x-component': 'Markdown.Void',
      'x-component-props': {
        content: '# Markdown content',
      },
    },
  },
};

const Editable = observer((props: any) => {
  const filed = useField<any>();
  return (
    <div>
      {!filed.editable && (
        <Button
          onClick={() => {
            filed.editable = true;
          }}
        >
          编辑
        </Button>
      )}
      <div>{props.children}</div>
    </div>
  );
});

export default () => {
  return (
    <SchemaComponentProvider components={{ Editable, Markdown, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
