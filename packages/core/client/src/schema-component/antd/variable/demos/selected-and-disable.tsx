import { createForm } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import { AntdSchemaComponentProvider, FormItem, Plugin, SchemaComponent, Variable } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { createJSONTemplateParser } from '@nocobase/json-template-parser';
import PluginVariableFiltersClient from '@nocobase/plugin-variable-helpers/client';
import { dayjs } from '@nocobase/utils/client';
import { Form } from 'antd';
import React, { useEffect, useState } from 'react';

const parser = createJSONTemplateParser();
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 30, 60, 90];
const scope = [
  {
    label: 'Date',
    value: '$nDate',
    children: [{ label: 'now', value: 'now', helpers: ['date.*'], disabled: true }],
  },
];

const schema = {
  type: 'object',
  'x-component': 'FormV2',
  'x-use-component-props': 'useFormBlockProps',
  properties: {
    input: {
      type: 'string',
      title: `输入项`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
        value: '{{ $nDate.now }}',
        test: '{{ $nDate.now }}',
      },
    },
  },
};

const Demo = () => {
  const [value, setValue] = useState('{{$nDate.now}}');
  const [value2, setValue2] = useState('{{$nDate.now | date_format: "YYYY-MM-DD"}}');
  return (
    <div>
      <Form.Item label="单变量">
        <Variable.Input scope={scope} value={value} onChange={setValue}></Variable.Input>
      </Form.Item>
      <Form.Item label="单变量 + helper">
        <Variable.Input scope={scope} value={value2} onChange={setValue2}></Variable.Input>
      </Form.Item>
    </div>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({ plugins: [DemoPlugin, PluginVariableFiltersClient] });

export default app.getRootComponent();
