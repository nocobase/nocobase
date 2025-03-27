import { createForm } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  FormItem,
  Plugin,
  SchemaComponent,
  useApp,
  useRequest,
  Variable,
  VariableEvaluateProvider,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { createJSONTemplateParser } from '@nocobase/json-template-parser';
import PluginVariableFiltersClient from '@nocobase/plugin-variable-helpers/client';
import { dayjs } from '@nocobase/utils/client';
import { Form } from 'antd';
import React, { useEffect, useState } from 'react';

const scope = [
  { label: 'v1', value: 'v1' },
  { label: 'v2', value: 'v2', example: 'example-value-v2' },
];

const Demo = () => {
  const app = useApp();
  const [value, setValue] = useState('{{v1}}');
  const [value2, setValue2] = useState('{{v2}}');
  const tmplateData = { v1: 'value-v1' };

  return (
    <div>
      <VariableEvaluateProvider data={tmplateData} context={{}}>
        <Form.Item label="变量 v1" extra={`鼠标在变量上悬浮即可显示变量值`}>
          <Variable.Input scope={scope} value={value} onChange={setValue}></Variable.Input>
        </Form.Item>
        <Form.Item label="变量 v2" extra={`鼠标在变量上悬浮即可显示变量值`}>
          <Variable.Input scope={scope} value={value2} onChange={setValue2}></Variable.Input>
        </Form.Item>
      </VariableEvaluateProvider>
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
