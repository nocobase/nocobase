/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * title: Markdown.Void
 */
import { FormItem } from '@formily/antd-v5';
import { observer, useField } from '@formily/react';
import { Markdown, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    markdown: {
      type: 'void',
      title: `Read pretty`,
      'x-decorator': 'Editable',
      'x-component': 'Markdown.Void',
      'x-editable': false,
      'x-component-props': {
        content: '# Markdown content',
      },
    },
  },
};

const Editable = observer(
  (props: any) => {
    const filed = useField<any>();
    if (filed.editable) {
      return props.children;
    }
    return (
      <div>
        <Button
          onClick={() => {
            filed.editable = true;
          }}
        >
          编辑
        </Button>
        <div>{props.children}</div>
      </div>
    );
  },
  { displayName: 'Editable' },
);

export default () => {
  return (
    <SchemaComponentProvider components={{ Editable, Markdown, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
